\set ON_ERROR_STOP on
-- Run only against an isolated database with the Blog migrations applied.
BEGIN;

DO $$
DECLARE
  shared_id uuid;
  v_project_id uuid;
  first_id uuid;
  second_id uuid;
  post_id uuid;
  payload jsonb;
  saved jsonb;
  original_post jsonb;
  original_links jsonb;
  token timestamptz;
BEGIN
  IF has_function_privilege('anon', 'public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE') OR
     has_function_privilege('authenticated', 'public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE') OR
     NOT has_function_privilege('service_role', 'public.save_blog_post_with_tags(jsonb,jsonb,uuid,timestamptz)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Blog RPC privileges are not service-role only';
  END IF;

  INSERT INTO public.tags (name, slug) VALUES ('Project-owned tag', 'blog-collision') RETURNING id INTO shared_id;
  INSERT INTO public.projects (title, slug, status)
  VALUES ('Collision project', 'blog-collision-project', 'draft') RETURNING id INTO v_project_id;
  INSERT INTO public.project_tags (project_id, tag_id)
  VALUES (v_project_id, shared_id);
  INSERT INTO public.tags (name, slug) VALUES ('Occupied suffix', 'blog-collision-' || md5('Blog/Collision'));

  payload := jsonb_build_object(
    'title', 'Collision test', 'slug', 'blog-collision-test', 'summary', '',
    'content', 'Content', 'status', 'draft', 'cover_image_url', null,
    'cover_image_id', null, 'canonical_url', null, 'published_at', null,
    'reading_time_minutes', 1
  );
  saved := public.save_blog_post_with_tags(payload,
    jsonb_build_array(
      jsonb_build_object('name', 'Blog+Collision', 'slug', 'blog-collision'),
      jsonb_build_object('name', 'Blog+Collision', 'slug', 'blog-collision'),
      jsonb_build_object('name', 'Blog/Collision', 'slug', 'blog-collision'),
      jsonb_build_object('name', 'Project-owned tag', 'slug', 'blog-collision')
    ), null, null);
  post_id := (saved->'post'->>'id')::uuid;
  SELECT id INTO first_id FROM public.tags WHERE name = 'Blog+Collision';
  SELECT id INTO second_id FROM public.tags WHERE name = 'Blog/Collision';
  IF post_id IS NULL OR first_id IS NULL OR second_id IS NULL OR
     first_id = second_id OR first_id = shared_id OR second_id = shared_id OR
     (SELECT slug FROM public.tags WHERE id = first_id) <> 'blog-collision-' || md5('Blog+Collision') OR
     (SELECT slug FROM public.tags WHERE id = second_id) <> 'blog-collision-' || md5('Blog/Collision') || '-2' OR
     (SELECT name FROM public.tags WHERE id = shared_id) <> 'Project-owned tag' OR
     NOT EXISTS (SELECT 1 FROM public.project_tags WHERE project_id = v_project_id AND tag_id = shared_id) OR
     (SELECT count(*) FROM public.blog_post_tags WHERE blog_post_id = post_id) <> 3 THEN
    RAISE EXCEPTION 'Collision save renamed or merged tags, or duplicated links';
  END IF;

  token := (saved->'post'->>'updated_at')::timestamptz;
  saved := public.save_blog_post_with_tags(payload || '{"title":"Updated"}'::jsonb,
    jsonb_build_array(jsonb_build_object('name', 'Blog/Collision', 'slug', 'blog-collision'),
                      jsonb_build_object('name', 'Blog/Collision', 'slug', 'blog-collision')),
    post_id, token);
  IF saved->>'old_slug' <> payload->>'slug' OR
     (SELECT count(*) FROM public.blog_post_tags WHERE blog_post_id = post_id) <> 1 OR
     (SELECT tag_id FROM public.blog_post_tags WHERE blog_post_id = post_id) <> second_id OR
     (SELECT name FROM public.tags WHERE id = shared_id) <> 'Project-owned tag' THEN
    RAISE EXCEPTION 'Update did not replace links or preserve existing names';
  END IF;

  SELECT to_jsonb(p) INTO original_post FROM public.blog_posts p WHERE id = post_id;
  SELECT jsonb_agg(to_jsonb(t)) INTO original_links FROM public.blog_post_tags t WHERE blog_post_id = post_id;
  BEGIN
    PERFORM public.save_blog_post_with_tags(payload || '{"title":"Must roll back"}'::jsonb,
      jsonb_build_array(jsonb_build_object('name', 'New temporary tag', 'slug', 'new-temporary-tag'),
                        jsonb_build_object('name', 'Invalid', 'slug', '')),
      post_id, (saved->'post'->>'updated_at')::timestamptz);
    RAISE EXCEPTION 'Invalid tag was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Tag must contain a letter or number' THEN RAISE; END IF;
  END;
  IF (SELECT to_jsonb(p) FROM public.blog_posts p WHERE id = post_id) IS DISTINCT FROM original_post OR
     (SELECT jsonb_agg(to_jsonb(t)) FROM public.blog_post_tags t WHERE blog_post_id = post_id) IS DISTINCT FROM original_links OR
     EXISTS (SELECT 1 FROM public.tags WHERE name = 'New temporary tag') THEN
    RAISE EXCEPTION 'Failed tag save did not roll back post, links and tags';
  END IF;
END;
$$;

ROLLBACK;
