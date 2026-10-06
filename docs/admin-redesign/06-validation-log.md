# Validation Log

Current-worktree planning snapshot. **Source-confirmed** means inspected code, **observed** means authenticated/anonymous browser or REST evidence, **prior check** means an earlier test/build result, and **blocked** means separate owner approval is needed. Earlier owner-session checks were read-only; later scoped Buildlog/FAQ/Blog/Project/Changelog, Media and one log fixture used authenticated APIs/UI with verified cleanup. Owner has now retired the separate Changelog Admin UI/API; historical entries below describe evidence before removal, not current functionality. No public-source edit, unapproved locked Admin edit or migration applied by us; no deployment sign-off. Never add passwords, session material, settings/log values, secrets or private response bodies here.

| Item | Status | Evidence / limitation |
| --- | --- | --- |
| Next/Admin structure | Confirmed in source | `package.json`, `app/layout.tsx`, `app/admin/(dashboard)/layout.tsx`, `app/components/admin/Sidebar.tsx`, `app/admin/(dashboard)/page.tsx`, route filesystem |
| Media/About/Settings route move | Source-confirmed; partial owner UI observed | `app/admin/(dashboard)/{media,about,settings}/page.tsx`; anonymous URLs 307 to login, owner API GETs 200 by shape. Owner About/Settings form geometry and Media list sampled read-only before latest shell/style changes; no save/copy/upload or full UI acceptance. Inherited public chrome now hidden on Admin routes only |
| Page access policy | Experience API gate locally corrected | Original non-owner probe found Experience GET 200 and invalid writes reaching 400/500. Owner unlocked only its API route. New non-owner received 403 for Experience GET/POST/PUT/DELETE, anonymous callers 401, owner GET 200/invalid PUT 400. Public About 200 and Experience row count unchanged. No valid Experience write tested |
| Login | Observed unauth layout; sign-in behavior unverified | `tests/admin-login.browser.test.mjs` reported 1/1 in Docker at 320/375/390/640/768/1024/1440 light/dark: no overflow, one `h1`, noindex, labelled email/password fields >=44px, submit >=48px, card fit and no page errors. `GET /admin/login` 200 with robots meta. Owner-provided session enabled read-only browsing; actual sign-in/error and non-owner sign-out flows were not exercised here |
| Owner dashboard/Logs read-only render | Observed limited pass | `/admin` rendered in owner session, `/admin/logs` rendered a log list; no log values recorded, no actions clicked. Count/draft accuracy and CRUD unverified |
| Dashboard containment/layout | Observed before/after, selected widths | Before Admin-only fix: viewport 390 dark, main x15..375, internal right edge x566 hidden by root clip. Layout/dashboard min-width/minmax changes and new stats `md:2`/`xl:3`, actions mobile 1/`lg:2`, panels `xl:2`. A later 320px check found a recent Project edit control at x334; truncating the title and keeping the status/edit group in view removed it. Direct 320px and authenticated same-origin iframe 390/640/768/1024/1440px checks show zero measured dashboard-panel offenders. Root scroll width alone is not evidence of containment; not a full width/theme/function pass |
| Sidebar mobile drawer | Observed read-only at 390; source-confirmed controls | 16 nav links measured min-44px, one active `aria-current="page"`, Escape/close restored focus to trigger; desktop/route focus behaviors not fully rechecked. No logout pressed |
| About/Settings form geometry | Observed before latest shell/style changes | Legacy About originally had 14 unlabeled fields; IDs/labels and 44px minimum text input height added. Same-origin offscreen iframe at 320/390/768/1440: 14 labelled, no overflow; legacy warning retained. Settings: seven labelled fields, no overflow at 320/390/640/768/1024/1440 before latest visual alignment with About. No typing/save/reopen or field values recorded |
| Sampled Admin route containment | Authenticated read-only sweep expanded | Owner-authorized Buildlog mobile cards passed sampled widths earlier. This pass loaded nine Testimonials/Certifications/Community Wall/Resume/Experience Admin list/new/settings routes at 320/390/768/1440: HTTP 200, no out-of-viewport controls or page errors, eight owner API GETs 200. Not CRUD or complete visual acceptance; locked accessibility issues below |
| Owner-authorized Admin accessibility | Narrow four-file fix verified | Seven Testimonial and 14 Experience fields now have associated IDs/labels; icon-only Edit links have row-specific names. Authenticated browser recheck at 320/390/768/1440 found zero unassociated fields, unnamed Edit links or visible control overflow on these four pages. No public source or other locked files changed; not a full screen-reader/contrast audit |
| Retired Changelog Admin UI/API | Owner-directed removal; data preserved | Sidebar/list/new/edit/forms/API removed. Authenticated old `/admin/changelogs` bookmarks including `/new` and `/[id]` redirect to `/admin/buildlog`; public `/changelog` still 308s to `/buildlog`. Tested GET/POST/PUT/DELETE against retired API return 404. Legacy tables/rows and unused locked-public-side helper/component were not deleted |
| Inherited root chrome/metadata | Admin visual isolation observed; render-time decision pending | Owner authorized removing public chrome from Admin while preserving public pages. `app/admin/layout.tsx` styles hide inherited Navbar/Footer/chat/rails only on Admin; `noindex` remains and Admin canonical is absent. Browser checked Admin login at 320/390/768/1440 and public Home frame. Root components still mount invisibly and WebSite JSON-LD still inherits; true render-time omission would require a separate locked-root change |
| Connected `site_settings` schema | Confirmed supplied read-only observation | GET 200, one row; columns `id`, `site_name`, `seo_description`, `seo_keywords`, `github_url`, `twitter_url`, `linkedin_url`, `email_address`, `created_at`, `updated_at`, `show_faq_section`; values omitted |
| Settings API | Scoped validation-only owner checks passed | `app/api/admin/settings/route.ts`: verified Admin then service role, singleton named columns, strict optional Zod PUT, private no-store GET/successful PUT. Four malformed/empty/unknown-field/insecure-URL PUT requests returned 400; private before/after GET objects compared equal without logging values. Seven labelled fields fit at 320/390/768/1440; valid save/reopen remains untested |
| Other anonymous API GETs | Observed status only | Current `GET /api/admin/{about,faqs,media}` plus Settings return 401; retired Changelog API GET returns 404. Earlier anonymous Experience 200 and current non-owner Experience 200 are separate observations; neither response body was recorded. Experience write boundary is confirmed unsafe by source and invalid non-owner method statuses |
| Other owner API GETs | Historical shapes | About legacy fields, FAQs `data` array and Media `data`/`count` were observed. Former Changelog `data` array was observed before route retirement; it is no longer accessible through `/api/admin/changelogs` |
| Connected content tables | Observed read-only | REST `?select=id&limit=0` returned 200 for `about_content`, `about_sections`, `changelogs`, `changelog_entries`, `faqs`. Further read-only `about_content` column inspection: `id`, `hero_title`, `hero_subtitle`, sections 1-4 `title`/`content`/`image_url`, `created_at`, `updated_at`; no values recorded |
| Connected Media schema | Observed read-only plus scoped fixture | REST `media?select=*&limit=1` confirmed `id`, `public_id`, `url`, `secure_url`, `width`, `height`, `format`, `bytes`, `alt_text`, `folder`, `created_at`, `updated_at`; no private values recorded. Temporary UI-uploaded PNG row was found and later verified absent with Cloudinary cleanup |
| Media UI and upload/deletion boundary | Scoped authenticated lifecycle passed; race/coverage gaps remain | Authenticated Media library loaded at 320/390/640/768/1024/1440. Invalid pagination 400, missing file 400, SVG 415. Test PNG uploaded via UI and displayed full name/dimensions/size; authenticated delete refused Blog cover ID/URL and Project gallery/URL uses (409), then removed both Media row and Cloudinary asset after references were removed. 44px delete button fits 320/390/768/1440. Count/Load more uses API total; mocked pagination and failed/successful delete tests 3/3. Only tracked rows managed; real >100 list, arbitrary URL references, concurrency and clipboard unverified |
| Retired About / Changelog Admin consumers | Source-confirmed; owner decisions implemented | Legacy `/admin/about` editor/API removed; historical saves never appeared on locked public About. `fetchAndSortChangelogEntrees` remains in `app/lib/utils.ts` only for unused public `ChangelogBento`, which was left untouched under public locks. Connected old tables are preserved pending export/backup and separate data cleanup approval |
| Logs schema and UI | Single-fixture resolve passed; provenance/policy unknown | Earlier REST `system_logs?select=id,resolved&limit=0` returned 400 / `42703`; latest identical probe returned **200**. Owner reported named `(resolved, created_at DESC)` index. Logs action rows initially had 62 out-of-viewport controls at 320px; stacking actions until `lg` yielded zero measured control overflow at 320/390/768/1440. A unique disposable log was resolved via Admin UI, verified in DB and deleted. No bulk clear or migration. Column provenance and effective RLS remain unverified |
| FAQ input/UI and authorization | Scoped authenticated lifecycle passed | `app/api/admin/faqs/route.ts` full strict POST, partial PUT with UUID id, boolean PATCH and UUID DELETE. One incomplete POST returned 400; a hidden disposable FAQ passed create/read/update/delete through the authenticated API and was verified absent afterward. FAQ list separates failures and withholds section switch on Settings error; PATCH/visibility/public effects and other role tests remain unverified |
| FAQ/settings RLS | Owner-supplied policy names plus one connected denial | FAQ visible SELECT `{public}`, site_settings SELECT `{public}`, system_logs INSERT `{anon,authenticated}` supplied by owner; no FAQ/Settings write policy in that result. Non-owner direct FAQ INSERT denied RLS 42501; Settings UPDATE/effective grants and future environment behavior unverified. Neither staged migration applied by us |
| Dashboard/Projects list | Observed partial owner render | Dashboard and Projects check Admin before service-role reads and show query errors instead of false zero/empty. Authenticated Project list and draft row rendered at sampled widths after streamed table rows settled; list header wraps and edit/delete targets are 44px. Count accuracy and destructive UI confirmation unverified |
| Security integration | Focused pass, limited scope | Docker `tests/admin-security.integration.test.mjs`: **14/14** after owner-approved Admin label/name change. Source assertions cover all seven Testimonial and 14 Experience label pairs and row-specific Edit names, plus Experience API auth boundary. Valid locked CRUD and full screen-reader audit remain open |
| Login browser test | Observed passed, layout scope | Docker `tests/admin-login.browser.test.mjs`: **1/1**, seven widths x two themes; screenshot `/tmp/playwright/admin-login-mobile-review.png` is outside the repo. Owner Dashboard/Logs read-only UI observed separately, not by this test |
| Combined Admin/public/locked regression | Observed pass after Admin label fix | Broad Docker Node run **68 pass, one existing Project skip** including Community Wall/Credentials/Resume integration. Public Home/About browser **1/1** passed; public source unchanged |
| Post-build smoke | Observed pass after Admin label fix | **25/25** after isolated build; not full owner CRUD acceptance |
| Static checks | Observed passed | Docker `npx tsc --noEmit`, focused ESLint on latest Admin/test edits and `git diff --check` passed after the final Dashboard edit |
| Isolated production build / preview | Observed pass after Admin label fix | Docker build succeeded with **129 static pages**, preexisting image lint warning and Edge notice. `.next-build` mounted outside workspace; preview on port 3000 remains running |
| Connected write and release checks | Scoped pass; broader acceptance blocked | Experience gate fixed and locally retested across roles without valid mutation or changing row count. Settings/About singleton save/reopen, other locked Admin workflows, publish/public effects, Settings UPDATE effective grants, bulk Logs and full root omission remain; no production-ready claim |
| Documentation whitespace check | Passed | `git diff --check` returned clean; no credentials or private response values recorded |

## 2026-10-03 Continuation

- Read-only connected field-length/type checks (no values recorded) found the
  current Settings fields within the new API limits. The legacy `about_content`
  row has nullable subtitle/image fields; its Admin GET now returns empty strings
  for those fields so an unchanged form is not rejected as `null`. No row was
  modified, and public About still does not consume this table.
- `tests/admin-error-states.test.tsx` mocked HTTP 503 responses for Settings,
  About and Media. All three show a retryable error instead of an empty or
  editable success state: 1/1 test passed via
  `docker compose -f docker-compose.alloy.yaml exec -T web npx tsx --test tests/admin-error-states.test.tsx`.
  TypeScript, focused ESLint and `git diff --check` passed after this source fix.
- Authenticated save/reopen, non-owner role behavior, Media upload, full owner
  visual review and the connected RLS catalog remain blocked. Selected dark
  Dashboard and About/Settings/Sidebar read-only checks are not full sign-off.
  FAQ/settings hardening was
  not applied by us. A newer read-only probe shows `system_logs.resolved` is now
  queryable, but its provenance, migration application and index are unknown; do
  not repeat the old missing-column finding as current state.
- Authenticated read-only Dashboard geometry exposed a second hidden overflow at
  320px: a recent Project edit link ended at x334. The unlocked Dashboard row
  now truncates the title and preserves its status/edit group; direct 320px
  measurement has zero out-of-viewport descendants. Same-origin authenticated
  iframe checks at 390/640/768/1024/1440px also measured zero dashboard-panel
  offenders. The iframe's initial 320px heading had not rendered at its first
  measurement, so that sample is supported by the separate direct check, not
  the iframe result. The static Admin security suite gained one source assertion
  test for these responsive and control-name contracts.
