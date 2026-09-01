# Buildlog Page — Blueprint Spec (MOBILE)

Reference: bucket-list page (mobile capture, ~375–500px). Companion: `buildlog-desktop-spec.md`.
This file records mobile-specific values; tokens/components identical to desktop spec.

## Layout deltas
- Header fixed `top-2.5`, blur mask `h-[90px]`.
- Hero `max-w-xl`, `pt-38`, `max-sm:px-5`, H1 48px (`text-5xl`).
- Category sections: **1-column stack** — header block `p-4` static above rows (no sticky, no left border).
- Checklist rows: `px-4 py-5` (16px horizontal on mobile), same dividers/hover.
- Frame rails: `grid-cols-[12px_1fr_12px]`.
- Category H2: 24px (`text-2xl`), leading-snug 33px.
- CTA title 24px; badge centered `top-10`; button `max-md:scale-110`; star hidden.
- Footer 1-col, bio hidden, `px-4 py-6` / `max-sm:px-1`.

## Identical to desktop spec
- Typography colors, checkbox SVG (turbulence filter, stroke weights), badge pill,
  item title/description sizes (16px/500 + 13px/1.6), hover interactions,
  gradient shimmer accent, spacing rhythm (gap-4 checkbox, space-y-1.5, py-5 rows).

## Implementation cross-check (our /buildlog — verified matching)
- Header block: `p-4 lg:p-6`, sticky only at `lg:` ✓
- Rows: `px-4 py-5 md:px-6` ✓
- H1 `text-5xl md:text-6xl`, H2 `text-2xl md:text-3xl` ✓
- 1-col mobile stack, no vertical border below `lg` ✓
- Sketch checkbox strokes 1.4/1.2, check path `M7 13l4 4.5L22 5` ✓
- Badges `rounded-full px-3 py-1 font-mono text-[10px]` ✓
