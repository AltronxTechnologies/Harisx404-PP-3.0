-- Apply after 2026_project_admin_atomic_save.sql. The one-argument RPC remains unchanged.
BEGIN;

CREATE OR REPLACE FUNCTION public.delete_project_and_unlink_related(
  p_id uuid,
  p_expected_updated_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  deleted_slug text;
  current_updated_at timestamptz;
  referring_project record;
  referring_slugs text[] := ARRAY[]::text[];
BEGIN
  SELECT slug, updated_at INTO deleted_slug, current_updated_at
  FROM public.projects WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROJECT_NOT_FOUND';
  END IF;
  IF p_expected_updated_at IS NULL OR current_updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'PROJECT_CONFLICT: project has changed';
  END IF;

  FOR referring_project IN
    SELECT id, slug FROM public.projects
    WHERE p_id = ANY(related_project_ids)
    ORDER BY id FOR UPDATE
  LOOP
    UPDATE public.projects SET related_project_ids = array_remove(related_project_ids, p_id)
    WHERE id = referring_project.id;
    referring_slugs := array_append(referring_slugs, referring_project.slug);
  END LOOP;

  DELETE FROM public.projects WHERE id = p_id;
  RETURN jsonb_build_object('slug', deleted_slug, 'referring_slugs', referring_slugs);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_project_and_unlink_related(uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_project_and_unlink_related(uuid, timestamptz)
  TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
