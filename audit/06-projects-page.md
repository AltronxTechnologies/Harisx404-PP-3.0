# Projects Index Audit

- Route: `/projects`
- Audit date: 2026-09-03
- Status: Owner-approved baseline; controls and result states temporarily unlocked
- Primary files: `app/projects/page.tsx`, `app/projects/ProjectsIndex.tsx`,
  `app/projects/loading.tsx`, `app/projects/error.tsx`
- Shared reference component: `app/components/home/CaseStudies.tsx`

## Scope and constraints

This audit covers the Projects index page only. Navbar, Search modal, Reach Out
modal, Footer, Home, About, and their shared presentation remain locked. The
Projects index reuses `CaseStudyCard` from the locked homepage, so findings must
be fixed through Projects-specific markup or props unless the owner separately
unlocks the shared component.

The stale comments at the top of `app/projects/page.tsx` and
`app/projects/ProjectsIndex.tsx` call this page locked, but the final production
lock in `LOCKED_PERFECT.md` does not include `/projects`. The owner explicitly
requested this audit in the current conversation.

## Baseline verification

### Static and route checks

- `npx tsc --noEmit`: passed with 0 errors.
- Targeted ESLint for `page.tsx` and `ProjectsIndex.tsx`: passed with 0 errors.
- `/projects`: HTTP 200.
- `/projects?tag=Web`: HTTP 200.
- `/projects?q=security`: HTTP 200.
- All ten project-detail links rendered by the index returned HTTP 200.
- Browser console: no runtime errors, hydration errors, or missing assets.
- Browser console: one non-blocking development performance warning reports
  the first project cover as LCP without Next Image `priority`.
- All rendered project images completed with non-zero natural dimensions.

### Responsive matrix

Measured in light and dark themes:

| Viewport | Page overflow | Content clipping | Targets below 24px | Search size | Result |
|---|---:|---:|---:|---:|---|
| 1440x900 | 0 | 0 | 0 | 224x32 | Pass |
| 1024x768 | 0 | 0 | 0 | 224x32 | Pass |
| 768x1024 | 0 | 0 | 0 | 439x32 | Pass |
| 390x844 | 0 | 0 | 0 | 298x32 | Pass |
| 375x667 | 0 | 0 | 0 | 298x32 | Pass |
| 360x640 | 0 | 0 | 0 | 298x32 | Pass |

At 768px the blueprint background and compass circle deliberately extend past
the viewport, but they are `aria-hidden`, clipped by the global frame, and do
not increase document `scrollWidth`. No real content overflows.

## Findings

### P1. Project headings skip from h1 to h3 - resolved

- Severity: Medium
- Evidence: The accessibility tree renders `Things I've built` as `h1`, then
  every project title as `h3`. The next `h2` is the final CTA.
- Cause: `CaseStudyCard` always renders its cover heading as `h3`, while the
  Projects page has no intervening Projects collection `h2`.
- Impact: Screen-reader heading navigation presents an incomplete hierarchy.
- Safe scoped fix: Add a visually hidden `h2` such as `Project collection`
  immediately before the results grid and associate the results region with it.
  This avoids editing the locked shared card component.
- Resolution: `ProjectsIndex` is now a labelled `section` with a visually
  hidden `Project collection` h2. The accessibility tree reads h1, h2, then
  project h3 headings without a visible layout change.

### P2. More-tags popup has incomplete focus and popup semantics - resolved

- Severity: Medium
- Evidence: ArrowDown correctly moves focus from More to the first tag. Escape
  closes the popup, but focus falls back to `body` rather than returning to the
  More trigger.
- Evidence: The trigger exposes `aria-haspopup="true"`, which means a menu-like
  popup, while the popup itself uses `role="group"` and its rows remain ordinary
  buttons despite implementing menu-style Arrow/Home/End navigation.
- Impact: Keyboard users lose their place after dismissal, and assistive
  technology receives mismatched popup semantics.
- Safe scoped fix: Store a trigger ref, restore focus on Escape, use
  `aria-haspopup="menu"`, and give the popup/rows internally consistent menu
  semantics. Keep click and outside-dismiss behavior unchanged.
