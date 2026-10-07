# Admin Production-Readiness Audit

**Started:** 2026-10-07. **Scope:** active Admin routes, their APIs/actions, shared Admin shell, connected dependencies, and the public effects of Admin writes. **Verdict:** NOT YET APPROVED. This is a cross-module release gate, not the one-target-at-a-time pre-lock procedure in `AUDIT_TESTING.md`; it creates no new locks or blanket permission to edit frozen code.

## Working Rules

- Inspect `LOCKED_PERFECT.md`, `DESIGN_DEBT.md`, `AUDIT_TESTING.md`, `05-test-matrix.md`, `07-owner-actions.md`, and `08-backup-restore.md` first. Report findings with severity, file/line, reproduction, actual/expected behavior and evidence before changing locked scopes.
- No real mutation of existing content, Cloudinary assets, private Storage, logs, singleton Settings, Auth accounts or connected schema without an identified disposable fixture, reviewed restore point, target environment and owner approval. A test called `readonly` may still create an Auth review session or make invalid POST probes; inspect it before enabling its gate.
- Never print or save secrets, session material, private table rows, private response bodies or unredacted screenshots. Record counts/statuses and redacted geometry only. Distinguish mocked, isolated-database, connected, and production evidence.
- Run checks in Docker. Keep the web service running. Run production builds with `NEXT_DIST_DIR=.next-build` mounted outside the dev `.next` volume; never build into the running dev server's `.next` directory. Never apply staged SQL or execute production-destructive operations merely to make a test pass.
- Each finding gets an owner-visible disposition: fixed and rechecked; intentional; requires permission; or release blocker. A clean build or visual screenshot alone is not a release decision.

## Specialist Prompts

Run these against one module at a time; return findings first, then evidence and residual risk. The prompts are checklists, not permission to mutate a connected service.

### Software Engineer

> Trace the module's route, client/server components, API handlers, server actions and public consumers. For every field/action, identify the authoritative schema, authentication, validation, cache invalidation and error/empty/loading path. Check stale/concurrent edits, duplicate submission, missing migrations, partial external-service failures, retry/idempotence and resource cleanup. Reproduce each discrepancy with a focused Docker test. Return severity, exact file:line, expected/actual, a minimal patch confined to unlocked scope, and the regression check. Do not infer a successful connected write from a source assertion.

### Security and Privacy Engineer

> For each active Admin route and method, test anonymous, non-owner and owner boundaries with safe fixtures; check authorization before service-role access. Review direct Supabase RLS/grants, strict input allowlists, URL/MDX/upload validation, token lifetime, response caching, private data exposure, CSRF assumptions and reference-safe deletion. Inspect installed policy/migration order rather than trusting a checked-in SQL file. Return exploit preconditions and evidence without disclosing private data or keys. Stop before a live privilege or destructive probe unless a backed-up disposable environment is approved.

### UI/UX and Accessibility Designer

> Inspect the actual authenticated UI, including populated, zero, error, pending and long-text states at 320, 375, 390, 768, 1024 and 1440px. Check containment of descendants rather than document scroll width alone, logical information hierarchy, control labels, meaningful 44px targets, focus/keyboard/Escape and focus return, screen-reader status/errors, reduced motion, contrast in the Admin dark theme, and intentional differences from the locked public design system. Inspect dropdown options and confirmation dialogs, not only their closed triggers. Capture redacted evidence outside the repo. Report measurable defects; do not redesign locked components based on taste alone.

### QA and Browser Engineer

> Build a route/method/state matrix for each workflow. Check create/read/edit/save/reopen, publish/archive/moderate/delete, invalid and valid input, 401/403/404/409/413/5xx/network failure, partial uploads, retries, cancellation, double clicks, back/refresh/sign-out with dirty forms, pagination/filter/search, and public cache effects. First run safe source/mocked tests, then authenticated read-only browser checks. Only after owner-approved backup and disposable fixtures run connected lifecycle tests, verify their cleanup and re-query the final state. Record which claims are mocked versus observed.

### Data/Operations Engineer

> Verify a restore point in the intended target; restore to a separate project and check schema, Auth, Storage bytes, Cloudinary originals and settings. Compare installed columns, RPC signatures, indexes, policies and grants to each required migration. Validate an ordered, reversible migration plan on the clone. Review production origin, Auth redirects, upload gateway/CORS and file-size limits, scheduled jobs, provider quotas, health/logs, build output, deployment smoke and rollback. Never run a destructive migration or restore over the source for testing.

## Phases and Exit Gates