- Latest Docker verification: broad Admin/public Node tests **39 pass, one
  existing Project skip**, with a separate `.tsx` loader mistake resolved by
  `npx tsx --test` (**1/1**); focused TypeScript and ESLint passed. The final
  isolated production build passed (132 static pages; preexisting image lint
  warning and Edge-runtime notice), followed by Admin/login/Home/About smoke
  **10/10** and `git diff --check`. Neither a build nor source assertions prove
  connected write flows or production rollout.

## 2026-10-03 Guard Continuation

- The previously authenticated browser session expired. A direct read-only
  navigation to `/admin/blogs` redirected to `/admin/login`; no owner UI or
  connected write verification is claimed in this continuation.
- Unlocked Blogs and Analytics pages now check `requireAdmin()` before
  privileged reads instead of relying only on their layout. The source-order
  security assertion and anonymous direct-URL redirect checks now cover these
  pages. Docker Admin/login/Home/About focused checks passed **10/10**;
  `npx tsc --noEmit`, focused ESLint, and `git diff --check` passed.
- Full Docker regression after the guards: **39 pass, one existing Project
  skip**; isolated production build: **132 static pages**, with the preexisting
  `CurrentlyReadingBento` image warning and Edge-runtime notice. Post-build
  smoke: **10/10**. The Docker Compose web service remains running on port 3000;
  Playwright reached the login page through Alloy at port 8080, but owner UI
  cannot be retested until the owner signs in again.
- See `07-owner-actions.md` for the owner-only read-only catalog check, named
  locked-scope decisions, nonproduction mutation authorization and deployment
  gates. No migration, live mutation, locked source edit or credential handling
  occurred in this continuation.

## 2026-10-03 Admin-Only Shell and Form Pass

- Owner reported logging into Admin and confirmed the named Logs index on
  `(resolved, created_at DESC)`. The automated browser is a separate anonymous
  context and still redirects to login. Owner-authenticated page verification
  under the new shell, save/reopen, and connected policy results remain open.
- Owner authorized removing public chrome from Admin without editing public
  pages/layout. `app/admin/layout.tsx` now scopes display-only isolation to
  Admin routes, and clears Admin canonical while keeping noindex. Playwright
  measured hidden Navbar/Footer/chat and full-width main at 320/390/768/1440;
  the public Home retains visible chrome and canonical. The public components
  still mount invisibly and root WebSite JSON-LD remains, since the shared root
  was not changed. No pixel-perfect or true render-time isolation claim.
- FAQ list now distinguishes FAQ and Settings read failures and does not expose
  the homepage section switch when its state cannot load; edit icon has a name
  and 44px target. Settings now matches About form surfaces and min-44px text
  controls without changing values or write behavior. Source-level assertions
  cover the new state/geometry contracts; no owner-connected FAQ/Settings write.
- Docker TypeScript, focused ESLint, Admin error-state test **1/1**, broad
  Admin/public regression **42 pass, one existing Project skip**, isolated
  build **132 static pages** (preexisting image lint warning and Edge notice),
  post-build smoke **13/13**, and `git diff --check` passed. Stack retained.

## 2026-10-03 Owner-Authorized Admin Buildlog Pass

- Owner explicitly unlocked only the Admin Buildlog mobile layout and authorized
  disposable create/edit/delete tests. `LOCKED_PERFECT.md` records the limited
  permission. The Admin list now displays contained cards below `xl` and its
  existing table at desktop; project actions have 44px hit targets. No public
  Buildlog source, schema, settings or API was edited.
- A one-off in-memory owner session (no password, cookies or token recorded)
  rendered Admin Buildlog at 320/390/768/1024/1280/1440. Visible mobile
  cards/actions were within viewport, desktop table was present at `xl+`, and
  no Admin page errors appeared. Buildlog new/settings forms, Settings and FAQ
  controls fit at 320/390/768/1440. This is sampled geometry, not pixel-perfect
  owner approval of all pages.
- A subsequent source review found the Buildlog editor's five-column row could
  become too narrow alongside the fixed Admin sidebar. Its layout now steps
  through one/two/three/five columns rather than activating five at `lg`.
  Authenticated editor controls fit at 320/390/640/768/1024/1280/1440/1536px.
  The temporary in-memory session helper was removed after verification.
- One uniquely named draft/demo Buildlog project passed authenticated API
  create/read/update/delete. One hidden FAQ passed invalid-POST rejection and
  authenticated create/read/partial-update/delete. Final service-role read-only
  count checks confirmed zero fixtures remain. Existing portfolio rows were
  not edited. The temporary session helper was removed; no credential/session
  artifact remains in the repository.
- Docker public Buildlog integration **6/6**, version **4/4**, browser **1/1**;
  broader Admin/public regression **43 pass, one existing Project skip**;
  TypeScript, focused ESLint, isolated build **132 static pages** (preexisting
  image lint and Edge notices), post-build smoke **20/20** and whitespace checks
  passed. No migration or production sign-off.
- After the editor breakpoint change, focused Admin/Buildlog/Home checks
  **18/18**, TypeScript, ESLint, final isolated build (132 static pages), and
  post-build smoke **20/20** passed. Public Buildlog source remains untouched.

## 2026-10-03 Admin Blog and Project Continuation

- In-memory owner authentication exercised `/admin/blogs/new`, `/admin/projects/new`,
  and their lists at 320/390/768/1024/1440px. Visible controls were contained.
  A stale development response for the Project list initially omitted its
  Admin wrapper and retained a canonical link; after a scoped Project-list
  change forced that route to recompile, subsequent authenticated requests at
  all sampled widths had the wrapper and no canonical. This is a dev-observed
  recovery, not a claim about every deployed cache state. List rows are streamed;
  assertions wait for the table rather than treating initial empty markup as a
  missing record.
- Temporary draft Blog: invalid create rejected 400; create, filtered-list
  visibility, editor render, update, stale-edit rejection 409, archive and
  archived delete passed. Temporary draft Project: invalid create rejected
  400; create, list visibility, editor render, update, stale-edit rejection
  409 and delete passed. Both were verified absent afterward by scoped
  service-role count queries. Existing portfolio records were not changed,
  neither draft was published, and the in-memory session helper was removed.
- Blog filter controls and archive/edit/delete targets now have 44px minimum
  targets; Blog and Project list headings wrap, and Project delete names its
  associated record. Only Admin source was edited. No public Blog/Project
  presentation, production data, schema or migrations were changed.
- Docker broad regression **49 pass, one existing Project skip**, post-edit
  isolated build **132 static pages**, post-build smoke **20/20**, TypeScript,
  focused ESLint and whitespace checks passed. Existing image lint and Edge
  notices remain; full Admin production acceptance is still open.

## 2026-10-03 Admin Media Continuation

- Authenticated owner-session Media API GET with limit 1 returned an array and
  total count; invalid pagination returned 400, missing file 400 and SVG 415.
  Browser Media library loaded at 320/390/640/768/1024/1440 with no visible
  action overflow or runtime error. One uniquely named one-pixel PNG was
  uploaded using the page's file picker, confirmed in the UI and connected DB,
  then both its DB row and Cloudinary resource were removed and verified absent.
  Existing media was untouched; no passwords, tokens or private response bodies
  were saved or logged. The temporary in-memory test helper was removed.
- Source review found the page fetched only the first 100 items and described
  that length as total files. Media now reads the API's total count and provides
  a Load more action; if a later page fails, earlier images remain and retry is
  available. A mocked pagination/failure/retry test passed **2/2** along with
  the existing editor failure test. Happy DOM lacks the CSS image positioning
  used by Next Image, so its fill-image warnings are test-environment noise,
  not a browser layout finding. A real >100-row page and clipboard were not
  exercised. No Media deletion endpoint/UI exists; the fixture cleanup was
  outside the app, not evidence of owner-facing deletion.
- The current Docker image initially lacked Chromium and its shared libraries;
  Playwright browser/dependencies were installed **inside the running web
  container** before the authenticated test. Broad regression **49 pass, one
  existing Project skip**, isolated build **132 static pages**, post-build smoke
  **20/20**, TypeScript, focused ESLint and whitespace checks passed. Existing
  image lint and Edge-runtime notices remain. Stack retained; no public source
  or schema/migration change.

## 2026-10-03 Owner-Authorized Media Delete Continuation

- Owner requested tracked Media upload/delete management, image names, and
  refusal when used by Blog/Project. The Admin library now shows full stored
  names (existing uploads store their filename in `alt_text`), dimensions and
  size. A named 44px Delete action requires confirmation and reports 409
  in-use errors without removing the card. It removes the card only after an
  authenticated API success.
- DELETE verifies Admin before service-role lookup, validates UUID/configuration,
  checks Blog cover/social IDs, Project cover IDs, gallery IDs, matching cover
  URLs and content Cloudinary URL/public-ID references. Query failure blocks
  removal. For unused tracked media it deletes the DB row, then asks Cloudinary
  to destroy the stored public_id with CDN invalidation; if Cloudinary fails,
  it attempts to restore the row and returns an error. DB/Cloudinary cannot be
  made atomic here; a concurrent reference or failed compensation needs manual
  review. Hard-coded external URL uses outside checked content are not fully
  discoverable. No public source or migrations changed.
- A temporary PNG uploaded via Admin UI was protected by a disposable Blog
  cover (ID and URL) and Project gallery and URL-only cover (all 409), then
  removed using the Admin delete button when unused. DB count and Cloudinary
  404 verification found no fixture; temporary reference rows and in-memory
  session helper were removed. No existing asset was touched. The first cleanup
  test needed a correction for the Cloudinary SDK's nested 404 error shape;
  the corrected end-to-end run passed.
- Docker broad regression **50 pass, one existing Project skip**, final isolated
  build **132 static pages**, post-build smoke **21/21**, mocked editor and
  Media pagination/delete **3/3**, TypeScript, focused ESLint and whitespace
  checks passed. Preexisting image lint and Edge notices remain. No full Admin
  or production sign-off.

## 2026-10-03 Admin Changelog and Logs Continuation

- The Changelog list/new and Logs views rendered in an in-memory owner browser
  at 320/390/768/1440px. Before the fix, Logs had 62 controls outside the
  320px viewport, largely row actions pushed right by message content. Logs
  now stacks row actions below `lg`, wraps long messages/badges and gives action
  controls 44px minimum height; remeasurement found zero uncontained controls
  at those widths. No existing log values were recorded.
- Before retirement, Changelog accepted arbitrary POST JSON and returned 500
  for bad fields. A scoped hardening pass then checked Admin before service-role
  reads/writes and validated strict editor fields. A disposable draft passed
  authenticated create/read/partial update/delete and was verified absent.
  Owner subsequently chose to remove this unused workflow. None of this was
  the locked public Buildlog or a new public Changelog page.
- One uniquely named disposable log was inserted, marked Resolved via the
  Admin button, confirmed resolved in a scoped DB query, then deleted and
  verified absent. Clear Resolved and Simulate Error were **not** clicked;
  they could affect or leave unidentifiable existing records. The connected
  policy catalog and column provenance remain unknown; no migration applied.
- Broad Docker regression **51 pass, one existing Project skip**, isolated
  build **132 static pages**, post-build smoke **22/22**, TypeScript, focused
  ESLint and `git diff --check` passed. The preexisting image lint warning
  and Edge-runtime notice remain. No public or named locked source changed.

## 2026-10-03 Legacy Changelog Retirement

- Owner explicitly chose to remove the separate Changelog feature while
  retaining public Buildlog. Removed the Sidebar Changelogs item, legacy Admin
  list/new/edit pages, editor/delete components and `/api/admin/changelogs`
  route. No new Changelog can be saved from Admin. An optional catch-all at
  `/admin/changelogs/[[...slug]]` preserves old owner bookmarks by redirecting
  them to `/admin/buildlog`; authenticated root/new/old-ID URL checks passed.
  Anonymous visits still redirect to `/admin/login`. Retired API GET/POST/PUT/
  DELETE each returned 404. Public `/changelog` still returns 308 to `/buildlog`.
- Connected `changelogs` and `changelog_entries` tables/rows were **not**
  deleted. Unused public `ChangelogBento` and its utility helpers remain
  untouched under the public-source lock. A future owner-backed data/schema
  cleanup is separate from making the Admin navigation truthful. No connected
  mutation or migration was performed during this retirement.
- Post-change Docker regression **51 pass, one existing Project skip**,
  isolated build **129 static pages** (three legacy editor pages removed),
  post-build smoke **22/22**, public Buildlog browser **1/1**, TypeScript,
  focused ESLint and `git diff --check` passed. The earlier image lint and
  Edge-runtime notices remain. Preview stack remains running.

## 2026-10-03 Non-Owner Authorization Probe

- Created a disposable Supabase Auth account with a generated password held
  only in process memory; signed in as a regular non-owner. GET requests to
  five sampled Admin pages redirected outside Admin. Sampled unlocked Settings,
  About, FAQ and Media API reads/writes returned 403; tested Testimonials,
  Certifications, Resume, Community Wall and Buildlog reads/writes returned
  401, as did their sampled nested routes. Blog and Project invalid POSTs
  returned 403. No private response body or credential was recorded.
- **High-priority locked finding:** `/api/admin/experience` GET returned 200.
  PUT with an empty ID returned 400, POST with invalid JSON returned 500, and
  DELETE without an ID returned 400, instead of denying the non-owner before
  processing. Source in locked `app/api/admin/experience/route.ts` checks only
  `auth.getSession()` and then creates a service-role client for writes without
  checking `ADMIN_EMAIL`. This is a verified authorization gap in the request
  path; a valid non-owner write was deliberately **not** attempted. No existing
  Experience row or other portfolio record was changed.
