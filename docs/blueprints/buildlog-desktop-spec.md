# Buildlog Page — Blueprint Spec (DESKTOP)

Reference: bucket-list style page (desktop capture, ≥1024px), adapted for BUILDLOG content:
each section = a project/app I built (number, name, tagline/version), rows = shipped
features (checked) and upcoming updates (unchecked) with version/date badges.
Route: `/buildlog`.

---

## 1. Layout (top to bottom)

1. **Header/nav** — standard fixed pattern (top-4, blur mask h-[100px]).
2. **Hero/title** — `max-w-xl` centered, main `pt-38` (152px) / `pb-24`; super-title mono 12px uppercase tracking-widest `mb-4`; H1 Instrument Serif 60px (48px mobile) with italic multi-color gradient shimmer accent word; hero text-shadow `rgba(255,255,255,.05) 0 4px 8px, rgba(255,255,255,.2) 0 8px 30px`.
3. **Category regions** (per project) — `grid grid-cols-1 lg:grid-cols-12`, each region separated by `border-t border-dashed`.
   - **Left header col:** `lg:col-span-3 p-4 lg:p-6`, `sticky top-32` on desktop; contains index (mono 12px bold, neutral-400/600), title (display serif 30px/700, 24px mobile), subtitle (same size, muted #a3a3a3 / #777B84).
   - **Right list col:** `lg:col-span-9 lg:border-l lg:border-dashed`, stacked rows.
4. **Checklist item rows** — `flex items-start gap-4 px-4 py-5 md:px-6`, divider `border-b border-neutral-200/50 dark:border-neutral-800/50`; absolute hover backdrop `bg-neutral-900/[0.015] dark:bg-white/[0.015]` fading in 300ms.
5. **CTA (#contact)** — shared site CTA.
6. **Footer** — standard.

> Frame: `grid-cols-[32px_1fr_32px]` hatched rails desktop / 12px mobile.

---

## 2. Typography

| Style | Family | Size | Weight | LH | Light | Dark |
| --- | --- | --- | --- | --- | --- | --- |
| Super-title | mono | 12px | 400 | — | rgba(0,0,0,.8) | rgba(255,255,255,.7) |
| H1 | Instrument Serif | 60px / 48px mobile | 500 | 1.0 | #000 | #fff |
| Category index | mono | 12px | 700 | — | #a3a3a3 | #525252 |
| Category title | display serif (bluuNext) | 30px / 24px mobile | 700 | leading-snug | #171717 | #f5f5f5 |
| Category subtitle | display serif | 30px | 700 | snug | #a3a3a3 | #777B84 |
| Item title (checked) | Outfit | 16px | 500 | 22px, -0.01em | #171717 | #f5f5f5 |
| Item title (unchecked) | Outfit | 16px | 500 | 22px | #737373 | #737373 (hover → #262626 / #e5e5e5) |
| Item description | Outfit | 13px | 400 | 1.6 | #737373 | #737373 |
| Date/status badge | mono | 10px | 400 | — | #525252 on rgba(0,0,0,.05) | #a3a3a3 on #171717 |

---

## 3. Colors

| Token | Light | Dark |
| --- | --- | --- |
| Page bg | #F4F4F4 | #000000 |
| Dashed dividers | #e5e5e5 | #262626 |
| Item dividers | rgba(229,229,229,.5) | rgba(38,38,38,.5) |
| Item hover bg | rgba(23,23,23,.015) | rgba(255,255,255,.015) |
| Checked box stroke | #262626 | #e5e5e5 |
| Unchecked box stroke | #d4d4d4 | #404040 |
| Badge bg / text | rgba(0,0,0,.05) / #525252 | #171717 / #a3a3a3 |

---

## 4. Components

### Checklist row
- `group/item relative border-b border-neutral-200/50 dark:border-neutral-800/50`.
- Hover backdrop: `absolute inset-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300`.
- Layout: `relative flex items-start gap-4 px-4 py-5 md:px-6`; title + description `space-y-1.5`; badge right-aligned `shrink-0 whitespace-nowrap`.

### Hand-drawn sketch checkbox (SVG)
- `size-[22px] shrink-0 mt-[1px]`.
- SVG filter: `feTurbulence baseFrequency=0.035 numOctaves=4 seed=2` + `feDisplacementMap scale=2` (sketchy wobble).
- Checked: rect rx=3 16×16 stroke-1.4 (neutral-800/200) + check path `M7 13l4 4.5L22 5` stroke-2.2 round.
- Unchecked: rect stroke-1.2 (neutral-300/700), no check.

### Badge
- `rounded-full px-3 py-1 font-mono text-[10px] border whitespace-nowrap shrink-0` — used for version (e.g. `v2.1`) or date (e.g. `Q2 2026`) or status (`planned`).

### CTA / footer
- Same shared components as other pages.

---

## 5. Spacing

| Relation | Value |
| --- | --- |
| Main top / bottom | 152px / 96px |
| Category header pad | lg:p-6 |
| Sticky offset | top-32 (128px) |
| Row padding | px-4 py-5 md:px-6 |
| Title↔desc gap | 6px (space-y-1.5) |
| Checkbox gap | 16px (gap-4) |
| Rails | 32px desktop / 12px mobile |

---

## 6. Responsive deltas

| Feature | Desktop | Mobile |
| --- | --- | --- |
| Region grid | lg:grid-cols-12 (3 + 9) | 1-col stack, header above rows |
| Header col | sticky top-32 | static |
| List border-l dashed | yes | none |
| H1 | 60px | 48px |
| H2 | 30px | 24px |
| Rails | 32px | 12px |

---

## 7. Interactions

- Row hover: backdrop fade 300ms; unchecked title color lifts 300ms.
- Hero accent shimmer (`animate-gradient-x`, masked).
- CTA pill scale/clip-path + spin-slow badge (shared).
- Footer link fill-up hover (shared).

---

## 8. Content adaptation (buildlog vs bucket list)

- Each **region = one project/app** (e.g. 01 IntruShield NIDS — "Smart. Secure. Scalable.").
- **Checked rows** = shipped features/releases, badge shows version or ship date.
- **Unchecked rows** = upcoming/planned updates, badge shows `planned` / target quarter.
- Optional intro row per project with short info + current version badge.
