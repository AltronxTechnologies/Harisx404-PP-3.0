BEGIN;

CREATE TABLE IF NOT EXISTS public.resume_document (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  is_configured BOOLEAN NOT NULL DEFAULT FALSE,
  storage_path TEXT,
  original_filename TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT resume_document_state CHECK (
    (
      storage_path IS NULL
      AND original_filename IS NULL
      AND mime_type IS NULL
      AND size_bytes IS NULL
    )
    OR
    (
      storage_path IS NOT NULL
      AND is_configured = TRUE
      AND original_filename IS NOT NULL
      AND char_length(btrim(original_filename)) BETWEEN 1 AND 180
      AND mime_type IS NOT NULL
      AND mime_type = 'application/pdf'
      AND size_bytes IS NOT NULL
      AND size_bytes BETWEEN 1 AND 10485760
    )
  )
);

ALTER TABLE public.resume_document ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.resume_document FROM anon, authenticated;

INSERT INTO public.resume_document (id, is_configured)
VALUES (TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_resume_document_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_resume_document_updated_at
  ON public.resume_document;
CREATE TRIGGER set_resume_document_updated_at
BEFORE UPDATE ON public.resume_document
FOR EACH ROW EXECUTE FUNCTION public.set_resume_document_updated_at();

DROP VIEW IF EXISTS public.public_resume_document;
CREATE VIEW public.public_resume_document
WITH (security_barrier = true)
AS
SELECT
  is_configured,
  storage_path IS NOT NULL AS is_active,
  original_filename,
  mime_type,
  size_bytes,
  updated_at
FROM public.resume_document
WHERE id = TRUE;

REVOKE ALL ON TABLE public.public_resume_document FROM PUBLIC;
GRANT SELECT ON TABLE public.public_resume_document TO anon, authenticated;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'resume-documents',
  'resume-documents',
  FALSE,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMIT;