- The disposable Auth account was deleted successfully. No app source, locked
  Experience scope or migration was changed in this pass. The earlier test/
  build successes do not override this release blocker. An explicit owner
  unlock limited to the Experience Admin API is required before code correction
  and anonymous/non-owner/owner regression checks. Connected FAQ/site-settings
  policies still require a separate read-only catalog result.
- A separate disposable non-owner account attempted a direct Supabase FAQ INSERT
  with `is_visible=false`. Connected RLS denied it with `42501`; scoped count
  confirmed no row was created. The account and any matching fixture row were
  removed in cleanup. This is evidence for FAQ INSERT only; it does not
  establish Settings UPDATE denial or the exact policy definitions.

## 2026-10-03 Admin Analytics and Settings Read-Only Pass

- Read-only connected counts found zero top-five view/reaction slugs without a
  currently live article, and zero orphan view slugs in the sampled result.
  `getServerStats()` previously selected published posts without a publication
  date cutoff and sliced top metrics before excluding stale slugs. Admin
  Dashboard/Analytics now filter only top links to published-and-due posts
  before slicing; lifetime totals remain unchanged. No article data or slug
  values were logged, and no public route/source was edited. Future archive/
  schedule transitions and cache timing still need lifecycle acceptance.
- Owner-scoped Settings GET was compared in memory before and after four
  rejected PUTs: malformed JSON, empty object, unknown field and non-HTTPS
  social URL each returned 400, with unchanged values. Analytics and Settings
  rendered in an in-memory owner browser at 320/390/768/1440px; Analytics
  overview/Lighthouse sections appeared, Settings had seven associated fields,
  and no visible controls overflowed or triggered page errors. No valid
  singleton write or public metadata change was made. The temporary session
  helper was removed.
- Lighthouse still points at the checked-in production origin rather than the
  sandbox preview; Alloy intentionally displays unavailable scores. Actual
  PageSpeed acceptance requires the owner's deployed domain to be reachable.
  This does not resolve the locked Experience authorization blocker or the
  connected policy-catalog gate. No migration applied.
- Latest Docker broad regression **52 pass, one existing Project skip**,
  isolated build **129 static pages**, post-build smoke **23/23**, TypeScript,
  focused ESLint and `git diff --check` passed. Existing image lint warning
  and Edge-runtime notice remain; preview service retained.

## 2026-10-03 Owner-Authorized Experience API Gate Fix

- Owner supplied explicit permission limited to
  `app/api/admin/experience/route.ts` authorization, with no public About/
  Experience or other locked presentation change. Replaced GET's open read
  and POST/PUT/DELETE `getSession()` checks with verified `requireAdmin()`;
  service-role creation remains after the gate. Payloads, data access model
  for the owner, revalidation and public Experience code are unchanged.
- Anonymous GET/POST/PUT/DELETE now return 401 before payload processing. A
  newly created disposable non-owner received 403 for all four methods;
  owner GET remained 200 and an invalid owner PUT returned 400. Public `/about`
  returned 200 and the Experience row count was identical before and after.
  Neither a valid Experience mutation nor private response values were
  exercised. Temporary non-owner account and in-memory test helper removed.
- Owner supplied connected `pg_policies` names/roles/commands: FAQ public
  visible SELECT, site_settings public SELECT, system_logs INSERT for anon and
  authenticated. No broad FAQ/Settings write policy appeared in that list;
  a prior disposable non-owner direct FAQ INSERT was denied 42501. Exact
  effective grants, Settings UPDATE and Logs policy expressions/provenance
  remain unverified. **No staged migration applied.**
- Broad Docker regression **53 pass, one existing Project skip**, isolated
  build **129 static pages**, post-build smoke **24/24**, public Home/About
  browser **1/1**, TypeScript, focused ESLint and `git diff --check` passed.
  Existing image lint/Edge notices remain; Compose preview retained.

## 2026-10-03 Remaining Locked Admin Read-Only Sweep

- In-memory owner browser sampled `/admin/testimonials`, `/new`,
  `/admin/certifications`, `/new`, `/admin/community-wall`, `/settings`,
  `/admin/resume`, `/admin/experience`, `/new` at 320/390/768/1440px.
  All nine routes returned HTTP 200 with no visible out-of-viewport controls,
  alert states or runtime errors. Owner GETs to Testimonials, Certifications,
  Community Wall/settings, Resume, Experience and Buildlog/settings all
  returned 200. No response bodies, existing row values, screenshots or
  session material were recorded. No form submitted or destructive action
  clicked. The one-off in-memory session helper was removed.
- Limited DOM-name measurement found seven unnamed icon links in the locked
  Testimonials list and seven unassociated fields in its new form; Experience
  list had four unnamed icon links and its new form had 14 unassociated fields.
  Source confirmed Edit links with only an SVG and sibling labels without
  `htmlFor` or wrapping field. Other sampled routes had zero such results
  under this heuristic, not a full screen-reader/contrast audit. Fixes require
  owner permission specifically for these locked Admin form/list files;
  public Home/About and unrelated locked scopes remain untouched.
- Docker public Community Wall/Credentials/Resume integration **14/14** and
  public Community Wall browser **1/1** passed, with no portfolio mutation.
  No application source changed in this pass, so the previous isolated build
  and broad regression remain the latest code verification; no production
  sign-off. Settings/About singleton save/reopen still waits for a backup or
  disposable environment.

## 2026-10-03 Owner-Authorized Admin Labels and Backup Guidance

- Owner explicitly unlocked only the Testimonial/Experience Admin form and
  list files for associated labels and Edit-link names. Seven Testimonial and
  14 Experience fields now have matching IDs/labels; the Experience checkbox
  remained correctly wrapped by its label. Edit links are named with row
  context. No values, submit handlers, mutation APIs or public Home/About
  source changed. `LOCKED_PERFECT.md` records the narrow amendment.
- In-memory authenticated browser check at 320/390/768/1440px for the two
  lists and two new forms found zero remaining unassociated fields, unnamed
  Edit links or out-of-viewport controls; no page errors. The temporary
  session helper was removed without logging credentials or private content.
- Docker focused security source test **14/14**, broad public/Admin regression
  **68 pass, one existing Project skip**, isolated production build **129 static
  pages**, post-build smoke **25/25**, public Home/About browser **1/1**,
  TypeScript, focused ESLint and `git diff --check` passed. Existing image lint
  and Edge-runtime notices remain; preview service retained. This is not a
  full screen-reader/contrast audit or valid owner CRUD sign-off.
- Owner requested complete database recovery guidance before singleton tests.
  `08-backup-restore.md` documents Supabase paid-plan restore-to-new-project,
  off-site CLI roles/schema/data exports and reviewed logical restore, plus
  separately backed-up Storage bytes, Auth/project settings and Cloudinary
  assets. No SQL export, backup file, data value or credential was created in
  or committed to this repository. Settings/About valid save/reopen remains
  untested pending a verified backup or disposable development project.

## 2026-10-03 Admin-Polishing Regression Review

- Compared `3231400..HEAD`, the pre-Admin-polishing commit through the current
  checkout. No public page/component, public root layout, global stylesheet,
  public route, middleware or Next configuration file changed in that range.
  The only application files outside Admin paths are `app/lib/admin-auth.ts`,
  `app/lib/supabase/auth.ts` and `app/lib/stats/server-stats.ts`. The auth
  helper's callers are Admin login/sidebar; the stats helper's callers are
  Admin dashboard/analytics. The Admin-only nested layout uses selectors
  conditional on `data-admin-root`; public root chrome is still mounted on
  Admin routes, not removed at render time. Two staged migration files were
  added in the range but were not applied by this review.
- Read-only Docker regression across Admin security/shell/login, public Home,
  About, Blog, Buildlog, Community Wall, Projects, Credentials, Resume,
  Contact, Links, navigation, legal and preview routes: **77 passed, one
  existing Project preview skip, zero failures**. Mocked Admin error-state
  tests and Buildlog version tests: **7/7**. Docker `npx tsc --noEmit` and
  `npx next lint` succeeded; lint retains the existing
  `CurrentlyReadingBento.tsx` image warning.
- Isolated production build using `NEXT_DIST_DIR=.next-build` succeeded with
  **129 static pages**, the existing image lint warning and Edge-runtime
  notice. Post-build Admin/public smoke: **29/29**. The port-3000 preview
  service remained running. This review did not modify application code,
  connected records, migrations, or portfolio assets.
- No tested public rendering or route regression was found. This is not
  pixel-perfect owner acceptance, exhaustive Admin workflow testing or a
  deployment check. Valid Settings/About singleton saves still require a
  verified backup or disposable project; authenticated owner CRUD and
  production-domain behavior remain separate acceptance gates. Historical
  `git diff --check 3231400..HEAD` reports two trailing-whitespace lines in
  Admin About/Settings; neither is a runtime finding or a change in this review.

## 2026-10-04 Admin Visual-System Iteration

- Owner authorized an Admin-wide visual consistency pass and desktop sidebar
  expand/collapse, explicitly leaving public pages unchanged. An Admin-scoped
  stylesheet now defines the previously unconfigured `ink`, `surface`, and
  `accent-signal` utilities used by Admin lists/forms against the public site
  tokens. The dashboard uses the same neutral surfaces and typography; the
  desktop sidebar switches between 256px navigation and an 80px labelled icon
  rail, with its preference stored locally. Mobile keeps its full drawer.
  Blog saved-preview article typography is excluded from the Admin page-title
  rule. No public layout, global CSS, Tailwind config, page or component was
  edited. These are source and limited browser observations, not owner visual
  acceptance of all authenticated pages.
- Docker typecheck and lint passed (the pre-existing `CurrentlyReadingBento`
  image warning remains). Admin/public full regression **78 pass, one existing
  Project skip**, mocked error/version checks **7/7**, isolated production build
  **129 static pages**, and post-build smoke **29/29** passed. At 390px, the
  anonymous Admin login had no document overflow; a browser confirmed both
  light/dark Admin token values and the scoped stylesheet loaded through the
  Alloy preview. The owner browser context was anonymous and redirected from
  `/admin` to `/admin/login`. A source-contract test checks sidebar widths,
  labels, persistence and layout selectors, but does not replace authenticated
  interaction or visual testing.
- **Still pending:** owner-authenticated desktop/mobile visual review of every
  Admin route in both themes, interactive expand/collapse and persistence,
  full keyboard/contrast review and connected workflow acceptance. Existing
  Settings/About singleton backup and deployed-domain gates remain unchanged.

## 2026-10-04 Fixed Admin Theme Continuation

- Owner asked for one Admin theme rather than mirroring the public site's
  light/dark preference. The Admin root is now a fixed dark workspace with
  local canvas, surface, ink, muted-text and border colors; it supplies its
  own `dark` scope for existing Admin dark-variant utilities. The mobile
  navigation portal receives the same dark scope. Admin-only CSS refines form
  labels, inputs, placeholders, selects and their arrow, checkboxes/radios,
  outlined and primary actions, panels, tables, focus and disabled states.
  The saved Blog preview excludes Admin overrides for its article headings,
  tables and controls. No public page, shared root, theme setting, global
  stylesheet or public component was edited.
- Browser login checks at 320/375/390/640/768/1024/1440 with **both public
  theme preferences** confirmed the Admin root remained dark, labelled fields
  and submit control fit, no horizontal overflow, and no page errors. A
  temporary DOM style probe (removed immediately) confirmed identical dark
  card/field/select/button colors under both public preferences, 44px select
  and primary button, and a discernible field border. This is stylesheet
  evidence, not an authenticated page-by-page pixel audit. Initial dev-server
  requests served a stale compiled Admin layout; restarting the existing
  Compose web service cleared that stale response before validation. The
  service remains running.
- Docker full regression **78 pass, one existing Project skip**, mocked Admin
  error-state/Buildlog version checks **7/7**, TypeScript and lint pass (the
  existing `CurrentlyReadingBento` image warning remains), isolated build
  **129 static pages**, post-build smoke **29/29**. No connected content was
  modified. Owner-authenticated visual review of all Admin routes, sidebar
  expand/collapse interaction, full keyboard/contrast testing and singleton
  backup/restore checks remain open; no pixel-perfect or production sign-off.

## 2026-10-04 Authenticated Admin Read-Only Sweep

- Owner asked for an all-page check and offered to temporarily disable login.
  Login, middleware and API authorization were **not** bypassed: a one-off
  in-memory Supabase owner magic-link session was established only after
  confirming the configured owner Auth account already existed. The temporary
  test runner made read-only page visits, closed its browser, locally revoked
  its session, and was removed. No password, token, cookie, private row value,
  response body, screenshot or test asset was saved. No Save/Delete/Publish,
  moderation, bulk-log or file-upload action was clicked.
- First pass: 32 Admin routes (24 primary/list/new/settings routes, seven
  available edit routes, and one saved Blog preview) rendered at
  320/390/768/1440 with no page errors or out-of-viewport controls. The
  Project new/edit forms each exposed 12 fields without associated labels.
  An immediate sidebar width read occurred before its CSS transition ended;
  it was a test-timing issue, not evidence of a permanent width defect.
- Owner-approved Admin-only corrections associated those 12 Project fields,
  made rich-editor keyboard focus visible, kept table actions sticky within
  labelled keyboard-scrollable regions on narrow screens, enlarged icon-only
  targets, wrapped dense heading/action groups and long table/queue text, and
  improved the short-screen media picker upload area and selected-image badge.
  Saved article-preview text/table styling and public pages were left alone.
