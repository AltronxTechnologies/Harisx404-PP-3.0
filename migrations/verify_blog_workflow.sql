-- Run read-only in the connected Supabase SQL editor after
-- 2026_blog_editor_delete_slug_history.sql. Every result should be true.
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_posts'
      AND column_name = 'editor_mode' AND column_default LIKE '%source%'
  ) AS legacy_editor_mode_defaults_to_source,
  (SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public.blog_slug_history')) AS slug_history_rls_enabled,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_slug_history'
      AND policyname = 'Public can view blog slug history'
      AND cmd = 'SELECT'
  ) AS published_slug_history_read_policy,
  NOT has_table_privilege('anon', 'public.blog_slug_history', 'INSERT, UPDATE, DELETE') AS anon_history_writes_revoked,
  NOT has_table_privilege('authenticated', 'public.blog_slug_history', 'INSERT, UPDATE, DELETE') AS authenticated_history_writes_revoked,
  COALESCE(has_function_privilege('service_role', to_regprocedure('public.transition_blog_post(uuid,timestamptz,text)'), 'EXECUTE'), false) AS archive_rpc_service_only,
  COALESCE(NOT has_function_privilege('anon', to_regprocedure('public.transition_blog_post(uuid,timestamptz,text)'), 'EXECUTE'), false) AS anon_archive_rpc_revoked,
  COALESCE(NOT has_function_privilege('authenticated', to_regprocedure('public.transition_blog_post(uuid,timestamptz,text)'), 'EXECUTE'), false) AS authenticated_archive_rpc_revoked,
  COALESCE(has_function_privilege('service_role', to_regprocedure('public.delete_archived_blog_post(uuid,timestamptz)'), 'EXECUTE'), false) AS delete_rpc_service_only,
  COALESCE(NOT has_function_privilege('anon', to_regprocedure('public.delete_archived_blog_post(uuid,timestamptz)'), 'EXECUTE'), false) AS anon_delete_rpc_revoked,
  COALESCE(NOT has_function_privilege('authenticated', to_regprocedure('public.delete_archived_blog_post(uuid,timestamptz)'), 'EXECUTE'), false) AS authenticated_delete_rpc_revoked,
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = to_regclass('public.article_views')
      AND tgname = 'check_blog_article_view_insert' AND NOT tgisinternal
  ) AS orphan_view_insert_guard;
