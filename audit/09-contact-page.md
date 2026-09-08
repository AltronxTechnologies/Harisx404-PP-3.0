# Contact Page Audit

- Route: `/contact`
- Audit date: 2026-09-07
- Status: Implemented and awaiting owner approval
- Scope: Contact-owned page, form, route states, server action, migration, and
  SMTP environment contract. Locked reference surfaces were not modified.

## Final structure

- Uses the locked page-heading system: 12px mono kicker, 46/56px Instrument
  Serif heading, gradient italic emphasis, 15/24px supporting copy, and the
  shared paper texture.
- Booking and contact tabs were removed by owner instruction. The page now has
  one direct Send Message experience.
- Desktop uses a sticky availability/context card beside the form. Tablet and
  mobile stack the same cards in reading order.
- Form fields are Name, Email, Inquiry Type, Subject, and Message. The mobile
  submit action becomes full-width; larger screens align the privacy note and
  action horizontally.
- Email, LinkedIn, GitHub, and the temporary `#` Twitter link remain available
  in the context card.

## Submission pipeline

- `app/contact/actions.ts` validates and normalizes every value with Zod.
- A hidden honeypot silently accepts bot submissions without storage or email.
- Public attempts are limited to three per IP per ten minutes.
- Valid messages are inserted through the server-only service-role client into
  the private `contact_messages` table.
- Nodemailer sends through generic SMTP with a five-second connection/greeting
  timeout and ten-second socket timeout. The submitter becomes `replyTo`.
- Email content is HTML-escaped. SMTP errors never expose credentials or message
  content to the client.
- Storage is authoritative: when SMTP delivery fails after a successful insert,
  the row is marked `email_status='failed'` and the visitor still receives a
  truthful stored-message success state.
- The migration enables RLS and grants no anonymous or authenticated table
  access. Public writes occur only through the validated server action.

## States and accessibility

- Required-field errors are associated through `aria-invalid` and
  `aria-describedby`; the aggregate error uses `role='alert'`.
- Submission disables the action and changes its label to `Sending message...`.
- Success uses a live status, explicit confirmation copy, and a reset action.
- Route loading geometry mirrors the resolved header and two-card composition.
- Route errors use the established shared state panel, focus the error heading,
  and provide retry and direct-email recovery actions.
- Inputs preserve visible keyboard focus, labels remain visible, textarea has a
  passive associated character count, and all interactive targets meet the established size
  system.

## Verification

- TypeScript: passed.
- Targeted ESLint: passed.
- `git diff --check`: passed.
- `/contact`: HTTP 200 through Docker and the Alloy proxy.
- Browser matrix: 1440x900, 768x1024, 390x844, and 360x640 in light and dark.
- Every tested width: document width equals viewport width; no horizontal
  overflow.
- Booking copy and tablists: absent at every tested viewport.
- Expected visible controls: five form fields and one submit action.
- Empty-submit validation: four invalid required fields and four specific field
  errors, plus the aggregate alert.
- Honeypot success simulation: confirmation rendered, reset restored blank
  fields, no storage/email side effect, and no console errors.
- Dark and light full-page screenshots show complete form, card, and Footer
  handoff without clipping.

## Deployment requirements

1. Apply `migrations/2026_contact_messages.sql` in Supabase. Confirmed applied
   successfully by the owner on 2026-09-07.
2. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
   `SMTP_PASSWORD`, and `SMTP_FROM_EMAIL`.
3. Keep `ADMIN_EMAIL` configured as the destination inbox.

Contact remains open for owner review. Do not add it to the production lock
until visual approval is explicit.

## Final presentation amendment

- Removed the repeated visible email address from the availability card; the
  accessible email icon remains in the social action row.
- Added the locked shared CTA 112px after the form, immediately before Footer,
  matching its placement on the approved public pages.
- Rechecked full-height desktop and mobile renders: the icon row, form, CTA,
  glow containment, and Footer handoff remain aligned with no clipping.

## Inquiry selector and form-heading alignment

- Moved the message icon into the exact 36px `Send a message` kicker row. Its
  center now aligns with the kicker rather than floating between the kicker and
  heading; the heading starts on an independent baseline below.
- Replaced the native select with an accessible Headless UI listbox using the
  same 44px field shell, approved light/dark borders, rotating chevron, selected
  checkmark, keyboard focus rows, compact shadow, and scroll-bounded popup.
- Inquiry types classify visitor intent rather than technical domain: General
  Question, Project Inquiry, Freelance Project, Full-time Opportunity, Security
  Report, Website Issue, Consulting Request, Collaboration / Partnership, and
  Other Inquiry. Each popup row includes a concise disambiguating description.
- Added `migrations/2026_contact_inquiry_types.sql` because the owner had already
  applied the original table constraint before the expanded list was approved.
- The listbox uses viewport-aware anchoring and non-modal focus management, so
  it remains attached to the field, flips when needed, scrolls internally, and
  does not move the page or disappear beneath the fixed Navbar.
- Live desktop interaction passed selected checkmark, internal scrolling,
  rotating chevron, End/Enter selection, close-on-selection, and focus return.
  Closed-state desktop/mobile renders pass without alignment drift or overflow.
  TypeScript, targeted ESLint, and `git diff --check` pass.

## Final production-hardening pass

- Contact hero now uses the locked `max-w-xl` heading measure and matching
  qualified response-time language throughout.
- Required semantics, selected-value announcement, inquiry-error association,
  pending live status, first-invalid focus, success-heading focus, aggregate
  error clearing, and 44px secondary targets are complete.
- Rejected action requests always restore the submit button through `finally`;
  a synchronous ref prevents rapid duplicate dispatches.
- A client request UUID and unique database index make retries idempotent.
- Contact rate limiting moved from process-local memory to an atomic private
  Supabase RPC using a salted signal hash and ten-minute windows. Limiter
  failures fail closed.
- SMTP status updates are checked. Failed delivery records attempt count and a
  retry timestamp while preserving the stored-message success contract.
- The applied base migration is restored to its original immutable constraint;
  every schema evolution lives in `2026_contact_inquiry_types.sql`.
- Loading now uses the exact paper hero shell, natural heading/copy geometry,
  responsive card columns, CTA reservation, and Footer handoff.
- Added `npm run test:contact` coverage for route structure, removed booking UI,
  inquiry-value parity, idempotency, private rate limiting, and RLS.
