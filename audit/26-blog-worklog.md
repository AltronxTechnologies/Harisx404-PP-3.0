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

Article-detail design verification completed below. The remaining public
deployment gate is still the owner's replacement of temporary imported
articles/images with approved content, followed by real-host content and
browser QA; do not delete or reattribute the current development corpus.

1. **Connected workflow acceptance completed for disposable records:** owner
   reports applying the new SQL/checker; live REST, service-role RPC and
   authenticated Admin browser QA passed, with zero QA posts/history/views
   remaining. Do not rerun the migration or delete current articles.
2. Before deploying, replace the temporary imported articles and images with
   owner-authored/licensed posts and descriptions. Remove old DB rows and
   checked-in `content/blog` fixtures deliberately, then recheck the index,
   article routes, sitemap/RSS, metadata and linked images. Never assert that
   the current imported articles have cleared production rights review.
3. Archives remain reversible with no automatic purge. Permanent deletion is
   available only after archiving and exact-slug confirmation; shared tags and
   media survive. Recheck source-mode MDX editing on final owner-authored
   content when available.
4. Run final production deployment QA on the actual hosting platform. Docker
   production build and both dependency audits pass; two existing non-fatal
   build warnings remain documented below.
5. The temporary local-draft status caveat and final-content rights/SEO
   review remain deployment gates, not a reason to modify imported examples
   during development. Do not call the eventual public deployment signed off
   before replacement and hosting checks.

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
- **Test gap resolved (2026-09-29):** Node's native TypeScript import runs the
  shared TOC utility without the earlier `tsx` ESM/CJS loader issue.
  `tests/blog-headings.test.mjs` now covers formatted and duplicate headings,
  H1/H2 ID collisions, and heading-like text in fenced code. It passed 1/1.
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

## Continuation: Responsive and fixture checks (2026-09-29)

- **Completed:** `tests/blog-headings.test.mjs` now tests the shared MDX/TOC
  implementation against synthetic duplicate/formatted headings and fenced
  code. A Blog-only browser test checks a published image/code article at
  320/390/768/1024/1440px in light and dark, requiring visible article text,
  no page overflow and no failed loaded body images. Both tests passed.
- **Completed:** article heading self-links now announce their destination
  rather than only `#`; the published-code regression also verifies the new
  accessible link name. TypeScript and targeted ESLint passed.
- **Public security check:** unauthenticated `/admin/blogs` redirects to
  `/admin/login` in the Alloy browser; this is not an authenticated Admin QA
  substitute. Files: `tests/blog-headings.test.mjs`,
  `tests/blog-responsive.browser.test.mjs`.
- **Remaining:** authenticated Admin CRUD/migration verification and editorial
  rights/retention decisions remain the gating work in Next exact step above.

## Continuation: Isolated Blog RLS verification (2026-09-29)

- **Completed:** `tests/blog-rls.database.test.sql` passed in disposable
  PostgreSQL 16 with base schema and Blog migrations applied. A rollback-only
  transaction exercised anon/authenticated reads of live vs draft/future/
  archived/no-date posts and their tag links, denial of direct tag-join writes,
  and service-role-only transactional Blog RPC create/update. Exit 0; the
  post-test fixture count was 0 posts / 0 tags. No connected Supabase rows
  were touched, and the disposable database was removed without stopping the
  app stack.
- **Remaining:** this proves the checked-in migration behavior in isolation,
  not that the live database has the same grants/policies or either Blog
  migration applied. Deployed SQL inspection and an authenticated Admin test
  record still require approved access and an owner rollout decision.

## Continuation: Blog index viewport matrix (2026-09-29)

- **Completed:** `tests/blog-index-responsive.browser.test.mjs` checks first
  article-card visibility, its viewport containment, and page horizontal
  scroll width at 320/390/768/1024/1440px in both light and dark modes.
  Docker Chromium passed 1/1. This supplements the article viewport matrix
  and pre-hydration listing test; it is not authenticated Admin visual QA.

## Continuation: Authenticated Blog Admin acceptance (2026-09-29)

- **Completed:** owner-provided Admin login reached the dashboard. A uniquely
  marked private QA draft was created through the new-post rich editor with a
  generated slug and summary; Admin list, edit-source reopen and saved
  noindex/nofollow preview worked. A source edit containing a heading, link
  and GFM table was persisted and rendered in preview. A later unchanged
  save preserved its SHA-256 exactly. The test post was scheduled for a future
  date (Admin showed Scheduled), hidden from anon REST, archived, restored as
  a draft, and archived again. A stale timestamp PATCH returned 409 without
  changing the row. The QA row was then removed by exact archived ID/slug;
  privileged and anonymous reads returned zero. No existing article changed.
