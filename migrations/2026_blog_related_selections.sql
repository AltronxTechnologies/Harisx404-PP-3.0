-- Curated related Blog posts; existing articles start with no selections.
BEGIN;

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS related_blog_post_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.blog_posts'::regclass
      AND conname = 'blog_posts_related_blog_post_ids_valid'
  ) THEN
    ALTER TABLE public.blog_posts
      ADD CONSTRAINT blog_posts_related_blog_post_ids_valid CHECK (
        cardinality(related_blog_post_ids) <= 3
        AND array_position(related_blog_post_ids, NULL) IS NULL
        AND NOT (id = ANY(related_blog_post_ids))
        AND (cardinality(related_blog_post_ids) < 2 OR related_blog_post_ids[1] <> related_blog_post_ids[2])
        AND (cardinality(related_blog_post_ids) < 3 OR (
          related_blog_post_ids[1] <> related_blog_post_ids[3]
          AND related_blog_post_ids[2] <> related_blog_post_ids[3]
        ))
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.unlink_deleted_related_blog_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET related_blog_post_ids = array_remove(related_blog_post_ids, OLD.id),
      updated_at = now()
  WHERE OLD.id = ANY(related_blog_post_ids);
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.unlink_deleted_related_blog_post() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS blog_posts_unlink_related_after_delete ON public.blog_posts;
CREATE TRIGGER blog_posts_unlink_related_after_delete
AFTER DELETE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.unlink_deleted_related_blog_post();

-- Keep the signature and all existing slug-history, optimistic-lock and tag behavior.
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
  related_ids uuid[];
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

  IF p_post ? 'related_blog_post_ids' THEN
    IF jsonb_typeof(p_post->'related_blog_post_ids') <> 'array' THEN
      RAISE EXCEPTION 'BLOG_RELATED_INVALID: expected an array';
    END IF;
    IF jsonb_array_length(p_post->'related_blog_post_ids') > 3 THEN
      RAISE EXCEPTION 'BLOG_RELATED_INVALID: choose up to three posts';
    END IF;
    BEGIN
      related_ids := ARRAY(
        SELECT value::uuid
        FROM jsonb_array_elements_text(p_post->'related_blog_post_ids') WITH ORDINALITY AS item(value, position)
        ORDER BY position
      );
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'BLOG_RELATED_INVALID: expected UUIDs';
    END;
    IF array_position(related_ids, NULL) IS NOT NULL
       OR (SELECT count(DISTINCT choice) FROM unnest(related_ids) AS choice) <> cardinality(related_ids)
       OR (p_id IS NOT NULL AND p_id = ANY(related_ids)) THEN
      RAISE EXCEPTION 'BLOG_RELATED_INVALID: duplicate, null or self link';
    END IF;
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.blog_posts (
      title, slug, summary, content, status, cover_image_url, cover_image_id,
      canonical_url, published_at, reading_time_minutes, editor_mode, related_blog_post_ids
    ) VALUES (
      p_post->>'title', new_slug, p_post->>'summary', p_post->>'content',
      p_post->>'status', p_post->>'cover_image_url',
      NULLIF(p_post->>'cover_image_id', '')::uuid, p_post->>'canonical_url',
      CASE WHEN p_post->>'status' = 'published'
        THEN COALESCE(NULLIF(p_post->>'published_at', '')::timestamptz, now())
        ELSE NULLIF(p_post->>'published_at', '')::timestamptz END,
      (p_post->>'reading_time_minutes')::integer, 'rich', COALESCE(related_ids, '{}'::uuid[])
    ) RETURNING * INTO saved_post;
  ELSE
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
        related_blog_post_ids = COALESCE(related_ids, public.blog_posts.related_blog_post_ids),
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

  -- Lock chosen rows until commit so a concurrent unpublish cannot race this check.
  IF related_ids IS NOT NULL AND (
    SELECT count(*) FROM (
      SELECT id FROM public.blog_posts
      WHERE id = ANY(related_ids) AND status = 'published'
        AND published_at IS NOT NULL AND published_at <= now()
      FOR SHARE
    ) AS live_posts
  ) <> cardinality(related_ids) THEN
    RAISE EXCEPTION 'BLOG_RELATED_INVALID: choose only live published posts';
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

COMMIT;

NOTIFY pgrst, 'reload schema';