| Phase | Work and evidence | Exit gate |
| --- | --- | --- |
| 0. Inventory and scope | Confirm branch/worktree; enumerate active Admin pages/APIs/actions; map frozen and retired surfaces. | No unexpected edits; named owner permission for any locked fix. |
| 1. Static and build | Docker TypeScript, targeted ESLint, relevant Node/tsx suites, `git diff --check`, isolated production build. | No new errors; warnings classified; build does not disrupt port 3000. |
| 2. Auth and privacy | Anonymous/non-owner/owner HTTP method matrix; cache/noindex; server-role ordering; direct RLS/grants on a disposable clone. | No unauthorized data/write; missing connected role cases remain blockers. |
| 3. Schema and recovery | Inspect installed schema/RPCs, migration order, backup/clone/restore and rollback evidence. | No migration applied to live data without tested restore and approval. |
| 4. Domain workflows | Dashboard/Analytics, Blog, Projects, Buildlog, Community Wall, Testimonials, FAQs, Experience, Certifications, Media, Resume, Settings and Logs. Check each read/list/form/action plus public effects. | Every mutation has a connected, disposable success/failure/reopen test or is explicitly blocked. |
| 5. Uploads and external systems | Real fixture for Cloudinary, Blog/Project media and signed Resume Storage; gateway size/CORS, orphan cleanup, reference races and interrupted transfer. | No orphaned fixture; limits communicated accurately; uncertain cleanup blocks release. |
| 6. Visual/a11y | Authenticated responsive controls/menus/dialogs, keyboard, contrast, long/empty/error states, hydration and console. | No P0/P1 layout, keyboard, label or runtime failures; owner reviews visuals. |
| 7. Production smoke | Deploy candidate to intended origin; Auth redirect/login/logout, public cache/metadata/OG/sitemap/RSS, provider APIs, monitoring, rollback rehearsal. | Target domain serves expected 200s and rollback is demonstrated. |
| 8. Decision | Findings table with evidence link, owner veto/acceptance and residual risks. | Mark READY only when all gates pass. Otherwise BLOCKED, never “100%” by inference. |

## Module Coverage Matrix

| Module | Read/list | Invalid/error and responsive | Connected disposable write/reopen | Production effect |
| --- | --- | --- | --- | --- |
| Login/shell/sidebar | Anonymous layout and owner route renders passed | Collapsed dirty-form Sign Out now passed; menus responsive | Real credential/non-owner/logout-back matrix pending | Auth redirects and private chrome passed locally; production origin pending |
| Dashboard/Analytics | Owner read-only render passed | 320/768/1440 containment passed; new-tab purpose labelled | Connected metric correctness pending | PageSpeed blocked by deployed-domain 404 |
| Blog and previews | Owner new/edit and MDX read-only passed | Mocked failure, hydration and responsive coverage passed | Save/publish/image lifecycle pending | Public article/RSS/sitemap smoke passed locally, cache effects pending |
| Projects | Owner list/new/edit read-only passed | Mocked form/upload/rollback and responsive coverage passed | Atomic save/delete/gallery connected fixture pending | Cards/detail smoke passed locally; public cache effects pending |
| Buildlog | Owner read-only list/editor passed | Mocked validation/failure and responsive coverage passed | Connected settings/item lifecycle pending | Public Buildlog effects pending |
| Community Wall/Testimonials | Owner list/form checks passed | Moderation and button-only confirmation mocks passed | Connected moderation/visibility pending | Public collection effects pending |
| FAQs/Experience/Certifications | Owner list/new/edit sampled | Mocked errors, legacy-logo and responsive checks passed | Connected CRUD/order/visibility pending | Public Home/About/Credentials effects pending |
| Media/Resume | Owner Media/Resume read-only passed | Media reference mocks, signed-PDF preflight and mocked failure passed | Real Cloudinary/Storage fixture lifecycle pending | Actual public asset/download and cleanup pending |
| Settings/Logs | Owner reads and responsive checks passed | Invalid Settings and mocked Logs action checks passed | Singleton save/reopen and bulk-log fixture pending | Metadata/log accuracy pending |

## Known Release Gates at Start

These are previously documented gaps, **not** automatically current connected findings. Recheck before closing them.