- **Completed:** a second uniquely marked tagged QA draft tested Admin tag
  save and Blog list title search, Draft filter and ascending Title sort.
  Service-role reads saw the post/tag link; anon REST returned zero post and
  tag-link rows. It was archived; the filter showed its empty state. The
  archived post and its otherwise unused tag were deleted by exact identity
  after confirming no other links, reactions or view records. Final service
  reads returned zero QA posts and zero QA tags. No fixture remains.
- **Defects found and fixed:** blank canonical input caused `new URL("")` to
  throw and return HTTP 500 on create; the optional validator now accepts
  blank safely and rejects malformed URLs as validation errors. Existing
  posts with nullable cover/canonical fields failed client-side edit
  validation; BlogForm now supplies empty-string defaults. The Admin
  dashboard's Recent Blog Posts query selected nonexistent `publishedAt` and
  displayed an empty list despite 63 posts; the Blog-only query uses the
  verified Admin client and `published_at`, accurate Live counts/status and
  an explicit query-error state. New-post Tiptap now uses deferred initial
  rendering; its Next.js hydration warnings disappeared in the browser.
- **Verification:** authenticated browser create/edit/reopen/preview/schedule/
  archive/restore/filter/sort passed; service-role and anon REST observations
  corroborated privacy and cleanup. Blog overview displayed recent posts.
  Targeted Blog Admin/metadata tests, Docker TypeScript, ESLint and diff
  checks passed after the fixes. Credentials were not written to files or
  worklog. Files: `app/api/admin/blogs/route.ts`,
  `app/components/admin/BlogForm.tsx`, `app/components/admin/TiptapEditor.tsx`,
  `app/admin/(dashboard)/page.tsx`, `tests/blog-admin.archive.test.mjs`,
  `tests/blog-admin.overview.test.mjs`.
- **Remaining:** live catalog verification of applied Blog migrations is not
  possible with REST-only credentials; tag-join private reads were verified,
  but direct-write grants and collision-RPC version remain unproven in that
  database. Editorial rights, author attribution, archive-retention policy,
  legacy image descriptions/credits and unrelated package vulnerabilities
  still block a blanket production/legal sign-off.

## Continuation: Authenticated Admin responsive QA (2026-09-29)

- **Completed:** Blog-only list/new/edit page wrappers and form controls now
  shrink within narrow Admin layouts. At 320px the list document remained
  320px wide while its 248px-wide table panel scrolled internally to 476px.
  The new-post form (including its loaded rich editor) had no controls outside
  the viewport. On a read-only existing published-post edit page, the form
  occupied x=60..260 and the preview link originally clipped left; wrapping
  the action row kept all inputs, buttons and links within the 320px viewport.
  The existing article was not saved or otherwise changed.
- **Verification:** the existing-post edit form also had zero overflowing
  controls at 768px; the 390px light-mode new-post form and Blog list had no
  document overflow (list table scrolled inside its 310px panel). The 1440px
  dark-mode Blog list displayed 20 rows without page overflow. Browser console
  showed no app errors. Docker TypeScript, targeted ESLint, Blog Admin/list/
  archive/overview/preview and article-metadata tests, Blog editor 5/5, and
  `git diff --check` passed. Full Blog HTTP suite passed 4/4 when run alone;
  its all-articles case took 132 seconds, so a combined run with a 120-second
  timeout was interrupted before that case completed.
- **Remaining:** owner approval is still needed for imported article rights,
  attribution/image descriptions and credits, and archive retention. The
  checked-in Blog SQL migrations are not verified on the connected database;
  schedule-at-due-time and media upload are untested. These are outstanding
  gates, not assumed complete from authenticated browser access.

## Continuation: Scheduled publication and image upload (2026-09-29)

- **Completed:** a uniquely named QA post was created with `published` status
  and a publish time 90 seconds in the future. Before that time, it was absent
  from the public Blog index and RSS, and its article URL rendered only the
  not-found/noindex page (no QA title or body). After the due time, the article
  body and index card appeared without another Admin save. RSS and sitemap
  initially served cached output but included the post after their 60-second
  revalidation window. The post was archived using the Admin API, then deleted
  by exact archived ID/slug; a privileged read returned zero rows. The public
  article body, index, RSS and sitemap no longer contained the fixture.
- **Completed:** on the Blog new-post form, the media picker listed existing
  library assets and selecting one populated the cover field without saving a
  post. An authenticated SVG upload returned HTTP 415. A tiny QA PNG upload
  returned HTTP 200 and a media row; its exact row and Cloudinary public ID
  were subsequently removed and the media lookup returned zero rows. No
  existing articles or media were altered. This verifies the upload endpoint,
  not image authoring/alt quality for imported posts.
- **HTTP caveat:** the public article URL for the future and later removed QA
  post returned HTTP 200 with a streamed Next.js not-found/noindex body. The
  content was not disclosed before its due time, but a literal HTTP 404 status
  is not established for this streaming path; review before claiming the HTTP
  status acceptance gate. The feed refresh is eventual, not exactly at the
  scheduled second.
