# PROJECT_PHASES.md — Master Plan & Session Continuity Guide

> **Purpose:** This is the single source of truth for the aayush-style portfolio
> rebuild of harisx404/p-site. Any AI agent (Claude, Antigravity, Alloy, etc.)
> or human continuing this work MUST read this file first, work in the listed
> phase order, and update the checkboxes + "Current status" section after every
> work session. Do not re-plan from scratch; continue from here.

---

## Current status (update after every session)

- **Last updated:** 2026-08-15 (full audit pass: dead component cleanup, null-safe Supabase stragglers fixed, error pages restyled; live DB now has article_views + system_logs — migration re-run by owner, view counting verified)
- **Active branch:** `muhammad-haris/set-up-this-codebase-for-PiJexp`
- **Completed:** Phases 0–7 + Phase 8 (all except blog embeddings — requires pgvector migration + published posts) + Phase 9 partial (all items except Lighthouse — run after real assets uploaded)
- **Next up:** pgvector migration for blog embeddings + owner asset upload + Lighthouse pass
- **Companion docs:** `AI_GUIDE.md` (complete project guide + session log —
  read it first in any new session), `MANUAL_TASKS.md` (owner-provided
  assets/credentials), `docs/` (original architecture docs),
  `supabase_schema.sql` + `migrations/` (DB schema)

## Non-negotiable ground rules

1. **Design language** (already implemented, reuse — do not reinvent):
   - Dark-first (`defaultTheme="dark"`), full light-mode support.
   - Colors ONLY via CSS-var tokens: `bg-bg-primary`, `border-border-primary`,
     `text-text-primary` / `-secondary` / `-tertiary` (defined in
     `app/globals.css` `:root` + `.dark`). Never hardcode grays.
   - Big headings: `font-display` (Instrument Serif, loaded in `app/layout.tsx`).
   - Gradient accent words: `.text-gradient-accent` (blue→violet→pink) and
     `.text-gradient-pink`, usually on an *italic* word inside the heading.
   - Section pattern: mono uppercase kicker (`font-mono text-xs tracking-[0.35em]
     uppercase text-text-tertiary`) + large `font-display` heading beneath.
   - Cards: `rounded-3xl border border-border-primary bg-white dark:bg-white/[0.02]`,
     hover = border brighten + shadow only (no scale/translate layout shifts).
   - Motion: framer-motion fade+y `whileInView` with `viewport={{ once: true }}`,
     stagger 0.08–0.12s, duration ~0.6s ease-out.
2. **Content policy:** structure/motion may mirror the reference site
   (aayushbharti.in) but ALL text, images, testimonials, project descriptions
   must be ORIGINAL placeholder copy for Muhammad Haris, replaceable via the
   admin panel. Never copy the reference site's copy, photos, or personal data.
3. **Dynamic-first:** every section reads Supabase via helpers in
   `app/lib/utils.ts` (all null-safe via `app/lib/supabase/safe.ts`) and falls
   back to typed placeholder arrays in `app/data/fallback-home.ts` (or a local
   fallback) when the DB is empty/unreachable. Keep this pattern for new pages.
4. **Layout gotcha (learned the hard way):** the root layout uses
   `lg:grid-cols-[32px_minmax(0,1fr)_32px]` with `min-w-0` on the middle column.
   Any horizontally scrolling/marquee element MUST live inside an
   `overflow-hidden` parent and grid items need `min-w-0`, otherwise the whole
   page blows out horizontally.
5. **Never break:** admin panel (`app/admin/*`), API routes (`app/api/*`),
   middleware auth, or the Supabase fallback behavior.
6. **Validation before commit:** `docker compose -f docker-compose.alloy.yaml
   exec -T web npx tsc --noEmit` must pass; spot-check pages in BOTH themes at
   localhost:3000 (dev stack: `docker compose -f docker-compose.alloy.yaml up -d`,
   env via `.alloy/populate-env.sh`).

---

## PHASE 0 — Infrastructure & resilience ✅ DONE

- [x] Docker Compose dev stack (`docker-compose.alloy.yaml`, node:22, host network)
- [x] `.alloy/environment.json` (port 3000) + `.alloy/populate-env.sh` (idempotent)
- [x] Supabase null-safe clients (`app/lib/supabase/safe.ts`); guards in
      `app/lib/utils.ts`, `app/lib/logger.ts`, `middleware.ts`
- [x] App boots with zero env vars; graceful fallback everywhere

## PHASE 1 — Design system ✅ DONE

