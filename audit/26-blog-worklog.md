# Blog System Worklog

Source of truth: `audit/25-blog-system.md`. Update after each meaningful phase.
Date: 2026-09-29. Branch: `haris-dev/set-up-this-codebase-for-FcY5YL`.

## Phase 0: Inspect and audit

- **Completed:** inspected public Blog index/detail, rendering and TOC,
  metadata, sitemap/RSS, existing Admin Blog list/form/API/editor/media,
  schema/migrations/auth boundaries, prior audit/locks and representative
  site/admin visual language. Two independent research-only audits completed.
- **In progress:** none; Phase 0 is complete.
- **Remaining:** phases 1-5 in the specification. Phase 0 changed only docs.
- **Issues found:** inert Admin delete; lossy MDX edit path; mobile Blog index
  blank without hydration; TOC heading IDs diverge; pointer-only image zoom;
  unverified tag-join grants/RLS; content-rights/author metadata conflict;
  list/query errors and scheduled status are not represented reliably.
- **Issues fixed:** none in Phase 0. Findings are recorded before code fixes.
- **Decisions:** reuse Supabase Auth/RPC and existing public/Admin visual
  languages; no unrelated shared component changes. Treat live SQL, Admin
  credentials and imported content rights as unverified until demonstrated.
  Do not overwrite imported MDX or claim a named author without provenance.
- **Files changed:** `audit/25-blog-system.md`, `audit/26-blog-worklog.md`.
- **Baseline verification:** Blog 3/3, Docker-backed TypeScript and targeted
  ESLint passed. A published article reproduced nine formatted headings with
  the same `#object-object` anchor before the Phase 1 fix.

## Next exact step

1. Apply `migrations/2026_blog_tag_join_rls.sql` and
   `migrations/2026_blog_admin_tag_collisions.sql` only through an approved
   database rollout (the latter after the original Blog save RPC), then verify
   catalog policies/grants and role-specific reads using safe fixtures.
2. Verify authenticated Admin create/edit/source round-trip, saved preview,
   archive/restore, conflicts, scheduling and cache invalidation with an
   authorized test record; public HTTP/source tests do not establish these.
3. Finish remaining content/SEO gates: owner-provided alt text/credits for
   imported images, verified author/canonical data, rich-editing of legacy
   MDX only if it can round-trip losslessly, unsaved preview if needed, and
   browser verification of Admin save/reopen, dates and content edge cases.
4. Resolve imported content provenance/rights and archive retention with the
   owner before authorship schema/metadata, permanent deletion, production
   sign-off or a final lock. Run full theme/viewport/content/SEO QA after.

## Phase 1: Protect existing behavior

- **Status:** in progress. Public TOC defect fixed: extraction and rendering
  share the MDX AST. Formatted headings now have matching, unique IDs,
  including within the published Angular article; fenced code headings do
  not enter the TOC. `app/lib/toc-utils.ts`, `app/components/mdx.tsx`,
  `app/components/mdx-components.tsx`, `tests/blog.integration.test.mjs`.
- **Verification:** Blog integration 4/4, navigation 4/4, preview 3/3,
  TypeScript, targeted ESLint, `git diff --check`. Browser measured 9/9
  unique heading IDs and 0 mismatched self-links at 800px. No shared style
  or unrelated route changed.
- **Known test gap:** a standalone TypeScript AST unit test could not run
  through the repo's current `tsx` ESM/CJS loader; it was removed rather than
  left failing. The HTTP regression tests a real published formatted article,
  but synthetic duplicate/fenced fixtures still need a runnable test harness.
- **In progress:** live policy verification and broader public/Admin tests.
- **Live read-only policy probe:** both service-role and anonymous REST reads
  succeeded (HTTP 200), but neither returned a draft nor a future-published
  sample. Draft-tag visibility could not be tested without a tagged draft;
  no rows were modified. SQL catalog grants/RLS and scheduled-post embargo
  remain **unverified**, not passed.
- **Remaining:** accessibility, metadata, media and full Admin CRUD;
  phases 2-5 are not complete. No authenticated Admin mutation was performed.

## Phase 2: Public reliability

- **Status:** in progress. The Blog index no longer hides its server-rendered
  cards or empty states below `lg` while waiting for `?view=compact`; card
  styling, pagination and client compact-URL behavior are retained.
