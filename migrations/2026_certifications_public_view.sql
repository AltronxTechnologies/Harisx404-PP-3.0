BEGIN;

DROP VIEW IF EXISTS public.public_certifications;

CREATE VIEW public.public_certifications
WITH (security_barrier = true)
AS
SELECT
  id,
  title,
  issuer,
  issuer_logo_url,
  credential_id,
  credential_url
FROM public.certifications
WHERE status = 'published'
ORDER BY display_order ASC, issue_date DESC;

REVOKE ALL ON TABLE public.certifications FROM anon, authenticated;
DROP POLICY IF EXISTS "Public can view published certifications"
  ON public.certifications;

REVOKE ALL ON TABLE public.public_certifications FROM PUBLIC;
GRANT SELECT ON TABLE public.public_certifications TO anon, authenticated;

COMMIT;
