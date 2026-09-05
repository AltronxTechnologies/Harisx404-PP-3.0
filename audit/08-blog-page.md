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
- Added six-page pagination with ten items on the first page and nine on later
  pages, plus bounded page links, real disabled
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

- Base collection: 53 published articles, page 01/06, showing 01-10. Page 1
  contains one featured article plus nine latest cards, completing a 3x3 grid.
- Pages 2-5 contain nine cards each. Page 6 contains seven cards, shows 47-53,
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

## Completed-first-grid pagination amendment - 2026-09-04

The owner set the first Blog page to ten articles so its one featured card is
followed by a complete nine-card grid. Later pages use nine articles. The six
pages require the following distribution:

- Page 1: 01-10, one featured card plus nine grid cards.
- Page 2: 11-19, nine grid cards.
- Page 3: 20-28, nine grid cards.
- Page 4: 29-37, nine grid cards.
- Page 5: 38-46, nine grid cards.
- Page 6: 47-53, seven grid cards.

Across the archive there are 53 unique article URLs, zero duplicates, zero
document overflow, correct windowed pagination/ellipsis states, and correct
disabled Previous/Next boundaries. TypeScript, targeted ESLint,
`git diff --check`, routes, and browser console checks passed.

## Card reaction summaries - 2026-09-04

Blog cards now support a compact, display-only social-proof pill backed by the
existing article reaction system:

- Up to three non-zero reaction glyphs overlap inside a 28px neutral pill,
  followed by the aggregate total.
- The pill is omitted when an article has no reactions or reaction data is
  unavailable, so empty counts do not add noise.
- The entire card remains one valid link. Reactions are submitted only inside
  the article, avoiding nested controls and accidental card-level reactions.
- Assistive technology receives the total, per-type breakdown, and instruction
  to open the article to react through `role="img"` and an accessible label.
- Counts for the visible 10 or 9 articles are loaded in one batched query, not
  one request per card. Query failure is optional and never blocks the Blog.
- Tied reaction counts use a fixed type order, preventing glyphs from changing
  order between requests.

The reaction backend was hardened alongside the card summary. The migration at
`migrations/2026_article_reactions.sql` creates or upgrades the aggregate table,
deduplicates existing rows under a migration lock, adds validation and unique
constraints, adds per-visitor reaction markers, and installs a security-definer
atomic adjustment function restricted to the service role. The server action
validates published article slugs through that function, uses per-visitor
idempotency, returns the committed count to correct stale clients, and only
updates cookies after a successful mutation.

The owner applied the reaction migration on 2026-09-04. A reversible live test
added one Insightful reaction through the article control, verified the featured
card rendered `💡 1` with the accessible label `1 reaction: 1 insightful. Open
the article to react.`, then removed it. Both `article_reactions` and
`article_reaction_visitors` were confirmed back at zero rows after cleanup; no
fabricated production counts remain.

Static checks and the final independent feature review passed with no findings.
Before the migration was applied, responsive fail-open verification passed at 1440,
768, 390, 375, and 360px in both themes with zero card, footer, or document
overflow and no browser-console errors.

## Device-specific pagination amendment - 2026-09-04

The owner approved separate archive densities at the existing `lg` breakpoint:

- Laptop/desktop at 1024px and above: page 1 has one featured plus nine grid
  cards; later pages contain nine cards. Ranges are 01-10, 11-19, 20-28,
  29-37, 38-46, and 47-53.
- Tablet/mobile below 1024px: page 1 has one featured plus six grid cards;
  later pages contain eight cards. Ranges are 01-07, 08-15, 16-23, 24-31,
  32-39, 40-47, and 48-53.

The compact mode is URL-backed so filters and pagination remain stable. A
`matchMedia` listener updates it exactly once when crossing 1024px and maps the
current first article into the corresponding destination page. Wrong-mode
server content is hidden during the one-time synchronization, and a short
status reserves the layout instead of flashing the other device's cards.
Compact variants are `noindex, follow` and canonicalize to `/blog`.

Both distributions contain all 53 article URLs exactly once. Initial mobile
loads, repeated breakpoint crossings, page boundaries, category filters,
windowed pagination, cached transitions, light/dark themes, and 1440, 1024,
768, 390, 375, and 360px layouts passed with zero document overflow or console
errors. The Blog index and reaction summaries use tagged caches invalidated by
admin mutations and successful reactions.

