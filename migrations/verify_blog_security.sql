-- Run in the connected Supabase SQL editor after the two Blog migrations.
-- Read-only catalog check; every result should be true before deployment.
WITH blog_rpc AS (
  SELECT to_regprocedure('public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)') AS signature
), live_policy AS (
  SELECT * FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'blog_post_tags'
    AND policyname = 'Public can view live blog post tags'
)
SELECT
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.blog_post_tags'::regclass) AS tag_join_rls_enabled,
  EXISTS (
    SELECT 1 FROM live_policy WHERE cmd = 'SELECT'
      AND roles @> ARRAY['anon', 'authenticated']::name[]
      AND qual LIKE '%published_at <= now()%'
      AND qual LIKE '%status = ''published''%'
  ) AS live_tags_only_policy,
  NOT has_table_privilege('anon', 'public.blog_post_tags', 'INSERT, UPDATE, DELETE') AS anon_direct_writes_revoked,
  NOT has_table_privilege('authenticated', 'public.blog_post_tags', 'INSERT, UPDATE, DELETE') AS authenticated_direct_writes_revoked,
  (SELECT signature IS NOT NULL FROM blog_rpc) AS blog_save_rpc_exists,
  (SELECT signature IS NOT NULL AND NOT has_function_privilege('anon', signature, 'EXECUTE')
   FROM blog_rpc) AS anon_blog_rpc_revoked,
  (SELECT signature IS NOT NULL AND NOT has_function_privilege('authenticated', signature, 'EXECUTE')
   FROM blog_rpc) AS authenticated_blog_rpc_revoked,
  (SELECT signature IS NOT NULL AND has_function_privilege('service_role', signature, 'EXECUTE')
   FROM blog_rpc) AS service_role_blog_rpc_allowed,
  (SELECT signature IS NOT NULL
      AND pg_get_functiondef(signature) LIKE '%md5(tag_name)%'
      AND pg_get_functiondef(signature) LIKE '%WHERE name = tag_name%'
   FROM blog_rpc) AS collision_safe_blog_rpc;
