-- Apply on a restore-tested clone after the Blog admin migrations. Review and
-- resolve any existing duplicate featured rows before creating the index.
BEGIN;

CREATE UNIQUE INDEX blog_posts_one_featured_idx
  ON public.blog_posts (featured) WHERE featured = true;

CREATE OR REPLACE FUNCTION public.set_featured_blog_post(p_id uuid, p_featured boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  selected public.blog_posts%ROWTYPE;
  previous_slugs text[] := ARRAY[]::text[];
BEGIN
  IF p_id IS NULL OR p_featured IS NULL THEN
    RAISE EXCEPTION 'BLOG_FEATURED_INVALID';
  END IF;

  -- Serialize selection with all Blog writes; a failed request rolls back both updates.
  LOCK TABLE public.blog_posts IN SHARE ROW EXCLUSIVE MODE;
  SELECT * INTO selected FROM public.blog_posts WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BLOG_FEATURED_NOT_FOUND';
  END IF;
  IF p_featured AND (selected.status IS DISTINCT FROM 'published' OR selected.published_at IS NULL
      OR selected.published_at > now()) THEN
    RAISE EXCEPTION 'BLOG_FEATURED_INVALID';
  END IF;

  IF p_featured THEN
    SELECT COALESCE(array_agg(slug), ARRAY[]::text[]) INTO previous_slugs
    FROM public.blog_posts WHERE featured = true AND id <> p_id;
    UPDATE public.blog_posts SET featured = false WHERE featured = true AND id <> p_id;
  END IF;
  IF selected.featured IS DISTINCT FROM p_featured THEN
    UPDATE public.blog_posts SET featured = p_featured WHERE id = p_id
    RETURNING * INTO selected;
  END IF;

  RETURN jsonb_build_object(
    'post', jsonb_build_object('id', selected.id, 'title', selected.title,
      'slug', selected.slug, 'featured', selected.featured),
    'previous_slugs', previous_slugs
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_featured_blog_post(uuid, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_featured_blog_post(uuid, boolean)
  TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
