# Links Page — Blueprint Spec (DESKTOP + mobile deltas)

Reference: links/social-profiles page (desktop capture ≥1024px). Route: `/links`.

## 1. Layout

1. Header/nav — standard fixed pattern.
2. Hero — `max-w-xl` centered, `pt-28 md:pt-38`, super-title mono 12px "Connect" `mb-4`,
   H1 Instrument Serif 60px (48px mobile) with italic gradient shimmer accent; hero text-shadow.
3. **Split grid** — `grid grid-cols-1 lg:grid-cols-12 border-t border-dashed`:
   - **Left (lg:col-span-3)** sticky `top-32`, `p-4 lg:p-6`: profile card.
   - **Middle (lg:col-span-1)** `hidden lg:block border-x border-dashed` structural spacer.
   - **Right (lg:col-span-8)** `p-4 lg:p-6`: category sections (`space-y-12`), each with
     group header + `grid grid-cols-1 sm:grid-cols-2 gap-4` link cards.
4. CTA (#contact) shared; footer standard; hatched rails 32px/12px.

## 2. Components

### Profile card (left, sticky)
- `rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900`.
- Avatar `size-24 rounded-full mx-auto relative` + live beacon bottom-right:
  `size-2.5 rounded-full bg-green-500` with `animate-ping` ring (green-400/75).
- Name: display serif (`font-display`) 24px/700 centered.
- Role badge pills: `rounded-md h-5 px-2 font-mono text-xs bg-neutral-50 dark:bg-neutral-800`,
  text #525252 / #a3a3a3 (e.g. Developer · Freelancer).
- Divider `border-t border-dashed border-neutral-100 dark:border-neutral-800 mt-6 pt-6 space-y-3`,
  location + email rows (Outfit 14px, #525252/#a3a3a3).
- Primary CTA "Book a Call": `w-full rounded-lg bg-neutral-900 text-white dark:bg-white
  dark:text-neutral-900 py-2.5 px-3 font-medium text-sm flex items-center justify-center gap-1.5`;
  arrow translates `translate-x-1 -translate-y-1` on hover.
- Secondary 2-col grid: "Website" + "Email" — `rounded-lg border bg-neutral-50 dark:bg-neutral-800
  py-2.5 text-xs font-medium` (hover bg-white / neutral-700-ish).

### Social link card
- `group relative flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4
  transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800
  dark:bg-neutral-900/30 dark:hover:border-neutral-700 dark:hover:bg-neutral-900`.
- Icon box: `size-12 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700
  dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400
  group-hover:bg-white`; icon `group-hover:scale-110 duration-300`.
- Info: title `font-semibold text-sm` (#171717/#fff) + handle `font-mono text-[10px]`
  (#737373/#a3a3a3).
- Hover arrow (top-right): `size-3 text-neutral-400 opacity-0 -translate-x-1
  group-hover:opacity-100 group-hover:translate-x-0 transition-all`.

### Category header
- `flex items-center gap-4 mb-6`: title `font-bold font-mono text-xs uppercase tracking-wider`
  (#a3a3a3/#525252) + `h-px flex-1 border-t border-dashed`.
- Groups e.g. "Code & Craft" (GitHub, TryHackMe...), "Connect" (LinkedIn, X, Email...).

## 3. Spacing
Main pt-38/pb-24 · groups space-y-12 · header mb-6 · cards gap-4 p-4 · profile p-6 sticky top-32.

## 4. Responsive deltas
1-col stack mobile (profile card static on top, spacer hidden, links 1-col);
H1 48px; rails 12px; sm:grid-cols-2 for cards.

## 5. Interactions
Card hover (border, shadow-md, icon scale-110, arrow slide-in); beacon ping;
Book-a-Call arrow nudge; hero shimmer; shared CTA/footer effects.
