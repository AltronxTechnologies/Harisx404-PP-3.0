# AI_GUIDE.md — Complete Project Guide for Any AI / Developer

> **READ THIS FIRST.** This is the master onboarding document for the
> `harisx404/p-site` repository. If you are an AI agent (Claude, Fable,
> Antigravity, Alloy, Cursor, etc.) or a human developer starting a new
> session, read this file top to bottom, then `PROJECT_PHASES.md` (the phase
> roadmap + status) and `MANUAL_TASKS.md` (owner-provided assets/credentials).
> Do not re-plan from scratch. Do not guess — everything you need is here.
>
> ⚠️ **BEFORE EDITING ANYTHING:** read `LOCKED_PERFECT.md`. Components listed
> there were approved as PERFECT by the owner and are FROZEN — never modify
> them (or shared CSS/constants they rely on) without the owner's explicit
> permission in the current conversation.
>
> 🔒 **`LOCKED_PERFECT.md` entry 22 is a HARD FREEZE** covering the Home page,
> Navbar, Search modal, Reach Out modal and Footer. Treat those as the design
> reference for everything else — match them, do not change them.
>
> 🧪 **`AUDIT_TESTING.md`** is the pre-lock audit protocol. The owner polishes
> and locks the site one page/component at a time; when they say
> **"Audit testing &lt;target&gt;"**, run all 12 phases in that file. It also holds
> the reference baseline (radius tiers, colour tokens, icon sizes, shared
> modules) extracted from the locked components.
>
> 🐛 **`DESIGN_DEBT.md`** lists known unfixed issues **and** an explicit list of
> differences that are *intentional* and must NOT be "fixed". Read it before
> any consistency work.

---

## 1. What this project is

A **personal portfolio website for Muhammad Haris** (GitHub: `harisx404`) —
full-stack developer & cybersecurity/AI enthusiast — with a complete
**self-hosted CMS admin panel** so the owner manages all content himself.

- **Design goal:** premium dark-first developer portfolio. The *visual design
  language* (layout, sections, typography, motion, colors) closely follows the
  style of modern portfolio sites the owner likes. **All content (text,
  photos, testimonials, projects, blog posts) is the owner's own or original
  placeholder copy — never copy another person's content, photos, name, or
  bios into this repo. Structure yes, content no.**
- **Everything dynamic:** every public section reads from Supabase and falls
  back to typed placeholder data when the DB is empty or unreachable. The
  owner replaces placeholders through `/admin`.

## 2. Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 18, server components) |
| Styling | Tailwind CSS 3 + CSS-variable design tokens |
| Motion | framer-motion (fade/slide `whileInView`, marquees, carousels) |
| Fonts | Geist Sans (body), Geist Mono (labels), Instrument Serif (display) |
| Database/Auth | Supabase (Postgres + RLS + Auth) — schema in `supabase_schema.sql` + `migrations/` |
| Media | Cloudinary (via `/admin/media`) |
| AI | Google Gemini (`app/api/ai/*`: chat widget, semantic search, admin assist) |
| Content | Blog/changelog stored in Supabase; MDX rendering via next-mdx-remote |
| Dev env | Docker Compose (`docker-compose.alloy.yaml`), Node 22, port 3000 |

## 3. Design system (MUST follow — never deviate)

1. **Colors: tokens only.** Use `bg-bg-primary`, `border-border-primary`,
   `text-text-primary` / `-secondary` / `-tertiary` (CSS vars in
   `app/globals.css` under `:root` and `.dark`). Dark palette: `#08090c`
   background, `#1e2129` borders. Never hardcode grays/zinc for new UI.
2. **Themes:** dark is default (`ThemeProvider defaultTheme="dark"` in
   `app/layout.tsx`); light mode must always look correct. Toggle lives in
   the navbar (`app/components/ThemeToggle.tsx`).
