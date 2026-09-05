-- Atomic Blog admin writes. The application calls this only after verifying
-- the Supabase user and ADMIN_EMAIL, using the service-role client.

BEGIN;

UPDATE public.blog_posts
SET reading_time_minutes = GREATEST(
  1,
  CEIL(
    COALESCE(
      array_length(
        regexp_split_to_array(
          btrim(regexp_replace(COALESCE(content, ''), '<[^>]+>', ' ', 'g')),
          '\s+'
        ),
        1
      ),
      0
    ) / 200.0
  )::integer
)
WHERE reading_time_minutes IS NULL OR reading_time_minutes <= 0;

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
    tag_slug := btrim(tag_item->>'slug');
    IF tag_name = '' OR tag_slug = '' OR tag_slug !~ '^[[:alnum:]][[:alnum:]-]*$' THEN
      RAISE EXCEPTION 'Tag must contain a letter or number';
    END IF;

    SELECT tags.id INTO saved_tag_id
    FROM public.tags
    WHERE tags.slug = tag_slug;

    IF NOT FOUND THEN
      INSERT INTO public.tags (name, slug)
      VALUES (tag_name, tag_slug)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id INTO saved_tag_id;
    END IF;

    INSERT INTO public.blog_post_tags (blog_post_id, tag_id)
    VALUES (saved_post.id, saved_tag_id);
  END LOOP;

  RETURN jsonb_build_object(
    'post', to_jsonb(saved_post),
    'old_slug', previous_slug
  );
END;
$$;

DROP FUNCTION IF EXISTS public.save_blog_post_with_tags(jsonb, text[], uuid, timestamptz);

REVOKE ALL ON FUNCTION public.save_blog_post_with_tags(jsonb, jsonb, uuid, timestamptz)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_blog_post_with_tags(jsonb, jsonb, uuid, timestamptz)
  TO service_role;

COMMIT;