- Second authenticated sweep: **32/32 routes**, four widths each, zero
  measured document/control overflow, unassociated visible form fields,
  page errors or alert states. Desktop 256px/80px sidebar switching and
  80px content offset, mobile drawer open/Escape/focus return, six list-table
  sticky actions, the Project editor focus ring and media picker at 320x640
  passed. The temporary session was locally revoked after the run.
- Docker full regression **79 pass, one existing Project skip**, TypeScript,
  lint (pre-existing `CurrentlyReadingBento` image warning), isolated build
  **129 static pages**, and post-build smoke **30/30** passed. No migration,
  connected content or portfolio asset was modified. This is measured
  read-only geometry/interaction coverage, not a pixel-perfect screenshot
  audit, screen-reader/contrast certification, valid write-flow acceptance,
  owner taste approval or production deployment sign-off. Settings/About
  singleton recovery and broader workflow gates still require their
  separate approvals and safeguards.

## 2026-10-04 Dashboard and Sidebar Polish

- Owner requested the site's own mark in place of the Admin `H`, hidden sidebar
  scrollbars, and a full-width one-column Quick Actions panel above side-by-side
  Recent Blog Posts and Recent Projects on desktop. Reused the existing public
  dark-navigation logo asset without changing it. Grouped sidebar links under
  Overview, Content and Operations; desktop and mobile navigation still scroll
  by wheel, touch and keyboard even though their scrollbar is visually hidden.
  The 256px/80px expanded/collapsed widths, URL destinations and real auth
  boundary remain unchanged. No public source, data row or migration changed.
- A one-off in-memory owner browser session verified Dashboard at
  320/390/768/1024/1280/1440px: logo asset loaded, six Quick Actions occupied
  one column above the recent section, both recent panels aligned in two
  columns at `xl`, no measured document or visible-control overflow, and no
  browser page errors. Desktop collapse retained an 80px content offset;
  at 390x620 the mobile drawer was scrollable with no visible scrollbar and
  Escape restored focus. All six Quick Action destinations and two sampled
  recent edit links returned 200 with the owner session. Four database-backed
  Dashboard counts matched read-only connected counts in memory, without
  recording any values. The temporary session was locally revoked, and its
  runner removed; no content mutation or private artifact was made.
- Docker full regression **80 pass, one existing Project skip**, TypeScript,
  lint (the pre-existing `CurrentlyReadingBento` image warning), isolated build
  **129 static pages**, post-build smoke **31/31**, and whitespace check passed.
  This verifies the requested layout and sampled read-only functions, not
  exhaustive editor writes, every visual pixel, all screen-reader behavior or
  production deployment. Owner visual acceptance remains separate.

## 2026-10-04 Dashboard Status and Scrollbar Pass

- Owner requested quieter Live/Published/etc. tags, subtler gray Dashboard
  dividers and a designed right-edge page scrollbar. The recent Blog and
  Project rows now use shared Admin-only semantic status pills with a small
  colored dot: live/published, draft/scheduled and neutral/archived/unavailable.
  Dashboard separators are explicitly soft gray. The document scrollbar has
  a thin dark track and muted rounded thumb only while an Admin route exists;
  public pages and the separately hidden-but-scrollable sidebar scrollbar are
  unchanged. Recent rows stack their title and action group on phones so badges
  remain readable without clipping.
- Authenticated read-only browser checks at 320/390/768/1280/1440 found ten
  current badges, no page errors, no persistent horizontal overflow, all
  badges within the viewport after the responsive sidebar transition, a gray
  divider, and the Admin-only scrollbar colors. Public Home did not inherit
  those scrollbar colors. A temporary style probe for all three badge variants
  (removed immediately) measured normal-text contrast of 10.60:1, 10.83:1
  and 8.80:1. Only the live/published variant appeared in current connected
  rows, so other variants were style-probed rather than tested against actual
  records. The temporary owner session was locally revoked; no data values,
  credentials, screenshots or connected mutations were retained.
- Docker full regression **80 pass, one existing Project skip**, TypeScript,
  lint (pre-existing image warning), isolated build **129 static pages** and
  post-build smoke **31/31** passed. No public source was changed. This is a
  measured UI pass, not owner visual approval or production deployment sign-off.

## 2026-10-04 Dashboard Hover and Final Read-Only Check

- Refined only the Admin Dashboard's stat-card, icon, Quick Action, View all
  and row-edit hover/focus styles, with restrained surface/border changes and
  no scaling or position transitions. View all links have 44px-high targets;
  active sidebar links retain a distinct state under hover. Reduced-motion
  preference removes Dashboard color transitions. Public source and the other
  Admin routes were not edited.
- A short-lived in-memory owner session measured the Dashboard at
  320/390/768/1280/1440px: no out-of-viewport links, status badges or page
  errors; six Quick Actions and two recent panels remained present. Browser
  hovered four representative targets (stat, action, View all and edit),
  confirmed visible color/border feedback and unchanged target dimensions,
  verified View all underline and keyboard-visible focus, and checked active/
  inactive sidebar hover colors. Reduced-motion computation returned zero
  transition duration. All six Quick Action GET destinations returned 200;
  four DB-backed displayed counts matched read-only connected queries without
  recording their values. No mutation or private screenshot was made; the
  temporary runner was removed and its session locally revoked.
- Docker full regression **80 pass, one existing Project skip**, TypeScript,
  lint (pre-existing image warning), isolated build **129 static pages** and
  post-build smoke **31/31** passed. This completes the scoped Dashboard
  read-only hover/layout/function pass, not owner visual approval, all Admin
  workflows, pixel-perfect certification or deployment sign-off.

## 2026-10-04 Quick Actions Column Correction

- Owner corrected the earlier one-column instruction: Quick Actions should
  have **three columns on desktop**. The six actions now form one column below
  `md`, two columns from `md`, and three from `lg`; the Recent Blog Posts and
  Recent Projects panels remain below. No public source or connected data was
  changed.
- An in-memory authenticated browser check at 320/390/768/1024/1280/1440px
  observed the expected 1/1/2/3/3/3 columns, all six links fully within the
  viewport, no document overflow or page errors, and the recent panels below
  the actions. The temporary session was locally revoked and its runner
  removed. Focused Admin/public checks **21/21**, TypeScript, focused ESLint
  and whitespace checks passed. The prior full regression/build belongs to
  the preceding Dashboard edit; a new isolated build was not needed for this
  single responsive-class correction.

## 2026-10-04 Analytics Page Pass

- Owner moved to Analytics for Admin-only polishing. Overview metrics, top
  article lists, reaction/category breakdown and PageSpeed score panels now
  use the same restrained dark surface hierarchy as the Dashboard, clearer
  group spacing, long-category wrapping and keyboard-visible article-link
  hover/focus without layout movement. Article links opening in new tabs now
  specify `noopener noreferrer`. Score bars are decorative; visible scores
  include the `/ 100` context. When the sandbox intentionally has no PageSpeed
  scores, a status note explains the dashes rather than implying zero or
  silently leaving empty panels.
- `getBuildTimeStats()` now reads the existing cached public Blog index instead
  of only local MDX files, so Published articles and category distribution
  describe the same visibility-filtered collection as the public Blog. An
  owner-session comparison confirmed the displayed Published articles value
  matches public RSS count; it does **not** match the raw published-and-due DB
  count, which does not apply all public visibility filters. No Blog public
  source, database record, schema or migration was changed.
- Authenticated read-only browser checks at 320/390/768/1024/1280/1440px:
  HTTP 200, active Analytics navigation, six sections, eight score tiles,
  zero visible control overflow, document overflow, page errors or unexpected
  alert states. The sandbox PageSpeed note appeared at all widths. All nine
  top-article links explicitly had `noopener` and reached HTTP 200. Sampled
  link hover changed the surface without moving its target, keyboard focus
  was visible, and the article destination returned 200. No private values,
  credentials, response bodies or screenshot were stored; temporary owner
  sessions were locally revoked and the runner removed.
- Docker full regression **81 pass, one existing Project skip**, TypeScript,
  lint (pre-existing image warning), isolated build **129 static pages**, and
  post-build smoke **32/32** passed. Actual PageSpeed scores still require an
  owner-confirmed reachable production URL and API availability. This is a
  scoped read-only Analytics pass, not deployed-domain Lighthouse acceptance,
  owner visual sign-off, or certification of every Admin workflow.

## 2026-10-04 Analytics Insight and PageSpeed Continuation

- Owner confirmed `https://harisx404.vercel.app` as the intended production
  URL and delegated the circular-chart and extra-metric design. Top viewed and
  most reacted panels now show ranked article rows with a neutral circular
  share graphic, raw count and an explicit explanation that the denominator is
  the **five articles shown**, not all site traffic. Six linked Owner signals
  show draft/scheduled articles, published projects, pending notes, visible
  FAQs and tracked images, with missing query values shown as `—` instead of
  false zeros. These are bounded count-only queries after verified Admin auth;
  no invented traffic trend or unique-visitor rate was added.
- Authenticated read-only browser review at 320/390/768/1024/1280/1440px
  found nine linked article rings and six signal cards: every shown percentage
  matched its raw count within its top-five panel; all six count cards matched
  connected count-only queries; all nine article links and six signal
  destinations returned 200. Zero measured control/document overflow, page
  errors, unknown counts or unexpected alerts. Sampled article hover/focus
  remained visible without shifting the link. Sandbox Lighthouse continued
  to explain the unavailable scores. The temporary owner session was locally
  revoked and its runner removed; no credential, response value, screenshot,
  content mutation or migration was retained.
- The PageSpeed integration checks the production target before requesting
  mobile/desktop reports, rejects off-origin redirects and malformed/out-of-
  range category scores, keeps a valid device report when the other fails,
  normalizes missing fetch times, and reports failures without logging API
  response bodies. It is not a publicly callable server action. Mocked tests
  covered preview bypass, healthy reports, target 404, off-origin redirect,
  API quota/partial result, invalid scores and target timeout: **7/7**.
  Successful scores show their UTC check time and `/100` context.
- The confirmed production homepage returned **HTTP 404** on two sandbox
  checks. Real PageSpeed success therefore **cannot be verified yet** and the
  deployment must be corrected before sign-off; the Admin intentionally shows
  unavailable rather than scores for an error page. The hourly cache may take
  up to an hour to refresh after that correction. A production PageSpeed API
  key may be needed for quota; never put it in the repository or chat.
- Docker full regression **81 pass, one existing Project skip**, mocked
  Admin/Buildlog/PageSpeed tests **14/14**, TypeScript, lint (pre-existing image
  warning), isolated build **129 static pages**, and post-build smoke **32/32**
  passed. Public source remained unchanged. Owner visual acceptance and live
  production Lighthouse checks remain open.

## 2026-10-04 Lighthouse Streaming Follow-Up

- Moved the Lighthouse check behind a server-rendered Suspense boundary after
  the parent page's Admin authorization gate. Content and engagement panels no
  longer wait for a slow external PageSpeed response before rendering; the
  Lighthouse section shows a bounded checking state until its own result or
  failure arrives. Production target preflight is capped at five seconds,
  each parallel device API call at 25 seconds, and the Analytics route declares
  a 60-second maximum duration. The sandbox bypass remains immediate.
- A fresh authenticated read-only browser pass at
  320/390/768/1024/1280/1440px waited for the streamed preview status and
  found all nine article rings, six signal links, eight score tiles, zero
  document/control overflow, page errors or unexpected alerts. The temporary
  owner session was locally revoked and its runner removed; no content or
  private artifact was retained.
- The first broad Docker run saw a pending third-party Unsplash image request
  in the unrelated public Projects preview browser test; its isolated rerun
  passed. An older source assertion expecting the former 15-second PageSpeed
  timeout was updated to the new 25-second API/five-second target contract.
  The final full regression then passed **81 tests, one existing Project
  skip**, with TypeScript, lint (pre-existing image warning), isolated build
  **129 static pages**, post-build smoke **32/32**, and PageSpeed branch tests
  **7/7**. The confirmed production homepage still returned **HTTP 404**;
  live scores and production sign-off remain blocked until deployment works.

## 2026-10-04 Compact Content Distribution

- Owner found Content distribution too long. Analytics now shows only the five
  most common categories initially; an accessible native `details` disclosure
  exposes the remaining categories without dropping data or adding client-side
  state. The summary changes from Show more to Show fewer when expanded and
  retains a 44px keyboard target. No public page, metric source or database
  behavior changed.
- An authenticated browser check at 320/390/768/1440px confirmed exactly five
  visible rows by default, the remaining rows behind the disclosure, mouse
  expansion and Enter-key collapse, no horizontal overflow or page errors.
  The temporary session was locally revoked and its runner removed without
  recording private category values. Docker focused security checks **18/18**,
  TypeScript, focused ESLint, isolated build **129 static pages**, post-build
  Admin/public smoke **23/23**, and whitespace checks passed. Production
  PageSpeed remains blocked by the confirmed homepage HTTP 404.

## 2026-10-04 Admin Blog List and Editor Pass

- Owner moved to the Admin Blog workflow. An in-memory owner session sampled
  list/new/edit/saved-preview plus Draft, Scheduled, Live, Archived and now
  Not live filters at 320/390/768/1440px. Nine route variants returned 200
  with zero measured page errors, out-of-viewport controls, document overflow
  or unexpected form alerts. The current connected post count is below the
  related-post choice query's 1,000-row limit; a future larger catalog needs
  server-side related-post search rather than silently claiming this search is
  unlimited.
