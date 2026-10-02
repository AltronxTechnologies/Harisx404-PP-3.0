# Blog Detail Verification

Date: 2026-10-02. Scope: public `/blog/[slug]` and its directly rendered article controls.

## Verdict

**Not production-ready.** The rendering and responsive regressions pass, but a
confirmed MDX execution path and accessibility/route defects block sign-off.
The article presentation and shared dependencies are protected by
`LOCKED_PERFECT.md`; this is a findings report, not authorization to alter them.
No article, reaction, or related-selection data was changed during this audit.

## Findings

1. **Critical - transformed MDX bypasses the content policy.**
   `app/components/mdx.tsx:96-110` validates the authored MDX, then rewrites
   CodePen iframe URLs into Markdown and evaluates the *rewritten* string.
   In isolated Docker rendering, a harmless expression placed in an otherwise
   accepted CodePen URL executed when the transformed content rendered. The
   transformed source fails `validateBlogMdx`, but it is not checked there.
   Validate the exact rendered source and avoid interpolating untrusted URL
   segments into Markdown syntax. Add a regression using an inert probe. Do
   not treat the current published-corpus preflight as proof of safety for
   future Admin-authored content.
2. **High - image modal is below interactive site chrome.**
   `app/components/blog/ImageLightbox.tsx:113-132` declares `aria-modal` but
   uses `z-[200]`; the navbar and chatbot have higher stacking layers. Browser
   hit-testing with an open modal confirmed neither is covered. Align the
   dialog's layer and background interaction with the site's modal contract.
3. **High - known published slug returns a misleading success document.**
   `/blog/tailwind-2-is-live` returned HTTP 200 with a not-found view and no
   `#blog-article`. `app/blog/[slug]/page.tsx:52-55` rejects the local draft
   after middleware's database-based preflight. Reconcile publication checks
   without silently republishing the temporary imported corpus.
4. **Medium - recommendations are an article availability dependency.**
   `app/blog/[slug]/page.tsx:104-109` awaits the optional related-post query;
   `app/lib/utils.ts:202-218` throws if it fails. A recommendation outage can
   replace a readable article with an error page. Preserve the article and
   degrade just that optional section.
5. **Medium - article controls have undersized targets and incomplete menu
   semantics.** At 320-1440px in both themes, the Copy URL button measured
   81x20px, More share options 18x18px, and a heading permalink 15x32px;
   each misses the 24px minimum on at least one axis. The popup declares
   `role=menu`/`menuitem`, yet ArrowDown left focus on the trigger. Review
   `CopyUrlButton.tsx:50-105`, `mdx-components.tsx:391-419`, and the Blog-only
   heading styles without changing global/locked components casually.
6. **Editorial and rollout gates remain.** Imported article text, image rights,
   attribution, and missing descriptive alt text need owner review. The
   connected REST catalog exposes `toggle_article_reaction`, but no connected
   choice/switch/removal mutation was authorized or performed; a catalog
   listing alone does not verify that RPC's behavior. Authenticated Admin
   selection/write and deployment-host browser checks also remain unverified.

## Passing Evidence

- Three representative articles rendered with a single H1, no broken loaded
  article images, no page errors, and no measured overflow in light and dark.
- The long code-heavy article was checked at 320x640, 360x640, 375x667,
  390x844, 768x1024, 1024x768, and 1440x900 in both themes. Sampled prose,
  heading, metadata, and related-card text had no measured AA contrast failures.
- The connected article with three curated related posts rendered three cards;
  previous read-only checks found all three destinations returned HTTP 200.
- Docker tests: 66 passed, one pre-existing Project skip. This includes Blog
  detail, headings, TOC/native touch, lightbox, code copy, callouts, metadata,
  related selections, MDX policy, responsive layouts, reaction failure
  rollback, and locked Home/About/legal/Project regressions. The metadata test
  was updated to reflect the owner-approved removal of the visible Published
  label. The existing MDX tests do not cover post-validation rewriting.
- Docker TypeScript and focused ESLint passed. The production build passed
  with pre-existing non-fatal image and edge-runtime warnings. After restarting
  web, the preview rendered the article and three cards without page errors.

This audit does not certify pixel perfection on every device or real-host
production readiness. Correct the critical finding before deploying new Blog
content, then rerun security, accessibility, responsive, Admin, and host QA.