- **Remaining:** owner decisions on imported rights/attribution/image credits
  and archive retention; approved connected-database inspection/application of
  both Blog SQL migrations; unusual imported-MDX edit acceptance and the
  streaming HTTP-status caveat. Production/legal sign-off remains blocked.

## Continuation: Final public viewport gap and HTTP probe (2026-09-29)

- **Completed:** the existing public Blog article and index browser matrices
  now include the missing 360px width, alongside 320/390/768/1024/1440px in
  both light and dark. Docker Chromium passed both tests (2/2). The running
  container had been recreated, so its disposable Playwright browser and
  system-library cache had to be reinstalled; no browser artifacts were added
  to the repository. The Docker app remains running.
- **HTTP probe:** calling `notFound()` from Blog metadata generation as well
  as the article renderer did not change the direct app response for a missing
  article: it still returned HTTP 200 with a streamed not-found body. That
  ineffective change was removed. A literal 404 for this path remains an
  unresolved framework/routing acceptance issue; the not-found/noindex body
  and scheduled-post content embargo did work.
- **Database access:** the sandbox exposed a Supabase service-role REST key
  but no PostgreSQL connection URL. REST row reads cannot verify the installed
  SQL policy and RPC definitions. Neither pending Blog migration was applied
  during this pass.

## Continuation: Live anonymous write boundary (2026-09-29)

- **Verified:** an anonymous direct REST INSERT into `blog_post_tags` using
  nonexistent post/tag UUIDs was rejected with HTTP 401, SQLSTATE 42501, and
  an RLS violation. No row could be created by that probe. Together with the
  earlier private-read checks, this confirms two observed live boundaries,
  not the full installed policy/grant definitions or the tag-collision RPC.
- **Routing finding:** the Blog-level `loading.tsx` boundary can send a
  streaming response before an async article lookup calls `notFound()`. A
  route-scoped metadata `notFound()` trial still returned HTTP 200, so it was
  removed. Moving the boundary or adding a preflight layer is not a safe
  one-line change; literal 404 remains open without altering shared loading
  behavior. No unrelated or locked page was changed.

## Continuation: Deployment hardening (2026-09-29)

- **HTTP status fixed:** public Blog article *document* requests now use the
  existing Project preflight pattern in `middleware.ts`: an anonymous/public
  Supabase read checks slug, published status and due date before Next can
  stream. Missing posts return the existing site 404 page with HTTP 404 and
  `noindex`; a DB failure fails closed with HTTP 503. Browser navigation to
  an unknown slug rendered the real 404, while a published article returned
  200 and the existing five 410 Gone paths stayed 410. A GET/HEAD regression
  was added to `tests/blog.integration.test.mjs`. Internal RSC navigation
  continues to reach the route boundary, as it already does for Projects.
- **Legacy caveat:** `content/blog/tailwind-2-is-live.mdx` has a local `draft:
  true` override while its database row is published. The middleware's DB
  preflight therefore returns 200 for that legacy URL; the page itself still
  withholds its body and emits a streamed noindex/not-found view. Do not call
  this a blanket local-draft 404 fix. Remove the temporary imported files and
  rows as part of the owner's pre-deployment replacement, and use database
  draft/publish status as the source of truth for new owner-authored posts.
- **Dependencies:** a controlled Next 15.5 patch, Supabase 2.50.5, Nodemailer
  10.0.12 and UUID 11.1.1 update plus bounded transitive overrides resolved
  the previous 12 production audit findings. A non-forced dev lockfile update
  and a version-scoped `minimatch@3` override resolved the remaining tooling
  findings. Both `npm audit --omit=dev` and the full `npm audit` now show
  **0**. This did not upgrade to Next 16. The Compose web container was
  recreated once to install the matching lockfile; it remains running.
- **Static article correctness:** moved only visitor-specific reaction reads
  from static generation to the client after hydration. Aggregate counts
  remain server-rendered; controls wait until cookie/visitor state loads.
  The second Docker production build finished successfully without the prior
  repeated Blog cookie/dynamic-render errors. It still reports a pre-existing
  `CurrentlyReadingBento` image lint warning and an edge/static-generation
  advisory. The isolated production-build output was removed afterward.
- **Verification:** Blog/Admin/metadata HTTP suite 20/20; Home/About 3/3,
  legal 5/5, navigation 4/4, preview 3/3, Project 10 passed / 1 pre-existing
  skip, Blog editor 5/5. Docker TypeScript and targeted ESLint passed. The
  Alloy browser rendered a published article and enabled reaction controls
  after visitor state loaded. SQL catalog verification remains for the owner;
  no current imported article was edited or removed.
- **Additional live embargo check:** a unique future-published QA row returned
  GET and HEAD 404 without its article body under the new middleware. It was
  deleted by exact ID/slug in a finally block. No fixture was left behind.
  A browser-only legacy reaction cookie was also read after hydration on the
  direct Docker frontend: the Heart control became pressed without changing
  server counts; the test cookie was removed. The Alloy proxy briefly returned
  a 502 for a development chunk after package replacement, then rendered the
  article and enabled controls on a fresh navigation. No persistent app
  console error was seen after it settled.

