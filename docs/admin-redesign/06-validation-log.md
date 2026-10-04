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
| Legacy About / retired Changelog consumers | Source-confirmed; Changelog owner decision implemented | `/admin/about` warns legacy saves will not appear on locked public About. `fetchAndSortChangelogEntrees` remains in `app/lib/utils.ts` only for unused public `ChangelogBento`, which was left untouched under public locks. Changelog Admin flow is retired; connected old tables are preserved pending export/backup and separate data cleanup approval |
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

Representative Docker validation commands (one-off owner fixture helpers were removed after earlier tests):

```bash
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs tests/legal-pages.integration.test.mjs tests/blog.integration.test.mjs tests/project-detail.integration.test.mjs tests/navigation-coverage.integration.test.mjs tests/preview-runtime.integration.test.mjs
docker compose -f docker-compose.alloy.yaml run --rm --no-deps -v /tmp/opencode/admin-next-build:/workspace/.next-build -e NEXT_DIST_DIR=.next-build web bash -lc 'set -a && . ./.env.local && set +a && npm run build'
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs
docker compose -f docker-compose.alloy.yaml exec -T web npx tsx --test tests/admin-error-states.test.tsx
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-shell.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs tests/legal-pages.integration.test.mjs tests/blog.integration.test.mjs tests/project-detail.integration.test.mjs tests/navigation-coverage.integration.test.mjs tests/preview-runtime.integration.test.mjs
```

## Future evidence protocol

Record date, environment, route/method, role (anonymous/non-owner/owner), theme/viewport if visual, expected vs observed result, redacted artifact reference, owner permission, fixture IDs held privately, cleanup and residual risks. Do not attach tokens, passwords, raw settings values or unredacted API bodies. Distinguish test pass from owner acceptance and deployment sign-off.
