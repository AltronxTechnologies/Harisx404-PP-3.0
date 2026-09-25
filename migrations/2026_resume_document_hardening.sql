BEGIN;

ALTER TABLE public.resume_document
  DROP CONSTRAINT IF EXISTS resume_document_state;

ALTER TABLE public.resume_document
  ADD CONSTRAINT resume_document_state CHECK (
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
  );

COMMIT;
