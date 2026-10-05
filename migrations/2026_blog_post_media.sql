-- Apply after 2026_blog_related_selections.sql. Keep the existing save logic intact.
BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_post_media (
  blog_post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE RESTRICT,
  display_order integer NOT NULL CHECK (display_order >= 0),
  PRIMARY KEY (blog_post_id, media_id),
  UNIQUE (blog_post_id, display_order)
);
CREATE INDEX IF NOT EXISTS blog_post_media_media_id_idx ON public.blog_post_media(media_id);

ALTER TABLE public.blog_post_media ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.blog_post_media FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blog_post_media TO service_role;

-- Cover first, then known media URLs in content in first-occurrence order.
-- This does not inspect external media or emit post bodies/URLs to logs.
-- Run only on first install: replay must not restore associations explicitly cleared later.
DO $$
BEGIN
  IF to_regprocedure('public.save_blog_post_with_tags_base(jsonb,jsonb,uuid,timestamptz)') IS NULL THEN
    INSERT INTO public.blog_post_media (blog_post_id, media_id, display_order)
    SELECT id, cover_image_id, 0
    FROM public.blog_posts
    WHERE cover_image_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    WITH matches AS (
      SELECT p.id AS blog_post_id, m.id AS media_id,
        LEAST(
          COALESCE(NULLIF(strpos(p.content, NULLIF(m.secure_url, '')), 0), 2147483647),
          COALESCE(NULLIF(strpos(p.content, NULLIF(m.url, '')), 0), 2147483647)
        ) AS position
      FROM public.blog_posts p
      JOIN public.media m ON p.content IS NOT NULL
        AND ((m.secure_url <> '' AND strpos(p.content, m.secure_url) > 0)
          OR (m.url <> '' AND strpos(p.content, m.url) > 0))
      WHERE m.id IS DISTINCT FROM p.cover_image_id
    ), ranked AS (
      SELECT blog_post_id, media_id,
        row_number() OVER (PARTITION BY blog_post_id ORDER BY position, media_id)::integer
          + CASE WHEN p.cover_image_id IS NULL THEN -1 ELSE 0 END AS display_order
      FROM matches
      JOIN public.blog_posts p ON p.id = matches.blog_post_id
    )
    INSERT INTO public.blog_post_media (blog_post_id, media_id, display_order)
    SELECT blog_post_id, media_id, display_order FROM ranked
    ON CONFLICT DO NOTHING;

    -- On reapplication the renamed base already exists; never rename the wrapper.
    ALTER FUNCTION public.save_blog_post_with_tags(jsonb, jsonb, uuid, timestamptz)
      RENAME TO save_blog_post_with_tags_base;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.save_blog_post_with_tags_base(jsonb, jsonb, uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_blog_post_with_tags_base(jsonb, jsonb, uuid, timestamptz)
  TO service_role;

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
  image_ids uuid[];
  result jsonb;
  saved_id uuid;
BEGIN
  IF p_post ? 'image_ids' THEN
    IF jsonb_typeof(p_post->'image_ids') <> 'array' THEN
      RAISE EXCEPTION 'BLOG_MEDIA_INVALID: expected an array';
    END IF;
    IF jsonb_array_length(p_post->'image_ids') > 20 THEN
      RAISE EXCEPTION 'BLOG_MEDIA_INVALID: choose up to 20 images';
    END IF;
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_post->'image_ids') AS item(value)
      WHERE jsonb_typeof(value) <> 'string'
    ) THEN
      RAISE EXCEPTION 'BLOG_MEDIA_INVALID: expected UUID strings';
    END IF;
    BEGIN
      image_ids := ARRAY(
        SELECT value::uuid
        FROM jsonb_array_elements_text(p_post->'image_ids') WITH ORDINALITY AS item(value, position)
        ORDER BY position
      );
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'BLOG_MEDIA_INVALID: expected UUID strings';
    END;
    IF (SELECT count(DISTINCT id) FROM unnest(image_ids) AS ids(id)) <> cardinality(image_ids) THEN
      RAISE EXCEPTION 'BLOG_MEDIA_INVALID: duplicate image';
    END IF;
    -- Hold the referenced keys until commit so concurrent media deletion cannot race.
    IF (SELECT count(*) FROM (
      SELECT id FROM public.media WHERE id = ANY(image_ids) ORDER BY id FOR KEY SHARE
    ) AS locked_media) <> cardinality(image_ids) THEN
      RAISE EXCEPTION 'BLOG_MEDIA_INVALID: image not found';
    END IF;
  END IF;

  result := public.save_blog_post_with_tags_base(p_post, p_tags, p_id, p_expected_updated_at);
  saved_id := (result->'post'->>'id')::uuid;

  IF image_ids IS NOT NULL THEN
    DELETE FROM public.blog_post_media WHERE blog_post_id = saved_id;
    INSERT INTO public.blog_post_media (blog_post_id, media_id, display_order)
    SELECT saved_id, id, position::integer - 1
    FROM unnest(image_ids) WITH ORDINALITY AS chosen(id, position);
  ELSIF p_id IS NULL THEN
    -- Older create callers do not send image_ids; at least retain their cover.
    INSERT INTO public.blog_post_media (blog_post_id, media_id, display_order)
    SELECT saved_id, cover_image_id, 0 FROM public.blog_posts
    WHERE id = saved_id AND cover_image_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_blog_post_with_tags(jsonb, jsonb, uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_blog_post_with_tags(jsonb, jsonb, uuid, timestamptz)
  TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
