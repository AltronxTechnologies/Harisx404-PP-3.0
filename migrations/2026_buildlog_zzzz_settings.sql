BEGIN;

CREATE TABLE IF NOT EXISTS public.buildlog_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  kicker TEXT NOT NULL,
  heading TEXT NOT NULL,
  heading_accent TEXT NOT NULL,
  description TEXT NOT NULL,
  archive_label TEXT NOT NULL,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT buildlog_settings_kicker_length CHECK (char_length(btrim(kicker)) BETWEEN 2 AND 80),
  CONSTRAINT buildlog_settings_heading_length CHECK (char_length(btrim(heading)) BETWEEN 2 AND 100),
  CONSTRAINT buildlog_settings_accent_length CHECK (char_length(btrim(heading_accent)) BETWEEN 1 AND 60),
  CONSTRAINT buildlog_settings_description_length CHECK (char_length(btrim(description)) BETWEEN 10 AND 300),
  CONSTRAINT buildlog_settings_archive_length CHECK (char_length(btrim(archive_label)) BETWEEN 2 AND 60),
  CONSTRAINT buildlog_settings_seo_title_length CHECK (char_length(btrim(seo_title)) BETWEEN 2 AND 100),
  CONSTRAINT buildlog_settings_seo_description_length CHECK (char_length(btrim(seo_description)) BETWEEN 10 AND 300)
);

ALTER TABLE public.buildlog_settings
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

UPDATE public.buildlog_settings
SET
  seo_title = COALESCE(seo_title, 'Buildlog | What I Ship'),
  seo_description = COALESCE(
    seo_description,
    'A project-by-project record of shipped features, releases, and carefully scoped next steps from Muhammad Haris.'
  );

ALTER TABLE public.buildlog_settings
  ALTER COLUMN seo_title SET NOT NULL,
  ALTER COLUMN seo_description SET NOT NULL,
  DROP CONSTRAINT IF EXISTS buildlog_settings_kicker_length,
  DROP CONSTRAINT IF EXISTS buildlog_settings_heading_length,
  DROP CONSTRAINT IF EXISTS buildlog_settings_accent_length,
  DROP CONSTRAINT IF EXISTS buildlog_settings_description_length,
  DROP CONSTRAINT IF EXISTS buildlog_settings_archive_length,
  DROP CONSTRAINT IF EXISTS buildlog_settings_seo_title_length,
  DROP CONSTRAINT IF EXISTS buildlog_settings_seo_description_length;

ALTER TABLE public.buildlog_settings
  ADD CONSTRAINT buildlog_settings_kicker_length
    CHECK (char_length(btrim(kicker)) BETWEEN 2 AND 80),
  ADD CONSTRAINT buildlog_settings_heading_length
    CHECK (char_length(btrim(heading)) BETWEEN 2 AND 100),
  ADD CONSTRAINT buildlog_settings_accent_length
    CHECK (char_length(btrim(heading_accent)) BETWEEN 1 AND 60),
  ADD CONSTRAINT buildlog_settings_description_length
    CHECK (char_length(btrim(description)) BETWEEN 10 AND 300),
  ADD CONSTRAINT buildlog_settings_archive_length
    CHECK (char_length(btrim(archive_label)) BETWEEN 2 AND 60),
  ADD CONSTRAINT buildlog_settings_seo_title_length
    CHECK (char_length(btrim(seo_title)) BETWEEN 2 AND 100),
  ADD CONSTRAINT buildlog_settings_seo_description_length
    CHECK (char_length(btrim(seo_description)) BETWEEN 10 AND 300);

ALTER TABLE public.buildlog_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.buildlog_settings FROM anon, authenticated;

INSERT INTO public.buildlog_settings (
  id, kicker, heading, heading_accent, description, archive_label,
  seo_title, seo_description
) VALUES (
  TRUE,
  'The build never stops',
  'Build. Ship.',
  'Evolve.',
  'A transparent record of what I shipped, what changed, and what I am building next across active projects.',
  'Release archive',
  'Buildlog | What I Ship',
  'A project-by-project record of shipped features, releases, and carefully scoped next steps from Muhammad Haris.'
)
ON CONFLICT (id) DO NOTHING;

DROP VIEW IF EXISTS public.public_buildlog_settings;
CREATE VIEW public.public_buildlog_settings
WITH (security_barrier = true)
AS
SELECT kicker, heading, heading_accent, description, archive_label,
  seo_title, seo_description
FROM public.buildlog_settings
WHERE id = TRUE;

REVOKE ALL ON TABLE public.public_buildlog_settings FROM PUBLIC;
GRANT SELECT ON TABLE public.public_buildlog_settings TO anon, authenticated;

DROP TRIGGER IF EXISTS set_buildlog_settings_updated_at
  ON public.buildlog_settings;
CREATE TRIGGER set_buildlog_settings_updated_at
BEFORE UPDATE ON public.buildlog_settings
FOR EACH ROW EXECUTE FUNCTION public.set_buildlog_updated_at();

COMMIT;
