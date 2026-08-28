-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TAGS (shared between blogs and projects)
-- =============================================
CREATE TABLE tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEDIA (Cloudinary images)
-- =============================================
CREATE TABLE media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,      -- Cloudinary public_id
  url TEXT NOT NULL,                   -- Full Cloudinary URL
  secure_url TEXT NOT NULL,            -- HTTPS URL
  width INTEGER,
  height INTEGER,
  format TEXT,                         -- jpg, png, webp
  bytes INTEGER,                       -- File size
  alt_text TEXT,
  folder TEXT,                         -- Cloudinary folder name
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BLOG POSTS
-- =============================================
CREATE TABLE blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,                        -- MDX/Markdown content body
  cover_image_id UUID REFERENCES media(id),  -- Featured image
  cover_image_url TEXT,                -- Fallback: direct URL (for migrated posts)
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived')),
  featured BOOLEAN DEFAULT FALSE,
  canonical_url TEXT,
  og_image_id UUID REFERENCES media(id),
  audio_file TEXT,                     -- Optional audio narration file path
  reading_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog post + tag join table
CREATE TABLE blog_post_tags (
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, tag_id)
);

-- Full text search index on blog posts
CREATE INDEX blog_posts_fts ON blog_posts
  USING gin(to_tsvector('english', title || ' ' || COALESCE(summary, '') || ' ' || COALESCE(content, '')));

-- =============================================
-- PROJECTS
-- =============================================
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,                    -- Short description (1-2 sentences)
  content TEXT,                        -- Long description / case study (MDX)
  cover_image_id UUID REFERENCES media(id),
  cover_image_url TEXT,                -- Fallback URL
  live_url TEXT,
  github_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived')),
  featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,     -- Manual sort order
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project gallery images (multiple images per project)
CREATE TABLE project_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project + tag join table
CREATE TABLE project_tags (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

-- =============================================
-- ARTICLE VIEWS (already exists � keep as-is)
-- =============================================
-- CREATE TABLE article_views (
--   slug TEXT PRIMARY KEY,
--   view_count INTEGER DEFAULT 0,
--   last_viewed_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================
-- ARTICLE REACTIONS (already exists � keep as-is)
-- =============================================
-- CREATE TABLE article_reactions (
--   id SERIAL PRIMARY KEY,
--   article_slug TEXT NOT NULL,
--   reaction_type TEXT NOT NULL,
--   count INTEGER DEFAULT 0,
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================
-- CHANGELOG ENTRIES (replaces MDX changelog files)
-- =============================================
CREATE TABLE changelog_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,                        -- MDX body
  image_url TEXT,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ABOUT CONTENT (editable about page sections)
-- =============================================
CREATE TABLE about_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,           -- e.g. 'bio', 'career_goals', 'interests'
  title TEXT,
  content TEXT,                        -- Rich text / MDX
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SITE SETTINGS (key-value store)
-- =============================================
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO site_settings (key, value) VALUES
  ('site_name', 'Haris | harisx404'),
  ('site_description', 'Full-stack developer, builder, blogger'),
  ('site_url', 'https://harisx404.dev'),
  ('author_name', 'Haris'),
  ('author_email', 'your@email.com'),
  ('github_url', 'https://github.com/harisx404'),
  ('linkedin_url', ''),
  ('twitter_url', '');

-- Enable RLS on all tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- PUBLIC: Read published content only
CREATE POLICY "Public can view published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view published projects"
  ON projects FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view all tags"
  ON tags FOR SELECT USING (true);

CREATE POLICY "Public can view media"
  ON media FOR SELECT USING (true);

CREATE POLICY "Public can view published changelog"
  ON changelog_entries FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view about sections"
  ON about_sections FOR SELECT USING (true);

CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT USING (true);

-- ADMIN: Full access (use service role key � never expose on client)
-- Admin operations use createSupabaseAdminClient() which uses the SERVICE_ROLE_KEY
-- No RLS policy needed for admin because service role bypasses RLS
-- =============================================
-- 2026 redesign additions
-- (mirrors migrations/2026_redesign.sql)
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

-- EXPERIENCE: LinkedIn-parity structured fields (see migrations/2026_experience_linkedin.sql)
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS location_type text;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS employment_type text;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS start_month int;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS start_year int;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS end_month int;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS end_year int;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT false;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]'::jsonb;

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