## Continuation: Owner SQL catalog report (2026-09-29)

- **Owner-confirmed true (9/9):** `tag_join_rls_enabled`,
  `live_tags_only_policy`,
  `anon_direct_writes_revoked`, `authenticated_direct_writes_revoked`,
  `blog_save_rpc_exists`, `anon_blog_rpc_revoked`,
  `authenticated_blog_rpc_revoked`, `service_role_blog_rpc_allowed`, and
  `collision_safe_blog_rpc`. This is owner-reported SQL editor output; no SQL
  migration was rerun from this sandbox.
- **Remaining:** temporary imported articles remain in place for development
  as the owner requested. Replace them before public deployment, then run
  hosting-platform QA using the new owner-authored posts.

## Continuation: Full-prompt acceptance audit (2026-09-29)

- **Completed:** independently rechecked the public article and Admin Blog
  source against the complete prompt and previous roadmap. Found and fixed
  Blog-only gaps: hidden TOC focus and forced smooth motion; unchanged publish
  timestamps losing seconds; unclear publish/unpublish transitions and generic
  validation feedback; preview body images/TOC not matching public rendering;
  filename-prefilled image descriptions; credential-bearing/custom-port image
  host URLs; RSS origin and unsafe legacy canonical disagreement; internal RSC
  database failures being mistaken for missing articles; and a second H1 from
  body Markdown. The form now also rejects whitespace-only content and reports
  overlong/invalid/excess tags before submitting. Existing imported MDX bytes
  were not changed.
- **Decisions:** an existing post remains source-edited rather than risking a
  lossy Tiptap conversion. Archive stays reversible with no automated purge.
  Publish/unpublish/schedule transitions now require confirmation; ordinary
  edits to an already published post do not. New image insertions require an
  authored description instead of silently accepting an uploaded filename.
  Body `#` headings render as H2 and enter the TOC while the page title remains
  H1. The owner-confirmed SQL catalog checks remain 9/9; no migration was
  rerun.
- **Verification:** Docker production build succeeded, Docker TypeScript and
  targeted ESLint passed; full and production-only npm audits report zero
  vulnerabilities. Blog/Admin/metadata/defaults/headings/canonical HTTP and
  unit suite passed **26/26**; Blog image/editor passed **10/10**; security/
  GFM/code-copy suite **25/25**; public index/article/pre-hydration/lightbox/
  TOC browser suite **6/6**; Home/About, legal, navigation, preview and Project
  regressions **25 passed / 1 pre-existing skip**. Browser confirmed the
  hidden TOC is not focusable, Escape restores focus, and reduced-motion uses
  non-smooth scrolling and focuses the target. Read-only published-row scan
  found one temporary article with body H1. A fresh uniquely marked QA post
  rendered one title H1 and a body H2 on the public route, then was deleted
  by exact ID/slug. A cache-dependent test against the existing dev prerender
  was removed in favor of that fresh-route check and an MDX processor test.
  Following the final form checks, Docker TypeScript, targeted ESLint and the
  focused preview/defaults/headings suite passed again (8/8).
- **In progress / remaining:** do not claim 100% or lock. The Admin has no
  permanent-delete control (archive is a reversible hide), and every saved
  post reopens in source mode, even when it began as owner-authored simple
  Markdown. Changing a published slug invalidates the old URL without a
  redirect/metric migration. The current temporary imported corpus still
  needs replacement before deployment; author/alt/credits and page outlines
  must be reviewed on the final owner-authored content. Repeat authenticated
  transition/preview checks on an approved record after these latest UI edits;
  test deployment-host HTTP, CSP/embeds, broken links and performance with the
  final corpus. The shared media uploader buffers the file before external
  upload without an app-level size cap; assess infrastructure limits before
  claiming large/malicious uploads are comprehensively handled. Existing
  unrelated build warnings and the legacy local-draft status caveat remain.
- **Files changed in this pass:** `app/components/TableOfContents.tsx`,
  `app/components/admin/BlogForm.tsx`, the Blog-only image toolbar branch in
  `app/components/admin/TiptapEditor.tsx`,
  `app/admin/(dashboard)/blogs/[id]/preview/page.tsx`,
  `app/components/blog/blogImage.ts`, `app/lib/blog-canonical.ts`,
  `app/lib/blog-defaults.ts`, `app/lib/toc-utils.ts`, Blog-only lookup in
  `app/lib/utils.ts`, `app/rss.xml/route.ts`, scoped tests and this worklog.

## Continuation: Rich reopening, permanent delete and slug history (2026-09-29)