- Admin-only fixes: the Not live filter now isolates published posts without a
  publication date; list badges match the Admin status language. Clearing the
  date while status is Published now sends an explicit current timestamp to
  the save transaction instead of accidentally retaining a future schedule;
  the scheduled-post button says Publish Now and the form explains local-time
  behavior. The save helper preserves Supabase error codes so the existing API
  can map conflict/schema errors accurately. All Blog form validation errors
  gained associated IDs, field invalid states and descriptions; the rich
  editor announces its content error. The image staging alt input remains
  required for insertion but no longer uses native `required` to block an
  otherwise valid Blog form submit. Save/cancel/preview targets have minimum
  usable heights.
- Authenticated empty New Post submission showed linked Title/Content errors
  without issuing a Blog API write. The temporary owner session was locally
  revoked and its runner removed. No existing post, schema, migration, asset
  or locked public Blog source was modified. A real scheduled-to-live save,
  new publication, slug collision and archive/delete across roles were **not**
  performed in this pass; those require an explicitly planned disposable
  publication fixture and cleanup verification before release sign-off.
- Docker broad Admin/public/Blog regression **92 pass, one existing Project
  skip**; mocked editor/Admin/Buildlog/PageSpeed checks **19/19**; TypeScript,
  lint (pre-existing image warning), isolated build **129 static pages**,
  post-build smoke **31/31** and whitespace checks passed. This is a scoped
  read-only and invalid-input pass, not production or owner visual sign-off.

## 2026-10-04 Blog Filters, Pagination and Confirmation Pass

- Owner requested more compact search/filter controls, designed dropdown
  options, an accurate list count and pagination, and professional Blog Admin
  confirmations. The Admin Blog list now uses 40px filters with keyboard-
  accessible dark Headless UI option menus; GET-based search/status/sort/order,
  Apply and Clear remain intact. An exact filtered count and 10-row bounded
  page query replace the old extra-row guess. The list reports the visible
  result range and total, provides Previous/Next with page count, and redirects
  an out-of-range page to the last valid page. Count/query failure is not
  misrepresented as an empty collection.
- Added an Admin-only Headless UI confirmation dialog with accessible title,
  description, focus management, Cancel/Escape and optional exact-slug guard.
  Blog publish/schedule/unpublish, archive and permanent delete use this dialog
  instead of browser confirm/prompt. Blog editor Cancel and saved-preview
  navigation warn on dirty edits, with a native beforeunload safeguard for
  reload/close. Programmatic tag, slug and cover selections now mark the form
  dirty. Success notices for save/archive/restore/delete are visible above the
  Blog list; errors remain inline and announced. Public modal components and
  locked public Blog pages were not edited.
- A short-lived owner browser at 320/390/768/1024/1440 verified compact
  filter heights and visible popup options, Draft filter/filtered count,
  Apply/Clear, accurate total and Next/Previous navigation. Archive Cancel,
  unsaved Cancel and saved-preview warnings, and publish confirmation were
  exercised **without** submitting an Admin Blog mutation. The currently
  connected catalog had no archived row for a real delete-dialog probe, so a
  separate Happy DOM test verified exact-slug gating and a mocked successful
  DELETE followed by the list notice. The temporary session was locally
  revoked and runner removed; no existing post or asset was modified.
- Docker broad Admin/public/Blog regression **96 pass, one existing Project
  skip**, mocked Blog/Admin component checks **10/10**, TypeScript, lint
  (pre-existing image warning), isolated build **129 static pages**, post-build
  smoke **35/35** and whitespace checks passed. A scoped disposable live
  publish/restore/delete lifecycle and owner visual acceptance still precede
  production sign-off. Browser reload/close prompts are browser-owned and
  cannot be restyled; other Admin/public confirmation flows were deliberately
  left for their own page passes.

## 2026-10-04 Blog Editor and MDX Switch

- Owner requested both writing modes on new and existing Admin Blog forms.
  Added an accessible Editor/MDX tablist and panel. Switching from Editor to
  MDX shows the canonical source without a save or reserialization; Markdown
  source can be switched back to the visual editor. The form preserves the
  original stored bytes on an unedited metadata save. If source contains MDX
  JSX/expressions that the current Tiptap editor cannot represent, switching
  into Editor is blocked with an inline alert instead of silently stripping
  content; such posts stay editable as MDX. Fenced/inline code is excluded from
  that conservative detection. No locked public Blog renderer or content was
  modified.
- The existing database save RPC hard-codes new `editor_mode='rich'` and does
  not update mode on edits. **The selected writing mode is for the current
  editing session, not a persisted preference.** On reopen, stored source
  posts default to MDX; rich posts default to Editor unless their content has
  MDX-only syntax, in which case the UI fails safe to MDX. A new source-authored
  plain-Markdown post may reopen in Editor. Persistent per-post mode would
  require a separately reviewed atomic Blog RPC/schema migration, not a
  non-atomic post-save update. No migration was applied here.
- Authenticated read-only browser checks at 320/390/768/1440px verified two
  44px tabs without overflow, new-post MDX-to-Editor-to-MDX switching without
  changing pasted Markdown, protection of custom MDX on an attempted visual
  switch, and an existing source-mode post reopening with unchanged source.
  No existing rich-mode row was available in the sampled connected records;
  its unchanged-editor behavior remains covered by component tests rather
  than a connected owner browser sample. No Blog API mutation was sent.
- The web container had restarted and lost its installed Chromium. The first
  one-off browser runner created a Supabase Auth session **before** its browser
  launch failed, so that process did not execute local sign-out. Its token was
  not printed or stored, but individual revocation cannot be confirmed after
  process exit without risking the owner's other sessions. The runner was
  corrected to cover browser launch in `finally`; Chromium was installed
  inside Docker; the successful repeat session was locally revoked and its
  helper removed. Owner may review account sessions in Supabase and revoke
  the earlier short-lived session if it is listed. No existing content changed.
- Docker broad Admin/public/Blog regression **96 pass, one existing Project
  skip**, mocked editor/Admin/Buildlog/PageSpeed checks **21/21**, TypeScript,
  lint (pre-existing image warning), isolated build **129 static pages**,
  post-build smoke **35/35** and whitespace checks passed. This is not a
  conversion of custom MDX into rich content or a production-ready persisted
  writing-mode workflow; owner visual acceptance and a safe Blog schema
  decision remain open.

## 2026-10-04 Unsaved Blog Preview

- The Admin Blog form now has three keyboard-accessible tabs: **Visual Editor**, **MDX / Code**, and **Preview**, for both new and existing posts. The source tab uses a syntax-highlighted editor; the preview snapshots the current unsaved title, summary, cover, publication state and MDX. Refresh after changing fields while Preview remains selected. Neither tab switch nor preview submits the form. The existing separate saved-post preview remains unchanged.
- A first Server Action approach failed an authenticated browser check because Next could not serialize public Blog client-component references through the action response. It was removed, not shipped. The final Admin-only preview evaluates MDX in the browser after the same `validateBlogMdx` policy used by the public renderer, then uses its shared client-component map and Blog article image/code overrides. The existing public Blog renderer and posts were not edited. This previews the article hero and body, **not** the exact full public route with navigation, recommendations, reactions and footer. Custom MDX can be inspected here but cannot be round-tripped through Tiptap; unsupported source stays in MDX / Code.
- A gated, authenticated **read-only** browser test (`RUN_CONNECTED_ADMIN_BLOG_PREVIEW=1 node --test tests/blog-admin.dual-preview.browser.test.mjs`, with environment loaded inside Docker) passed for a new post and an existing source-mode sample. It checked custom component rendering, source byte preservation across modes/preview, blocking unsafe visual conversion including keyboard focus, visible invalid-MDX feedback, snapshot refresh, syntax highlighting and phone-width containment. Preview layout had no document overflow at 320/390/768/1440px. **0** Blog API writes and **0** browser page errors; the temporary review Auth session was locally revoked. Existing rich-mode rows were not sampled; no production save/publish lifecycle was run.
- After the final integration, Docker TypeScript and focused ESLint passed, as did an isolated production build (**128 static pages**, existing image lint warning and Edge notice) and post-build Admin/public smoke **52 passed, one existing Project skip**. Broad Admin/public/Blog regression **63 passed, 2 skipped** (the gated review and existing Project fixture); Blog/Admin mocked component checks **10/10**. Two stale source-test expectations for preview and deletion were corrected to match their implemented confirmation behavior. This is ordinary validation, not the formal audit, owner visual acceptance or production sign-off. The selected editor mode still does not persist through the connected save RPC; no database migration was applied.

## 2026-10-04 Blog Images and Canonical Controls

- Added an Admin-only post-image workspace: upload through the shared Cloudinary media picker, attach library files, choose/clear the cover, append a selected image to the MDX article, replace/remove an attachment, edit its shared library description, and request confirmed permanent Cloudinary deletion. Markdown/MDX article image URLs are discovered separately, including image references. Files not tracked in the media library cannot be deleted from Cloudinary here. A file used by saved article content, a Blog/Project cover, or another attachment is blocked from deletion until those uses are removed and saved. Once a file is detached and saved, it disappears from the post collection and can be permanently deleted from the linked Media Library. Upload happens immediately; cancelling an unsaved post does **not** automatically remove uploaded library files.
- Checked in **`migrations/2026_blog_post_media.sql`**, not applied to the connected database. After a reviewed migration, an ordered `blog_post_media` collection is saved in the same database transaction as the guarded Blog post/tag save, with existing media covers and matching stored MDX URLs backfilled. The Blog API also resolves known article URLs into this collection when an older caller omits `image_ids`, so normal Blog saves participate in media foreign-key protection. Direct database writes outside this API are not covered by that resolver. The join is service-role-only. Before migration, the form displays a setup notice and disables the collection; ordinary existing cover/MDX edits remain available. Cloudinary deletion is not transactionally atomic with Postgres: the media endpoint attempts to restore the DB row and attachment on Cloudinary failure, and may need manual reconciliation if restoration fails. No connected data was changed during this iteration.
- The default canonical is derived from `siteMetadata.siteUrl` and the normalized slug, and follows slug edits. An explicitly selected external canonical remains available for articles originally published elsewhere. The Blog save API fills a missing canonical and rebases a previous own-site canonical on a slug change; public rendering and sitemap/RSS interpretation remain unchanged. **The configured site URL previously returned HTTP 404**; confirm the deployment domain before relying on generated canonicals for SEO.
- Docker TypeScript, focused lint, read-only anonymous media API checks, and focused parser/source tests passed; selected Admin/public/Blog regression **50/50** and isolated production build **129 static pages** passed (existing image lint warning and Edge notice). A gated, locally revoked owner browser session verified the editor and used **mocked media API responses** to exercise automatic/external canonical display, adding from the picker, choosing/clearing a cover, confirmed deletion controls, and 320px containment, with no live Blog or Cloudinary writes. The migration database test is checked in at `tests/blog-post-media.database.test.sql` for isolated Postgres, **not run or claimed passing**. Connected image save/upload/delete and live SEO acceptance still need an approved migration, backup, and disposable fixture plan.

## 2026-10-05 Blog Form Refinement

- Replaced the form's status select with a keyboard-operable Admin-styled listbox. `draft` remains private; `published` is visible only once `published_at <= now`. Replaced datetime-local with a date-only styled calendar, prefilled with today's UTC date. An untouched or cleared date publishes at the actual current instant, an explicitly chosen future date schedules at **00:00 UTC**, and unchanged published records keep their precise original instant. Editing a past date backdates the publication metadata; unpublishing remains guarded by confirmation. WordPress's scheduling guide uses a date and time plus site timezone; because this owner requested *date only*, fixed UTC midnight is an explicit product convention rather than a hidden browser-local timezone. The public Blog index formats dates in UTC; the locked article's pre-existing local formatter may show a different calendar day to visitors west of UTC for midnight-scheduled posts. Changing that locked public formatter would require a separate explicit unlock.
- The canonical URL is now an editable, prefilled field that tracks slug changes until manually edited; a reset button restores the configured site URL. The API still validates HTTP(S) and rebases own-site canonicals when slugs change. Published posts require a cover; draft covers remain optional. Tags are capped at 10 at form/API boundaries, comma-separated entry splits into individually removable pills, and existing public Blog category filters already consume joined tags without changing the locked public page. The existing public related-card layout already shows two choices on phones/tablets and all three at `lg`, so only the Admin explanation changed.
- The image manager now has a horizontal thumbnail rail, visible cover selection mark, per-image copy-link feedback, and a **20-new-attachment limit** across form/API/checked-in migration. An unchanged legacy collection above 20, or unchanged legacy tags above 10, can still be saved; additions must respect the new caps. Saved-post uploads use a Blog-specific Cloudinary folder. Permanent Blog deletion snapshots tracked media, deletes the guarded post, then attempts to remove only unused managed assets originally uploaded into that Blog's specific folder; shared/in-use or generic legacy assets are retained for review. Cleanup failures/retentions produce a warning in the Blog list. Cloudinary and Postgres are not atomically coupled: recovery can still require manual work, and hard-coded references outside known content may not be detectable. New-post uploads before the post has an ID remain in the generic library and are not automatically deleted with the post. **The image migration is still unapplied**, so connected collection and deletion lifecycle are not verified.
- The visual editor uses the article reading width/type rhythm for standard Markdown, but custom MDX stays in the source editor to prevent silent loss. Unsaved Preview shows the editorial body; its tags and simplified related-title list are explicitly marked **Admin-only publishing summaries**, not public article components. It does not reproduce site navigation, reactions or a full live public route. Public locked Blog files were not modified. New focused publication-date and image-manager tests plus a read-only authenticated browser test exercised the controls, with mocked image API operations and local Auth session revocation. The SQL migration test and a disposable connected publish/media lifecycle still require a reviewed isolated database and backup.
- Final scoped checks: Docker production build completed with **129 static pages** (pre-existing `<img>` lint warning and Edge notice); Docker TypeScript and focused ESLint passed. Admin/public/Blog/security/date/media regressions **53/53**, Admin/Blog editor and image-manager component tests **13/13**. The authenticated read-only browser test checked four widths, status/date/canonical/tag controls, guarded cover requirement, custom MDX retention, unsaved preview, image picker with mocked media, and a mocked failed-save/retry: **zero live Blog writes**, **zero browser page errors**, and the session was locally revoked. No connected save, Blog delete, Cloudinary removal, or migration was executed. This is not a formal `AUDIT_TESTING.md` sign-off.

