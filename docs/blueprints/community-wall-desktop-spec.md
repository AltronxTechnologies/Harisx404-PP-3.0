# Community Wall - Desktop Specification

Route: `/community-wall`

Status: implemented locally; live Supabase cutover and owner lock pending.

## Structure

1. Shared locked Navbar and global rails.
2. `mt-14` page start with `GridWrapper` and `PaperHeroTexture`.
3. Centered Admin-managed hero: 12px/500 mono kicker, 16px gap, 46px
   mobile/56px desktop Instrument Serif heading, and 15/24px supporting copy.
4. Collection toolbar 56px below the hero with managed label and derived approved
   count.
5. Equal-height card grid: one column mobile, two columns at `md`, three at `lg`.
6. Shared locked CTA 112px after the collection and exact 0px Footer handoff.

## Cards

- Composer and message cards use equal `286px` minimum geometry, 16px radii,
  shared borders, restrained shadows, and 56px metadata bars.
- Message panels preserve the five Community Wall color identities with bounded
  decorative SVGs and six-line clamped 18px/600 copy.
- Cards remain aligned; the former random visual rotations are removed.
- Author identity is GitHub-derived, length-bounded, and rendered with a sanitized
  HTTPS GitHub avatar or deterministic initial fallback.
- Copy-link controls are 36px, keyboard-visible, securely copy the stable hash URL,
  announce success, and clear timers on unmount.
- Hash targets use a visible route-token outline with a 144px scroll offset.

## Composer

- Signed out: managed title/description and a 40px GitHub OAuth action.
- Signed in: managed title/description, labelled three-row textarea, 200-character
  limit/counter, honeypot, and 40px submit action.
- Success and failure states are announced; successful submission clears the form.
- Notes enter `pending` status and clearly state that moderation occurs before
  publication.
- OAuth start and callback failures have explicit recovery feedback.

## Data And Moderation

- Public source: `public_community_wall_messages`, containing only published rows
  and excluding `user_id`, status, and moderation metadata.
- Public reads are paginated at 24 notes with strict canonical page handling.
- Base message/settings tables deny `anon` and normal `authenticated` access.
- Verified server actions call the service-role-only
  `submit_community_wall_message` function.
- Submission limits are atomic under a per-user advisory lock: 60-second cooldown
  and three notes per rolling 24 hours.
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
