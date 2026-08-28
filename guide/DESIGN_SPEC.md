# Design Spec — Portfolio Homepage (UI/Design System Only)

Recreate this in any React/Next.js project with YOUR OWN content, branding, and assets.

## 1. Tech Notes
- Plain React + Tailwind utility classes + a few CSS variables. No UI library.
- In Next.js: components go in `app/components/`, tokens in `globals.css`,
  fonts via `next/font`, images via `next/image`, links via `<Link>`.

## 2. Design Tokens

### 2.1 Theme (dark, near-black)
:root {
  --background: #121212;   /* body is pure #000 in dark */
  --foreground: #fafafa;
  --surface: #171717;      --surface-muted: #0f0f0f;
  --card: #171717;
  --hairline: #ffffff24;   --overlay-soft: #ffffff0d;
  --primary: #e5e5e5;      --secondary: #27272a;
  --muted: #262626;        --muted-foreground: #a1a1a1;
  --accent: #262626;       --border: #262626;
  --input: #ffffff26;      --ring: #737373;
}
- Text hierarchy: foreground → neutral-300 → neutral-400/500.
- Accent = indigo (300/400/500), used ONLY on hover (label color, border glow, blooms).
- Card recipe: bg-card/15, ring-1 ring-border, hover:bg-card/5.

### 2.2 Typography — 4 font roles
| Role | Usage | Free options |
|---|---|---|
| Sans (body/UI) | default | Outfit (Google Fonts) |
| Serif display | big section headings (+italic accent) | Instrument Serif |
| Mono | uppercase eyebrows/labels | JetBrains Mono / Geist Mono |
| Display slab | card titles, project names | Bricolage Grotesque |

Patterns:
- Eyebrow: font-mono text-xs uppercase tracking-widest text-white/70
- Section heading: eyebrow + serif text-5xl md:text-6xl font-medium tracking-tight
  text-center; final word(s) italic with ANIMATED GRADIENT text
  (background-size 200% 200%; 6s ease infinite background-position loop).
- Heading glow: text-shadow 0 4px 8px rgba(255,255,255,.05), 0 8px 30px rgba(255,255,255,.2)
- Card label pair: mono eyebrow (→ indigo on hover) + slab text-lg neutral-300.

### 2.3 Radius/borders
- Cards rounded-xl; project frames rounded-2xl/3xl; pills rounded-full.
- 1px hairlines everywhere (ring-border / border-border).
- Top light-edge on dark cards: 1px gradient line
  linear-gradient(90deg, transparent 5%, rgba(255,255,255,.8) 35%, #fff 50%,
  rgba(255,255,255,.8) 65%, transparent 95%)

## 3. Page Skeleton
body (black)
├─ fixed blurred strip at top (backdrop-blur 2px, mask fade to transparent)
├─ fixed floating pill navbar (top-2.5 md:top-4, z-50)
├─ main → .container → grid-cols-[12px_1fr_12px] lg:grid-cols-[32px_1fr_32px]
│    ├─ GridEdge rail (left)   ← signature diagonal hatch
│    ├─ content column (all sections)
│    └─ GridEdge rail (right)
├─ full-bleed CTA band
└─ footer

