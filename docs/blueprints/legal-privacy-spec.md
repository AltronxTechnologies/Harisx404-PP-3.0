# Legal / Privacy Page — Blueprint Spec (DESKTOP + mobile deltas)

Reference: privacy policy page (desktop capture ≥1024px). Route: `/legal/privacy`.
Same page skeleton as buildlog/links: hero + numbered 12-col split sections + CTA + rails.

## Layout
1. Hero: super-title mono "Legal & Privacy" `mb-4`; H1 Instrument Serif 60px (48 mobile)
   with italic gradient shimmer accent; main `pt-38 pb-24`.
2. Three numbered sections (01 Collect. / 02 Measure. / 03 Yours.) each
   `grid grid-cols-1 lg:grid-cols-12`:
   - Left `lg:col-span-3 p-4 lg:p-6 sticky top-32`: index (mono 12px bold),
     title (display serif 30px/700; 24px mobile), muted subtitle (same size, #a3a3a3/#777B84).
   - Middle `lg:col-span-1 hidden lg:block border-x border-dashed`.
   - Right `lg:col-span-8 p-4 lg:p-6 space-y-8`: lead paragraph (18px, #525252/#d4d4d8) + cards.
3. Inter-section divider: double `border-t` lines in `flex flex-col gap-4`.
4. Shared CTA + footer; hatched rails 32/12px.

## Components
### Feature policy card (Section 01, md:grid-cols-2 gap-6)
`flex flex-col gap-4 rounded-xl border bg-neutral-50/50 p-6 dark:bg-neutral-900/20`;
icon bubble `size-10 rounded-full border bg-white dark:bg-neutral-800 dark:border-neutral-700`
(icon size-5, text-neutral-600/300); header tag mono 12px bold uppercase tracking-wider mb-2;
body 14px leading-relaxed #525252/#a3a3a3.

### Tool analytics card (Section 02, grid gap-4)
`flex items-start gap-4 rounded-lg border border-dashed p-4 transition-colors
hover:bg-neutral-50 dark:hover:bg-neutral-900/30`; icon `mt-1 size-5 text-neutral-400`;
title semibold 14px + description 14px text-neutral-500.

### Ownership callout (Section 03)
`rounded-xl border bg-neutral-50/50 p-8 dark:bg-neutral-900/20`; shield icon size-6 +
"Ownership & Deletion" bold 18px; body; `my-8 border-t border-dashed` then contact strip:
mailto link (medium, hover:underline) + clock icon revision date (mono meta).

## Mobile deltas
1-col stack, static headers p-4, spacer hidden, feature cards 1-col, H1 48px, H2 24px, rails 12px.

## Content adaptation (our site)
- 01 Collect — guestbook GitHub profile (name/avatar), contact form details, newsletter email,
  anonymous page-view counts.
- 02 Measure — Supabase (data + auth), self-hosted view counter, Cloudinary (images),
  no ad trackers / no data sale.
- 03 Yours — ownership & deletion promise; contact itsharis.tech@gmail.com; last-revised date.

## Mobile capture cross-check (verified against implementation)
- Hero visible on mobile, H1 48px (`text-5xl md:text-6xl`) ✓
- Section headers static `p-4` blocks above content (sticky only at lg) ✓
- Middle dashed spacer hidden below lg ✓
- Feature cards 1-col `gap-6` mobile → `md:grid-cols-2` ✓
- Tool cards `gap-4`, dashed border, hover tint ✓
- H2 24px mobile (`text-2xl md:text-3xl`), measured 24px at 390px ✓
- Double border-t dividers `gap-4` ✓
- Rails 12px mobile / 32px desktop ✓
- Ownership callout p-8, dashed divider, mailto + clock meta ✓
- Programmatic test results: overflow none, header position static @390px,
  sticky/128px @1440px.