- Resolution: Escape now closes the popup and restores focus to More. The
  accessibility tree exposes a menu with menuitemradio rows and checked state;
  ArrowUp/ArrowDown/Home/End behavior remains intact.

### P3. Search focus indicator is insufficient in light mode - resolved

- Severity: Medium
- Evidence: The search input removes its outline. On keyboard focus in light
  mode it has no box shadow and changes only to `#A5AEB8` on white.
- Evidence: That focus border is below the 3:1 non-text UI contrast requirement.
  Dark mode uses `#737373` and is materially clearer.
- Impact: Keyboard focus can be difficult to locate in the light theme.
- Safe scoped fix: Add a neutral 1px or 2px `focus-visible` outline with offset,
  matching the approved Search modal's quiet neutral focus language.
- Resolution initially used an offset outline. The owner later requested exact
  filter-hover parity. The final production audit retained the single 1px
  hairline but moved both states to `border-text-secondary`, meeting the 3:1 UI
  contrast requirement without an outline or layout change.

### P4. Loading skeleton does not match live control geometry - resolved

- Severity: Medium
- Evidence at the initial audit: the live search was 297px at 360-390px, 439px at 640-1023px, and
  224px from 1024px. `app/projects/loading.tsx` instead renders a maximum 260px
  search by default and 224px from `sm` upward.
- Impact: A route transition can visibly resize and reflow the controls when
  loading content is replaced by the page.
- Safe scoped fix: Mirror the live `297px -> 439px -> 224px` responsive widths
  and the live control-row spacing in `loading.tsx`.
- Resolution: The skeleton now uses the same search breakpoints, 32px control
  height, row gap, and grouped five-pill structure as the live controls.

### P5. Mobile page-title size differs from the approved page baseline - resolved

- Severity: Owner decision
- Evidence: `Things I've built` measures 36px below `md`; approved standalone
  page titles use 46px mobile and 56px from `md`.
- Intentional-variation concern: At 360px, 36px keeps the title on one line
  inside the drawing-sheet frame. Raising it to 46px may wrap the title and
  materially change the composition.
- Recommendation: Do not change automatically. Owner should choose between
  strict 46px cross-page consistency and the current one-line blueprint title.
- Resolution: The owner later requested exact cross-page parity. The title now
  uses explicit Instrument Serif at 46px mobile/56px desktop, line-height 1,
  tight tracking, and the shared padded gradient accent. At 360px it wraps into
  two balanced lines, matching other page-heading behavior.

### P6. Interactive filter labels are below the audit legibility threshold - resolved

- Severity: Low
- Evidence: All, AI/ML, Cybersecurity, Web, and More render at 10px below
  `sm`; the audit protocol flags real text below approximately 11px.
- Context: Decorative project technology chips also use 10px by intentional
  site convention. The concern here is specifically the primary interactive
  filter row, not every micro-label.
- Safe scoped fix: Use 11px for filter controls at all widths and confirm the
  complete row still fits at 360px without reducing spacing or target size.
- Resolution: Filters now use 11px at every width. Mobile horizontal padding
  was reduced by 2px per side only, retaining 32px-high targets and a single
  298px-wide row at 360px with no overflow.

### P7. Search icon duplicates the established icon implementation - resolved

- Severity: Low maintenance debt
- Evidence: `ProjectsIndex.tsx` contains a bespoke search SVG while the Navbar,
  Search modal, Reach Out modal, and Blog filter use the shared Lucide search
  glyph. This is already recorded in `DESIGN_DEBT.md`.
- Impact: No current visual defect, but stroke/geometry can drift independently.
- Safe scoped fix: Replace only this local SVG with the existing Lucide icon at
  the same 16px size and 1.5 stroke treatment.
- Resolution: Projects now uses Lucide Search at the same 16px/1.5 geometry.

### P8. Pagination comments contradict runtime behavior - resolved

- Severity: Low maintenance debt
- Evidence: `PER_PAGE` is 8, and runtime correctly shows `01-08 of 10`, but
  comments in `ProjectsIndex.tsx` still say six projects per page.