## 2026-10-05 Projects Admin Quality Pass

- Admin Projects list now has bounded title search, status filtering, exact counts and 10-row pagination; empty, failed, archived and page-boundary states are distinct. This changes only Admin, not the owner-locked public Projects index. A separate audit found the public index's fallback cards can appear when no projects are published; that locked public behavior was not changed and needs explicit owner permission before any fix.
- New/edit form now normalizes a new title to a slug, validates the API's slug/field/date contracts earlier, reports both client and API field errors, protects unsaved gallery edits on Cancel/browser close, and asks before publishing/unpublishing. AI-generated field changes mark the form dirty. When a managed gallery image is promoted or a managed cover is replaced, the previous managed cover retains its caption/alt in the gallery rather than silently disappearing. A prior manual-URL cover must be explicitly removed before gallery promotion; a direct replacement through the clearly labelled cover picker remains possible. Read errors on new/edit pages show retryable Admin messages instead of a false not-found or empty related selection.
- Permanent deletion now requires typing the exact project slug and passing the list's `updated_at` token. Checked in **`migrations/2026_project_admin_atomic_delete_with_token.sql`** (two-argument service-role-only RPC, locks row and checks token) and a rollback SQL test. An isolated minimal PostgreSQL 16 fixture tested privileges, stale-token rejection, unlink and successful deletion; the full application schema and connected database were not exercised. Until the reviewed migration is applied, DELETE fails closed with a clear 503 instead of silently using the old unguarded RPC. Project media is shared and is not deleted with the Project.
- A gated owner browser check with an in-memory, locally revoked session verified the filtered list and a new unsaved Project form at 320/390/768/1440px, title-to-slug behavior, validation, gallery-cover promotion preserving caption/alt, a second cover replacement, unsaved-discard confirmation and mocked server-field feedback. **Zero live Project writes and zero browser page errors.** Image-picker responses and the failed save were mocked; no existing Project or Cloudinary file was modified. A connected disposable Project create/edit/delete and migration rollout still require the owner-reviewed backup/isolated-project gate. This is ordinary regression testing, not formal pre-lock audit or owner sign-off.
- Final Docker production build completed with **129 static pages** (pre-existing `<img>` lint warning and Edge notice); TypeScript and scoped ESLint passed. Post-build Admin/public/Project regression: **34 passed, one existing Project fixture skip**. A first browser rerun interacted before client hydration and failed its mocked form assertions; after waiting for the rich editor to mount, the repeat passed with four viewport checks, zero live writes and local session revocation. The protected public Project pages and their presentation utilities were not edited.

## 2026-10-05 Admin Resume Manager

- Admin-only page retains one live PDF at a time. The manager now distinguishes a bundled public fallback from an unpublished managed document, uses the Admin dark workspace language, provides a retryable failed-read state, validates selected PDF type/size before upload, offers an optional drag-and-drop target, and confirms a publish/replacement before sending bytes. Delete requires typing `DELETE` in the shared Admin confirmation dialog. The exact public PDF is embedded only after choosing Show PDF preview, with native Open PDF and Download links for browsers without inline PDF support. The public `/resume` page and locked file path were not modified.
- The API now reports a warning when replacement/deletion updates the public pointer but private Storage cleanup fails, or when cache revalidation fails; a rejected upload whose private object cannot be rolled back reports a distinct cleanup error. These messages do not claim that an old private file was removed when it was not. A real concurrent upload/delete or Storage failure still requires owner-run connected verification and possible manual reconciliation.
- Focused Resume/API contract tests and an owner-authenticated **read-only** browser test cover active/fallback/error states, on-demand iframe, explicit confirmation, mocked failed upload/deletion, retry, and 320/390/768/1440px document containment. The latter used **two mocked write responses, zero live Resume writes, zero page errors**, and locally revoked its temporary Auth session. Connected upload/replacement/deletion was not run: `2026_resume_document_hardening.sql` remains pending the reviewed backup and a disposable PDF plan. Ordinary validation is not formal audit or owner production sign-off.
- Docker TypeScript, focused ESLint and an isolated production build passed (**129 static pages**; existing image lint warning and Edge notice). Broad Admin/public/Resume regression **35/35** passed; post-build authenticated read-only browser check repeated with zero live writes and locally revoked Auth. An initial retry test assumed a single mount-time fetch and timed out when development StrictMode re-fetched; the test now holds its mocked failure until Retry and passed. No application code was changed to conceal that behavior.

## 2026-10-05 Upload Response Diagnosis

- Owner reported `Unexpected token '<'` while uploading. The Admin Resume form and shared image pickers had attempted `response.json()` even for an HTML response from infrastructure or a sign-in redirect, exposing a parser error rather than an actionable message. All three upload surfaces now check response content type before parsing; HTML, 413 and expired sessions show bounded text without displaying raw response bodies. Resume failures offer Refresh status to check an uncertain mutation before trying again.
- An authenticated **non-mutating** multipart probe found the Next 15 middleware's default 10 MB clone truncated a PDF request of 10 MB plus one byte (and its multipart envelope), making `request.formData()` fail with a JSON 500. The upload routes now bypass middleware buffering only where each API method independently authenticates and authorizes Admin; Resume also returns bounded JSON for malformed or oversized multipart data. After the change, invalid PDF signature and over-limit PDF probes returned JSON 400 at direct port 3000 and Alloy port 8080. An invalid 11 MB text-file probe to the media upload route returned JSON 415 at both ports. These files were invalid before Storage/Cloudinary; **no uploaded file or connected document changed**. A mocked 413 HTML response now shows an actionable error instead of the JSON SyntaxError. The owner's exact original upload response was not captured, so this is a reproduced request-size boundary and defensive response fix, not a claim that every possible proxy error is eliminated.
- Post-fix isolated Docker production build passed (**129 static pages**, existing image lint warning and Edge notice), Admin/public/Resume/Project regressions **41 passed, one existing Project fixture skip**, and mocked Admin/media component tests **8/8**. The authenticated post-build browser probe repeated the same JSON rejection and mocked HTML recovery at 320/390/768/1440px with zero browser page errors, no successful live writes, and local sign-out. Neither a real accepted PDF nor a real image was uploaded, because replacing connected content still needs a reviewed backup/disposable target.

## 2026-10-05 Small PDF Gateway Rejection

- Owner reported HTTP 413 for a **1.3 MB PDF**. Local authenticated invalid multipart probes of >10 MB reach both the direct app and Alloy proxy with JSON responses; the owner's reported request did not appear in app logs. This indicates an upstream browser-to-sandbox request-size boundary that cannot be fixed merely by increasing the app's 10 MB validation limit. The exact upstream 413 response was not available for inspection.
- The Admin Resume browser now obtains a short-lived, HMAC-bound signed upload for a random private Storage path using a small authenticated request, transfers the file **directly from browser to Supabase Storage**, then asks the Admin API to download and verify length and PDF signature before atomically switching the active pointer with an `updated_at` and prior-path guard. No service-role key is sent to the browser. The Admin routes reject anonymous access; a real authenticated grant was issued and an unused grant with forged proof or absent upload was rejected. A fully mocked browser transfer/finalize completed without a connected file write, across the existing responsive read-only check.
- A security review found that immediate cleanup of a staged path could race with publication and delete the live PDF. That cleanup endpoint was removed. `finish` handles a replayed grant idempotently and never deletes its own candidate path after a failed optimistic update. **Residual tradeoff:** a failed transfer, expired grant or lost finalize response can leave a private, unreferenced object that needs manual Storage review after the signed upload token expires. Supabase signed upload CORS and an accepted real PDF transfer still need testing with a disposable connected environment and a reviewed backup; no existing PDF was replaced. The previous direct multipart API remains for existing callers but is not used by the Admin form.
- Post-change Docker production build compiled **131 static pages** (existing image lint warning and Edge notice). Admin/public/Project/Resume regressions: **43 passed, one existing Project fixture skip**; TypeScript, focused ESLint and whitespace checks passed. Post-build authenticated read-only browser verification issued a real scoped grant, confirmed Storage CORS preflight from local app and preview origins without transferring bytes, rejected forged proof and missing upload, completed a fully mocked browser-to-Storage/finalize flow, and checked four widths. It recorded **zero live file or database writes**, zero page errors, and locally revoked the review session. Actual accepted Storage transfer and PDF replacement remain unverified until the owner-backed disposable lifecycle gate.

## 2026-10-05 Admin Buildlog Revisit

- Owner explicitly unlocked the **Admin Buildlog** list, editor, settings and related controls for this quality pass. The public `/buildlog` route, public rendering utilities and authored rows remain untouched. Admin list now counts before fetching 10-row pages, supports bounded title/status filters, distinguishes failed reads from no results, and retains the existing phone/tablet cards and desktop table. Archived and published states are visually distinct, and desktop actions meet 44px targets.
- Project and settings saves now submit the original `updated_at` value and update only when it still matches. A stale edit returns 409 instead of replacing another tab's work; deleting requires typing the exact project name and its list revision must match. Buildlog publication/settings changes and unsaved Cancel have Admin-styled confirmations. Validation errors are announced and associated with fields; release-item actions are 44px. Inputs are disabled during pending saves so a successful settings response cannot erase typing added after submission. If cache invalidation fails *after* a database change, the Admin UI shows a distinct warning that the public cached page may lag for up to an hour instead of claiming the public change is immediately visible. Failed new/edit/settings reads show retry messages rather than false empty records. No Buildlog schema change was required for optimistic locking because both tables already track `updated_at`.
- **Migration safety blocker:** the existing locked `migrations/2026_buildlog_zzzzz_item_validation.sql` still deletes historical preview-text matches by content rather than known fixture identity. This pass did not modify or apply it. Do not replay it against a connected environment without identifying affected rows, a verified backup and explicit migration approval. The public Buildlog is not called newly production-signed-off by this Admin pass.
- An authenticated, read-only Docker browser check inspected list/new/edit/settings at 320/390/768/1440px, validated new-form errors, release-item order, settings confirmation, cancel/delete dialogs, and two **mocked** failure writes. A first immediate-width check measured during the Admin sidebar's 180ms transition and falsely flagged a 26px form control; after waiting 250ms for layout settlement, all controls passed with no document overflow or page errors. **Zero live Buildlog writes**; the temporary owner Auth session was locally revoked. Connected stale-save/delete tests against real rows or settings remain gated by disposable fixtures and a backup.
- Post-change isolated Docker production build completed with **131 static pages** (pre-existing image lint warning and Edge notice). Admin/public/Buildlog regressions **36/36**, Buildlog version/Admin component checks **9/9**, TypeScript, focused ESLint and whitespace checks passed. A final review caught two edge cases: failed public-cache invalidation after a successful write could falsely imply immediate public visibility, and settings typed during an in-flight save could be overwritten by form reset. Admin APIs now return a distinct public-cache warning (the public Buildlog cache revalidates within one hour), the list/settings UI surface it, and both forms disable editing only while the save is pending. A further pass now guards dirty forms against in-app sidebar navigation, browser Back and Sign Out in addition to Cancel/reload, preserves deletion/cache notices across last-page pagination correction, and rejects a blank order input instead of saving it as zero. The read-only owner browser verified the new guards with no connected writes; final build/regression rerun is recorded below. This does not override the historical migration risk or the need for owner visual acceptance.

## 2026-10-05 Buildlog Final Admin Review

- **Keep Page settings.** It supplies the locked public `/buildlog` hero kicker, heading/accent, description, archive label, SEO title/description, Open Graph and Twitter metadata. Removing only its Admin form would make live public copy editable only via a database console, and removing its data contract would require separately unlocking the public route.
- Scanned the connected Buildlog project table **read-only** against the historical preview-item predicate in `2026_buildlog_zzzzz_item_validation.sql`: 4 rows sampled (all rows), **0** entire-project and **0** mixed-project matches. This does not make content-based deletion safe to replay against future rows; migration files/data were not edited or run. No settings values, item bodies, IDs, keys or private responses were logged.
- Final Admin checks added browser-owned Back, sidebar and Sign Out unsaved-change protection; a last-page deletion/failed-cache notice survives page correction; and a blank Display order fails form validation instead of coercing to zero. The read-only owner browser covered list/new/edit/settings at 320/390/768/1440px, dark Admin theme, 44px controls, unique visible IDs, text input errors, reorder, publication/settings confirmations, failed-save feedback, cancellation and confirmed Back navigation. Browser width checks wait for the existing 180ms sidebar transition to settle; the initial instant measurement was not a lasting layout defect. The settings cache-warning success response was mocked. **Three mocked writes, zero connected writes, zero page errors**, and the temporary owner session was locally revoked.
- This remains a scoped ordinary validation, not the formal `AUDIT_TESTING.md` audit or 100% production certification. No connected settings save or Buildlog draft lifecycle was run in this pass without an owner-verified recovery/backup gate. Public Buildlog presentation and stored content remain unchanged.
- The final Admin-only correction protects dirty forms on client-side sidebar links, browser Back, and Sign Out; allows Cancel/Keep editing or an explicitly confirmed exit; preserves saved/deleted/cache notices when the final item on a pagination page is removed; and rejects an empty numeric order instead of coercing it to zero. The post-build Docker run passed with **131 static pages** (pre-existing image lint warning and Edge notice), Admin/public/Buildlog regressions **36/36**, TypeScript and focused lint. An owner-authenticated, read-only browser pass at 320/390/768/1440px verified dark theme, control geometry, unique visible IDs, form errors, release-item order, sidebar/Back/Sign Out guards and mocked settings cache warning with **three mocked writes, zero live writes, zero page errors and local Auth sign-out**. No formal pre-lock audit or new owner sign-off was requested.