- **Completed:** added an additive `editor_mode` column defaulting to `source`
  for every existing row. The new service-role Blog save RPC marks newly
  created rich-editor posts `rich` and never promotes an existing source post
  because a client requested it. A saved rich post reopens with the toolbar;
  loading editor content does not emit an edit, and a metadata-only save sends
  its original content bytes rather than Tiptap-normalized Markdown. Legacy
  imported MDX stays source-only and unchanged.
- **Completed:** an archived post now has a separate **Permanently delete**
  control requiring the exact slug. The Admin DELETE authenticates before
  parsing, validates the slug, then calls a service-role-only transactional
  RPC guarded by archived status and `updated_at`. The RPC removes that post's
  independent view counters and relies on existing FK cascades for its tag
  joins and reactions. Shared tag and media assets are not deleted. Archive
  and restore use a new guarded transaction that also reserves a scheduled
  post's slug if it has become live before archive. A DB-level view-insert
  guard prevents an in-flight view write from recreating a deleted counter.
- **Completed:** published slugs are reserved in `blog_slug_history`; renames
  retain aliases to the same post ID rather than chaining redirects. GET/HEAD
  documents redirect old names to the current **live** slug with HTTP 308;
  unpublished/scheduled targets stay hidden, and deleted published aliases
  return 410. RSC navigation resolves a live alias too. The middleware keeps
  existing 404 behavior on databases where the additive history table is not
  installed yet. New posts cannot claim a published or tombstoned name.
- **Verification:** the new migration applied and reapplied in disposable
  PostgreSQL 16; the new rollback-only SQL test, existing Blog tag-collision
  and RLS SQL tests passed. An isolated concurrent rename/reuse test rejected
  the competing slug, and an insert blocked on deletion then failed instead
  of orphaning a view counter. The read-only new-workflow catalog checker
  returned **12/12 true in disposable PostgreSQL only**. Docker Blog public/
  Admin auth/source checks 12/12, broader Blog Admin/security checks 25/25,
  editor/image tests 10/10, TypeScript, targeted ESLint and npm audit 0 passed.
- **Not yet live:** connected Supabase has not received this *new* migration;
  the earlier owner-reported 9/9 catalog results do not apply to it. No
  authenticated positive test of the new rich edit, delete or redirects has
  been run against that connected database. Archive/restore falls back to its
  previous optimistic update only while the new RPC is absent. The temporary
  articles, their stored content and the deployment setup were not modified.
  Do not label the new Admin workflow fully functional until
  rollout and the controlled acceptance test in Next exact step 2.
- **Files changed:** `migrations/2026_blog_editor_delete_slug_history.sql`,
  `migrations/verify_blog_workflow.sql`, `supabase_schema.sql`, Blog-specific
  Admin API/list action/form/editor, public Blog article and middleware,
  Blog tests including `tests/blog-editor-delete-slugs.database.test.sql`,
  and this worklog.

## Continuation: Connected workflow acceptance (2026-09-29)

- **Completed:** owner reports the new Blog workflow SQL and read-only
  verifier executed successfully. In the connected database, both
  `blog_posts.editor_mode` and anonymous `blog_slug_history` reads returned
  HTTP 200. The previous 9/9 checker applied to older migrations; the new
  12/12 catalog output was confirmed in disposable PostgreSQL and the owner
  reports successful connected execution, not independently inspected by the
  sandbox SQL catalog.
- **Live service-role QA:** an opt-in test created a uniquely named draft,
  confirmed rich mode, byte-identical metadata-only save, two published slug
  renames with direct 308s, archive/restore, stale-delete rejection, archived
  deletion and 410 tombstones. All QA post/history/view rows were removed by
  exact identity afterward. `tests/blog-workflow.live.test.mjs` passed 1/1.
- **Authenticated browser QA:** a one-time Admin session was established in
  memory through the existing Supabase Auth infrastructure without storing or
  printing a password, link or token. The opt-in browser test created a draft
  with the rich editor, reopened it, saved metadata without altering content,
  edited content, published it, renamed it and observed a direct old-slug
  redirect, archived/restored/re-archived it, rejected an incorrect deletion
  slug, then permanently deleted it with the correct typed slug. New/edit and
  list stayed within the 320px document width. Initial attempts exposed a
  blank-canonical client validator exception, fixed by guarding URL parsing;
  the final browser test passed 1/1. A final privileged check found **zero**
  QA rows in `blog_posts`, `blog_slug_history` and `article_views`; the original
  **63** published rows remained. Files: `BlogForm.tsx`, opt-in
  `tests/blog-admin.workflow.browser.test.mjs` and this worklog.
- **Regression verification:** final Docker Blog/Admin/metadata HTTP suite
  29/29; Home/About, legal, navigation and Projects 22 passed / 1 pre-existing
  skip; editor/image 10/10; public responsive/TOC/lightbox/pre-hydration
  browser suite 6/6; Docker TypeScript, production build and `git diff --check`
  passed; full npm audit reported zero vulnerabilities. The build still emits
  the existing unrelated image-lint and edge/static notices. No imported
  article, shared CTA, legal page or other locked surface was changed.