- Safe scoped fix: Correct comments only; do not alter pagination behavior.
- Resolution: Both comments now correctly state eight projects per page.

### Deferred font-source note

The page title and project titles use `font-display`, whose `Reference Bluu
Next` alias currently points to an Instrument Serif Regular binary hosted by
the reference website. The owner explicitly deferred the site-wide official
font migration, so this audit does not propose changing font sources.

## Passed design and behavior checks

- Light and dark compositions are balanced and remain aligned with the site's
  neutral blueprint/drawing language.
- Header grid, compass geometry, crop marks, staggered desktop columns, dotted
  spine, and junction nodes remain visually coherent.
- Page background, primary/secondary text, borders, and dividers use the
  established tokens where appropriate.
- Main body copy is 14-15px and readable; card descriptions use 15px.
- Search and filter rows align at every breakpoint.
- No arbitrary off-scale radius was found in Projects-owned files.
- Search debounce updates the URL and resets pagination.
- `/` focuses search; Enter blurs; first Escape clears and second Escape blurs.
- Search no-results state is designed and readable.
- Cross-tag rescue suggestions work and preserve the search query.
- Filter state, search state, and pagination survive refresh through the URL.
- Details exposes `aria-expanded`, changes its label to Hide details, and keeps
  only one project panel open at a time.
- More-tags ArrowUp/ArrowDown/Home/End navigation works.
- Pagination correctly renders 8 items on page 1 and 2 items on page 2, with
  continuous indexes 01-10 and a live result summary.
- Previous/Next disabled states are exposed and non-interactive.
- Reduced-motion branches exist for result transitions, card reveal, pill
  movement, smooth scrolling, and shared card motion.
- Images retain their card aspect ratios without visible clipping or failure.
- Closing CTA spacing remains 112px and visually matches the site baseline.

## Intentional variations to preserve

- The drawing-sheet hero is a Projects-specific visual treatment, not a shared
  SectionHeading clone.
- Decorative background geometry may extend beyond the content frame because
  it is clipped and non-semantic.
- The staggered two-column layout begins only at `xl`; the long single column at
  tablet widths is intentional and prevents cramped cards.
- Project technology chips may retain the site's established micro-label scale;
  only primary filter controls are flagged for review.
- Card cover colors and white overlay text are content surfaces, so page-level
  text tokens must not replace their tuned contrast colors.

## Applied fix set

1. Add the missing results-region `h2` without changing visible layout.
2. Restore focus and normalize semantics for the More-tags popup.
3. Add a neutral keyboard focus treatment to project search.
4. Match the loading skeleton to live responsive control widths.
5. Align the title to the shared 46px mobile/56px desktop heading system.
6. Raise primary filter labels from 10px to 11px on mobile.
7. Replace the bespoke search SVG with Lucide at identical geometry.
8. Correct stale six-per-page comments to eight.

## Post-fix verification

- TypeScript: 0 errors.
- Targeted ESLint: 0 errors.
- `git diff --check`: passed.
- The required six-viewports matrix remains free of document overflow, real
  content clipping, and targets below 24px.
- At 360px the filter row measures 298x32px with all five labels at 11px.
- Search focus uses the same theme-aware thin hairline as filter hover.
- More-menu Escape dismissal restores focus to the collapsed trigger.
- Accessibility hierarchy is h1 -> hidden region h2 -> card h3.
- Search, filtering, rescue suggestions, details accordion, and pagination
  remain functional after the changes.
- No locked page or shared locked component was modified.

### Residual locked-component item

The first project cover can become the Largest Contentful Paint image, and
Next.js recommends `priority`. That image is rendered inside the locked,
homepage-shared `CaseStudyCard`. Adding a Projects-only optional priority prop
would be a clean non-visual optimization, but it was deliberately not attempted
without explicit permission to touch the shared locked file. The item is tracked
in `DESIGN_DEBT.md`.

## Microscopic parity addendum - 2026-09-03

This second pass was requested after owner review. It compares individual
Projects elements directly against the locked homepage source rather than only
checking general conformance.

### Hero comparison

