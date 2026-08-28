# Blog Details Page — Blueprint Spec (DESKTOP)

Reference: blog article reading experience (desktop capture, ≥1024px / lg breakpoint).
Companion file: `blog-details-mobile-spec.md`.
Scope: `/blog/[slug]` page only. Our own content/branding; this spec defines layout, tokens, and components.

---

## 1. Layout Structure (top to bottom)

1. **Header / Navigation** — full width, inner centered container, `py-1.5`; `fixed top-4 z-5000`; blur mask `fixed top-0 left-0 z-40 h-[100px] lg:h-25 w-full backdrop-blur-[2px]`.
2. **Hero Background/Image** — full width, container `h-80` (320px); image `h-[450px]` object-cover, halftone filter; `absolute inset-0 z-[-1]`, gradient mask (black 40% → transparent 100%).
3. **Breadcrumb** — `max-w-3xl`, centered, directly above H1 (`/blog` link).
4. **Title Block** — `max-w-3xl`, `px-6 pt-56`, centered `flex flex-col items-center gap-y-5 text-center`.
5. **Meta Row** — `max-w-3xl px-6 mt-16`; `flex justify-between items-center flex-wrap gap-x-4 gap-y-2`.
6. **TOC** — SAME floating bottom pill as mobile: 280px capsule, `fixed bottom-[30px] left-1/2 -translate-x-1/2 z-[99]`, expands to modal drawer.
7. **Sidebar** — none; centered single column flanked by decorative hatched borders.
8. **Article Body** — `max-w-3xl min-w-0 px-6 mt-6 mx-auto`; `prose prose-neutral dark:prose-invert`.
9. **FAQ Section** — `max-w-3xl px-6 mt-4 mx-auto`, `scroll-mt-24`.
10. **Reactions** — not present.
11. **Related Posts ("More posts")** — `py-10`; grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3`.
12. **Newsletter** — not present.
13. **Contact/CTA Section** — `py-10`/pagebuilder; centered; canvas shader + spinning badge.
14. **Footer** — centered container, `px-16 py-6`; 2-col split: left bio 44% (`border-e`) + right nav groups 56%.

> **Desktop grid frame:** main content wrapped in `grid-cols-[32px_1fr_32px]`; the two outer 32px columns render a decorative 45° hatched stripe border. (Mobile: 12px columns.)

---

## 2. Typography (desktop)

| Style | Family | Size | Weight | Line-height | Tracking | Light | Dark |
| --- | --- | --- | --- | --- | --- | --- | --- |
| h1 title | serif display | 48px | 700 | 1.11 | 0.025em | #101828 | #ffffff |
| h2 | Outfit | 24px | 700 | 1.333 | 0 | #101828 | #ffffff |
| h3 | Outfit | 20px | 600 | 1.6 | 0 | #101828 | #ffffff |
| h4 | Outfit | 16px | 600 | 1.5 | 0 | #101828 | #ffffff |
| Body p | Outfit | 16px | 400 | 1.75 | 0 | #364153 | #d1d5dc |
| Lead/subtitle | Outfit | 18px | 400 | relaxed | 0 | #737373 | #a3a3a3 |
| Meta text | Outfit | 14px | 400 | — | 0 | #525252 | #a3a3a3 |
| Breadcrumb | Outfit | 14px | 400 | — | 0 | #737373 | #a3a3a3 |
| Article link | Outfit | 16px | 500 | 1.75 | 0 | #2563eb | #60a5fa |
| Inline code | mono | 14px | 400 | — | 0 | #3f3f46 | #d4d4d8 |
| Code block | mono | 13px | 400 | 24px | 0 | Catppuccin Latte | Vesper |
| Code badge | mono | 11px | 400 | — | 0 | #737373 | #a3a3a3 |
| TOC title | mono | 10px | 400 | — | 0.28em UPPER | rgba(0,0,0,.55) | rgba(255,255,255,.55) |
| TOC item inactive | Outfit | 14px | 400 | — | 0 | rgba(0,0,0,.5) | rgba(255,255,255,.5) |
| TOC item active | Outfit | 14px | 500 | — | 0 | #000 | #fff |
| Figcaption | Outfit | 14px | 400 | 1.428 | 0 | #737373 | #a3a3a3 |
| Blockquote | Outfit | 16px | 500 italic | 1.75 | 0 | #101828 | #f3f4f6 |
| FAQ question | Outfit | 15px | 500 | 1.375 | 0 | #262626 | #e5e5e5 |
| FAQ answer | Outfit | 14px | 400 | 1.625 | 0 | #525252 | #a3a3a3 |
| Related post title | Outfit | 18px | 600 | 1.375 | 0 | #171717 | #ffffff |
| Footer bio | Outfit | 16px | 400 | leading-5 | 0 | #737373 | #a3a3a3 |
| Footer group header | mono | 12px | 400 | — | UPPER | #404040 | #a3a3a3 |
| Footer links | Outfit | 16px | 400 | — | 0 | #000000 | #fafafa |

---

## 3. Colors (same palette as mobile, plus)

| Role | Light | Dark |
| --- | --- | --- |
| Page bg | #F4F4F4 | #000000 |
| Headings | #101828 | #ffffff |
| Body | #364153 | #d1d5dc |
| Muted | #737373 | #a3a3a3 |
| Border outer | #e5e5e5 | #262626 |
| Border inner | rgba(229,229,229,.8) | #262626 |
| Accent/link | #2563eb | #60a5fa |
| Link hover | #1d4ed8 | #93bbfd |
| Code block outer bg | rgba(229,229,229,.5) | rgba(23,23,23,.5) |
| Code block inner bg | #F6F6F8 | #101010 |
| Inline code bg / text | #e5e5e5 / #3f3f46 | #262626 / #d4d4d8 |
| Blockquote border / text | #e5e7eb / #101828 | #364153 / #f3f4f6 |
| Table divider | rgba(229,229,229,.6) | rgba(38,38,38,.4) |
| TOC pill bg | rgba(255,255,255,.70) | rgba(38,38,38,.80) |
| TOC pill shadow | `0 0 0 0.8px rgba(0,0,0,.06), 0 4px 12px -4px rgba(0,0,0,.06), inset 0 0.5px 0.5px 0.5px rgba(255,255,255,.6)` | `inset 0 1px 0 0 rgba(255,255,255,.1), inset 0 0 0 1px rgba(255,255,255,.06)` |
| FAQ row hover | rgba(0,0,0,.02) | rgba(255,255,255,.02) |
| Related card hover | #fafafa | rgba(23,23,23,.4) |

---

## 4. Components (desktop notes; rest identical to mobile spec)

- **TOC pill**: identical to mobile (280×52, radius 26, blur 12px, pulsing dot `animate-ping`, 22×22 progress ring, modal drawer expanded, active bar `h-4 w-[2px]`, indent H2 `pl-3` / H3 `pl-[26px]`).
- **Code blocks**: outer `<figure class="rounded-2xl border p-1 border-neutral-200 bg-neutral-200/50 dark:border-neutral-800 dark:bg-neutral-900/50 my-6">`; inner `rounded-xl border border-neutral-200/80 bg-[#F6F6F8] shadow-xs`; badge `absolute top-2.5 left-4 z-10 rounded-md bg-neutral-200/80 px-2 py-0.5 font-mono text-[11px]`; copy button `absolute top-2 right-2 z-10 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 active:scale-90 duration-200`; pre `pt-11 pb-3 px-4 font-mono text-[13px] leading-6 overflow-x-auto dark:bg-[#101010]`; no line numbers; `.line.highlighted`.
- **File tree**: mono ASCII inside standard code container.
- **Blockquote**: 4px inline-start border, `padding-left:1em`, italic 500, quotes via pseudo-elements. Bottom CTA: `rounded-2xl ring-1 ring-border py-10`, canvas shader, draggable circular badge w/ star icon.
- **Inline code / images / tables / hr / links / share**: identical to mobile spec.
- **Author**: meta row + footer left column (`w-[44%] border-e px-16 pr-8`, 40px logo, `w-60 text-base leading-5` bio).
- **Related cards**: 3-col grid; card `rounded-3xl p-2.5 ring-1 ring-border hover:bg-neutral-50 dark:hover:bg-neutral-900/40`; cover `aspect-16/11 rounded-2xl` + `bg-black/25` overlay; dashed arrow badge `size-[25px] rounded-lg border-dashed`.
- Not present: reactions, newsletter, standalone back-to-top.

---

## 5. Spacing — identical prose rhythm to mobile spec. Desktop gutter `md:px-6` (24px); footer `lg:px-16`.

---

## 6. Responsive deltas (desktop vs mobile)

| Feature | Desktop | Mobile |
| --- | --- | --- |
| Content max-width | max-w-3xl centered | full − padding |
| Gutter | md:px-6 / lg:px-16 (footer) | px-4 |
| H1 | 48px | 30px |
| Lead | 18px | 16px |
| TOC | floating bottom pill (same) | floating bottom pill (same) |
| Header offset | md:top-4 (16px) | top-2.5 (10px) |
| Blur mask height | lg:h-25 (100px) | 90px |
| Frame columns | 32px hatched | 12px hatched |
| Related grid | lg:grid-cols-3 | 1-col |
| Footer | 2-col 44/56 | 1-col, bio hidden |
| "Open to work" star | lg:block | hidden |
| Meta "Updated" prefix | visible | hidden |
| CTA hover scale | md:hover:scale-125 | max-md:scale-110 |

---

## 7. Interactions & Animations (desktop additions)

- Same set as mobile spec (links 300ms cubic-bezier(0.22,1,0.36,1); copy fade 200ms + active:scale-90; FAQ chevron 180° 300ms; related card bg 300ms/image scale-105 500ms/dashed arrow 500ms; footer fill-up ::before 0→1.4em mix-blend-difference; contact pill clip-path 500ms).
- TOC pill slides up `translateY(50px) scale(0.9)` → `translateY(0) scale(1)` after hero.
- TOC modal drawer: `@keyframes enter/exit` 150ms.
- Progress ring stroke-dashoffset realtime.
- `@keyframes ping`, `spin-slow`; `motion-reduce:transition-none`.
