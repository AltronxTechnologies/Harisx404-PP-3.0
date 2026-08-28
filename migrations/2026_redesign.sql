-- =============================================
-- 2026 redesign migration
-- Adds testimonials + experience tables and new
-- project columns for the aayush-style rebuild.
-- Safe to re-run (IF NOT EXISTS everywhere).
-- =============================================

-- TESTIMONIALS
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  quote text NOT NULL,
  name text NOT NULL,
  role text,
  avatar_url text,
  display_order int DEFAULT 0,
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now()
);

-- EXPERIENCE
CREATE TABLE IF NOT EXISTS public.experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  company text,
  location text,
  start_date text,
  end_date text,
  bullets text[],
  display_order int DEFAULT 0,
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now()
);

-- PROJECTS: new columns for the redesigned cards/detail pages
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tech_stack text[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS year text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS features text[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS live_url text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS github_url text;

-- EXPERIENCE: per-role tech stack chips (2026 parity polish)
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS tech text[];

-- RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;

-- PUBLIC: Read published content only
DROP POLICY IF EXISTS "Public can view published testimonials" ON public.testimonials;
CREATE POLICY "Public can view published testimonials"
  ON public.testimonials FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Public can view published experience" ON public.experience;
CREATE POLICY "Public can view published experience"
  ON public.experience FOR SELECT
  USING (status = 'published');

-- ADMIN: Full access (use service role key — never expose on client)
-- Admin operations use the SERVICE_ROLE_KEY client which bypasses RLS,
-- so no explicit admin policy is needed (matches existing tables).

-- ARTICLE VIEWS (per-slug counters used by incrementViewCount / ViewCounter)
CREATE TABLE IF NOT EXISTS public.article_views (
  slug text PRIMARY KEY,
  view_count int NOT NULL DEFAULT 0,
  last_viewed_at timestamptz DEFAULT now()
);

-- SYSTEM LOGS (written by app/lib/logger.ts via the anon client)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- article_views is read/written only through the service-role client
-- (bypasses RLS), so no public policies are needed.

-- system_logs: the logger uses the anon client, so allow INSERT but no
-- SELECT for the public roles.
DROP POLICY IF EXISTS "Anon can insert system logs" ON public.system_logs;
CREATE POLICY "Anon can insert system logs"
  ON public.system_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- =============================================
-- 2026 redesign additions
-- Education + certifications shown on /about,
-- managed via /admin. Safe to re-run.
-- =============================================

-- EDUCATION
CREATE TABLE IF NOT EXISTS public.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  degree text NOT NULL,
  institution text,
  location text,
  start_year text,
  end_year text,
  description text,
  display_order int DEFAULT 0,
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now()
);

-- CERTIFICATIONS
CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  issuer text,
  issue_date text,
  credential_url text,
  display_order int DEFAULT 0,
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- PUBLIC: Read published content only
DROP POLICY IF EXISTS "Public can view published education" ON public.education;
CREATE POLICY "Public can view published education"
  ON public.education FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Public can view published certifications" ON public.certifications;
CREATE POLICY "Public can view published certifications"
  ON public.certifications FOR SELECT
  USING (status = 'published');

-- ADMIN: service-role client bypasses RLS (matches existing tables).
