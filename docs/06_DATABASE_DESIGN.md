# ??? Database Design (Supabase PostgreSQL)

---

## 1. Design Principles

- All user-facing content lives in the database (no hardcoded data in code)
- Every table has `created_at` and `updated_at` timestamps
- Slugs are always URL-friendly lowercase with hyphens
- Status fields use text enums: `published`, `draft`, `archived`
- Images are stored as Cloudinary public_id references (NOT full URLs)
- Tags are shared across blogs and projects via many-to-many

---

## 2. Full Schema SQL

Run this in Supabase SQL Editor. Run in order — tables with foreign keys depend on earlier tables.

```sql
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
-- ARTICLE VIEWS (already exists — keep as-is)
-- =============================================
-- CREATE TABLE article_views (
--   slug TEXT PRIMARY KEY,
--   view_count INTEGER DEFAULT 0,
--   last_viewed_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================
-- ARTICLE REACTIONS (already exists — keep as-is)
-- =============================================
-- CREATE TABLE article_reactions (
--   id SERIAL PRIMARY KEY,
--   article_slug TEXT NOT NULL,
--   reaction_type TEXT NOT NULL,
--   count INTEGER DEFAULT 0,
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================
-- TOOLS (replaces app/data/toolbox.ts)
-- =============================================
CREATE TABLE tools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  logo_url TEXT,
  category TEXT NOT NULL,             -- e.g. Editor, Terminal, Design, Browser
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONNECTIONS (people — replaces hardcoded component data)
-- =============================================
CREATE TABLE connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  avatar_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  website_url TEXT,
  bio TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SPEAKING EVENTS (replaces hardcoded component data)
-- =============================================
CREATE TABLE speaking_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_url TEXT,
  talk_url TEXT,
  slides_url TEXT,
  event_date DATE,
  location TEXT,
  type TEXT,                           -- e.g. conference, podcast, webinar
  image_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
```

---

## 3. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaking_events ENABLE ROW LEVEL SECURITY;
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

CREATE POLICY "Public can view tools"
  ON tools FOR SELECT USING (true);

CREATE POLICY "Public can view connections"
  ON connections FOR SELECT USING (true);

CREATE POLICY "Public can view speaking events"
  ON speaking_events FOR SELECT USING (true);

CREATE POLICY "Public can view published changelog"
  ON changelog_entries FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view about sections"
  ON about_sections FOR SELECT USING (true);

CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT USING (true);

-- ADMIN: Full access (use service role key — never expose on client)
-- Admin operations use createSupabaseAdminClient() which uses the SERVICE_ROLE_KEY
-- No RLS policy needed for admin because service role bypasses RLS
```

---

## 4. Portability Plan

When you want to move from Supabase free to Supabase Pro (or any other PostgreSQL provider):

### Option A: Stay on Supabase (Upgrade Plan)
1. Go to Supabase dashboard ? Settings ? Billing
2. Upgrade to Pro ($25/month)
3. Done. Same database, same URLs, zero data loss.

### Option B: Move to another PostgreSQL provider (Neon, PlanetScale, Railway, etc.)
1. In Supabase: Settings ? Database ? Backups ? Download backup (.sql)
2. On new provider: Create a new PostgreSQL database
3. Run the SQL dump to restore all tables and data
4. Update `SUPABASE_URL` and keys in .env.local
5. Update Next.js to use new connection strings

### Option C: Self-hosted PostgreSQL (VPS, Docker)
1. Same as Option B but you host PostgreSQL yourself

**Key guarantee:** All your data is in standard PostgreSQL. The SQL schema in this file is 100% portable to any PostgreSQL database. You will NEVER lose data.
