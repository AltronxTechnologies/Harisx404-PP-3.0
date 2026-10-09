-- Apply on a restore-tested clone after the base schema and project Admin migrations.
-- Anonymous reads can only see attachments belonging to published projects.
BEGIN;

ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.project_tags, public.project_images FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.project_tags, public.project_images TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_tags, public.project_images TO service_role;

DROP POLICY IF EXISTS "Public can view published project tags" ON public.project_tags;
CREATE POLICY "Public can view published project tags" ON public.project_tags
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_tags.project_id AND projects.status = 'published'
  ));

DROP POLICY IF EXISTS "Public can view published project images" ON public.project_images;
CREATE POLICY "Public can view published project images" ON public.project_images
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = project_images.project_id AND projects.status = 'published'
  ));

-- Prevent a concurrent Project save from attaching an image after the media
-- deletion preflight and having the attachment silently cascaded away.
ALTER TABLE public.project_images DROP CONSTRAINT project_images_media_id_fkey;
ALTER TABLE public.project_images ADD CONSTRAINT project_images_media_id_fkey
  FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE RESTRICT;

COMMIT;