3. **Typography:**
   - Display headings: `font-display` (Instrument Serif). Hero ~text-6xl→8xl,
     section titles text-4xl→5xl.
   - Accent words inside headings: *italic* + `.text-gradient-accent`
     (blue→violet→pink) or `.text-gradient-pink`.
   - Kickers (small labels above headings): `font-mono text-xs uppercase
     tracking-[0.35em] text-text-tertiary` — use the shared
     `app/components/home/SectionHeading.tsx` (centered by default).
4. **Cards:** `rounded-3xl border border-border-primary bg-white
   dark:bg-white/[0.02]`; hover = border brighten + shadow/opacity ONLY
   (no scale/translate that shifts layout).
5. **Motion:** framer-motion, `whileInView` + `viewport={{ once: true }}`,
   fade + y≈24px, duration ~0.6s easeOut, stagger 0.08–0.12s. Marquees use
   the `animate-marquee` / `animate-marquee-reverse` Tailwind animations.
6. **Layout gotcha (critical):** root layout uses
   `lg:grid-cols-[32px_minmax(0,1fr)_32px]` with `min-w-0` on the middle
   column. Any wide/scrolling element (marquee, chip row) MUST sit inside an
   `overflow-hidden` parent and grid items need `min-w-0`, or the entire page
   overflows horizontally. This bug happened once — don't reintroduce it.
7. **Data pattern:** server components fetch via null-safe helpers in
   `app/lib/utils.ts` (all guard on `getPublicSupabase()` returning null) and
   fall back to typed arrays in `app/data/fallback-home.ts` or local
   fallbacks. Every new dynamic section must follow this pattern so the site
   never crashes or looks empty without a DB.

## 4. Repository map

```
app/
  layout.tsx            # fonts, ThemeProvider(dark), side-hatch grid, Navbar/Footer
  globals.css           # tokens (:root/.dark), gradient & kicker utilities
  page.tsx              # homepage (fetch projects/posts/testimonials → sections)
  components/
    Navbar.tsx          # floating pill nav + mega menu + ⌘K + theme toggle + logo
    Footer.tsx          # 4-column footer
    ThemeToggle.tsx, ThemeProvider.tsx
    BlogCard.tsx        # shared blog card (home + /blog)
    ReadingProgress.tsx # blog post top progress bar
    home/               # HomeHero, StatusRow, HomeBento, TechMarquee,
                        # CaseStudies (+CaseStudyCard), Writings, AboutTeaser,
                        # Testimonials, MySiteGrid, CtaSection, SectionHeading
    admin/              # Sidebar, ProjectForm, TestimonialForm, ExperienceForm...
  about/                # page.tsx (fetch) + AboutView.tsx (sections + #experience)
  projects/             # index + ProjectsIndex (filter) + [slug] + ProjectDetail
  blog/                 # index, category/[category], [slug] (MDX pipeline intact)
  admin/(dashboard)/    # blogs, projects, changelogs, testimonials, experience,
                        # logs, media, settings, about
  api/admin/*           # CRUD routes (service-role client, session-checked)
  api/ai/*              # chat, search, assist, project-from-github (Gemini)
  lib/
    utils.ts            # fetchProjects/BlogPosts/Testimonials etc (null-safe)
    supabase/safe.ts    # getSupabaseEnv/getPublicSupabase (never crash w/o env)
    supabase/server.ts  # cookie client + admin client
    logger.ts           # console + system_logs (skips DB when unconfigured)
  data/fallback-home.ts # placeholder projects/posts/testimonials (owner replaces)
middleware.ts           # admin auth guard; skips auth when Supabase unconfigured
supabase_schema.sql     # full schema (+ "2026 redesign additions" section)
migrations/2026_redesign.sql  # testimonials/experience tables + project columns
scripts/seed-initial-data.mjs # seeds settings + placeholders (idempotent)
docker-compose.alloy.yaml     # dev stack (node:22, host network, port 3000)
.alloy/populate-env.sh        # idempotent .env.local bootstrap
PROJECT_PHASES.md       # phase roadmap + current status (UPDATE EVERY SESSION)
MANUAL_TASKS.md         # owner-only tasks (keys, photos, images, email)
AI_GUIDE.md             # this file
```

