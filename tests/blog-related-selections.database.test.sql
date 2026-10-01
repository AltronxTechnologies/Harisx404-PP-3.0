\set ON_ERROR_STOP on
-- Apply the Blog editor migration followed by 2026_blog_related_selections.sql
-- on an isolated database. All test writes are rolled back.
BEGIN;

DO $$
DECLARE
  source_id uuid;
  first_id uuid;
  second_id uuid;
  third_id uuid;
  draft_id uuid;
  scheduled_id uuid;
  missing_id uuid := '00000000-0000-4000-8000-000000000999';
  saved jsonb;
  payload jsonb := '{"slug":"related-source","title":"Source","content":"Body","status":"draft","reading_time_minutes":1}'::jsonb;
BEGIN
  IF has_function_privilege('anon', 'public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Blog save RPC grants changed';
  END IF;

  INSERT INTO public.blog_posts (slug, title, status, published_at) VALUES
    ('related-first', 'First', 'published', now() - interval '1 day') RETURNING id INTO first_id;
  INSERT INTO public.blog_posts (slug, title, status, published_at) VALUES
    ('related-second', 'Second', 'published', now() - interval '1 day') RETURNING id INTO second_id;
  INSERT INTO public.blog_posts (slug, title, status, published_at) VALUES
    ('related-third', 'Third', 'published', now() - interval '1 day') RETURNING id INTO third_id;
  INSERT INTO public.blog_posts (slug, title, status) VALUES
    ('related-draft', 'Draft', 'draft') RETURNING id INTO draft_id;
  INSERT INTO public.blog_posts (slug, title, status, published_at) VALUES
    ('related-scheduled', 'Scheduled', 'published', now() + interval '1 day') RETURNING id INTO scheduled_id;

  saved := public.save_blog_post_with_tags(payload, '[]'::jsonb);
  source_id := (saved->'post'->>'id')::uuid;
  IF (SELECT related_blog_post_ids FROM public.blog_posts WHERE id = source_id) <> '{}'::uuid[] THEN
    RAISE EXCEPTION 'Empty selection did not default to empty';
  END IF;

  saved := public.save_blog_post_with_tags(payload || jsonb_build_object(
    'related_blog_post_ids', jsonb_build_array(third_id, first_id, second_id)
  ), '[]'::jsonb, source_id, (saved->'post'->>'updated_at')::timestamptz);
  IF (SELECT related_blog_post_ids FROM public.blog_posts WHERE id = source_id)
     IS DISTINCT FROM ARRAY[third_id, first_id, second_id] THEN
    RAISE EXCEPTION 'Selection order was lost';
  END IF;

  saved := public.save_blog_post_with_tags(payload, '[]'::jsonb, source_id,
    (saved->'post'->>'updated_at')::timestamptz);
  IF (SELECT related_blog_post_ids FROM public.blog_posts WHERE id = source_id)
     IS DISTINCT FROM ARRAY[third_id, first_id, second_id] THEN
    RAISE EXCEPTION 'Older RPC caller erased selection';
  END IF;

  FOREACH draft_id IN ARRAY ARRAY[draft_id, scheduled_id] LOOP
    BEGIN
      PERFORM public.save_blog_post_with_tags(payload || jsonb_build_object(
        'related_blog_post_ids', jsonb_build_array(draft_id)
      ), '[]'::jsonb, source_id, (saved->'post'->>'updated_at')::timestamptz);
      RAISE EXCEPTION 'Non-live post accepted';
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM NOT LIKE 'BLOG_RELATED_INVALID:%' THEN RAISE; END IF;
    END;
  END LOOP;

  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || jsonb_build_object(
      'related_blog_post_ids', jsonb_build_array(missing_id)
    ), '[]'::jsonb, source_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Missing post accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_RELATED_INVALID:%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || jsonb_build_object(
      'related_blog_post_ids', jsonb_build_array(source_id)
    ), '[]'::jsonb, source_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Self link accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_RELATED_INVALID:%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || jsonb_build_object(
      'related_blog_post_ids', jsonb_build_array(first_id, first_id)
    ), '[]'::jsonb, source_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Duplicate accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_RELATED_INVALID:%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || '{"related_blog_post_ids":[null]}'::jsonb,
      '[]'::jsonb, source_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Null ID accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_RELATED_INVALID:%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || '{"related_blog_post_ids":["not-a-uuid"]}'::jsonb,
      '[]'::jsonb, source_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Invalid UUID accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_RELATED_INVALID:%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || jsonb_build_object(
      'related_blog_post_ids', jsonb_build_array(first_id, second_id, third_id, scheduled_id)
    ), '[]'::jsonb, source_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Fourth choice accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_RELATED_INVALID:%' THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE public.blog_posts SET related_blog_post_ids = ARRAY[first_id, second_id, first_id] WHERE id = source_id;
    RAISE EXCEPTION 'Direct duplicate write accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.blog_posts SET related_blog_post_ids = ARRAY[source_id] WHERE id = source_id;
    RAISE EXCEPTION 'Direct self link accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  UPDATE public.blog_posts SET status = 'archived' WHERE id = first_id;
  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || jsonb_build_object(
      'related_blog_post_ids', jsonb_build_array(first_id)
    ), '[]'::jsonb, source_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Archived post accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_RELATED_INVALID:%' THEN RAISE; END IF;
  END;

  DELETE FROM public.blog_posts WHERE id = first_id;
  IF (SELECT related_blog_post_ids FROM public.blog_posts WHERE id = source_id)
     IS DISTINCT FROM ARRAY[third_id, second_id] THEN
    RAISE EXCEPTION 'Deleting a related post left an orphan or changed selection order';
  END IF;

  saved := public.save_blog_post_with_tags(payload || '{"related_blog_post_ids":[]}'::jsonb,
    '[]'::jsonb, source_id, (SELECT updated_at FROM public.blog_posts WHERE id = source_id));
  IF (SELECT related_blog_post_ids FROM public.blog_posts WHERE id = source_id) <> '{}'::uuid[] THEN
    RAISE EXCEPTION 'Explicit empty selection did not clear links';
  END IF;
END;
$$;

ROLLBACK;
