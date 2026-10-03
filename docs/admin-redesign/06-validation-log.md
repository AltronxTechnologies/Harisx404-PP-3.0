# Validation Log

Current-worktree planning snapshot. **Source-confirmed** means inspected code, **observed** means authenticated/anonymous browser or REST evidence, **prior check** means an earlier test/build result, and **blocked** means separate owner approval is needed. Earlier owner-session checks were read-only; the latest scoped Buildlog/FAQ fixture cycles used authenticated APIs with verified cleanup. No public-source edit, unapproved locked Admin edit or migration applied by us; no deployment sign-off. Never add passwords, session material, settings/log values, secrets or private response bodies here.

| Item | Status | Evidence / limitation |
| --- | --- | --- |
| Next/Admin structure | Confirmed in source | `package.json`, `app/layout.tsx`, `app/admin/(dashboard)/layout.tsx`, `app/components/admin/Sidebar.tsx`, `app/admin/(dashboard)/page.tsx`, route filesystem |
| Media/About/Settings route move | Source-confirmed; partial owner UI observed | `app/admin/(dashboard)/{media,about,settings}/page.tsx`; anonymous URLs 307 to login, owner API GETs 200 by shape. Owner About/Settings form geometry and Media list sampled read-only before latest shell/style changes; no save/copy/upload or full UI acceptance. Inherited public chrome now hidden on Admin routes only |
| Page access policy | Source-confirmed; partial runtime observation | `middleware.ts`, dashboard layout and `app/lib/admin-auth.ts` check user/`ADMIN_EMAIL`; owner `/admin` and `/admin/logs` rendered earlier. Authenticated Buildlog/FAQ mutation fixtures passed; non-owner role and other endpoint mutations not tested |
| Login | Observed unauth layout; sign-in behavior unverified | `tests/admin-login.browser.test.mjs` reported 1/1 in Docker at 320/375/390/640/768/1024/1440 light/dark: no overflow, one `h1`, noindex, labelled email/password fields >=44px, submit >=48px, card fit and no page errors. `GET /admin/login` 200 with robots meta. Owner-provided session enabled read-only browsing; actual sign-in/error and non-owner sign-out flows were not exercised here |
| Owner dashboard/Logs read-only render | Observed limited pass | `/admin` rendered in owner session, `/admin/logs` rendered a log list; no log values recorded, no actions clicked. Count/draft accuracy and CRUD unverified |
| Dashboard containment/layout | Observed before/after, selected widths | Before Admin-only fix: viewport 390 dark, main x15..375, internal right edge x566 hidden by root clip. Layout/dashboard min-width/minmax changes and new stats `md:2`/`xl:3`, actions mobile 1/`lg:2`, panels `xl:2`. A later 320px check found a recent Project edit control at x334; truncating the title and keeping the status/edit group in view removed it. Direct 320px and authenticated same-origin iframe 390/640/768/1024/1440px checks show zero measured dashboard-panel offenders. Root scroll width alone is not evidence of containment; not a full width/theme/function pass |
| Sidebar mobile drawer | Observed read-only at 390; source-confirmed controls | 16 nav links measured min-44px, one active `aria-current="page"`, Escape/close restored focus to trigger; desktop/route focus behaviors not fully rechecked. No logout pressed |
| About/Settings form geometry | Observed before latest shell/style changes | Legacy About originally had 14 unlabeled fields; IDs/labels and 44px minimum text input height added. Same-origin offscreen iframe at 320/390/768/1440: 14 labelled, no overflow; legacy warning retained. Settings: seven labelled fields, no overflow at 320/390/640/768/1024/1440 before latest visual alignment with About. No typing/save/reopen or field values recorded |
| Sampled Admin route containment | Observed authenticated for Buildlog; remaining routes partial | Projects/Blogs/Media and FAQs/Analytics/Changelogs/Logs were sampled earlier. Before owner's specific unlock, `/admin/buildlog` measured 9/9/6 out-of-viewport cells at 320/390/768, largely within its intended horizontal table scroll container. Mobile cards now replace the table below `xl`; authenticated 320/390/768/1024/1280/1440 checks found no visible card/control overflow. Other locked Buildlog scopes remain frozen |
| Changelog list source/UI | Source-confirmed; read-only sampled | `app/admin/(dashboard)/changelogs/page.tsx` locally wraps header, separates error from successful empty and names edit icon; no authenticated CRUD/public Changelog consumer verified |
| Inherited root chrome/metadata | Admin visual isolation observed; render-time decision pending | Owner authorized removing public chrome from Admin while preserving public pages. `app/admin/layout.tsx` styles hide inherited Navbar/Footer/chat/rails only on Admin; `noindex` remains and Admin canonical is absent. Browser checked Admin login at 320/390/768/1440 and public Home frame. Root components still mount invisibly and WebSite JSON-LD still inherits; true render-time omission would require a separate locked-root change |
| Connected `site_settings` schema | Confirmed supplied read-only observation | GET 200, one row; columns `id`, `site_name`, `seo_description`, `seo_keywords`, `github_url`, `twitter_url`, `linkedin_url`, `email_address`, `created_at`, `updated_at`, `show_faq_section`; values omitted |
| Settings API | Source-confirmed; anonymous and owner GET observed | `app/api/admin/settings/route.ts`: verified Admin then service role, singleton named columns, strict optional Zod PUT, private no-store GET/successful PUT. Anonymous GET 401 (previously 500); owner GET 200 with exactly seven named fields: `site_name`, `seo_description`, `seo_keywords`, `github_url`, `twitter_url`, `linkedin_url`, `email_address`. No values recorded; no PUT/save-reopen |
| Other anonymous API GETs | Observed status only | Current `GET /api/admin/{about,faqs,changelogs,media}` all 401, plus Settings 401; previous 200 about/faqs/changelogs/experience and 401 media/testimonials/resume/buildlog/community-wall, 405 blogs/projects. Experience has no new result; status alone does not prove exposure or other-method safety |
| Other owner API GETs | Observed HTTP 200, shapes only | `GET /api/admin/about`: legacy fields; `/api/admin/faqs` and `/api/admin/changelogs`: `data` arrays; `/api/admin/media`: `data` array and `count`. No response values or contents recorded, no mutation or page UI acceptance implied |
| Connected content tables | Observed read-only | REST `?select=id&limit=0` returned 200 for `about_content`, `about_sections`, `changelogs`, `changelog_entries`, `faqs`. Further read-only `about_content` column inspection: `id`, `hero_title`, `hero_subtitle`, sections 1-4 `title`/`content`/`image_url`, `created_at`, `updated_at`; no values recorded |
| Connected Media schema | Observed read-only | REST `media?select=*&limit=1` returned one row; columns `id`, `public_id`, `url`, `secure_url`, `width`, `height`, `format`, `bytes`, `alt_text`, `folder`, `created_at`, `updated_at`; no values recorded. Owner Admin API GET later returned 200 `data`/`count`; Media page UI/upload/deletion not checked |
| Media UI and upload boundary | Source-confirmed; UI/actions unverified | `app/admin/(dashboard)/media/page.tsx` maps `bytes`/`alt_text`/`secure_url`, distinguishes load failure from empty with retry, reports copy failure, has touch/keyboard copy and keyboard upload controls, restricted picker types. `app/api/admin/media/upload/route.ts` intentionally unchanged: historically owner-approved Cloudinary-supported non-SVG uploads with no new size cap. API GET is not an upload or page UI pass |
| Legacy About / Changelog consumers | Source-confirmed; owner decision pending | `/admin/about` warns legacy saves will not appear on locked public About; `app/api/admin/about/route.ts` strict partial allowlist after Admin check; source search found no public About `about_content` consumer. `fetchAndSortChangelogEntrees` is used by `ChangelogBento`, but no live public component uses that bento; connected Changelog tables exist. No save or public change |
| Logs schema and UI | Observed read-only change; provenance/policy unknown | Earlier REST `system_logs?select=id,resolved&limit=0` returned 400 / `42703`; latest identical probe returned **200**. Owner reported `system_logs_resolved_created_at_idx` exists on `(resolved, created_at DESC)`. Owner `/admin/logs` rendered a list earlier; no values recorded or actions clicked. We applied no migration. Column provenance, staged SQL application and effective RLS are unverified |
| FAQ input/UI and authorization | Scoped authenticated lifecycle passed | `app/api/admin/faqs/route.ts` full strict POST, partial PUT with UUID id, boolean PATCH and UUID DELETE. One incomplete POST returned 400; a hidden disposable FAQ passed create/read/update/delete through the authenticated API and was verified absent afterward. FAQ list separates failures and withholds section switch on Settings error; PATCH/visibility/public effects and other role tests remain unverified |
| FAQ/settings RLS | Source-confirmed; connected policy unknown | `migrations/2026_admin_content_rls_hardening.sql` stages removal of broad FAQ-manage and site-settings-update authenticated policies; **not applied by us**. Connected policy catalog not inspected; review read-only before owner-approved rollout |
| Dashboard/Projects list | Source-confirmed; partial owner render | Both check Admin before service-role reads and show query errors instead of false zero/empty; `/admin` rendered and Projects list sampled for containment, but counts/drafts and list actions not validated |
| Security integration | Observed passed, limited scope | Docker `tests/admin-security.integration.test.mjs`: **9/9**. Source and anonymous HTTP tests cover five GET 401s, auth/schema boundaries, login robots and five 307 redirects, with new Admin Buildlog card/target source assertions. This source test is distinct from authenticated geometry and fixture lifecycle evidence |
| Login browser test | Observed passed, layout scope | Docker `tests/admin-login.browser.test.mjs`: **1/1**, seven widths x two themes; screenshot `/tmp/playwright/admin-login-mobile-review.png` is outside the repo. Owner Dashboard/Logs read-only UI observed separately, not by this test |
| Combined Admin/public/locked regression | Observed passed, limited scope | Latest broad Docker Node run: **43 pass, one existing Project skip**; Buildlog integration/versions/browser **11/11**. Public Buildlog source and visual baseline unchanged. Owner authorized narrow Admin Buildlog edit; no public Buildlog source edited |
| Post-build smoke | Observed passed | **20/20** after final isolated Buildlog edit build; includes Admin/login/shell, public Home/About and public Buildlog integration. Not full owner CRUD acceptance |
| Static checks | Observed passed | Docker `npx tsc --noEmit`, focused ESLint on latest Admin/test edits and `git diff --check` passed after the final Dashboard edit |
| Isolated production build / preview | Observed passed; preview retained | Final Docker build succeeded with **132 static pages** after Admin-only Buildlog list edit; one preexisting img warning plus edge-runtime notice. `.next-build` mounted outside workspace; host-network preview port 3000 remains running |
| Connected write and release checks | Scoped pass; broader acceptance blocked | Authenticated draft/demo Buildlog and hidden FAQ create/read/update/delete passed, cleanup confirmed. Settings/About singleton save/reopen, Blog/Project/Media, log actions, policy/provenance, full root omission and other named locked Admin scopes remain; no production-ready claim |
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

Docker validation commands run during this session (no connected writes):

```bash
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs tests/legal-pages.integration.test.mjs tests/blog.integration.test.mjs tests/project-detail.integration.test.mjs tests/navigation-coverage.integration.test.mjs tests/preview-runtime.integration.test.mjs
docker compose -f docker-compose.alloy.yaml run --rm --no-deps -v /tmp/opencode/admin-next-build:/workspace/.next-build -e NEXT_DIST_DIR=.next-build web bash -lc 'set -a && . ./.env.local && set +a && npm run build'
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs
docker compose -f docker-compose.alloy.yaml exec -T web npx tsx --test tests/admin-error-states.test.tsx
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-shell.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs tests/legal-pages.integration.test.mjs tests/blog.integration.test.mjs tests/project-detail.integration.test.mjs tests/navigation-coverage.integration.test.mjs tests/preview-runtime.integration.test.mjs
```

## Future evidence protocol

Record date, environment, route/method, role (anonymous/non-owner/owner), theme/viewport if visual, expected vs observed result, redacted artifact reference, owner permission, fixture IDs held privately, cleanup and residual risks. Do not attach tokens, passwords, raw settings values or unredacted API bodies. Distinguish test pass from owner acceptance and deployment sign-off.