## 5. How to run (any environment with Docker)

```sh
bash .alloy/populate-env.sh                       # creates .env.local (safe defaults)
docker compose -f docker-compose.alloy.yaml up -d # dev server on :3000
# type-check inside the container:
docker compose -f docker-compose.alloy.yaml exec -T web npx tsc --noEmit
```

Without Supabase credentials the app still fully renders using fallback
content (by design). With real credentials in `.env.local` everything becomes
dynamic. Real values needed: see `MANUAL_TASKS.md` §1.

## 6. Database & admin model

Content tables (all admin-managed, public read = `status='published'` RLS):
- `blog_posts` (+ `tags`, `blog_post_tags`) → /blog
- `projects` (now incl. tagline, tech_stack[], category, year, features[],
  live_url, github_url) → home case studies + /projects
- `changelogs` → /changelog
- `testimonials` (headline, quote, name, role, avatar_url, order) → home carousel
- `experience` (role, company, location, dates, bullets[], order) → /about timeline
- `site_settings`, `about_content`, `system_logs`, community wall tables

Admin panel: `/admin` (Supabase auth; optional `ADMIN_EMAIL` allow-list in
middleware). Each content type has list/new/[id] pages + `/api/admin/*` route.

## 7. Rules for any AI working here

1. Work ONLY on the branch the owner designates (never commit to `main`).
2. Read `PROJECT_PHASES.md`, pick the first unchecked item, implement, then
   update its checkbox + the "Current status" block **in the same commit**.
3. Validate before committing: docker tsc (above) + load the changed pages in
   a browser in **both** dark and light themes; check the console for errors.
4. Never break: admin panel, `/api/*` routes, middleware auth, MDX blog
   pipeline, or the null-safe fallback pattern.
