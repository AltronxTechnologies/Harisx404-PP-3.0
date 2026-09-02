# DUE_WORK.md — the pending queue

The short, prioritised list of what's outstanding. **Full diagnosis for each
item lives in `DESIGN_DEBT.md`** — this file is just the queue, so it stays
readable.

- Last updated: 2026-09-02
- Related: `LOCKED_PERFECT.md` (what's frozen) · `AUDIT_TESTING.md` (pre-lock
  protocol) · `DESIGN_DEBT.md` (detail + intentional-variation list)

---

## 🔴 P1 — Real bugs visitors can hit

- [ ] **Blog category filtering is broken.** `/blog?category=<any>` shows
      *"No published articles match the selected category"* for **every**
      category, including ones the filter bar itself lists. `/blog` renders 63
      posts; `/blog?category=nextjs` renders 0. Confirmed in-browser.
      Clicking any category pill looks broken to a visitor.
      → `DESIGN_DEBT.md` **B1**. Not yet diagnosed.
      → Note: `/blog/category/<name>` now correctly 307-redirects here, so this
        bug is what makes that redirect land on an empty page.

- [ ] **`/projects/<bad-slug>` returns HTTP 200 instead of 404.** Renders the
      404 UI but tells crawlers the page is fine, so junk URLs can get indexed.
      Its `notFound()` call, route config and `generateMetadata` are *identical*
      to `blog/[slug]`, which behaves correctly — cause unidentified.
      → `DESIGN_DEBT.md` **B2**. Needs a production-build check; `next build`
        must not run against the live dev server.

## 🟠 P2 — Missing standard files (one small batch, benefits every page)

- [ ] `app/loading.tsx` (root) — only `/projects` has a loading state today
- [ ] `app/manifest.ts` — no PWA manifest; breaks Add-to-Home-Screen
- [ ] `app/icon.png` + `app/apple-icon.png` — only `favicon.ico` exists, so
      iOS home-screen saves a **screenshot instead of the logo**.
      Source available: `public/brand/harisx404 favicon transparent.png`
- [ ] `themeColor` / `viewport` in `app/layout.tsx` — mobile browser chrome
      won't match the dark theme
- [ ] `/.well-known/security.txt` — vulnerability-disclosure contact; strong
      fit for a cybersecurity portfolio
      → `DESIGN_DEBT.md` **B3**

## 🟡 P3 — Needs owner input (do not invent)

- [ ] **Cookie Policy** page — relevant, the site runs view counters/analytics
- [ ] **Accessibility Statement** page
      → `DESIGN_DEBT.md` **B4**
- [ ] Decide whether any of these template leftovers are actually wanted:
      `/uses`, `/toolbox`, `/speaking`, `/connections`, `/bucket-list`,
      `/book-a-call`. Each needs real content — placeholder text on a portfolio
      is worse than no page.
- [ ] Page-hero top spacing: unifying the 10 heroes **will shift page titles
      vertically**. Needs an explicit yes/no.
      → `DESIGN_DEBT.md` Issue 4

## 🔵 P4 — Consistency work, per page, at audit time

Handled inside each page's audit (Phase 11), not as a separate project:
- [ ] Radius tiers outside the locked areas → `DESIGN_DEBT.md` Issue 2
- [ ] Duplicate controls: 6 copy buttons, 4 close buttons, 9 chip recipes,
      4 `Icon()` helpers, 5 search triggers → Issue 3
- [ ] Remaining hardcoded secondary-copy colours (~90, mostly `legal/*`,
      `contact`, `links`, `credentials`, `buildlog`, `blog/*`) → Issue 5
- [ ] Navbar search icon is **Phosphor** while modals use **lucide** —
      different stroke weight at the same px *(inside frozen scope; needs
      permission)*

## ⚪ P5 — Housekeeping

- [ ] `PROJECT_PHASES.md` is unreliable: Phase 7 is marked ✅ DONE but four of
      its pages (`/changelog`, `/toolbox`, `/speaking`, `/connections`) don't
      exist, and Phase 9 claims full QA passed while blog categories have never
      worked. Either correct it or mark it historical.
- [ ] `AI_GUIDE.md` "deleted 22 components" list is stale — it names
      `SocialPill`, which is **live in the Footer**. Already annotated, but the
      list itself should be rewritten.
- [ ] `/stats` PageSpeed API returns 400
- [ ] GitHub contribution graph shows 0
- [ ] Admin changelog revalidate is stale
- [ ] Live Supabase mismatches: prod `site_settings` is one row with named
      columns (breaks `/admin/settings`); `community_wall_messages` and
      `testimonial_submissions` don't exist remotely
- [ ] Owner manual tasks: Supabase GitHub OAuth, Cal.com link, real
      certifications → `MANUAL_TASKS.md`

---

## ✅ Recently closed

| Item | Commit |
|---|---|
| Theme-toggle glyph size + single ThemeToggle implementation | `f990088` |
| Shared modal surfaces, brand glyphs, banned token sweep, footer X glyph, links grid, dead `/blog` search button | `11b34df` |
| Colour tokenisation, 62 of 310 audited candidates | `7601579` |
| Home-page AA contrast failures | `eeb900b` |
| Pre-lock radius/convention cleanup in the five locked areas | `c04f17f` |
| Production freeze on Home / Navbar / Search / Reach Out / Footer | `69d79de` |
| Deleted 3 never-imported components | `bf72374` |
| Search-modal category dividers | `e7397fb` |
| Dead `/blog/category` route → 307 redirect | (this batch) |

## 🔒 Do NOT touch without permission
`app/page.tsx`, `app/components/home/**`, `Navbar.tsx`, `ThemeToggle.tsx`,
`SearchModal.tsx`, `ReachOutModal.tsx`, `Footer.tsx`, `SocialPill.tsx`,
`navbar/modalSurfaces.ts`, `BrandGlyph.tsx` — `LOCKED_PERFECT.md` entry 22.
