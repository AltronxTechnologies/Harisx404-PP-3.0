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
  ('twitter_url', 'https://x.com/harisx404');

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

-- BUILDLOG PROJECTS
CREATE OR REPLACE FUNCTION public.buildlog_items_all_done(value jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    bool_and(jsonb_typeof(item) = 'object' AND item->>'done' = 'true'),
    false
  )
  FROM jsonb_array_elements(value) AS item;
$$;

CREATE OR REPLACE FUNCTION public.buildlog_semver_valid(value text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  matched text[];
  identifier text;
BEGIN
  matched := regexp_match(
    btrim(value),
    '^v?([0-9]+)\.([0-9]+)(?:\.([0-9]+))?(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$'
  );
  IF matched IS NULL THEN RETURN false; END IF;
  IF (char_length(matched[1]) > 1 AND left(matched[1], 1) = '0')
     OR (char_length(matched[2]) > 1 AND left(matched[2], 1) = '0')
     OR (matched[3] IS NOT NULL AND char_length(matched[3]) > 1 AND left(matched[3], 1) = '0')
     THEN RETURN false; END IF;
  IF matched[4] IS NOT NULL THEN
    FOREACH identifier IN ARRAY string_to_array(matched[4], '.')
    LOOP
      IF identifier ~ '^[0-9]+$' AND char_length(identifier) > 1
         AND left(identifier, 1) = '0' THEN RETURN false; END IF;
    END LOOP;
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.buildlog_items_valid(value jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  item jsonb;
  item_count integer;
BEGIN
  IF jsonb_typeof(value) <> 'array' THEN RETURN false; END IF;
  item_count := jsonb_array_length(value);
  IF item_count < 1 OR item_count > 50 THEN RETURN false; END IF;
  FOR item IN SELECT * FROM jsonb_array_elements(value)
  LOOP
    IF jsonb_typeof(item) <> 'object' THEN RETURN false; END IF;
    IF jsonb_typeof(item->'title') <> 'string'
       OR char_length(btrim(item->>'title')) NOT BETWEEN 2 AND 160 THEN RETURN false; END IF;
    IF item ? 'description' AND item->'description' <> 'null'::jsonb
       AND (jsonb_typeof(item->'description') <> 'string'
         OR char_length(btrim(item->>'description')) > 400) THEN RETURN false; END IF;
    IF jsonb_typeof(item->'badge') <> 'string'
       OR char_length(btrim(item->>'badge')) NOT BETWEEN 1 AND 40 THEN RETURN false; END IF;
    IF jsonb_typeof(item->'done') <> 'boolean' THEN RETURN false; END IF;
    IF jsonb_typeof(item->'display_order') <> 'number'
       OR item->>'display_order' !~ '^\d+$'
       OR (item->>'display_order')::numeric > 10000 THEN RETURN false; END IF;
    IF item ? 'id' AND item->'id' <> 'null'::jsonb
       AND (jsonb_typeof(item->'id') <> 'string'
         OR item->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
       THEN RETURN false; END IF;
    IF (item->>'done')::boolean
       AND NOT public.buildlog_semver_valid(item->>'badge')
       THEN RETURN false; END IF;
  END LOOP;
  IF (SELECT count(DISTINCT element->>'display_order') FROM jsonb_array_elements(value) AS element) <> item_count
    THEN RETURN false; END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(value) AS element
    WHERE element ? 'id' AND element->'id' <> 'null'::jsonb
    GROUP BY element->>'id' HAVING count(*) > 1
  ) THEN RETURN false; END IF;
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END;
$$;

CREATE TABLE IF NOT EXISTS public.buildlog_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text NOT NULL,
  info text NOT NULL,
  current_version text NOT NULL,
  github_url text,
  live_url text,
  project_status text NOT NULL DEFAULT 'in_progress',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT buildlog_name_length CHECK (char_length(btrim(name)) BETWEEN 2 AND 100),
  CONSTRAINT buildlog_tagline_length CHECK (char_length(btrim(tagline)) BETWEEN 2 AND 120),
  CONSTRAINT buildlog_info_length CHECK (char_length(btrim(info)) BETWEEN 10 AND 360),
  CONSTRAINT buildlog_version_length CHECK (char_length(btrim(current_version)) BETWEEN 1 AND 40),
  CONSTRAINT buildlog_display_order CHECK (display_order >= 0),
  CONSTRAINT buildlog_status CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT buildlog_https_urls CHECK (
    (github_url IS NULL OR github_url ~ '^https://') AND
    (live_url IS NULL OR live_url ~ '^https://')
  ),
  CONSTRAINT buildlog_project_status CHECK (
    project_status IN ('in_progress', 'live', 'completed') AND
    (
      project_status <> 'completed' OR
      public.buildlog_items_all_done(items)
    )
  ),
  CONSTRAINT buildlog_items_array CHECK (
    public.buildlog_items_valid(items)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS buildlog_projects_name_idx
  ON public.buildlog_projects (lower(name));
CREATE INDEX IF NOT EXISTS buildlog_projects_public_order_idx
  ON public.buildlog_projects (status, display_order, created_at DESC);

ALTER TABLE public.buildlog_projects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.buildlog_projects FROM anon, authenticated;

DROP VIEW IF EXISTS public.public_buildlog_projects;
CREATE VIEW public.public_buildlog_projects
WITH (security_barrier = true)
AS
SELECT id, name, tagline, info, current_version, github_url, live_url, project_status, display_order, items
FROM public.buildlog_projects
WHERE status = 'published' AND is_demo = false
ORDER BY display_order ASC, created_at DESC;

REVOKE ALL ON TABLE public.public_buildlog_projects FROM PUBLIC;
GRANT SELECT ON TABLE public.public_buildlog_projects TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_buildlog_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_buildlog_updated_at ON public.buildlog_projects;
CREATE TRIGGER set_buildlog_updated_at
BEFORE UPDATE ON public.buildlog_projects
FOR EACH ROW EXECUTE FUNCTION public.set_buildlog_updated_at();

CREATE TABLE IF NOT EXISTS public.buildlog_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  kicker text NOT NULL,
  heading text NOT NULL,
  heading_accent text NOT NULL,
  description text NOT NULL,
  archive_label text NOT NULL,
  seo_title text NOT NULL,
  seo_description text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT buildlog_settings_kicker_length CHECK (char_length(btrim(kicker)) BETWEEN 2 AND 80),
  CONSTRAINT buildlog_settings_heading_length CHECK (char_length(btrim(heading)) BETWEEN 2 AND 100),
  CONSTRAINT buildlog_settings_accent_length CHECK (char_length(btrim(heading_accent)) BETWEEN 1 AND 60),
  CONSTRAINT buildlog_settings_description_length CHECK (char_length(btrim(description)) BETWEEN 10 AND 300),
  CONSTRAINT buildlog_settings_archive_length CHECK (char_length(btrim(archive_label)) BETWEEN 2 AND 60),
  CONSTRAINT buildlog_settings_seo_title_length CHECK (char_length(btrim(seo_title)) BETWEEN 2 AND 100),
  CONSTRAINT buildlog_settings_seo_description_length CHECK (char_length(btrim(seo_description)) BETWEEN 10 AND 300)
);

ALTER TABLE public.buildlog_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.buildlog_settings FROM anon, authenticated;

INSERT INTO public.buildlog_settings (
  id, kicker, heading, heading_accent, description, archive_label,
  seo_title, seo_description
) VALUES (
  true,
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
WHERE id = true;

REVOKE ALL ON TABLE public.public_buildlog_settings FROM PUBLIC;
GRANT SELECT ON TABLE public.public_buildlog_settings TO anon, authenticated;

DROP TRIGGER IF EXISTS set_buildlog_settings_updated_at
  ON public.buildlog_settings;
CREATE TRIGGER set_buildlog_settings_updated_at
BEFORE UPDATE ON public.buildlog_settings
FOR EACH ROW EXECUTE FUNCTION public.set_buildlog_updated_at();

-- COMMUNITY WALL
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 200),
  patternindex integer NOT NULL DEFAULT 0 CHECK (patternindex BETWEEN 0 AND 23),
  rotation integer NOT NULL DEFAULT 0 CHECK (rotation BETWEEN -3 AND 3),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  creator_name text NOT NULL DEFAULT 'Anonymous' CHECK (char_length(btrim(creator_name)) BETWEEN 1 AND 80),
  creator_avatar_url text CHECK (creator_avatar_url IS NULL OR creator_avatar_url ~ '^https://'),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('pending', 'published', 'archived')),
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_wall_public_order_idx ON public.messages (status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS community_wall_one_note_per_user_idx ON public.messages (user_id) WHERE user_id IS NOT NULL;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.messages FROM anon, authenticated;

DROP VIEW IF EXISTS public.public_community_wall_messages;
CREATE VIEW public.public_community_wall_messages WITH (security_barrier = true) AS
SELECT id, message, patternindex, creator_name, creator_avatar_url, created_at
FROM public.messages WHERE status = 'published' ORDER BY created_at DESC;
REVOKE ALL ON TABLE public.public_community_wall_messages FROM PUBLIC;
GRANT SELECT ON TABLE public.public_community_wall_messages TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_community_wall_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = clock_timestamp(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS set_community_wall_updated_at ON public.messages;
CREATE TRIGGER set_community_wall_updated_at BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.set_community_wall_updated_at();

CREATE OR REPLACE FUNCTION public.submit_community_wall_message(
  p_user_id uuid, p_message text, p_patternindex integer, p_rotation integer,
  p_creator_name text, p_creator_avatar_url text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE submitted_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  IF EXISTS (SELECT 1 FROM public.messages WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'already_submitted' USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.messages (message, patternindex, rotation, user_id, creator_name, creator_avatar_url, status, moderated_at)
  VALUES (p_message, p_patternindex, p_rotation, p_user_id, p_creator_name, p_creator_avatar_url, 'published', clock_timestamp())
  RETURNING id INTO submitted_id;
  RETURN submitted_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_community_wall_message(uuid, text, integer, integer, text, text) FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.submit_community_wall_message(uuid, text, integer, integer, text, text) TO service_role;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.community_wall_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  kicker text NOT NULL CHECK (char_length(btrim(kicker)) BETWEEN 2 AND 80),
  heading text NOT NULL CHECK (char_length(btrim(heading)) BETWEEN 2 AND 100),
  heading_accent text NOT NULL CHECK (char_length(btrim(heading_accent)) BETWEEN 1 AND 60),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 10 AND 300),
  collection_label text NOT NULL CHECK (char_length(btrim(collection_label)) BETWEEN 2 AND 60),
  sign_in_title text NOT NULL CHECK (char_length(btrim(sign_in_title)) BETWEEN 2 AND 100),
  sign_in_description text NOT NULL CHECK (char_length(btrim(sign_in_description)) BETWEEN 5 AND 200),
  composer_title text NOT NULL CHECK (char_length(btrim(composer_title)) BETWEEN 2 AND 100),
  composer_description text NOT NULL CHECK (char_length(btrim(composer_description)) BETWEEN 5 AND 200),
  empty_title text NOT NULL CHECK (char_length(btrim(empty_title)) BETWEEN 2 AND 100),
  empty_description text NOT NULL CHECK (char_length(btrim(empty_description)) BETWEEN 5 AND 240),
  seo_title text NOT NULL CHECK (char_length(btrim(seo_title)) BETWEEN 2 AND 100),
  seo_description text NOT NULL CHECK (char_length(btrim(seo_description)) BETWEEN 10 AND 300),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_wall_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.community_wall_settings FROM anon, authenticated;
INSERT INTO public.community_wall_settings (id, kicker, heading, heading_accent, description, collection_label, sign_in_title, sign_in_description, composer_title, composer_description, empty_title, empty_description, seo_title, seo_description)
VALUES (true, 'The wall remembers', 'Words that echo', 'always.', 'A collection of notes, hellos, and thoughtful messages left by visitors.', 'Visitor notes', 'Join the wall', 'Continue with GitHub or Google to leave one note on the wall.', 'Leave your mark', 'Share one thoughtful note. It appears immediately and can be managed by the site Admin.', 'The first note is waiting', 'Visitor messages will appear here.', 'Community Wall | Leave Your Mark', 'Read notes from visitors and leave one thoughtful message on Muhammad Haris''s community wall.') ON CONFLICT (id) DO NOTHING;
DROP VIEW IF EXISTS public.public_community_wall_settings;
CREATE VIEW public.public_community_wall_settings WITH (security_barrier = true) AS
SELECT kicker, heading, heading_accent, description, collection_label, sign_in_title, sign_in_description, composer_title, composer_description, empty_title, empty_description, seo_title, seo_description FROM public.community_wall_settings WHERE id = true;
REVOKE ALL ON TABLE public.public_community_wall_settings FROM PUBLIC;
GRANT SELECT ON TABLE public.public_community_wall_settings TO anon, authenticated;
DROP TRIGGER IF EXISTS set_community_wall_settings_updated_at ON public.community_wall_settings;
CREATE TRIGGER set_community_wall_settings_updated_at BEFORE UPDATE ON public.community_wall_settings
FOR EACH ROW EXECUTE FUNCTION public.set_community_wall_updated_at();
