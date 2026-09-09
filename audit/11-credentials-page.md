# Credentials Page Production Audit

- Route: `/credentials`
- Audit date: 2026-09-07
- Status: Implemented and awaiting owner approval
- Source of truth: Supabase `certifications`, managed through
  `/admin/certifications`. No Credly integration or public-code fallback.

## Data and administration

- `2026_certifications_expanded.sql` adds issuer logo, badge media, credential
  ID, issue/expiration state, description, skills, category, and demo status.
- `2026_credentials_review_seed.sql` removes the earlier review demos and
  inserts the five owner-supplied LinkedIn credentials with official issuer
  names, media, IDs where supplied, and verification URLs where supplied.
- Admin form controls every public field and validates URLs, limits, category,
  status, skill count, and expiration requirements.
- Admin API uses verified `auth.getUser()`, ADMIN_EMAIL allowlisting,
  service-role operations after authorization, strict Zod parsing, no mass
  assignment, bounded GET limits, and targeted path/tag revalidation.
- Admin list uses service-role reads after middleware protection so draft and
  archived records remain manageable instead of disappearing behind public RLS.

## Public design

- Uses the locked 56px page offset and hero system: shared paper texture,
  12px/500 mono kicker, 46/56px Instrument Serif heading, `max-w-xl`, 16px
  internal gaps, shared animated accent, and 15/24px supporting copy.
- Collection toolbar uses professional public-facing copy and a zero-padded,
  grammar-aware published credential count.
- Cards use equal 232px heights, one/two/three-column responsive layouts, 3px
  grid gaps, 2xl shells, 48px issuer-logo surfaces, 22/24px title typography,
  optional credential ID, accurate status, and verification action.
- Admin image failures fall back cleanly without exposing broken-image glyphs.
- Empty collection uses the approved state panel and Resume recovery action.
- Shared CTA begins 112px after the collection and remains unchanged.

## Compact owner-directed revision

- Replaced the large evidence-panel cards with equal 232px compact cards.
- Public cards expose only issuer logo/name, credential title, optional
  credential ID, verification status, and verification action. Dates,
  descriptions, categories, badge media, and skills remain Admin-managed but
  are not selected, serialized, or rendered publicly.
- Removed every public skill/category tag and all expandable content so records
  with different metadata cannot disturb card or grid geometry.
- Grid uses equal-width one/two/three-column layouts at base, `sm`, and `xl`.
- Replaced six visual demo rows with the five owner-supplied LinkedIn records:
  Harvard CS50P, Cisco Introduction to Cybersecurity, Microsoft AI Skills Fest,
  Apna College Delta 2.0, and Scaler Master Computer Networking.
- Four cards expose official verification destinations. Delta 2.0 accurately
  displays verification unavailable because no URL was supplied.
- Admin remains the only content-management source and still controls all
  extended metadata for future design changes.

## Responsive and theme verification

- Dark full-page renders passed at 1440, 768, and 390px with no visible
  clipping, card overlap, or Footer collision.
- Light desktop render passed with clear card boundaries, readable metadata,
  balanced evidence surfaces, and correct theme hierarchy.
- Loading preserves exact hero wrapping, toolbar, responsive card geometry,
  CTA reservation, and Footer handoff while exposing only one concise live
  loading message.
- Route errors distinguish database failure from an empty collection and use
  the approved focused resilient-state panel.

## Verification

- TypeScript, targeted ESLint, and `git diff --check`: passing.
- `/credentials`: HTTP 200.
- Every unauthenticated Certification API verb: HTTP 401.
- Harvard, Cisco, Microsoft, Apna College, and Scaler media resolve or degrade
  to the issuer initial without broken-image UI. All four supplied verification
  URLs return HTTP 200 to browser-compatible requests.
- `npm run test:credentials` covers route structure, no Credly/fallback code,
  expanded schema, compact public-data boundaries, exact review seed, and admin
  authorization.

The expanded schema and five-record review dataset are live. Apply
`migrations/2026_certifications_hardening.sql` before deployment to enforce the
issuer requirement at the database layer. Credentials remains unlocked pending
owner visual approval.