- **Verification:** Blog HTTP 4/4; separate Docker Playwright browser test
  1/1 blocked client bundles and measured visible cards/empty states at
  375/1440px. Chromium was installed only into the running container cache;
  no browser binary was checked in. Browser at 375px confirmed visible cards,
  then client transition to compact and 0 horizontal overflow.
- **Caveat:** Next's streaming response uses inline JavaScript to reveal its
  delayed payload; fully disabling all JS still depends on the framework's
  streaming behavior. The browser test blocks hydration bundles, not inline
  stream reveal. Next: keyboard image lightbox and SEO/media corrections.
- **Files changed:** `app/blog/page.tsx`, `tests/blog.browser.test.mjs`,
  `package.json`; HTTP suite remains in `tests/blog.integration.test.mjs`.
- **Further completed:** Blog-only image zoom now lets keyboard users focus
  unlinked images, open with Enter/Space, close with Escape/backdrop/button,
  trap Tab, and return focus/scroll state. Two Docker Chromium tests passed,
  including reduced motion; no shared image styles were changed. Article
  metadata labels its actual publication date, uses an absolute JSON-LD cover,
  escapes `<` inside JSON-LD, removes unsupported blanket author claims, and
  rejects invalid/credential-bearing canonical URLs. The Blog RSS description
  no longer assigns all imported writing to Muhammad Haris. Metadata tests
  passed. Files: `ImageLightbox.tsx`, its scoped CSS module, `app/blog/[slug]/page.tsx`,
  `app/rss.xml/route.ts`, `tests/blog-lightbox.browser.test.mjs`,
  `tests/blog-article-metadata.test.mjs`.
- **New image/table and social output (2026-09-29):** published article bodies
  use a Blog-local image component that preserves supplied alt text, displays
  optional Markdown titles as captions, links safely to unsupported HTTPS
  hosts, and omits unsafe sources. GFM Markdown tables now render actual table
  cells; social metadata uses a validated absolute cover when present and the
  existing branded card otherwise. Missing imported image descriptions remain
  editorial work, not synthesized alt text. Files: `BlogArticleImage.tsx`,
  article page, `app/components/mdx.tsx`, `tests/blog-article-image.test.tsx`,
  `tests/blog-mdx-gfm.test.mjs`, and metadata tests.
- **Runtime MDX boundary (2026-09-29):** Blog-only AST validation rejects
  arbitrary ESM/expressions, JSX spreads/handlers and unsafe URLs before
  Admin persistence and before public/preview evaluation. Rejected content
  displays a safe unavailable message instead of raw source. Read-only anon
  REST preflight found 63/63 currently published posts accepted (0 rejected);
  focused policy tests covered malicious cases and safe relative links.
  The preflight does not establish rights/alt-text quality, nor does it cover
  draft content not accessible anonymously. Files: `app/lib/blog-mdx-policy.mjs`,
  `app/components/mdx.tsx`, Blog API, `tests/blog-mdx-policy.test.mjs`.

## Phase 3: Admin safety

- **Status:** in progress. Added a verified-Admin-only Blog archive/restore
  action. Archive retains the row but removes it from public publication;
  restore returns a draft rather than republishing. ID/action/timestamp and
  status transitions are validated; optimistic conflict and revalidation are
  handled. The action resynchronizes when refreshed post props change. The
  Admin list now reports query errors. Existing posts edit their
  original Markdown/MDX as source, not through a lossy Tiptap round-trip; new
  posts retain the rich editor.
- **Verification:** unauthenticated PATCH 401; source/auth contract tests
  3/3, Blog HTTP 4/4, TypeScript, targeted ESLint and diff checks passed.
- **Unverified:** authenticated archive/restore, save/reopen fidelity against
  deployed DB, SQL RLS grants, publication schedule and image upload. Archive
  is not a permanent deletion; imported author and retention decisions remain
  owner gates. Admin search/filter/sort and private preview remain pending.
- **Files changed:** `app/admin/(dashboard)/blogs/page.tsx`, `[id]/page.tsx`,
  `BlogArchiveAction.tsx`, `app/api/admin/blogs/route.ts`,
  `app/components/admin/BlogForm.tsx`, `tests/blog-admin.archive.test.mjs`.
- **Further completed:** bounded 20-post Admin list with URL-backed title
  search, status filter (Draft/Scheduled/Live/Archived), whitelisted sorting,
  pagination and empty/error states. Existing saved posts use source editing;
  the API preserves content bytes while still rejecting blank content. Cover
  URL edits clear a selected media ID and saves validate that an ID/URL pair
  matches. Unknown save errors no longer expose raw database messages.
  Files: `blogList.ts`, `tests/blog-admin.list.test.mjs`, BlogForm and Blog API.
