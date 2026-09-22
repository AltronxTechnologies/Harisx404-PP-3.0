# Community Wall - Desktop Specification

Route: `/community-wall`

Status: implemented and live-verified; owner lock pending.

## Structure

1. Shared locked Navbar and global rails.
2. `mt-14` page start with `GridWrapper` and `PaperHeroTexture`.
3. Centered Admin-managed hero: 12px/500 mono kicker, 16px gap, 48px
   mobile/60px desktop Instrument Serif heading, and 15/24px supporting copy.
4. Collection toolbar 96px below the hero with managed label and derived approved
   count.
5. Equal-height card grid: one column mobile, two columns at `md`, three at `lg`.
6. Shared locked CTA 112px after the collection and exact 0px Footer handoff.

## Cards

- Composer and message cards use the reference stamp proportions: 176px minimum
  visual body, 16px radii, `shadow-2xl`, scalloped tear edge, and compact metadata bar.
- Message panels select from 24 dark high-contrast radial palettes with quieter,
  side-biased decorative SVGs and six-line clamped 18px/700 copy. Message text
  uses a 28-character measure and restrained downward shadow.
- Message cards use deterministic subtle 1-2 degree rotations that deepen by one
  degree on hover; the action card remains straight and raised at `z-20`.
- Author identity is provider-derived and length-bounded. Sanitized GitHub/Google
  photos render when available; load failure or missing media falls back to one of
  24 deterministic emoji/color identities.
- Scallops have no light-mode seam and use a dark-only 0.75px white/18 stroke to
  distinguish the stamp body from its metadata surface.
- Copy-link controls are 36px, keyboard-visible, securely copy the stable hash URL,
  announce success, and clear timers on unmount.
- Hash targets use a visible route-token outline with a 144px scroll offset.

## Composer

- The permanent action card opens a centered, focus-trapped dialog rather than
  navigating directly to OAuth.
- Signed out dialog: managed title/description plus functional 48px GitHub and
  Google OAuth actions.
- Signed in dialog: managed title/description, labelled textarea, 200-character
  limit/counter, honeypot, and 48px submit action.
- Dialog uses a black/60 blurred backdrop, 400px maximum shell, 16px mobile inset,
  purple stamp header, scalloped edge, 200ms backdrop fade, and 250ms 0.95-to-1
  scale/fade transition.
- Success and failure states are announced; successful submission clears the form.
- A verified account can publish exactly one note immediately. After submission,
  the composer becomes a clear already-submitted state.
- OAuth start and callback failures have explicit recovery feedback.

## Data And Moderation

- Public source: `public_community_wall_messages`, containing only published rows
  and excluding `user_id`, status, and moderation metadata.
- Public reads are paginated at 24 notes with strict canonical page handling.
- Base message/settings tables deny `anon` and normal `authenticated` access.
- Verified server actions call the service-role-only
  `submit_community_wall_message` function.
- Submission uniqueness is atomic under a per-user advisory lock and partial
  unique index: exactly one note per Supabase account across providers.
- Admin `/admin/community-wall` has independently paginated pending and reviewed
  queues with approve, archive, return-to-review, and permanent delete actions.
- Page hero, collection, composer, empty-state, SEO, Open Graph, and Twitter copy
  are managed at `/admin/community-wall/settings`.

## States And Accessibility

- Route-specific geometry-matched loading, managed empty state, and focused
  assertive error recovery are required.
- Heading order: one H1, collection H2, card H3 headings, then shared CTA H2.
- Primary controls are at least 40px; compact copy-link controls are 36px with
  explicit labels and focus rings.
- One global Footer landmark; card metadata bars do not create extra landmarks.
- No horizontal overflow, duplicate IDs, broken media, console warnings, or
  persistent requests are accepted.