## Card text-panel geometry amendment - 2026-09-04

The owner standardized every Blog card text panel to the same content order:

1. Reading time at the top-left and publication date at the top-right.
2. Article title.
3. Article description.
4. Reserved reaction summary at the bottom-left and `Read article` at the
   bottom-right.

Card copy is now adaptive inside one fixed combined block. A one-line title
allows four description lines; a two-line title allows three. Titles never
exceed two lines and excess title/description copy uses ellipsis. Grid and
mobile-featured copy reserve 142px; tablet/desktop featured copy reserves 150px,
exactly covering the worst-case
line geometry including the 12px title offset. Every footer reserves 28px for
reaction state even when no reactions exist. Visible reaction totals cap at
`999+`, while assistive technology receives the complete count and per-type
breakdown.

Measured verification across all six required viewports in both themes passed:

- Grid-row height spread: 0px at every multi-column viewport.
- Standard card title: 24px/500 with a 28px line height.
- Featured card title: 26px/500 with a 32px line height.
- Description: 15px/400 with a 22px line height; four lines after a one-line
  title and three lines after a two-line title.
- Featured media minimum reduced from 360px to 320px.
- Footer/action right-edge delta: 0px.
- Card, panel, and document overflow: 0px.
- The reaction pill always presents all four reaction types on every card,
  including total `0`; zero-count glyphs are subdued while non-zero glyphs
  remain full strength.
- A synthetic four-glyph `999+` pill measured 104px wide and retained 30.8px
  clearance from `Read article` in the narrowest 360px footer.
- The stress pill changed neither card height nor action position.

TypeScript, targeted ESLint, `git diff --check`, long-title/description clamps,
zero-reaction cards, light/dark geometry, and responsive alignment passed.

## Card polish and local search amendment - 2026-09-04

- Increased every standard card title from 22px to 24px and the featured title
  from 24px to 26px, retaining weight 500 and exact two-line clamps.
- Recalculated fixed adaptive copy blocks to 142px for standard/mobile-featured
  cards and 150px for tablet/desktop featured cards. A one-line title exposes
  four 15px/22px description lines; a two-line title exposes three, with no
  hydration-driven card movement.
- Restored the prior 25x25px rounded, dashed-border, animated dual-arrow box
  beside `Read article`.
- Refined the 28px reaction pill with a quiet neutral surface, inset highlight,
  all four overlapping reaction glyphs, subdued zero states, and full accessible
  totals. The pill appears on every card, including articles with zero reactions.
- Replaced the Blog toolbar's global Search-modal launcher with a real 32px-high
  Blog search field. It filters published articles by title, summary, and
  category without opening a modal.
- Search is URL-backed through `q`, debounced by 300ms, capped and canonicalized
  at 100 characters, resets pagination, combines with categories, and preserves
  compact mode. Query pages are `noindex, follow` and canonicalize to `/blog`.
- Clear search preserves the active category. Pagination preserves query,
  category, page, and responsive mode. Zero, one, and many results share one
  persistent polite live-status announcement.
- Guarded pending-query and `popstate` synchronization preserve focus and prevent
  stale RSC responses or unresolved replace transitions from overwriting newer
  typing or Back/Forward destinations.

Playwright verified title, summary, category, and combined searches; clear,
pagination, compact mode, no-results, one-result, many-result, Back/Forward,
100-character input, delayed RSC races, focus retention, and single live-region
behavior. Across all six required viewports in both themes, row-height spread,
card/pill/arrow clipping, and document overflow were zero. Standard titles
measured 24px, featured titles 26px, and every arrow measured 25x25px.

## Final responsive card and search refinement - 2026-09-04

- Laptop/desktop featured cards are 326px high. Tablet featured cards use a
  260px media minimum and content-driven panel, measuring 286px at 768px.
- On phones, the featured card now uses the exact standard-card geometry:
  16:11 media, 12px shell inset, 24px/500 title with 28px line height, 142px
  adaptive copy block, 11px metadata/action type, and matching panel padding.
- Laptop search increased from 224px to 256px. Tablet/mobile widths remain fluid
  and unchanged. The search keeps its rounded rectangular shape.
