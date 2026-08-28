# ?? Full Project Audit Report

**Date Audited:** 2026-08-12
**Audited By:** Antigravity AI Agent
**Project:** Harisx404-Personal-Portfolio (forked from braydoncoyer.dev)

---

## 1. What This Project Is

A Next.js 15 portfolio site downloaded from Braydon Coyer's open-source blogfolio. It has:
- Bento-card homepage layout with photos, about, blog, calendar, connections sections
- Blog system using Velite (MDX files compiled to static data at build time)
- Supabase backend for article view counts and reactions
- Spotify integration showing currently playing song
- GitHub OAuth via Supabase Auth
- Newsletter signup via Loops.so
- Static projects page (only 2 hardcoded projects)
- Changelog page (MDX based)
- Community wall (Supabase-backed)
- Connections/speaking bentos (hardcoded data in components)

---

## 2. Critical Problems Found

### 2.1 Content System (HIGH SEVERITY)
- **10 MDX blog files fail to compile** at build time due to `mdxTextExpression` nodes inside `rehype-raw` pipeline
- Velite builds despite errors but skips those 10 files
- All 64 blog posts are stored as flat `.mdx` files — no database, no admin panel to manage
- Content is locked to whoever has filesystem access — cannot post from browser

### 2.2 Projects Page (HIGH SEVERITY)
- `app/projects/page.tsx` has only 2 projects **hardcoded directly in the file**
- No images in the proper format (using plain `<img>` not `next/image`)
- No project detail pages
- No categories, tags, tech stack fields
- No way to add projects without editing source code

### 2.3 No Admin Dashboard (CRITICAL)
- Zero admin UI exists
- To post a blog: edit MDX file, push to Git, wait for build
- To add a project: edit source code, push, rebuild
- Not scalable, not user-friendly

### 2.4 Authentication (MEDIUM)
- Only GitHub OAuth exists (no email/password)
- No role-based access (anyone can trigger auth)
- No admin role checking — Supabase RLS policies assumed but not verified
- Community wall uses cookie-based visitor ID (fragile)

### 2.5 Database Design (HIGH SEVERITY)
- Supabase used only for: `article_views`, `article_reactions`, `community_wall`
- Blogs, projects, changelog are NOT in the database
- Cannot search, filter, or manage content from a dashboard
- Cannot transfer content easily if moving databases

### 2.6 Performance Issues
- First compile takes 40+ seconds in dev
- CSS 404 errors on hot reload (chunk versioning mismatch)
- No `next/image` usage in projects page (raw `<img>` tag)
- `SvgPatterns.tsx` is 67KB — massive file
- No image optimization pipeline
- `public/` contains 70+ unoptimized images (some over 1MB each)

### 2.7 Branding / Personalization (HIGH)
- All text still says "Braydon Coyer" — name, bios, social links, site URL
- OG images have Braydon's face
- Metadata, avatar, and resume point to Braydon's Cloudinary assets
- `siteMetadata.ts` still has Braydon's email, GitHub, LinkedIn

### 2.8 Static Data in Components (MEDIUM)
- `app/data/toolbox.ts` — all tools hardcoded as a static array
- Connections, speaking engagements hardcoded in component files
- Cannot update without code changes

### 2.9 No AI Integration
- Zero AI features anywhere
- No AI writing assistant for blogs
- No AI search
- No AI suggestions for related content
- No chatbot or FAQ

### 2.10 No Image/Media Strategy
- Images stored in `public/` — local files only
- Blog images referenced by name string (`imageName` field) — fragile
- No Cloudinary integration for media management
- Large unoptimized images slow page load

---

## 3. What Works Well

| Feature | Quality | Notes |
|---|---|---|
| Bento layout | ? Good | Creative, modern design |
| Blog MDX rendering | ? Good | Table of contents, code highlighting, reactions |
| Supabase view/reaction tracking | ? Good | Works correctly |
| Spotify integration | ? Good | Real-time currently playing |
| Velite content pipeline | ?? Fragile | Works but has MDX errors |
| Navbar / Footer | ? Good | Clean, responsive |
| Geist font | ? Good | Modern typography |
| Newsletter (Loops) | ? Good | Working signup |
| Sitemap / robots | ? Good | Auto-generated |
| OG image generation | ? Good | Via /api/og route |

---

## 4. What Needs To Be Built (New Features)

1. **Full Database Schema** — blogs, projects, skills, about, changelog, media all in Supabase
2. **Admin Dashboard** at `/admin` with:
   - Blog post editor (rich text + MDX support)
   - Project manager (CRUD with image upload)
   - About page editor
   - Skills/toolbox manager
   - Analytics overview
   - Media library
3. **Dynamic Content System** — all pages pull from DB, not files/hardcoded arrays
4. **Image Management** — Cloudinary for all uploaded images
5. **AI Features** — writing assistant, search, recommendations, chatbot
6. **Role-Based Auth** — admin-only routes, proper RLS policies
7. **Personalization** — all Braydon references replaced with Haris/harisx404
8. **Performance Hardening** — image optimization, code splitting, caching

---

## 5. Severity Summary

| Severity | Count | Items |
|---|---|---|
| CRITICAL | 1 | No admin dashboard |
| HIGH | 5 | Static projects, MDX errors, no DB design, branding, no images strategy |
| MEDIUM | 3 | Auth roles, static data in components, no AI |
| LOW | 2 | Performance, missing personalization |
