# Blog Detail Verification

Date: 2026-10-02. Scope: public `/blog/[slug]` and its directly rendered article controls.

## Verdict

The previously confirmed code-level security, route, and accessibility defects
below have been addressed and regression-tested. This is **not** final
production sign-off: owner-approved content, connected reaction mutations,
authenticated Admin workflow, and real-host checks still need acceptance.
The article presentation and shared dependencies remain protected by
`LOCKED_PERFECT.md`. No article, reaction, or related-selection data was changed.

## Resolved Findings

1. **MDX rewrite execution:** `app/components/mdx.tsx` now encodes CodePen URL
   segments and validates the exact rewritten source before evaluation. An
   isolated inert-expression regression confirms it cannot execute, while a
   normal CodePen link still renders (`tests/blog-mdx-codepen.test.mjs`).
2. **Article response status:** the Edge preflight rejects locally marked
   drafts before the database publication lookup, including old-slug targets.
   Detail metadata checks the same local draft rule. The formerly mismatched
   slug returns GET/HEAD 404 with noindex and no published article metadata;
   published articles still return 200 (`tests/blog-draft-visibility.test.mjs`).
   The Edge draft manifest is intentionally mirrored from local MDX because
   Edge middleware cannot read the filesystem; the test checks their parity.
3. **Modal stacking:** the article image lightbox uses the site's 7000 modal
   layer. Browser hit-testing confirms that it covers navbar and chat controls;
   focus containment and restoration remain tested.
4. **Optional recommendations:** query errors and rejected fetches now return
   an empty selection rather than failing the article. An isolated mock-query
   test covers both failure paths and a successful read
   (`tests/blog-related-fallback.test.mjs`).
5. **Share and heading controls:** Copy URL and More meet the 24px touch-target
   floor. Share options use labeled native button-group semantics, Tab order,
   Escape dismissal and focus return; copy status is announced and its timer is
   cleaned up. H2-H6 text aligns with article prose and the heading itself is
   the permalink. The decorative `#` appears at heading size on desktop hover
   or keyboard focus and is hidden on touch/phone screens; tapping the title
   still navigates to its section. Blog-only video embeds stay contained.
6. **Reaction and loading labels:** the visible Love action now includes
   "Love" in its accessible name, without changing its heart reaction type or
   counts. `/blog/[slug]/loading.tsx` displays an article-shaped paper hero,
   metadata and prose shell instead of the Blog index's cards.

## Remaining Gates

- Imported article text, image rights, attribution and missing descriptive alt
  text require owner/editorial review before launch. Do not invent authorship
  or silently replace the temporary corpus.
- The connected REST catalog exposes `toggle_article_reaction`, and the
  single-choice RPC has passed disposable PostgreSQL tests. No connected
  choice/switch/removal mutation was authorized or performed in this work; a
  catalog listing alone does not verify connected behavior.
- Authenticated Admin selection/write and deployment-host browser acceptance
  have not been performed. An optional-recommendation outage was tested in
  isolation, not induced on the connected database.

## Passing Evidence

- Three representative articles rendered with a single H1, no broken loaded
  article images, no page errors, and no measured overflow in light and dark.
- The long code-heavy article was checked at 320x640, 360x640, 375x667,
  390x844, 768x1024, 1024x768, and 1440x900 in both themes. Sampled prose,
  heading, metadata, and related-card text had no measured AA contrast failures.
- The connected article with three curated related posts rendered three cards;
  previous read-only checks found all three destinations returned HTTP 200.
- Docker tests after these fixes: 75 passed, one pre-existing Project skip. This includes Blog
  detail, headings, TOC/native touch, lightbox, code copy, callouts, metadata,
  related selections, MDX policy, responsive layouts, reaction failure
  rollback, and locked Home/About/legal/Project regressions. Additional tests
  cover the exact MDX rewrite, draft preflight, permalink visibility, share
  behavior, optional recommendation failures and article-only loading state.
- Docker TypeScript and focused ESLint passed. The production build passed
  with pre-existing non-fatal image and edge-runtime warnings. After restarting
  web, the preview rendered the article and three cards without page errors.

This verification does not certify pixel perfection on every device or real-host
production readiness. Complete the remaining owner and connected-host gates
before a public sign-off.
