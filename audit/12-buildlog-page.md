# Buildlog Production Audit

- Date: 2026-09-22
- Route: `/buildlog`
- Status: owner-approved and locked; implementation, live Supabase, and production-path verification complete
- Site-wide deployment dependency: restore or replace the configured production origin

## Scope

The pass covered the Buildlog public page, loading/error/empty states, static
fallback, typed public data loader, Buildlog-specific admin pages and form,
administrator API, database schema/view/seed, integration tests, and Buildlog
blueprints. Locked Home, About, Projects, Blog, Contact, Links, Credentials,
Navbar, Search, Reach Out, CTA, and Footer implementations were not modified.
Legacy Changelog admin/API files remain byte-identical to their locked baseline.

## Completed Work

- Replaced invalid paragraph-inside-H1 markup with the locked page-header rhythm.
- Reused `GridWrapper`, `PaperHeroTexture`, type scales, color tokens, border
  language, spacing, CTA placement, and responsive hierarchy from locked pages.
- Removed the redundant release-archive description and aligned the 48px left
  number/lifecycle bar with the right shipped-control bar and its full divider.
- Removed the redundant shipped ratio, moved the version pill into release
  controls, and ordered shipped updates before Planned Next.
- Strengthened only project-to-project boundaries with a darker neutral
  1.5px rule extended through the section padding, preserving quieter internal
  row dividers for clear grouping.
- Removed both outer Release archive rules and replaced the connector treatment
  with compact right-aligned shipped/planned metrics separated by a vertical
  hairline; the first project boundary remains the lower separation.
- Derived the latest shipped semantic version automatically, merged shipped
  count into the top disclosure, removed the separate Shipped heading, ordered
  shipped before planned, and constrained both lists to three visible rows with
  contained scrolling.
- Extended semantic ordering to prerelease/build versions and retained the
  Admin Current Version as the safe fallback for date or status badges.
- Positioned the version immediately beside the shipped-control title and
  enabled scroll chaining back to the page when nested lists reach either edge.
- Kept release badges right-aligned at mobile widths and reduced release rows to
  104px on narrow phones and 96px from 430px upward, preserving balanced
  whitespace while making shipped and planned lists more compact.
- Removed duplicate Buildlog-local rails; the global frame is the only frame.
- Added release totals, stable project/item keys, collision-free IDs, and
  explicit per-item Shipped/Planned screen-reader text.
- Added one-at-a-time shipped history disclosures. All shipped rows remain
  collapsed until requested, while planned work remains visible.
- Replaced the public filter rail with an admin-managed lifecycle label beside
  every project heading: In progress, Live, or Completed. Publication visibility
  remains independently controlled by Draft/Published/Archived.
- Enforced lifecycle values and the Completed-with-no-planned-items invariant in
  the Admin form, API, and PostgreSQL constraint. Migration reruns preserve later
  administrator lifecycle changes.
- Added optional, independently managed GitHub/live project actions with strict
  HTTPS validation and secure external-link behavior.
- Kept one stable shipped-history control above its content in both states,
  replaced sketch filters with crisp 20px status marks, and formalized optional
  links as two equal columns, one full-span column, or no rendered container.
- Added responsive 4/8 and 3/9 project layouts, mobile badge stacking, bounded
  copy, and empty per-project handling.
- Added geometry-matched loading, accessible empty, and focused assertive error
  states.
- Removed three unsupported placeholder projects from the fallback collection
  and softened unverified performance wording.
- Added a dedicated admin-managed `buildlog_projects` model rather than forcing
  the incompatible legacy flat Changelog model into the public page.
- Added strict server/client validation, UUID assignment, Admin-email
  authorization, generic server errors, bounded list/item sizes, live-route and
  tag revalidation, and non-destructive ordered release-item editing.
- Added secured singleton page settings so the Buildlog kicker, heading, accent,
  description, and archive label are Admin-managed while counts remain derived.
- Added a published-only public view while denying anonymous/authenticated base
  table access.
- Added clean-install schema parity, updated-at trigger, and conflict-safe seed.
- Removed temporary preview records and unverified dead links before release.
- Added Admin-managed hero/archive/SEO settings through a restricted singleton
  view and fail-closed production data loading.
- Added route-owned Open Graph and Twitter metadata so shared links use the
  Admin-managed Buildlog title and description instead of root portfolio copy.
- Added deterministic project ordering, semantic shipped-badge enforcement,
  database-level JSON item validation, accurate 400/404 Admin responses, URL-hash
  preservation, touch-active disclosure feedback, and new-tab announcements.
- Moved the Admin-managed hero outside the page loading boundary, so loading
  renders the exact live hero at every copy length rather than approximating its
  wrapping. The collection skeleton still mirrors four project regions, optional
  link controls, badge columns, and the shared CTA/Footer handoff.
- Aligned PostgreSQL and application validation for trimmed required copy and
  SemVer leading-zero rules in core and numeric prerelease identifiers.
- Added an idempotent upgrade cleanup for the exact historical preview fixtures
  and exact dead website URLs before installing stricter constraints, without
  overwriting administrator-authored records.
- Added field-specific Admin errors for project version/order and release title,
  description, badge, and semantic-version validation.
- Re-aligned the archive toolbar after owner review: archive label, both counts,
  and both metric labels share one centered mono scale (10px below 640px and
  12px from `sm` upward) with identical line-height and tracking.
