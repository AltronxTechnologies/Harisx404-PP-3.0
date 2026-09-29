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

1. Apply `migrations/2026_blog_tag_join_rls.sql` only through the approved
   database rollout, then verify catalog policies/grants and anon/authenticated
   reads against safe draft, scheduled and live fixtures; no live write probe.
2. Verify authenticated Admin create/edit/source round-trip, saved preview,
   archive/restore, conflicts, scheduling and cache invalidation with an
   authorized test record; public HTTP/source tests do not establish these.
3. Fill remaining Blog content tooling: practical links/images/captions/tables
   in the new-post editor, cover alt text, slug defaults, richer feedback and
   unsaved preview if needed; test Markdown/MDX and browser states.
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

## Latest verification

- Blog HTTP 4/4; pre-hydration Blog browser 1/1; image lightbox browser 2/2;
  Admin/metadata/security scoped tests 15/15; navigation 4/4, preview 3/3;
  Docker TypeScript, targeted ESLint and `git diff --check` passed.
- Locked-surface regression checks: Home/About 3/3, legal 5/5, projects
  10 passed / 1 skipped (preview-only data fixture), with no changes to
  those page implementations.
- No Admin write, tag-join migration or imported-article content was applied
  to the connected database. Docker web stack remains running. Tests do not
  prove production deletion, scheduling, copyright clearance or a complete
  rich editor.

## Phase 5: Final QA and owner sign-off

- **Status:** pending. Rights, production database and authenticated Admin
  acceptance are separate from a visually rendered Blog page.
