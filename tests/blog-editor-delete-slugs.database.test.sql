\set ON_ERROR_STOP on
-- Run on an isolated database with the base schema, article reactions, Blog
-- tag-collision RPC and blog-editor-delete-slug-history migration applied.
BEGIN;

DO $$
DECLARE
  saved jsonb;
  payload jsonb := jsonb_build_object(
    'slug', 'editor-delete-live', 'title', 'Live', 'content', 'Body',
    'status', 'published', 'reading_time_minutes', 1, 'editor_mode', 'source'
  );
  v_post_id uuid;
  draft_id uuid;
  source_id uuid;
  token timestamptz;
  deleted jsonb;
BEGIN
  IF has_function_privilege('anon', 'public.delete_archived_blog_post(uuid,timestamptz)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.delete_archived_blog_post(uuid,timestamptz)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.delete_archived_blog_post(uuid,timestamptz)', 'EXECUTE')
     OR has_table_privilege('anon', 'public.blog_slug_history', 'INSERT')
     OR has_table_privilege('authenticated', 'public.blog_slug_history', 'DELETE')
     OR NOT has_table_privilege('anon', 'public.blog_slug_history', 'SELECT') THEN
    RAISE EXCEPTION 'Slug history or delete RPC grants are incorrect';
  END IF;

  INSERT INTO public.blog_posts (slug, title, status)
  VALUES ('editor-delete-source', 'Legacy', 'draft') RETURNING id INTO source_id;
  IF (SELECT editor_mode FROM public.blog_posts WHERE slug = 'editor-delete-source') <> 'source' THEN
    RAISE EXCEPTION 'Legacy/default editor mode is not source';
  END IF;
  saved := public.save_blog_post_with_tags(
    payload || '{"slug":"editor-delete-source","status":"draft","editor_mode":"rich"}'::jsonb,
    '[]'::jsonb, source_id, (SELECT updated_at FROM public.blog_posts WHERE id = source_id));
  IF saved->'post'->>'editor_mode' <> 'source' THEN
    RAISE EXCEPTION 'Update changed an existing source post to rich';
  END IF;

  saved := public.save_blog_post_with_tags(payload,
    '[{"name":"Editor tag","slug":"editor-tag"}]'::jsonb, null, null);
  v_post_id := (saved->'post'->>'id')::uuid;
  IF saved->'post'->>'editor_mode' <> 'rich'
     OR NOT EXISTS (SELECT 1 FROM public.blog_slug_history h WHERE h.slug = 'editor-delete-live' AND h.post_id = v_post_id)
     OR (SELECT count(*) FROM public.blog_post_tags WHERE blog_post_id = v_post_id) <> 1 THEN
    RAISE EXCEPTION 'New published post was not saved as rich with tag and history';
  END IF;
  INSERT INTO public.article_reactions (article_slug, reaction_type, count)
  VALUES ('editor-delete-live', 'like', 1);
  INSERT INTO public.article_reaction_visitors (article_slug, reaction_type, visitor_id)
  VALUES ('editor-delete-live', 'like', '00000000-0000-4000-8000-000000000901');
  INSERT INTO public.article_views (slug, view_count) VALUES ('editor-delete-live', 2);

  token := (saved->'post'->>'updated_at')::timestamptz;
  BEGIN
    PERFORM public.delete_archived_blog_post(v_post_id, token);
    RAISE EXCEPTION 'Non-archived post was deleted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_POST_CONFLICT:%' THEN RAISE; END IF;
  END;

  saved := public.save_blog_post_with_tags(payload || '{"slug":"editor-delete-new","editor_mode":"source"}'::jsonb,
    '[]'::jsonb, v_post_id, token);
  IF saved->>'old_slug' <> 'editor-delete-live' OR saved->'post'->>'editor_mode' <> 'rich'
     OR (SELECT count(*) FROM public.blog_slug_history h WHERE h.post_id = v_post_id) <> 2
     OR EXISTS (SELECT 1 FROM public.blog_post_tags WHERE blog_post_id = v_post_id)
     OR NOT EXISTS (SELECT 1 FROM public.article_reactions WHERE article_slug = 'editor-delete-new') THEN
    RAISE EXCEPTION 'Rename lost aliases, tags, mode or old_slug';
  END IF;

  UPDATE public.blog_posts SET updated_at = clock_timestamp() WHERE id = v_post_id;
  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || '{"status":"draft"}'::jsonb, '[]'::jsonb, null, null);
    RAISE EXCEPTION 'Published alias reused by draft';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_SLUG_RESERVED:%' THEN RAISE; END IF;
  END;

  saved := public.save_blog_post_with_tags(payload || '{"slug":"editor-delete-draft","status":"draft"}'::jsonb,
    '[]'::jsonb, null, null);
  draft_id := (saved->'post'->>'id')::uuid;
  IF EXISTS (SELECT 1 FROM public.blog_slug_history WHERE slug = 'editor-delete-draft') THEN
    RAISE EXCEPTION 'Draft slug exposed in history';
  END IF;
  EXECUTE 'SET LOCAL ROLE anon';
  IF (SELECT count(*) FROM public.blog_slug_history WHERE slug LIKE 'editor-delete-%') <> 2 THEN
    RAISE EXCEPTION 'Anonymous readers cannot see both published names or can see draft names';
  END IF;
  EXECUTE 'RESET ROLE';
  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || '{"slug":"editor-delete-new","status":"draft"}'::jsonb,
      '[]'::jsonb, draft_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Another post reused current published slug';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_SLUG_RESERVED:%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || '{"slug":"editor-delete-final"}'::jsonb,
      '[]'::jsonb, v_post_id, token);
    RAISE EXCEPTION 'Stale update succeeded';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_POST_CONFLICT:%' THEN RAISE; END IF;
  END;

  INSERT INTO public.article_views (slug, view_count) VALUES
    ('editor-delete-new', 3), ('editor-delete-draft', 4);
  saved := public.save_blog_post_with_tags(payload || '{"slug":"editor-delete-new","status":"archived"}'::jsonb,
    '[]'::jsonb, v_post_id, (SELECT updated_at FROM public.blog_posts WHERE id = v_post_id));
  token := (saved->'post'->>'updated_at')::timestamptz;
  BEGIN
    PERFORM public.delete_archived_blog_post(v_post_id, token - interval '1 second');
    RAISE EXCEPTION 'Stale delete succeeded';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_POST_CONFLICT:%' THEN RAISE; END IF;
  END;

  deleted := public.delete_archived_blog_post(v_post_id, token);
  IF deleted->>'deleted_slug' <> 'editor-delete-new'
     OR deleted->'aliases' <> '["editor-delete-live"]'::jsonb
     OR EXISTS (SELECT 1 FROM public.blog_posts WHERE id = v_post_id)
     OR EXISTS (SELECT 1 FROM public.blog_post_tags WHERE blog_post_id = v_post_id)
     OR (SELECT count(*) FROM public.blog_slug_history h WHERE h.slug IN ('editor-delete-live', 'editor-delete-new') AND h.post_id IS NULL) <> 2
     OR EXISTS (SELECT 1 FROM public.article_views WHERE slug IN ('editor-delete-live', 'editor-delete-new'))
     OR NOT EXISTS (SELECT 1 FROM public.article_views WHERE slug = 'editor-delete-draft')
     OR EXISTS (SELECT 1 FROM public.article_reactions WHERE article_slug = 'editor-delete-new')
     OR EXISTS (SELECT 1 FROM public.article_reaction_visitors WHERE article_slug = 'editor-delete-new')
     OR NOT EXISTS (SELECT 1 FROM public.tags WHERE name = 'Editor tag') THEN
    RAISE EXCEPTION 'Delete did not leave tombstones or clean only owned views';
  END IF;
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF (SELECT count(*) FROM public.blog_slug_history WHERE slug IN ('editor-delete-live', 'editor-delete-new')) <> 2 THEN
    RAISE EXCEPTION 'Deleted aliases are not visible as tombstones';
  END IF;
  EXECUTE 'RESET ROLE';

  BEGIN
    PERFORM public.save_blog_post_with_tags(payload, '[]'::jsonb, null, null);
    RAISE EXCEPTION 'Tombstoned alias reused';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_SLUG_RESERVED:%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.delete_archived_blog_post(v_post_id, token);
    RAISE EXCEPTION 'Missing post deleted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'BLOG_POST_NOT_FOUND' THEN RAISE; END IF;
  END;
