# Validation Log

Current-worktree planning snapshot. **Source-confirmed** means inspected code, **observed** means supplied authenticated/anonymous read-only browser or REST evidence, **prior check** means an earlier test/build result, and **blocked** means separate owner approval is needed. Owner-session checks were read-only. No connected writes, locked public/Admin edits or migration applied by us; no deployment sign-off. Never add passwords, session material, settings/log values, secrets or private response bodies here.

| Item | Status | Evidence / limitation |
| --- | --- | --- |
| Next/Admin structure | Confirmed in source | `package.json`, `app/layout.tsx`, `app/admin/(dashboard)/layout.tsx`, `app/components/admin/Sidebar.tsx`, `app/admin/(dashboard)/page.tsx`, route filesystem |
| Media/About/Settings route move | Source-confirmed; partial owner UI observed | `app/admin/(dashboard)/{media,about,settings}/page.tsx`; anonymous URLs 307 to login, owner API GETs 200 by shape. Owner About/Settings form geometry and Media list sampled read-only; no save/copy/upload or full UI acceptance. Root Navbar/Footer/chat inherited and overlapping |
| Page access policy | Source-confirmed; partial runtime observation | `middleware.ts`, dashboard layout and `app/lib/admin-auth.ts` check user/`ADMIN_EMAIL`; owner `/admin` and `/admin/logs` rendered; five owner API GETs 200. Non-owner role and mutation authorization not tested |
| Login | Observed unauth layout; sign-in behavior unverified | `tests/admin-login.browser.test.mjs` reported 1/1 in Docker at 320/375/390/640/768/1024/1440 light/dark: no overflow, one `h1`, noindex, labelled email/password fields >=44px, submit >=48px, card fit and no page errors. `GET /admin/login` 200 with robots meta. Owner-provided session enabled read-only browsing; actual sign-in/error and non-owner sign-out flows were not exercised here |
| Owner dashboard/Logs read-only render | Observed limited pass | `/admin` rendered in owner session, `/admin/logs` rendered a log list; no log values recorded, no actions clicked. Count/draft accuracy and CRUD unverified |
| Dashboard containment/layout | Observed before/after, selected widths | Before Admin-only fix: viewport 390 dark, main x15..375, internal right edge x566 hidden by root clip. Layout/dashboard min-width/minmax changes and new stats `md:2`/`xl:3`, actions mobile 1/`lg:2`, panels `xl:2`. A later 320px check found a recent Project edit control at x334; truncating the title and keeping the status/edit group in view removed it. Direct 320px and authenticated same-origin iframe 390/640/768/1024/1440px checks show zero measured dashboard-panel offenders. Root scroll width alone is not evidence of containment; not a full width/theme/function pass |
| Sidebar mobile drawer | Observed read-only at 390; source-confirmed controls | 16 nav links measured min-44px, one active `aria-current="page"`, Escape/close restored focus to trigger; desktop/route focus behaviors not fully rechecked. No logout pressed |
| About/Settings form geometry | Observed read-only owner session | Legacy About originally had 14 unlabeled fields; local IDs/labels and 44px minimum text input height added. Same-origin offscreen iframe at 320/390/768/1440: 14 labelled, no overflow; legacy warning retained. Settings: seven labelled fields, no overflow at 320/390/640/768/1024/1440. No typing/save/reopen or field values recorded |
| Sampled Admin route containment | Observed read-only; locked blocker | Projects/Blogs/Media and FAQs/Analytics/Changelogs/Logs at sampled widths had no uncontained overflow after local Changelog header wrap. **Locked `/admin/buildlog`**: 9/9/6 out-of-viewport elements at 320/390/768; document scrollWidth appears zero because root clips. No locked Buildlog edit; named owner unlock required |
| Changelog list source/UI | Source-confirmed; read-only sampled | `app/admin/(dashboard)/changelogs/page.tsx` locally wraps header, separates error from successful empty and names edit icon; no authenticated CRUD/public Changelog consumer verified |
| Inherited root chrome/metadata | Observed/source-confirmed; owner decision pending | Navbar/Footer/chat overlap Admin; `app/layout.tsx` still supplies WebSite JSON-LD and canonical metadata despite `app/admin/layout.tsx` noindex. Locked root untouched; owner unlock or approved alternative required to isolate |
| Connected `site_settings` schema | Confirmed supplied read-only observation | GET 200, one row; columns `id`, `site_name`, `seo_description`, `seo_keywords`, `github_url`, `twitter_url`, `linkedin_url`, `email_address`, `created_at`, `updated_at`, `show_faq_section`; values omitted |
| Settings API | Source-confirmed; anonymous and owner GET observed | `app/api/admin/settings/route.ts`: verified Admin then service role, singleton named columns, strict optional Zod PUT, private no-store GET/successful PUT. Anonymous GET 401 (previously 500); owner GET 200 with exactly seven named fields: `site_name`, `seo_description`, `seo_keywords`, `github_url`, `twitter_url`, `linkedin_url`, `email_address`. No values recorded; no PUT/save-reopen |
| Other anonymous API GETs | Observed status only | Current `GET /api/admin/{about,faqs,changelogs,media}` all 401, plus Settings 401; previous 200 about/faqs/changelogs/experience and 401 media/testimonials/resume/buildlog/community-wall, 405 blogs/projects. Experience has no new result; status alone does not prove exposure or other-method safety |
| Other owner API GETs | Observed HTTP 200, shapes only | `GET /api/admin/about`: legacy fields; `/api/admin/faqs` and `/api/admin/changelogs`: `data` arrays; `/api/admin/media`: `data` array and `count`. No response values or contents recorded, no mutation or page UI acceptance implied |
| Connected content tables | Observed read-only | REST `?select=id&limit=0` returned 200 for `about_content`, `about_sections`, `changelogs`, `changelog_entries`, `faqs`. Further read-only `about_content` column inspection: `id`, `hero_title`, `hero_subtitle`, sections 1-4 `title`/`content`/`image_url`, `created_at`, `updated_at`; no values recorded |
| Connected Media schema | Observed read-only | REST `media?select=*&limit=1` returned one row; columns `id`, `public_id`, `url`, `secure_url`, `width`, `height`, `format`, `bytes`, `alt_text`, `folder`, `created_at`, `updated_at`; no values recorded. Owner Admin API GET later returned 200 `data`/`count`; Media page UI/upload/deletion not checked |
| Media UI and upload boundary | Source-confirmed; UI/actions unverified | `app/admin/(dashboard)/media/page.tsx` maps `bytes`/`alt_text`/`secure_url`, distinguishes load failure from empty with retry, reports copy failure, has touch/keyboard copy and keyboard upload controls, restricted picker types. `app/api/admin/media/upload/route.ts` intentionally unchanged: historically owner-approved Cloudinary-supported non-SVG uploads with no new size cap. API GET is not an upload or page UI pass |
| Legacy About / Changelog consumers | Source-confirmed; owner decision pending | `/admin/about` warns legacy saves will not appear on locked public About; `app/api/admin/about/route.ts` strict partial allowlist after Admin check; source search found no public About `about_content` consumer. `fetchAndSortChangelogEntrees` is used by `ChangelogBento`, but no live public component uses that bento; connected Changelog tables exist. No save or public change |
| Logs schema and UI | Observed read-only change; provenance unknown | Earlier REST `system_logs?select=id,resolved&limit=0` returned 400 / `42703`; latest identical probe returned **200**. Owner `/admin/logs` rendered a list; no values recorded or actions clicked. We applied no migration. Column provenance, staged SQL application, index and effective RLS are unverified; source retains an unavailable error state |
| FAQ input/UI and authorization | Source-confirmed; authenticated CRUD unverified | `app/api/admin/faqs/route.ts` full strict POST, partial nonempty PUT with UUID id, strict boolean PATCH, UUID DELETE; verified Admin precedes service role for FAQ reads/writes and FAQ list/edit page reads. `FaqForm` labels and error associations; section switch labelled. No connected FAQ write |
| FAQ/settings RLS | Source-confirmed; connected policy unknown | `migrations/2026_admin_content_rls_hardening.sql` stages removal of broad FAQ-manage and site-settings-update authenticated policies; **not applied by us**. Connected policy catalog not inspected; review read-only before owner-approved rollout |
| Dashboard/Projects list | Source-confirmed; partial owner render | Both check Admin before service-role reads and show query errors instead of false zero/empty; `/admin` rendered and Projects list sampled for containment, but counts/drafts and list actions not validated |
| Security integration | Observed passed, limited scope | Docker `tests/admin-security.integration.test.mjs`: **6/6**. Source and anonymous HTTP tests cover five GET 401s, auth/schema/FAQ/About/Media boundaries, login robots and three 307 redirects; added source assertions for Admin grid containment and control naming. Static assertions are not a browser geometry regression. No non-owner runtime, connected writes or RLS catalog assertions |
| Login browser test | Observed passed, layout scope | Docker `tests/admin-login.browser.test.mjs`: **1/1**, seven widths x two themes; screenshot `/tmp/playwright/admin-login-mobile-review.png` is outside the repo. Owner Dashboard/Logs read-only UI observed separately, not by this test |
| Combined Admin/public/locked regression | Observed passed, limited scope | Latest broad Docker Node run: **39 pass, one existing Project skip**. An accidental inclusion of `.tsx` in Node's native runner produced one loader failure; rerun with `tsx` separately passed **1/1**. See commands below. No locked public or locked Admin source edited |
| Post-build smoke | Observed passed, limited scope | **10/10** after final isolated build. See exact command below. Not an owner-authenticated write check |
| Static checks | Observed passed | Docker `npx tsc --noEmit`, focused ESLint on latest Admin/test edits and `git diff --check` passed after the final Dashboard edit |
| Isolated production build / preview | Observed passed; preview retained | Final Docker build command below succeeded with **132 static pages** after the latest Dashboard fix; one preexisting `CurrentlyReadingBento` img warning plus edge-runtime notice. `.next-build` mounted outside workspace; host-network preview port 3000 remains running |
| Connected write and release checks | Blocked | No connected saves, upload/delete or log actions; Settings/About save/reopen, FAQ CRUD, policy/index/provenance, root chrome isolation and locked Buildlog overflow remain; no production-ready claim |
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

Docker validation commands run during this session (no connected writes):

```bash
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs tests/legal-pages.integration.test.mjs tests/blog.integration.test.mjs tests/project-detail.integration.test.mjs tests/navigation-coverage.integration.test.mjs tests/preview-runtime.integration.test.mjs
docker compose -f docker-compose.alloy.yaml run --rm --no-deps -v /tmp/opencode/admin-next-build:/workspace/.next-build -e NEXT_DIST_DIR=.next-build web bash -lc 'set -a && . ./.env.local && set +a && npm run build'
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs
docker compose -f docker-compose.alloy.yaml exec -T web npx tsx --test tests/admin-error-states.test.tsx
```

## Future evidence protocol

Record date, environment, route/method, role (anonymous/non-owner/owner), theme/viewport if visual, expected vs observed result, redacted artifact reference, owner permission, fixture IDs held privately, cleanup and residual risks. Do not attach tokens, passwords, raw settings values or unredacted API bodies. Distinguish test pass from owner acceptance and deployment sign-off.
