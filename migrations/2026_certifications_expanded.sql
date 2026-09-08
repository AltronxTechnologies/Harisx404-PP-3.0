BEGIN;

ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS issuer_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS badge_image_url TEXT,
  ADD COLUMN IF NOT EXISTS credential_id TEXT,
  ADD COLUMN IF NOT EXISTS expiration_date TEXT,
  ADD COLUMN IF NOT EXISTS does_not_expire BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.certifications
  DROP CONSTRAINT IF EXISTS certifications_category_check;

ALTER TABLE public.certifications
  ADD CONSTRAINT certifications_category_check CHECK (
    category IN ('Web Development', 'Cybersecurity', 'AI / ML', 'Cloud', 'Other')
  );

CREATE INDEX IF NOT EXISTS certifications_public_order_idx
  ON public.certifications (status, display_order, issue_date DESC);

DELETE FROM public.certifications
WHERE (title = 'Certified Ethical Hacking Fundamentals' AND issuer = 'Placeholder Academy')
   OR (title = 'Cloud Practitioner Essentials' AND issuer = 'Placeholder Cloud');

INSERT INTO public.certifications (
  title, issuer, issue_date, credential_url, display_order, status,
  issuer_logo_url, badge_image_url, credential_id, expiration_date,
  does_not_expire, description, skills, category, is_demo
)
SELECT * FROM (VALUES
  (
    'Demo: Cybersecurity Operations', 'Cisco Networking Academy', '2026-04-18',
    'https://example.com/', 10, 'published',
    'https://cdn.simpleicons.org/cisco/049FD9', 'https://cdn.simpleicons.org/cisco/049FD9', 'DEMO-CYBER-2026', NULL,
    TRUE, 'Hands-on security operations, network defense, incident analysis, and threat response fundamentals.',
    ARRAY['Network Security', 'Incident Response', 'Threat Analysis'], 'Cybersecurity', TRUE
  ),
  (
    'Demo: Full-Stack Web Engineering', 'Microsoft Learn', '2026-02-10',
    'https://example.com/', 20, 'published',
    'https://www.microsoft.com/favicon.ico', 'https://www.microsoft.com/favicon.ico', 'DEMO-WEB-2026', NULL,
    TRUE, 'Production-focused web engineering across frontend architecture, APIs, data, testing, and deployment.',
    ARRAY['React', 'TypeScript', 'APIs', 'Testing'], 'Web Development', TRUE
  ),
  (
    'Demo: Applied Machine Learning', 'Google for Developers', '2025-11-22',
    'https://example.com/', 30, 'published',
    'https://cdn.simpleicons.org/google/4285F4', 'https://cdn.simpleicons.org/google/4285F4', 'DEMO-AI-2025', '2028-11-22',
    FALSE, 'Applied machine-learning workflows covering model development, evaluation, responsible AI, and deployment.',
    ARRAY['Machine Learning', 'Model Evaluation', 'Responsible AI'], 'AI / ML', TRUE
  ),
  (
    'Demo: Cloud Infrastructure Foundations', 'Google Cloud', '2025-09-14',
    'https://example.com/', 40, 'published',
    'https://cdn.simpleicons.org/googlecloud/4285F4', 'https://cdn.simpleicons.org/googlecloud/4285F4', 'DEMO-CLOUD-2025', NULL,
    TRUE, 'Cloud architecture fundamentals spanning compute, networking, identity, observability, and reliable deployment.',
    ARRAY['Cloud Architecture', 'IAM', 'Observability'], 'Cloud', TRUE
  ),
  (
    'Demo: API Design and Testing', 'Postman Academy', '2025-07-08',
    'https://example.com/', 50, 'published',
    'https://cdn.simpleicons.org/postman/FF6C37', 'https://cdn.simpleicons.org/postman/FF6C37', 'DEMO-API-2025', NULL,
    TRUE, 'Practical API design, automated testing, documentation, collaboration, and production-quality delivery workflows.',
    ARRAY['API Design', 'Testing', 'Documentation'], 'Web Development', TRUE
  ),
  (
    'Demo: Secure Data Engineering', 'PostgreSQL Learning Lab', '2025-05-19',
    'https://example.com/', 60, 'published',
    'https://cdn.simpleicons.org/postgresql/4169E1', 'https://cdn.simpleicons.org/postgresql/4169E1', 'DEMO-DATA-2025', NULL,
    TRUE, 'Relational data modeling, secure access controls, query performance, migrations, and operational reliability.',
    ARRAY['PostgreSQL', 'Data Modeling', 'Access Control'], 'Other', TRUE
  )
) AS demo(
  title, issuer, issue_date, credential_url, display_order, status,
  issuer_logo_url, badge_image_url, credential_id, expiration_date,
  does_not_expire, description, skills, category, is_demo
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.certifications WHERE is_demo = TRUE
);

COMMIT;