- **Remaining (explicitly deferred by owner):** replace temporary imported
  articles/images with licensed owner-authored material before public launch,
  then perform final content and hosting-platform acceptance. Do not delete
  those temporary articles in this development session.

## Continuation: Article detail editorial pass (2026-09-29)

- **Completed:** narrowed the public article header, metadata, body and
  reactions to a 680px reading column. Shared Blog MDX heading extraction and
  rendering now display H2/H3 section numbers in both the body and floating
  TOC, without altering stored text, slugs or anchor IDs; existing authored
  numeric prefixes are not duplicated. The page title remains the only H1.
  The collapsed TOC docks outside the reading column on desktop and becomes
  a compact control beside the chat button on mobile; its expanded panel
  clears the chat button. Hidden focus and reduced-motion behavior remain.
- **Completed:** Blog-only public and private-preview code components render
  fenced snippets as one labelled window with highlighted semantic `<pre><code>`,
  a persistent Copy control, keyboard-scrollable long lines, and a plain
  inline-code treatment. No tabs or content rewrites were added. Removed the
  inherited inner `<pre>` border after visual review so each snippet has one
  frame. The shared heading component changes its presentation only when a
  Blog-generated section number is present.
- **Verification:** the 320/360/390/768/1024/1440px matrix passed in light
  and dark modes for page containment, article content, code structure,
  always-visible Copy and loaded images. A touch-emulated 390px browser
  copied exact snippet text (including the source trailing newline), scrolled
  a synthetic long line inside the code window without page overflow and
  opened the mobile TOC by tap. TOC keyboard/reduced-motion and copy-name
  browser checks passed (4/4). Heading, code-window and Admin-preview tests
  passed (8/8). Docker TypeScript, targeted ESLint, `git diff --check` and
  production build passed; the build retained the existing unrelated image
  lint and edge/static notices. Running the build concurrently with the dev
  server briefly invalidated HTTP checks (site-wide 500s); after restarting
  only the web container and rerunning tests sequentially, Blog, Home/About,
  legal, navigation, preview and Projects passed **30/30**, with the one
  pre-existing preview-only Project skip. The web container remains running.
- **Files:** `app/blog/[slug]/page.tsx`, private Blog preview page,
  `app/components/blog/BlogCode.tsx`, `app/components/TableOfContents.tsx`
  and its CSS module, `app/components/mdx-components.tsx`,
  `app/lib/toc-utils.ts`, Blog heading/code/TOC/responsive/preview tests,
  and this worklog. No Blog index, CTA, legal page, imported article or
  database row was edited.
- **Remaining:** review the final owner-authored corpus for actual image
  captions, table widths, rich code languages, author attribution and page
  outlines; verify the deployed host on touch and keyboard devices. Current
  representative article and automated fixture coverage are not final
  production content sign-off.

## Continuation: Owner-directed article refinement (2026-09-29)

- **Changed:** restored the floating TOC to the viewport center with its
  original full-width collapsed pill. On small screens it sits above the
  existing chat control instead of covering it. H2/H3 numbers now inherit
  their heading's actual typography and color, with normal inline spacing;
  neither source MDX nor anchors changed. The Blog article route alone removes
  both its own decorative rails and the outer layout's hatched grid columns;
  the shared layout and locked Blog index keep their original frame.
- **Polished:** the single-snippet code window now has an inset code canvas,
  restrained title bar, file glyph, optional language label, neutral window
  dots, a persistent Copy action and a stronger but still theme-aware frame.
  The article title tracking, metadata divider and body handoff were refined.
  Blog-only MDX notes use a quiet inset card instead of another striped frame.
  No switchable code tabs were introduced.
- **Checked:** browser screenshots and DOM measurements at mobile/dark and
  desktop/light confirm the centered TOC, matched heading-number typography,
  code and note presentation, and zero-width article-only hatched gutters.
  The 320/360/390/768/1024/1440px light/dark responsive matrix and mobile
  TOC keyboard/reduced-motion checks pass. Touch copy and long-line containment
  pass. Docker TypeScript, targeted ESLint, diff checks and the production
  build passed. Blog, Home/About, legal, navigation, preview and Project
  regressions passed except for one transient responsive timing assertion
  when the broad HTTP and browser suites ran together. The responsive test
  now waits for the numbered article heading before measuring it. After the
  build, the web container was restarted and the Blog HTTP/browser smoke
  suite passed 8/8; it remains running. Existing unrelated build warnings
  remain unchanged.

## Continuation: Reference-driven article details (2026-09-30)

- **Completed:** article H2/H3 and TOC numbers now have a trailing dot. H2
  weight is 600 instead of 700; H3/H4 are 500 instead of 600. Neither stored
  MDX nor generated anchor IDs was modified.
