\set ON_ERROR_STOP on
-- Run only against an isolated database with the base schema, Supabase-like
-- grants, and the Blog admin, tag-join RLS, and publication migrations applied.
BEGIN;

INSERT INTO public.tags (id, name, slug) VALUES
  ('00000000-0000-4000-8000-000000000101', 'RLS visible tag', 'blog-rls-visible'),
  ('00000000-0000-4000-8000-000000000102', 'RLS replacement tag', 'blog-rls-replacement');

INSERT INTO public.blog_posts (id, slug, title, status, published_at) VALUES
  ('00000000-0000-4000-8000-000000000111', 'blog-rls-live', 'Live', 'published', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000112', 'blog-rls-future', 'Future', 'published', now() + interval '1 day'),
  ('00000000-0000-4000-8000-000000000113', 'blog-rls-draft', 'Draft', 'draft', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000114', 'blog-rls-archived', 'Archived', 'archived', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000115', 'blog-rls-unpublished', 'No date', 'published', null);

INSERT INTO public.blog_post_tags (blog_post_id, tag_id)
SELECT id, '00000000-0000-4000-8000-000000000101'::uuid
FROM public.blog_posts WHERE slug LIKE 'blog-rls-%';

DO $$
DECLARE
  role_name text;
  denied boolean;
  affected integer;
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.blog_post_tags'::regclass) THEN
    RAISE EXCEPTION 'Blog tag-join RLS is disabled';
  END IF;

  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    EXECUTE format('SET LOCAL ROLE %I', role_name);
    IF current_user <> role_name OR
       NOT has_table_privilege(current_user, 'public.blog_posts', 'SELECT') OR
       NOT has_table_privilege(current_user, 'public.blog_post_tags', 'SELECT') OR
       has_table_privilege(current_user, 'public.blog_post_tags', 'INSERT') OR
       has_table_privilege(current_user, 'public.blog_post_tags', 'UPDATE') OR
       has_table_privilege(current_user, 'public.blog_post_tags', 'DELETE') OR
       has_function_privilege(current_user, 'public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE') THEN
      RAISE EXCEPTION '% Blog grants are incorrect', role_name;
    END IF;

    IF (SELECT array_agg(id) FROM public.blog_posts WHERE slug LIKE 'blog-rls-%')
       IS DISTINCT FROM ARRAY['00000000-0000-4000-8000-000000000111'::uuid] OR
       (SELECT array_agg(blog_post_id) FROM public.blog_post_tags)
       IS DISTINCT FROM ARRAY['00000000-0000-4000-8000-000000000111'::uuid] THEN
      RAISE EXCEPTION '% can read non-live Blog posts or tag links', role_name;
    END IF;

    denied := false;
    BEGIN
      INSERT INTO public.blog_post_tags (blog_post_id, tag_id)
      VALUES ('00000000-0000-4000-8000-000000000111', '00000000-0000-4000-8000-000000000102');
    EXCEPTION WHEN insufficient_privilege THEN denied := true;
    END;
    IF NOT denied THEN RAISE EXCEPTION '% inserted a Blog tag link', role_name; END IF;

    denied := false;
    BEGIN
      UPDATE public.blog_post_tags
      SET tag_id = '00000000-0000-4000-8000-000000000102'
      WHERE blog_post_id = '00000000-0000-4000-8000-000000000111';
      GET DIAGNOSTICS affected = ROW_COUNT;
    EXCEPTION WHEN insufficient_privilege THEN denied := true;
    END;
    IF NOT denied AND affected <> 0 THEN RAISE EXCEPTION '% updated a Blog tag link', role_name; END IF;

    denied := false;
    BEGIN
      DELETE FROM public.blog_post_tags
      WHERE blog_post_id = '00000000-0000-4000-8000-000000000111';
      GET DIAGNOSTICS affected = ROW_COUNT;
    EXCEPTION WHEN insufficient_privilege THEN denied := true;
    END;
    IF NOT denied AND affected <> 0 THEN RAISE EXCEPTION '% deleted a Blog tag link', role_name; END IF;

    IF (SELECT array_agg(blog_post_id) FROM public.blog_post_tags)
       IS DISTINCT FROM ARRAY['00000000-0000-4000-8000-000000000111'::uuid] THEN
      RAISE EXCEPTION '% changed visible Blog tag links', role_name;
    END IF;
  END LOOP;
  RESET ROLE;
END;
$$;

SET LOCAL ROLE service_role;
DO $$
DECLARE
  saved jsonb;
  post_id uuid;
BEGIN
  IF current_user <> 'service_role' OR
     NOT has_function_privilege(current_user, 'public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot call the Blog RPC';
  END IF;

  saved := public.save_blog_post_with_tags(
    jsonb_build_object('slug', 'blog-rls-rpc', 'title', 'RPC post', 'status', 'published',
                       'content', 'Test content', 'reading_time_minutes', 1),
    '[{"name":"RPC tag","slug":"blog-rls-rpc-tag"}]'::jsonb, null, null);
  post_id := (saved->'post'->>'id')::uuid;
  IF post_id IS NULL OR
     (SELECT count(*) FROM public.blog_post_tags WHERE blog_post_id = post_id) <> 1 THEN
    RAISE EXCEPTION 'service_role RPC did not create a Blog tag link';
  END IF;

  saved := public.save_blog_post_with_tags(
    jsonb_build_object('slug', 'blog-rls-rpc', 'title', 'RPC draft', 'status', 'draft',
                       'content', 'Test content', 'reading_time_minutes', 1),
    '[{"name":"Replacement RPC tag","slug":"blog-rls-rpc-replacement"}]'::jsonb,
    post_id, (saved->'post'->>'updated_at')::timestamptz);
  IF (saved->'post'->>'status') <> 'draft' OR
     (SELECT array_agg(t.name) FROM public.blog_post_tags pt
      JOIN public.tags t ON t.id = pt.tag_id WHERE pt.blog_post_id = post_id)
     IS DISTINCT FROM ARRAY['Replacement RPC tag'] THEN
    RAISE EXCEPTION 'service_role RPC did not replace Blog tag links';
  END IF;
END;
$$;
RESET ROLE;

ROLLBACK;
