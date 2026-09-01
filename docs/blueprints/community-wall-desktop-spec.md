# Community Wall (Guestbook) — Blueprint Spec (DESKTOP)

Reference: guestbook page (desktop capture, ≥1024px). Route on our site: `/community-wall`.
Companion: `community-wall-mobile-spec.md` (pending).
Stack notes from reference: Next.js App Router, Tailwind, Motion, SVG vector filters.

---

## 1. Layout Structure (top to bottom)

1. **Header/Nav** — same fixed pattern as blog spec (`fixed top-4 z-5000`, blur mask `h-[100px]`).
2. **Hero/Title Block** — `max-w-xl` (576px) centered, `pt-38` (152px top on main), `text-center`, `max-sm:px-5`, `mb-pagebuilder`.
3. **Super-title tag** — mono 12px uppercase `tracking-widest`, `mb-4`, e.g. "The wall remembers".
4. **Masonry-style card grid** — `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-6`.
   - 1st item: **Sign-In Action Card** (purple radial gradient, auth prompt, provider icons footer).
   - Rest: **Entry Sticky Notes** (colorful rotated cards, doodle stickers, user meta footer).
5. No TOC / sidebar / reactions / related / newsletter on this page.
6. **Contact CTA (#contact)** — same shared CTA section (canvas shader + spinning badge), `py-10`.
7. **Footer** — standard 2-col (44% bio border-e + 56% nav), `px-16 py-6`.

> Desktop frame: `grid-cols-[32px_1fr_32px]` with 45° hatched stripe rails (12px on mobile).

---

## 2. Typography

| Style | Family | Size | Weight | LH | Tracking | Light | Dark |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Super-title | mono | 12px | 400 | — | 0.1em UPPER | rgba(0,0,0,.8) | rgba(255,255,255,.7) |
| H1 hero | Instrument Serif | 60px (md:text-6xl) | 500 | 1.0 | -0.025em | #000 | #fff |
| H1 accent | Instrument Serif italic | 60px | 500 | 1.0 | -0.025em | multi-color gradient | same |
| Sign-in card title | Instrument Serif italic | 24px | 400 | 1.333 | 0 | #fff | #fff |
| Sign-in subtitle | Outfit | 12px | 400 | — | 0 | rgba(255,255,255,.5) | same |
| Sign-in button | Outfit | 14px | 500 | — | 0 | #fff | #fff |
| Guestbook message | Outfit | 18px | 700 | leading-snug (1.375) | 0 | #171717 | #f5f5f5 |
| User name | Outfit | 12px | 500 | — | 0 | #262626 | #e5e5e5 |
| Timestamp | mono | 10px | 400 | — | 0 | #a3a3a3 | #737373 |
| CTA title | Outfit | 48px | 300/800 | 1.0 | 0.025em | #000 | #fff |

Hero H1 text-shadow: `rgba(255,255,255,0.05) 0 4px 8px, rgba(255,255,255,0.2) 0 8px 30px`.

---

## 3. Colors

| Role | Light | Dark |
| --- | --- | --- |
| Page bg | #F4F4F4 | #000000 |
| Card base bg | #ffffff | #171717 |
| Card shadow | shadow-2xl | shadow-2xl + inner highlight `inset 0 1px 0 0 rgba(255,255,255,.1), inset 0 0 0 1px rgba(255,255,255,.06)` |
| Sign-in banner bg | `radial-gradient(120% 100% at 30% 20%, rgba(88,28,135,.92), rgba(30,10,60,.95))` | same |
| Sign-in button | bg-white/10, border-white/20, hover bg-white/20 | same |
| Entry gradient: emerald | `radial-gradient(90% 80% at 30% 20%, rgba(6,78,59,.9), rgba(5,20,14,.92))` | same |
| Entry gradient: indigo | `radial-gradient(90% 80% at 30% 20%, rgba(30,58,138,.9), rgba(15,23,42,.95))` | same |
| Entry gradient: amber/rose | `radial-gradient(90% 80% at 30% 20%, rgba(136,19,55,.9), rgba(40,10,20,.95))` | same |
| Doodle strokes | #469C66, #ffffff, #60A5FA | same, `mix-blend-color-dodge`, opacity 50% |
| Wavy perforation fill | #ffffff | #171717 |
| Wavy perforation stroke | rgba(255,255,255,.1) | same |
| Avatar ring | #d4d4d4 | #525252 |
| Meta text | #a3a3a3 | #737373 |

---

## 4. Components

### Sign-in prompt card (1st grid item)
- Container: `relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900`.
- Top banner: `min-h-44 w-full px-6 py-6 pb-10 flex flex-col items-center justify-center gap-3 text-center`, purple radial gradient.
- Title: Instrument Serif italic 24px white; subtitle 12px white/50.
- Button: `h-9 px-5 rounded-lg border border-white/20 bg-white/10 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 active:scale-[0.98]`.
- Divider: wavy SVG scallop (`viewBox="0 0 400 20"`), fill matches card bg.
- Footer: `flex items-center justify-center gap-3 px-4 pt-2 pb-3` with GitHub + Google provider SVG icons.

### Entry sticky note card
- Container: `group relative flex scroll-mt-40 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 transition-transform duration-300 hover:z-10`.
- Alternating rotations: `rotate-1 hover:rotate-2`, `-rotate-2 hover:-rotate-4`, `rotate-2 hover:rotate-4` (tilt deepens on hover, 300ms).
- Top banner: `relative flex min-h-44 w-full items-center justify-center overflow-hidden p-6 pb-10 text-center`, colorful radial gradient + hand-drawn doodle sticker SVGs (`mix-blend-color-dodge`).
- Message: `relative z-10 line-clamp-6 text-balance font-bold text-lg leading-snug` (white on gradient).
- Perforated divider: SVG scallop `fill-white dark:fill-neutral-900`.
- Meta bar: `flex items-center justify-between px-4 pt-1 pb-3`; avatar `size-7 rounded-full ring-1` + name `truncate font-medium text-xs`; provider badge + `<time class="font-mono text-[10px] text-neutral-400">`.
- Hash-anchor target state: `target:ring-2 target:ring-white/40 target:ring-offset-2` for `#entry-...`.

### CTA (#contact)
- Shared site CTA: rounded-2xl ring card, canvas paper shader, draggable spinning "OPEN TO WORK" badge (star visible lg+), "Get In Touch" pill with clip-path reveal + hover scale-125.

---

## 5. Spacing

| Relation | Value |
| --- | --- |
| Main top padding | 152px (pt-38) |
| Main bottom padding | 96px (pb-24) |
| Super-title → H1 | 16px (mb-4) |
| Hero → grid | mb-pagebuilder token |
| Grid gap | 24px (gap-6) |
| Card banner min-height | 176px (min-h-44) |
| Card banner padding | p-6 pb-10 |
| Meta bar padding | px-4 pt-1 pb-3 |
| Avatar↔name gap | 10px (gap-2.5) |
| Frame rails | 32px desktop / 12px mobile |

---

## 6. Responsive deltas

| Feature | Desktop | Mobile |
| --- | --- | --- |
| Grid | lg:3-col, md:2-col | 1-col, gap-6 |
| H1 | 60px | 48px |
| Rails | 32px | 12px |
| Footer | 2-col | 1-col, bio hidden |
| CTA badge | offset top-right `translate-x-[280px] -translate-y-[70px]` | centered `top-10` |
| CTA hover | md:hover:scale-125 | max-md:scale-110 |
| Star icon | lg:block | hidden |

---

## 7. Interactions & Animations

- Card hover: rotation deepens (1→2°, -2→-4°, 2→4°) 300ms ease; `hover:z-10`.
- Target-state ring on hash navigation.
- Hero accent gradient shimmer: `@keyframes animate-gradient-x` on masked gradient text.
- CTA pill: scale-125 400ms `cubic-bezier(0.25,0.1,0.25,1)`; clip-path `inset(0 0 0 calc(100%-40px) round 9999px)` → `inset(0 round 9999px)` 500ms.
- Spinning badge: `spin-slow` continuous, draggable `cursor-grab`.
- Footer links: fill-up ::before 0→1.4em, arrow translate + 45° rotate.
