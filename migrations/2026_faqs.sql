-- ============================================================
-- FAQs: admin-managed homepage FAQ section
-- Run this in the Supabase SQL editor (same as other migrations).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.faqs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question      text NOT NULL,
  answer        text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_visible    boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public homepage only ever reads visible FAQs.
-- Admin operations use the SERVICE_ROLE_KEY / authenticated session client.
DROP POLICY IF EXISTS "Public can view visible faqs" ON public.faqs;
CREATE POLICY "Public can view visible faqs"
  ON public.faqs FOR SELECT
  USING (is_visible = true);

-- Authenticated admin session (anon-key server client with a logged-in
-- user) needs full CRUD, mirroring how other admin tables behave.
DROP POLICY IF EXISTS "Authenticated users manage faqs" ON public.faqs;
CREATE POLICY "Authenticated users manage faqs"
  ON public.faqs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Keep updated_at fresh on edits.
CREATE OR REPLACE FUNCTION public.set_faqs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS faqs_updated_at ON public.faqs;
CREATE TRIGGER faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_faqs_updated_at();

-- Seed with the four FAQs currently hardcoded on the homepage.
INSERT INTO public.faqs (question, answer, display_order, is_visible)
SELECT * FROM (VALUES
  ('What kind of work are you available for?',
   'Full-time roles and freelance projects across web development, cybersecurity, and AI/ML — remote from Pakistan, shipping across every timezone.', 1, true),
  ('How do you approach security in your builds?',
   'Security is the architecture, not an afterthought: OWASP Top 10 mitigations, JWT auth in HTTP-only cookies, RBAC, and zero-trust defaults from the first commit.', 2, true),
  ('What does your typical stack look like?',
   'MERN and Next.js on the web side, Suricata/Wazuh/FastAPI for security tooling, and Python with TensorFlow/LangChain for AI work — all glued together with TypeScript and Supabase.', 3, true),
  ('How fast do you reply?',
   'Usually within 24 hours. Email itsharis.tech@gmail.com or use the contact page to book a call.', 4, true)
) AS seed(question, answer, display_order, is_visible)
WHERE NOT EXISTS (SELECT 1 FROM public.faqs);

-- Section-level switch: hide/show the entire FAQ section on the homepage.
-- The live site_settings table is a single row with named columns, so the
-- switch is a boolean column (defaults to visible).
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS show_faq_section boolean NOT NULL DEFAULT true;

-- Let the logged-in admin session flip the switch (no-op if RLS is off
-- or an equivalent policy already exists).
DROP POLICY IF EXISTS "Authenticated users update site settings" ON public.site_settings;
CREATE POLICY "Authenticated users update site settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
