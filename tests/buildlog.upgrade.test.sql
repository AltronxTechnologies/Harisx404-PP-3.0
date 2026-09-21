\set ON_ERROR_STOP on

\ir ../migrations/2026_buildlog_projects.sql
\ir ../migrations/2026_buildlog_seed.sql
\ir ../migrations/2026_buildlog_zz_project_links.sql

UPDATE public.buildlog_projects
SET items = items || '[
  {
    "title":"Demo: shipped update preview",
    "description":"Temporary layout preview. Replace or remove this item from the Buildlog Admin before deployment.",
    "badge":"preview",
    "done":true,
    "display_order":99
  },
  {
    "title":"Demo: planned update preview",
    "description":"Temporary layout preview. Replace or remove this item from the Buildlog Admin before deployment.",
    "badge":"preview",
    "done":false,
    "display_order":100
  }
]'::jsonb;

INSERT INTO public.buildlog_projects (
  name, tagline, info, current_version, items, display_order, status, is_demo
) VALUES (
  'Preview-only migration fixture',
  'Temporary fixture.',
  'This row verifies preview-only temporary records are safely removed.',
  'preview',
  '[{
    "title":"Demo: shipped update preview",
    "description":"Temporary layout preview. Replace or remove this item from the Buildlog Admin before deployment.",
    "badge":"preview",
    "done":true,
    "display_order":0
  }]'::jsonb,
  999,
  'draft',
  TRUE
);

UPDATE public.buildlog_projects
SET
  github_url = 'https://github.com/harisx404/harisx404-portfolio',
  live_url = 'https://harisx404.vercel.app'
WHERE lower(name) = lower('This Website');

\ir ../migrations/2026_buildlog_zz_project_links.sql
\ir ../migrations/2026_buildlog_zzz_project_status.sql
\ir ../migrations/2026_buildlog_zzzz_settings.sql
\ir ../migrations/2026_buildlog_zzzzz_item_validation.sql

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.buildlog_projects AS project,
      jsonb_array_elements(project.items) AS item
    WHERE item->>'title' IN (
      'Demo: shipped update preview',
      'Demo: planned update preview'
    )
  ) THEN
    RAISE EXCEPTION 'historical Buildlog preview items survived the upgrade';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.buildlog_projects
    WHERE name = 'Preview-only migration fixture'
  ) THEN
    RAISE EXCEPTION 'preview-only temporary project survived the upgrade';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.buildlog_projects
    WHERE lower(name) = lower('This Website')
      AND (github_url IS NOT NULL OR live_url IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'historical dead website links survived the upgrade';
  END IF;
END;
$$;
