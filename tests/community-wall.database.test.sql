\set ON_ERROR_STOP on

DO $$
DECLARE
  published_id uuid;
  public_count integer;
  settings_count integer;
  original_updated_at timestamptz;
  changed_updated_at timestamptz;
  submitted_id uuid;
BEGIN
  INSERT INTO auth.users (id) VALUES ('00000000-0000-4000-8000-000000000001')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.messages (message, patternindex, rotation, user_id, creator_name, status)
  VALUES ('Published database fixture', 1, 0, '00000000-0000-4000-8000-000000000001', 'Test Visitor', 'published')
  RETURNING id INTO published_id;
  INSERT INTO public.messages (message, patternindex, rotation, user_id, creator_name, status)
  VALUES ('Pending database fixture', 2, 1, '00000000-0000-4000-8000-000000000001', 'Test Visitor', 'pending');
  INSERT INTO public.messages (message, patternindex, rotation, user_id, creator_name, status)
  VALUES ('Archived database fixture', 3, -1, '00000000-0000-4000-8000-000000000001', 'Test Visitor', 'archived');

  SELECT count(*) INTO public_count FROM public.public_community_wall_messages;
  IF public_count <> 1 THEN RAISE EXCEPTION 'expected one public note, got %', public_count; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'public_community_wall_messages' AND column_name = 'user_id') THEN
    RAISE EXCEPTION 'public Community Wall view exposes user_id';
  END IF;
  IF has_table_privilege('anon', 'public.messages', 'SELECT') OR has_table_privilege('authenticated', 'public.messages', 'SELECT') THEN
    RAISE EXCEPTION 'Community Wall base table is publicly readable';
  END IF;
  IF NOT has_table_privilege('anon', 'public.public_community_wall_messages', 'SELECT') THEN
    RAISE EXCEPTION 'anonymous users cannot read the restricted public view';
  END IF;

  SELECT count(*) INTO settings_count FROM public.public_community_wall_settings;
  IF settings_count <> 1 THEN RAISE EXCEPTION 'expected one public settings row, got %', settings_count; END IF;
  IF has_table_privilege('anon', 'public.community_wall_settings', 'SELECT') THEN
    RAISE EXCEPTION 'Community Wall settings base table is publicly readable';
  END IF;

  BEGIN
    INSERT INTO public.messages (message, creator_name) VALUES ('   ', 'Test');
    RAISE EXCEPTION 'blank Community Wall message was accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO public.messages (message, creator_name, patternindex) VALUES ('Invalid pattern', 'Test', 9);
    RAISE EXCEPTION 'invalid Community Wall pattern was accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO public.messages (message, creator_name, status) VALUES ('Invalid status', 'Test', 'spam');
    RAISE EXCEPTION 'invalid Community Wall status was accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE public.community_wall_settings SET seo_title = '   ' WHERE id = TRUE;
    RAISE EXCEPTION 'blank Community Wall settings text was accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  SELECT updated_at INTO original_updated_at FROM public.messages WHERE id = published_id;
  PERFORM pg_sleep(0.01);
  UPDATE public.messages SET status = 'archived' WHERE id = published_id;
  SELECT updated_at INTO changed_updated_at FROM public.messages WHERE id = published_id;
  IF changed_updated_at <= original_updated_at THEN RAISE EXCEPTION 'Community Wall updated_at trigger did not advance'; END IF;
  SELECT count(*) INTO public_count FROM public.public_community_wall_messages;
  IF public_count <> 0 THEN RAISE EXCEPTION 'archived note remains in public view'; END IF;

  DELETE FROM public.messages WHERE user_id = '00000000-0000-4000-8000-000000000001';
  DELETE FROM auth.users WHERE id = '00000000-0000-4000-8000-000000000001';

  INSERT INTO auth.users (id) VALUES ('00000000-0000-4000-8000-000000000003');
  submitted_id := public.submit_community_wall_message(
    '00000000-0000-4000-8000-000000000003', 'Atomic submission one', 0, 0,
    'Rate Test', NULL
  );
  BEGIN
    PERFORM public.submit_community_wall_message(
      '00000000-0000-4000-8000-000000000003', 'Too soon', 0, 0, 'Rate Test', NULL
    );
    RAISE EXCEPTION 'Community Wall cooldown was not enforced';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'cooldown' THEN RAISE; END IF;
  END;
  UPDATE public.messages SET created_at = clock_timestamp() - interval '2 minutes' WHERE id = submitted_id;
  PERFORM public.submit_community_wall_message(
    '00000000-0000-4000-8000-000000000003', 'Atomic submission two', 0, 0,
    'Rate Test', NULL
  );
  UPDATE public.messages SET created_at = created_at - interval '2 minutes'
    WHERE user_id = '00000000-0000-4000-8000-000000000003';
  PERFORM public.submit_community_wall_message(
    '00000000-0000-4000-8000-000000000003', 'Atomic submission three', 0, 0,
    'Rate Test', NULL
  );
  BEGIN
    PERFORM public.submit_community_wall_message(
      '00000000-0000-4000-8000-000000000003', 'Daily overflow', 0, 0, 'Rate Test', NULL
    );
    RAISE EXCEPTION 'Community Wall daily limit was not enforced';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'daily_limit' THEN RAISE; END IF;
  END;
  DELETE FROM public.messages WHERE user_id = '00000000-0000-4000-8000-000000000003';
  DELETE FROM auth.users WHERE id = '00000000-0000-4000-8000-000000000003';
END;
$$;
