# 🔒 LOCKED_PERFECT.md — Approved & Frozen Components

> **RULE FOR ALL AI ASSISTANTS AND CONTRIBUTORS:**
> Everything listed in this file has been reviewed live by the owner (Muhammad Haris)
> and declared **PERFECT**. Do **NOT** modify, refactor, restyle, rename, move, or
> "improve" anything listed here — not even indirectly (shared CSS, shared constants,
> parent layout, global styles) — **without the owner's explicit permission in the
> current conversation.** If a requested change would touch a locked item, STOP and
> ask first.
>
> When the owner says something new is "perfect", append a new entry here (with date,
> files, exact values, and the commit hash) in the same change.

> **See also: [`DESIGN_DEBT.md`](./DESIGN_DEBT.md)** — audited but not-yet-fixed
> design inconsistencies (radius tiers, duplicated controls, page-hero kickers),
> plus an explicit list of differences that are **intentional** and must NOT be
> "fixed". Read it before starting any consistency work.

> **See also: [`AUDIT_TESTING.md`](./AUDIT_TESTING.md)** — the pre-lock audit
> protocol. Triggered by the owner saying **"Audit testing &lt;target&gt;"**. Nothing
> new gets locked until it passes all 12 phases. It also carries the reference
> baseline (radius tiers, colour tokens, icon sizes, shared modules) extracted
> from the components locked in entry 22.

---

## How to use this file

1. Before editing any file, check if it (or a selector/constant it contains) appears below.
2. If yes → ask the owner for permission and wait for a clear "yes" before editing.
3. Unlocking: only the owner can unlock an entry, by saying so explicitly. Record the
   unlock (date + reason) instead of deleting history.
4. New locks: add an entry using the template at the bottom.

---

## Locked entries

### 1. Reach Out modal ("Let's Connect") — LOCKED ✅ (v5 FINAL — production-signed-off)
- **Date locked:** 2026-09-01 (supersedes the 2026-08-16 lock at `5a97fe8`)
- **Status:** production-ready. Full A–Z audit passed. **Do not change anything in
  this component, or in the `.reachout-scale` blocks in `app/globals.css`, without
  explicit owner permission.**
- **Reference copy:** `.design-backups/reference/ReachOutModal.LOCKED.tsx`
  (byte-identical to the live file). All earlier explorations — v1 original,
  v2/v3 glass drawer, v4 big-glass — were **deleted** on 2026-09-01.
  This is the single source of truth.
- **This entry is the design reference for the Search modal (⌘K).** Match its
  surfaces, radii, gaps, type scale, colour tokens, control sizes and motion.
- **Files:**
  - `app/components/navbar/ReachOutModal.tsx` (entire file)
  - `app/globals.css` → the `.reachout-scale` height-step and phone-miniature blocks

#### Frozen spec (do not change)

**Shell & position**
  - Container: `fixed inset-0 z-[7000] flex items-end justify-center px-4 pt-4 pb-[15px]`
    — bottom-anchored, 15px to the viewport edge
  - Backdrop: `bg-black/50 backdrop-blur-[3.85px]`, fade `duration: 0.2`
  - Wrapper: `mx-3 w-[92vw] max-w-[792px]` + `.reachout-scale`, inline
    `transformOrigin: "bottom center"`
  - Card shell: `rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-neutral-200/70
    dark:bg-[#1a1a1a] dark:ring-white/[0.08]`

**Radii — two tiers only**
  - Outer tier **24px** (`rounded-3xl`): card shell, "Reach out" pill, all three control buttons
  - Inner tier **16px** (`rounded-2xl`): message panel, action cards, social cards

**Top row**
  - Row: `mb-4 flex items-center gap-[7px]`; the three control buttons are a
    nested `flex shrink-0 items-center gap-[7px]` group — **all four gaps are 7px**
  - "Reach out" pill: `h-[72px] min-w-0 flex-1` (absorbs all remaining width,
    ~570px at 1440), `bg-white dark:bg-[#1c1c1c]`, `px-5`, label `text-xl font-medium`
  - Control buttons (Search / Theme / Close): `size-[72px]`, icons `size-8`,
    `shadow-lg shadow-black/5 dark:shadow-none`, `active:scale-95`
  - Back chevron inside the pill: `size-10` visual box, `size-7` icon, plus
    `relative before:absolute before:-inset-1.5 before:content-['']` which extends
    the **hit area** to a 52px box with no visual or layout change. This is what
    keeps the control above the WCAG 2.5.8 24px floor once the phone miniature
    scales it down — **do not remove the pseudo-element.**

**Message panel**
  - `rounded-2xl bg-neutral-100/90 p-6 dark:bg-white/[0.07]` + matching border
  - Avatar `size-11`, heading `text-lg font-semibold`, "I read every one" `text-base`
  - Textarea `mt-5 text-xl`, **fixed at exactly `rows={3}`** with
    `overflow-y-auto` + `.composer-scroll` (thin 3px thumb, matches the TOC
    treatment). Enter submits / Shift+Enter newline, mailto.
    **There is deliberately NO auto-grow.** The original `autoGrow` set
    `height = scrollHeight` with no cap, so a 4th line grew the whole modal
    (and a single line collapsed the field from 3 rows to 1). The field height —
    and therefore the modal height — is now constant; overflow scrolls inside
    the field. Do not reintroduce auto-grow.
  - kbd hints `text-sm` with `text-[13px]` mono keycaps
  - **Continue button** — filled, clearly visible in both themes:
    - enabled light: `border-neutral-900 bg-neutral-900 text-white font-medium shadow-sm`,
      hover `bg-neutral-800` (17.9:1 label, 16.2:1 vs panel)
    - disabled light: `border-neutral-300 bg-neutral-200 text-neutral-500`, no shadow
    - dark: `bg-white/15` → hover `/25`; disabled `bg-white/[0.06] text-white/40`
    - geometry `rounded-xl px-5 py-2.5 text-lg`, arrow `size-5`

**Action cards** — `mt-4 grid grid-cols-2 gap-4` (equal width, always side-by-side)
  - Shared surface: `rounded-2xl bg-neutral-100/90 dark:bg-white/[0.07] p-6 text-center`
    + `border-neutral-200/60 dark:border-white/[0.06]` + hover step
  - **Both cards share one type scale and one icon box so they align exactly**
    (fixed 2026-09-01 — they were 7.7px / 14.4px out of line before):
    - icon block: `mb-4 flex h-[68px] items-center justify-center` in BOTH cards
    - heading: `text-2xl font-semibold` in BOTH cards
    - sub-line: `text-base` in BOTH cards
    - **Never give one card a different heading/sub size or icon-box height.**
  - **Both cards use the identical icon treatment** (unified 2026-09-01): a
    `size-[68px]` `rounded-full` circle, `bg-neutral-200/80 dark:bg-white/10`,
    `group-hover:bg-neutral-300/80 dark:group-hover:bg-white/15`, containing a
    `size-7` icon. Both cards carry the `group` class so the hover step matches.
    **Never give one card a bare icon and the other a circle.**
  - Resume card → `/resume`: `FileText`, sub-line "Experience · skills · work"
  - Email card: `Mail`, swapped for `Check` (emerald-500) for 2s after a
    successful copy; mono email `break-all`; the heading carries
    `aria-live="polite"` so the "Copied!" state is announced to screen readers
  - **Both card headings use the kicker colour `text-text-secondary`** (owner request
    2026-09-01) — hierarchy is carried by size + weight, not colour

**Social row** — `mt-4 grid grid-cols-3 gap-4`, inline brand SVGs `size-7`,
  labels `text-base font-medium`, `target=_blank rel=noopener`