## 2026-10-05 Static Per-Page Settings Decision

- This **supersedes** the preceding recommendation to keep Page settings. The owner explicitly chose static, hard-coded page copy/SEO for every Admin feature named **Page settings**, currently Buildlog and Community Wall. The connected public settings views were read anonymously and their current values matched the existing checked-in fallback constants exactly. Static constants now supply those pages' text and metadata with **no settings-table request**; public Buildlog projects and Community Wall messages remain dynamic database content. Global `/admin/settings` is separate: it also manages social/contact details and site/FAQ configuration, so it was not removed.
- Removed both Page settings links, their editing forms and Admin settings APIs. Existing `/admin/buildlog/settings` and `/admin/community-wall/settings` bookmarks redirect to their respective Admin lists. The two settings tables and migration history remain untouched for rollback; no live row was changed or deleted. The locked public presentation and content text were not redesigned. A read-only browser comparison checked each page's kicker, combined heading, collection label, document title, description, Open Graph and Twitter title against the former public view: **14/14 fields match**, zero page errors. This authorizes only the static-copy change, not a new formal public re-lock.
- Final isolated Docker build passed with **129 static pages** (two retired Admin APIs no longer present, pre-existing image lint warning and Edge notice). Admin/public/Buildlog/Community Wall/navigation/preview regression **40/40**, TypeScript, focused ESLint and `git diff --check` passed. Post-build browser checks repeated: public 14/14 copy/metadata fields match the previously saved view; the owner-authenticated Admin Buildlog pass verified retired redirects and no Page settings links, four responsive widths, one mocked project write, **zero live writes and page errors**, and local Auth revocation. Real project/moderation data still uses the database; only static copy and SEO metadata no longer depend on per-page settings rows. Existing migrations and deployment-domain issues remain separately gated.

## 2026-10-05 Buildlog Dropdown Follow-Up

- Replaced native Admin Buildlog visibility/lifecycle controls and the list's status filter with one styled Headless UI listbox. It preserves form field names, GET filter submission, stored enum values, RHF validation and existing publish safeguards. Menu options show clear selected/focused states, include short hints in the editor, and have 44px targets; the public Buildlog was not edited.
- Focused Docker integration/source tests **8/8**, TypeScript and focused ESLint passed. The isolated production build passed with **129 static pages**, the pre-existing `CurrentlyReadingBento` image warning and Edge-runtime notice. Broader Admin/public/Buildlog regression **54 passed, one existing Project fixture skip**. The owner-authenticated browser review passed twice after a test-only navigation/dialog timing adjustment, covering filtered submission, click and keyboard dropdown selection, list/new/edit and retired settings redirects, dark theme and 320/390/768/1440px containment. Each final run had **one mocked failed project save, zero live writes, zero page errors**, and locally revoked its temporary session. Early browser reruns timed out during page transitions or when Enter was used to reopen a previously mouse-selected option; using ArrowDown for keyboard opening and waiting for committed navigation made the final checks stable. This is not connected CRUD or formal owner acceptance.
- Read-only dependency review: `/admin/about` is a legacy editor whose saved row is not read by the locked public `/about`; retiring that editor/API is plausible after an owner decision, while keeping historical data for rollback. `/admin/media` is the shared cross-content asset inventory, with upload, detached-file recovery, pagination, URL copy and guarded deletion; Blog image management explicitly links to it. Keep Media unless an equivalent recovery interface is planned. Removing either Admin-only route would not materially reduce the public route bundles. Neither About nor Media was changed in this follow-up.

## 2026-10-06 Admin About Retirement

- At the owner's request, removed the legacy `/admin/about` editor, its sidebar link and its `/api/admin/about` GET/PUT endpoint. No redirect or replacement Admin editor was added. Public `/about`, Admin Experience, Media, and historical `about_content`/`about_sections` tables and rows were not edited or deleted. Prior Admin About form observations above are historical only.
- Docker TypeScript and focused ESLint passed; Admin security/public Home-About/navigation integration **26/26** and Admin failure-state component checks **5/5** passed. The retired API returns **404 for GET and PUT**; public `/about` returns 200 and rendered meaningful content through the Alloy preview. An isolated production build passed with **127 static pages** (two retired routes absent, pre-existing image lint warning and Edge-runtime notice). Anonymous access to the removed Admin page is still intercepted by generic Admin middleware and may redirect to login; the build confirms no page route remains. No connected content writes, migrations or destructive database changes were made.

## 2026-10-06 Admin Community Wall Quality Pass

- Owner unlocked **Admin Community Wall** for this pass. Its list now uses the existing dark Admin surfaces, clear pending/reviewed sections, compact counts, readable note cards and metadata, 44px keyboard-reachable actions, 12-row independent pagination and a public-wall link. The page verifies Admin identity before constructing the service-role client. Counts are fetched before page slices; out-of-range pages correct without discarding the other list's position or a recent action notice. A read failure shows a retryable state rather than throwing or claiming zero notes. Public `/community-wall` and static page copy were not changed.
- Publishing, archiving, return-to-review and permanent deletion now use the shared Admin confirmation dialog. Delete requires typing `DELETE`. The Admin API validates the original `updated_at` revision and rejects stale PATCH/DELETE with 409, instead of overwriting another tab's moderation; it returns a distinct warning if database mutation succeeds but cache refresh cannot be confirmed. GET pagination is bounded and private/no-store. A successful action leaves a scoped notice on the list; a failed action provides feedback and refresh access. The existing `messages.updated_at` trigger supports the revision check, so no migration or connected row was changed by this pass.
- Docker TypeScript, focused ESLint, whitespace checks, broad Admin/public/Community Wall regression **39/39**, and mocked moderation component **1/1** passed. The isolated production build passed with **127 static pages** (existing image lint warning and Edge notice). The gated owner-authenticated browser review passed before and after the build at 320/390/768/1440px: dark Admin theme, no measured overflow or sub-44px buttons, no page errors, locally revoked session. The post-build run exercised one existing note's delete cancel and a **mocked 409 moderation response**, with **zero live writes** and no private note content recorded. Actual connected publish/archive/delete, concurrent writes, and owner visual acceptance still need disposable fixtures and an approved recovery plan; this is not formal `AUDIT_TESTING.md` sign-off.

## 2026-10-06 Community Wall Approval and Testimonials Start

- Owner explicitly replaced instant publication with Admin approval. Previously `createGuestbookEntry` called an RPC inserting `published` immediately, the default status was `published`, and visitor copy promised instant visibility. The server action now inserts an explicitly `pending` note with `moderated_at: null`; the existing one-note-per-account partial unique index prevents duplicate submissions. The public data path still reads only the `status='published'` view, so pending/archived notes are not exposed there. Success, returning-account and dialog copy now accurately describe review. Existing messages are not reclassified. The schema snapshot and fresh-install migration now default to pending; a separate additive `2026_community_wall_pending_review.sql` changes the default and legacy RPC in an existing database without replaying the destructive historical migration. **This additive migration was checked in, not applied**; it needs a reviewed backup. The deployed app must include the new server action to enforce pending even before that database migration is applied. The SQL lifecycle fixture now checks pending, hidden-until-approved, approved-visible and one-account uniqueness, but has not been run against a disposable Postgres instance in this pass.
- Started the owner-requested **Admin Testimonials** follow-up without modifying the locked public carousel or submission pipeline. Admin API reads/writes now use the shared fail-closed owner check rather than allowing any authenticated user when `ADMIN_EMAIL` is absent; DELETE checks that a row was actually removed. The list authenticates before service-role reads, shows a retryable read failure, and presents contained cards below desktop width while retaining the table on desktop. Publish/reject and delete now require accessible confirmations; deletion requires typing `DELETE`. Form controls and edit actions have 44px targets, avatar picker has a name, and save feedback tolerates non-JSON infrastructure responses. No connected testimonial was mutated. Further API field validation, long-list pagination, concurrent-editor protection, and a complete owner visual pass remain open.
- Final scoped Docker checks: TypeScript, focused ESLint and `git diff --check` passed; Admin/public/Community Wall/Buildlog/Testimonials regression **41/41**, mocked moderation/deletion controls **2/2**, and public Community Wall responsive browser check across **six widths and two themes** passed. The isolated production build completed with **127 static pages** (pre-existing image lint warning and Edge-runtime notice). A public Playwright check confirmed the dialog now says notes await approval. Owner-authenticated Testimonials list/new-form browser review passed at 320/390/768/1440 after moving the overflowing horizontal table into a desktop-only view and adding contained mobile cards: zero page errors, zero writes, locally revoked session. No pending testimonial was available for a connected moderation click; the confirmation/failure state was tested with mocked responses. Two owner-session browser checks were initially started concurrently and one failed before rendering; the separate sequential repeat passed. Neither SQL migration nor a live Community Wall/Testimonial mutation was run, and this is not formal owner sign-off.

## 2026-10-06 Admin FAQs Quality Pass

- Owner moved to **Admin FAQs**. The list retains its desktop table but shows contained cards below `xl`, with a clear visible-question count, reachable 44px actions and retryable, distinct FAQ/settings read errors. Missing or ambiguous site settings no longer render a falsely enabled section switch. Row visibility and the whole-section switch now require the shared Admin confirmation dialog and report failures inline rather than using native alerts; permanent FAQ deletion requires typing `DELETE`. The existing strict POST/PUT validation remains, while PATCH targets exactly one identified settings row rather than every non-null ID; PUT/DELETE distinguish missing rows from successful mutations. GET is private/no-store. No FAQ/settings value or public Home presentation was changed.
- The editor trims and rejects blank questions/answers, rejects blank display order instead of coercing it to zero, announces errors, provides 44px fields/actions and confirms a dirty Cancel; browser close also warns about unsaved edits. A failed edit read is retryable rather than a false 404, but an actually missing FAQ still returns not-found. Sidebar links/browser Back are **not** yet guarded against dirty in-app navigation; a connected save/reopen, section-switch/public cache effect, concurrent-edit conflict and long-list pagination remain open.
- Docker TypeScript, focused ESLint, `git diff --check`, broad Admin/public/FAQ regression **37/37**, mocked FAQ controls **1/1**, and isolated build (**127 static pages**, existing image lint warning and Edge notice) passed. The authenticated read-only browser check passed at 320/390/768/1440 before and after the build: loaded list/new form, row and section cancel confirmations, invalid/blank-order feedback and dirty Cancel dialog; **zero live writes, zero page errors**, temporary Auth session locally revoked. Public Home finished rendering its FAQ section in Playwright; GPU/WebGL sandbox warnings appeared outside this FAQ change. This is ordinary scoped validation, not the formal `AUDIT_TESTING.md` audit or owner production sign-off.

## 2026-10-06 Admin Experience Quality Pass

- Owner moved to **Admin Experience** and unlocked only its Admin list, form, API and actions; locked public `/about`, Timeline/Resume presentation, existing rows and the historical migration were not changed. The list and edit route now verify owner identity before service-role reads, so drafts and archived roles do not disappear under public-facing RLS. A read-only shape check found the structured Experience columns available in the connected database; no row values were logged. The list counts before fetching 12-row pages, corrects out-of-range pages while retaining notices, distinguishes failed reads from zero entries, uses contained cards below `xl` and keeps the desktop table. Editing a missing UUID returns 404; a failed DB read offers Retry instead of a false not-found.
- The Admin API now accepts strict bounded inputs, validates IDs and month/year/visibility values, limits GET, returns private/no-store reads, and reports missing PUT/DELETE targets. It no longer retries a failed save by silently stripping structured optional fields. When a DB write succeeds but public cache refresh fails, it returns a separate warning surfaced by the list. The form trims required text, validates date order, logo paths, and highlight size/count; a blank numeric order no longer becomes zero. Visibility uses the existing styled listbox. Publish/unpublish, permanent delete (type `DELETE`), dirty Cancel and browser close receive confirmation/warnings. Save failures handle unexpected HTML responses rather than showing a JSON parser error. This is not an optimistic concurrency guarantee: the Experience table does not currently have a managed `updated_at` revision token, so simultaneous edits still need separate design/migration review.
- A read-only connected shape review found one existing oversized/non-HTTPS legacy logo. The editor preserves that exact unchanged value when saving other fields by omitting `logo_url` from its PUT; changed/new logos must pass the new safe URL and length rules. A mocked owner edit confirmed the legacy value is omitted, without recording the URL or modifying the row. No other observed row exceeded the new date, summary, highlight or enum limits.
- Docker TypeScript, focused ESLint, `git diff --check`, selected Admin/public/Experience regressions **36/36** and isolated production build (**127 static pages**, pre-existing image lint warning and Edge notice) passed. The owner-authenticated read-only browser check passed for list/new/edit at 320/390/768/1440px, covering validation, publication/delete cancellation, dirty Cancel and **two mocked failed saves** including the legacy-logo edit: **zero live writes, zero page errors**, temporary Auth session locally revoked. Playwright confirmed public `/about` still renders its timeline without page errors. Connected create/save/archive/delete and cache effects remain untested until a disposable fixture and reviewed recovery plan; no formal `AUDIT_TESTING.md` or owner production sign-off is claimed.

