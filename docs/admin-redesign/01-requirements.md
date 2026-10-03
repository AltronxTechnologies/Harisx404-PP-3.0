# Admin Redesign Requirements

## Boundaries

- Plan an owner-facing Admin experience only. Public presentation and its shared Navbar, Footer, layouts, global CSS, tokens, CTA, modal surfaces and locked route behavior remain unchanged. No implied unlock of `LOCKED_PERFECT.md`.
- Preserve URLs, server authorization, data semantics and existing editor workflows unless a separately approved change is specified. Some Admin source changes have already landed (see `00-inventory.md`); these requirements are remaining acceptance criteria, not a claim that implementation is absent or production-approved.
- **Partial owner-session evidence:** read-only dashboard/Logs renders and five Admin API GETs are observed; this is not approval to run mutations or edit named locked Admin/public scopes. Other authenticated UI, persistence, role denial and lifecycle acceptance remain unverified.

## Functional acceptance targets

| Area | Required behavior / acceptance target | Baseline |
| --- | --- | --- |
| Entry and navigation | Verify login submit/error/busy state and non-owner sign-out; protected routes need coherent Admin navigation/context. No public-chrome change without owner approval of locked scope. | Owner dashboard/390px mobile drawer read-only: 16 links, min-44px targets, one `aria-current="page"`, Escape/close restores trigger focus. Other routes/desktop auth flow unverified; public chrome overlaps |
| Dashboard | Counts/actions/recent items link to current URLs; distinguish true zero, empty, loading, error and unavailable metrics. | Owner dashboard remeasured with no uncontained overflow at 320/390/640; dark 390/1440 visually reviewed, no gross clipping. Stats `md:2`/`xl:3`, actions mobile 1/`lg:2`, main panels `xl:2`; counts/drafts not validated |
| Lists | Search/filter/sort/pagination where justified; row identity, status, last-change context and actions understandable at 320px and keyboard accessible. | Projects/Blogs/Media and FAQs/Analytics/Changelogs/Logs sampled read-only without uncontained overflow; interactions and full-width/theme sweep unverified. Locked Buildlog list remains an exception |
| Editors | Create, edit, draft/publish/archive/restore and destructive actions only where supported per domain; validate before submit, preserve unsaved input on failure, confirm destructive operations, report conflict and success accurately. | Unverified; domain contracts differ |
| About/Media/Settings | Settings PUT and legacy About save/reopen need isolated authorized checks; Media copy/upload require separate approval for interaction/mutation. Do not suggest legacy About edits locked public About. | Owner GETs 200 by shape. About 14 labels/fit at 320/390/768/1440 in same-origin offscreen iframe, warning retained; Settings seven labels/fit at 320/390/640/768/1024/1440. No saves |
| FAQs/Changelogs | Validate FAQ CRUD/switch with disposable records; decide whether to retire/repurpose Changelog editor rather than imply it feeds Buildlog. | Owner GETs 200 with `data` arrays; read-only lists sampled. Changelog header now wraps, error differs from empty, edit icon named. CRUD/public effects unverified |
| Logs | Distinguish unavailable from empty read; resolve/clear/simulate actions must require Admin and confirmed schema/policy before any execution. | Latest zero-row REST `resolved` probe 200 and owner `/admin/logs` list rendered; no action clicked, provenance/index/RLS unknown |
| Locked Buildlog | Do not treat zero document overflow as a responsive pass; remove internal out-of-viewport elements only with explicit owner permission for named Admin scope. | `/admin/buildlog` has 9/9/6 uncontained elements at 320/390/768, masked by root `overflow-x-clip`; owner-unlock blocker |
| System feedback | Every read and mutation gets explicit loading, empty, permission denied, validation, network/server error and retry states; no failure interpreted as empty form. | Dashboard and Logs rendered with owner session; Projects/Media/error paths remain source-level only |

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
- Login layout checks passed at seven widths in both themes. Owner dashboard initially hid a 390px dark internal x566 edge under root clipping; Admin-only min-width/grid and responsive columns now show no uncontained overflow at 320/390/640, with dark 390/1440 visual review. About/Settings labelled-field geometry and sampled list routes have limited read-only checks, but Buildlog fails internal containment despite zero document overflow. Recheck remaining widths/themes/interactions and the locked Buildlog only after owner unlock. Form submission and CRUD remain unverified.
- Authenticated owner review and read-only contract checks precede any connected mutation. Combined Admin/public/locked regression currently reports 38 pass and one existing Project skip, not full owner sign-off. Public presentation must remain unchanged. No production-ready claim until the security/data and end-to-end gates in `04-phases.md` and `05-test-matrix.md` pass.