GridEdge hatch:
  background-size: 5px 5px;
  background-image: linear-gradient(45deg, #262626 12.5%, transparent 12.5%,
    transparent 50%, #262626 50%, #262626 62.5%, transparent 62.5%, transparent 100%);
  border-left/right 1px hairline.

Section rhythm: ~96–128px vertical padding per section; border-y hairlines around card grids.

## 4. Sections

### 4.1 Navbar
Floating centered pill: logo left · Home/About/Work/Blog/More▾ · white pill CTA button right.
Translucent dark bg + blur, rounded-full, hairline ring. "More" = dropdown.

### 4.2 Hero
- Top-left small "New" pill badge (label + arrow).
- Big 2-line display headline: line 1 sans, line 2 SERIF ITALIC with pink/magenta gradient.
- Small mono sub-line under it.
- Photo strip: 3–4 overlapping slightly-rotated rounded photos.
- Right side: 2 short right-aligned muted tagline lines + huge 2-line serif display name.
- Bottom row: 3 status mini-cards (mono eyebrow+icon / bold line / muted line) with hairline
  dividers + pill button with double-arrow hover swap.
- Visually-hidden h1 for SEO.

### 4.3 Bento grid (md:grid-cols-12 gap-3 border-y)
| Card | lg span | Visual |
|---|---|---|
| Link card A | 7 × 5 | horizontal connector line w/ centered circular avatar, edge-fade mask |
| Tech Stack panel | 5 × 5 | 3 infinite marquee rows of tech pills (alternating direction) + magnifier circle |
| Link card B | 4 × 6 | open-box illustration + floating badge |
| Timezones panel | 4 × 6 | bottom-half dotted 3D globe + orbiting city labels |
| Uses link card | 4 × 6 | 5 rounded-square tool icons, lift on hover w/ stagger |

Shared card recipe:
  group relative flex flex-col justify-between overflow-hidden rounded-xl
  bg-card/15 hover:bg-card/5 ring-1 ring-border min-h-72 transition-colors duration-300
+ hover gradient overlay (to-white/5, fade in)
+ bottom-right arrow chip (size-9 rounded-2xl bg-white/10) slides up + fades in on hover.

### 4.4 Case studies
- 60/40 split on lg: left column of articles (gap-y-32); right = sticky top-32 details
  panel (name, description, ✓ bullets, tech chips) for the active project.
- Article = header row (number `01` + category pill, slab project name, quarter right)
  → project card → tech chip row.
- Project card: aspect-16/11 rounded-3xl p-2 bg-white/6 outer bezel; inner rounded-[16px]
  black panel with per-project 145deg 4-stop single-hue gradient bg
  (hover: scale-105 + brightness/saturation lift); top bar = tagline + arrow;
  screenshots: 1 browser shot OR 2–3 overlapping shots with perspective-[2000px],
  slight rotations that animate apart on hover, border-2 border-white/50, deep shadows.
- Tech chip: rounded-md bg-primary/5 px-2.5 py-[5px] font-mono text-[11px] uppercase + 14px icon.
- "See more" pill link with double-arrow.

### 4.5 Blog
3-col grid between border-t/b. Card: image header (hover zoom 105, caption chip overlay),
title, 2-line clamped excerpt, meta ("15 min read · date", mono) + "Read article" double-arrow.

### 4.6 About
2 cols: eyebrow + serif heading w/ gradient-italic word, 3 muted paragraphs, social pill
links, "Work Experience" arrow link. Right: tilted rounded photo/logo card.

### 4.7 Testimonials
Horizontal card track (bold one-liner, quote, avatar+name+role). Controls: 6-segment
progress tablist + play/pause. Autoplay, pause on hover.

### 4.8 Explore grid
3 equal cards reusing bento recipe (tools icons / rotated photo in dashed frame /
stacked postcards).

### 4.9 CTA band
Full-bleed black. Rotating circular text badge (repeated phrase around circle, slow spin,
logo center) + wings ornament + 2-line display heading (accent word + "!" chip) +
white pill button + 2 muted lines. Soft radial glows in corners.

### 4.10 Footer
Intro blurb + 3 link columns (links reveal small arrow on hover) / bottom bar with © and
legal links, hairline above.

## 5. Motion
- 300ms colors/opacity, 500ms transforms, ease-out.
- Double-arrow buttons: 2 stacked arrows in overflow-hidden box; hover slides one out,
  next in (translate-x swap).
- Marquee: duplicate list 3× + translateX keyframe loop; edge fade via mask-image.
- Gradient text: gradient-x keyframes (background-position 0%→100%→0%), 6s ease infinite;
  paused under prefers-reduced-motion.
- Circular text: SVG textPath on circle + slow rotate.
- Sticky details panel in work section.

## 6. Build order
tokens → shell (rails, navbar, blur strip) → shared card + heading components →
hero → bento → work → blog → about → testimonials → explore → CTA → footer → motion layer.

## 7. Make it yours
Swap: accent hue, hero gradient, display fonts, project gradients, all imagery and copy.
The grid, spacing rhythm, and interaction patterns are the transferable craft.