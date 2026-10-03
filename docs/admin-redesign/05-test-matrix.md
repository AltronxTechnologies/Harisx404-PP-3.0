# Admin Redesign Test Matrix

**Status:** reported checks include `tests/admin-security.integration.test.mjs` 5/5, `tests/admin-login.browser.test.mjs` 1/1, combined Admin/public/locked regression 38 pass/one existing Project skip, post-build smoke 9/9, TypeScript/focused ESLint and isolated Docker build. These do not pass owner-authenticated/connected CRUD gates. This documentation update runs no tests. Keep connected access read-only until owner approval; use isolated/disposable data for later CRUD. Record sanitized evidence and cleanup in `06-validation-log.md`.

| Layer | Cases | Passing evidence |
| --- | --- | --- |
| Login unauth | Seven-width light/dark layout/field checks, then actual input, invalid credentials, pending, failure, keyboard and public chrome | Browser 1/1 passed layout at 320/375/390/640/768/1024/1440: no overflow, one `h1`, noindex, labelled fields >=44px and submit >=48px; submission/owner/non-owner flows not tested |
| Route access | Anonymous, non-owner, owner; direct URL, navigation, logout/back; moved Media/About/Settings in dashboard group | Anonymous 307 for the three URLs observed; owner shell, non-owner denial and unaffected public root rendering still unverified |
| API matrix | GET/POST/PUT/PATCH/DELETE per `/api/admin/*` and nested route plus server actions; anonymous/non-owner/owner/missing config | Five anonymous GET 401s observed and security integration 5/5 passed (includes source checks); remaining verbs/roles and response shape unverified |
| Settings contract | Read singleton, missing/duplicate row, strict optional fields/HTTPS/email, unknown columns, conflict, backend failure, save/reload | Named-column strict Zod API source-confirmed, anonymous 401; successful owner GET/PUT, public metadata/FAQ cache behavior unverified |
| Connected schema and RLS | Read-only catalog inspection for FAQ/site-settings policies; review staged Logs `resolved` column/index before approved rollout | Five content tables responded 200 to zero-row probes; Logs `resolved` 400/42703; both migrations staged, not applied or remotely verified |
| FAQ input and UI | POST full strict allowlist; PUT partial with UUID id; PATCH boolean; DELETE UUID; labelled form errors and switch | Source-confirmed; owner-authenticated invalid/valid payloads, focus/error announcements, switch persistence and public FAQ effects unverified |
| Legacy About / Changelog | About strict optional allowlist, legacy warning; Changelog table and unused bento; owner-retire/repurpose choice | Read-only About columns observed, no public About consumer found; no live use of Changelog fetch helper found. No connected save; do not expect a public change |
| Media library | Read-only schema, load/empty/error/retry, `bytes`/`alt_text`/`secure_url`, clipboard success/failure, touch/keyboard copy, picker types and keyboard upload | Connected `media?select=*&limit=1` yielded one row and expected columns, values withheld; UI handling source-confirmed, not owner-authenticated. Upload endpoint unchanged: Cloudinary-supported non-SVG images, no new size cap; no upload/delete tested |
| CRUD lifecycle | Blog/Project drafts and publication, testimonials/wall moderation, FAQs/experience/changelogs order, cert/buildlog/resume rules; Settings/About save/reopen; Media upload and any supported deletion | Create/read/update/state transition/delete only where supported; error/conflict paths; disposable fixtures removed; locked-scope permission granted. All authenticated CRUD still unverified |
| Dashboard and lists | Counts, zero vs failure, recent content, draft visibility, pagination/filter/search, long titles and empty datasets | Source checks Admin before service-role queries and shows error-not-zero; authenticated real-data accuracy unverified |
| Logs actions | Unavailable/empty distinction, resolve, clear and simulate under owner/non-owner, missing schema, safe test fixture | Unavailable state in source; no connected write; never call log actions before schema/fixture/owner approval |
| Forms and errors | Invalid/missing/duplicate input, simultaneous save, slow network, 401 expiry, 403, 409, 5xx, retry, unsaved changes | No lost input or false success; errors actionable; no duplicate destructive requests |
| Accessibility | Tab/Shift+Tab, Escape/drawer focus restore, screen-reader labels/status, zoom and reduced motion | No keyboard traps/hidden focus; visible focus and AA contrast in both themes |
| Responsive/public | Authenticated Admin at 320/390/768/1440 and long/empty/error states; locked public pages before/after | Combined regression 38 pass/one existing Project skip reported; no locked public change claimed, skip and authenticated UI still need closure |
| Operations | Isolated build output, preview continuity, redacted logs, deployment rollback | Isolated Docker production build passed (132 static pages) with preexisting CurrentlyReadingBento img and edge-runtime warnings; post-build smoke 9/9, preview still running; no deployment sign-off |

## Per-operation error/state grid

| Operation | Required states to check |
| --- | --- |
| Read/list | Initial loading, successful empty, populated, 401/403, 404 where relevant, timeout/5xx and retry |
| Create/update/singleton save | Field invalid, authorized success+reload, double submit, stale/conflict, 401/403, backend failure with input preserved |
| Publish/archive/restore/moderate | Confirmation where impact warrants it, allowed transition, invalid transition, public visibility/cache effects, retry safety |
| Delete/file replace/upload | Explicit confirmation, dependency warning, invalid file/size, partial failure/orphan cleanup, rollback and verified removal |

Owner must supply credentials and an approved disposable-data environment for authenticated/CRUD rows, plus migration policy/catalog approval. Until then those rows are **blocked**, not passed. No test here grants permission to mutate the connected site.