END;
$$;

DO $$
DECLARE
  scheduled jsonb;
  changed jsonb;
  deleted jsonb;
  v_id uuid;
  token timestamptz;
BEGIN
  IF has_function_privilege('anon', 'public.transition_blog_post(uuid,timestamptz,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.transition_blog_post(uuid,timestamptz,text)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.transition_blog_post(uuid,timestamptz,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Transition RPC grants are not service-role only';
  END IF;

  scheduled := public.save_blog_post_with_tags(
    jsonb_build_object('title', 'Scheduled', 'slug', 'editor-delete-scheduled',
      'content', 'Body', 'status', 'published',
      'published_at', clock_timestamp() + interval '1 second',
      'reading_time_minutes', 1), '[]'::jsonb, null, null);
  v_id := (scheduled->'post'->>'id')::uuid;
  token := (scheduled->'post'->>'updated_at')::timestamptz;
  IF EXISTS (SELECT 1 FROM public.blog_slug_history WHERE slug = 'editor-delete-scheduled')
     OR (scheduled->'post'->>'published_at')::timestamptz <= clock_timestamp() THEN
    RAISE EXCEPTION 'Scheduled slug was already reserved or already due';
  END IF;

  BEGIN
    PERFORM public.transition_blog_post(v_id, token, 'publish');
    RAISE EXCEPTION 'Invalid transition action succeeded';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_POST_INVALID_ACTION:%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.transition_blog_post(v_id, token, 'restore');
    RAISE EXCEPTION 'Non-archived post was restored';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_POST_CONFLICT:%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.transition_blog_post(v_id, token - interval '1 second', 'archive');
    RAISE EXCEPTION 'Stale archive succeeded';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_POST_CONFLICT:%' THEN RAISE; END IF;
  END;

  PERFORM pg_sleep(1.1);
  changed := public.transition_blog_post(v_id, token, 'archive');
  IF changed->>'id' <> v_id::text OR changed->>'slug' <> 'editor-delete-scheduled'
     OR changed->>'status' <> 'archived'
     OR (changed->>'updated_at')::timestamptz <= token
     OR NOT EXISTS (SELECT 1 FROM public.blog_slug_history
                    WHERE slug = 'editor-delete-scheduled' AND post_id = v_id) THEN
    RAISE EXCEPTION 'Due scheduled post was archived without reserving its slug';
  END IF;

  BEGIN
    PERFORM public.save_blog_post_with_tags(
      '{"title":"Reuse","slug":"editor-delete-scheduled","status":"draft","content":"Body"}'::jsonb,
      '[]'::jsonb, null, null);
    RAISE EXCEPTION 'Archived scheduled slug was reused';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_SLUG_RESERVED:%' THEN RAISE; END IF;
  END;

  token := (changed->>'updated_at')::timestamptz;
  changed := public.transition_blog_post(v_id, token, 'restore');
  IF changed->>'status' <> 'draft' OR (changed->>'updated_at')::timestamptz <= token THEN
    RAISE EXCEPTION 'Restore did not advance the timestamp and set draft';
  END IF;
  token := (changed->>'updated_at')::timestamptz;
  changed := public.transition_blog_post(v_id, token, 'archive');
  IF changed->>'status' <> 'archived' OR (changed->>'updated_at')::timestamptz <= token THEN
    RAISE EXCEPTION 'Draft archive did not advance the timestamp';
  END IF;

  INSERT INTO public.article_views (slug, view_count) VALUES ('editor-delete-scheduled', 1);
  deleted := public.delete_archived_blog_post(v_id, (changed->>'updated_at')::timestamptz);
  IF deleted->>'deleted_slug' <> 'editor-delete-scheduled'
     OR NOT EXISTS (SELECT 1 FROM public.blog_slug_history
                    WHERE slug = 'editor-delete-scheduled' AND post_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.article_views WHERE slug = 'editor-delete-scheduled') THEN
    RAISE EXCEPTION 'Scheduled deletion lost its tombstone or left its views';
  END IF;

  BEGIN
    INSERT INTO public.article_views (slug, view_count) VALUES ('editor-delete-scheduled', 1);
    RAISE EXCEPTION 'View insert after delete succeeded';
  EXCEPTION WHEN foreign_key_violation THEN
    IF SQLERRM NOT LIKE 'ARTICLE_VIEW_POST_NOT_FOUND:%' THEN RAISE; END IF;
  END;
  BEGIN
    INSERT INTO public.article_views (slug, view_count) VALUES ('editor-delete-never-existed', 1);
    RAISE EXCEPTION 'Orphan view insert succeeded';
  EXCEPTION WHEN foreign_key_violation THEN
    IF SQLERRM NOT LIKE 'ARTICLE_VIEW_POST_NOT_FOUND:%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.transition_blog_post(v_id, token, 'archive');
    RAISE EXCEPTION 'Missing post was archived';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'BLOG_POST_NOT_FOUND' THEN RAISE; END IF;
  END;
END;
$$;

ROLLBACK;
