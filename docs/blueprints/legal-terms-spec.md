# Legal / Terms Page — Blueprint Spec (DESKTOP + mobile deltas)

Reference: terms-of-use page. Route: `/legal/terms`. Same skeleton as privacy page
(hero + 3 numbered 12-col split sections + double dividers + CTA + rails).

## Sections
- **01 Terms. / "The Agreement"** — lead paragraph + **effective date card**:
  `flex items-center gap-4 rounded-xl border bg-neutral-50/50 p-4 dark:bg-neutral-900/20`,
  icon bubble `size-10 rounded-full bg-white shadow-sm dark:bg-neutral-800` (icon size-5),
  "Effective Date" + `<time>` value.
- **02 Rights.** — `grid gap-6 md:grid-cols-2` color-coded cards:
  - **Restriction (red):** `rounded-xl border border-red-200 bg-red-50/50 p-6
    dark:border-red-900/30 dark:bg-red-950/10`; bubble `size-10 bg-red-100 text-red-600
    dark:bg-red-900/30 dark:text-red-400`; title "Restrictions on Use".
  - **Permission (green):** green-200 / green-50/50 / green-950/10 / green-900/30;
    bubble green-100 text-green-600 dark:text-green-400; title "Limited Use" w/ backlink note.
- **03 Limits.** — **UGC card** (neutral p-6 card, chat icon size-5 text-neutral-500,
  moderation disclaimer) + **disclaimer sub-grid** `grid gap-6 text-sm md:grid-cols-2`
  ("No Warranty" shield icon / "Limitation of Liability" gavel icon, each semibold 14px
  header + body) + contact strip after `my-8 border-t border-dashed` (mailto 14px medium
  hover:underline).

## Typography/colors/spacing/responsive
Identical to `legal-privacy-spec.md` (H1 60/48, H2 30/24, sticky top-32 lg only,
double border-t dividers gap-4, space-y-8 content, rails 32/12, cards 1-col mobile).

## Mobile capture cross-check (verified against implementation)
- H1 48px mobile / 60px desktop (`text-5xl md:text-6xl`) ✓
- Section headers static `p-4` above content; sticky only at lg
  (measured: static @390px, sticky/128px @1440px) ✓
- Middle dashed spacer hidden below lg ✓
- Rights red/green cards: 1-col mobile (measured 1) → md:grid-cols-2 (measured 2) ✓
- Disclaimer sub-grid 1-col mobile → 2-col md ✓
- H2 24px mobile (measured) / 30px desktop (measured) ✓
- Double border-t dividers ×2, effective-date <time datetime>, mailto link ✓
- Rails 12px mobile / 32px desktop; no horizontal overflow at either size ✓
- Exact dark-mode semantic colors measured: red border rgba(127,29,29,.3),
  green border rgba(20,83,45,.3) ✓