- Search hover and pointer-active borders match Projects exactly:
  `neutral-400/70` in light mode and `white/25` in dark mode. Keyboard focus
  retains a dedicated 2px ring.
- Search placeholder colors match the locked Search modal: neutral-400 in light
  mode and white/30 in dark mode.
- Card descriptions shorter than the display target are enriched from the real
  checked-in article prose. Up to the first two eligible prose paragraphs are
  cleaned of MDX formatting and used only when they provide a fuller, more
  representative card excerpt. No filler or fabricated copy is seeded.
- Root Blog featured selection is reaction-driven. The highest aggregate total
  is placed first; equal or zero totals retain newest-first ordering. Category
  and search result pages continue using their newest matching article.
- Reaction pills reuse the exact four SVG components from article reactions at
  16x16px. All four are colored and visible on every card; zero totals render
  `0`, while real totals remain accurate and accessible.
- `Read article` and its restored 25x25px dashed arrow use a shared centered flex
  line with `leading-none`; measured optical/geometric center delta is 0px.

Final measurements passed in both themes at all six required viewports:

- Featured height: 326px at 1440/1024, 286px at 768, then 464.13px, 453.81px,
  and 443.5px at 390, 375, and 360 respectively.
- Search: 256x32px at 1440/1024; 630px, 288px, 273px, and 258px wide at 768,
  390, 375, and 360 respectively.
- Grid row-height spread: 0px.
- Arrow center delta: 0px.
- Document/card overflow and unintended clipping: 0px.
- Placeholder colors: `rgb(163,163,163)` light and `white/30` dark.
- All card pills contained four SVGs with the same paths and active colors as
  the article controls. Existing nonzero totals were preserved; zero-reaction
  cards correctly displayed `0`.
- Local search, focus retention, URL state, and live result announcement passed.
- TypeScript, targeted ESLint, `git diff --check`, and final independent code
  review passed with no findings.

## Featured badge and resilient-state amendment - 2026-09-04

- Added the locked Home Blog image-overlay badge treatment to the featured
  image, labelled `Featured`: 12px top/left inset, 10px mono uppercase label,
  rounded pill, backdrop blur, white/30 border, and black/70 surface. The darker
  surface guarantees 8.45:1 worst-case contrast over a white image.
- Root featured selection was verified against live aggregate data: the current
  four-reaction article outranks the one-reaction article and renders under
  `Most reacted article`. Zero/tied totals retain newest-first order.
- Search success and failure paths were verified in both themes at all six
  required viewports. Found results retain focus and announce their count;
  no-match and invalid-category panels use distinct, non-contradictory copy and
  a working `View all articles` recovery action.
- A genuinely empty publication takes precedence over query/category state and
  uses a non-circular `Go home` recovery action. The Blog data error boundary
  uses the same centered card language, 46/56px title scale, 15px supporting
  copy, and primary/secondary action hierarchy.
- No-result panels measure 768px max width on desktop, 670px at 768, and 328,
  313, and 298px on phones, with zero center delta or overflow.
- Blog loading now mirrors the final responsive header, stacked/inline toolbar,
  featured section label, image, adaptive copy reserve, reaction/action footer,
  and 326/286/mobile featured geometry. Loading-to-resolved rectangle deltas for
  header, toolbar, featured shell, and media are exactly 0px at 360, 390, 640,
  768, 1024, and 1440px.

## Unified Blog state panels - 2026-09-04

No-results, invalid-category, empty-publication, and Blog-unavailable surfaces
now share `app/components/blog/BlogStatePanel.tsx`, preventing typography and
spacing drift. The component uses the locked heading system exactly:

- Kicker: Reference Core Mono, 12px/16px, weight 500, uppercase, 1.2px tracking.
- Kicker-to-heading gap: 16px.
- Heading: Instrument Serif, 46px/46px on phones and 56px/56px from `md`, weight
  500, tight mobile tracking and -1.5px desktop tracking, max width 576px.
- Heading-to-copy gap: 16px.
- Supporting copy: Reference Outfit, 15px/24px, weight 400.
- Copy-to-actions gap: 28px; wrapped action gap: 12px.

