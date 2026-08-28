# Blog Details Page — Blueprint Spec (MOBILE)

Reference: blog article reading experience (mobile capture, ~375–500px viewport).
Companion file: `blog-details-desktop-spec.md` (pending).
Scope: `/blog/[slug]` page only. Uses our own content/branding; this spec defines layout, tokens, and components.

---

## 1. Layout Structure (top to bottom)

1. **Header / Navigation** — full width, inner container centered, `py-1.5`; `fixed top-2.5 z-5000`; full-width blur mask behind it: `fixed top-0 left-0 z-40 h-[90px] w-full backdrop-blur-[2px]`.
2. **Hero Image** — full width, container `h-80` (320px); image `h-[450px]` object-cover, halftone filter; `absolute inset-0 z-[-1]`, linear gradient mask (black 40% → transparent 100%).
3. **Breadcrumb** — `max-w-3xl`, centered, top of title block.
4. **Title Block** — `max-w-3xl`, `px-4 pt-56` (224px top pad), centered `flex flex-col items-center gap-y-5 text-center`.
5. **Meta Row** — `max-w-3xl px-4 mt-16`; `flex justify-between items-center flex-wrap gap-x-4 gap-y-2`.
6. **TOC** — floating pill, 280px wide collapsed → expands to overlay drawer; `fixed bottom-[30px] left-1/2 -translate-x-1/2 z-[99]`; padding `px-5` collapsed / `px-3 pb-4` expanded.
7. **Article Body** — `max-w-3xl min-w-0 px-4 mt-6 mx-auto`; `prose prose-neutral dark:prose-invert`.
8. **Sidebar** — hidden on mobile (single column).
9. **FAQ Section** — `max-w-3xl px-4 mt-4 mx-auto`, `scroll-mt-24`.
10. **Reactions** — not present.
11. **Related Posts** — full width within container, `px-4`, 1-column card stack.
12. **Newsletter** — not present.
13. **Footer** — container `max-sm:px-1`, `px-4 py-6`; flex-col stack; author bio column `hidden lg:flex`.

---

## 2. Typography

| Style | Family | Size | Weight | Line-height | Letter-spacing | Light | Dark |
| --- | --- | --- | --- | --- | --- | --- | --- |
| h1 | serif display (bluuNext-like) | 30px | 700 | 1.11 | 0.025em | #101828 | #ffffff |
| h2 | Outfit sans | 24px | 700 | 1.333 | 0 | #101828 | #ffffff |
| h3 | Outfit sans | 20px | 600 | 1.6 | 0 | #101828 | #ffffff |
| Body p | Outfit sans | 16px | 400 | 1.75 | 0 | #364153 | #d1d5dc |
| TOC title | mono | 10px | 400 | — | 0.28em UPPER | rgba(0,0,0,.55) | rgba(255,255,255,.55) |
| TOC item (inactive) | Outfit | 14px | 400 | — | 0 | rgba(0,0,0,.50) | rgba(255,255,255,.50) |
| TOC item (active) | Outfit | 14px | 500 | — | 0 | #000 | #fff |
| Inline code | mono | 14px | 400 | — | 0 | #3f3f46 | #d4d4d8 |
| Code block | mono | 13px | 400 | 24px | 0 | Catppuccin Latte theme | Vesper theme |
| Figcaption | Outfit | 14px | 400 | 1.428 | 0 | #737373 | #a3a3a3 |
| Meta text | Outfit | 14px | 400 | — | 0 | #525252 | #a3a3a3 |
| Article links | Outfit | 16px | 500 | 1.75 | 0 | #2563eb | #60a5fa |

---

## 3. Colors

| Role | Light | Dark |
| --- | --- | --- |
| Page background | #F4F4F4 | #000000 |
| Article background | transparent | transparent |
| Headings | #101828 | #ffffff |
| Body text | #364153 | #d1d5dc |
| Muted text | #737373 | #a3a3a3 |
| Border (card/outer) | #e5e5e5 | #262626 |
| Border (inner) | rgba(229,229,229,.8) | #262626 |
| Accent/link | #2563eb | #60a5fa |
| Link hover | #1d4ed8 | #93bbfd |
| Code block bg (outer) | rgba(229,229,229,.5) | rgba(23,23,23,.5) |
| Code block bg (inner pre) | #F6F6F8 | #101010 |
| Inline code bg | #e5e5e5 | #262626 |
| Blockquote left border | #e5e7eb | #364153 |
| Blockquote text | #101828 | #f3f4f6 |
| Table divider | rgba(229,229,229,.6) | rgba(38,38,38,.4) |
| TOC pill bg | rgba(255,255,255,.70) | rgba(38,38,38,.80) |
| FAQ row hover | rgba(0,0,0,.02) | rgba(255,255,255,.02) |
| Related card hover | #fafafa | rgba(23,23,23,.4) |

---

## 4. Components

### TOC (mobile floating pill)
- Capsule: `width:280px; height:52px; border-radius:26px; backdrop-filter:blur(12px)`.
- Collapsed: pulsing dot (`size-1.5`), current section title (`text-sm font-medium`), circular SVG progress ring (22×22).
- Expanded: overlay card, title "TABLE OF CONTENTS", close button (`size-7 rounded-full`), scrollable list (`gap-0.5`).
- Active item: indicator bar `h-4 w-[2px] rounded-full bg-foreground`, `scaleY(0)→scaleY(1)`; opacity 50%→100%. Indent H2 `pl-3`, H3 `pl-[26px]`.

