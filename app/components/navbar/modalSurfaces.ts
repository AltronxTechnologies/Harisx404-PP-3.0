/**
 * Single source of truth for the shared Reach Out / Search modal surfaces.
 *
 * These strings were previously copy-pasted into both ReachOutModal.tsx and
 * SearchModal.tsx with a comment claiming they were "identical". A comment is
 * not a constraint: the theme-toggle glyph size and a stray `ring-1` on the
 * pill both drifted apart exactly this way. Import from here instead of
 * re-declaring, so the two modals cannot diverge again.
 *
 * Radius contract: 24px outer tier (`rounded-3xl`), 16px inner tier
 * (`rounded-2xl`). Do not introduce a third tier in modal chrome.
 */

/** 72px square control button in the detached top row (theme, search, close). */
export const circleBtn =
  "flex size-[72px] shrink-0 items-center justify-center rounded-3xl bg-white dark:bg-[#1c1c1c] " +
  "text-neutral-600 dark:text-white/80 shadow-lg shadow-black/5 dark:shadow-none " +
  "transition-colors hover:text-neutral-900 dark:hover:text-white active:scale-95";

/**
 * The flexible pill that sits left of the control cluster: the search input in
 * SearchModal, the "Reach out" title row in ReachOutModal. No `ring-1` here -
 * a hairline ring is a regression, see LOCKED_PERFECT entry 2.
 */
export const pillSurface =
  "flex h-[72px] min-w-0 flex-1 items-center gap-2.5 rounded-3xl bg-white px-5 " +
  "shadow-lg shadow-black/5 dark:bg-[#1c1c1c] dark:shadow-none";

/** The main card below the top row. */
export const cardShell =
  "rounded-3xl bg-white shadow-2xl ring-1 ring-neutral-200/70 " +
  "dark:bg-[#1a1a1a] dark:ring-white/[0.08]";

/** Glyph size for the three top-row control buttons, and their stroke weight. */
export const CONTROL_ICON = "size-8";
export const CONTROL_ICON_STROKE = 2;
