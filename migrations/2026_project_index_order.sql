-- Apply after 2026_project_admin_atomic_save.sql and 2026_project_featured_order.sql.
-- Collection order is independent of the existing Home-featured display_order.
BEGIN;

ALTER TABLE public.projects ADD COLUMN index_order bigint;
CREATE SEQUENCE public.project_index_order_seq;
ALTER SEQUENCE public.project_index_order_seq OWNED BY public.projects.index_order;

-- Preserve today's newest-first collection order for all existing projects.
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at DESC NULLS LAST, id) AS position
  FROM public.projects
)
UPDATE public.projects AS project
SET index_order = ranked.position
FROM ranked WHERE project.id = ranked.id;

-- A new project always precedes the saved collection, even after a manual reorder.
ALTER TABLE public.projects ALTER COLUMN index_order SET DEFAULT -nextval('public.project_index_order_seq'::regclass);
ALTER TABLE public.projects ALTER COLUMN index_order SET NOT NULL;
CREATE INDEX projects_index_order_idx ON public.projects (index_order, id) WHERE status = 'published';
REVOKE ALL ON SEQUENCE public.project_index_order_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SEQUENCE public.project_index_order_seq TO service_role;

CREATE FUNCTION public.set_project_index_order(p_ids uuid[], p_expected jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  total integer;
BEGIN
  IF p_ids IS NULL OR cardinality(p_ids) > 10000
     OR array_position(p_ids, NULL) IS NOT NULL
     OR (SELECT count(DISTINCT id) FROM unnest(p_ids) AS ids(id)) <> cardinality(p_ids)
     OR jsonb_typeof(p_expected) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_expected) > 10000 THEN
    RAISE EXCEPTION 'PROJECT_INDEX_INVALID';
  END IF;

  -- Serialize against saves, deletes and inserts before validating the whole snapshot.
  LOCK TABLE public.projects IN SHARE ROW EXCLUSIVE MODE;
  SELECT count(*) INTO total FROM public.projects;
  IF total <> jsonb_array_length(p_expected) OR EXISTS (
    SELECT 1 FROM public.projects AS project
    LEFT JOIN jsonb_to_recordset(p_expected) AS expected(id uuid, updated_at timestamptz)
      ON expected.id = project.id
    WHERE project.updated_at IS DISTINCT FROM expected.updated_at
  ) OR (SELECT count(DISTINCT id) FROM jsonb_to_recordset(p_expected) AS expected(id uuid)) <> total THEN
    RAISE EXCEPTION 'PROJECT_INDEX_CONFLICT';
  END IF;

  IF cardinality(p_ids) <> (SELECT count(*) FROM public.projects WHERE status = 'published')
     OR EXISTS (
       SELECT 1 FROM unnest(p_ids) AS chosen(id)
       LEFT JOIN public.projects AS project ON project.id = chosen.id
       WHERE project.status IS DISTINCT FROM 'published'
     ) THEN
    RAISE EXCEPTION 'PROJECT_INDEX_INVALID';
  END IF;

  UPDATE public.projects AS project
  SET index_order = chosen.position
  FROM unnest(p_ids) WITH ORDINALITY AS chosen(id, position)
  WHERE project.id = chosen.id AND project.index_order IS DISTINCT FROM chosen.position;

  RETURN jsonb_build_object('ordered_count', cardinality(p_ids));
END;
$$;

REVOKE ALL ON FUNCTION public.set_project_index_order(uuid[], jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_project_index_order(uuid[], jsonb) TO service_role;

COMMIT;
