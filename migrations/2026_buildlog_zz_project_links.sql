BEGIN;

ALTER TABLE public.buildlog_projects
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS live_url TEXT;

ALTER TABLE public.buildlog_projects
  DROP CONSTRAINT IF EXISTS buildlog_https_urls;

ALTER TABLE public.buildlog_projects
  ADD CONSTRAINT buildlog_https_urls CHECK (
    (github_url IS NULL OR github_url ~ '^https://') AND
    (live_url IS NULL OR live_url ~ '^https://')
  );

UPDATE public.buildlog_projects
SET
  github_url = COALESCE(github_url, 'https://github.com/harisx404/harisx404-portfolio'),
  live_url = COALESCE(live_url, 'https://harisx404.vercel.app')
WHERE lower(name) = lower('This Website');

UPDATE public.buildlog_projects
SET github_url = COALESCE(github_url, 'https://github.com/harisx404/MedicaLink-HMS')
WHERE lower(name) = lower('MedicaLink-HMS');

DROP VIEW IF EXISTS public.public_buildlog_projects;
CREATE VIEW public.public_buildlog_projects
WITH (security_barrier = true)
AS
SELECT
  id, name, tagline, info, current_version, github_url, live_url,
  display_order, items
FROM public.buildlog_projects
WHERE status = 'published'
ORDER BY display_order ASC, created_at DESC;

REVOKE ALL ON TABLE public.public_buildlog_projects FROM PUBLIC;
GRANT SELECT ON TABLE public.public_buildlog_projects TO anon, authenticated;

COMMIT;