- **Security migration prepared, NOT applied to live DB:**
  `migrations/2026_blog_tag_join_rls.sql` enables Blog tag-join RLS, gates
  public reads to live posts and revokes direct public writes. Fresh schema
  `supabase_schema.sql` now includes the same protections and excludes future
  posts from Blog reads. `tests/blog-tag-security.test.mjs` verifies the
  checked-in contract only. Deployed policies remain unverified.
- **Tag-collision follow-up (2026-09-29):** additive Blog save-RPC migration
  `migrations/2026_blog_admin_tag_collisions.sql` reuses tags by exact name
  and assigns distinct slugs on normalized collisions, rather than renaming
  project tags. A disposable PostgreSQL test passed and rolled back; it has
  not been applied to the connected database. Blog API deduplicates tag names
  without dropping different names sharing a normalized slug. Files:
  migration, Blog API, `tests/blog-tag-collisions.*`.

## Phase 4: Editorial workflow

- **Status:** in progress. Saved-post preview under
  `/admin/blogs/[id]/preview` checks the Admin identity before the service
  role read, renders saved MDX, uses no-store/noindex, and excludes archived
  posts. The edit form links to this preview and clarifies that unsaved
  changes must be saved first. New posts still use the existing rich editor;
  imported posts remain source-only until a lossless rich editor is available.
- **Verification:** unauthenticated preview redirects; preview source tests
  passed. No authenticated browser save/preview was exercised. Files:
  `app/admin/(dashboard)/blogs/[id]/preview/page.tsx`, BlogForm,
  `tests/blog-admin.preview.test.mjs`.
- **New-post authoring (2026-09-29):** title supplies an editable slug until
  manually changed; blank summary on create defaults from article prose only,
  while existing-post summary remains untouched. Blog-only rich-editor controls
  now support H3, rule, validated links, media-library images with required
  author alt and optional caption, and simple editable GFM tables. The editor
  is lazy-loaded for new posts; existing posts stay in lossless source mode.
  BlogForm labels/tag actions were made explicit. Tests cover Markdown
  save/reload and show Project/Changelog controls remain unchanged.
  `@tiptap/*` was upgraded together to patched 3.31.3; shared-editor Project
  regressions passed 10 with one pre-existing skip. Files: BlogForm, scoped
  `blogTools` in shared TiptapEditor, `app/lib/blog-defaults.ts`, Blog API,
  package/lock, tests/blog-editor.test.tsx and tests/blog-defaults.test.mjs.

## Latest verification

- Blog HTTP 4/4; pre-hydration Blog browser 1/1; image lightbox browser 2/2;
  Admin/metadata/security scoped tests passed; new editor 5/5, image 4/4,
  GFM 1/1 and MDX policy 22/22; navigation 4/4, preview 3/3;
  Docker TypeScript, targeted ESLint and `git diff --check` passed.
- Locked-surface regression checks: Home/About 3/3, legal 5/5, projects
  10 passed / 1 skipped (preview-only data fixture), with no changes to
  those page implementations.
- No Admin write, tag-join migration or imported-article content was applied
  to the connected database. Docker web stack remains running. Tests do not
  prove production deletion, scheduling or copyright clearance. The initial
  full-site dependency audit reported high findings outside the scoped Tiptap
  patch (including Next/PostCSS and image processing); no broad dependency
  upgrade was performed because it would alter unrelated locked surfaces.

## Phase 5: Final QA and owner sign-off

- **Status:** pending. Rights, production database and authenticated Admin
  acceptance are separate from a visually rendered Blog page.

## Continuation: Article media, editor and MDX safety (2026-09-29)

- **Completed:** A Blog-only MDX image renderer preserves authored alt text,
  renders optional captions, links unsupported HTTPS hosts safely and omits
  unsafe sources. The public Markdown parser now supports GFM tables. Blog
  OG/X metadata uses a validated cover with the branded card as fallback.
- **Completed:** New Blog titles generate editable slugs until manually
  changed; a blank create-only summary uses article prose. The Blog-only
  editor mode supports H3, rules, validated links, media-library images with
  required alt/optional captions, and editable 2x2 GFM tables. Existing posts
  remain in source mode. BlogForm labels and tag actions are accessible;
  the rich editor is lazy-loaded on new-post forms.
