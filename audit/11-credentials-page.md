# Credentials Page Production Audit

- Route: `/credentials`
- Audit date: 2026-09-07
- Status: Implemented and awaiting owner approval
- Source of truth: Supabase `certifications`, managed through
  `/admin/certifications`. No Credly integration or public-code fallback.

## Data and administration

- `2026_certifications_expanded.sql` adds issuer logo, badge media, credential
  ID, issue/expiration state, description, skills, category, and demo status.
- The migration removes only the two exact legacy placeholder rows and inserts
  six clearly marked demo records across Web, Cybersecurity, AI / ML, Cloud,
  API, and data-engineering review states.
- Demo verification links use `example.com`; demo records are visibly labelled
  and can be edited or deleted through Admin.
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
- Collection toolbar identifies the admin source and shows grammar-aware totals
  for published credentials and represented domains.
- Cards use one/two/three-column responsive layouts, 3px grid gaps, 3xl shells,
  compact 144/160px evidence panels, issuer and badge media with initial fallbacks, explicit
  demo and verification states, issuer identity, 24/28px titles, 15/22px copy,
  issue/validity metadata, skill evidence, credential ID, and 44px verification
  actions.
- Admin image failures fall back cleanly without exposing broken-image glyphs.
- Empty collection uses the approved state panel and Resume recovery action.
- Shared CTA begins 112px after the collection and remains unchanged.

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
- Demo issuer media: Cisco, Microsoft, and Google URLs return HTTP 200.
- `npm run test:credentials` covers route structure, no Credly/fallback code,
  expanded schema, and admin authorization.

Apply `migrations/2026_certifications_expanded.sql`, then replace/delete demo
records in Admin. Credentials remains unlocked pending owner visual approval.