## 2026-10-06 Admin Certifications Quality Pass

- Owner moved to **Admin Certifications** and unlocked only its Admin routes, form, API and actions. Public `/credentials`, the Credentials data source, historical migrations, and five existing authored records remain unchanged. A read-only shape check confirmed the required connected columns and found no legacy exceptions to the URL/date/skills rules; no record values were logged. The list now verifies owner identity before service-role reads, counts before fetching 12-row pages, corrects out-of-range pages while preserving recent notices, separates read errors from empty results, uses contained cards below `xl` and retains the desktop table. The edit route distinguishes missing UUIDs from retryable database failures.
- Admin Certification GET is bounded and private/no-store; the shared owner gate runs before all service-role reads and writes. The API strictly validates field allowlists, HTTPS URLs without embedded credentials, real calendar dates, date order, row IDs and missing update/delete targets. A successful database mutation with failed public-cache refresh returns a separate warning, surfaced on the Admin list instead of being reported as immediately public. The form keeps the existing credential model while adding 44px fields/actions, styled category/visibility menus, blank-order and skills validation, and non-JSON response handling. Publishing/unpublishing, permanent deletion (type `DELETE`), dirty Cancel and browser close have explicit confirmation/warnings. No optimistic revision token exists on this table; simultaneous edits still need separate schema/product review.
- Docker TypeScript, focused ESLint, `git diff --check`, Admin/public/Credentials regression **37/37** and isolated production build (**127 static pages**, existing image lint warning and Edge notice) passed. The owner-authenticated read-only browser review passed before/after the build for list/new/edit at 320/390/768/1440px: validation, publish/delete cancellation, category/status selection, dirty Cancel and one **mocked failed POST**, with **zero live writes, zero page errors** and temporary Auth session locally revoked. Playwright confirmed public `/credentials` still renders all five authored records with no console errors. Connected create/update/archive/delete, cache behavior, and owner visual sign-off remain unverified; this is not a formal `AUDIT_TESTING.md` sign-off.

## 2026-10-06 Admin-Wide Control and Validation Pass

- The owner requested an Admin-wide professional/production-readiness check; this was an ordinary quality iteration, **not** the formal `AUDIT_TESTING.md` audit or a declaration that every connected lifecycle is production-ready. Admin-only changes tightened Settings field validation and mapped API field errors to labelled controls; invalid/uncertain responses no longer claim save success. Testimonials now have strict, trimmed API write allowlists that reject unknown/provenance fields, malformed IDs, unbounded content and unsafe avatar URLs; new Admin testimonials start as drafts and publication is confirmed. FAQ and Testimonial cache-invalidation failures surface warnings after completed writes. Experience partial updates check merged dates instead of permitting an end date before its start. Project media cover IDs must match tracked URLs, and large tag/tech/gallery arrays are bounded in the form and API. Blog publication dates accept only real calendar dates or timezone-qualified ISO instants. No public page source was edited.
- A shared Admin dirty-navigation guard now protects sidebar links, browser Back and Sign Out in Blog, Project, FAQ, Experience, Certification, Testimonial and Global Settings editors; it preserves Blog's separate saved-preview confirmation. The Admin-only control rule makes text/date/select fields at least 44px; compact Blog filters/pagination, tag and media-picker actions and rich-editor AI/table tools have reachable targets. Project status/stage/list filters and Experience location/employment/month dropdowns now use the same styled, keyboard-operable listbox as Buildlog/Certification, with scrollable contained menus. A rejected image choice leaves the picker open and displays a message. Project field errors are associated with the relevant cover/category/URL/date/related controls, and the cover requirement now explicitly includes drafts.
- Media deletion now blocks known image references in Testimonial avatars, Experience logos and Certification logos/badges in addition to Blog/Project references; an unavailable reference check fails closed. Dashboard announces unavailable totals rather than implying zero. Logs query an unresolved count alongside the newest 100 rows, avoid a false “healthy” claim when older unresolved logs exist, distinguish read versus action errors, and require typed confirmation before clearing all resolved logs. Admin confirmation text no longer assumes every confirmation is a slug. These changes do not cover arbitrary external image references or make Postgres and Cloudinary/Storage operations atomic.
- Docker `npx tsc --noEmit`, focused Admin ESLint and `git diff --check` passed; broad Admin/public/source regression **111 passed, one existing Project fixture skip**, mocked Admin component checks **8/8**, and isolated production build **127 static pages** passed (pre-existing `CurrentlyReadingBento` image warning and Edge notice). A gated, locally revoked owner browser session traversed **21 Admin routes at 320/768/1440px** after the build with zero measured document overflow, out-of-viewport controls, visible sub-44px controls, page errors or live writes. Additional read-only checks at 320px measured inside dropdown option targets, selected/keyboard states and menu containment; a rich-editor AI menu initially protruded 28px left on phones and was corrected. Settings/Testimonial field and sidebar/Sign Out checks used **two mocked writes, zero live writes**, and passed. Existing read-only Buildlog, Blog, Project, FAQ, Experience, Certification, Community Wall and Resume checks were also run separately against their flows with writes intercepted. Public Home rendered through the Alloy preview; its GPU/WebGL sandbox warnings predate this Admin work.
- **Remaining release gates:** connected Blog-image and token-checked Project-delete migrations, the Community Wall pending-default/legacy-RPC migration, and Resume/Storage rollout need owner-reviewed backups and controlled application; no migration was applied here. Connected disposable create/edit/publish/archive/delete tests, cache invalidation behavior, effective policy/grant review, Cloudinary/Storage failure recovery, and owner visual/accessibility approval remain open. Experience, Certification, FAQ and Testimonial records still lack a reliable optimistic revision contract for all edit/delete operations; a second tab may overwrite newer content. The bulk Blog embedding endpoint and arbitrary URL-based media references also need separate review. The configured deployment domain has previously returned 404 and must be verified before production sign-off. No credential, existing authored row, or connected data was modified during this pass.

## 2026-10-06 Admin Media Management Pass

- The owner requested a full Admin Media management pass. The library now uses 12-image pages with previous/next controls and exact range/total feedback. It shows one column on narrow phones, two on wider screens, three at tablet width and four at desktop width. Every card keeps its complete stored label visible with overflow wrapping, readable file size **and exact bytes**, dimensions, an Open image link, and visible 44px Copy link, Edit description and Delete actions. Copy reports success or permission failure without exposing the URL in logs. A keyboard-accessible description dialog updates shared `alt_text` via the existing Admin PATCH endpoint. Deletion uses typed `DELETE` confirmation and does not remove the card on a failed request; page bounds correct after the final item is removed. Loading, empty, failed-page/retry, uncertain upload, and in-use delete states remain distinct. Other public pages and Cloudinary asset URLs were not redesigned.
- An uploaded filename was previously stored only as editable `alt_text`; once another editor changed that description, the exact original name could not be recovered. New `migrations/2026_media_original_filename.sql` adds a separate immutable `original_filename` column, and the canonical schema snapshot includes it. The upload API now attempts to store `file.name` separately; when the **connected schema has not yet been migrated**, it falls back to the existing row shape and returns an explicit warning rather than breaking uploads. The Admin card calls pre-migration names **stored labels (original name unverified)**, and warns that editing a description can change a legacy label. Historical original names cannot be reconstructed accurately from Cloudinary IDs or descriptions. Applying the additive migration after a reviewed database backup is required to guarantee original-name retention on subsequent uploads; this pass did not run SQL against connected data.
- The Admin GET uses a verified service-role read, stable created-at/ID ordering, exact count, bounded pagination and `private, no-store`. Upload validates supported file types, empty/over-20-MB files and filename length before Cloudinary; DB-insert failure attempts a Cloudinary rollback and distinguishes confirmed cleanup from possible orphaned assets. The shared Media Picker surfaces the filename-schema warning after uploads. Existing protected-reference checks still block known Blog, Project, Testimonial, Experience and Certification uses before deletion; they cannot discover every external hard-coded URL, and Cloudinary and Postgres operations are not atomic.
- Docker TypeScript, scoped ESLint and `git diff --check` passed. The selected Admin/public/Media/Blog/Project/Credentials regressions passed **73 tests, one existing Project skip**, and the mocked Media component checks passed **5/5**. Upload unit mocks tested exact-name persistence, missing-migration warning, successful/failed rollback and invalid-file rejection **4/4**. The isolated production build passed with **127 static pages** and the existing image lint/Edge notices. An authenticated **read-only** owner browser pass against connected Media rows passed before/after the build at 320/390/768/1280/1440px: card column counts, full labels and byte sizes, real second-page navigation, clipboard matching, typed-delete cancel, mocked in-use 409, mocked description PATCH, rejected SVG and mocked upload warning. It recorded **three mocked writes, zero live writes, zero page errors**, and locally revoked the temporary Auth session. A redacted desktop screenshot was visually reviewed then removed; no screenshot or private response was committed.
- This is not a pixel-perfect/production certification. A controlled, disposable **real** Cloudinary upload/copy/edit/delete and recovery test still needs owner-reviewed backup/rollback authorization; the new filename migration must be applied and its effective grants checked first. A concurrent reference change during deletion, Cloudinary compensation failure, invalid image bytes that pass MIME checks, and external references remain residual risks. Formal `AUDIT_TESTING.md` review and owner visual acceptance are separate gates.

Representative Docker validation commands (one-off owner fixture helpers were removed after earlier tests):

```bash
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs tests/legal-pages.integration.test.mjs tests/blog.integration.test.mjs tests/project-detail.integration.test.mjs tests/navigation-coverage.integration.test.mjs tests/preview-runtime.integration.test.mjs
docker compose -f docker-compose.alloy.yaml run --rm --no-deps -v /tmp/opencode/admin-next-build:/workspace/.next-build -e NEXT_DIST_DIR=.next-build web bash -lc 'set -a && . ./.env.local && set +a && npm run build'
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs
docker compose -f docker-compose.alloy.yaml exec -T web npx tsx --test tests/admin-error-states.test.tsx
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-shell.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs tests/legal-pages.integration.test.mjs tests/blog.integration.test.mjs tests/project-detail.integration.test.mjs tests/navigation-coverage.integration.test.mjs tests/preview-runtime.integration.test.mjs
```

## 2026-10-06 Compact Admin Media Cards

- Superseding the three-action card layout described above, each Media card now shows only a contained image preview, one wrapping stored name, and 44px Copy link and Delete buttons. Size, dimensions, Open image link, visible description and the edit-description dialog were removed from this page; the API's description PATCH remains for other consumers. The responsive one/two/three/four-column grid, 12-image pagination, upload controls and deletion confirmation/reference checks remain.
- Docker TypeScript, focused ESLint, `git diff --check`, Media component checks **5/5**, focused security/upload/delete tests **37/37**, and an isolated production build (**127 static pages**, existing image lint and Edge-runtime notices) passed. The gated owner-authenticated browser check passed at 320/390/768/1280/1440px with exactly two card actions, no measured overflow or undersized buttons, real second-page navigation, matching clipboard link, typed-delete cancel and mocked 409, SVG rejection and mocked upload warning. **Two writes were mocked, zero reached connected services; zero page errors; temporary Auth session locally revoked.** No real image or connected record was changed by this check.
- `migrations/2026_media_original_filename.sql` remains **unapplied** to the connected 15-row Media table. Available Supabase keys provide REST access, not direct SQL execution; no database connection credential or verified backup/restore point is available here. The additive SQL was inspected but was not run or verified on the connected database. Stream uploads and editable legacy `alt_text` do not provide an authoritative historical original-filename backfill. Owner-backed SQL access, schema/grant verification, a disposable upload, and visual acceptance remain open; no pixel-perfect or production sign-off is claimed.

## 2026-10-06 System Logs Continuation

- The owner requested a production-quality Logs review. The Admin page now pages through all stored `system_logs` rows in stable 50-event batches rather than silently stopping at 100, with server-side severity/status/message filtering, exact result counts, refresh, per-event detail/cause display where recorded, and an explicit distinction between recorded app events and uncollected server/infrastructure/provider failures. Removed the live "Simulate Error" UI action so routine monitoring cannot create fake incidents. Resolve and typed-confirmation clear remain Admin-only; successful mutations reload authoritative counts, and failures do not claim success.
- A read-only connected count found **327 recorded / 325 unresolved** at the time of review; this is not a statement about site health or comprehensive error coverage. Docker TypeScript, focused ESLint, Admin security tests **19/19**, `git diff --check` and an isolated production build (**127 static pages**; pre-existing image lint/Edge notices) passed. The locally revoked owner-session browser test passed before and after the build at 320/390/768/1440px with no measured page overflow, out-of-view buttons, page errors or connected writes. It exercised detail expansion, real page two, status filtering and an empty search. Redacted screenshots were kept outside the repository. No bulk clear, real resolve or injected test event was performed; those mutations require a disposable fixture and a reviewed recovery plan. The installed logger currently writes only explicit `logger` calls (including root UI error boundaries); host process logs, API exceptions without instrumentation, upstream outages and observability integrations are not captured automatically.
## Future evidence protocol

Record date, environment, route/method, role (anonymous/non-owner/owner), theme/viewport if visual, expected vs observed result, redacted artifact reference, owner permission, fixture IDs held privately, cleanup and residual risks. Do not attach tokens, passwords, raw settings values or unredacted API bodies. Distinguish test pass from owner acceptance and deployment sign-off.
