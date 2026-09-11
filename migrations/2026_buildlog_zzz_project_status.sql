BEGIN;

DO $$
DECLARE
  status_column_was_missing boolean;
BEGIN
  SELECT NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'buildlog_projects'
      AND column_name = 'project_status'
  ) INTO status_column_was_missing;

  ALTER TABLE public.buildlog_projects
    ADD COLUMN IF NOT EXISTS project_status TEXT NOT NULL DEFAULT 'in_progress';

  IF status_column_was_missing THEN
    UPDATE public.buildlog_projects
    SET project_status = 'live'
    WHERE lower(name) = lower('This Website');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.buildlog_items_all_done(value JSONB)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    bool_and(jsonb_typeof(item) = 'object' AND item->>'done' = 'true'),
    FALSE
  )
  FROM jsonb_array_elements(value) AS item;
$$;

ALTER TABLE public.buildlog_projects
  DROP CONSTRAINT IF EXISTS buildlog_project_status;

ALTER TABLE public.buildlog_projects
  ADD CONSTRAINT buildlog_project_status CHECK (
    project_status IN ('in_progress', 'live', 'completed') AND
    (
      project_status <> 'completed' OR
      public.buildlog_items_all_done(items)
    )
  );

DROP VIEW IF EXISTS public.public_buildlog_projects;
CREATE VIEW public.public_buildlog_projects
WITH (security_barrier = true)
AS
SELECT
  id, name, tagline, info, current_version, github_url, live_url,
  project_status, display_order, items
FROM public.buildlog_projects
WHERE status = 'published'
ORDER BY display_order ASC, created_at DESC;

REVOKE ALL ON TABLE public.public_buildlog_projects FROM PUBLIC;
GRANT SELECT ON TABLE public.public_buildlog_projects TO anon, authenticated;

COMMIT;
