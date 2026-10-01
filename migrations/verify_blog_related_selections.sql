-- Run read-only after 2026_blog_related_selections.sql; every value should be true.
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_posts'
      AND column_name = 'related_blog_post_ids' AND udt_name = '_uuid'
      AND is_nullable = 'NO'
  ) AS related_ids_column_ready,
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = to_regclass('public.blog_posts')
      AND conname = 'blog_posts_related_blog_post_ids_valid' AND convalidated
  ) AS related_ids_constraint_ready,
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = to_regclass('public.blog_posts')
      AND tgname = 'blog_posts_unlink_related_after_delete' AND NOT tgisinternal
  ) AS deleted_post_unlink_guard_ready,
  COALESCE(has_function_privilege('service_role', to_regprocedure('public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)'), 'EXECUTE'), false) AS save_rpc_service_only,
  COALESCE(NOT has_function_privilege('anon', to_regprocedure('public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)'), 'EXECUTE'), false) AS anon_save_rpc_revoked,
  COALESCE(NOT has_function_privilege('authenticated', to_regprocedure('public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)'), 'EXECUTE'), false) AS authenticated_save_rpc_revoked;
