# Security And Data Contract

**Status:** source changes, scoped owner-session fixture checks and remaining risks; neither historical anonymous 200s nor later 401s establishes past data exposure. The legacy Changelog Admin UI/API has since been retired; historical Changelog GET evidence below predates removal. Do not record passwords, session material, settings/log values, service keys or private response bodies.

## Authorization boundaries

- `middleware.ts` guards `/admin*` pages except login, requiring verified Supabase user and normalized `ADMIN_EMAIL`; `(dashboard)/layout.tsx` repeats that check. API routes are separate and must authorize each read/write method server-side. Client navigation and a protected page do not secure `/api/admin/*`.
- **Current source:** `app/lib/admin-auth.ts` calls `getUser()`, normalizes `ADMIN_EMAIL`, and returns 401 anonymous, 403 non-owner or 503 when Admin is unconfigured. Settings GET/PUT, About GET/PUT, FAQ and Media reads/writes use it. FAQ list/edit and API service-role reads follow verified Admin, as do Settings/About. Retired Changelog API and editor have no reachable write path; this is not a blanket claim about every Admin method or RLS policy.
- **Observed anonymous GET:** Settings/About/FAQs/Media return 401; retired Changelog API now returns 404 for tested verbs. Earlier Experience 200 and historical Changelog 200/401 observations are not a current all-method audit. Inventory nested routes/server actions and test non-owner access before release.
- **Historical owner-session GET:** before retirement, `/api/admin/changelogs` returned a `data` array; it is no longer a route. Settings/About/FAQs/Media GET shapes were also observed, and subsequent scoped fixture tests are in `06-validation-log.md`. These do not verify all roles or effective RLS policies.
- Service-role clients bypass RLS: never expose their key to browser; verify Admin before service-role reads or writes. Dashboard and Projects list follow this order in source and distinguish query errors from zero/empty; dashboard rendering does not verify count accuracy or draft visibility. Non-owner password sign-in calls `signOut()` in source; non-owner runtime flow remains unverified. Preserve named locks on Testimonials, Experience (entry 19), Certifications, Buildlog, Community Wall and the qualified Resume Admin document scope; no blanket unlock is implied.

## Connected settings contract

- **Confirmed read-only observation:** `site_settings` responded 200 with one row and columns `id`, `site_name`, `seo_description`, `seo_keywords`, `github_url`, `twitter_url`, `linkedin_url`, `email_address`, `created_at`, `updated_at`, `show_faq_section`. No row values recorded.
- **Source plus owner GET shape:** `/api/admin/settings` replaces the former key/value query with a limited named-column singleton read (requires exactly one row), allowlisted strict optional Zod PUT fields (HTTPS URLs, email, lengths), and `id`-targeted update after verified Admin. Owner GET returned HTTP 200 with exactly the seven named fields `site_name`, `seo_description`, `seo_keywords`, `github_url`, `twitter_url`, `linkedin_url`, `email_address`; no values recorded. GET and successful PUT carry `Cache-Control: private, no-store` in source; malformed input returns 400, missing/ambiguous singleton 503, and no matched update 409. No connected PUT/save-reopen was exercised; confirm non-owner denial, persistence and public cache effects in an approved isolated fixture.

## Connected tables and staged migrations

