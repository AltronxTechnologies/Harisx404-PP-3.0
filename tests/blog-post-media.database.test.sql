\set ON_ERROR_STOP on
-- Apply through 2026_blog_post_media.sql on an isolated database first.
-- All test writes are rolled back.
BEGIN;

DO $$
DECLARE
  first_id uuid;
  second_id uuid;
  post_id uuid;
  saved jsonb;
  payload jsonb := '{"slug":"media-association-test","title":"Media test","content":"Body","status":"draft","reading_time_minutes":1}'::jsonb;
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.blog_post_media'::regclass)
     OR has_table_privilege('anon', 'public.blog_post_media', 'SELECT, INSERT, UPDATE, DELETE')
     OR has_table_privilege('authenticated', 'public.blog_post_media', 'SELECT, INSERT, UPDATE, DELETE')
     OR NOT has_table_privilege('service_role', 'public.blog_post_media', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.blog_post_media', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.blog_post_media', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.blog_post_media', 'DELETE')
     OR has_function_privilege('anon', 'public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.save_blog_post_with_tags_base(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Blog media permissions changed';
  END IF;

  INSERT INTO public.media (public_id, url, secure_url)
  VALUES ('media-association-test-1', 'http://example.test/1', 'https://example.test/1')
  RETURNING id INTO first_id;
  INSERT INTO public.media (public_id, url, secure_url)
  VALUES ('media-association-test-2', 'http://example.test/2', 'https://example.test/2')
  RETURNING id INTO second_id;

  saved := public.save_blog_post_with_tags(payload || jsonb_build_object('cover_image_id', first_id), '[]'::jsonb);
  post_id := (saved->'post'->>'id')::uuid;
  IF (SELECT array_agg(media_id ORDER BY display_order) FROM public.blog_post_media WHERE blog_post_id = post_id)
     IS DISTINCT FROM ARRAY[first_id] THEN
    RAISE EXCEPTION 'Legacy create did not associate the cover';
  END IF;

  saved := public.save_blog_post_with_tags(payload || jsonb_build_object('image_ids', jsonb_build_array(second_id, first_id)),
    '[]'::jsonb, post_id, (saved->'post'->>'updated_at')::timestamptz);
  IF (SELECT array_agg(media_id ORDER BY display_order) FROM public.blog_post_media WHERE blog_post_id = post_id)
     IS DISTINCT FROM ARRAY[second_id, first_id] THEN
    RAISE EXCEPTION 'Ordered selection was not saved';
  END IF;
  BEGIN
    DELETE FROM public.media WHERE id = second_id;
    RAISE EXCEPTION 'Referenced media was deleted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  saved := public.save_blog_post_with_tags(payload, '[]'::jsonb, post_id,
    (saved->'post'->>'updated_at')::timestamptz);
  IF (SELECT array_agg(media_id ORDER BY display_order) FROM public.blog_post_media WHERE blog_post_id = post_id)
     IS DISTINCT FROM ARRAY[second_id, first_id] THEN
    RAISE EXCEPTION 'Legacy update erased associations';
  END IF;

  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || jsonb_build_object('image_ids', jsonb_build_array(first_id, first_id)),
      '[]'::jsonb, post_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Duplicate was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_MEDIA_INVALID:%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || '{"image_ids":[null]}'::jsonb,
      '[]'::jsonb, post_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Null was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_MEDIA_INVALID:%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || '{"image_ids":["not-a-uuid"]}'::jsonb,
      '[]'::jsonb, post_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Invalid UUID was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_MEDIA_INVALID:%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || '{"image_ids":["00000000-0000-4000-8000-000000000999"]}'::jsonb,
      '[]'::jsonb, post_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Missing media was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'BLOG_MEDIA_INVALID:%' THEN RAISE; END IF;
  END;

  IF (SELECT array_agg(media_id ORDER BY display_order) FROM public.blog_post_media WHERE blog_post_id = post_id)
     IS DISTINCT FROM ARRAY[second_id, first_id] THEN
    RAISE EXCEPTION 'Rejected selection changed associations';
  END IF;

  saved := public.save_blog_post_with_tags(payload || '{"image_ids":[]}'::jsonb,
    '[]'::jsonb, post_id, (saved->'post'->>'updated_at')::timestamptz);
  IF EXISTS (SELECT 1 FROM public.blog_post_media WHERE blog_post_id = post_id) THEN
    RAISE EXCEPTION 'Explicit empty selection did not clear associations';
  END IF;
END;
$$;

ROLLBACK;
