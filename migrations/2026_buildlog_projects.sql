BEGIN;

CREATE TABLE IF NOT EXISTS public.buildlog_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  info TEXT NOT NULL,
  current_version TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT buildlog_name_length CHECK (char_length(name) BETWEEN 2 AND 100),
  CONSTRAINT buildlog_tagline_length CHECK (char_length(tagline) BETWEEN 2 AND 120),
  CONSTRAINT buildlog_info_length CHECK (char_length(info) BETWEEN 10 AND 360),
  CONSTRAINT buildlog_version_length CHECK (char_length(current_version) BETWEEN 1 AND 40),
  CONSTRAINT buildlog_display_order CHECK (display_order >= 0),
  CONSTRAINT buildlog_status CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT buildlog_items_array CHECK (
    jsonb_typeof(items) = 'array' AND jsonb_array_length(items) BETWEEN 1 AND 50
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS buildlog_projects_name_idx
  ON public.buildlog_projects (lower(name));
CREATE INDEX IF NOT EXISTS buildlog_projects_public_order_idx
  ON public.buildlog_projects (status, display_order, created_at DESC);

ALTER TABLE public.buildlog_projects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.buildlog_projects FROM anon, authenticated;

DROP VIEW IF EXISTS public.public_buildlog_projects;
CREATE VIEW public.public_buildlog_projects
WITH (security_barrier = true)
AS
SELECT id, name, tagline, info, current_version, display_order, items
FROM public.buildlog_projects
WHERE status = 'published'
ORDER BY display_order ASC, created_at DESC;

REVOKE ALL ON TABLE public.public_buildlog_projects FROM PUBLIC;
GRANT SELECT ON TABLE public.public_buildlog_projects TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_buildlog_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_buildlog_updated_at ON public.buildlog_projects;
CREATE TRIGGER set_buildlog_updated_at
BEFORE UPDATE ON public.buildlog_projects
FOR EACH ROW EXECUTE FUNCTION public.set_buildlog_updated_at();

COMMIT;