- **Completed:** Blog-only fenced snippets now use the supplied reference's
  dark navy canvas, inset blue frame, red/yellow/green window dots and
  high-contrast syntax colors in both site themes. The Copy button stays
  visible, focusable and usable by touch. Filename strips are omitted even
  for language/filename-fenced source; the language remains in the accessible
  code label. No script path was added to the UI or repository.
- **Completed:** article notes retain authored Idea, Info, Thought and Warning
  labels and use restrained semantic tints with a matching left rule; ordinary
  Markdown quotes use a neutral editorial surface. The article-only reaction
  area has a clear heading and four equal-size labelled controls with visible
  counts, keyboard focus and the existing optimistic/error behavior. No live
  reaction was clicked during this design QA.
- **Image fix:** the existing Blog middleware preflight was treating local
  `/blog/*.jpeg` assets as article slugs, returning 404 and causing optimizer
  400s. Image extensions now bypass only the Blog article preflight. A real
  image returns HTTP 200 and the representative article reports zero broken
  images, without changing any temporary imported file or row.
- **Verification:** Docker TypeScript, targeted ESLint and diff checks passed;
  Blog heading/preview/code-window tests passed. Browser tests passed for the
  320/360/390/768/1024/1440px light/dark article, touch copy, code overflow,
  centered TOC and 320/390/768/1440px Idea/Info/Thought/Warning and ordinary
  quote containment. The broad HTTP/Blog/locked-surface run passed 41 tests
  with one existing Project skip; one callout browser test hit a navigation
  `load` timeout while its third-party video loaded. It passed when run on
  its own and now waits for DOM content rather than the external iframe.
  Browser screenshots at mobile light/dark show the code, callouts and
  reaction card; no app console exceptions were seen (the legacy YouTube
  embed logs sandbox WebGPU warnings). Docker production build passed with
  the existing unrelated image-lint and edge/static notices. After restarting
  the web container, the Blog HTTP/browser smoke suite passed 10/10; the
  container remains running.
- **Remaining:** owner must replace the temporary imported corpus before
  public launch and review content rights, alt text and attribution. Deployment
  host checks are still deferred; do not claim literal pixel-perfect or
  production sign-off from sandbox screenshots alone.

## Continuation: Neutral code frame and article hierarchy (2026-10-01)

- **Completed:** removed the thick blue surround from Blog code windows while
  retaining a single theme-token border, dark code canvas, focusable horizontal
  scrolling and always-visible Copy. Plain-text fences now render literal,
  safely escaped text rather than inaccurate JavaScript syntax tokens; marked
  language fences retain highlighting. Copy still preserves the original text.
- **Completed:** suppressed the shared `drama-shadow::after` inset decoration
  only inside Blog notes and code windows. Idea/Info/Thought/Warning notes now
  share a neutral article surface, quiet semantic-dot labels and normal-weight
  body text; standard quotations keep their own neutral treatment. The shared
  utility and locked pages are unchanged. H5/H6 now have a descending Blog-only
  type scale rather than inheriting the shared 36px heading class.
- **Measured heading scale:** article title H1 uses Instrument Serif 400 at
  30px below `sm`, 36px from `sm`, and 48px from `md`. Body headings use Outfit:
  H2 24px/500, H3 20px/500, H4 16px/500, H5 15px/500, H6 14px/500.
  MDX body H1 renders as an H2; visual numbering applies to H2/H3 only and
  does not change the stored heading text or anchor IDs.
- **Verification:** Docker code-window 3/3; responsive, callout, touch-copy
  and TOC browser checks 4/4 across light/dark and 320-1440px; TypeScript,
  targeted ESLint, diff check, and production build passed. After the build,
  only the web container was restarted; Blog HTTP, Home/About, legal and
  Project regressions passed (26 passed, one pre-existing Project skip).
  One callout-browser navigation timed out under the combined route-heavy
  run, then passed in isolation (1/1); its cold-navigation timeout was raised
  to 60 seconds. The browser preview confirmed no second inset outline and
  the container remains running. No imported article/media or database record
  was modified.
- **Remaining:** final owner-authored content rights, image descriptions and
  deployment-host QA are still separate sign-off gates.

## Continuation: Compact code controls and scrolling (2026-10-01)

- Reduced the Blog-only snippet header from 52px to 44px and its Copy control
  from 36px to 32px; window dots and control type/icon were scaled with it.
  The button remains keyboard-focusable and above the 24px target minimum.
- The existing focusable `<pre>` now has an explicitly styled native horizontal
  scrollbar below overflowing code in both themes. Long lines scroll within
  the window without widening the article or document; copy still takes the
  original unmodified code. Code text uses Geist Mono at `clamp(13px, 2vw,
  16px)`: 13px at phone widths through 650px, 15.36px at 768px and 16px from
  800px upward. Inline code retains its separate relative `0.86em` scale.
- Docker responsive light/dark tests passed at 320/360/390/768/1024/1440px;
  touch copy/scrollbar checks passed, including scrollbar movement and no page
  overflow. Docker TypeScript, targeted ESLint, diff check and production build
  passed. After the build, the web container was restarted, touch code checks
  passed again and the stack remains running. Temporary imported content and
  locked pages were not edited.