**Colour tokens**
  - Primary copy: `text-neutral-900 dark:text-white`
  - **All secondary copy uses `text-text-secondary`** (#5E5F6E / #a1a1a1).
    `text-text-tertiary` is **banned in this component** — it measured 2.25:1 in
    light mode (AA fail) and was removed on 2026-09-01.
  - Only accent: emerald-500 on the "Copied!" check. No gradients.

**Motion & interaction**
  - Entry: `y: 24, scale: 0.96`, spring `stiffness: 300, damping: 30`
  - Swipe-to-dismiss: `drag="y"`, >120px or fast flick closes; upward blocked
  - Click-away: backdrop or the gap between top bar and card closes (self-target check)
  - Escape closes; `body.modal-open` scroll lock while open

**Accessibility**
  - `role="dialog" aria-modal="true" aria-label="Reach out" tabIndex={-1}`
  - **Focus trap:** Tab and Shift+Tab both wrap inside the dialog; focus is
    restored to the trigger on close
  - **Initial focus is pointer-gated** — the textarea is focused only when
    `matchMedia("(hover: hover) and (pointer: fine)")` matches. On touch screens
    focus goes to the dialog container instead, so **the soft keyboard never opens
    by itself**. Do not remove this gate.

**Phone rendering (owner-approved miniature — do not replace with a mobile layout)**
  - ≤640px: `.reachout-scale` is pinned to `width: 660px` and scaled down so the
    phone shows an exact miniature of the desktop card.
  - **The 660px layout width is load-bearing.** Changing it (e.g. to 792px) shrinks
    all text even if the rendered card width is preserved — this was tried on
    2026-09-01 and reverted. Scale steps: 0.88 @≤640, 0.82 @≤600, 0.76 @≤560,
    0.70 @≤520, 0.645 @≤480, 0.60 @≤440, 0.575 @≤412, 0.555 @≤390, 0.53 @≤375,
    0.49 @≤360, 0.45 @≤330.
  - Height steps (all widths): 0.96 @≤940 … 0.37 @≤390 — unchanged.

#### Audit results at lock time (2026-09-01)
  - **Contrast:** 0 failures, light **and** dark. All body copy ≥ 6.29:1,
    primary headings 17.9:1. Verified programmatically against actual
    computed colours, not estimated.
  - **Focus trap:** wraps forward and backward. 10 focusable elements.
  - **A11y:** role/aria-modal/aria-label/tabindex present, scroll lock active,
    every button labelled, all external links `noopener`, all images have alt,
    heading order H3 → H4 → H4 (no skips).
  - **Typography:** 2 families (Outfit sans + Core Mono for keycaps — matches the
    site), weights 400/500/600 only, sizes 14/16/18/20/24/26 — clean scale.
  - **Geometry:** radii 24/24/24/16 as specced; gaps 7/7/16/16 as specced;
    all padding/margin on the 4px grid apart from the intentional 7px and 15px.
  - **Viewports verified:** 1440×900, 390×844, 375×667, 360×640 — both themes.
    No clipping, no horizontal overflow, email address on one line everywhere.
  - **Known accepted trade-off (not a defect, do not "fix" without asking):**
    On a 375px phone the miniature renders the email address and social labels at
    ~8.5px and card headings at ~13.8px. This is inherent to the owner-approved
    miniature approach and is the size the owner signed off on. The email *tap
    target* is 162x111px, so the copy action is unaffected — only the confirmation
    text is small.
  - `tsc --noEmit` clean, `eslint` clean, **`next build` succeeds**. No console
    errors attributable to this component (only unrelated WebGL warnings from the
    `cobe` globe under software rendering).

#### Corrections & fixes after the initial lock (2026-09-01, same day)
  - **Action-card alignment — FIXED.** The two cards were measurably out of line:
    icon block heights 73px vs 65.3px, headings 7.7px apart, sub-lines 14.4px
    apart, caused by different icon-wrapper structures (`pt-2` + auto height vs a
    fixed `size-[68px]` box) and different type sizes (26/18 vs 24/16). Both cards
    now use `h-[68px]` icon blocks, `text-2xl` headings and `text-base` sub-lines.
    Re-measured: **all four deltas are 0.0px** at 1440 and at 375.
  - **Email icon made identical to the resume icon — DONE.** The email card had a
    bare `size-[54px]` outline glyph while the resume card had a `size-7` glyph in
    a `size-[68px]` tinted circle, so the two cards read as different components.
    Both now use the same circle + `size-7` icon. Re-measured: circles 65.3px and
    icons 26.9px in both, identical background and radius, all six alignment
    deltas 0.0px, icon-on-circle contrast 8.23:1.
  - **BUG: "Copied!" timeout leaked — FIXED.** `setTimeout` was never cleared, so
    closing the modal within 2s of copying left a pending state update against an
    unmounted subtree. Now tracked in a ref, cleared on re-copy and on unmount.
  - **BUG: copy confirmation was silent to screen readers — FIXED.** The label
    swap to "Copied!" had no live region; added `aria-live="polite"`.
  - **BUG: message field grew the whole modal — FIXED (owner-reported).** Typing a
    4th line pushed the modal taller and eventually past the viewport. The field is
    now pinned to 3 rows with internal scrolling. Verified: modal height constant
    at 722px across empty / 1 / 3 / 4 / 12 lines and 1800 wrapped characters;
    scrollbar appears from the 4th line onward.
  - **Back chevron hit area — FIXED.** The original audit note claiming it "passes
    WCAG 2.5.8 AA" was **wrong**: it measured the 40px CSS box, not the rendered
    size. Under the 0.53 phone scale it rendered at **21.2px**, below the 24px AA
    floor. An invisible `before:-inset-1.5` pseudo-element now extends the hit area
    to a 52px box → **28.2px rendered**, verified by hit-testing with
    `elementFromPoint` (registers up to 3px outside the visual box). No visual or
    layout change.

### 2. Search modal (⌘K) — LOCKED ✅ (v2 — realigned to Reach Out v5)
- **Date locked:** 2026-09-01 (supersedes the 2026-08-16 / `5a97fe8` lock)
- **Locked at commit:** `758fa56` (geometry landed earlier in `1bce9b9`)
- **Reference:** entry 1 (Reach Out v5) is the source of truth. Where a class
  string exists in both files it must be **byte-identical**.
- **Files:**
  - `app/components/navbar/SearchModal.tsx` (entire file)
- **Frozen spec (do not change):**
  - Shell, byte-identical to Reach Out: overlay `fixed inset-0 z-[7000] flex
    items-end justify-center px-4 pt-4 pb-[15px] outline-none` + `tabIndex={-1}`;
    wrapper `mx-3 w-[92vw] max-w-[792px]` + `.reachout-scale` with
    `transformOrigin: bottom center`; backdrop `bg-black/50
    backdrop-blur-[3.85px]` fading over 0.2s; entry `y: 24, scale: 0.96` on a
    `stiffness: 300 / damping: 30` spring.
  - Both modals use a **detached top row above a separate card** (the top row is
    a sibling of the card, not a child of it): row `mb-4 flex items-center
    gap-[7px]`, with the three controls in a nested `flex shrink-0 items-center
    gap-[7px]`.
  - Search pill: `flex h-[72px] min-w-0 flex-1 items-center gap-2.5 rounded-3xl
    bg-white px-5 shadow-lg shadow-black/5 dark:bg-[#1c1c1c] dark:shadow-none`
    — **NO `ring-1`.** A ring here is a regression; it was re-introduced once and
    removed again in `758fa56`. Same rule for the `size-[72px]` control buttons,
    whose `circleBtn` string is byte-identical to Reach Out's.
  - Control buttons `size-[72px] rounded-3xl` with `size-8` glyphs; pill search
    icon `size-7`; input `text-xl`.
  - Card: `overflow-hidden rounded-3xl bg-white shadow-2xl ring-1
    ring-neutral-200/70 dark:bg-[#1a1a1a] dark:ring-white/[0.08]` wrapping ONE
    inner scroll area `max-h-[634px] overflow-y-auto p-4`. The `overflow-hidden`
    + inner padding is a **deliberate** divergence from Reach Out's `p-4` card:
    it clips the scroll area to the 24px radius so the corners are never
    flattened and the scrollbar sits at the panel edge. 634px is measured to make
    total modal height equal Reach Out's (722px at 1440×900, 15px bottom gap).
  - **Category dividers** (owner-requested 2026-09-01): the scroll container
    carries `[&>section+section]:border-t [&>section+section]:border-border-primary`
    — a 1px rule between category groups (Pages / Connect / Legal / Discover and
    the Projects / Blog Posts result groups). Uses the project-wide divider token
    `border-border-primary` (`#D6DADE` light / `rgba(255,255,255,0.1)` dark), not
    an ad-hoc colour. The `section + section` selector is load-bearing: the first
    visible group must never get a leading rule, so filtering by a query cannot
    leave a stray divider at the top. Fragments render no DOM node, which is why
    every `<section>` is a direct child of the scroll container. Do not convert
    this to `divide-y` — that would also draw lines above the loader, the error
    message and the empty state.
  - Radii: two tiers only — 24px outer (overlay card, pill, controls),
    16px inner (`rounded-2xl` row tiles). Gaps: 7px control row, 16px elsewhere.
  - Surfaces are **opaque**. No `backdrop-blur` and no `/85` translucency
    anywhere inside the shell; use the `bg-white` / `dark:bg-[#1c1c1c]` /
    `dark:bg-[#1a1a1a]` tiers.
  - Colour: `text-text-tertiary` is **banned** (2.25:1, fails AA). All secondary
    copy — clear-X, type badges, `ArrowUpRight`, section headings — uses
    `text-text-secondary` (6.29:1).
  - Row tile: `flex items-center gap-4 rounded-2xl px-3 py-3 text-xl font-medium
    … hover:bg-neutral-200/80 dark:hover:bg-white/[0.1]`.
  - Icon tile: `flex size-12 shrink-0 items-center justify-center rounded-full
    bg-neutral-200/80 text-neutral-700 dark:bg-white/10 dark:text-white/80`
    — filled, **no ring**, same recipe as the Reach Out action-card circle.
    Active row brightens the fill to `dark:bg-white/[0.12]` only; no ring colour
    utilities (they are inert without a ring width).
  - Glyphs: row icons `size-6`, trailing/clear icons `size-5`. Section headings
    `px-4 pb-2 pt-4 text-lg font-medium`. Empty-state circle `size-[68px]` filled
    with a `size-7` glyph, matching the action-card circles.
  - **No `max-sm:` overrides** (0 in the file). Small viewports are handled
    entirely by the `.reachout-scale` steps (0.88@≤640 … 0.45@≤330).
  - Focus trap identical to Reach Out: `dialogRef`, `tabIndex={-1}`, Tab and
    Shift+Tab wrap within the dialog, focus restored to the opener on close.
  - First-appearance content (no scrolling): Pages (Home, About, Projects, Blog,
    Community Wall, Contact, Credentials, Resume, Links) + Connect (GitHub,
    LinkedIn, X). Reached by scrolling: Legal (Privacy Policy, Terms of Use) +
    Discover (Blog RSS, Sitemap).
  - Click-away: identical outside-click close behavior as the Reach Out modal
    — added 2026-08-16 with owner permission
  - Swipe-to-dismiss: dragging/swiping the card downward (>120px or fast flick)
    closes the modal like professional bottom sheets; upward drag is blocked,
    small drags spring back (framer-motion drag="y" on the wrapper)
    — added 2026-08-16 with owner permission
  - Rotating placeholders: search input cycles through 8 hint placeholders
    (random start, changes every 2.6s while empty; pauses while typing)
    — added 2026-08-16 with owner permission
  - Professional search: matched results grouped into "Projects (n)" / "Blog Posts (n)"
    sections with type badges + filtered Pages/Connect/Legal/Discover; unmatched queries
    show a polished empty state ("No results for …") with 3 pills — Browse Projects
    (/projects), Browse Posts (/blog), Get in Touch (/contact)
    — added 2026-08-16 with owner permission

#### Audit results at lock time (2026-09-01)
- **Contrast:** 0 failures in either theme (dark and light), after the
  tertiary→secondary sweep.
- **Geometry vs Reach Out, measured at 1440×900:** width 736px, height 722px,
  bottom gap 15px, overlay padding, `tabIndex`, control-row gap (7px), pill
  radius/background, control size/radius/background, card radius/background —
  **all deltas 0.0px / identical**.
- **Dead code:** 0 `max-sm:` overrides, 0 `backdrop-blur`, 0 ad-hoc muted colour
  tokens, 0 inert ring-colour utilities remaining.
- **Focus trap:** verified wrapping in both directions, focus restored on close.
- **Toolchain:** `tsc --noEmit` and `eslint` both clean.

#### Accepted, intentional divergences (documented — do NOT "fix")
1. **Type scale is narrower than Reach Out's.** In the default list state the
   Search modal renders weight 500 at 18px/20px; the empty state adds
   `text-lg font-semibold` (600). Reach Out spans 400/500/600 at
   14/16/18/20/24px. The extra 24px + 600 steps in Reach Out come from its two
   large `text-2xl` action-card headings, which have **no Search equivalent** —
   Search is a link list, not a pair of cards. Forcing a 24px/600 element into
   Search purely for scale parity would invent hierarchy that the content does
   not have. This difference is content-driven and correct.
2. **Card padding/clipping.** Reach Out uses `p-4` directly on the card; Search
   uses `overflow-hidden` on the card with `p-4` on the inner scroll container,
   because it must clip a scrollable region to the rounded corners. See the
   frozen spec above.

### 3. Modal fit-scaling system — LOCKED ✅
- **Date locked:** 2026-08-16
- **Locked at commit:** `fa4047a`
- **Files / selectors:**
  - `app/globals.css` → the `.reachout-scale` block (fine-grained steps: 0.96 @≤940px,
    0.92 @≤880, 0.87 @≤820, 0.82 @≤770, 0.77 @≤720, 0.72 @≤680, 0.67 @≤645, 0.62 @≤610)
- **Why:** verified smooth at all Chrome zoom levels on 1920×1080 @150% OS scaling and
  across mobile/tablet/desktop viewports. Changing these steps will break zoom behavior
  in BOTH modals at once.
- **Owner-approved amendment (2026-08-16):** on phones (≤640px) `.reachout-scale` keeps
  the full 660px desktop layout and is scaled down proportionally (stepped
  `translateX(-50%) scale(...)` from 0.83 @≤640 to 0.42 @≤330) so the modal is an
  exact miniature of the laptop card. Requested explicitly by the owner ("look at
  the search modal card on laptop screen i want similar on mobile according to its
  size like same each and everything"). The height-based zoom steps above remain
  untouched and still apply at widths >640px.

### 4. Navbar CTA — LOCKED ✅
- **Date locked:** 2026-08-16
- **Locked at commit:** `8190a3a`
- **Files / lines:**
  - `app/components/Navbar.tsx` → the CTA button: label **"Let's Connect"** (desktop) /
    **"Connect"** (mobile), opens the Reach Out modal
- **Do not** rename the label or change what it opens.

---

### 5. Mobile navbar pill + miniature modal system — LOCKED ✅
- **Date locked:** 2026-08-16
- **Locked at commit:** (this commit)
- **Files / selectors:**
  - `app/components/Navbar.tsx` → mobile compact pill (`md:hidden`): brand left / chevron right,
    `justify-between gap-4 min-w-[196px] pl-5 pr-4 py-1`, content cycles every 3.2s
    (Harisx404 text → theme-aware transparent logo `h-5` → "Explore now" + pulsing green dot),
    blur/slide + spin-in morphs, chevron rotates while modal open, tap opens SearchModal
  - `app/globals.css` → phone miniature block (≤640px): `.reachout-scale` keeps `width: 660px`,
    `left: 50%`, `transform: translateX(-50%) scale(s)` with steps
    0.88 @≤640 / 0.82 @≤600 / 0.76 @≤560 / 0.70 @≤520 / 0.645 @≤480 / 0.60 @≤440 /
    0.575 @≤412 / 0.555 @≤390 / 0.53 @≤375 / 0.49 @≤360 / 0.45 @≤330
  - Both modals: inner layout unconditional (no viewport `sm:` variants) so the laptop
    design renders identically at every size
- **Why:** owner declared "that 100% perfect" after the final size bump so modal text/icons
  read comfortably on phones while remaining an exact miniature of the laptop card.

### 6. Navbar — COMPLETE SYSTEM, FINAL — LOCKED ✅
- **Date locked:** 2026-08-16
- **Locked at commit:** `97e16f0` (final audit pass)
- **Scope:** `app/components/Navbar.tsx`, `.reachout-scale` blocks in `app/globals.css`,
  side-rail grid in `app/layout.tsx`
- **Laptop (lg, 1024+):** original approved pill (Home/About/Work/Blog/More/Let's Connect),
  greeting morph, hover/active bubbles + indicator line, More overlay panel
  (740px, pill-anchored, easeOutQuint), size-10 search + theme side buttons.
- **Tablet (md–lg, 768–1023):** identical to laptop, plus More panel screen-centered via
  `md:max-lg:left-[calc(50%+54px)]` (compensates 54px pill offset from side buttons).
- **Mobile (<md):** capsule pill (`!rounded-full`, 55% glass, blur-xl, gray ring,
  min-w-[182px], brand left / chevron right), content cycles 3.2s
  (Harisx404 bold gray → theme-aware transparent logo → "Explore now" + pulsing dot),
  tap opens SearchModal; interval gated to <768px.
- **Interactions (all verified):** More menu touch-safe (450ms timestamp guard vs
  hover+click double-fire), outside pointerdown + Escape close it,
  aria-haspopup/aria-expanded set; ⌘K/Ctrl+K toggles search;
  MotionConfig reducedMotion="user" wraps everything.
- **Fit-scale (globals.css):** height steps 0.96 @≤940 → 0.37 @≤390 (extended for
  landscape phones so the modal never clips), width miniature block ≤640px
  (660px layout, 0.88 @≤640 → 0.45 @≤330, translateX(-50%) centered).
- **Side rails (layout.tsx):** hatched columns on all screens — 14px phones /
  20px sm / 32px lg.
- **Why:** owner declared the navbar 100% perfect on laptop and mobile, approved the
  tablet adaptation and the full A–Z audit fixes; final audit passed every check
  (see commit history 8f3e440 → 97e16f0).

### 7. Hero typewriter headline — LOCKED ✅
- **Date locked:** 2026-08-16
- **Locked at commit:** (typing polish commit, follows 6c82fc0)
- **Files:**
  - `app/components/home/HomeHero.tsx` (HeadlineRotator component + timing constants)
  - `app/globals.css` (`hero-caret`/`hero-caret-blink`, `hero-gradient-animate`/`hero-gradient-drift`)
  - `app/data/site-content.ts` (`hero.headlines` phrases + accent keys)
- **Frozen spec (do not change):**
  - Classic typewriter cycle: line1 types ~58ms/char (±18ms human jitter) →
    260ms pause → line2 types → hold 2400ms → erase both lines in reverse
    26ms/char → 160ms → next phrase.
  - Caret: slim rounded bar in domain accent color, solid while typing,
    steps-blink while idle; rides the active line.
  - First paint (SSR) renders the full first phrase — cycle begins by holding
    then erasing (SEO/no-JS safe); aria-label always carries the full phrase.
  - Rich gradients: fullstack emerald-300→teal-400→cyan-400, cyber
    sky-300→blue-400→indigo-400, ai violet-400→fuchsia-400→pink-400; ambient
    blur-3xl domain glow crossfades behind the heading.
  - Invisible sizer (longest phrase) locks heading height; `pb-[0.15em]` on
    line2 protects italic descenders; no CSS masks (they clip glyphs).
  - prefers-reduced-motion: phrases swap statically every 4.2s, no typing.

### 8. Homepage hero system — LOCKED ✅ (final)
- **Date locked:** 2026-08-17 (owner confirmed "lock it")
- **Locked at commit:** hero-finalization commit (follows 64d938b)
- **Files:**
  - `app/components/home/HomeHero.tsx` (layout, decode headline, tagline rotator)
  - `app/components/home/DomainShowcase.tsx` (9 domain illustrations + controller)
  - `app/data/site-content.ts` (`hero.*`: headlines, statusLines, newLaunch)
- **Frozen spec (do not change):**
  - **Layout:** top row = [name "Muhammad Haris" (serif, per-line gradient)
    + divider + status rotator] · [circular portrait with rings] ·
    [New launch block]; below = full-width decode headline row with
    domain illustration on the right. Mobile (<md): capsule nav →
    portrait → name → divider → rotator → launch → headline →
    illustration, all centered.
  - **Decode headline:** glyph-scramble reveal (FRAME_MS 28, 3 frames
    per char, hold 2.6s) cycling Full stack engineer / Cybersecurity
    professional / AI engineer; line2 carries the domain gradient;
    aria-label always the real phrase; reduced-motion swaps statically.
  - **Status rotator:** pulsing emerald dot outside the overflow clip,
    3s cycle, fixed-width slot 264px base / 280px sm / 330px lg
    (base widened from 248px to fit "Full-stack · Security · AI").
  - **Domain illustrations:** 3 variants per domain rotating on each
    revisit (fullstack: brackets/DataFlow/DeviceTrio; cyber:
    radar/ShieldCheck/Fingerprint; ai: neural/OrbitCore/AiChip);
    shared fixed backdrop glow tinted with the exact headline gradient
    (brightens on hover); crossfade 0.4s; **hover plays directional
    animations backward** (radar CCW, packet server→client, check
    un-draws, orbits flip, chip pulses inward) while symmetric loops
    keep playing; brightness/saturate +10% on hover;
    prefers-reduced-motion freezes all loops.
  - **New launch block:** dot-first label row, latest published project
    auto-pulled (start_date||created_at), blue left→right hover stroke,
    static subline "Smart. Secure. Scalable.", size-6 arrow.
- **Verified before lock (owner-requested full audit):** tsc clean,
  console clean, dark+light themes, 1440/768/390 viewports, decode
  cycle across all 3 domains, illustration rotation + hover-reverse,
  mobile rotator clip fixed and measured (slot=text=264px, fits).

### 9. StatusRow — live stats bar under the hero — LOCKED ✅
- **Date locked:** 2026-08-17 (owner: "yes lock it")
- **Locked at commit:** `46070c3` (UI final at `6db43f6`)
- **Files:**
  - `app/components/home/StatusRow.tsx` (entire file)
  - `app/page.tsx` (statusData derivation: projectCount, domainCounts classifier, latest post fields)
  - `app/data/site-content.ts` (`statusRow` fallbacks: "Writing" + "Local time" w/ IANA tz)
- **Frozen spec (do not change):**
  - **Structure:** `motion.section aria-label="Current status"`, `border-y`,
    3 link cells — Local time (→/contact) · Shipped (→/projects) · Latest
    write-up (→ latest post). Explicit borders (NOT `divide-*`) so the
    hidden clock never leaves a stray separator.
  - **Grid:** mobile `grid-cols-1` stacked (write-up `border-t`);
    md `grid-cols-[auto_1fr]` (clock hidden, write-up `md:border-l`);
    lg `grid-cols-[1fr_auto_1fr]` (Shipped auto-sized + mathematically
    centered, Shipped `lg:border-l`). Content centered per cell on md+.
  - **Shipped cell:** internal `grid-cols-[auto_auto]` — row1 [● SHIPPED
    label | DomainBar], row2 [count-up "03 Projects" | chips]; the chips
    column width defines the bar width so the bar starts at "01 Web" and
    ends at "AI" exactly. DomainBar `h-1 w-full` emerald/sky/violet
    segments animating flexGrow proportionally on useInView, 0.12s stagger.
  - **Chips:** dot + CountUp (2-digit zero-pad) + name, hairline `h-3 w-px`
    separators; "Cybersecurity" on sm+, "Cyber" below sm; mobile-only
    tightening (gap-x-2, text-[11px], chip gap-1) resets at `sm:`.
  - **Live data (no extra fetches):** projectCount + domainCounts classified
    by category+title+tags regex (cyber: /cyber|security|nids|intrusion|
    packet|sniff|pentest|forensic/; ai: /\bai\b|machine.?learning|\bml\b|
    gpt|llm|neural/; else web — tech_stack deliberately excluded);
    latest published post title/href; LiveClock = Intl seconds clock in
    Asia/Karachi, hydration-safe `--:--:--` placeholder.
  - **Interactions:** hover color-wash per cell (pink/orange/blue at /[0.04])
    + corner ArrowUpRight slide-in; ping dots (pink clock, orange shipped).
  - **Verified before lock:** no clipping at 320/390/768/1024/1440, Shipped
    centered at lg+ (cellCx==secCx), label rows baseline-aligned, equal
    cell heights, tsc + console clean, both themes.

### 10. HomeBento — "Proof of work" live-data bento grid — LOCKED ✅
- **Date locked:** 2026-08-18
- **Locked at commit:** `b516984`
- **Files:**
  - `app/components/home/HomeBento.tsx` (entire file)
  - `app/page.tsx` (siteStats + projectTech build, HomeBento props)
  - `app/components/home/Testimonials.tsx` (`id="testimonials" scroll-mt-24` anchor only)
- **Frozen spec (do not change):**
  - **Section header:** SectionHeading kicker "Proof of work", heading
    "Straight from the source" (animateWords).
  - **Grid:** lg 12-col — left col-span-5 = AccountsBento(220) + GlobeBento(300);
    right col-span-7 = TechStackBento(300) + SiteStatsBento(220); gap-2;
    stagger 0.08 via bentoCardVariants. Pair heights match at every
    breakpoint: accounts=stats (240 <lg, 220 lg+; stats h-auto <sm),
    tech=globe (300 everywhere). Both stacks close flush (528 total).
  - **AccountsBento:** 5 tiles (TryHackMe/LinkedIn/GitHub/Credly/X,
    harisx404); CSS-mask icons gray→brand hex on hover; label reveals under
    tile; GitHub tile larger (index 2).
  - **GlobeBento:** cobe v2, own rAF loop **paused via IntersectionObserver
    when off-screen**; labels pinned by reading cobe's anchor divs;
    projectCity depth fade; drag-guard >4px; touch: `touch-action: pan-y`,
    pointer capture, pointercancel recovery; theme-aware palettes;
    availability pill; card links /contact.
  - **TechStackBento:** 3 marquee rows (web 40s / security 46s reversed /
    ai 43s), per-row hover pause, edge fade mask, aria-hidden duplicate
    group; **dynamic project-tech merge**: buildStackRows + normTech alias
    map + DYNAMIC_TECH_ICONS curated icons, global cross-row dedupe,
    unknown tech = dot chip; links /toolbox.
  - **SiteStatsBento:** "Shipped, counted, public" + LIVE ping pill;
    4 deep-linked tiles (Projects /projects indigo, Write-ups /blog sky,
    Wall notes /community-wall amber, Testimonials #testimonials emerald);
    CountUpValue 2-digit pad, reduced-motion jump; footer views + /stats.
  - **Hover system:** BentoCard gradient indigo-400/10; corner arrow 28px
    (16px icon); account+stat tiles lift 500ms matched.
  - **Verified before lock:** tsc/ESLint clean; both themes; 360/390/800/1440
    zero overflow, zero clip; 61fps with globe paused; touch-correct;
    all links live (03/63/00/06 + 154 views).

### 11. CaseStudies — "Featured Work" scroll-synced showcase — LOCKED ✅
- **Date locked:** 2026-08-19
- **Locked at commit:** `bf32beb`
- **Files:**
  - `app/components/home/CaseStudies.tsx` (entire file)
  - `app/page.tsx` (featured projects filter/order, images/tags/features mapping)
- **Frozen spec (do not change):**
  - **Section header:** SectionHeading kicker "Featured Work", heading
    "Things I've *shipped*" (gradient italic on "shipped"); footer link
    "See more projects" with DoubleArrow circle.
  - **Layout:** grid-cols-1 / xl:grid-cols-12 gap-10 — cards xl:col-span-7
    space-y-20; sticky aside xl:col-span-5, aria-hidden, hidden below xl.
  - **Card header:** `01` mono + dash `h-px w-4 sm:w-7` + up to 3 tag pills
    (mobile `px-2 py-0.5 text-[8px]`, sm `px-3 py-1 text-[10px]`) + year pill.
  - **Image panel:** rounded-[22px] border-8 white / dark zinc-500,
    shadow `0 0 0 0.8px rgba(0,0,0,.2), 0 9.5px 28.5px -11.4px rgba(0,0,0,.4)`,
    xl:min-h-[460px]; 6 per-project 145deg 4-stop gradients (blue, emerald,
    pink, slate, amber, violet — hueText/hueBg dashes+bullets aligned).
  - **Screenshot motion:** rest scale-[0.98]; hover/active scale-[1.03] +
    per-breakpoint lift 5/5.5/6px + slide 7/7.5/8px, ±2° alternating tilt,
    cubic-bezier(0.22,1,0.36,1); hover 700ms, touch 450ms; touch replay via
    useInView margin -18% + matchMedia(hover:none/coarse) + first-touchstart
    fallback; aspect 16/10.95 (md 16/10.835); image object-cover object-top,
    bottom bleed clipped flush by overflow-hidden.
  - **Sticky panel:** no card box; hue dash h-[3px] w-8 + title; spacing
    16/22/7/22/24px (title→desc→bullets→chips→CTA); bullets capped at 3,
    line-clamp-2; INSTANT hard-cut swap (no animation — owner rejected all
    transitions); wrapper sticky top-28 min-h-[420px]
    xl:h-[calc(100vh-9rem)] xl:items-center (CTA always visible);
    IntersectionObserver rootMargin -45%/-45% drives activeIndex, keeps last
    active in gaps.
  - **Below-xl text block:** title + desc + 3 bullets + tech chips +
    "View case study →" CTA (mt-5); xl:sr-only for a11y.
  - **TechChip:** simple-icons CSS masks in brand hex (dark variants),
    scale-110 on chip hover; unknown tech = brand dot; normTech alias map.
  - **Verified before lock:** tsc/ESLint clean; both themes; 375/768/1280/
    1440/1920 zero h-scroll, frames uniform, sticky sync + CTA in viewport;
    zero console errors; all 6 card/panel/CTA links live.

### 12. AboutTeaser — "Know about me" bio card — LOCKED ✅
- **Date locked:** 2026-08-20
- **Locked at commit:** `46a1c09`
- **Files:**
  - `app/components/home/AboutTeaser.tsx` (entire file)
  - `app/data/site-content.ts` (`aboutTeaser` block: heading, paragraphs,
    highlights, stats, socials)
- **Frozen spec (do not change):**
  - **Section header:** SectionHeading kicker "Know about me", heading
    "I solve hard problems —" + gradient italic accent "build, secure, evolve.";
    footer CTA "More about me" (mono uppercase + circled DoubleArrow → /about).
  - **Card shell:** full section width, `mt-14 rounded-3xl border
    border-border-primary bg-white p-3 dark:bg-white/[0.02]` — identical
    language to the featured blog card; NO hover lift (card isn't clickable).
  - **Inner inset:** `px-2 pb-2 pt-5 sm:px-3 lg:px-5 lg:pt-7`.
  - **Portrait:** `/harisx404.png`, rounded-2xl border, `object-cover`;
    mobile = centered square w-40/sm:w-44 above text; md+ = left column
    w-48/lg:w-52 in a `flex md:items-stretch` row so its height EXACTLY
    matches paragraph 1 (same top + bottom edge, self-adjusting).
  - **Bio text:** justified at all widths (`text-justify`) with
    `hyphens-auto break-words text-pretty`, `text-base lg:text-lg
    leading-relaxed text-text-secondary`; paragraph 2 flows full-width below
    the portrait row (`mt-5`); domains woven into sentence 1 (no separate
    grid, no "About me" label).
  - **Highlights:** phrases from `aboutTeaser.highlights` wrapped in
    `<strong class="font-medium text-text-primary">` via regex-escape
    highlightText(); list must exactly match paragraph text.
  - **Stat strip:** `grid grid-cols-3` at ALL widths, each stat centered;
    top hairline divider; value `font-display text-xl sm:text-2xl`, label
    mono uppercase `text-[9px] sm:text-[11px] tracking-[0.14em]`;
    stats = 3.5/4.0 CGPA·BSIT,UoM / Top 15% NSCT nationwide /
    96% Cybersecurity coursework.
  - **Social pills:** order GitHub → Resume → LinkedIn (Resume centered);
    INLINED brand SVGs (currentColor, no CDN); mobile = icon-only for
    GitHub/LinkedIn (sr-only labels) but Resume ALWAYS shows icon + label;
    sm+ = all icons + labels; pills centered, `rounded-full border`.
  - **Motion:** framer-motion whileInView fade/rise (y:16, 0.6s easeOut,
    once, -80px margin) on heading, card, CTA; respects
    prefers-reduced-motion.
  - **Verified before lock:** tsc/ESLint clean; dark + light; 360/420/800/
    1024/1440 zero h-scroll; card edges pixel-match blog cards; image ↔
    paragraph sync ±1px; pills ≥38px tap targets; zero console errors.

### 13. Testimonials — "Word on the street" carousel + submission pipeline — LOCKED ✅
- **Date locked:** 2026-08-20
- **Locked at commit:** _(commit containing this entry)_
- **Files:**
  - `app/components/home/Testimonials.tsx` (entire file)
  - `app/components/home/TestimonialSubmitModal.tsx` (entire file)
  - `app/lib/testimonial-actions.ts` (entire file)
  - `app/admin/(dashboard)/testimonials/page.tsx` (entire file)
  - `app/components/admin/TestimonialModerationActions.tsx` (entire file)
  - `app/api/admin/testimonials/route.ts` (entire file)
  - `app/lib/utils.ts` (fetchTestimonials only)
  - `app/data/fallback-home.ts` (testimonials block — 3 placeholders,
    no fake face photos, superseded as real approved submissions arrive)
  - `migrations/2026_testimonial_submissions.sql` (applied to prod 2026-08-20)
- **Frozen spec (do not change):**
  - **Cards:** 380px (85vw mobile), identical heights — title
    `line-clamp-2 min-h-[3.45rem] md:min-h-[4.125rem]`, quote
    `line-clamp-6 flex-1`, footer bottom-pinned behind a
    `border-t border-border-primary pt-4` divider; name/role `truncate`
    with `min-w-0`; avatar = photo → runtime-onError → initials tinted
    circle (violet/emerald/blue rotation).
  - **Carousel:** infinite circular loop (track rendered twice, spring to
    the first clone then `duration:0` snap to 0 on animationComplete,
    with a stuck-on-clone rescue inside `advance()`); 5s autoplay;
    pause on hover / explicit pause button / `prefers-reduced-motion`
    (user can still press play); manual dot clicks restart the interval;
    touch swipe (`drag="x"`, 60px offset or 400 velocity threshold);
    controls hidden below 2 items; clones `aria-hidden`; dots have 32px
    tap areas + `aria-current`, wrap for many items; gradient progress
    bar on the active dot.
  - **Content limits (3 enforcement layers — public zod, browser
    maxLength+counters, admin form zod):** headline ≤70 (2-line zone),
    quote ≤280 (6-line zone), name/role ≤80. ALL submission fields
    required (name, role, email, headline, quote).
  - **Submission pipeline:** modal (overlay `z-[6000]` above navbar
    `z-[5000]`, overlay is the scroll container so the dialog never clips,
    focus trap excl. disabled, Escape = full close+reset, focus restored
    to trigger, autofocus only on `pointer: fine`) → server action:
    zod → honeypot (fake success) → 3/10min per-IP rate limit → Gravatar
    lookup (SHA-256, `d=404`, 3s timeout) → service-role insert
    `status='pending'`, `source='public'` → awaited 5s-capped Loops
    notification to ADMIN_EMAIL (needs
    `LOOPS_TESTIMONIAL_TRANSACTIONAL_ID`). Anon key has NO insert policy;
    public SELECT only exposes `status='published'`.
  - **Admin:** `/admin/testimonials` amber "Pending review" queue (quote,
    author, mailto email, date; Approve→published / Reject→archived /
    Edit / Delete) + table with Source (Visitor/Admin) and status badges.
    `/api/admin/testimonials` — ALL verbs gated by `requireAdmin`
    (`auth.getUser()` + ADMIN_EMAIL allowlist), writes column-whitelisted
    (no mass assignment), GET limit clamped 1–200.
  - **Data:** `fetchTestimonials` published-only, no row limit,
    `display_order` then `created_at` ordering (visitor rows get 999 →
    append after curated).
  - **Verified before lock:** fresh-eyes agent code review (all critical/
    moderate findings fixed, incl. unauthenticated GET leak); curl 401 on
    all unauthenticated /api/admin/testimonials verbs; live E2E submit →
    pending row with email+source → cleanup; loop wrap at boundary;
    390×700 modal fully visible above navbar; dark+light; tsc/ESLint
    clean; zero console errors.

### 14. MySiteGrid — "Explore, experiment && say hello" — LOCKED ✅
- **Date locked:** 2026-08-20
- **Locked at commit:** _(commit containing this entry)_
- **Files:**
  - `app/components/home/MySiteGrid.tsx` (entire file)
- **Frozen spec (do not change):**
  - **Cards (owner-directed lineup):** CHANGELOG (/changelog) →
    STATS (/stats) → COMMUNITY WALL (/community-wall); 3-col md grid,
    `min-h-[260px]`, rounded-3xl, ring-1 border-primary, card-light-edge;
    dark hover LIFTS (`hover:dark:bg-white/[0.05]`, not dimmer).
  - **Decorative visuals (owner keeps them decorative, NOT live data):**
    Changelog = v2.1 (pulsing emerald dot) / v2.0 / v1.4 chips + muted
    entry bars; Stats = blue→violet→pink gradient mini bar chart +
    pulsing LIVE badge; Community Wall = 5 rotated tinted note chips.
    All `aria-hidden`; pings carry `motion-reduce:animate-none`.
  - **Copy:** CHANGELOG "Versions shipped, features brewing, and what's
    coming next." / STATS "Views, projects, and notes — measured, not
    guessed." (honesty fix — chart is decorative, /stats page is live) /
    COMMUNITY WALL "Leave a note, doodle, or hello for future visitors."
    Titles are `<h3>` (matches Testimonials heading structure).
  - **Kicker labels:** `text-text-secondary` (WCAG fix — tertiary failed
    contrast on light bg).
  - **Motion:** whileInView stagger (0.05) + per-card fade/rise; reduced
    motion keeps variants MOUNTED but swapped to no-op opacity-1
    variants (removing them post-hydration can strand cards invisible);
    hover AND focus lift y:-4 (disabled under reduced motion).
  - **A11y/UX:** `focus-visible:ring-2 ring-blue-500/40`
    (dark white/25) on cards; arrow chip visible at rest on touch
    devices via `[@media(hover:hover)]` gating; no CDN dependencies.
  - **Heading:** "&& say hello" gradient span is `md:block` (no hard
    <br/>; wraps naturally on small screens).
  - **Verified before lock:** fresh-eyes agent review (all findings
    fixed); equal card heights at 800px; zero h-overflow; dark + light;
    tsc/ESLint clean; zero console errors.

### 15. CtaSection — "From concept to creation, let's make it happen." — LOCKED ✅
- **Date locked:** 2026-08-21 (redesigned + re-locked; original lock 2026-08-20)
- **Locked at commit:** _(commit containing this entry)_
- **Files:**
  - `app/components/home/CtaSection.tsx` (entire file)
  - `app/data/site-content.ts` (cta.line1/line2/buttonLabel/email/note1)
- **Frozen spec (do not change):**
  - **Layout (top → bottom):** mono kicker `● AVAILABLE FOR OPPORTUNITIES`
    (pulsing emerald dot, site LIVE-badge language,
    `motion-reduce:animate-none`) → sentence-case serif heading "From
    concept to creation, *let's make it happen.*" (gradient-italic second
    line, `[text-wrap:balance]`, `max-w-3xl`) → button row → trust line.
  - **Section rhythm:** `pb-20 pt-6 md:pb-28 md:pt-8` — preserves the
    homepage's uniform 128px inter-section gap (do NOT restore py-24/32).
  - **Single bloom only:** one radial bottom bloom inside
    `overflow-hidden`, zero bleed into footer (footer starts at the same
    pixel). No spinning badge, no logo ornament, no "!" chip, no extra
    glow blobs — deliberately removed in the redesign.
  - **Primary button "Get In Touch" → /contact:** pill, 64px tall,
    shine sweep (700ms, `motion-reduce:hidden`) + hover arrow swap,
    focus-visible ring.
  - **Secondary copy-email button:** shows `itsharis.tech@gmail.com` with
    Copy icon; on click `navigator.clipboard.writeText` → "Copied!" state
    for 2s; catch falls back to `mailto:`. `py-[21px]` so both buttons
    are exactly 64px tall (widths intentionally differ, 205 vs 271px).
    NO aria-label/cursor-copy additions — owner rejected (reverted a45ef79).
  - **Trust line (cta.note1):** "Full-time roles & freelance projects —
    remote, worldwide." — sole homepage closer; newsletter stays on
    blog-related pages only.
  - **Motion:** entrance fade/rise gated by useReducedMotion
    (`initial={false}` when reduced).
  - **Verified before lock (final audit 2026-08-21):** 390/768/1440 in
    dark + light, zero horizontal overflow at every width; buttons stack
    and center at 390 (centers aligned within 1px); button heights 64=64,
    baseline offset 0; kicker rgb(161,161,161) in dark; Get In Touch →
    /contact live; copy-email logic verified in code (clipboard write is
    permission-blocked in headless Playwright — environment limitation,
    mailto fallback fires as designed); zero console errors (only
    pre-existing cobe/WebGL warnings); tsc/ESLint clean.

### 16. Footer — LOCKED ✅
- **Date locked:** 2026-08-21
- **Locked at commit:** _(commit containing this entry)_
- **Files:**
  - `app/components/Footer.tsx` (entire file)
  - `app/components/SocialPill.tsx` (entire file)
- **Frozen spec (do not change):**
  - **Split layout (owner's braydoncoyer-style design, finalized
    2026-08-21):** left brand block and right link columns separated
    by a vertical divider (`lg:divide-x`, `divide-border-primary/50`;
    horizontal divider stacked on mobile).
  - **Brand block (vertical flow, `lg:pr-16`):** theme-aware 40px
    logo (`/brand/harisx404 black transparent.png` in light,
    `…white transparent.png` in dark, `w-fit` link → /), bio
    paragraph `mt-6 max-w-xs leading-6 text-gray-500
    dark:text-gray-400` ("I'm Haris — a full-stack developer,
    freelancer & problem solver. Thanks for checking out my site!"),
    then `SocialPill` in `mt-8 w-fit` — dark rounded pill holding
    X / LinkedIn / GitHub icon links sourced from `siteMetadata`.
  - **Right columns (`justify-between`, edge-to-edge):**
    General (Home, About, Projects, Blog) · Specifics (Links,
    Contact, Resume, Credentials → /about#certifications) ·
    Extra (Stats, Buildlog, Community Wall). Font-semibold headings,
    plain links, comfortable tap targets.
  - **Bottom meta bar (above hatch strip):** left
    `© {new Date().getFullYear()} Harisx404. All rights reserved.`,
    right `Privacy · Terms · Attribution · Sitemap · RSS` from the
    `metaLinks` array with aria-hidden `·` separators; wraps cleanly
    on mobile.
  - **Verified before lock:** 390 + 1440 in dark and light, zero
    horizontal overflow; theme-aware logo swap works; all links
    live; tsc/ESLint clean; no console errors.
- **Amended 2026-08-21 (owner-approved final polish, commits
  `337c417`…`13d7d83`):** bio copy is now "I'm Muhammad Haris — I
  build for the web, secure what I ship, and teach machines to
  think. Three domains, one mission: solving hard problems.";
  column headings `font-medium` (500); all three dividers unified
  to `gray-200` light / `white/10` dark; X pill icon optically
  balanced (`p-[2.5px]`); pill links have focus-visible rings;
  bottom bar in `font-mono text-xs tracking-wide`; "Community\nWall"
  renders on two lines; columns wrapped in `<nav aria-label="Footer">`
  with flex-wrap for ultra-narrow screens; Sitemap/RSS are plain
  `<a>` tags.

### 17. AboutTeaser — "Know about me" homepage section — LOCKED ✅
- **Date locked:** 2026-08-21
- **Locked at commit:** `3c94545` (+ this entry's commit)
- **Files:**
  - `app/components/home/AboutTeaser.tsx` (entire file)
- **Frozen spec (do not change):**
  - **Bio card:** rounded-3xl border card (`bg-white` /
    `dark:bg-white/[0.02]`); portrait (`/harisx404.png`) and a text
    column side by side in an `items-stretch` flex row from `md` up —
    the image spans the full height of BOTH paragraphs
    (`object-cover`, rounded-2xl, border) and both paragraphs share
    the exact same left edge. Below `md`: centered square portrait
    (w-40/44) stacked above full-width text.
  - **Typography:** body `text-sm` (14px) / 400 / `leading-relaxed`,
    justified + hyphenated (owner kept justify here; Experience/Education
    body text is left-aligned), `text-text-secondary`. Highlights via
    `highlightText()` → `<strong class="font-medium text-text-primary">`
    (14px / 500).
  - **Stats strip:** 3-col grid over `border-t`; `font-display
    text-xl sm:text-2xl` values + mono 9→11px uppercase labels.
  - **Social pills:** GitHub / Resume / LinkedIn — rounded-full
    bordered pills, `text-text-secondary` at rest →
    `hover:text-text-primary` + border + shadow; icon-only on mobile
    (sr-only labels) except Resume which keeps its label; inline
    `currentColor` SVGs.
  - **CTA:** "More about me" mono-uppercase link with DoubleArrow.
  - **Verified before lock:** 390/768/1440 in dark + light, zero
    overflow, exact paragraph alignment, reduced-motion respected,
    ESLint clean, no console errors.

### 18. Homepage — FULL PAGE LOCK ✅
- **Date locked:** 2026-08-21
- **Scope:** the entire `/` homepage composition — all sections
  (entries 1–17) plus their order, spacing rhythm, and shared
  section-heading system. The owner reviewed the homepage end to end
  and declared it locked. Any change to `app/page.tsx` or any
  homepage section component requires explicit owner permission in
  the current conversation.

---

### 22. PRODUCTION FREEZE — Home page, Navbar, Search modal, Reach Out modal, Footer ✅✅
- **Date locked:** 2026-09-01
- **Locked at commit:** `c04f17f`
- **Declared by the owner:** "i do completely polish the home page, nav bar,
  search model, lets connect model, footer ; so make these perfect locked and
  dont touch anything untill i approved or permission"

> **🚫 HARD FREEZE.** These five areas are production-signed-off. Do **NOT**
> modify, refactor, restyle, rename, reorder or "improve" any of them —
> including indirectly via shared modules, tokens, global CSS or parent
> layout — without the owner's explicit permission **in the current
> conversation**. If a requested change would touch them, STOP and ask.

#### Frozen scope
| Area | Files |
|---|---|
| Home page | `app/page.tsx` + all of `app/components/home/**` (incl. `TestimonialSubmitModal.tsx`) |
| Navbar | `app/components/Navbar.tsx`, `app/components/ThemeToggle.tsx` |
| Search modal | `app/components/navbar/SearchModal.tsx` |
| Reach Out modal | `app/components/navbar/ReachOutModal.tsx` |
| Footer | `app/components/Footer.tsx`, `app/components/SocialPill.tsx` |
| Shared by the above | `app/components/navbar/modalSurfaces.ts`, `app/components/BrandGlyph.tsx` |

Entries 1 (Reach Out v5), 2 (Search modal v2), 3–18 and 21 remain in force and
are subsumed by this freeze.

#### Pre-lock cleanup performed (commit `c04f17f`)
- Navbar: all arbitrary radii moved onto the Tailwind scale — `rounded-[24px]`
  → `rounded-3xl`, `rounded-[16px]` → `rounded-2xl`, `rounded-[12px]` →
  `rounded-xl` (exact-value renames), and the off-scale `rounded-[18px]` →
  `rounded-2xl` (−2px, the only visual change). Verified live: panel 24px,
  media cards 16px, tiles 16px, icon squares 12px, morph intact.
- Reach Out modal: Continue button `rounded-xl` → `rounded-2xl`, restoring the
  strict 24/16 two-tier rule.
- TestimonialSubmitModal: `h-9 w-9`/`h-4 w-4` → `size-*`; inputs `rounded-xl`
  → `rounded-2xl` so the 16px inner tier exists.
- Search modal: local `SectionHeading` → `ResultGroupHeading` (name collision
  with the shared component).

#### Intentional variations inside the frozen scope — do NOT "fix" these
These were each checked in context and are correct. A future consistency pass
must not flatten them:
1. **HomeBento recessed tiles** use two radius pairs: 20px frame + `p-1.5/2` +
   12px inner, and 14px frame + `p-1` + 10px inner. Both obey the
   concentric-radius rule (inner = outer − padding) at different tile sizes.
   Equalising them would make one visually wrong.
2. **CaseStudies chips**: `TechChip` takes a `pill` prop — the two class
   strings are designed variants. The project tag is deliberately
   height-matched to the quarter pill (26.5px), per its own code comment.
3. **Reach Out kbd chips** stay `rounded-md` (6px): proportionally correct on a
   ~20px keycap.
4. **Navbar animated radii** (clip-path `round 22px`/`round 24px`, framer
   `borderRadius` 22px→24px) are morph endpoints, not design tokens. The
   collapsed pill is 22px, the open panel 24px. Do not "unify" them.
5. **AboutTeaser avatar** is `rounded-2xl` while other avatars are round — a
   square editorial portrait, an intentional choice.
6. **StatusRow** hover arrows and the **TestimonialSubmitModal** placeholder
   keep `text-text-tertiary`: decorative/placeholder, exempt from the AA sweep.
7. **Footer "Test Page" link** to `/test` is retained at the owner's explicit
   request ("i am using it for testing pages") despite `/test` being a
   throwaway prototype. Do not remove it.
8. **SocialPill** icons keep `text-gray-400`: they sit on an always-dark
   `#3C3C3F` chip, so the page-background token would be near-invisible.

9. **Homepage avatars are consistent — confirmed 2026-09-01.** The header
   avatar (`home/HomeHero.tsx`) and the About-section avatar
   (`home/AboutTeaser.tsx`) both use `/harisx404.png`. An earlier note wrongly
   implied a mismatch; it had confused these with two *unused* components. No
   action needed.

#### Known non-design debt still open in this scope
Recorded in `DESIGN_DEBT.md`; needs owner permission to action:
- Navbar search icon is **Phosphor** while both modals use **lucide**:
  different stroke weight at the same nominal px.
- ~~Dead code: `ProfilePicture.tsx`, `ConnectionsBento.tsx`,
  `components/FeaturedBlogCard.tsx`~~ — **deleted 2026-09-01** with owner
  approval. None were imported; the live `blog/FeaturedBlogCard.tsx` was kept.

## Entry template (copy for new locks)

```markdown
### N. <Component name> — LOCKED ✅
- **Date locked:** YYYY-MM-DD
- **Locked at commit:** `<hash>`
- **Files:**
  - `<path>` (<scope: entire file / specific lines / selector>)
- **Frozen spec (do not change):**
  - <exact values worth preserving>
```

## Unlock log

- **2026-09-02 — MAIN EXPERIENCE UNLOCKED BY OWNER FOR PRODUCTION AUDIT:**
  entries 1, 2, 3–18, 21 and 22 are temporarily unlocked for a controlled
  production-grade pass covering the Home page, Navbar, Reach Out modal,
  Search modal and Footer. The owner explicitly requested pixel-level visual
  consistency, responsive verification across all supported breakpoints, and
  complete light/dark-mode testing before these areas are frozen again.
  Existing approved values remain the starting baseline, not permission for a
  redesign. Work proceeds one target at a time under `AUDIT_TESTING.md`, with
  findings reported and independently verified before the final re-lock.

- **2026-09-02 — rejected HomeBento phone-size experiment, fully reverted:**
  an audit attempted to shrink the Accounts card's base tiles to 44px/52px.
  The owner confirmed the approved 56px tiles, 64px GitHub tile, 8px gaps and
  10px labels were visually correct and required their exact restoration.
  No `sm`/tablet/desktop values were changed. The slight crop of the outer
  decorative frames at 375/360px is an accepted part of the centered, oversized
  account-row composition; links remain fully operable and page overflow is 0px.

- **2026-09-02 — owner-authorized About production audit (entries 19, 20–22
  touched, no visual redesign):** corrected heading semantics, consolidated the
  duplicated BentoCard shell, added reduced-motion behavior to the Experience
  timeline and Home bento interactions, cleared the CTA copy timer on unmount,
  and positioned the root scroll container to satisfy Framer's offset contract.
  Normal-mode geometry, typography, spacing, colours and animation endpoints
  remain unchanged. About-specific accessibility and loading fixes are recorded
  in `AUDIT_TESTING.md` audit row 1.

- **2026-08-23 — owner-directed site-wide heading rhythm (not an unlock):**
  every section heading now sits exactly 56px above its content on the
  homepage and /about. Homepage: HomeBento space-y-8/10 -> space-y-14,
  Testimonials mt-12 -> mt-14 (CaseStudies/Writings/MySiteGrid/AboutTeaser
  already mt-14). /about: hero intro mt-8 -> mt-14, Experience Resume block
  merged into the heading wrapper (space-y-14), Education wrapper
  space-y-8 -> space-y-14. Verified 56/56/56 on /about and 56 on bento.

- **2026-08-23 — owner-directed Experience upgrade (entry 19 touched, not a
  full unlock):** highlight bullets are now a per-entry collapsible
  ("Show highlights (N)" / "Hide highlights", mono 12px eyebrow style with
  rotating chevron), collapsed by default so the timeline reads shorter.
  Handles any bullet count from the DB, 250ms height animation
  (reduced-motion = instant), real button with aria-expanded/aria-controls,
  works on touch, both themes. Bullet typography/markers inside the panel
  are byte-identical to the locked spec. Title, summary, grid, timeline
  geometry untouched.


- **2026-08-22 — owner-directed global layout tweak (not an unlock):** side
  hatch rails in `app/layout.tsx` now extend to the very top of the screen
  on all pages (the `pt-16 sm:pt-20` navbar clearance moved from `<main>`
  to the center content column). Content positions unchanged; verified on
  homepage and /about.

- **2026-08-21 — owner-directed site slim-down (entries 4/16 touched, not
  unlocks):** Removed five low-value template pages entirely — /uses,
  /bucket-list, /speaking, /toolbox, and /connections (the last also
  clears the go-live IP blocker: it contained the template author's real
  people/photos). "Book a call" renamed to "Contact" in search. Cleanup:
  Navbar More-menu Uses card removed; SearchModal entries + unused icons
  + placeholder updated; sitemap pruned; homepage Tech-stack card now
  links /about; admin Toolbox section (page + /api/admin/tools) removed;
  unused site-content toolbox/bucketList blocks deleted. Footer entry 16
  amended to the new 4/4/4 columns (General / Explore / Connect, with
  external GitHub/LinkedIn links). Attribution page KEPT deliberately —
  it credits the design inspirations and stays in the bottom bar.
  Verified: removed routes 404; home/contact 200; tsc + eslint clean.

- **2026-08-21 — owner-directed redesign (entry 15, not an unlock):** CTA
  section rebuilt for brand consistency and a stronger professional close.
  Removed: spinning "Open to work" badge, logo ornament with wing strokes,
  tilted "!" chip, three extra glow blobs, and the uppercase serif heading
  (the only uppercase-serif on the site). Now: mono kicker "Available for
  work" with pulsing emerald dot (site-wide kicker pattern), sentence-case
  serif heading with gradient-italic second line ("From concept to
  creation, *let's make it happen.*"), primary pill button (kept, with
  shine sweep + arrow swap), NEW secondary copy-email button (clipboard +
  "Copied!" state, mailto fallback), one quiet trust line, single soft
  bloom. Verified: 390/1440, dark mode, no overflow, tsc + eslint clean.

- **2026-08-21 — bug fix (entry 14, not an unlock):** Community Wall card
  sticky notes overflowed (clipped) the fixed `h-28` visual zone at the md
  breakpoint, where the card is only ~213px wide and 5 notes wrapped into
  three rows. Notes now scale per breakpoint: `h-12 w-14` base (phones),
  `md:h-9 md:w-10` (tablet, 3+2 layout), `lg:h-12 lg:w-14` (desktop,
  unchanged). Verified no overflow at 390/768/1440 in light + dark; tsc +
  eslint clean.

- **2026-08-21 — owner-directed amendment (entry 14, not an unlock):** section
  header rewritten for purpose and consistency with sibling kickers ("Proof of
  work", "Know about me"): kicker "My Site" → **"Behind the site"**; heading
  "Explore, experiment *&& say hello*" → "Built in the open, *explore && say
  hello*" (gradient-italic span now "explore && say hello", keeping the `&&`
  brand signature and the md line-break structure).

- **2026-08-21 — owner-directed amendment (entry 14, not an unlock):** Community
  Wall notes count now adapts per breakpoint so no size looks sparse: 7 notes
  on large screens (adds sky + rose tints), 6 on phones (adds sky), 5 on
  tablets (unchanged — owner called it perfect); implemented with responsive
  visibility (`md:hidden lg:inline-block` / `hidden lg:inline-block`) on the
  two extra notes. Owner follow-up: `justify-center` removed — rows flow
  left-aligned so the full first line reads centered while wrapped notes
  anchor left (no lone centered note on the second row). Verified 7/5/6
  visible at 1440/800/390.

- **2026-08-21 — owner-directed amendment (entry 14, not an unlock):** Stats
  sparkline toned down to match the subtle Buildlog/Wall visuals: at rest the
  gradient line sits at `opacity-45`, area fill at `opacity-30`, endpoint dot
  at `opacity-50` (ping halo `opacity-25`); full color returns on
  hover/`group-active` (line to 100, fill to 90, dot to 100) alongside the
  existing redraw animation, so the card is quiet at rest and comes alive on
  interaction.

- **2026-08-21 — owner-directed revert (entry 14):** Community Wall card visual
  restored to the original scattered sticky-note design (fixed `h-12 w-14`
  tinted, rotated notes in a wrapping flex row) — the owner preferred it over
  the full-width 5-column grid trial. Touch `group-active` straighten/scale
  feedback kept.

- **2026-08-21 — owner-directed amendment (entry 14, not an unlock):** MySiteGrid
  interaction fixes: (1) sparkline hover redraw now completes the FULL width on
  large screens — removed `vector-effect: non-scaling-stroke` from the animated
  path because it broke the normalized `pathLength` dash units under
  `preserveAspectRatio="none"` horizontal stretching, leaving the draw stuck
  near the middle; (2) the hover arrow chip (→) removed from all three cards
  (component deleted) per owner; (3) touch-device feedback added — every
  hover state now has an `active`/`group-active` twin (card ring, shadow, dark
  tint, Buildlog bar widths, sparkline redraw + fill, wall-note straighten) and
  framer `whileTap: {y:-4}` mirrors the hover lift, so tapping on tablets and
  phones triggers the same micro-interactions; all still `motion-safe:` gated.

- **2026-08-21 — owner-directed amendment (entry 14 + site rename, not an
  unlock):** Changelog renamed to **Buildlog** across the site: route
  `app/changelog` → `app/buildlog` with a permanent redirect
  `/changelog → /buildlog` in next.config.mjs; page title/kicker, footer link,
  sitemap, MySiteGrid card (label + href), stats ChangelogUpdatesCard link +
  label, and ChangelogBento link all updated. Admin routes and DB
  `changelogs` internals intentionally unchanged. Card visuals now fill the
  full card width at every size: Buildlog entry bars use percentage widths on
  a flex-1 track, sparkline stretches edge-to-edge at fixed 88px height
  (`preserveAspectRatio="none"` + `vector-effect: non-scaling-stroke` so the
  line stays crisp), Community Wall notes render as a 5-column grid spanning
  the row. Headlines drop the balance/width caps and wrap naturally — text
  fills the first line before breaking.

- **2026-08-21 — owner-directed amendment (entry 14, not an unlock):** MySiteGrid
  responsive pass: on single-column widths (below `md`) the grid is capped at
  `max-w-md` and centered (`mx-auto`), so between ~500–767px the cards no
  longer stretch edge-to-edge with content hugging the left — they render as
  neat centered cards; the cap is released at `md` when the 3-column layout
  kicks in. Stats sparkline widens to `max-w-[320px]` below `md`
  (`md:max-w-[250px]`) to fill the roomier single-column card. Two-line
  headlines re-verified at 390/640/768/1440.

- **2026-08-21 — owner-directed amendment (entry 14, not an unlock):** MySiteGrid
  refinement pass 2: (1) hover accent replaced — per-card colored rings
  (emerald/violet/amber) removed in favor of the sitewide neutral hairline
  `hover:ring-text-tertiary/60`, matching the Writings/blog card hover
  language; (2) headlines rebalanced to render exactly TWO lines at every
  breakpoint (390/768/1440, verified programmatically): Changelog "Every
  release, from shipped to planned.", Stats "Live metrics for views and
  write-ups.", Community Wall "Notes and hellos pinned by every visitor.";
  headings get `[text-wrap:balance] max-w-[240px] md:text-lg lg:text-2xl`
  so the two-line rhythm holds on mobile, tablet 3-col, and desktop.

- **2026-08-21 — owner-directed amendment (entry 14, not an unlock):** MySiteGrid
  copy + alignment pass: card headlines rewritten — Changelog "Every release
  documented — shipped, in progress, and planned.", Stats "Live site metrics —
  views, write-ups, and projects.", Community Wall "Notes and hellos from
  visitors, pinned for everyone." All three card visuals now sit in a uniform
  `h-28` zone (Changelog `justify-center`, Stats `items-center`, Wall
  `content-center`) so labels and headings align across the row; headings gain
  `leading-snug`; grid top margin `mt-12` → `mt-14` to match Case Studies and
  Writings. Verified light + dark and mobile (390px).

- **2026-08-21 — owner-directed amendment (entry 14, not an unlock):** MySiteGrid
  Stats card bar chart replaced by an analytics sparkline (owner approved) —
  SVG gradient line (blue→violet→pink, ids `msg-spark-stroke`/`msg-spark-fill`),
  soft area fill, dashed baseline, pink endpoint dot with ping halo; line
  redraws on hover via `sparkline-draw` keyframes in `app/globals.css`
  (`motion-safe:` gated). Owner explicitly removed the LIVE badge from this
  card. A release-timeline redesign of the Changelog card was trialed and
  reverted by the owner — the Changelog card keeps its locked version-chip +
  entry-bar visual. Visuals remain decorative by owner choice.

- **2026-08-20 — owner-directed amendment (entry 14, not an unlock):** MySiteGrid
  gains hover micro-interactions + per-card accent rings (owner picked all 4
  proposals): (1) Changelog entry bars grow/shrink to new widths with 0/75/150ms
  stagger and brighten toward text-tertiary/50; (2) Stats chart bars rise/settle
  to new heights with 0–300ms stagger; (3) Community Wall notes straighten
  (rotate-0) and scale-105 with stagger; (4) shared hover ring replaced by
  per-card accents — Changelog emerald-500/40, Stats violet-500/40, Wall
  amber-500/40. All hover states use `motion-safe:` gating (no movement under
  prefers-reduced-motion); pure CSS transitions, no new dependencies.

- **2026-08-19 — owner-directed amendment (entry 10, not an unlock):** HomeBento's
  `<section>` gains `px-2 sm:px-4`, matching the horizontal inset every other
  homepage section (Case Studies, Writings) already uses — the bento previously
  sat flush against the page container edges.

- **2026-08-19 — owner-directed amendment (site token, not an unlock):** dark-mode
  `--border-primary` brightened globally in `app/globals.css`: `#262626` → `#4d4d4d`,
  so every bordered element (bento cards, chips, stat tiles, testimonial cards,
  blog cards, status row, hero pills, etc.) matches the case-study frame hairline.
  Writings' temporary `dark:border-[#4d4d4d]` overrides were removed in favor of
  the token. Light-mode value (`#D6DADE`) unchanged.

- **2026-08-19 — owner-directed amendment (entry 11, not an unlock):** the case-study
  panel's thick outer frame darkened in dark mode: `dark:border-zinc-500` →
  `dark:border-zinc-800`, plus a 1px `#4d4d4d` hairline ring (brighter than
  the frame, per owner) added around it via
  `dark:shadow-[0_0_0_1px_#4d4d4d,…]` — matching the Writings/blog card border
  language. Light mode (8px white polaroid frame) unchanged.

- **2026-08-19 — owner-directed amendment (entry 10, not an unlock):** bento
  heading gains the sitewide gradient accent — "Straight from the *source*"
  (`text-gradient-animated font-display italic` on "source"), matching every
  other homepage SectionHeading. Also entry 11 heading finalized as
  "Selected *builds*" (kicker "Featured Work"). All other frozen specs unchanged.

- **2026-08-17 — owner-directed amendment (entries 7 & 8, not an unlock):** headline
  animation replaced: the locked typewriter (type/erase, thin caret) is superseded by
  a matrix-style decode/scramble effect (chars cycle random glyphs then lock
  left-to-right, phrases morph with no blank state, block caret blinks idle / solid
  while decoding), styled uppercase `font-bold tracking-tight`, matching the owner's
  reference (aradhyapuneeth.github.io). **Space Grotesk applies to the animated
  headline only** (`font-grotesk` on the HeadlineRotator h1); the rest of the site
  keeps Instrument Serif (`font-display`) and Geist Mono. All other frozen hero specs
  (layout, scenes, sync, launch block, signature, portrait) unchanged.

- **2026-08-16 — owner-approved layout amendment (entry 8, not an unlock):** the
  hero's bottom blocks swapped columns. New arrangement: LEFT = typewriter
  headline (top) + signature block (Harisx404 name, divider, status rotator,
  all left-aligned) at bottom; RIGHT = New launch block (top) + domain
  showcase window (bottom, right-aligned). All other frozen specs unchanged.

- **2026-08-16 — owner-approved layout amendment (entries 1 & 2, not an unlock):** all
  viewport-based `sm:` variants inside both modal cards were made unconditional
  (Pages `grid-cols-2`, Connect `grid-cols-3`, Legal/Discover `grid-cols-2`,
  reach-out/theme circle buttons always shown, ReachOut cards always side-by-side).
  Reason: the cards render as scaled 660px miniatures on phones, so the laptop
  layout must apply at every viewport ("the nav bar must be in the design like in
  the screenshot"). Everything else in the locked specs is unchanged.
- **2026-08-22 — owner-directed global layout tweak (not an unlock):**
  removed `BgGradient` (faint purple #6C47FF blurred glow) from
  `app/layout.tsx` on owner request — it produced a light-colored haze near
  the side rails site-wide. Component file kept at
  `app/components/BgGradient.tsx` for possible revert.

## 19. About — Experience section (LOCKED)

Files: `app/components/Resume.tsx`, `app/components/Timeline.tsx`,
`app/lib/resume/types.ts`, `fetchExperiences` in `app/lib/utils.ts`,
Experience block in `app/about/page.tsx`, admin
(`app/components/admin/ExperienceForm.tsx`, `app/api/admin/experience/route.ts`,
`app/admin/(dashboard)/experience/*`), `migrations/2026_experience_linkedin.sql`.

Final spec (verified by measurement):
- Fully DB-managed via /admin/experience (LinkedIn schema: job title*, org*,
  logo URL, location, location type, employment type, start* / end month+year,
  "currently working", summary, highlights "Lead: text" with [label](url)
  links). Only 3 required fields; every blank field hides cleanly; no logo →
  no box; empty highlights → no list; open-ended dates → start only;
  location/type dedupe. Static fallback if DB empty/unreachable.
- Layout: full-bleed dividers to the rails (gray-300/white-20 frame,
  gray-200/white-10 between entries), py-12 entries; grid
  [minmax(0,2fr),96px,minmax(0,4fr)] md, [280px,96px,minmax(0,1fr)] xl.
  Timeline line centered in the corridor: 72.0/72.0px gaps measured at
  375/800/1440. Node dots (12px, 3px bg ring, gray-400/white-50) at every
  entry divider, 0.00px offset from line center at all widths, mobile
  included (left-4).
- Left column: period 12px/500 mono uppercase tracking .2em; logo 44x44
  r10 border + 1px/3px shadow (8%/30%), object-cover; org 22px/600 Source
  Serif 4 (font-org); meta lines 12px/500 with 14px MapPin/Briefcase icons;
  rhythm 20/20/8 desktop, 16/16/8 mobile; all rows share one left edge.
- Right column: title 22px/600 Source Serif 4 (top aligned 0.0px with period);
  summary + bullets 15px/400 LEFT-ALIGNED all screens (owner final,
  re-confirmed 2026-08-23 after trying justify); ✦ mono markers, 600
  leads, 16px bullet spacing; links underlined
  with focus-visible outline.
- Motion: avatar rides spring (120/28/.4) on compositor-only transforms,
  clamped at bottom divider; passed portion fills with static 180°
  pink→purple→blue (heading palette) spanning exactly the covered area;
  entries fade+10px rise once on view; reduced-motion honored everywhere.
- Removed by owner decision: section subtitle, tech chips, justify,
  computed durations, logo-initial fallback.

Unlock note: Timeline/Resume geometry constants (33.333%+24px md, 352px xl,
280px column, 96px corridor) are interdependent — change together only.

## 20. Site-wide section rhythm & heading system (REFERENCE — apply to ALL pages)

- **Date locked:** 2026-08-23
- **Locked at commits:** `1525ec1`, `5cfbfaa`, `a4826f2`, `b860b89`
- **Source of truth:** homepage (`app/page.tsx`, `app/components/home/SectionHeading.tsx`,
  `app/components/home/CtaSection.tsx`). All measurements verified live via Playwright.

**Frozen spec — every section on every page must follow this pattern:**

| Element | Value |
|---|---|
| Kicker / eyebrow | 12px / weight 500, Geist Mono, uppercase |
| Kicker → heading gap | **16px** (`mt-4`) |
| Section heading | **48px mobile / 56px from md, weight 500**, Instrument Serif (`text-5xl md:text-[56px] font-medium`) |
| Heading → content gap | **56px** (`mt-14` / `space-y-14`) |
| Section → section gap | **112px** (`space-y-28`) at ALL breakpoints |

**CTA-style closing sections (page-final call-to-action) are the one allowed variant:**
- Kicker → heading gap: 16px (`mt-4`)
- Heading: 40px mobile → 48px sm → 56px md → 60px lg, weight 500
- Heading → content: 56px (`mt-14`) — same as standard

Notes:
- Instrument Serif ships only weight 400; the 500 is browser-synthesized
  (`font-medium`) — intentional, keep it.
- Homepage sections wrapper: `mt-16 space-y-28 md:mt-24` (`app/page.tsx`).
- Reusable component: `SectionHeading` (kicker + heading, correct gap built in) —
  prefer reusing it on other pages instead of hand-rolling headers.
- DRIFT RESOLVED (2026-08-24): /about migrated to this spec — shared
  SectionHeading everywhere (incl. Certifications & More sections), section
  gap 112px (`space-y-28`), gradient-word scroll reveal. Owner-approved
  amendment to entries 18–19 (section rhythm only; inner layouts untouched).

### Entry 20 addendum — full component type scale & audit baseline (2026-08-24)

Component typography (measured live, homepage = source of truth):
- Content titles (serif, Instrument Serif, weight 500): 24px project titles /
  featured post / stat values / testimonial quotes / behind-the-site card
  titles; 20-22px secondary post titles; 30px xl sticky project title.
- Card UI titles: 16px/500 Geist Sans. Card subtitles: 16px/400 (14px mobile).
- Body: 14px/400 Geist Sans; emphasis 500-600.
- Mono scale (Geist Mono, 400): 13px tech chips; 12px section-end links +
  avatar initials; 11px in-card links (View case study / Read article) + meta;
  10px badges/tags/version pills; 9px social pills / stat labels; 8px city ticker.
- Exception kept by owner decision: behind-the-site card kickers 12px/400
  (revert d53f00f); blog cover-overlay title 400 italic.

Layout/behavior baseline (audited 2026-08-24):
- Global frame: 14px side rails grid; sections stack 1-col mobile.
- Breakpoints in active use: sm 640 / md 768 / lg 1024 / xl 1280.
- CTA buttons: 64px tall at mobile; nav collapses to "Open menu & search" < md.
- A11y baseline: lang=en, single h1, clean h1>h2>h3 order, all imgs have alt
  (3 decorative alt=""), all buttons/links named, externals target=_blank+
  noopener, no duplicate ids. Known gap: no skip-to-content link.
- Known parked: 40px horizontal overflow at 320px only (global frame + locked
  hero grid); dev-only navbar greeting hydration warning.

## 21. Homepage — ENTIRE PAGE (LOCKED) ✅

- **Date locked:** 2026-08-24
- **Locked at commit:** `322b471`
- **Scope:** the complete homepage — hero, status row, all 7 sections
  (HomeBento, Case Studies, Blog, About teaser, Testimonials, Behind the
  site, CTA), footer interactions on it, spacing, typography, animations.
- **Files (do not modify without owner permission in the current conversation):**
  - `app/page.tsx` (section wrapper `mt-16 space-y-28 md:mt-24`)
  - `app/components/home/*` — HomeHero, HomeBento, CaseStudies, Writings,
    AboutTeaser, Testimonials, MySiteGrid, CtaSection, SectionHeading,
    StatusRow and all siblings
  - Homepage-affecting parts of `app/layout.tsx` (skip link, main-content id,
    frame grid), `app/components/Footer.tsx`, `app/globals.css`
    (`html,body overflow-x: clip`, gradient classes)
- **Frozen spec:** everything in entry 20 + addendum, plus:
  - Heading animation: static plain text; gradient span only reveals on
    scroll — fade + 14px rise, 0.7s easeOut, 0.05s delay, once per load,
    no blur, reduced-motion → static (`GradientReveal` in SectionHeading,
    inline motion.span in CtaSection).
  - Audit fixes locked in: `max-[374px]:text-[2.5rem]` hero h1, skip link,
    ≥24px touch targets (footer py-1, in-card links py-1.5/-my-1.5),
    `dark:text-neutral-400` kickers, micro-type 9/10px bumps,
    carousel `aria-live="polite"`.
- **Reference rule:** the homepage is the DESIGN SOURCE OF TRUTH for every
  other page (/about, /projects, /blog, /contact, /stats, /buildlog,
  /community-wall, /links, /resume, legal pages). When building or polishing
  any other page, match entry 20 values (kicker 12/500 mono +16px; heading
  56/500 serif +56px; sections 112px apart; serif content titles 500; body
  14/400; mono label scale; gradient-word scroll reveal). Do NOT invent new
  spacing/typography values — reuse `SectionHeading` and these tokens.
- **Content exceptions (data, not design — still editable via /admin):**
  testimonials, projects, blog posts, live stats. Known content TODOs
  remain: truncated/self testimonials, placeholder projects/posts.

## 23. FINAL PRODUCTION LOCK — Home, About, Navbar, Search, Reach Out, Footer ✅✅

- **Date locked:** 2026-09-03
- **Owner approval:** The owner declared all six areas fully polished and
  instructed that they must not be touched until the owner explicitly unlocks
  them and grants permission for a specific change.
- **Status:** Final production-approved visual, responsive, interaction, and
  accessibility baseline.

### Frozen scope

| Area | Files and dependencies |
|---|---|
| Home page | `app/page.tsx`, `app/components/home/**` |
| About page | `app/about/page.tsx`, `app/components/Resume.tsx`, `app/components/EducationCards.tsx`, `app/components/EducationMotion.tsx`, `app/components/AboutTrackPattern.tsx`, `app/components/ScrapbookBento.tsx`, `app/components/StatsBento.tsx` |
| Navbar | `app/components/Navbar.tsx`, `app/components/ThemeToggle.tsx` |
| Search modal | `app/components/navbar/SearchModal.tsx` |
| Reach Out modal | `app/components/navbar/ReachOutModal.tsx` |
| Footer | `app/components/Footer.tsx`, `app/components/SocialPill.tsx` |
| Shared presentation | `app/components/navbar/modalSurfaces.ts`, `app/components/BrandGlyph.tsx`, and the applicable rules in `app/globals.css` |

### Lock rule

Do not modify, refactor, restyle, rename, reorder, or indirectly alter any
frozen area through shared components, tokens, global CSS, parent layout, or
responsive rules. A future change is allowed only after the owner explicitly
states that the relevant area is unlocked and grants permission for that
specific work in the current conversation.

Admin-managed content remains editable without unlocking the presentation
layer. The owner-deferred X/Twitter destination also remains unchanged until a
verified replacement URL is supplied.

### 2026-09-03 owner-authorized temporary amendment

The owner temporarily unlocked only `app/components/home/CaseStudies.tsx` to
improve the shared Home/Projects card behavior and add Projects-only optional
props. Authorized scope: brief Behind-the-Site-style touch scroll preview,
reduced-motion correction, Projects line-arrow selection, decorative Projects
cover alt behavior, Projects image priority, and Projects responsive image
sizing. Homepage content, typography, geometry, desktop hover, sticky panel,
and all other entry 23 surfaces remain locked. Final re-lock of this amended
card behavior awaits owner visual approval.
