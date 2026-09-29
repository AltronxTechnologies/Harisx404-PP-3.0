-- Prevent direct public writes to blog/tag associations and draft tag reads.
-- The Admin save RPC uses the service role, which bypasses these public policies.
BEGIN;

ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view live blog post tags" ON public.blog_post_tags;
CREATE POLICY "Public can view live blog post tags"
  ON public.blog_post_tags FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.blog_posts
    WHERE blog_posts.id = blog_post_tags.blog_post_id
      AND blog_posts.status = 'published'
      AND blog_posts.published_at IS NOT NULL
      AND blog_posts.published_at <= NOW()
  ));

REVOKE INSERT, UPDATE, DELETE ON public.blog_post_tags FROM anon, authenticated;
GRANT SELECT ON public.blog_post_tags TO anon, authenticated;

COMMIT;