- **Completed:** The Blog MDX AST policy blocks arbitrary ESM, expressions,
  spread/event attributes and unsafe URLs before API writes and public/preview
  evaluation. It allows the observed static article constructs. Rejected
  content shows a safe unavailable message instead of raw source. Read-only
  anon REST preflight: **63 published rows, 63 accepted, 0 rejected**. The
  syndicated-route suite also asserts that every listed post actually renders
  content, not the safe error state.
- **Completed:** `@tiptap/core`, React, StarterKit, PM, image and table packages
  upgraded together to 3.31.3 to remove the editor-core high-severity audit
  finding. Blog editor round-trip and Project editor regressions passed after
  the upgrade; the Project test's brittle MenuBar-signature assertion was
  adjusted, with Project presentation unchanged. No broad `npm audit fix` was
  used. Other dependency findings remain outside this scoped change.
- **Completed:** Blog MDX code-copy buttons now announce `Copy code` or
  `Code copied` and have visible keyboard focus. A published code-heavy
  article passes the accessible-name regression. Files:
  `app/components/mdx-components.tsx`, `tests/blog-code-accessibility.test.mjs`.
- **Verified:** Blog HTTP 4/4, editor 5/5, Blog image 4/4, GFM 1/1, MDX
  policy 22/22, Docker TypeScript/targeted ESLint and diff checks passed.
  Project 10 passed / 1 pre-existing skip; Home/About 3/3. Browser on the
  Alloy preview measured 320px dark and 1440px light article: document width
  equals viewport, 0 overflowing article text nodes, 0 failed article images,
  and no app console errors. Database read-only canonical scan: 63 published,
  0 canonical overrides. No Admin session or live write was used.
- **Post-upgrade checks:** Blog pre-hydration browser 1/1, lightbox browser
  2/2, legal 5/5, navigation 4/4 and preview 3/3 passed. Production-only
  dependency audit still reports 12 advisories (5 high) outside patched
  Tiptap. New code-copy check 1/1, TypeScript and targeted lint passed.
- **Files changed:** `app/blog/[slug]/page.tsx`, `app/components/blog/BlogArticleImage.tsx`,
  `app/components/mdx.tsx`, `app/lib/blog-defaults.ts`,
  `app/lib/blog-mdx-policy.mjs`, `app/components/admin/BlogForm.tsx`,
  `app/components/admin/TiptapEditor.tsx`, `app/components/mdx-components.tsx`,
  `app/api/admin/blogs/route.ts`,
  `package.json`, `package-lock.json`, Blog-focused tests and the Project
  source-contract test.
- **Remaining:** apply/check both Blog migrations with approved database
  access; exercise authenticated save/reopen, schedule, archive/restore and
  preview on an approved test record; obtain owner attribution/rights and
  archive-retention decisions; provide meaningful alt/credits for legacy
  content; expand full
  multi-viewport/theme and content-edge QA. Production `npm audit --omit=dev`
  still reports 12 findings (5 high) in other packages, including Next's
  bundled PostCSS and image handling; changing those broadly would touch
  unrelated locked surfaces. Do not claim a final production lock yet.

## Continuation: Canonical discovery and Admin feedback (2026-09-29)

- **Completed:** Blog index data now carries each post's canonical override.
  Blog sitemap and RSS entries use the same Blog-only canonical check: posts
  with an external or different canonical are omitted from both feeds, while
  posts without an override remain. Current read-only REST scan found no
  published overrides, so the existing public collection is unchanged.
  Files: `app/lib/blog-canonical.ts`, `app/blog/data.ts`, `app/sitemap.ts`,
  `app/rss.xml/route.ts`, `tests/blog-canonical.test.mjs`.
- **Completed:** On a successful create/edit, the Blog form redirects to a
  status message on the Admin Blog list rather than silently navigating.
  URL-backed filters and clearing the list do not retain that message. Files:
  `app/components/admin/BlogForm.tsx`, `app/admin/(dashboard)/blogs/page.tsx`,
  `tests/blog-admin.list.test.mjs`.
- **Verification:** Blog HTTP 4/4 including all syndicated article routes,
  canonical helper 1/1, code-copy 1/1, navigation 4/4, TypeScript,
  targeted ESLint and diff check passed. 320px dark and 1440px light article
  browser measurements have no page overflow or failed article images.
- **Still blocked:** authenticated Admin save/preview/archive tests and live
  database migration rollout need an approved test account/data strategy;
  editorial rights, author attribution and archived-post retention need owner
  decisions. These are not inferred from route rendering or source tests.