The Blog page supplies an h2 state heading beneath its h1; the route error
boundary supplies an h1. Empty-publication, invalid-category, search-no-result,
and generic-empty copy and recovery actions have explicit precedence.

Measured across no-result and invalid-category states at all six required
viewports in both themes: panel max width 768px, heading max width 576px, zero
horizontal center offset, zero clipping, and zero document overflow. Computed
type, tracking, line height, and gaps are identical to locked `SectionHeading`.

## Gradient states, filter fog, and search ranking - 2026-09-04

- Every shared Blog state heading now follows the locked sentence-plus-accent
  composition. The concise phrases `different.`, `category.`, `being prepared.`,
  `available here.`, and `be loaded.` use the same italic animated gradient,
  padding, and text-shadow removal as the main Blog and locked page headings.
- No-results and invalid-category measurements remain exact: 12px/500 kicker,
  16px kicker-heading gap, 46/56px heading at weight 500, 16px heading-copy gap,
  and 15px/24px supporting copy in both themes at all required viewports.
- The category rail now uses separate 32px page-colored fog overlays rather than
  masking interactive content. At the start only the right fog appears; in the
  middle both appear; at the end only the left appears; when all filters fit,
  neither appears.
- Fade edges recalculate on scroll, resize, category changes, and web-font
  readiness. Overlays are pointer-transparent. Pointer-down causes zero rail
  movement, partially covered filters remain clickable, and keyboard-focused
  filters scroll fully clear of the fog.
- Unselected keyboard focus uses the Projects-style border. Selected focus uses
  a visible 2px inset page-background ring, avoiding clipped external outlines.
- Search-result featuring now ranks the complete matching set by aggregate
  reactions. The current `writing` search correctly promotes the four-reaction
  article over four zero-reaction matches. An all-zero `mocking` search correctly
  falls back to its newest result. Remaining matches stay in standard cards.

Light/dark testing at all required viewports passed with correct start/middle/end
fog states, zero blocked clicks, fully visible keyboard focus, zero document
overflow, and no console errors.

The two fog nodes remain mounted and animate only opacity, eliminating abrupt
appearance/removal. Both now use the owner-approved final opacity of 0.8 and a
200ms standard ease. Start/middle/end states, click-through behavior, keyboard
focus clearance, and light/dark theme matching were reverified after the change.

## Final Blog-to-CTA rhythm confirmation - 2026-09-04

- Page top offset: 56px.
- Kicker-to-heading and heading-to-copy gaps: 16px / 16px.
- Header-to-filter and filter-to-content gaps: 56px / 24px.
- Featured-to-latest section spacing: 56px.
- Final article/pagination block to CTA: 112px.
- CTA internal bottom space: 80px mobile / 112px desktop.
- CTA bottom to Footer: 0px, identical to Home, About, and Projects.

Blog renders the same locked `CtaSection` DOM and complete class string as the
reference pages. The redundant Blog-only 96px page-bottom padding was removed.
Measured CTA and Footer spacing now matches all locked references exactly in
light/dark mobile and desktop layouts, with zero overflow.

## Description-height reduction - 2026-09-04

The owner reduced every card description by one line. One-line titles now show
up to four description lines; two-line titles show up to three. The exact fixed
copy reserves are 142px for standard/mobile-featured cards and 150px for
tablet/desktop featured cards, reducing card height by 22px while preserving
two-line title ellipses, footer alignment, equal grid rows, and stable hydration.

## Final header copy - 2026-09-05

- Kicker: `The Blog`.
- Heading: `Learn the reasoning behind the code.` with `the code.` using the
  locked italic animated gradient treatment.
- Supporting text: `Straightforward explanations of engineering decisions,
  useful patterns, trade-offs, and lessons from practice.`

The selected copy retains the locked 12px/500 kicker, 46/56px heading, 15/24px
supporting text, and 16px internal gaps. The loading header uses invisible exact
typography copies rather than breakpoint guesses; loading and resolved heights
match at 1440, 768, 640, 390, 360, and 320px in both themes.

## Dummy-content note

The owner confirmed the imported articles are temporary dummy content used to
exercise full production behavior and will be removed before launch. Their
editorial ownership is therefore not a blocker for the Blog implementation
audit; no destructive content changes were made during engineering validation.
