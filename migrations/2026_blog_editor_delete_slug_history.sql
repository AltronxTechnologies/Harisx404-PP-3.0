-- Apply after 2026_blog_admin_tag_collisions.sql (and 2026_redesign.sql for article_views).
BEGIN;

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS editor_mode text NOT NULL DEFAULT 'source';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.blog_posts'::regclass
      AND conname = 'blog_posts_editor_mode_check'
  ) THEN
    ALTER TABLE public.blog_posts
      ADD CONSTRAINT blog_posts_editor_mode_check
      CHECK (editor_mode IN ('source', 'rich'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.blog_slug_history (
  slug text PRIMARY KEY,
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS blog_slug_history_post_id_idx
  ON public.blog_slug_history (post_id);

ALTER TABLE public.blog_slug_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.blog_slug_history FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.blog_slug_history TO anon, authenticated;
GRANT ALL ON public.blog_slug_history TO service_role;

-- Every row here was once a publicly used name; retain it even after unpublishing/deletion.
DROP POLICY IF EXISTS "Public can view blog slug history" ON public.blog_slug_history;
CREATE POLICY "Public can view blog slug history"
  ON public.blog_slug_history FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.blog_slug_history (slug, post_id)
SELECT slug, id FROM public.blog_posts
WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= now()
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.save_blog_post_with_tags(
  p_post jsonb,
  p_tags jsonb,
  p_id uuid DEFAULT NULL,
  p_expected_updated_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  saved_post public.blog_posts%ROWTYPE;
  previous_slug text;
  locked_slug text;
  previous_live boolean;
  new_slug text := p_post->>'slug';
  reserved_post_id uuid;
  reserved boolean;
  tag_item jsonb;
  tag_name text;
  tag_slug text;
  base_tag_slug text;
  tag_attempt integer;
  saved_tag_id uuid;
BEGIN
  IF p_id IS NOT NULL THEN
    IF p_expected_updated_at IS NULL THEN
      RAISE EXCEPTION 'BLOG_POST_CONFLICT: expected updated_at is required';
    END IF;

    SELECT slug INTO previous_slug FROM public.blog_posts WHERE id = p_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'BLOG_POST_NOT_FOUND';
    END IF;
    locked_slug := previous_slug;
  END IF;

  -- Lock both names in a stable order before checking history or moving a live slug.
  -- The second lock also serializes inserts against a concurrent rename to this name.
  IF previous_slug IS NOT NULL AND new_slug IS NOT NULL AND previous_slug <> new_slug THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('blog-slug:' || LEAST(previous_slug, new_slug), 0));
    PERFORM pg_advisory_xact_lock(hashtextextended('blog-slug:' || GREATEST(previous_slug, new_slug), 0));
  ELSIF COALESCE(previous_slug, new_slug) IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('blog-slug:' || COALESCE(previous_slug, new_slug), 0));
  END IF;

  SELECT post_id, true INTO reserved_post_id, reserved
  FROM public.blog_slug_history WHERE slug = new_slug;
  IF reserved AND (p_id IS NULL OR reserved_post_id IS DISTINCT FROM p_id) THEN
    RAISE EXCEPTION 'BLOG_SLUG_RESERVED: slug has been published before';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.blog_posts (
      title, slug, summary, content, status, cover_image_url, cover_image_id,
      canonical_url, published_at, reading_time_minutes, editor_mode
    ) VALUES (
      p_post->>'title', new_slug, p_post->>'summary', p_post->>'content',
      p_post->>'status', p_post->>'cover_image_url',
      NULLIF(p_post->>'cover_image_id', '')::uuid, p_post->>'canonical_url',
      CASE WHEN p_post->>'status' = 'published'
        THEN COALESCE(NULLIF(p_post->>'published_at', '')::timestamptz, now())
        ELSE NULLIF(p_post->>'published_at', '')::timestamptz END,
      (p_post->>'reading_time_minutes')::integer, 'rich'
    ) RETURNING * INTO saved_post;
  ELSE
    -- Re-read under the row lock: a concurrent save may have renamed the post
    -- since the first lookup. Optimistic updates must not reserve its stale name.
    SELECT slug, status = 'published' AND published_at IS NOT NULL AND published_at <= now()
      INTO previous_slug, previous_live
    FROM public.blog_posts WHERE id = p_id AND updated_at = p_expected_updated_at
    FOR UPDATE;
    IF NOT FOUND OR previous_slug IS DISTINCT FROM locked_slug THEN
      RAISE EXCEPTION 'BLOG_POST_CONFLICT: post has changed';
    END IF;

    UPDATE public.blog_posts
    SET title = p_post->>'title', slug = new_slug,
        summary = p_post->>'summary', content = p_post->>'content',
        status = p_post->>'status', cover_image_url = p_post->>'cover_image_url',
        cover_image_id = NULLIF(p_post->>'cover_image_id', '')::uuid,
        canonical_url = p_post->>'canonical_url',
        published_at = CASE WHEN p_post->>'status' = 'published'
          THEN COALESCE(NULLIF(p_post->>'published_at', '')::timestamptz,
                        public.blog_posts.published_at, now())
          ELSE NULLIF(p_post->>'published_at', '')::timestamptz END,
        reading_time_minutes = (p_post->>'reading_time_minutes')::integer,
        updated_at = now()
    WHERE id = p_id AND updated_at = p_expected_updated_at
    RETURNING * INTO saved_post;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'BLOG_POST_CONFLICT: post has changed';
    END IF;

    IF previous_live THEN
      INSERT INTO public.blog_slug_history (slug, post_id)
      VALUES (previous_slug, p_id)
      ON CONFLICT (slug) DO UPDATE SET post_id = EXCLUDED.post_id
      WHERE public.blog_slug_history.post_id = EXCLUDED.post_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'BLOG_SLUG_RESERVED: old slug belongs to another post';
      END IF;
    END IF;
  END IF;

  IF saved_post.status = 'published' AND saved_post.published_at <= now() THEN
    INSERT INTO public.blog_slug_history (slug, post_id)
    VALUES (saved_post.slug, saved_post.id)
    ON CONFLICT (slug) DO UPDATE SET post_id = EXCLUDED.post_id
    WHERE public.blog_slug_history.post_id = EXCLUDED.post_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'BLOG_SLUG_RESERVED: slug belongs to another post';
    END IF;
  END IF;

  DELETE FROM public.blog_post_tags WHERE blog_post_id = saved_post.id;

  FOR tag_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_tags, '[]'::jsonb))
  LOOP
    tag_name := btrim(tag_item->>'name');
    base_tag_slug := btrim(tag_item->>'slug');
    IF tag_name = '' OR base_tag_slug = '' OR base_tag_slug !~ '^[[:alnum:]][[:alnum:]-]*$' THEN
      RAISE EXCEPTION 'Tag must contain a letter or number';
    END IF;

    SELECT id INTO saved_tag_id FROM public.tags WHERE name = tag_name;
    IF NOT FOUND THEN
      tag_attempt := 0;
      LOOP
        tag_slug := CASE tag_attempt
          WHEN 0 THEN base_tag_slug
          WHEN 1 THEN base_tag_slug || '-' || md5(tag_name)
          ELSE base_tag_slug || '-' || md5(tag_name) || '-' || tag_attempt::text
        END;
        INSERT INTO public.tags (name, slug) VALUES (tag_name, tag_slug)
        ON CONFLICT DO NOTHING RETURNING id INTO saved_tag_id;
        IF saved_tag_id IS NOT NULL THEN EXIT; END IF;
        SELECT id INTO saved_tag_id FROM public.tags WHERE name = tag_name;
        IF saved_tag_id IS NOT NULL THEN EXIT; END IF;
        tag_attempt := tag_attempt + 1;
      END LOOP;
    END IF;

    INSERT INTO public.blog_post_tags (blog_post_id, tag_id)
    VALUES (saved_post.id, saved_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object('post', to_jsonb(saved_post), 'old_slug', previous_slug);
END;
$$;

REVOKE ALL ON FUNCTION public.save_blog_post_with_tags(jsonb, jsonb, uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_blog_post_with_tags(jsonb, jsonb, uuid, timestamptz)
  TO service_role;

CREATE OR REPLACE FUNCTION public.transition_blog_post(
  p_id uuid, p_expected_updated_at timestamptz, p_action text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.blog_posts%ROWTYPE;
BEGIN
  IF p_action IS NULL OR p_action NOT IN ('archive', 'restore') THEN
    RAISE EXCEPTION 'BLOG_POST_INVALID_ACTION: expected archive or restore';
  END IF;

  SELECT * INTO target FROM public.blog_posts WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BLOG_POST_NOT_FOUND';
  END IF;
  IF p_expected_updated_at IS NULL OR target.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'BLOG_POST_CONFLICT: post has changed';
  END IF;
  IF (p_action = 'archive' AND NOT COALESCE(target.status IN ('draft', 'published'), false))
     OR (p_action = 'restore' AND target.status IS DISTINCT FROM 'archived') THEN
    RAISE EXCEPTION 'BLOG_POST_CONFLICT: invalid status transition';
  END IF;

  IF p_action = 'archive' AND target.status = 'published'
     AND target.published_at IS NOT NULL AND target.published_at <= clock_timestamp() THEN
    INSERT INTO public.blog_slug_history (slug, post_id)
    VALUES (target.slug, target.id)
    ON CONFLICT (slug) DO UPDATE SET post_id = EXCLUDED.post_id
    WHERE public.blog_slug_history.post_id = EXCLUDED.post_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'BLOG_SLUG_RESERVED: slug belongs to another post';
    END IF;
  END IF;

  UPDATE public.blog_posts
  SET status = CASE p_action WHEN 'archive' THEN 'archived' ELSE 'draft' END,
      updated_at = GREATEST(clock_timestamp(), target.updated_at + interval '1 microsecond')
  WHERE id = p_id
  RETURNING * INTO target;

  RETURN jsonb_build_object(
    'id', target.id, 'slug', target.slug,
    'status', target.status, 'updated_at', target.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.transition_blog_post(uuid, timestamptz, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_blog_post(uuid, timestamptz, text)
  TO service_role;

-- Do not add a foreign key: legacy article_views rows may be unrelated to Blog.
-- The row lock makes a concurrent delete wait, or makes this insert see its deletion.
CREATE OR REPLACE FUNCTION public.check_blog_article_view_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM 1 FROM public.blog_posts WHERE slug = NEW.slug FOR KEY SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ARTICLE_VIEW_POST_NOT_FOUND: %', NEW.slug USING ERRCODE = '23503';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.check_blog_article_view_insert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS check_blog_article_view_insert ON public.article_views;
CREATE TRIGGER check_blog_article_view_insert
BEFORE INSERT ON public.article_views
FOR EACH ROW EXECUTE FUNCTION public.check_blog_article_view_insert();

CREATE OR REPLACE FUNCTION public.delete_archived_blog_post(
  p_id uuid, p_expected_updated_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.blog_posts%ROWTYPE;
  aliases jsonb;
BEGIN
  SELECT * INTO target FROM public.blog_posts WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BLOG_POST_NOT_FOUND';
  END IF;
  IF target.status <> 'archived' OR p_expected_updated_at IS NULL
     OR target.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'BLOG_POST_CONFLICT: post must be archived and unchanged';
  END IF;

  SELECT COALESCE(jsonb_agg(slug ORDER BY slug), '[]'::jsonb) INTO aliases
  FROM public.blog_slug_history
  WHERE post_id = p_id AND slug <> target.slug;

  DELETE FROM public.article_views
  WHERE slug = target.slug OR slug IN (
    SELECT slug FROM public.blog_slug_history WHERE post_id = p_id
  );
  DELETE FROM public.blog_posts WHERE id = p_id;

  RETURN jsonb_build_object('deleted_slug', target.slug, 'aliases', aliases);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_archived_blog_post(uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_archived_blog_post(uuid, timestamptz)
  TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
