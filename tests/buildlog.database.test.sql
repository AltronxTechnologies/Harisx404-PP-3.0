\set ON_ERROR_STOP on

DO $$
DECLARE
  project_count integer;
  public_count integer;
  original_updated_at timestamptz;
  changed_updated_at timestamptz;
  website_github_url text;
  website_live_url text;
  website_project_status text;
  medicalink_github_url text;
  settings_count integer;
BEGIN
  SELECT count(*) INTO project_count FROM public.buildlog_projects;
  IF project_count <> 4 THEN
    RAISE EXCEPTION 'expected 4 seeded projects, got %', project_count;
  END IF;

  SELECT count(*) INTO public_count FROM public.public_buildlog_projects;
  IF public_count <> 4 THEN
    RAISE EXCEPTION 'expected 4 public projects, got %', public_count;
  END IF;

  INSERT INTO public.buildlog_projects (
    name, tagline, info, current_version, items, display_order, status, is_demo
  ) VALUES (
    'Demo visibility test',
    'Never public.',
    'This temporary row verifies demo records cannot enter the public view.',
    'v1.0',
    '[{"title":"Demo shipped item","badge":"v1.0","done":true,"display_order":0}]'::jsonb,
    997,
    'published',
    TRUE
  );
  SELECT count(*) INTO public_count FROM public.public_buildlog_projects;
  IF public_count <> 4 THEN
    RAISE EXCEPTION 'demo project leaked into the public view';
  END IF;
  DELETE FROM public.buildlog_projects WHERE name = 'Demo visibility test';

  IF has_table_privilege('anon', 'public.buildlog_projects', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read the Buildlog base table';
  END IF;
  IF has_table_privilege('authenticated', 'public.buildlog_projects', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must not read the Buildlog base table';
  END IF;
  IF NOT has_table_privilege('anon', 'public.public_buildlog_projects', 'SELECT') THEN
    RAISE EXCEPTION 'anon must be able to read the restricted public view';
  END IF;
  IF has_table_privilege('anon', 'public.buildlog_settings', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read the Buildlog settings base table';
  END IF;
  IF NOT has_table_privilege('anon', 'public.public_buildlog_settings', 'SELECT') THEN
    RAISE EXCEPTION 'anon must be able to read public Buildlog settings';
  END IF;
  SELECT count(*) INTO settings_count FROM public.public_buildlog_settings;
  IF settings_count <> 1 THEN
    RAISE EXCEPTION 'expected one public Buildlog settings row, got %', settings_count;
  END IF;

  BEGIN
    UPDATE public.buildlog_settings SET seo_title = '   ' WHERE id = TRUE;
    RAISE EXCEPTION 'whitespace-only Buildlog settings text was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  SELECT github_url, live_url, project_status
  INTO website_github_url, website_live_url, website_project_status
  FROM public.public_buildlog_projects
  WHERE name = 'This Website';
  IF website_github_url IS NOT NULL OR website_live_url IS NOT NULL THEN
    RAISE EXCEPTION 'unverified website links must not be seeded';
  END IF;
  IF website_project_status IS DISTINCT FROM 'live' THEN
    RAISE EXCEPTION 'website lifecycle status was not seeded as live';
  END IF;

  SELECT github_url INTO medicalink_github_url
  FROM public.public_buildlog_projects
  WHERE name = 'MedicaLink-HMS';
  IF medicalink_github_url IS DISTINCT FROM 'https://github.com/harisx404/MedicaLink-HMS' THEN
    RAISE EXCEPTION 'verified MedicaLink GitHub URL was not seeded';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.buildlog_projects AS project,
      jsonb_array_elements(project.items) AS item
    WHERE item->>'title' LIKE 'Demo:%preview%'
  ) THEN
    RAISE EXCEPTION 'temporary preview items must not ship in production seed';
  END IF;

  BEGIN
    UPDATE public.buildlog_projects
    SET project_status = 'completed'
    WHERE name = 'PacketVision';
    RAISE EXCEPTION 'completed project with planned items was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.buildlog_projects (
      name, tagline, info, current_version, items, display_order, status
    ) VALUES (
      'Invalid item shape test',
      'Invalid fixture.',
      'This temporary row verifies database-level JSON item validation.',
      'v1.0',
      '[{"title":"x","badge":"shipped","done":true,"display_order":0}]'::jsonb,
      998,
      'draft'
    );
    RAISE EXCEPTION 'malformed Buildlog item was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.buildlog_projects (
      name, tagline, info, current_version, items, display_order, status
    ) VALUES (
      'Blank item title test',
      'Invalid fixture.',
      'This temporary row verifies trimmed database item validation.',
      'v1.0',
      '[{"title":"   ","badge":"v1.0","done":true,"display_order":0}]'::jsonb,
      998,
      'draft'
    );
    RAISE EXCEPTION 'whitespace-only Buildlog item title was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.buildlog_projects (
      name, tagline, info, current_version, items, display_order, status
    ) VALUES (
      'Leading zero core test',
      'Invalid fixture.',
      'This temporary row verifies semantic core identifier validation.',
      'v1.0',
      '[{"title":"Invalid release","badge":"v01.2.3","done":true,"display_order":0}]'::jsonb,
      998,
      'draft'
    );
    RAISE EXCEPTION 'semantic version with a leading-zero core identifier was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.buildlog_projects (
      name, tagline, info, current_version, items, display_order, status
    ) VALUES (
      'Leading zero prerelease test',
      'Invalid fixture.',
      'This temporary row verifies semantic prerelease identifier validation.',
      'v1.0',
      '[{"title":"Invalid release","badge":"1.2.3-01","done":true,"display_order":0}]'::jsonb,
      998,
      'draft'
    );
    RAISE EXCEPTION 'semantic version with a leading-zero prerelease identifier was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

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
