# ??? System Architecture

---

## 1. High-Level Architecture

```
Browser
  |
  +-- Next.js App Router (app/)
  ¦     +-- Public pages (/, /blog, /projects, /about, /contact)
  ¦     +-- Admin pages (/admin/*) — protected by middleware
  ¦     +-- API routes (/api/*)
  |
  +-- Supabase (PostgreSQL)
  ¦     +-- Database: blogs, projects, skills, media, site_config
  ¦     +-- Auth: admin user session
  ¦     +-- Realtime: reactions, views (optional)
  |
  +-- Cloudinary
  ¦     +-- Image storage, transform, CDN delivery
  |
  +-- Gemini API
        +-- AI writing assist, search, chatbot
```

---

## 2. Page Architecture

### Public Pages (No Auth Required)

| Route | Data Source | Rendering |
|---|---|---|
| `/` | Supabase (featured blogs, featured projects) | Server Component |
| `/blog` | Supabase (all published blogs) | Server Component + Client filter |
| `/blog/[slug]` | Supabase (single post + related) | Server Component |
| `/projects` | Supabase (all projects) | Server Component + Client filter |
| `/projects/[slug]` | Supabase (single project) | Server Component |
| `/about` | Supabase (about content) | Server Component |
| `/toolbox` | Supabase (tools list) | Server Component |
| `/connections` | Supabase (people data) | Server Component |
| `/speaking` | Supabase (speaking events) | Server Component |
| `/changelog` | Supabase (changelog entries) | Server Component |

### Admin Pages (Auth Required — Middleware Protected)

| Route | Purpose |
|---|---|
| `/admin` | Dashboard overview + analytics |
| `/admin/blog` | Blog post list + manage |
| `/admin/blog/new` | Create new blog post |
| `/admin/blog/[slug]` | Edit existing blog post |
| `/admin/projects` | Project list + manage |
| `/admin/projects/new` | Create new project |
| `/admin/projects/[slug]` | Edit existing project |
| `/admin/media` | Image/media library (Cloudinary) |
| `/admin/about` | Edit about page content |
| `/admin/toolbox` | Manage tools list |
| `/admin/connections` | Manage people connections |
| `/admin/settings` | Site settings, metadata |
| `/admin/analytics` | View counts, popular posts |

---

## 3. Database Architecture (Supabase PostgreSQL)

See `docs/06_DATABASE_DESIGN.md` for full schema.

### Core Tables
- `blog_posts` — all blog content with status, SEO fields
- `projects` — portfolio projects with tech stack, images
- `tags` — shared tags for blogs and projects
- `blog_tags` / `project_tags` — many-to-many relations
- `media` — Cloudinary image metadata
- `about_sections` — editable about page content
- `tools` — toolbox items (replaces `app/data/toolbox.ts`)
- `connections` — people data (replaces hardcoded component data)
- `speaking_events` — speaking engagement data
- `changelog_entries` — site changelog (replaces MDX files)
- `article_views` — view counts per article (already exists)
- `article_reactions` — reactions per article (already exists)
- `site_settings` — key-value store for site-wide config

---

## 4. Content Data Flow

### Blog Post Flow (Current — Static MDX)
```
Developer ? edit .mdx file ? git push ? Velite rebuild ? static data ? page renders
```

### Blog Post Flow (Target — Dynamic DB)
```
Admin ? /admin/blog/new ? Tiptap editor ? Supabase ? /blog/[slug] renders from DB
```

### Image Flow (Current)
```
Developer ? copy image to public/ ? reference by filename string in code
```

### Image Flow (Target)
```
Admin ? /admin/media ? upload to Cloudinary ? get URL + public_id ? stored in media table
? referenced by media_id in blog/project records ? rendered via next/image with Cloudinary URLs
```

---

## 5. Authentication & Authorization

### Auth Flow
```
/admin/* route ? middleware.ts checks Supabase session ? no session ? redirect /login
? /login ? Supabase Auth (email/password or GitHub OAuth) ? session cookie
? admin session valid ? allow access to admin routes
```

### Roles
- **Admin**: Can access all /admin/* routes, perform all CRUD operations
- **Public user**: Can react to articles, submit community wall notes (no login required for these)

### How Admin Is Determined
- Single admin user (yourself) — Supabase user with admin role
- `ADMIN_EMAIL` environment variable used to check if logged-in user is admin
- RLS (Row Level Security) on write operations to protect data

---

## 6. Folder Structure (Target State)

```
app/
+-- (public)/                  # Route group: public pages
¦   +-- page.tsx               # Homepage
¦   +-- blog/
¦   ¦   +-- page.tsx
¦   ¦   +-- [slug]/page.tsx
¦   +-- projects/
¦   ¦   +-- page.tsx
¦   ¦   +-- [slug]/page.tsx
¦   +-- about/page.tsx
¦   +-- toolbox/page.tsx
¦   +-- connections/page.tsx
¦   +-- speaking/page.tsx
¦   +-- changelog/page.tsx
+-- (admin)/                   # Route group: admin pages (protected)
¦   +-- admin/
¦       +-- layout.tsx         # Admin shell: sidebar + topbar
¦       +-- page.tsx           # Dashboard overview
¦       +-- blog/
¦       ¦   +-- page.tsx       # Blog list
¦       ¦   +-- new/page.tsx   # Create post
¦       ¦   +-- [slug]/page.tsx # Edit post
¦       +-- projects/
¦       ¦   +-- page.tsx
¦       ¦   +-- new/page.tsx
¦       ¦   +-- [slug]/page.tsx
¦       +-- media/page.tsx
¦       +-- about/page.tsx
¦       +-- toolbox/page.tsx
¦       +-- connections/page.tsx
¦       +-- settings/page.tsx
+-- api/
¦   +-- og/route.ts            # OG image generation
¦   +-- ai/
¦   ¦   +-- chat/route.ts      # AI chatbot endpoint
¦   ¦   +-- suggest/route.ts   # AI content suggestions
¦   +-- upload/route.ts        # Cloudinary upload handler
+-- components/                # Shared UI components
+-- lib/
¦   +-- supabase/              # Supabase clients
¦   +-- cloudinary.ts          # Cloudinary helpers
¦   +-- gemini.ts              # Gemini AI client
¦   +-- utils.ts               # General utilities
+-- middleware.ts              # Auth protection for /admin/*
```
