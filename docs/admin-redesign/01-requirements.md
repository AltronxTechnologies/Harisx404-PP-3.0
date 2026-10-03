# Admin Redesign Requirements

## Boundaries

- Plan an owner-facing Admin experience only. Public presentation and its shared Navbar, Footer, layouts, global CSS, tokens, CTA, modal surfaces and locked route behavior remain unchanged. No implied unlock of `LOCKED_PERFECT.md`.
- Preserve URLs, server authorization, data semantics and existing editor workflows unless a separately approved change is specified. Some Admin source changes have already landed (see `00-inventory.md`); these requirements are remaining acceptance criteria, not a claim that implementation is absent or production-approved.
- **Blocked:** owner credentials and permission for any named locked Admin changes are absent. Authenticated UI, persistence and live mutations cannot be accepted from the current baseline.

## Functional acceptance targets

| Area | Required behavior / acceptance target | Baseline |
| --- | --- | --- |
| Entry and navigation | Verify login submit/error/busy state and non-owner sign-out in browser; protected routes need coherent Admin navigation/context. No public-chrome change without explicit owner approval of affected shared scope. | Seven-width light/dark login layout/labels/targets pass; non-owner sign-out source-confirmed, owner/auth submission unverified |
| Dashboard | Counts/actions/recent items link to current URLs; distinguish true zero, empty, loading, error and unavailable metrics; avoid invented analytics. | Verified-Admin-before-service-role and error-not-zero source-confirmed; data/draft/UI unverified |
| Lists | Search/filter/sort/pagination where justified by dataset; row identity, status, last-change context and actions remain understandable at 320px and keyboard accessible. | Unverified |
| Editors | Create, edit, draft/publish/archive/restore and destructive actions only where supported per domain; validate before submit, preserve unsaved input on failure, confirm destructive operations, report conflict and success accurately. | Unverified; domain contracts differ |
| About/Media/Settings | Verify moved pages in dashboard shell; Settings singleton GET/PUT and About legacy save/reopen require isolated authorized checks; Media read, copy and upload states need authenticated review, with any upload/deletion needing approved sandbox. Decide whether legacy About editor should remain or retire; do not suggest it edits locked public About. | Media one-row schema observed read-only; UI maps `bytes`/`alt_text`/`secure_url` and has load/copy error states and accessible actions in source; no authenticated Media UI/upload/delete or Settings/About save/reopen verified |
| FAQs/Changelogs | Validate full FAQ creation, partial updates, whole-section switch and deletion with authorized, disposable records; decide to retire or repurpose Changelog editor rather than implying it feeds live Buildlog. | FAQ strict inputs/labels and verified-Admin-then-service-role reads/writes source-confirmed; Changelog table exists but no live public component consumes its fetch helper; owner decision pending |
| Logs | Unavailable read must not appear healthy/empty; resolve/clear/simulate actions must require Admin and a ready schema. | Connected `resolved` missing (`42703`); migration staged, not applied; UI unavailable source-confirmed |
| System feedback | Every read and mutation gets explicit loading, empty, permission denied, validation, network/server error and retry states; no failure interpreted as empty form. | Dashboard, Projects and Logs have source-level error states; unverified end-to-end |

## CRUD and state contract to design/verify

Legend: **C/R/U/D** are candidate workflow checks, not assertions that every endpoint implements them; **A** = archive/restore or publish-state transition; **S** = singleton settings update. Map actual handler methods and domain constraints before building controls.

| Domain | Candidate operations | Specific acceptance concern |
| --- | --- | --- |
| Blogs, Projects | C/R/U/A/D where implemented | Draft vs live/scheduled visibility, slug collisions, concurrency, previews, public cache invalidation |
| Testimonials, Community Wall | R/moderate/A/D where implemented | Published vs pending/archived visibility; locked scopes require owner unlock |
| Certifications, Buildlog, Resume | Domain-specific C/R/U/A/D, PDF replace/delete | Named locked Admin boundaries; private file lifecycle and public read isolation |
| FAQs, Experience, Changelogs | C/R/U/D plus applicable visibility/order | FAQ POST full / PUT partial+UUID / PATCH boolean / DELETE UUID validation in source; Experience is locked entry 19; Changelog public destination undecided; no authenticated CRUD verified |
| Media | R/upload/copy URL; delete only where an implemented/approved flow exists | Observed schema, truthful load/empty/copy errors and accessible controls need owner-authenticated review; no upload/deletion tested. Preserve historical Cloudinary-supported non-SVG, no-new-size-cap server policy |
| Legacy About, site settings, Buildlog/Wall settings | R/S where supported | About content has no locked public About consumer; settings singleton fields/allowlists/conflicts and actual public cache effects need separate checks |
| Analytics, logs | Analytics R; Logs R and existing resolve/clear/simulate actions | No sensitive context to unauthorized users; Logs mutations require explicit safe-data approval and installed schema |

For every supported operation verify: unauthorized/forbidden, valid success and reload, invalid payload, missing/duplicate ID, stale edit/conflict, backend outage, timeout/retry, accidental duplicate submit, and cancel. Never show success before persistence is confirmed. Unsupported verbs should remain unavailable rather than acquiring decorative controls.

## Quality gates

- Keyboard/focus order, dialog focus restoration, explicit labels, status announcements, touch target size, reduced motion and AA contrast in both themes.
- Login layout checks passed at 320/375/390/640/768/1024/1440 in both themes (no overflow, labelled fields, 44px+ fields, 48px+ submit). Still test actual form submission, keyboard/error behavior and authenticated shell/tables/forms at those widths; a layout pass is not an end-to-end accessibility sign-off.
- Authenticated owner review and read-only contract checks precede any connected mutation. Combined Admin/public/locked regression currently reports 38 pass and one existing Project skip, not full owner sign-off. Public presentation must remain unchanged. No production-ready claim until the security/data and end-to-end gates in `04-phases.md` and `05-test-matrix.md` pass.
