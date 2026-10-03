# Validation Log

Current-worktree planning snapshot. **Source-confirmed** means inspected code, **observed** means supplied read-only/browser evidence, **reported** means prior test/build result without its full command transcript here, and **blocked** means owner action is needed. Source/tests have changed since the previous snapshot; this docs update itself runs no application tests, build or connected requests and changes only these eight docs. No owner login, connected writes, migration rollout or deployment sign-off. Never add actual settings values, secrets or private response bodies here.

| Item | Status | Evidence / limitation |
| --- | --- | --- |
| Next/Admin structure | Confirmed in source | `package.json`, `app/layout.tsx`, `app/admin/(dashboard)/layout.tsx`, `app/components/admin/Sidebar.tsx`, `app/admin/(dashboard)/page.tsx`, route filesystem |
| Media/About/Settings route move | Source-confirmed; anonymous redirect observed | `app/admin/(dashboard)/{media,about,settings}/page.tsx`; `GET /admin/{about,media,settings}` each returned 307 to `/admin/login`. Same URLs; authenticated shell unverified; root Navbar/Footer/chat still inherited |
| Page access policy | Source-confirmed; partial anonymous observation | `middleware.ts`, dashboard layout and `app/lib/admin-auth.ts` check user/`ADMIN_EMAIL`; `requireAdmin()` returns 401/403/503 by condition. Non-owner and owner runtime still unverified |
| Login | Observed unauth layout; authenticated blocked | `tests/admin-login.browser.test.mjs` reported 1/1 in Docker at 320/375/390/640/768/1024/1440 light/dark: no overflow, one `h1`, noindex, labelled email/password fields >=44px, submit >=48px, card fit and no page errors. `GET /admin/login` 200 with robots meta; earlier 390px screenshots. Actual sign-in/error interactions not covered. `app/lib/supabase/auth.ts` signs out non-owner in source; no owner/non-owner runtime login performed |
| Authenticated dashboard/sidebar/editors | Blocked | No owner credentials. Do not infer appearance or CRUD success from source |
| Connected `site_settings` schema | Confirmed supplied read-only observation | GET 200, one row; columns `id`, `site_name`, `seo_description`, `seo_keywords`, `github_url`, `twitter_url`, `linkedin_url`, `email_address`, `created_at`, `updated_at`, `show_faq_section`; values omitted |
| Settings API | Source-confirmed; anonymous GET observed | `app/api/admin/settings/route.ts`: verified Admin then service role, singleton named columns, strict optional Zod PUT, private no-store GET/successful PUT; `GET /api/admin/settings` now 401 anonymous (previously 500). No authenticated GET/PUT or connected save |
| Other anonymous API GETs | Observed status only | Current `GET /api/admin/{about,faqs,changelogs,media}` all 401, plus Settings 401; previous 200 about/faqs/changelogs/experience and 401 media/testimonials/resume/buildlog/community-wall, 405 blogs/projects. Experience has no new result; status alone does not prove exposure or other-method safety |
| Connected content tables | Observed read-only | REST `?select=id&limit=0` returned 200 for `about_content`, `about_sections`, `changelogs`, `changelog_entries`, `faqs`. Further read-only `about_content` column inspection: `id`, `hero_title`, `hero_subtitle`, sections 1-4 `title`/`content`/`image_url`, `created_at`, `updated_at`; no values recorded |
| Connected Media schema | Observed read-only | REST `media?select=*&limit=1` returned one row; columns `id`, `public_id`, `url`, `secure_url`, `width`, `height`, `format`, `bytes`, `alt_text`, `folder`, `created_at`, `updated_at`; no values recorded. No authenticated Media UI, upload or deletion checked |
| Media UI and upload boundary | Source-confirmed; runtime blocked | `app/admin/(dashboard)/media/page.tsx` maps `bytes`/`alt_text`/`secure_url`, distinguishes load failure from empty with retry, reports copy failure, has touch/keyboard copy and keyboard upload controls, restricted picker types. `app/api/admin/media/upload/route.ts` intentionally unchanged: historically owner-approved Cloudinary-supported non-SVG uploads with no new size cap. Source check is not an upload or owner-authenticated pass |
| Legacy About / Changelog consumers | Source-confirmed; owner decision pending | `/admin/about` warns legacy saves will not appear on locked public About; `app/api/admin/about/route.ts` strict partial allowlist after Admin check; source search found no public About `about_content` consumer. `fetchAndSortChangelogEntrees` is used by `ChangelogBento`, but no live public component uses that bento; connected Changelog tables exist. No save or public change |
| Logs schema and UI | Observed read-only; source-confirmed | REST `system_logs?select=id,resolved&limit=0`: HTTP 400, code `42703`, missing `resolved`. `migrations/2026_admin_system_logs_resolved.sql` (column/index) staged, **not applied**. Logs shows unavailable on read error; actions check Admin before service role; no connected log action |
| FAQ input/UI and authorization | Source-confirmed; authenticated CRUD unverified | `app/api/admin/faqs/route.ts` full strict POST, partial nonempty PUT with UUID id, strict boolean PATCH, UUID DELETE; verified Admin precedes service role for FAQ reads/writes and FAQ list/edit page reads. `FaqForm` labels and error associations; section switch labelled. No connected FAQ write |
| FAQ/settings RLS | Source-confirmed; connected policy unknown | `migrations/2026_admin_content_rls_hardening.sql` stages removal of broad FAQ-manage and site-settings-update authenticated policies; **not applied**. Connected policy catalog not inspected; review read-only before owner-approved rollout |
| Dashboard/Projects list | Source-confirmed; authenticated data unverified | Both check Admin before service-role reads and show query errors instead of false zero/empty; draft behavior not owner-authenticated |
| Security integration | Observed passed, limited scope | Docker `tests/admin-security.integration.test.mjs`: **5/5**. Source and anonymous HTTP tests cover five GET 401s, auth/schema/FAQ/About/Media boundaries, login robots and three 307 redirects. No owner/non-owner runtime, connected writes or RLS catalog assertions |
| Login browser test | Observed passed, layout scope | Docker `tests/admin-login.browser.test.mjs`: **1/1**, seven widths x two themes; screenshot `/tmp/playwright/admin-login-mobile-review.png` is outside the repo. Authenticated UI remains unverified |
| Combined Admin/public/locked regression | Observed partial pass | **38 pass, one existing Project skip**. See exact command below. No locked public or locked Admin source edited; owner acceptance and full coverage remain outstanding |
| Post-build smoke | Observed passed, limited scope | **9/9** after isolated build. See exact command below. Not an owner-authenticated UI or connected write check |
| Static checks | Observed passed | `docker compose -f docker-compose.alloy.yaml exec -T web npx tsc --noEmit`; focused Docker ESLint for changed Admin and test files passed. `git diff --check` passed |
| Isolated production build / preview | Reported build pass; preview retained | Current-code Docker build command below succeeded with **132 static pages**; one preexisting `CurrentlyReadingBento` img warning plus edge-runtime notice. `.next-build` mounted outside workspace. Host-network preview port 3000 remains running; no 8080 app, no build run in this docs update |
| Connected write and release checks | Blocked | No connected saves, upload/delete or log actions; Settings/About valid save/reopen, FAQ authenticated CRUD, policy/catalog review and migration rollout still needed; no production-ready claim |
| Documentation whitespace check | Passed for this update | `git diff --check` returned clean; `for file in docs/admin-redesign/*.md; do git diff --no-index --check /dev/null "$file" || exit; done` returned clean for all eight untracked docs. No application tests/builds/connected requests in this update |

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
- Authenticated save/reopen, non-owner role behavior, Media upload, owner visual
  review, the connected RLS catalog and both staged migrations remain blocked.

Docker validation commands run during this session (no connected writes):

```bash
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs tests/legal-pages.integration.test.mjs tests/blog.integration.test.mjs tests/project-detail.integration.test.mjs tests/navigation-coverage.integration.test.mjs tests/preview-runtime.integration.test.mjs
docker compose -f docker-compose.alloy.yaml run --rm --no-deps -v /tmp/opencode/admin-next-build:/workspace/.next-build -e NEXT_DIST_DIR=.next-build web bash -lc 'set -a && . ./.env.local && set +a && npm run build'
docker compose -f docker-compose.alloy.yaml exec -T web node --test --test-concurrency=1 tests/admin-login.browser.test.mjs tests/admin-security.integration.test.mjs tests/home-about-surfaces.integration.test.mjs
```

## Future evidence protocol

Record date, environment, route/method, role (anonymous/non-owner/owner), theme/viewport if visual, expected vs observed result, redacted artifact reference, owner permission, fixture IDs held privately, cleanup and residual risks. Do not attach tokens, passwords, raw settings values or unredacted API bodies. Distinguish test pass from owner acceptance and deployment sign-off.
