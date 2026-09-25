# Resume Final Production Lock Audit

- Date: 2026-09-24
- Route: `/resume`
- Status: page shell production-ready; Admin storage migration pending

## Final State

- The Resume uses the same frame, hero texture, typography, spacing, colors,
  radius tiers, CTA rhythm, Navbar, Search, and Footer as the locked public pages.
- The public page is a responsive Resume gateway for the exact PDF selected through
  Admin; it never reconstructs or embeds the document.
- One, two, or more pages and any PDF dimensions work without a layout or code
  change because Open uses the browser's native document viewer.
- The document card provides 48px Download and Open actions. `/resume/file` preserves the
  original uploaded bytes and filename and supports inline or attachment delivery.
- Filename, byte size, and the database-managed upload date update with the active
  document. Delete produces an intentional unavailable state until another upload.
- Loading preserves hero and gateway-card geometry. Error recovery focuses its heading
  and offers retry, direct PDF access, and a safe route home.

## Corrected Issues

1. Replaced invalid paragraph-inside-`h1` markup with a semantic header.
2. Removed duplicate page rails and the obsolete Resume-only hero texture.
3. Aligned top offset, heading scale, hero-to-content gap, outer radius, CTA gap,
   and Footer handoff with the locked page system.
4. Fixed the real 2.52:1 metadata contrast failure and raised minimum visible
   document text to 11px.
5. Added labelled article and nested heading semantics, definition lists, address
   semantics, new-tab announcements, and explicit focus indicators.
6. Corrected CGPA, Cybersecurity coursework, and KPITB AI/ML facts to match About.
7. Replaced the stale `/static/haris_resume.pdf` metadata URL with the live PDF.
8. Added route-matched loading/error states and a dedicated integration suite.

## Verification

| Gate | Result |
|---|---|
| Resume route | HTTP 200 |
| Canonical PDF | HTTP 200, `application/pdf`, valid `%PDF-` signature |
| TypeScript | Passed, 0 errors |
| Targeted ESLint | Passed, 0 errors |
| Resume integration | 5/5 passed |
| Navigation integration | 4/4 passed |
| Preview integration | 3/3 passed |
| Desktop light/dark visual pass | Passed at 1440x900 |
| Tablet geometry | Passed at 1024x768 and 768x1024 |
| Mobile geometry | Passed at 390x844 and 360x640 |
| 390px gateway bounds | Passed; no clipping or overflow |
| Horizontal overflow | 0 at audited widths |
| Primary PDF actions | 48px high |
| Page headings | One page `h1`; logical gateway card hierarchy |
| Duplicate IDs | 0 |
| Application console errors | 0 |
| `git diff --check` | Passed |

## Intentional Variations

- Uploaded PDFs retain their authored document colors, dimensions, and typography
  because the site never recolors, scales, or reconstructs their contents.
- Open Resume delegates zoom, search, print, and link handling to the browser's
  native PDF viewer; Download returns the exact uploaded bytes.

## Lock Decision

The Resume route shell and compatibility fallback are responsive, theme-safe, and
protected by route and PDF regression tests. Managed-storage sign-off remains
pending only on applying the checked-in Supabase migration and exercising one live
upload, replacement, deletion, and add-after-delete cycle.

## Admin-Managed PDF Amendment

On 2026-09-24 the owner replaced the hard-coded web-document contract with a
single active Admin-managed PDF contract:

- `/admin/resume` supports upload, replacement, deletion, and add-after-delete.
- The upload API uses verified Admin identity, PDF signature and 10MB validation,
  unique private object paths, safe replacement, and cache invalidation.
- `/resume/file` preserves the exact bytes and original uploaded filename.
- The public page displays the stored filename, database upload date, and byte size,
  then offers native Open and exact-file Download actions without embedding pages.
- The old `Web resume` label and separately maintained HTML Resume are removed.
- The existing static PDF remains only as a compatibility fallback until the first
  Admin-managed upload.

Code, compatibility fallback delivery, desktop/mobile geometry, secure file
headers, exact-byte comparison, TypeScript, ESLint, and 5/5 Resume integration
contracts pass. The connected Supabase environment still requires
`migrations/2026_resume_document.sql` before live Admin mutation testing and final
managed-storage sign-off.

## Reviewer-Facing Final Pass

The visitor-facing copy is directed to readers, recruiters, and hiring teams:

- Current version: review the latest published copy and its update date.
- Original presentation: open the PDF with its own formatting and links intact.
- Share with your team: download a copy for hiring reviews, referrals, or
  interview discussions.

The hero and card descriptions no longer tell the Resume owner to save their own
application copy. Metadata labels have been raised from 9px to 11px. The approved
site-wide kicker, Instrument Serif heading scale, secondary-copy color, 16px and
24px card radius tiers, 56px hero-to-card separation, and 112px CTA handoff remain
unchanged. Light and dark desktop visuals were inspected. Measured page/card
geometry shows no overflow at 768px, 390px, or 360px; the two file actions remain
48px high. TypeScript, ESLint, Resume (5/5), navigation (4/4), preview (3/3),
browser console, and `git diff --check` passed. Presentation is re-locked; the
live Admin Storage migration remains pending as documented above.

## Full-System Audit Follow-Up

The connected Supabase project now contains the singleton Resume row
(`is_configured = false`) and the private `resume-documents` bucket. The first
migration is therefore present, but authenticated upload/replace/delete/restore
and a fact-checked owner-provided PDF remain unverified. The additional
`migrations/2026_resume_document_hardening.sql` is needed for the already-created
table's active-field constraint.

This audit corrected direct access to the old static PDF path by redirecting it
to the state-aware `/resume/file` endpoint, prevented stale concurrent record
updates from silently overwriting one another, bounded sanitized filenames to the
180-character database limit, supported the no-Supabase file fallback, and kept
Admin status failures distinct from an inactive Resume. The integration test now
checks fallback bytes only if fallback metadata is actually in use, so a valid
managed upload will not fail the regression gate. The file endpoint buffers and
returns the original bytes; it does not stream from Storage to the client.

The compatibility PDF still contains education claims inconsistent with the
locked About page. The owner's locally prepared PDF should be fact-checked before
upload. The **public page presentation remains locked**; final managed-lifecycle
and content sign-off must wait for the remaining Admin and migration checks.

## Final Public Gateway Decision

The public update date was removed at the owner's request. File size and format
remain visible; the database-managed timestamp stays available to Admin. The
PDF route sends `no-store` responses and Admin mutations invalidate the page, so
Open and Download use stable URLs with no timestamp query string. The Current version card
no longer refers to a visible date. Both desktop themes and the 390px mobile
layout were checked after this change: no overflow, 48px Open/Download targets,
and no application console errors. TypeScript, targeted ESLint, Resume (5/5),
navigation (4/4), preview (3/3), PDF delivery, and `git diff --check` pass.

**Lock:** the public page design and read-only file gateway are final and frozen.
The owner reports running the SQL migrations, and the connected singleton row and
private bucket are confirmed. The live constraint definition is not introspectable
through the app's Supabase API. Authenticated Admin upload/replacement/deletion and
the owner's new PDF are deferred until deployment; their acceptance must be
recorded separately rather than assumed from this public-page audit.
