# Admin Redesign Requirements

## Boundaries

- Plan an owner-facing Admin experience only. Public presentation and its shared Navbar, Footer, layouts, global CSS, tokens, CTA, modal surfaces and locked route behavior remain unchanged. No implied unlock of `LOCKED_PERFECT.md`.
- Preserve Buildlog URLs, server authorization, data semantics and current editor workflows unless a separately approved change is specified. Owner explicitly retired the separate legacy Changelog editor; old Admin bookmarks redirect to Buildlog while the public `/changelog` redirect is preserved. These requirements are remaining acceptance criteria, not production approval.
- **Partial owner-session evidence:** scoped disposable Admin fixture lifecycles passed and were cleaned up. Singleton values, non-owner denial, locked Admin scopes and deployed behavior remain unverified.

## Functional acceptance targets

| Area | Required behavior / acceptance target | Baseline |
| --- | --- | --- |
| Entry and navigation | Verify login submit/error/busy state and non-owner sign-out; protected routes need coherent Admin navigation/context. | Earlier drawer measured 16 links before Changelog retirement; now 15 in source. Admin-only styles hide inherited public chrome; full root omission still requires separate permission. Recheck current drawer/roles |
| Dashboard | Counts/actions/recent items link to current URLs; distinguish true zero, empty, loading, error and unavailable metrics. | Owner dashboard remeasured with no uncontained overflow at 320/390/640; dark 390/1440 visually reviewed, no gross clipping. Stats `md:2`/`xl:3`, actions mobile 1/`lg:2`, main panels `xl:2`; counts/drafts not validated |
| Lists | Search/filter/sort/pagination where justified; row identity, status, last-change context and actions understandable at 320px and keyboard accessible. | Projects/Blogs/Media, FAQs/Analytics/Logs and owner-authorized Admin Buildlog sampled at narrow widths; Changelogs retired. Full theme/role/content sweep still open |
| Editors | Create, edit, draft/publish/archive/restore and destructive actions only where supported per domain; validate before submit, preserve unsaved input on failure, confirm destructive operations, report conflict and success accurately. | Unverified; domain contracts differ |
| About/Media/Settings | Settings PUT and legacy About save/reopen need isolated authorized checks; do not suggest legacy About edits locked public About. | About/Settings labelled-field samples predate latest shell; singleton saves not tested. Media upload/dependency-blocked/delete with scoped cleanup passed; external URL and concurrency limits remain |
| FAQs / retired Changelogs | Validate FAQ CRUD/switch with disposable records; preserve only the legacy Changelog redirect, not a second editor or public destination. | Hidden FAQ fixture lifecycle passed; section toggle/public effects unverified. Changelog UI/API retired at owner request, legacy DB rows not dropped |
| Logs | Distinguish unavailable from empty read; resolve/clear/simulate actions must require Admin and confirmed schema/policy before broad use. | Unique disposable log resolved via Admin and removed; bulk clear/simulate intentionally not exercised. Owner confirmed named index; effective policies/provenance unknown |
| Locked Buildlog | Public Buildlog stays frozen; only owner-authorized Admin mobile correction permitted. | Admin list now uses contained mobile cards; editor grid and public regressions passed sampled widths. Other Buildlog scopes stay locked |
| System feedback | Every read and mutation gets explicit loading, empty, permission denied, validation, network/server error and retry states; no failure interpreted as empty form. | Dashboard and Logs rendered with owner session; Projects/Media/error paths remain source-level only |

## CRUD and state contract to design/verify

Legend: **C/R/U/D** are candidate workflow checks, not assertions that every endpoint implements them; **A** = archive/restore or publish-state transition; **S** = singleton settings update. Map actual handler methods and domain constraints before building controls.

| Domain | Candidate operations | Specific acceptance concern |
| --- | --- | --- |
| Blogs, Projects | C/R/U/A/D where implemented | Draft vs live/scheduled visibility, slug collisions, concurrency, previews, public cache invalidation |
| Testimonials, Community Wall | R/moderate/A/D where implemented | Published vs pending/archived visibility; locked scopes require owner unlock |
| Certifications, Buildlog, Resume | Domain-specific C/R/U/A/D, PDF replace/delete | Named locked Admin boundaries; private file lifecycle and public read isolation |
| FAQs, Experience | C/R/U/D plus applicable visibility/order | FAQ fixture lifecycle passed; Experience is locked entry 19. Retired Changelog has no active Admin CRUD |
| Media | R/upload/copy URL/delete unused tracked asset | UI upload, in-use refusal and scoped Cloudinary/DB deletion passed. External hard-coded uses and DB/Cloudinary concurrency cannot be fully detected; real >100 pagination and copy still need review |
| Legacy About, site settings, Buildlog/Wall settings | R/S where supported | About content has no locked public About consumer; settings singleton fields/allowlists/conflicts and actual public cache effects need separate checks |
| Analytics, logs | Analytics R; Logs R and existing resolve/clear/simulate actions | No sensitive context to unauthorized users; Logs mutations require explicit safe-data approval and installed schema |

For every supported operation verify: unauthorized/forbidden, valid success and reload, invalid payload, missing/duplicate ID, stale edit/conflict, backend outage, timeout/retry, accidental duplicate submit, and cancel. Never show success before persistence is confirmed. Unsupported verbs should remain unavailable rather than acquiring decorative controls.

## Quality gates

- Keyboard/focus order, dialog focus restoration, explicit labels, status announcements, touch target size, reduced motion and AA contrast in both themes.
- Login layout checks passed at seven widths in both themes. Authenticated scoped Admin checks cover selected list/forms and disposable lifecycles, including owner-approved Buildlog mobile correction. Current drawer, remaining locked domains, themes, role denial and singleton workflows need acceptance.
- Public presentation must remain unchanged. Use latest regression results in `06-validation-log.md`; no production-ready claim until security/data and end-to-end gates in `04-phases.md` and `05-test-matrix.md` pass.
