-- Public project lifecycle, separate from draft/published/archived visibility.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_stage text;

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_project_stage_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_project_stage_check
  CHECK (project_stage IN ('in_progress', 'completed'));
