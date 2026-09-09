BEGIN;

UPDATE public.certifications
SET issuer = 'Unknown issuer'
WHERE issuer IS NULL OR btrim(issuer) = '';

ALTER TABLE public.certifications
  ALTER COLUMN issuer SET NOT NULL;

COMMIT;
