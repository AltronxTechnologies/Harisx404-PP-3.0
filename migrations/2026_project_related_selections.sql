-- Curated, ordered related-project choices for each project detail page.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS related_project_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_related_project_ids_valid;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_related_project_ids_valid CHECK (
    cardinality(related_project_ids) <= 2
    AND array_position(related_project_ids, NULL) IS NULL
    AND NOT (id = ANY(related_project_ids))
    AND (cardinality(related_project_ids) < 2 OR related_project_ids[1] <> related_project_ids[2])
  );
