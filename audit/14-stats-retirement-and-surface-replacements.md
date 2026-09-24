# Public Stats Retirement And Surface Replacement Audit

- Date: 2026-09-22
- Removed route: `/stats`
- Replacement surfaces: Home, About, Navbar More, Footer, Admin Dashboard/Analytics
- Status: owner-authorized implementation and verification complete

## Public Replacements

- Home and About `Shipped, counted, public` cards now render real hourly public
  GitHub activity for `harisx404` in a responsive contribution calendar.
- GitHub requests have a 2.5-second deadline and a geometry-stable unavailable
  state; no token or invented activity is required.
- GitHub activity is isolated behind a card-level Suspense boundary and an hourly
  shared server cache, so a cold or unavailable GitHub response cannot delay the
  Home or About page shell.
- The final portfolio-editorial card centers its title and precise rolling-year
  total, keeps status unobtrusively pinned, and closes with a compact intensity
  legend. A container-aware layout keeps 12–14px squares and renders
  exactly as many complete recent weeks as each card can hold, with a restrained
  neutral-to-emerald palette tuned separately
  for light and dark themes.
- A transient branded hover/focus detail exposes the real date/count only while
  inspecting a day; keyboard focus and arrow-key navigation remain available. The chart renders
  immediately without a viewport animation that could leave the card blank.
- A last-known-good in-process snapshot is reused with an explicit `Cached` badge
  when GitHub fails. With no verified snapshot, the card shows a neutral profile
  fallback and never invents zero activity.
- Repeated Home/About project, testimonial, and experience reads use tagged
  server caches that are invalidated by their Admin mutation routes.
- Home Behind-the-site and About bento Stats cards now render published credential
  summaries from the locked restricted six-field credential view.
- The Home credential gateway uses a timeless proof-archive illustration and an
  automatically updating published count, without coupling the card to specific
  issuers. About retains up to three Admin-ordered issuer previews without loading
  third-party media or exposing private fields.
- Navbar More contains exactly one Buildlog feature card; mobile Search includes
  Buildlog. Footer contains one Buildlog link and no Stats link.

## Admin Migration

- `/admin/analytics` contains actionable private metrics: views, reactions,
  published notes/articles, top viewed/reacted articles, reaction breakdown,
  category distribution, and Lighthouse mobile/desktop health.
- Admin Dashboard exposes views/reactions summaries and an Analytics quick action.
- Source failures display an explicit partial-data warning and em dashes rather
  than false zeroes.
- Mobile Admin has a modal navigation drawer with inert background, focus trap,
  Escape/click-away close, focus restoration, scroll lock, Analytics access, and
  Sign Out.
- Decorative coffee/day counters and the inaccurate legacy changelog-as-Buildlog
  metric were intentionally retired.

## Removal

- Deleted `app/stats/**`, the public Stats component tree, obsolete GitHub loader,
  Stats-only performance hook, and `public/images/nav-stats.jpg`.
- Removed `/stats` from Navbar, Footer, sitemap, `llms.txt`, Search suggestions,
  public browser route matrices, and active documentation.
- `/stats` returns the standard application 404.
- Historical dated changelog/audit records remain as history.

## Verification

| Gate | Result |
|---|---|
| TypeScript | Passed |
| Targeted ESLint | Passed |
| Home/About source contracts | 3/3 passed |
| Home/About responsive matrix | 12/12 page/theme/viewport combinations passed |
| GitHub day-detail accessibility | One tab stop, arrow navigation, real date/count labels |
| GitHub resilient states | Live, Cached, and neutral unavailable contracts verified |
| Streamed response timing | Home 0.266s TTFB; About 0.338s TTFB |
| Warm full response timing | Home 1.948s; About 1.694s |
| Live GitHub data | 827 contributions rendered during verification |
| Credential public contract | 5 published records, restricted fields only |
| Credential regression | 5/5 passed |
| `/stats` response | HTTP 404 |
| Navbar Buildlog feature cards | Exactly 1 desktop, mobile Search entry present |
| Footer Buildlog links | Exactly 1; Stats absent |
| Sitemap/LLM discovery | Stats absent |
| Admin Analytics authenticated render | Passed |
| Admin mobile modal navigation | Focus/inert/restore/sign-out/Analytics passed |
| Full public preview browser sweep | Passed |
| Horizontal overflow | 0 |
| Browser console errors attributable to replacements | 0 |
| `git diff --check` | Passed |

The owner-authorized frozen contract is recorded in entry 36 of
`LOCKED_PERFECT.md`.
