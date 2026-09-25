-- Optional, owner-authored case-study details. Safe to apply repeatedly.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS latest_update_label text,
  ADD COLUMN IF NOT EXISTS case_study_sections jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_case_study_sections_object;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_case_study_sections_object
  CHECK (jsonb_typeof(case_study_sections) = 'object');