1. Backup/restore and the exact installed migration/RPC/policy catalog are not verified end to end. `07-owner-actions.md` and `08-backup-restore.md` require a clone, grant checks and approved disposable fixtures. Do not replay `2026_buildlog_zzzzz_item_validation.sql` without privately reviewing its data-matched DELETE/UPDATE.
2. Blog/Project/Media/Resume and Settings lifecycle tests have relied heavily on mocks or limited historical fixtures. Postgres, Cloudinary and private Storage operations are not atomic. A forced tab close can leave a pending upload; no generic cleanup guarantee exists.
3. The image upload route advertises 20 MB but the owner reported a non-JSON HTTP 413. Safe invalid-file probes reached the local Docker route and Alloy proxy at up to 20 MB; the failing deployed origin/file size is unknown. Resolve real gateway/CORS limits before signing off uploads.
4. The intended production origin was previously reported HTTP 404. Recheck it, canonical metadata, Supabase Auth redirects, public cache propagation, credential rotation and rollback before release.
5. `AUDIT_TESTING.md` Phase 12 requires a one-target findings report and owner review before any **new lock**. This broader release assessment does not supersede that process.

## Evidence Log

| Phase | Date | Test/environment | Result | Limitation / next gate |
| --- | --- | --- | --- | --- |
| 0 | 2026-10-07 | Scoped branch/worktree inventory and running Docker Compose web service | Passed scope baseline | Audit fixes remain uncommitted; locked modules remain read-only until named permission. |
| 1 | 2026-10-07 | Docker `npx tsc --noEmit`; `npx eslint app/admin app/api/admin app/components/admin app/lib/admin-auth.ts` | Both passed without output | Static checks do not prove connected behavior. |
| 1 | 2026-10-07 | Initial selected Docker Node Admin/security/workflow source suite | 62 pass, 2 fail | Outdated `admin-wide-quality.contract.test.mjs` assertions; corrected and rerun below. |
| 1 | 2026-10-07 | Docker Node 14-file Admin/security suite, tsx component suite, anonymous Playwright | 67/67 Node, 13/13 components, 2/2 browser after corrections | Image fill warnings occur only in Happy DOM, not measured browser geometry. |
| 1 | 2026-10-07 | Isolated `npm ci` from the updated lockfile, `NEXT_DIST_DIR=.next-build npm run build` in a separate Docker Compose container | Compiled; 128 static pages; pre-existing `<img>` lint and Edge notices | Connected project content changed during review; count is not an application-code regression. Running dev stack was not replaced. |
| 1 | 2026-10-07 | `npm audit --omit=dev --audit-level=high`, then fresh lockfile install + affected Blog editor and Admin/public regression | No high advisories; 4 moderate remain; 5/5 Blog editor, 4/4 Blog image manager, 42 passed/one existing Project skip on selected refreshed-lockfile Node suite | No forced `gray-matter` downgrade; actual production dependency installation occurs on deployment. |
| 2 | 2026-10-07 | Fresh authenticated browser, button-only dialog and collapsed dirty-form Sign Out | Guard now prevents logout; form remains, cancel preserves edits; 0 connected writes; review session locally revoked | Dev-only Next tools bubble overlapped collapsed Sign Out in headless test; test hides only `nextjs-portal` before a natural click. |
| 3 | 2026-10-07 | Service-role REST `limit=0` shape probes for `media.original_filename`, `blog_post_media`, `system_logs.resolved`, `site_settings.updated_at`, `projects` | HTTP 200 for selected columns; no row data read/logged | No direct SQL URI or management token in sandbox; policy/grant/RPC catalog and recovery point still unknown. |
| 4/6 | 2026-10-07 | Authenticated 21-route Admin Playwright sweep at 320/768/1440 plus narrow dropdown checks | 21 routes/3 widths and menus passed; 0 page errors, 0 connected writes | Sweep excludes several edit routes and some scroll-region/checkbox controls; focused area tests supplement, not complete WCAG/visual acceptance. |
| 4/6 | 2026-10-07 | Sequential area browser reviews: Blog, Project, Buildlog, Community Wall, Testimonials, FAQ, Experience, Certifications, Media, Logs, Settings/Testimonials, Resume | Initial 7 pass/3 stale-test failures/1 skipped gate; corrections plus the correctly gated FAQ rerun passed. Resume invalid upload probes returned JSON 400/415; all actions were mocked/invalid; Auth sessions locally revoked. | No valid connected create/publish/delete/restore. Logs state changed during review, so action availability is data-dependent. |
| 4 | 2026-10-07 | Local public Blog, Project, Home/About and navigation smoke | 26 pass, one existing Project preview skip | Local public routes are not deployed cache propagation. |
| 7 | 2026-10-07 | HTTPS GET status only for intended `https://harisx404.vercel.app/` | HTTP **404**, no redirect | Deployment, SEO/canonicals, production Auth/CORS and live PageSpeed cannot be signed off. |
| 8 | 2026-10-07 | Evidence review | **BLOCKED / NOT PRODUCTION-READY** | Domain 404; missing connected backup/restore, policy/RPC proof and valid disposable lifecycle; real 413 unresolved; owner visual/security acceptance pending. |

