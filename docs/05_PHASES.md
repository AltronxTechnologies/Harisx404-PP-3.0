# ??? Development Phases

**One phase at a time. Never start Phase N+1 until Phase N checklist is 100% complete.**

---

## Phase 0 — Audit, Docs, and Foundation Setup
**Status: IN PROGRESS**

### Goal
Understand the existing codebase, document everything, set up environment.

### Tasks
- [x] Run npm install and start dev server
- [x] Complete full project audit (01_AUDIT_REPORT.md)
- [x] Create all documentation files in docs/
- [ ] Fix 10 Velite MDX compile errors (passThrough config)
- [ ] Personalize all "Braydon Coyer" references to Haris/harisx404
  - [ ] Update app/data/siteMetadata.ts
  - [ ] Update app/layout.tsx (name, OG images)
  - [ ] Update app/page.tsx (hero text, bio)
  - [ ] Update app/about/page.tsx (full about content)
  - [ ] Remove Vemetric analytics token (replace with own or remove)
- [ ] Set up real Supabase project at supabase.com
- [ ] Add real Supabase URL + keys to .env.local
- [ ] Verify Supabase tables exist: article_views, article_reactions, community_wall

### Completion Criteria
- [ ] Site loads at localhost:3000 with no console errors
- [ ] All text is about Haris, not Braydon
- [ ] Supabase connection working (view count increments on blog visit)
- [ ] All docs/ files created and accurate

---

## Phase 1 — Database Design and Content Migration
**Status: PLANNED**

### Goal
Design the full database schema. Migrate blog content from MDX files to Supabase.
Keep Velite working temporarily during migration as a safety net.

### Tasks
- [ ] Create full Supabase schema (see docs/06_DATABASE_DESIGN.md)
  - [ ] blog_posts table
  - [ ] projects table
  - [ ] tags + blog_tags + project_tags tables
  - [ ] media table
  - [ ] tools table (replace toolbox.ts)
  - [ ] connections table (replace hardcoded data)
  - [ ] speaking_events table
  - [ ] changelog_entries table
  - [ ] site_settings table
- [ ] Write migration SQL and run in Supabase SQL editor
- [ ] Set up Row Level Security (RLS) policies
  - [ ] Public: SELECT only on published content
  - [ ] Admin: Full CRUD (authenticated + admin email check)
- [ ] Write migration script: MDX files ? Supabase blog_posts
  - [ ] Parse frontmatter (title, publishedAt, summary, imageName, categories, draft)
  - [ ] Store MDX body as content field
  - [ ] Mark all migrated posts as published/draft based on draft field
- [ ] Run migration script
- [ ] Verify all 64 blog posts in Supabase
- [ ] Update app/lib/utils.ts: replace velite imports with Supabase queries
- [ ] Update all blog pages to fetch from Supabase
- [ ] Remove Velite dependency (after verifying all content migrated)
- [ ] Fix the 10 MDX compile errors OR remove those files if migrated to DB

### Completion Criteria
- [ ] All blog posts in Supabase database
- [ ] /blog page renders from database, not MDX files
- [ ] /blog/[slug] renders from database
- [ ] Velite can be removed (or kept for local previewing only)
- [ ] No hardcoded content in component files

---

## Phase 2 — Dynamic Projects System
**Status: PLANNED**

### Goal
Replace the hardcoded 2-project array with a full dynamic projects system.

### Tasks
- [ ] Seed projects table with real project data
- [ ] Build /projects page (grid, filterable by tech/category)
- [ ] Build /projects/[slug] detail page
  - [ ] Title, description, long content
  - [ ] Images gallery (from Cloudinary)
  - [ ] Tech stack badges
  - [ ] Links (live URL, GitHub URL)
  - [ ] Related projects
- [ ] Add project filters (by category, by tech stack tag)
- [ ] Featured projects on homepage (pull top N from DB)

### Completion Criteria
- [ ] /projects pulls from database
- [ ] /projects/[slug] works for each project
- [ ] Filter works without page reload
- [ ] No hardcoded project data anywhere in code

---

## Phase 3 — Admin Dashboard
**Status: PLANNED**

### Goal
Build a full admin dashboard at /admin for managing all content.

### Tasks