| Element | Homepage source | Projects page | Assessment |
|---|---|---|---|
| Kicker | 12px/500 Core Mono, uppercase, `tracking-widest`, secondary token | Same family/size/weight/color, but `tracking-[0.35em]` | Real tracking difference; Projects-only fix possible |
| Heading family | Explicit Instrument Serif variable | Explicit Instrument Serif variable | Parity passes |
| Heading size | 46px mobile, 56px from `md` | 46px mobile, 56px from `md` | Parity passes |
| Heading line height | 1.0 | 1.0 | Parity passes |
| Heading tracking | Tight; -1.5px from `md` | Tight; -1.5px from `md` | Parity passes |
| Accent | `text-colorfull`, padded, no text shadow | Same | Parity passes |
| Intro copy | No Case Studies subtitle | 15px/400 Outfit, 24px line height, secondary, max-width 576px | Approved principal prose; appropriate standalone context |
| Decoration | Plain shared heading | Grid, compass, crop marks, atmosphere | Intentional Projects identity |

The kicker and heading now use the same typography and internal spacing as the
approved shared system. The Projects-specific copy, supporting paragraph, and
drawing-sheet decoration preserve the page's distinct identity.

### Search and filtering verification

Passed states:

- Case-insensitive search across title, tagline, description, tech, and tags.
- 300ms debounce, URL persistence, refresh-safe state, and page reset to 1.
- Found-results state and dotted description highlighting.
- No-results state with the exact query shown.
- Cross-tag rescue suggestions and one-click recovery.
- Clear icon, Clear filters, Enter blur, and two-stage Escape behavior.
- All, AI/ML, Cybersecurity, Web, and More filters with pressed/checked state.
- More menu counts, sorted long-tail tags, outside click, Escape, Arrow keys,
  Home/End, and restored trigger focus.
- Eight-item pagination, continuous numbering, and correct 09-10 second page.
- 11px mobile filter labels remain one 298x32px row at 360px.

New Projects-only findings:

1. The local input state is initialized from `q` but is not synchronized when
   URL query state changes externally. Filtering reads `q` while the field
   displays `query`, so browser/history-driven query changes can display stale
   text. A guarded URL-to-input synchronization is needed.
2. Result changes are announced only when multi-page pagination exists. Zero,
   one-page, and no-results transitions need a persistent visually hidden
   `aria-live="polite"` status.
3. The source comment promises back/forward-friendly state, but all controls use
   `router.replace`; this is refresh/share friendly but does not create history
   entries for filter/page changes. Either behavior or documentation must be
   made accurate.
4. The More popup remains open if keyboard focus leaves it with Tab. This is not
   a trapping defect, but closing on focus departure would make the dropdown
   behavior more complete.

### Project card microscopic comparison

| Card part | Homepage | Projects | Assessment |
|---|---|---|---|
| Index, tags, quarter | Shared output | Shared output, pagination continues numbering | Exact component parity |
| Meta divider | None | Dotted rule and central junction/spine | Intentional blueprint structure |
| Cover content | Tagline in 16-20px Outfit | Project title in 19-30px display serif | Intentional hierarchy; owner says title is correct |
| Cover arrow | 24x16 stroked SVG | 22px text glyph `->` | Visible mismatch flagged by owner |
| Outer frame | 22px panel, 8px light/dark frame, tuned shadows | Same | Parity passes |
| Screenshot frame | 3px white/70, 11px top radius, shared aspect ratio | Same | Parity passes |
| Description | 15px, relaxed, secondary, three-line clamp | Same; visible at `xl` and search-highlightable | Typography parity passes |
| Details/View actions | Shared 12px mono recipe | Same, visible at every Projects breakpoint | Parity passes |
| Expanded bullets | 14px mobile, 15px from `sm`, 24px line height | Same | Parity passes |
| Tech chips | 10px mono, rounded-md, brand treatment | Same first five plus `+N` | Parity passes |
| Card spacing | 80px stack rhythm | 80px stack rhythm | Parity passes |
| Desktop composition | Main cards plus sticky detail panel | Equal staggered columns and spine | Intentional page-level difference |

Shared-component findings requiring explicit unlock permission:

1. Match the Projects cover arrow to the homepage's stroked SVG while retaining
   the approved Projects title. The clean implementation is a Projects-only
   arrow variant prop on `CaseStudyCard`.