- [x] Dark palette `#08090c` bg / `#1e2129` borders; light palette kept
- [x] Instrument Serif via next/font (`--font-instrument-serif`, `font-display`)
- [x] `.text-gradient-accent`, `.text-gradient-pink`, `.kicker` utilities
- [x] Tailwind: `font-display`, `animate-marquee`, `animate-marquee-reverse`
- [x] ThemeToggle in Navbar (sun/moon, hydration-safe), `defaultTheme="dark"`

## PHASE 2 — Homepage ✅ DONE

Files: `app/page.tsx`, `app/components/home/*` (HomeHero, StatusRow, HomeBento,
CaseStudies, Writings, AboutTeaser, Testimonials, MySiteGrid, CtaSection),
`app/data/fallback-home.ts`, rebuilt `app/components/Footer.tsx`, new `app/uses/`.

- [x] Hero: serif "Full stack / *engineer*", photo placeholders, name block
- [x] Status row (NOW / BUILDING / WRITING / REACH OUT)
- [x] Bento (Let's Build Together, Tech Stack marquees, What You Get,
      Timezones ticker, Toolbox)
- [x] Case studies (numbered cards, tinted gradients, tech chips) — dynamic
- [x] Thoughts & writings (top-3 posts) — dynamic
- [x] Know About Me teaser + social pills
- [x] Testimonial carousel (autoplay, dots, pause) — static fallback data
- [x] My Site grid + spinning OPEN-TO-WORK CTA section
- [x] Footer (4 columns) + `/uses` page

Known homepage follow-ups (do during Phase 7 polish):
- [ ] Replace hero/photo placeholders once owner uploads real photos
- [x] "New launch" card → points at /projects/intrushield-nids
- [x] Navbar "More" mega-menu links audit — Uses → /uses, Attribution → /attribution, Speaking card relabeled

## PHASE 3 — About page ✅ DONE

Files: `app/about/page.tsx` (server, null-safe fetches), `app/about/AboutView.tsx`
(client, all sections), shared `app/components/home/TechMarquee.tsx` (also used
by HomeBento).

- [x] Kicker + display heading with italic gradient "everything"
- [x] Two-column bio (DB `about_content` else fallback) + rotated photo placeholders
- [x] `#experience` timeline (tries `experience` table, falls back to 3 entries)
- [x] "Tools I reach for" marquee card; "Beyond the code" 3-card grid
- [x] CtaSection reuse; metadata title "About"

Note: old About extras (Resume, StatsBento, Scrapbook, Newsletter) were removed
per spec — restore selectively in Phase 7 only if the owner asks.

## PHASE 4 — Projects index + detail ✅ DONE

Files: `app/projects/page.tsx`, `app/projects/ProjectsIndex.tsx` (client filter),
`app/projects/[slug]/page.tsx`, `app/projects/[slug]/ProjectDetail.tsx`;
`CaseStudyCard` extracted from `app/components/home/CaseStudies.tsx` (home
behavior unchanged).

- [x] Index: kicker/heading, category filter pills, all projects via shared card
- [x] Detail: kicker CATEGORY·YEAR, serif title, tagline, tech chips,
      Live/Source buttons (when URLs exist), media placeholder, Overview,
      Highlights (features else generic bullets), prev/next nav
- [x] generateMetadata + CreativeWork JSON-LD; fallback slugs resolve
- Note: project `content` renders as plain paragraphs; add markdown renderer in
  Phase 6+ if projects start storing markdown.

## PHASE 5 — Blog index + post page ✅ DONE

Files: `app/components/BlogCard.tsx` (shared, also used by home Writings),
`app/blog/page.tsx` (kicker/serif header, featured wide card, 2-col grid,
fallbackPosts when DB empty, AI search + category select preserved),
`app/blog/category/[category]/page.tsx` (same styling, logic untouched),
`app/blog/[slug]/page.tsx` (restyled header only: kicker, serif title, meta,
optional cover; MDX/TOC/reactions/audio/related untouched),
`app/components/ReadingProgress.tsx` (fixed gradient scaleX progress bar).

- Note: fallback post links 404 until real posts exist (expected).
- Note: `BlogPostList`/`GridWrapper` no longer used by blog index (kept in repo).

## PHASE 6 — Backend & admin alignment ✅ DONE

Files: `migrations/2026_redesign.sql`, `supabase_schema.sql` (appended),
`app/api/admin/{testimonials,experience}/route.ts`,
`app/admin/(dashboard)/{testimonials,experience}/*`,
`app/components/admin/{TestimonialForm,ExperienceForm,DeleteRowButton}.tsx`,
extended `ProjectForm` + projects API, `fetchTestimonials()` in
`app/lib/utils.ts`, homepage/about wiring, seed script additions.