#### Auth & Protection
- [ ] Update middleware.ts to protect all /admin/* routes
- [ ] Create /admin/login page with email/password + GitHub OAuth
- [ ] Add ADMIN_EMAIL env var check
- [ ] Test: non-admin cannot access /admin routes

#### Admin Shell
- [ ] Build admin layout: sidebar + topbar + main content area
- [ ] Sidebar nav: Dashboard, Blog, Projects, Media, About, Toolbox, Settings

#### Blog Management
- [ ] /admin/blog — list all posts (title, status, date, views)
- [ ] /admin/blog/new — create post with Tiptap rich text editor
  - [ ] Title, slug (auto-generated), summary, categories/tags
  - [ ] Content editor (WYSIWYG with markdown support)
  - [ ] Featured image picker (from media library)
  - [ ] Published / Draft toggle
  - [ ] Schedule publish date
  - [ ] SEO fields (canonical URL, OG image)
- [ ] /admin/blog/[slug] — edit existing post
- [ ] Delete post (with confirmation)

#### Project Management
- [ ] /admin/projects — list all projects
- [ ] /admin/projects/new — create project
  - [ ] Title, slug, description, long description
  - [ ] Tech stack tags
  - [ ] Live URL, GitHub URL
  - [ ] Image gallery (multi-image from media library)
  - [ ] Featured toggle (shows on homepage)
  - [ ] Published / Draft
- [ ] /admin/projects/[slug] — edit project

#### Media Library
- [ ] /admin/media — grid view of all uploaded images
- [ ] Upload new image (to Cloudinary)
- [ ] Copy Cloudinary URL
- [ ] Delete image

#### Other Sections
- [ ] /admin/about — edit about page content (rich text)
- [ ] /admin/toolbox — add/edit/delete tools
- [ ] /admin/connections — add/edit/delete people
- [ ] /admin/settings — update siteMetadata fields

#### Analytics
- [ ] /admin/analytics — top posts by views, reactions, recent comments

### Completion Criteria
- [ ] Admin cannot be accessed by non-admin users
- [ ] Can create, edit, delete blog posts from browser
- [ ] Can create, edit, delete projects from browser
- [ ] Can upload images to Cloudinary from browser
- [ ] All static data files replaced by DB-backed admin forms

---

## Phase 4 — AI Integration
**Status: PLANNED**

### Goal
Add AI features throughout the site using Google Gemini API.

### Tasks
- [ ] Set up Gemini API client in app/lib/gemini.ts
- [ ] **AI Writing Assistant** (admin blog editor)
  - [ ] "Improve this paragraph" button
  - [ ] "Suggest a title" based on content
  - [ ] "Generate summary" button
  - [ ] "Suggest tags/categories"
- [ ] **AI Search** on /blog page
  - [ ] Semantic search across all blog posts
  - [ ] "Did you mean..." suggestions
- [ ] **Related Content AI** (blog post page)
  - [ ] AI-powered related posts (beyond simple category matching)
- [ ] **AI Chatbot Widget**
  - [ ] Floating chat button on all public pages
  - [ ] Answers questions about Haris (based on site content)
  - [ ] "Ask me about my projects, blog, or experience"
- [ ] **AI Project Description Generator** (admin)
  - [ ] "Generate description from README URL" button

### Completion Criteria
- [ ] Gemini API key in .env.local
- [ ] Writing assistant working in blog editor
- [ ] Search uses AI on /blog
- [ ] Chatbot answers questions about Haris
- [ ] No hallucinations (chatbot grounded in actual site data)

---

## Phase 5 — Image and Media System
**Status: PLANNED**

### Goal
Move all images from public/ to Cloudinary. Set up proper next/image optimization.

### Tasks
- [ ] Create Cloudinary account and get credentials
- [ ] Create app/lib/cloudinary.ts helper
- [ ] Create /api/upload route for server-side Cloudinary upload
- [ ] Migrate existing public/ images to Cloudinary
  - [ ] Upload profile photos
  - [ ] Upload blog post images
  - [ ] Upload project images
  - [ ] Upload OG images
- [ ] Update all image references to use Cloudinary URLs
- [ ] Replace all raw <img> tags with next/image
- [ ] Set up Cloudinary transformations:
  - [ ] Blog thumbnails: 800x450, WebP, quality:80
  - [ ] Profile photos: 400x400, circle crop
  - [ ] OG images: 1200x630
- [ ] Add blur placeholder for all images (Cloudinary auto-blur)

### Completion Criteria
- [ ] Zero images stored in public/ (except icons/SVG)
- [ ] All images load from Cloudinary CDN
- [ ] next/image used everywhere
- [ ] Page load time improved (measure with Lighthouse)
- [ ] ADMIN: Can upload new images via media library

---

## Phase 6 — Design Refresh and Personalization
**Status: PLANNED (User-driven)**

### Goal
User will direct specific UI/design changes one at a time.
This phase has no predefined tasks — user will request changes in small batches.

### Guidelines for This Phase
- Make one design change at a time
- Test on mobile before moving to next change
- Never change the design system tokens without user approval
- Document each change in 02_WORKDONE.md

### Potential Areas (User to Confirm)
- Color scheme (current: indigo/blue, could change to a personal brand color)
- Homepage bento layout adjustments
- Typography changes
- Dark mode improvements
- Animation speed/style changes
- Mobile layout improvements

---

## Phase 7 — Performance, SEO, and Launch
**Status: PLANNED**

### Goal
Ensure the site is fast, SEO-optimized, and ready for production.

### Tasks

#### Performance
- [ ] Run Lighthouse on all main pages (target: 90+ all scores)
- [ ] Fix any Core Web Vitals failures (LCP, CLS, FID/INP)
- [ ] Add loading skeletons for all data-fetched sections
- [ ] Implement proper Next.js caching strategies
  - [ ] Static: /projects, /toolbox (revalidate: 3600)
  - [ ] Dynamic: /blog/[slug] (revalidate: 60)

#### SEO
- [ ] Verify sitemap.ts generates all pages correctly
- [ ] Add generateMetadata() to every page
- [ ] Add JSON-LD structured data:
  - [ ] Person schema on homepage/about
  - [ ] BlogPosting schema on each blog post
  - [ ] SoftwareApplication schema on project pages
- [ ] Update robots.ts
- [ ] Set up canonical URLs

#### Launch
- [ ] Deploy to Vercel
- [ ] Add all production env vars to Vercel
- [ ] Connect custom domain
- [ ] Test all routes in production
- [ ] Verify Supabase RLS works in production
- [ ] Set up Cloudinary production environment

### Completion Criteria
- [ ] Lighthouse Performance >= 90 on all pages
- [ ] No 404 errors on sitemap
- [ ] All metadata correct on every page
- [ ] Site live at custom domain
- [ ] Admin dashboard accessible and working in production