## Findings and Disposition

| ID / priority | Observed finding and evidence | Status / next gate |
| --- | --- | --- |
| F1 / High | Collapsed-sidebar Sign Out has an `aria-label` but no visible text (`app/components/admin/Sidebar.tsx:175-183`); dirty navigation guard tested only button text. The guard could miss logout while unsaved edits or staged uploads exist. | **Fixed** in `useAdminNavigationGuard.ts`: accept its accessible label too. Authenticated dirty-Settings browser click/cancel passed, 0 live writes. |
| F2 / Test debt | Two baseline contract assertions in `tests/admin-wide-quality.contract.test.mjs` contradicted shipped Settings/dirty-guard behavior. | **Fixed** assertions to preserve legacy Settings API field but not show its editor and require expanded dirty state. 2/2 contract tests passed. |
| F3 / High release gate | Installed RPC signatures, effective RLS/grants, complete Cloudinary/Storage cleanup, singleton save/reopen, concurrency, and backup/restore have no current connected end-to-end proof. Older docs are historical, not a live schema audit. | Blocked on owner-approved disposable clone/restore evidence. No direct production mutation. |
| F4 / High release gate | Image upload advertises 20 MB, but owner reported a non-JSON HTTP 413; local invalid-file probes up to 20 MB reached the route through app and Alloy ports. Deployed gateway/file-size evidence is missing. | Do not promise large-file production uploads until deployed origin and exact failing request are checked. |
| F5 / High if migrated out of order | `migrations/2026_faqs.sql` contains broad `authenticated` FAQ/Settings write policies; later Admin RLS hardening drops them. Replaying the earlier migration afterward would reopen direct non-owner database writes. | Inspect effective connected policies and ordered rollout on a backed-up clone; do not apply either migration blindly. |
| F6 / High | New/Edit Blog and Project pages created a service-role client before their own owner check; Blog Edit also mapped query errors and missing posts to 404, and New Blog threw on an options-read error. | **Fixed** local verified guard and retryable reads. `admin-editor-read-boundaries.test.mjs` covers anonymous and simulated non-owner denial before service access on all four pages, four failed reads as alerts and genuine Blog 404; 3/3. Post-build owner Blog/Project browser reviews passed. A connected non-owner route matrix remains pending. |
| F7 / Low accessibility | Dashboard "View Live Site" and Analytics article links opened a new tab without telling screen-reader users. | **Fixed** with `sr-only` new-tab text on the two Admin surfaces. Source assertions and post-build Admin route sweep passed; no locked public presentation changed. |
| F8 / Test debt | Three component tests still expected the retired typed DELETE input. | **Fixed** button-only confirmation assertions; no-input/cancel/mock-failure suite 13/13 passed. |
| F9 / Test debt | Certifications and Experience browser reviews expected typed DELETE; Logs review sampled geometry before viewport settled, FAQ gate flag was mistyped. | **Fixed** test expectations, added viewport settle, used correct FAQ gate. All four reruns passed, zero live writes. |
| F10 / Dependency advisory | `source-map-js@1.2.1` through PostCSS was high; `markdown-it@14.3.0` through editor/ProseMirror moderate; `sprintf-js` chain through gray-matter/js-yaml/argparse moderate. | **Partially fixed:** lockfile now resolves `source-map-js@1.2.2` and `markdown-it@14.3.2`, verified by fresh isolated npm install/build/tests and lockfile audit. No highs remain. Four moderate remain in `sprintf-js` chain; forced downgrade of gray-matter was deliberately not applied. |
| F11 / Test fixture | Blog editor picker mock returned 200 `text/plain`, correctly rejected by `readAdminResponse`, then clicked a missing option. | **Fixed** mock to use `Response.json` and wait for async option. All 5 editor cases pass with old and refreshed dependency sets. |

## Release Decision and Owner Gates

**Verdict: BLOCKED, not production-ready.** Local browser, mock, source, and build evidence is positive, but the release phases are not complete. Phase 7 cannot pass while the intended origin returns 404. Phases 2–5 need an owner-reviewed backup or disposable clone with a restore drill, exact connected RLS/grant/RPC catalog, scoped disposable owner/non-owner CRUD and external asset tests, verified cleanup, and an observed failing production upload size/origin before claiming the 413 is fixed. `07-owner-actions.md` and `08-backup-restore.md` describe the private prerequisite steps; do not paste credentials or dataset exports into chat. The owner must separately accept visual/content changes and any locked-scope fixes before a release sign-off.