## Continuation: Curated article handoff and TOC hierarchy (2026-10-01)

- **Completed:** reduced the Blog code font scale to `clamp(12.5px, 1.8vw,
  14px)` and tightened snippet padding; touch copy and the styled horizontal
  scrollbar remain. The centered TOC pill now points upward. Its panel sizes
  to short outlines, caps long ones with internal scrolling, wraps titles,
  indents H3 beneath H2 and closes on downward page scroll. Escape, close and
  scroll return keyboard focus to the collapsed pill when appropriate.
- **Completed:** the article reaction controls occupy a single row at all
  checked widths. Phones show accessible icon-and-count controls; larger
  screens retain labels. Four controls remain 48px high on phones and 56px
  from `sm`, without clipping counts or expanding the document.
- **Completed in code, not deployed to connected DB:** an additive Blog
  migration adds at most three ordered, distinct related post IDs, validates
  selected rows as currently live in the service-role save transaction, and
  removes a deleted post from referring arrays. Admin create/edit can search,
  select and remove recommendations in order; the API rechecks selections and
  revalidates referring article pages. Existing posts default to no selection.
  Until the migration is installed, ordinary empty-selection saves remain
  usable; attempting to save a selection returns a migration-required error.
- **Public behavior:** only Admin-selected, currently live posts render as
  cards, in the chosen order. The section reuses the site's `SectionHeading`
  with `Continue exploring` and `Related articles`, followed by up to three
  Blog-only cards. With no live selection, the Project-detail-style `Keep
  exploring` link leads to the Blog index instead of inventing recommendations.
  Imported article bodies/media, shared SectionHeading and locked pages were
  not changed.
- **Verification:** migration applied and reapplied in isolated PostgreSQL 16;
  rollback-only selection/delete/validation SQL passed, and the new read-only
  catalog verifier returned six true results there. The connected Supabase DB
  was not mutated; apply `migrations/2026_blog_related_selections.sql` there
  before attempting curated Admin saves, then check
  `migrations/verify_blog_related_selections.sql`. Docker TypeScript, targeted
  ESLint, production build and diff checks passed. Blog/Admin/locked-page HTTP
  regressions passed (40 passed, one existing Project skip); focused Blog
  browser tests passed 5/5 and related-card/code tests passed 4/4. After the
  build the web container was restarted; Blog HTTP/TOC/responsive smoke tests
  passed 10/10 and the app remains running.
- **Remaining:** authenticate and exercise Admin selection/save/reopen plus
  public three-card order after the owner applies the new SQL. Final public
  launch still waits on replacement of temporary imported content and
  deployment-host QA; do not call this a live database sign-off.

## Continuation: TOC rollback (2026-10-01)

- Per owner request, restored only `TableOfContents.tsx` and its browser test
  to the state before the curated-article pass: centered pill with down arrow,
  original full-height expanded panel and compact single-line entries. The
  downward-page-scroll auto-close was removed; explicit close, Escape, and
  heading selection still work. Code sizing, reactions and related Blog
  selection are unchanged by this rollback.

## Continuation: Focused TOC polish (2026-10-01)

- The centered pill keeps its reading-progress ring and now uses an up arrow
  because its panel opens above it. The `Table of contents` label has a little
  more weight and a thin divider. Open-panel height grows for short outlines
  and caps at 72vh/560px for long ones. Its internal list has a theme-aware
  thin scrollbar and does not dismiss when only that list scrolls.
- The shared Blog outline parser now includes H4-H6 in addition to H2/H3,
  using the existing generated heading IDs without changing article text or
  the H2/H3 numbering. Within the TOC, H2 stays 14px; H3 is 13px; H4-H6 are
  12px with progressively deeper indentation. The active heading is marked
  with `aria-current="location"`, a subtle surface and a vertical marker;
  other rows have verified light/dark hover feedback. Opening a long outline
  scrolls its selected entry into the panel's view.
- If a reader scrolls back above the pill's 320px reveal point while the
  panel is open, it closes and fades with the pill. When keyboard focus was
  inside the TOC, focus moves to the visible Blog/back-to-editor link instead
  of remaining in hidden controls. Normal downward page scrolling does not
  close the TOC; Escape and explicit close continue to work.
- Docker heading/TOC/browser checks passed 7/7, including touch H4 tracking,
  reduced motion, top-scroll dismissal, long-list scrolling and hover in both
  themes. Blog responsive/code/callout browser checks passed 7/7, and Blog,
  Home/About, legal, navigation and Project regressions passed 35 with one
  pre-existing Project skip. Docker TypeScript, focused ESLint, diff check and
  production build passed. After restarting the web container, Blog HTTP,
  heading, responsive and TOC checks passed 15/15; the stack remains running.
  Imported article content, related-post selection, reactions and locked pages
  were not edited.