- Reduced only mobile tag geometry after owner review: release-state badges use
  9px type and version pills use 8.5px type with proportionally tighter padding;
  the established 10px/9px desktop sizes remain unchanged.

## Admin Ownership

- Page settings manage the hero kicker, heading, accent, supporting description,
  archive label, SEO title, SEO description, and route-owned social metadata.
- Project management covers project name, tagline, summary, current version,
  lifecycle, publication visibility, display order, demo state, GitHub URL, live
  URL, and every release item's title, description, badge, state, and order.
- Shipped/planned totals and project numbering are derived from managed records;
  they are not duplicate editable values that can drift out of sync.
- Shipped/planned controls, lifecycle vocabulary, accessibility text, and empty
  and error recovery are interface behavior rather than editorial content.
- CTA and Footer content come from the locked shared site components and are not
  duplicated in Buildlog settings.
- Production reads only the restricted database views and fails closed when the
  schema is unavailable. The synchronized static collection is development-only.

## Verification

| Gate | Result |
|---|---|
| `/buildlog` | HTTP 200 |
| TypeScript | Passed, 0 errors |
| Targeted ESLint | Passed, 0 errors/warnings |
| Buildlog integration | 6/6 passed |
| Semantic-version behavior | 4/4 passed |
| Clean PostgreSQL 16 migration test | Passed |
| Historical-data PostgreSQL 16 upgrade test | Passed; preview fixtures and dead URLs removed |
| Live Supabase cutover | Passed; 4 published UUID-backed projects and 1 settings row |
| Anonymous base-table isolation | Passed; projects/settings base reads denied |
| Authenticated project CRUD | Passed; create/publish/archive/delete and cleanup |
| Authenticated settings roundtrip | Passed; save and public revalidation |
| Public cache invalidation | Passed after publish, archive, delete, and settings save |
| Seed rerun | Passed; inserted 0 duplicate rows |
| Published-only view and grants | Passed |
| `updated_at` trigger | Passed |
| Browser matrix | 14/14 light/dark combinations passed |
| Lifecycle/disclosure UX matrix | 14/14 combinations passed |
| Checked-in browser interaction test | `tests/buildlog.browser.test.mjs` |
| Link migration rerun | Passed; schema-aware and idempotent after lifecycle migration |
| URL state and browser Back | Passed |
| One open shipped history | Passed |
| Secure external project links | Passed |
| Stable open/close position | Passed at all 14 viewport/theme combinations |
| CTA-to-Footer handoff | 0px, identical shared CTA geometry to locked Links |
| Optional project-link geometry | Two equal, one full-span, none omitted |
| Project-link wrapping | 0 wrapped or clipped labels across all 14 cases |
| Lifecycle database constraint | Invalid Completed + planned state rejected |
| Lifecycle migration rerun | Preserved administrator-selected status |
| Widths | 320, 360, 375, 390, 768, 1024, 1440px |
| Document overflow | 0px in every browser case |
| Badge overflow | 0 in every browser case |
| Duplicate element IDs | 0 |
| Broken images | 0 |
| Buildlog console/page errors | 0 in normal-motion matrix |
| Secondary-text contrast | 5.88:1 light, 7.51:1 dark |
| Blog regression | 3/3 passed |
| Contact regression | 2/2 passed |
| Links regression | 2/2 passed |
| Credentials regression | 5/5 passed |
| Locked legacy Changelog diff | Empty; byte-identical to HEAD |
| `git diff --check` | Passed |

The reduced-motion browser probe passed Buildlog geometry and item-status checks
but reproduced the already documented locked Navbar development hydration
warning when server and browser motion preferences differ. The normal-motion
matrix had no console errors attributable to Buildlog.

## Database Cutover

Apply in this order:

1. `migrations/2026_buildlog_projects.sql`
2. `migrations/2026_buildlog_seed.sql`
3. `migrations/2026_buildlog_zz_project_links.sql`
4. `migrations/2026_buildlog_zzz_project_status.sql`
5. `migrations/2026_buildlog_zzzz_settings.sql`
6. `migrations/2026_buildlog_zzzzz_item_validation.sql`

The migrations are applied to the connected Supabase project. Public rendering
uses UUID-backed records from the restricted views, not the development fallback.
Anonymous base-table reads are denied. A reversible authenticated Admin cycle
passed for project create, publish, archive, and delete, with immediate public
cache invalidation and complete cleanup. The settings API also passed an
authenticated read/save roundtrip and public revalidation.

The remaining deployment issue is site-wide rather than Buildlog-specific:
`siteMetadata.siteUrl` points to `https://harisx404.vercel.app`, which currently
returns Vercel `DEPLOYMENT_NOT_FOUND`. Buildlog's canonical and Open Graph URL
correctly derive from that shared origin, so the deployment/domain must be
restored or the locked shared metadata must be explicitly updated before calling
the site production-live.

## Owner Lock

The owner explicitly locked Buildlog on 2026-09-22 after implementation,
database, authenticated Admin, responsive, accessibility, metadata, and
independent release reviews passed. The frozen contract is recorded in entry 33
of `LOCKED_PERFECT.md`. Future Buildlog changes require a new explicit owner
unlock. The separate site-wide production-domain note above remains open.
