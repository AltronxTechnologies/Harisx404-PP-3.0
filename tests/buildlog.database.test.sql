\set ON_ERROR_STOP on

DO $$
DECLARE
  project_count integer;
  public_count integer;
  original_updated_at timestamptz;
  changed_updated_at timestamptz;
BEGIN
  SELECT count(*) INTO project_count FROM public.buildlog_projects;
  IF project_count <> 4 THEN
    RAISE EXCEPTION 'expected 4 seeded projects, got %', project_count;
  END IF;

  SELECT count(*) INTO public_count FROM public.public_buildlog_projects;
  IF public_count <> 4 THEN
    RAISE EXCEPTION 'expected 4 public projects, got %', public_count;
  END IF;

  IF has_table_privilege('anon', 'public.buildlog_projects', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read the Buildlog base table';
  END IF;
  IF has_table_privilege('authenticated', 'public.buildlog_projects', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must not read the Buildlog base table';
  END IF;
  IF NOT has_table_privilege('anon', 'public.public_buildlog_projects', 'SELECT') THEN
    RAISE EXCEPTION 'anon must be able to read the restricted public view';
  END IF;

  INSERT INTO public.buildlog_projects (
    name, tagline, info, current_version, items, display_order, status
  ) VALUES (
    'Draft visibility test',
    'Not public.',
    'This temporary row verifies published-only visibility.',
    'v0',
    '[{"title":"Hidden item","badge":"draft","done":false,"display_order":0}]'::jsonb,
    999,
    'draft'
  );

  SELECT count(*) INTO public_count FROM public.public_buildlog_projects;
  IF public_count <> 4 THEN
    RAISE EXCEPTION 'draft project leaked into the public view';
  END IF;

  SELECT updated_at INTO original_updated_at
  FROM public.buildlog_projects
  WHERE name = 'This Website';
  PERFORM pg_sleep(0.01);
  UPDATE public.buildlog_projects SET tagline = tagline WHERE name = 'This Website';
  SELECT updated_at INTO changed_updated_at
  FROM public.buildlog_projects
  WHERE name = 'This Website';
  IF changed_updated_at <= original_updated_at THEN
    RAISE EXCEPTION 'updated_at trigger did not advance';
  END IF;

  DELETE FROM public.buildlog_projects WHERE name = 'Draft visibility test';
END;
$$;
