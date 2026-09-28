\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  first_media uuid;
  second_media uuid;
  v_project_id uuid;
  related_id uuid;
  original_project jsonb;
  payload jsonb;
  saved jsonb;
  token timestamptz;
  original_images jsonb;
  original_tags jsonb;
  shared_tag_id uuid;
  collision_tag_id uuid;
  other_collision_tag_id uuid;
  direct_token timestamptz;
  deleted jsonb;
BEGIN
  IF has_function_privilege('anon', 'public.save_project_with_gallery_and_tags(jsonb,jsonb,jsonb,uuid,timestamptz)', 'EXECUTE') OR
     has_function_privilege('authenticated', 'public.save_project_with_gallery_and_tags(jsonb,jsonb,jsonb,uuid,timestamptz)', 'EXECUTE') OR
     NOT has_function_privilege('service_role', 'public.save_project_with_gallery_and_tags(jsonb,jsonb,jsonb,uuid,timestamptz)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Project RPC privileges are not service-role only';
  END IF;
  IF has_function_privilege('anon', 'public.delete_project_and_unlink_related(uuid)', 'EXECUTE') OR
     has_function_privilege('authenticated', 'public.delete_project_and_unlink_related(uuid)', 'EXECUTE') OR
     NOT has_function_privilege('service_role', 'public.delete_project_and_unlink_related(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Project deletion privileges are not service-role only';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_attribute
                 WHERE attrelid = 'public.projects'::regclass AND attname = 'updated_at' AND attnotnull) OR
     NOT EXISTS (SELECT 1 FROM pg_trigger
                 WHERE tgrelid = 'public.projects'::regclass AND tgname = 'advance_project_updated_at' AND tgenabled = 'O') THEN
    RAISE EXCEPTION 'Project timestamp backfill/trigger is missing';
  END IF;

  INSERT INTO public.media (public_id, url, secure_url)
  VALUES ('atomic-test-1-' || gen_random_uuid(), 'https://example.com/1', 'https://example.com/1') RETURNING id INTO first_media;
  INSERT INTO public.media (public_id, url, secure_url)
  VALUES ('atomic-test-2-' || gen_random_uuid(), 'https://example.com/2', 'https://example.com/2') RETURNING id INTO second_media;
  INSERT INTO public.projects (slug, title, status) VALUES ('atomic-related-' || gen_random_uuid(), 'Related', 'published') RETURNING id INTO related_id;
  INSERT INTO public.tags (name, slug) VALUES ('Atomic Tag', 'atomic-shared-' || gen_random_uuid())
  RETURNING id INTO shared_tag_id;
  INSERT INTO public.tags (name, slug)
  VALUES ('Occupied Collision Slug', 'atomic-tag-' || md5('Atomic/Tag'));

  payload := jsonb_build_object(
    'title', 'Atomic project', 'slug', 'atomic-' || gen_random_uuid(),
    'description', '', 'content', '', 'status', 'draft',
    'cover_image_url', 'https://example.com/1', 'cover_image_id', first_media,
    'live_url', null, 'github_url', null, 'start_date', null, 'end_date', null,
    'featured', false, 'tagline', null, 'category', 'Web App', 'year', null,
    'latest_update_label', null, 'project_stage', 'completed',
    'expected_completion_label', null, 'source_note', null,
    'case_study_sections', '{}'::jsonb, 'tech_stack', '[]'::jsonb,
    'features', '[]'::jsonb, 'related_project_ids', jsonb_build_array(related_id)
  );
  BEGIN
    PERFORM public.save_project_with_gallery_and_tags(payload || '{"title":"Create must roll back"}'::jsonb,
      jsonb_build_array(jsonb_build_object('mediaId', gen_random_uuid(), 'caption', 'Missing')),
      '[]'::jsonb, null, null);
    RAISE EXCEPTION 'Invalid gallery create was accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.projects WHERE slug = payload->>'slug') THEN
    RAISE EXCEPTION 'Failed create left a project behind';
  END IF;

  saved := public.save_project_with_gallery_and_tags(payload,
    jsonb_build_array(jsonb_build_object('mediaId', first_media, 'caption', 'First', 'altText', 'First image description')),
    jsonb_build_array('Atomic Tag'), null, null);
  v_project_id := (saved->'project'->>'id')::uuid;
  IF v_project_id IS NULL OR (saved->'project'->>'slug') <> payload->>'slug' THEN
    RAISE EXCEPTION 'Create did not return the saved project';
  END IF;

  SELECT to_jsonb(p), updated_at INTO original_project, token FROM public.projects p WHERE id = v_project_id;
  SELECT jsonb_agg(to_jsonb(i) ORDER BY display_order) INTO original_images FROM public.project_images i WHERE project_id = v_project_id;
  SELECT jsonb_agg(to_jsonb(t) ORDER BY t.tag_id) INTO original_tags FROM public.project_tags t WHERE project_id = v_project_id;
  IF (SELECT alt_text FROM public.project_images WHERE project_id = v_project_id AND media_id = first_media) IS DISTINCT FROM 'First image description' THEN
    RAISE EXCEPTION 'Create did not save per-gallery alt text';
  END IF;

  BEGIN
    PERFORM public.save_project_with_gallery_and_tags(payload || '{"title":"Must roll back"}'::jsonb,
      jsonb_build_array(jsonb_build_object('mediaId', second_media, 'caption', 'Second'),
                        jsonb_build_object('mediaId', gen_random_uuid(), 'caption', 'Missing')),
      jsonb_build_array('Must Not Persist'), v_project_id, token);
    RAISE EXCEPTION 'Missing media was accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  IF (SELECT to_jsonb(p) FROM public.projects p WHERE id = v_project_id) IS DISTINCT FROM original_project OR
     (SELECT jsonb_agg(to_jsonb(i) ORDER BY display_order) FROM public.project_images i WHERE project_id = v_project_id) IS DISTINCT FROM original_images OR
     (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.tag_id) FROM public.project_tags t WHERE project_id = v_project_id) IS DISTINCT FROM original_tags OR
     EXISTS (SELECT 1 FROM public.tags WHERE name = 'Must Not Persist') THEN
    RAISE EXCEPTION 'Failed gallery write modified project, images, or tags';
  END IF;

  BEGIN
    PERFORM public.save_project_with_gallery_and_tags(payload,
      jsonb_build_array(jsonb_build_object('mediaId', second_media, 'caption', 'Once'),
                        jsonb_build_object('mediaId', second_media, 'caption', 'Twice')),
      '[]'::jsonb, v_project_id, token);
    RAISE EXCEPTION 'Duplicate gallery image was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Gallery images must be unique' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.save_project_with_gallery_and_tags(payload || '{"title":"Must also roll back"}'::jsonb,
      jsonb_build_array(jsonb_build_object('mediaId', second_media, 'caption', 'Second')),
      jsonb_build_array('Atomic New Tag', '   '), v_project_id, token);
    RAISE EXCEPTION 'Invalid tag was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Tag must contain a name' THEN RAISE; END IF;
  END;
  IF (SELECT to_jsonb(p) FROM public.projects p WHERE id = v_project_id) IS DISTINCT FROM original_project OR
     (SELECT jsonb_agg(to_jsonb(i) ORDER BY display_order) FROM public.project_images i WHERE project_id = v_project_id) IS DISTINCT FROM original_images OR
     (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.tag_id) FROM public.project_tags t WHERE project_id = v_project_id) IS DISTINCT FROM original_tags OR
     EXISTS (SELECT 1 FROM public.tags WHERE name = 'Atomic New Tag') THEN
    RAISE EXCEPTION 'Failed tag write modified project, images, or tags';
  END IF;

  BEGIN
    PERFORM public.save_project_with_gallery_and_tags(payload || '{"title":"Stale"}'::jsonb,
      '[]'::jsonb, '[]'::jsonb, v_project_id, token - interval '1 second');
    RAISE EXCEPTION 'Stale update was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'PROJECT_CONFLICT:%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.save_project_with_gallery_and_tags(payload || '{"slug":"bad-related"}'::jsonb ||
      jsonb_build_object('related_project_ids', jsonb_build_array(v_project_id)),
      '[]'::jsonb, '[]'::jsonb, v_project_id, token);
    RAISE EXCEPTION 'Self-related project was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Choose two different related projects%' THEN RAISE; END IF;
  END;

  UPDATE public.projects SET title = 'Direct edit', updated_at = token - interval '1 day'
  WHERE id = v_project_id RETURNING updated_at INTO direct_token;
  IF direct_token <= token THEN
    RAISE EXCEPTION 'Direct project update did not advance updated_at';
  END IF;
  BEGIN
    PERFORM public.save_project_with_gallery_and_tags(payload,
      '[]'::jsonb, '[]'::jsonb, v_project_id, token);
    RAISE EXCEPTION 'Token from before direct edit was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'PROJECT_CONFLICT:%' THEN RAISE; END IF;
  END;
  IF (SELECT title FROM public.projects WHERE id = v_project_id) <> 'Direct edit' OR
     (SELECT jsonb_agg(to_jsonb(i) ORDER BY display_order) FROM public.project_images i WHERE project_id = v_project_id) IS DISTINCT FROM original_images OR
     (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.tag_id) FROM public.project_tags t WHERE project_id = v_project_id) IS DISTINCT FROM original_tags THEN
    RAISE EXCEPTION 'Stale write after direct edit modified project, images, or tags';
  END IF;

  saved := public.save_project_with_gallery_and_tags(payload || '{"title":"Updated"}'::jsonb,
    jsonb_build_array(jsonb_build_object('mediaId', second_media, 'caption', 'Second')),
    jsonb_build_array('Atomic Tag', 'Atomic Tag', 'Atomic+Tag', 'Atomic/Tag', '日本語', '日本語'), v_project_id, direct_token);
  SELECT id INTO collision_tag_id FROM public.tags WHERE name = 'Atomic+Tag';
  SELECT id INTO other_collision_tag_id FROM public.tags WHERE name = 'Atomic/Tag';
  IF (saved->'project'->>'updated_at')::timestamptz <= direct_token OR
     (SELECT count(*) FROM public.project_tags WHERE project_id = v_project_id) <> 4 OR
     (SELECT media_id FROM public.project_images WHERE project_id = v_project_id) <> second_media OR
     (SELECT name FROM public.tags WHERE id = shared_tag_id) <> 'Atomic Tag' OR
     collision_tag_id IS NULL OR other_collision_tag_id IS NULL OR
     collision_tag_id = other_collision_tag_id OR collision_tag_id = shared_tag_id OR other_collision_tag_id = shared_tag_id OR
     (SELECT slug FROM public.tags WHERE id = collision_tag_id) <> 'atomic-tag' OR
     (SELECT slug FROM public.tags WHERE id = other_collision_tag_id) <> 'atomic-tag-' || md5('Atomic/Tag') || '-2' OR
     (SELECT name FROM public.tags WHERE slug = 'atomic-tag-' || md5('Atomic/Tag')) <> 'Occupied Collision Slug' OR
     (SELECT slug FROM public.tags WHERE name = '日本語') <> 'tag-' || md5('日本語') THEN
    RAISE EXCEPTION 'Update failed to replace gallery/tags or advance timestamp';
  END IF;

  token := (saved->'project'->>'updated_at')::timestamptz;
  saved := public.save_project_with_gallery_and_tags(payload || '{"title":"Reordered"}'::jsonb,
    jsonb_build_array(
      jsonb_build_object('mediaId', second_media, 'caption', 'Second first', 'altText', 'Second image context'),
      jsonb_build_object('mediaId', first_media, 'caption', 'First second', 'altText', 'First image context')),
    jsonb_build_array('Atomic Tag'), v_project_id, token);
  IF (SELECT jsonb_agg(jsonb_build_object('mediaId', media_id, 'caption', caption, 'altText', alt_text, 'order', display_order)
                       ORDER BY display_order) FROM public.project_images WHERE project_id = v_project_id)
     IS DISTINCT FROM jsonb_build_array(
       jsonb_build_object('mediaId', second_media, 'caption', 'Second first', 'altText', 'Second image context', 'order', 0),
       jsonb_build_object('mediaId', first_media, 'caption', 'First second', 'altText', 'First image context', 'order', 1)) THEN
    RAISE EXCEPTION 'Reorder did not save each image with its own alt text and order';
  END IF;

  SELECT to_jsonb(p) INTO original_project FROM public.projects p WHERE id = v_project_id;
  SELECT jsonb_agg(to_jsonb(i) ORDER BY display_order) INTO original_images FROM public.project_images i WHERE project_id = v_project_id;
  SELECT jsonb_agg(to_jsonb(t) ORDER BY t.tag_id) INTO original_tags FROM public.project_tags t WHERE project_id = v_project_id;
  BEGIN
    PERFORM public.save_project_with_gallery_and_tags(payload || '{"title":"Failed alt change"}'::jsonb,
      jsonb_build_array(
        jsonb_build_object('mediaId', first_media, 'caption', 'Changed', 'altText', 'Must not persist'),
        jsonb_build_object('mediaId', second_media, 'caption', 'Changed too', 'altText', 'Must also not persist')),
      jsonb_build_array('Atomic New Tag', '   '), v_project_id, (saved->'project'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Invalid tag after alt change was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Tag must contain a name' THEN RAISE; END IF;
  END;
  IF (SELECT to_jsonb(p) FROM public.projects p WHERE id = v_project_id) IS DISTINCT FROM original_project OR
      (SELECT jsonb_agg(to_jsonb(i) ORDER BY display_order) FROM public.project_images i WHERE project_id = v_project_id) IS DISTINCT FROM original_images OR
      (SELECT jsonb_agg(to_jsonb(t) ORDER BY t.tag_id) FROM public.project_tags t WHERE project_id = v_project_id) IS DISTINCT FROM original_tags OR
      EXISTS (SELECT 1 FROM public.tags WHERE name = 'Atomic New Tag') THEN
    RAISE EXCEPTION 'Failed save changed gallery alt text, order, project, or tags';
  END IF;

  deleted := public.delete_project_and_unlink_related(related_id);
  IF (deleted->>'slug') NOT LIKE 'atomic-related-%' OR
     deleted->'referring_slugs' IS DISTINCT FROM jsonb_build_array(payload->>'slug') OR
     EXISTS (SELECT 1 FROM public.projects WHERE id = related_id) OR
     (SELECT related_project_ids FROM public.projects WHERE id = v_project_id) IS DISTINCT FROM ARRAY[]::uuid[] OR
     (SELECT updated_at FROM public.projects WHERE id = v_project_id) <= (saved->'project'->>'updated_at')::timestamptz THEN
    RAISE EXCEPTION 'Delete did not unlink related projects and return their slugs';
  END IF;
  BEGIN
    PERFORM public.delete_project_and_unlink_related(related_id);
    RAISE EXCEPTION 'Missing project deletion was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'PROJECT_NOT_FOUND' THEN RAISE; END IF;
  END;
END;
$$;

ROLLBACK;
