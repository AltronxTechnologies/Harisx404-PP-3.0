# Blog Index Audit

- Route: `/blog`
- Audit date: 2026-09-04
- Status: Blog index implementation and production audit passed; awaiting owner
  review and the editorial ownership decision before lock
- Primary files: `app/blog/page.tsx`, `app/blog/loading.tsx`,
  `app/components/blog/BlogFilterBar.tsx`,
  `app/components/blog/FeaturedBlogCard.tsx`, and
  `app/components/blog/BlogGridCard.tsx`
- Locked references: Home, About, Projects, Navbar, Search modal, Reach Out
  modal, and Footer (`LOCKED_PERFECT.md` entry 24)

## Scope

This audit covers the public Blog index, its category navigation, cards, empty
state, and route-local loading state. The locked shell and shared CTA are
reference-only and must not be edited. Blog detail pages and content ownership
are recorded where they affect production readiness, but are not silently
rewritten as part of an index presentation pass.

## Strategy

1. Establish the current route, content, semantic, responsive, theme, and
   interaction baseline before editing.
2. Compare every transferable value against the locked references. Use About
   for the neutral editorial hero, Projects for filter-control discipline, and
   Home Writings for article-card language.
3. Separate defects from intentional Blog-specific variation. Preserve the
   category scroller, RSS action, featured-plus-grid information architecture,
   and article-index density where they serve a real Blog need.
4. Fix Blog-owned defects only. Do not modify locked components, global tokens,
   shared modal behavior, or page-specific compositions on reference pages.
5. Verify zero, one, many, valid-filter, invalid-filter, loading, long-title,
   image, keyboard, hover, active, focus, and reduced-motion states.
6. Re-run the complete viewport matrix in light and dark, then run TypeScript,
   targeted ESLint, route, console, asset, overflow, contrast, and target-size
   checks.

## Implementation plan

### Header

- Replace the 152px local top padding with the locked 56px subpage offset.
- Use `PaperHeroTexture` with About's exact responsive bounds.
- Keep a visible semantic `h1`; move the kicker outside it.
- Match the locked 12px/500 mono kicker, 16px gap, 46px mobile/56px desktop
  Instrument Serif heading, line-height 1, tight tracking, primary text token,
  and approved gradient accent.
- Add concise editorial supporting copy using the established 15px secondary
  body scale.

### Controls

- Preserve URL-backed category navigation and the locked Search-modal event.
- Render only categories actually represented by published posts; do not offer
  dead curated filters.
- Normalize and validate a single category query value.
- Expose selected state with `aria-pressed` and provide explicit focus-visible
  treatment.
- Use the approved subtle hover/active border language on bordered actions.

### Content hierarchy and cards

- Use section `h2` headings and card `h3` headings with a clean h1-h2-h3
  outline.
- Use locked card shells: 24px outer radius, 16px media radius, token border,
  white light surface, subtle dark surface, and 12px inset.
- Use Instrument Serif article titles at approved weights and body copy at the
  established 14-15px scale.
- Remove duplicate accessible image/title announcements.
- Use responsive optimized images with accurate `sizes`; prioritize only the
  above-the-fold featured image.
- Add machine-readable publication dates and mobile-safe metadata wrapping.

### States and performance

- Add a Blog-local loading skeleton matching the final header, controls,
  featured card, and grid.
- Distinguish an empty Blog from an invalid filter and provide a reset action.
- Preserve reduced-motion behavior and avoid layout-shifting hover effects.
- Keep the existing featured-plus-latest layout while bounding initial output
  only if evidence shows a production rendering problem.

## Baseline findings

### Blockers

- Every visible curated category currently leads to an empty result because
  fetched post categories are empty. The UI advertises controls that do not
  work with the live data.
- Imported content includes third-party first-person articles and draft-source
  files that migration scripts can publish. Ownership, canonical attribution,
  and database publication state require an explicit editorial decision.

### High-priority UI defects

- The Blog starts 96px below the locked subpage top rhythm.
- Desktop page heading is 60px instead of 56px and lacks explicit line-height
  and locked desktop tracking.
- A paragraph is nested directly inside the h1, producing invalid semantics.
- The generic hero texture does not match the requested About paper treatment.
- The route inherits a Home-specific loading skeleton and announcement.
- Card surfaces, padding, title typography, metadata, and actions drift from the
  locked Home Writings language.
- Filter selection is visual only and action controls lack explicit focus
  styles.

### Production data risks outside the visual pass

- Public detail lookup does not enforce `status = published`.
- Public queries can expose future-dated posts marked published.
- Database failures are swallowed and rendered as a legitimate empty Blog.
- The index fetches every full article body and recomputes reading time.
- Migration scripts disagree on image fields, paths, and tag join tables.
- Several source summaries are demonstrably unrelated to their titles.

These data risks must remain visible in the final handoff if they cannot be
resolved safely within the Blog-index scope.

## Implemented fixes

### Header and composition

- Replaced the extra 152px top padding with the locked 56px subpage offset.
- Reused About's `PaperHeroTexture` with its exact responsive bounds.
- Corrected the header to a visible semantic h1 with a sibling kicker.
- Matched the locked 12px/500 mono kicker, 16px gaps, 46px mobile/56px desktop
  Instrument Serif title, line-height 1, desktop -1.5px tracking, primary text
  token, and approved gradient accent.
- Added 15px/24px editorial supporting copy and removed the nested main.

### Filters and routing

- Recovered categories from checked-in frontmatter when the public database
  join is empty; database categories remain authoritative when present.
