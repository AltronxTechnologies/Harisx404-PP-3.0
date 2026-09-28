-- An image can convey different information in different project case studies.
ALTER TABLE public.project_images
  ADD COLUMN IF NOT EXISTS alt_text text;
