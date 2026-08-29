# Community Wall (Guestbook) — Blueprint Spec (MOBILE)

Reference: guestbook page (mobile capture, ~375–500px). Route: `/community-wall`.
Companion: `community-wall-desktop-spec.md` (shares tokens/components; this file records mobile deltas + mobile-specific values).

---

## Layout (top to bottom)
1. Header fixed `top-2.5`, blur mask `h-[90px]`.
2. Hero/title `max-w-xl`, `pt-38` (152px) main top pad, `text-center`, `max-sm:px-5`, `mb-pagebuilder`.
3. Super-title mono 12px uppercase tracking-widest `mb-4`.
4. **Cards: 1-column vertical stack** `grid grid-cols-1 items-start gap-6`. Sign-in card first, then entry sticky notes.
5. CTA (#contact) `py-10`, badge centered `top-10 left-1/2 -translate-x-1/2`, button `max-md:scale-110`.
6. Footer 1-col stack (bio hidden), `px-4 py-6`, `max-sm:px-1`.
7. Frame rails: `grid-cols-[12px_1fr_12px]` hatched.

## Mobile typography deltas
| Style | Mobile | Desktop |
| --- | --- | --- |
| H1 hero (Instrument Serif) | 48px / 1.0 | 60px |
| CTA title | 24px | 48px |
| User name in meta bar | 14px/500, #3f3f46 / #d4d4d8 | 12px/500, #262626 / #e5e5e5 |
| Timestamp | 12px mono | 10px mono |

Everything else (colors, gradients, sign-in card, sticky note structure, wavy perforation, avatar size-7 ring-1, spacing: min-h-44 banner, p-6 pb-10, meta px-4 pt-1 pb-3, gap-2.5, gap-6 stack, pb-24 main) identical to the desktop spec.

## Interactions (same as desktop)
- Rotation tilt deepens on hover 300ms, `hover:z-10`.
- `target:` ring for `#entry-...` anchors.
- Hero accent gradient shimmer (`animate-gradient-x` masked).
- CTA clip-path reveal 500ms; spin-slow badge, draggable.
