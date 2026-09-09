BEGIN;

UPDATE public.certifications
SET issuer = 'Unknown issuer'
WHERE issuer IS NULL OR btrim(issuer) = '';

ALTER TABLE public.certifications
  ALTER COLUMN issuer SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS certifications_issuer_title_idx
  ON public.certifications (issuer, title);

ALTER TABLE public.certifications
  DROP CONSTRAINT IF EXISTS certifications_status_check,
  DROP CONSTRAINT IF EXISTS certifications_display_order_check,
  DROP CONSTRAINT IF EXISTS certifications_title_length_check,
  DROP CONSTRAINT IF EXISTS certifications_issuer_length_check,
  DROP CONSTRAINT IF EXISTS certifications_https_urls_check,
  DROP CONSTRAINT IF EXISTS certifications_skills_count_check,
  DROP CONSTRAINT IF EXISTS certifications_expiration_check;

ALTER TABLE public.certifications
  ADD CONSTRAINT certifications_status_check
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD CONSTRAINT certifications_display_order_check
    CHECK (display_order >= 0),
  ADD CONSTRAINT certifications_title_length_check
    CHECK (char_length(title) BETWEEN 2 AND 140),
  ADD CONSTRAINT certifications_issuer_length_check
    CHECK (char_length(issuer) BETWEEN 2 AND 120),
  ADD CONSTRAINT certifications_https_urls_check CHECK (
    (credential_url IS NULL OR credential_url ~ '^https://') AND
    (issuer_logo_url IS NULL OR issuer_logo_url ~ '^https://') AND
    (badge_image_url IS NULL OR badge_image_url ~ '^https://')
  ),
  ADD CONSTRAINT certifications_skills_count_check
    CHECK (COALESCE(cardinality(skills), 0) <= 12),
  ADD CONSTRAINT certifications_expiration_check CHECK (
    does_not_expire = TRUE OR expiration_date IS NOT NULL
  );

COMMIT;