- Read-only REST `select=id&limit=0` returned 200 for `about_content`, `about_sections`, `changelogs`, `changelog_entries` and `faqs`. A further read-only `about_content` column check showed `id`, `hero_title`, `hero_subtitle`, sections 1-4 `title`/`content`/`image_url`, `created_at`, `updated_at` (no values recorded). This confirms availability/shape for those requests only, not contents, policies or authenticated CRUD. Do **not** describe About or Changelog tables as missing.
- **Content boundary:** the Admin About route warns that legacy `about_content` does not feed locked public About. Changelog tables still exist, but `fetchAndSortChangelogEntrees` is only used in unused public `ChangelogBento`. Owner chose to retire the separate Changelog Admin feature; its historical rows are preserved until backup/export and separate schema approval. Old Admin bookmarks redirect to Admin Buildlog, public `/changelog` continues redirecting to `/buildlog`.
- **FAQ validation source:** POST accepts a strict full `question`/`answer`/integer `display_order`/boolean `is_visible` payload; PUT accepts a strict nonempty partial update plus UUID `id`; PATCH strictly validates boolean `show_faq_section`; DELETE checks UUID. These are input boundaries, not proof of connected policies or successful CRUD. FAQ form labels and error associations and section-switch accessible label are present in source.
- **Media contract:** connected schema includes `bytes`, `alt_text`, `secure_url`. Disposable upload, dependency-blocked delete and verified DB/Cloudinary cleanup passed via Admin; deletion checks known Blog/Project references but is not atomic with Cloudinary and cannot detect every hard-coded URL. Upload accepts supported non-SVG images without a new size cap. See validation log; no existing asset was touched.
- **Logs column queryable; provenance unknown:** an earlier `system_logs.resolved` probe returned 42703; a later one returned 200. Owner confirmed the named `(resolved, created_at DESC)` index. One disposable log was resolved through Admin and removed, without bulk clear. We applied no migration; column provenance and effective RLS remain unknown.
- `migrations/2026_admin_content_rls_hardening.sql` stages dropping broad FAQ-manage and site-settings-update authenticated policies; **not applied by us; connected policy catalog unknown**. Before rollout inspect `pg_policies`, agree on rollback, then verify intended public SELECT and regular-user denial. Staged SQL and tests are not proof of effective connected RLS hardening.

## Presentation and metadata boundary

- Admin-only scoped styles hide inherited Navbar/Footer/chat and clear Admin canonical while keeping `noindex, nofollow`; locked `app/layout.tsx` remains unchanged and still mounts public components/WebSite JSON-LD on Admin. True render-time isolation requires separate owner permission for the shared root.
- Dashboard and owner-authorized Admin Buildlog containment fixes passed sampled widths. Root clipping alone is not a pass; other named locked Admin scopes remain frozen.

## Risk register and gates

| Risk | Required gate before implementation/acceptance |
| --- | --- |
| Historical GET 200 / current 401 | Confirm intended visibility per method and public consumers; audit response shapes/RLS without recording values, including unchanged Experience behavior |
| Service-role or other mutation paths | Prove non-owner user rejected for every method/action; never rely on middleware; inventory unreviewed routes |
| Settings and Logs schema/provenance | Verify singleton save in isolated DB; `resolved` now queries successfully, so inspect connected schema/index provenance and policies before deciding whether any Logs migration step is necessary |
| Broad FAQ/site-settings RLS policies | Inspect connected policy catalog before applying staged hardening; verify public read and non-owner write behavior afterward |
| Legacy About / retired Changelog editor | Do not promise public updates from About; Changelog UI/API removed at owner direction, but DB data needs backup before any separate drop |
| Media schema and upload assumptions | Keep observed `bytes`/`alt_text`/`secure_url` mapping; do not invent a server size cap. Tracked Media upload/delete fixture passed, but Cloudinary and DB are not one transaction |
| Accidental publishing, cache staleness or destructive cleanup | Test draft/published boundaries, dependent assets, atomicity/revalidation and rollback on disposable records only |
| Public/locked-scope regression | Explicit owner unlock for named locked Admin files; no global/shared edits or indirect public presentation changes without authorization |
| Root chrome/metadata and masked Admin overflow | Owner decides true root isolation separately; inspect element bounds as well as document scroll; owner-approved Buildlog Admin mobile correction was scoped, not a blanket unlock |
| Leaking secrets through logs, errors or fixtures | Redacted errors, least-privilege keys, no actual values in evidence, no credentials in recordings |

**Owner/manual gates:** scoped disposable fixtures were authorized, tested and cleaned. Settings/About singleton save-reopen, non-owner role matrix, connected policy catalog and any SQL rollout/rollback remain open. Named permission is still required for Experience, Testimonials, Certifications, Community Wall, qualified Resume and any further locked Buildlog work. Root render-time isolation requires separate approval. Production readiness remains unverified.