### Reading progress
- SVG circle in TOC pill: `cx=11 cy=11 r=10 stroke-width=2`; track `text-foreground/15`; `stroke-dasharray=62.83`, `stroke-dashoffset` animates with scroll.

### Code blocks
- Double-border: outer `<figure>` `rounded-2xl border p-1`; inner `rounded-xl border shadow-xs`.
- Filename badge top-left: `top-2.5 left-4 rounded-md px-2 py-0.5 font-mono text-[11px]`.
- Copy button top-right: `top-2 right-2 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 active:scale-90`, icon `size-3.5`.
- Pre: `pt-11 pb-3 px-4 font-mono text-[13px] leading-6 overflow-x-auto`.
- No line numbers; highlighted lines via `.line.highlighted`.

### File tree
- Rendered inside standard code-block container, mono ASCII hierarchy.

### Blockquote / Callout
- Blockquote: `border-inline-start:4px solid; padding-left:1em; italic; font-weight:500; margin:1.6em 0`; typographic quotes via `::before`/`::after`.
- Bottom CTA callout: `rounded-2xl ring-1 ring-border py-10`, canvas shader bg, draggable circular badge.

### Inline code
- `rounded-sm bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-zinc-700 dark:text-zinc-300`; backticks removed (`before/after:content-none`).

### Images
- `w-full rounded-xl border neutral-200/800`, `cursor:zoom-in`, lazy. Caption `mt-2 text-center text-sm text-neutral-500`.

### Tables
- Outer `rounded-2xl p-1` card; inner `rounded-xl overflow-x-auto`; `min-w-[500px] border-collapse text-sm`; header cells contain badges `rounded-md px-2 py-0.5 font-mono text-[11px]`.

### HR
- `border-top:1px solid` (#e5e7eb / #364153); margin `3em 0`.

### Links in article
- `text-blue-600 dark:text-blue-400 no-underline font-medium hover:text-blue-700`.
- External links: trailing arrow icon `size-[0.85em]`, hover `translate-x-px -translate-y-px`.
- Heading anchors: `#` icon `size-5` (h2) / `size-4` (h3), `opacity-0 group-hover:opacity-100`.

### Share
- In meta row: `inline-flex items-center gap-1.5 text-blue-600 text-sm`; link icon `size-3.5` + "Copy URL" + rotating chevron `size-3.5`.

### Related cards
- `rounded-3xl p-2.5 ring-1 ring-border`; cover `aspect-16/11 rounded-2xl overflow-hidden` with `bg-black/25` overlay; "Read article" footer with dashed-border arrow badge `size-[25px] rounded-lg border-dashed`.

### Not present on this page
- Reactions, newsletter signup, standalone back-to-top.

---

## 5. Spacing System

| Relation | Value |
| --- | --- |
| Paragraph gap | 1.25em (20px) |
| Before H2 / after H2 | 2em / 1em |
| Before H3 / after H3 | 1.6em / 0.6em |
| Before H4 / after H4 | 1.5em / 0.5em |
| Around code blocks | my-6 (24px) |
| Around images | my-6 / img 2em |
| Around HR | 3em |
| Around blockquotes | 1.6em |
| Title block top pad | pt-56 (224px) |
| Title → meta row | mt-16 (64px) |
| Meta row → body | mt-6 (24px) |
| Article → FAQ | mt-4 |
| Heading scroll offset | scroll-mt-24 (96px) |
| Mobile gutter | px-4 (16px) |

---

## 6. Responsive Behavior (mobile vs desktop deltas)

| Feature | Mobile | Desktop (lg+) |
| --- | --- | --- |
| Content max-width | full − 32px | max-w-3xl (768px) centered |
| Gutter | px-4 | md:px-6 / lg:px-16 |
| H1 size | 30px | 36px (sm) → 48px (md) |
| Lead subtitle | 16px | 18px |
| TOC | floating bottom pill | sidebar navigation |
| Sidebar | hidden | visible/sticky |
| Footer | 1-col, bio hidden | 2-col (44% bio + 56% links) |
| Outer border cols | grid-cols-[12px_1fr_12px] | 32px columns |
| CTA button | max-md:scale-110 | md:hover:scale-125 |
| Meta "Updated" prefix | hidden | visible |

---

## 7. Interactions & Animations

- Article links: 300ms `cubic-bezier(0.22,1,0.36,1)` color shift.
- External link icon: `translate-x-px -translate-y-px` 300ms.
- Copy button: fade 200ms, `active:scale-90`.
- Heading anchor: fade 200ms.
- FAQ chevron: rotate 180°, 300ms `cubic-bezier(0.23,1,0.32,1)`.
- Related cards: bg 300ms; image `scale-105` 500ms; dashed arrow translate 500ms ease-in-out.
- Footer links: fill-up `::before` height 0→1.4em, 300ms, `mix-blend-difference`; arrow translate + 45° rotate.
- Contact pill: clip-path expansion `inset(0 0 0 calc(100%-40px) round 9999px)` → `inset(0 round 9999px)`, 500ms.
- TOC pill scroll-in: from `opacity:0; translateY(50px) scale(0.9)` after scrolling past header.
- TOC active bar: `scaleY(0)→scaleY(1)` 300ms ease-out.
- Progress ring: `stroke-dashoffset` 62.83→0 realtime.
- `@keyframes ping` for live dot; slow-spin for circular badge; `motion-reduce:transition-none` respected.
