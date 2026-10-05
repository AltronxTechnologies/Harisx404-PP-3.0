\set ON_ERROR_STOP on
-- Apply 2026_project_admin_atomic_save.sql and then
-- 2026_project_admin_atomic_delete_with_token.sql on an isolated database.
-- All test writes are rolled back.
BEGIN;

DO $$
DECLARE
  target_id uuid;
  first_referrer uuid;
  second_referrer uuid;
  unrelated_id uuid;
  original_token timestamptz;
  current_token timestamptz;
  first_token timestamptz;
  second_token timestamptz;
  deleted jsonb;
  expected_slugs jsonb;
BEGIN
  IF has_function_privilege('anon', 'public.delete_project_and_unlink_related(uuid,timestamptz)', 'EXECUTE') OR
     has_function_privilege('authenticated', 'public.delete_project_and_unlink_related(uuid,timestamptz)', 'EXECUTE') OR
     NOT has_function_privilege('service_role', 'public.delete_project_and_unlink_related(uuid,timestamptz)', 'EXECUTE') OR
     EXISTS (
       SELECT 1 FROM pg_catalog.pg_proc p,
         pg_catalog.aclexplode(p.proacl) acl
       WHERE p.oid = 'public.delete_project_and_unlink_related(uuid,timestamptz)'::regprocedure
         AND acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Token-checked deletion privileges are not service-role only';
  END IF;
  IF to_regprocedure('public.delete_project_and_unlink_related(uuid)') IS NULL THEN
    RAISE EXCEPTION 'One-argument deletion overload was removed';
  END IF;

  INSERT INTO public.projects (slug, title, status)
  VALUES ('atomic-delete-target-' || gen_random_uuid(), 'Target', 'draft')
  RETURNING id, updated_at INTO target_id, original_token;
  INSERT INTO public.projects (slug, title, status, related_project_ids)
  VALUES ('atomic-delete-first-' || gen_random_uuid(), 'First', 'published', ARRAY[target_id])
  RETURNING id, updated_at INTO first_referrer, first_token;
  INSERT INTO public.projects (slug, title, status, related_project_ids)
  VALUES ('atomic-delete-second-' || gen_random_uuid(), 'Second', 'published', ARRAY[target_id])
  RETURNING id, updated_at INTO second_referrer, second_token;
  INSERT INTO public.projects (slug, title, status)
  VALUES ('atomic-delete-unrelated-' || gen_random_uuid(), 'Unrelated', 'draft')
  RETURNING id INTO unrelated_id;

  SELECT jsonb_agg(slug ORDER BY id) INTO expected_slugs
  FROM public.projects WHERE id IN (first_referrer, second_referrer);

  BEGIN
    PERFORM public.delete_project_and_unlink_related(target_id, NULL);
    RAISE EXCEPTION 'Null token was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'PROJECT_CONFLICT:%' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.delete_project_and_unlink_related(target_id, original_token - interval '1 second');
    RAISE EXCEPTION 'Stale token was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'PROJECT_CONFLICT:%' THEN RAISE; END IF;
  END;
  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = target_id) OR
     (SELECT related_project_ids FROM public.projects WHERE id = first_referrer) IS DISTINCT FROM ARRAY[target_id] OR
     (SELECT related_project_ids FROM public.projects WHERE id = second_referrer) IS DISTINCT FROM ARRAY[target_id] OR
     (SELECT updated_at FROM public.projects WHERE id = first_referrer) IS DISTINCT FROM first_token OR
     (SELECT updated_at FROM public.projects WHERE id = second_referrer) IS DISTINCT FROM second_token THEN
    RAISE EXCEPTION 'Rejected deletion modified target or referrers';
  END IF;

  UPDATE public.projects SET title = 'Edited target' WHERE id = target_id
  RETURNING updated_at INTO current_token;
  IF current_token <= original_token THEN
    RAISE EXCEPTION 'Target timestamp did not advance';
  END IF;
  BEGIN
    PERFORM public.delete_project_and_unlink_related(target_id, original_token);
    RAISE EXCEPTION 'Token from before edit was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'PROJECT_CONFLICT:%' THEN RAISE; END IF;
  END;
  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = target_id) OR
     (SELECT related_project_ids FROM public.projects WHERE id = first_referrer) IS DISTINCT FROM ARRAY[target_id] OR
     (SELECT related_project_ids FROM public.projects WHERE id = second_referrer) IS DISTINCT FROM ARRAY[target_id] THEN
    RAISE EXCEPTION 'Stale deletion after edit modified target or referrers';
  END IF;

  deleted := public.delete_project_and_unlink_related(target_id, current_token);
  IF (deleted->>'slug') NOT LIKE 'atomic-delete-target-%' OR
     deleted->'referring_slugs' IS DISTINCT FROM expected_slugs OR
     EXISTS (SELECT 1 FROM public.projects WHERE id = target_id) OR
     (SELECT related_project_ids FROM public.projects WHERE id = first_referrer) IS DISTINCT FROM ARRAY[]::uuid[] OR
     (SELECT related_project_ids FROM public.projects WHERE id = second_referrer) IS DISTINCT FROM ARRAY[]::uuid[] OR
     (SELECT updated_at FROM public.projects WHERE id = first_referrer) <= first_token OR
     (SELECT updated_at FROM public.projects WHERE id = second_referrer) <= second_token OR
     NOT EXISTS (SELECT 1 FROM public.projects WHERE id = unrelated_id) THEN
    RAISE EXCEPTION 'Token-checked deletion did not unlink and return referring slugs';
  END IF;
  BEGIN
    PERFORM public.delete_project_and_unlink_related(target_id, current_token);
    RAISE EXCEPTION 'Missing target was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'PROJECT_NOT_FOUND' THEN RAISE; END IF;
  END;

  deleted := public.delete_project_and_unlink_related(unrelated_id);
  IF (deleted->>'slug') NOT LIKE 'atomic-delete-unrelated-%' OR
     deleted->'referring_slugs' IS DISTINCT FROM '[]'::jsonb OR
     EXISTS (SELECT 1 FROM public.projects WHERE id = unrelated_id) THEN
    RAISE EXCEPTION 'One-argument deletion overload changed';
  END IF;
END;
$$;

ROLLBACK;
