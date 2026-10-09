-- Apply after 2026_project_admin_atomic_save.sql on a restore-tested clone.
-- Keeps selection and numbered Home order in one transaction.
BEGIN;

CREATE OR REPLACE FUNCTION public.set_home_featured_projects(
  p_ids uuid[], p_expected jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  total integer;
BEGIN
  IF p_ids IS NULL OR cardinality(p_ids) > 10000
     OR (SELECT count(DISTINCT id) FROM unnest(p_ids) AS ids(id)) <> cardinality(p_ids)
     OR array_position(p_ids, NULL) IS NOT NULL
     OR jsonb_typeof(p_expected) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_expected) > 10000 THEN
    RAISE EXCEPTION 'FEATURED_PROJECT_INVALID';
  END IF;

  -- Block inserts as well as updates while checking the complete project snapshot.
  LOCK TABLE public.projects IN SHARE ROW EXCLUSIVE MODE;
  SELECT count(*) INTO total FROM public.projects;
  IF total <> jsonb_array_length(p_expected) OR EXISTS (
    SELECT 1 FROM public.projects AS project
    LEFT JOIN jsonb_to_recordset(p_expected) AS expected(id uuid, updated_at timestamptz)
      ON expected.id = project.id
    WHERE project.updated_at IS DISTINCT FROM expected.updated_at
  ) THEN
    RAISE EXCEPTION 'FEATURED_PROJECT_CONFLICT';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(p_ids) AS selected(id)
    LEFT JOIN public.projects AS project ON project.id = selected.id
    WHERE project.status IS DISTINCT FROM 'published'
  ) THEN
    RAISE EXCEPTION 'FEATURED_PROJECT_INVALID';
  END IF;

  UPDATE public.projects AS project
  SET featured = project.id = ANY(p_ids),
      display_order = CASE WHEN project.id = ANY(p_ids)
        THEN array_position(p_ids, project.id) ELSE project.display_order END
  WHERE project.featured IS DISTINCT FROM (project.id = ANY(p_ids))
     OR (project.id = ANY(p_ids)
         AND project.display_order IS DISTINCT FROM array_position(p_ids, project.id));

  RETURN jsonb_build_object('featured_count', cardinality(p_ids));
END;
$$;

REVOKE ALL ON FUNCTION public.set_home_featured_projects(uuid[], jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_home_featured_projects(uuid[], jsonb)
  TO service_role;

COMMIT;
