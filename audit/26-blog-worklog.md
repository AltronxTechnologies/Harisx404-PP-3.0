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

1. Continue Phase 1: inspect live `blog_post_tags` grants/RLS and published-
   date policy **read-only**; add role-specific tests before any migration.
   Add a fixture-backed duplicate-heading and fenced-code regression test
   with a runner that imports the ESM MDX processor correctly.
2. Begin Phase 2: reproduce mobile `/blog` with JavaScript disabled and fix
   its hydration-only article list without changing approved Blog card styles.
   Then address keyboard image zoom and broken media/SEO outputs in separate
   measured patches.
3. Begin Phase 3: remove the misleading inert Admin delete control until a
   confirmed operation exists; prevent no-op edits from rewriting imported
   MDX and test authorized save/reopen. Do not mutate live content to test.
4. Before changing Admin author/deletion semantics, get an owner editorial
   rights/retention decision. Authenticated Admin save/reopen cannot be
   claimed tested without credentials and an authorized test record.

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
- **Remaining:** public no-JS, accessibility, metadata, media and Admin CRUD;
  phases 2-5 are not complete. No authenticated Admin mutation was performed.

## Phase 2: Public reliability

- **Status:** pending.

## Phase 3: Admin safety

- **Status:** pending.

## Phase 4: Editorial workflow

- **Status:** pending.

## Phase 5: Final QA and owner sign-off

- **Status:** pending. Rights, production database and authenticated Admin
  acceptance are separate from a visually rendered Blog page.
