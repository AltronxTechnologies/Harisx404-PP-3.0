-- Keep scheduled Blog posts private even when their status is already published.
BEGIN;

DROP POLICY IF EXISTS "Public can view published blog posts" ON public.blog_posts;

CREATE POLICY "Public can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW()
  );

COMMIT;