- Excluded ten source drafts, leaving 53 published index articles.
- Replaced dead curated filters with 14 categories backed by real posts.
- Added `aria-pressed`, explicit focus-visible treatment, keyboard-reachable
  horizontal scrolling, 32px control geometry, and approved border states.
- Normalized category/page values, handled repeated categories safely, and
  canonicalized malformed/out-of-range page URLs.
- Added category/page metadata and canonical URLs. Unknown or ambiguous filters
  are `noindex, follow` and canonicalize to `/blog`.

### Cards, content, and performance

- Corrected heading order to h1 -> section h2 -> article h3.
- Matched locked card shells: 24px outer radius, 16px media radius, 12px inset,
  token border, white light surface, and subtle dark surface.
- Matched the Home Writings serif title, 15px body, mono metadata, and simple
  translating-arrow language.
- Removed duplicate accessible cover/title announcements.
- Added machine-readable UTC dates and mobile-safe wrapping.
- Added validated responsive Next images, bounded `sizes`, featured priority,
  and a no-image fallback for invalid/unapproved sources.
- Added six-page, 9-item pagination with bounded page links, real disabled
  states, `aria-current`, live summaries, and prefetch suppression.
- Removed full article bodies and heading extraction from normal database index
  requests. Full content is fetched only for a new admin post that lacks both a
  stored reading time and checked-in source content.
- Public rows are restricted to published, non-future posts. Source drafts are
  excluded without mutating Supabase.

### Loading, empty, and error states

- Added a Blog-local loading boundary matching the final header, controls,
  featured card, latest heading, and card grid.
- Added reduced-motion handling to every skeleton animation.
- Added a Blog-local retryable error boundary instead of presenting database
  failures as an empty publication.
- Added distinct empty and unknown-filter states with recovery actions.

## Final responsive verification

The index was measured at 1440x900, 1024x768, 768x1024, 390x844,
375x667, and 360x640 in both light and dark themes.

- Document overflow: 0px in all 12 combinations.
- Header: 56px/56px at 768px and above; 46px/46px on phones.
- Header gaps: 16px kicker-to-heading and 16px heading-to-copy everywhere.
- Supporting copy: 15px/24px everywhere.
- Interactive targets below 24px: zero.
- Heading hierarchy: one h1, section h2s, article h3s; no skipped levels.
- Images: every rendered image completed with non-zero natural dimensions; no
  failed requests.
- Light primary/secondary contrast: 16.67:1 / 5.88:1.
- Dark primary/secondary contrast: 18.60:1 / 7.51:1.
- Search modal launch, focus trap, Escape dismissal, and exact opener focus
  restoration passed without modifying the locked modal.
- Direct-load CLS: 0.005268 on `/blog`, 0.005888 on page 5, and 0.002180 through
  a category/page canonical redirect, all well below 0.10.

## Route and state verification

- Base collection: 53 published articles, page 01/06, showing 01-09. Page 1
  contains one featured article plus eight latest cards.
- Pages 2-5 contain nine cards each. Page 6 contains eight cards, shows 46-53,
  and renders Next as non-interactive.
- All 14 category filters returned matching content. Counts range from one to
  twelve on the first page; singular categories correctly say `01 article`.
- Invalid repeated category parameters show the designed unknown-category state
  with no falsely selected filter.
- `/blog?page=1` -> `/blog`; page 999 -> page 5; a page beyond a one-page
  category -> that category's first page.
- `/blog`, page 2, valid category, invalid category, legacy category redirect,
  and RSS routes returned their expected responses.
- Browser console: no application errors, hydration failures, or asset errors.

## Static verification

- TypeScript: passed with zero errors.
- Targeted ESLint across all eight Blog implementation files: passed.
- `git diff --check`: passed.
- Final independent code review: no remaining Blog-index implementation
  findings.

## Intentional variations

- The Blog keeps a horizontally scrollable category rail because fourteen
  category controls cannot remain legible in one phone row. Keyboard focus
  scrolls off-screen categories into view.
- The first article uses a horizontal feature card from `md`; latest articles
  use one, two, and three columns at base, `md`, and `lg` respectively.
- Pagination wraps to two orderly lines on phones rather than shrinking 32px
  controls or 11px labels.
- Search remains site-wide and opens the locked Search modal; Blog does not
  duplicate that search implementation.

## Nine-per-page amendment - 2026-09-04

The owner set the Blog archive to exactly nine articles per page. All six pages
were verified at 1440x900, 768x1024, 390x844, 375x667, and 360x640 in both
themes, covering 60 route/viewport/theme states:

- Page 1: 01-09, one featured card plus eight grid cards.
- Page 2: 10-18, nine grid cards.
- Page 3: 19-27, nine grid cards.
- Page 4: 28-36, nine grid cards.
- Page 5: 37-45, nine grid cards.
- Page 6: 46-53, eight grid cards.

Across the archive there are 53 unique article URLs, zero duplicates, zero
document overflow, correct windowed pagination/ellipsis states, and correct
disabled Previous/Next boundaries. TypeScript, targeted ESLint,
`git diff --check`, routes, and browser console checks passed.

## Remaining owner decision

The index UI, behavior, states, and responsive implementation are
production-ready. The complete Blog publication cannot honestly be called
accurate or legally production-ready until ownership of imported third-party
articles is resolved. The options are to unpublish them, or add verified author,
license, canonical-source, and attribution data and correct the affected
summaries. No destructive content change was made without owner direction.
