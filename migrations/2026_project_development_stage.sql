-- Development stage is separate from draft/published/archived visibility.
-- Existing projects retain their Built and Latest update facts.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_stage text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS expected_completion_label text;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_project_stage_valid;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_project_stage_valid CHECK (
    project_stage IN ('planning', 'initializing', 'in_progress', 'testing', 'on_hold', 'completed')
  );