2. Projects cover links currently announce duplicated names such as
   `IntruShield NIDS IntruShield NIDS` because both the visible h3 and image alt
   contain the title. A Projects-only decorative-image/alt prop would fix it.
3. Reduced-motion disables transition duration but does not neutralize image
   scale, translation, and rotation. Fixing it affects the shared card motion.
4. A Projects-only first-image priority prop would resolve the existing LCP
   warning without changing homepage behavior.
5. A context-specific image `sizes` prop should use near-full-width sizing from
   769-1279px, where Projects remains one column; the current shared hint says
   50vw above 768px.

### Loading-state parity

The controls now match, but the rest of the loading skeleton remains structurally
different:

- Skeleton content is capped at `max-w-6xl`; live content is not.
- Skeleton header omits the drawing grid, compass, crop marks, and live top
  spacing geometry.
- Skeleton cards omit the 8px frame, in-cover title/arrow, dotted meta divider,
  desktop junctions, and central spine.
- Skeleton cover uses 16px radius while the live outer panel uses 22px.

These can be corrected entirely in `app/projects/loading.tsx` without touching
locked code.

### Second-pass decision gate

Projects-only changes safe to implement after owner approval:

1. Guardedly synchronize URL `q` back into the visible search field.
2. Add a persistent polite result-count status.
3. Make URL-history behavior or its documentation truthful.
4. Close More when keyboard focus leaves the popup.
5. Rebuild the loading skeleton to mirror live header/card geometry.
6. Optionally align kicker tracking with homepage `tracking-widest`.

Shared `CaseStudyCard` changes require an explicit temporary unlock limited to
Projects-only optional props. No shared edit was made during this addendum.

## Microscopic parity resolution - 2026-09-03

The owner approved every item above and temporarily unlocked the shared Home
project-card component, with the requirement that Home and Projects retain
their intentional differences.

### Completed hero and control work

- `Selected Projects` now uses the same 12px/500 Core Mono,
  `tracking-widest`, and secondary-color kicker recipe as Home/About.
- The Projects heading now follows the exact 46px mobile/56px desktop shared
  Instrument Serif recipe. Its copy and blueprint decoration remain
  Projects-specific; the supporting paragraph uses approved 15px principal
  prose with a 16px heading gap.
- URL query changes now synchronize back into the visible search input.
- Search typing uses history replacement; tag and pagination actions use
  history pushes. Browser Back restored `?tag=Web&q=Next.js` together with the
  visible `Next.js` input and three matching cards in live verification.
- A persistent polite status now announces zero, one, and many result counts.
- The More menu closes when Tab moves focus beyond its last item; Escape still
  restores focus to the trigger.

### Completed card work

- Projects retains its title-led cover; Home retains its existing content and
  sticky-detail composition.
- Projects now requests the same 24x16 stroked line arrow used by Home instead
  of the text glyph.
- Projects screenshots are decorative when the visible h3 already names the
  project. The cover link now announces `IntruShield NIDS` once rather than
  twice. Homepage image alt text remains unchanged.
- Projects supplies context-correct image sizing through 1279px.
- The first visible Projects image receives priority; the Next.js LCP warning
  no longer appears.
- All new behavior is exposed through optional `CaseStudyCard` props, leaving
  homepage defaults unchanged.

### Touch and motion behavior

- The old touch behavior kept a card transformed for as long as it remained in
  the viewport center band.
- Both Home and Projects cards now follow the Behind the Site interaction
  language: entering the middle 40% viewport band triggers a 1.2-second preview
  of the hover choreography, then the card returns to its exact resting state.
- The preview re-arms only after the card leaves and re-enters the band.
- Desktop pointer hover remains continuous and unchanged.
- Reduced-motion users receive neither the scroll preview nor image
  scale/translate/rotation hover motion.
- Measured touch simulation on both routes:
  - Preview panel transform: `translateY(-6px)`.
  - Preview image transform: approximately `scale(1.045) rotate(2deg)` with the
    existing directional offset.
  - Returning state interpolates smoothly.
  - Final panel transform: `none`.
  - Final image transform: identity matrix.