5. Original content only. Match design patterns, never copy another site's
   text/images/personal data. Leave labeled placeholders ("Add photo in
   admin") for anything requiring owner assets.
6. Conventional commits (`feat(scope): ...`, `fix:`, `docs:`). Push after each
   completed phase. Add a session entry to the log below (§9).
7. If something is ambiguous, prefer the existing pattern in the codebase over
   inventing a new one (search for a similar component/route first).

## 8. Current state & what remains

**Done (Phases 0–6):** infra + env resilience; design system + theming;
homepage (all sections, polished: segmented testimonial tabs, bento visuals,
CTA glows); About (bio, experience timeline, marquee, interests); Projects
index + detail (filters, highlights, prev/next, JSON-LD); Blog restyle
(featured card, category pages, post header, reading progress); /uses;
footer; navbar logo + theme toggle; /guestbook→/community-wall redirect;
testimonials & experience tables + admin CRUD + project columns + seeds.

**Remaining (see PROJECT_PHASES.md for full specs):**
- Phase 7 — harmonize changelog/community-wall/connections/links/speaking/
  stats/toolbox pages; add /attribution, /legal/privacy, /legal/terms; RSS
  route; 404 restyle; fix footer Privacy link.
- Phase 8 — AI polish (needs GEMINI_API_KEY): chatbot context, ⌘K search
  wiring, blog embeddings/pgvector, admin AI assist.
- Phase 9 — final gate: `npm run build` clean, sitemap/robots audit, per-page
  OG images, JSON-LD for articles, Lighthouse ≥90, 390px mobile pass, both-
  theme QA on every page, remove root junk files (fix-dark-mode*.mjs,
  scratch.md, duplicate lockfile).
- Owner tasks — `MANUAL_TASKS.md`: Supabase/Gemini keys, run migration + seed,
  real photos/project images/logos via /admin/media, contact email, domain.

## 9. Session log (append a dated entry every session)

### 2026-08-14 — Session 1 (Alloy / initial setup)
- Cloned empty repo state → later reset onto real `main` app.
- Built Alloy Docker dev environment (`docker-compose.alloy.yaml`,
  `.alloy/environment.json` port 3000, `.alloy/populate-env.sh`).
- Made app boot without Supabase env: `app/lib/supabase/safe.ts` + guards in
  utils/logger/middleware.

### 2026-08-14 — Session 2 (redesign, same day)
- Phases 1–2: design tokens (dark `#08090c`), Instrument Serif, gradient
  utilities, theme toggle; complete homepage rebuild (hero, status row,
  bento, case studies, writings, about teaser, testimonials, my-site grid,
  CTA band, footer, /uses). Fixed page-wide overflow caused by marquee
  min-width propagation (see §3.6).
- Phases 3–4: About page (AboutView, experience timeline, TechMarquee) and
  Projects index/detail (CaseStudyCard extraction, filters, highlights,
  prev/next, CreativeWork JSON-LD).
- Phase 5: Blog restyle (shared BlogCard, featured layout, category page,
  post header, ReadingProgress bar).
- Visual parity polish: segmented testimonial progress tabs, StatusRow arrow
  icons, bento decorative visuals (avatar cluster, Meets-Deadlines mini-card,
  city chips), AboutTeaser visual column, CTA glows + arrow-swap button,
  shared SectionHeading; navbar top-left logo; /guestbook redirect.
- Phase 6: `migrations/2026_redesign.sql` (+ schema append), testimonials &
  experience admin CRUD + API routes + sidebar links, extended ProjectForm +
  projects API for new columns, `fetchTestimonials()` wired to homepage,
  seed script updated (idempotent).
- Docs: PROJECT_PHASES.md, MANUAL_TASKS.md, AI_GUIDE.md (this file).
- All validated: docker tsc clean, pages 200, both themes, no console errors.

### 2026-08-14 — Session 2 continued (parity & quality audit)
- Motion/parity upgrade: draggable polaroid photo stack in hero (drag inertia,
  polaroid frames), availability radar badge, rotating role titles, spring
  hover lifts (stiffness 400 / damping 30 / mass 0.8) + 0.05 stagger across
  home sections, bento glass rings + ambient gradients, CTA center spotlight,
  390px responsiveness fixes (StatusRow 2-col base, 44px touch targets, hero
  sizes step down; zero horizontal overflow verified).
- SEO/quality: metadata on all remaining routes, WebSite JSON-LD (layout),
  BlogPosting image fix, /api/og fallbacks for project pages, sitemap covers
  all 15 static routes + dynamic slugs, robots cleanup, `next build` passes
  (55 routes; use `NEXT_DIST_DIR=.next-build npx next build` to avoid
  clobbering the dev server). Deleted root junk scripts + bun.lockb.

### 2026-08-14 — Session 2 continued (Phase 9 QA gate)
- Dark-mode fixes: Button outline variant, stats browser-chrome bars,
  community-wall mobile fade. A11y: aria-hidden on decorative hero cards;
  verified aria-labels on toggle/tabs/pause. Link matrix: all routes 200
  (guestbook 307 redirect as designed). 390px static audit: no offenders.
- Phase 9 marked done except Lighthouse (pending real assets). Remaining:
  Phase 8 (blocked on GEMINI_API_KEY) + owner asset upload via /admin/media.

### 2026-08-15 — Session 2 continued (live credentials + Phase 8)
- Owner provided real credentials → `.env.local` (gitignored, never committed).
  Supabase is LIVE: base schema exists; seed ran (settings/about/tools/projects
  seeded). testimonials/experience tables still missing — owner must run
  `migrations/2026_redesign.sql` in the Supabase SQL editor (REST can't do DDL).
- Phase 8 done (except embeddings): chat route rewritten with site-aware
  system prompt built from live DB (site_settings row table, projects, latest
  posts; ≤4k chars) + graceful Gemini 503 retry messages; ⌘K SearchModal now
  calls /api/ai/search (debounced) with keyword ILIKE fallback when pgvector
  is absent; admin AI assist route hardened with ADMIN_EMAIL check.
  Embeddings blocked on pgvector migration + published posts.
- Note: Gemini env var is GOOGLE_AI_API_KEY (app/lib/gemini.ts).

### 2026-08-15 — Session 2 continued (owner playbook)
- MANUAL_TASKS.md rewritten as a detailed 8-step launch playbook (migration,
  reseed, admin login, content replacement, email/legal, embeddings, key
  rotation + deploy, final QA) with env-var reference and done-tracking.
- All code phases are complete; remaining work is owner-side (Steps 1–8) plus
  the hero/about photo swap once real image URLs exist.

### 2026-08-15 — Session 2 continued (brand assets + migration live)
- Owner added static assets: /harisx404.png photo + /brand logos. Wired:
  navbar/footer logo circles (brand/icon.png), favicons + apple-touch + OG
  (brand/logo-wide.png), hero front polaroid photo, About photo stack,
  AboutTeaser visual — all next/image optimized.
- Owner ran migrations/2026_redesign.sql; seed re-run: testimonials +
  experience now LIVE from DB (verified on / and /about). Owner's real
  projects + blog posts also live. Search remains keyword mode until pgvector
  extension + embeddings run (MANUAL_TASKS Step 6).

### 2026-08-15 — Session 2 continued (email, cleanup, avatars)
- Real contact email (itsharis.tech@gmail.com) wired into hero + CTA buttons.
- Deleted 31 unused legacy template images from public/ (~8.8 MiB freed),
  reference-checked. (2026-08-21 update: /speaking, /connections, /uses,
  /toolbox, /bucket-list pages removed entirely along with the template
  author's photos — the legacy-asset concern below is resolved
  that content; tracked in MANUAL_TASKS + docs/14_PENDING_CONTENT_UPDATES.md).
- Testimonials carousel now renders `avatar_url` from DB automatically
  (falls back to initials when empty) — no code needed when owner adds URLs.
- MANUAL_TASKS.md now includes the "content you'll add later" reference table
  (images, locations, specs).

### 2026-08-15 — Session 2 continued (blog 500 hotfix)
- CRITICAL FIX: all /blog/[slug] pages 500'd once real posts existed —
  next-mdx-remote v6's RSC entry pulls a mismatched React jsx-runtime under
  React 18. Rewrote app/components/mdx.tsx to compile MDX with @mdx-js/mdx
  evaluate() using the server's own jsx-runtime; also fixed client-proxy
  component map (added named exports in mdx-components.tsx) and allowed
  cdn.hashnode.com images. No new packages.
- Added missing `article_views` + `system_logs` tables to
  migrations/2026_redesign.sql + schema (OWNER: re-run the migration file in
  Supabase SQL editor to create them). Logger + view counter now warn once
  (not per-request) when a table is missing.

### 2026-08-15 — Session 2 continued (full audit)
- Rule sweep: converted the three remaining hardcoded light-only pill buttons
  (CtaSection "Get In Touch", ProjectDetail "Visit Live") from
  `bg-white text-slate-900` to token-inverted `bg-text-primary text-bg-primary`
  (was invisible on the light theme). Marquee/overflow + hover rules verified
  clean elsewhere.
> ⚠️ **Accuracy note (2026-09-01):** the "deleted 22 components" list below is
> **stale**. `ConnectionsBento` and `SocialPill` are named in it but were still
> present. `SocialPill` is **live** (used by `Footer.tsx`) and must not be
> deleted. `ConnectionsBento` and `ProfilePicture` were genuinely unused and
> were deleted on 2026-09-01, along with the orphaned root-level
> `components/FeaturedBlogCard.tsx` (the live one is `blog/FeaturedBlogCard.tsx`).
> Treat this historical list as a record of intent, not of current state — verify
> with `grep` before acting on it.

- Dead code: deleted 22 never-imported legacy template components from
  app/components/ (AboutMeBento, AboutSection, AboutTrackPattern,
  AnimatedProfilePicture, AnimatedText, BgSectionTag, BlogPostList,
  CalendarBento, CommunityWallBento, ConnectionsBento, CurrentlyPlayingBento,
  CurrentlyReadingBento, Marque, PageTitle, PhotoGallery, Resume,
  ScrapbookBento, SocialPill, SpeakingBento, StatsBento, SvgPatterns,
  ToolboxBento). Kept FeaturedBlogCard, GridWrapper, NewsletterSignUp,
  ChangelogBento, BentoCard, etc. — all still imported.
- Null-safety: app/uses, app/toolbox now use getPublicSupabase();
  app/auth/callback uses getSupabaseEnv() (no more `!` env assertions
  outside app/lib/supabase + admin/api).
- Error surface: app/error.tsx + app/global-error.tsx restyled to tokens +
  font-display (global-error previously used undefined `bg-accent-amber` and
  no stylesheet; now imports globals.css). Sitemap/RSS confirmed null-safe.
- Docs: MANUAL_TASKS Step 1 marked done (article_views + system_logs live,
  view counting verified), Step 5 email note updated, Step 3 notes the
  useActionState login fix; PROJECT_PHASES status refreshed.
- Validated: docker tsc clean + `NEXT_DIST_DIR=.next-build npx next build`
  clean + all public routes 200 via curl.

### 2026-08-15 — Session 2 continued (Phase 10: rendering architecture + content model)
- ISR everywhere: layout metadata now uses anonymous client (was cookie-bound,
  forcing all routes dynamic); removed noStore() from formatDate; public pages
  revalidate=3600; blog/project slugs pre-built via generateStaticParams
  (63 posts + all projects SSG'd); community-wall explicitly force-dynamic.
- On-demand revalidation: every admin mutation route calls revalidatePath()
  for affected public paths (try/catch wrapped) → static speed + instant CMS
  updates.
- optimizeImageUrl() Cloudinary helper (f_auto,q_auto,w_) applied to all
  remote content images. Fixed unmapped MDX component (Announcementquote)
  that broke one post's prerender.
- Content model formalized: static owner-edited strings centralized in
  app/data/site-content.ts with "✏️ EDIT HERE" banners (hero/status/bento/
  about-teaser/CTA); NEW dynamic sections: education + certifications tables,
  admin CRUD (+Sidebar links), fetchers, /about sections with fallbacks,
  seeds. OWNER: re-run migrations/2026_redesign.sql to create the two new
  tables, then re-run seed.

### 2026-08-15 — Session 2 continued (Tier 2/3 parity polish)
- PARITY_AUDIT.md Tier 2 + Tier 3 item 8 implemented:
  - Experience per-role tech chips: `tech text[]` column appended to
    `migrations/2026_redesign.sql` + `supabase_schema.sql`; comma-separated
    input in `ExperienceForm`; `/api/admin/experience` persists `tech` with a
    retry-without-column fallback; `/about` renders chip rows (defensive
    `(row as any).tech ?? []`) + fallback entries got placeholder chips.
    OWNER: re-run the migration before the live DB has the column.
  - Uses/toolbox cards: `logo_url` → small rounded next/image, `url` →
    external link with hover ArrowUpRight; letter tiles remain the fallback.
  - Hero polaroid parallax: useScroll/useTransform y-offsets on outer
    wrappers (drag intact on inner cards).
  - `SectionHeading` gained `animateWords` (word-stagger for plain-string
    parts); enabled on Testimonials + MySiteGrid.
  - Case studies sticky panel (xl+): 7/5 grid in `CaseStudies.tsx`,
    IntersectionObserver active-card sync, AnimatePresence crossfade panel
    (title/description/≤4 check bullets/tech chips); below xl unchanged.
- Validated: docker tsc clean; / /about /uses /toolbox /projects all 200.

<!-- Add new session entries above this line, newest last. -->
