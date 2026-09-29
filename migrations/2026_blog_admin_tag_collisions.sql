-- Apply after 2026_blog_admin_atomic_save.sql. Replace only the Blog RPC;
-- shared tags must never be renamed to satisfy a Blog slug collision.
BEGIN;

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
  tag_item jsonb;
  tag_name text;
  tag_slug text;
  base_tag_slug text;
  tag_attempt integer;
  saved_tag_id uuid;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO public.blog_posts (
      title,
      slug,
      summary,
      content,
      status,
      cover_image_url,
      cover_image_id,
      canonical_url,
      published_at,
      reading_time_minutes
    ) VALUES (
      p_post->>'title',
      p_post->>'slug',
      p_post->>'summary',
      p_post->>'content',
      p_post->>'status',
      p_post->>'cover_image_url',
      NULLIF(p_post->>'cover_image_id', '')::uuid,
      p_post->>'canonical_url',
      CASE
        WHEN p_post->>'status' = 'published'
          THEN COALESCE(NULLIF(p_post->>'published_at', '')::timestamptz, now())
        ELSE NULLIF(p_post->>'published_at', '')::timestamptz
      END,
      (p_post->>'reading_time_minutes')::integer
    )
    RETURNING * INTO saved_post;
  ELSE
    IF p_expected_updated_at IS NULL THEN
      RAISE EXCEPTION 'BLOG_POST_CONFLICT: expected updated_at is required';
    END IF;

    SELECT slug INTO previous_slug
    FROM public.blog_posts
    WHERE id = p_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'BLOG_POST_NOT_FOUND';
    END IF;

    UPDATE public.blog_posts
    SET title = p_post->>'title',
        slug = p_post->>'slug',
        summary = p_post->>'summary',
        content = p_post->>'content',
        status = p_post->>'status',
        cover_image_url = p_post->>'cover_image_url',
        cover_image_id = NULLIF(p_post->>'cover_image_id', '')::uuid,
        canonical_url = p_post->>'canonical_url',
        published_at = CASE
          WHEN p_post->>'status' = 'published'
            THEN COALESCE(
              NULLIF(p_post->>'published_at', '')::timestamptz,
              public.blog_posts.published_at,
              now()
            )
          ELSE NULLIF(p_post->>'published_at', '')::timestamptz
        END,
        reading_time_minutes = (p_post->>'reading_time_minutes')::integer,
        updated_at = now()
    WHERE id = p_id
      AND updated_at = p_expected_updated_at
    RETURNING * INTO saved_post;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'BLOG_POST_CONFLICT: post has changed';
    END IF;
  END IF;

  DELETE FROM public.blog_post_tags
  WHERE blog_post_id = saved_post.id;

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
        -- A conflicting insert may have committed while we waited; retry by name.
        SELECT id INTO saved_tag_id FROM public.tags WHERE name = tag_name;
        IF saved_tag_id IS NOT NULL THEN EXIT; END IF;
        tag_attempt := tag_attempt + 1;
      END LOOP;
    END IF;

    INSERT INTO public.blog_post_tags (blog_post_id, tag_id)
    VALUES (saved_post.id, saved_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object(
    'post', to_jsonb(saved_post),
    'old_slug', previous_slug
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_blog_post_with_tags(jsonb, jsonb, uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_blog_post_with_tags(jsonb, jsonb, uuid, timestamptz)
  TO service_role;

COMMIT;