### Loading parity

- The loading route now reproduces the blueprint grid, atmosphere, compass,
  crop marks, and live header spacing.
- Controls use the exact responsive search widths and five-pill grouping.
- Skeleton cards now include the 26.5px metadata row, dotted divider, 22px
  outer panel, 8px light/dark frame, title/arrow row, screenshot frame,
  description, and action placeholders.
- Desktop loading uses the live full width, staggered 213px second column, 24px
  column gap, and central spine instead of the old `max-w-6xl` generic grid.

### Final measured verification

- Responsive matrix: 1440x900, 1024x768, 768x1024, 390x844, 375x667, and
  360x640.
- Both themes: zero document overflow and zero real-content overflow.
- All viewports: zero interactive targets below 24px.
- Mobile filter row: 298x32px at 360, 375, and 390px.
- Hero typography: 12px/500 kicker, 16px gap, 46px/56px Instrument Serif
  heading, 16px gap, and 15px/24px supporting copy.
- Accessibility tree: h1 -> collection h2 -> project h3; persistent status;
  single-name cover links; menu/menuitemradio semantics.
- Home and Projects routes: HTTP 200.
- TypeScript: 0 errors.
- Targeted ESLint: 0 errors.
- `git diff --check`: passed.
- Browser console: no application errors, hydration errors, missing assets, or
  LCP warning. Homepage sandbox-only WebGL warnings remain unrelated.

### Owner-directed search-focus amendment

After final review, the offset search outline was removed. Search hover and
keyboard focus use the same thin `text-secondary` border as filter-tag hover.
Computed verification showed a transparent outline and only the 1px border
change; the 32px control geometry remains unchanged. The light border is
`#5E5F6E`, correcting the lower-contrast `#A5AEB8` trial.

## Final production audit - 2026-09-04

The complete Projects index was re-audited after all owner-directed polish.

- TypeScript, targeted ESLint, and `git diff --check`: passed with zero errors.
- `/`, `/projects`, pagination, combined filter/search, and all ten rendered
  project-detail routes: HTTP 200.
- Required matrix rechecked in light and dark: 1440x900, 1024x768, 768x1024,
  390x844, 375x667, and 360x640.
- Every viewport: document `scrollWidth` equals viewport width, zero real-content
  overflow, zero clipped controls, and zero interactive targets below 24px.
- Hero measurements: 12px/500 kicker, 16px gap, 46px mobile/56px desktop
  Instrument Serif heading at line-height 1, 16px gap, 15px/24px supporting
  copy. Mobile two-line wrap is balanced and unclipped.
- Search/filter hairline: one pixel, no ring/glow/outline/layout shift; both use
  `text-secondary` for compliant light/dark contrast.
- Found, zero-result, rescue, clear, URL refresh, Back/Forward, active filter,
  More menu, keyboard navigation, focus restoration/departure, Details
  accordion, and pagination states: passed.
- Card title, line arrow, metadata, date, description, disclosure actions,
  bullets, technology chips, image frame, responsive image hints, and first
  image priority: passed.
- Touch scroll preview on Home and Projects reaches the intended hover transform
  and returns to exact rest after 1.2 seconds. Desktop hover and reduced-motion
  safeguards remain correct.
- Loading state mirrors the live blueprint header, controls, card frame, and
  staggered desktop layout.
- Browser console: no application errors, hydration errors, missing assets, or
  LCP warning.

No known Projects-index issue remains. The owner approved and production-locked
the page on 2026-09-04; see `LOCKED_PERFECT.md` entry 24.

## Secondary-control border addendum - 2026-09-04

The owner-authorized site-wide secondary-control pass aligned Projects search,
unselected filters, rescue tags, Clear filters, and unselected pagination
controls to identical hover and pointer-active border colors:

- Light: `border-neutral-400/70`.
- Dark: `border-white/25`.
- Selected filters and the current pagination page retain their stronger
  inverted treatment.
- Search retains its stronger existing keyboard-focus border.
- Disabled pagination remains non-interactive and visually subdued.