1. SQL migration file `migrations/2026_redesign.sql` (also append to
   `supabase_schema.sql`) adding:
   - `testimonials` table (headline, quote, name, role, avatar_url,
     display_order, status) + RLS public-read-published policy
   - `experience` table (role, company, location, start_date, end_date,
     description, display_order)
   - `projects` new columns: tagline, tech_stack text[], category, year,
     features text[], live_url, github_url
2. Admin CRUD pages `/admin/testimonials`, `/admin/experience` — copy the
   changelogs admin pattern (`app/admin/(dashboard)/changelogs/*` +
   `app/api/admin/changelogs/route.ts`).
3. Extend `/admin/projects` form with the new columns.
4. Swap the frontend fetches (home testimonials, about experience) to read the
   new tables with the existing fallback pattern.
5. Update `scripts/seed-initial-data.mjs` to seed the new tables with the
   fallback placeholder content.

## PHASE 7 — Remaining pages harmonization ✅ DONE

- [x] `/changelog`, `/community-wall`, `/connections`, `/links`, `/speaking`,
      `/stats`, `/toolbox`: apply kicker + font-display headings + token colors;
      do not change their data logic.
- [x] New simple pages: `/attribution`, `/legal/privacy`, `/legal/terms`
      (original text), then fix footer Privacy link (currently `/links`).
- [x] Implement `/rss.xml` route (blog posts) — footer already links it.
- [x] 404 page restyle to match.

## PHASE 8 — AI integration polish (needs GEMINI_API_KEY)

- [x] Verify ChatbotWidget end-to-end; give it site-aware system prompt
- [x] Wire `/api/ai/search` into navbar ⌘K palette results (semantic w/ ILIKE keyword fallback)
- [ ] Blog embeddings (`/api/admin/blogs/embed`) + pgvector related posts — requires pgvector migration + published posts
- [x] AI assist in admin editors (`/api/ai/assist`) sanity pass (added ADMIN_EMAIL check)

## PHASE 9 — SEO, performance, QA (final gate)

- [x] `npm run build` clean; fix all type/lint errors
- [x] sitemap.ts covers all public routes incl. /uses; robots.ts sane
- [x] Per-page metadata + OG images (project & blog detail from DB fields)
- [x] JSON-LD: Person (home, done), Article (blog posts), CreativeWork (projects)
- [ ] Lighthouse ≥90 perf/SEO/a11y on home, blog post, project detail — run after real assets uploaded
- [x] Mobile pass at 390px: hero, bento, case studies, carousel, footer
- [x] Both themes screenshot QA on every public page (code-review sweep on secondary pages; fixed Button outline variant, MostViewedArticleCard browser bar, community-wall mobile gradient)
- [x] Remove root-level junk: `fix-dark-mode*.mjs`, `scratch.md`, extra lockfile

---

## Key file map (for orientation)

| Area | Files |
|---|---|
| Layout & theme | `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`, `app/components/ThemeProvider.tsx`, `app/components/ThemeToggle.tsx` |
| Navbar (pill + mega menu + ⌘K) | `app/components/Navbar.tsx` |
| Homepage sections | `app/components/home/*.tsx`, `app/page.tsx`, `app/data/fallback-home.ts` |
| Footer | `app/components/Footer.tsx` |
| Data helpers (null-safe) | `app/lib/utils.ts`, `app/lib/supabase/safe.ts`, `app/lib/supabase/server.ts`, `app/lib/logger.ts` |
| Auth / route protection | `middleware.ts` (skips auth when Supabase unconfigured) |
| Admin panel | `app/admin/(dashboard)/*`, `app/api/admin/*` |
| AI routes | `app/api/ai/*`, `app/components/ChatbotWidget.tsx` |
| Dev environment | `docker-compose.alloy.yaml`, `.alloy/environment.json`, `.alloy/populate-env.sh` |

## How to resume in a fresh session (checklist)

1. `git checkout muhammad-haris/set-up-this-codebase-for-PiJexp` (or the branch
   the owner designates; never commit to main directly).
2. Read this file + `MANUAL_TASKS.md`.
3. Start stack: `bash .alloy/populate-env.sh && docker compose -f
   docker-compose.alloy.yaml up -d`; wait for :3000.
4. Pick the first unchecked phase, implement, validate (tsc + both themes),
   commit with conventional message, push.
5. Update "Current status" + checkboxes here in the same commit.