At 360px in dark mode, an unselected filter measured 49x32px both before and
after hover; its computed border changed from `rgba(255,255,255,0.1)` to
`rgba(255,255,255,0.25)` without layout shift. The complete six-viewport,
light/dark route matrix remained free of document overflow or new clipping.
TypeScript, targeted ESLint, and `git diff --check` passed after the amendment.

## Blog control-system parity amendment - 2026-09-05

The owner temporarily unlocked Projects search/filter controls, pagination, and
loading geometry to align them with the locked Blog page.

- Toolbar now uses the same full-width border-y frame, 16px vertical padding,
  12px compact row gap, and responsive order: search first on compact screens,
  filters first on desktop.
- Search now matches Blog at 32px high, 8px radius, 256px desktop width, fluid
  compact width, 11px mono text, placeholder colors, 24px clear control, and
  identical resting/hover/active/focus border states.
- Project filters retain compact phone padding so All, three primary domains,
  and More remain visible without clipping the popup. From `sm`, their padding
  and tracking match Blog. Selected states use the same static inverted pill.
- Long selected More labels truncate inside an 80px phone / 128px `sm+` bound;
  full text remains available through `title` and popup rows.
- More uses complete menu-button behavior: click, outside dismissal, Escape,
  ArrowDown/ArrowUp/Home/End, selection focus restoration, and one roving
  `tabIndex=0` item.
- Pagination now uses Blog's 32px numbered controls, 88px Previous/Next controls,
  selected inversion, disabled buttons, five-page window threshold, mobile
  number/action rows, 16px summary gap, and plain live range summary.
- Pagination begins 56px after project results instead of the former 80px.
- Loading search/filter geometry mirrors the amended toolbar and measured pill
  widths.

Verified at 1440, 768, 390, 360, and 320px in light/dark: zero document
overflow, long-tag containment, exact 32px search/control height, correct
responsive order, functional search/filter URL state, Clear filters race-free,
More keyboard semantics, pagination 01-08 / 09-10 ranges, and no normal-mode
console errors. TypeScript, targeted ESLint, and `git diff --check` passed.

Project header, cards, content, details, CTA, and all other locked presentation
were not changed. Final Projects re-lock awaits owner visual approval.

## Mobile control-edge alignment - 2026-09-04

The mobile search width was increased by one pixel, from 297px to 298px, to
match the exact rendered width of the five-filter row. The loading skeleton was
updated to the same value. Measured results:

- 360px viewport: both rows `left: 31px`, `right: 329px`, `width: 298px`.
- 375px viewport: both rows `left: 38.5px`, `right: 336.5px`, `width: 298px`.
- 390px viewport: both rows `left: 46px`, `right: 344px`, `width: 298px`.
- Tablet behavior remains on the unchanged 439px search breakpoint.

There is no document overflow or control wrapping. TypeScript, targeted ESLint,
`git diff --check`, and the browser console check passed.

## Scrollable filters and unified state panels - 2026-09-05

The owner clarified that Projects filters must follow the Blog interaction
exactly rather than retaining the earlier Projects-specific More menu. This
amendment supersedes every More-menu note above.

- Removed the More button, popup, primary/overflow tag split, menu state,
  dismissal handlers, and menu keyboard behavior.
- All available project tags now render in one 32px-high horizontally scrollable
  pill rail, matching Blog's spacing, hidden scrollbar, selected treatment,
  keyboard focus auto-scroll, and 32px left/right edge fog.
- Loading controls now show the same clipped horizontal pill-rail geometry.
- Search no-results, unknown-tag, empty-collection, and generic no-project states
  now use the shared Blog state panel with matching kicker, 46/56px serif
  heading, gradient emphasis, supporting copy, card shell, and recovery action.
- Added `app/projects/error.tsx` with the same accessible unavailable-state
  structure, focus management, retry action, and home action as Blog.

Focused verification passed at 1440px and 360px in the running preview. The
compact view shows search first, the scrollable filter rail second, no More
control, and the complete matching no-results hierarchy. TypeScript, targeted
ESLint, and `git diff --check` pass. Playwright Chromium was unavailable because
of a sandbox launcher failure, so visual verification used the running Firefox
preview instead.
