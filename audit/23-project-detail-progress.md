# Project Detail: Verification In Progress

The detail template now reads published project fields and ordered gallery media from Supabase. It renders the Admin-authored Markdown narrative, optional highlights, captioned gallery, metadata and structured data without generating generic project claims. The Admin form can choose, caption, reorder and remove gallery media. Fallback case studies are disabled in production; development fallback remains available when no published DB list is returned.

## Verified

- `npm run test:projects`: published index links resolve, missing content stays unindexable, unauthenticated mutations return 401, and the gallery/narrative plumbing remains connected.
- Container TypeScript (`npx tsc --noEmit`) and targeted ESLint pass.
- Browser checks at 320px, 390px and 1440px show no horizontal overflow. Light and dark themes render correctly. The share control opens with pointer/keyboard and Escape restores focus. Published `intrushield-nids` shows its gallery and related project links.

## Owner-Managed Expansion

- Project type is free-form (rather than Web/Mobile/Other); Built and Latest update are manually entered labels. Visit and Source appear only when a corresponding URL exists. The short card/page summary is capped at 160 characters on new Admin edits.
- Tech stack entries are one per line with no project-level item cap; curated tools use the same simple-icons source as home cards, and unknown tools are displayed without a guessed icon. The media picker can load older images beyond the first 50.
- Profile-only GitHub URLs no longer claim to be project source; the Admin field now asks for a direct public repository URL.
- Optional Markdown fields for Why I built this, Key decisions, Results and What I learned complement the existing overview and highlights. Sections are hidden when empty. Two related projects are selected by published tag/stack/type overlap, not invented recommendations.
- **Deployment prerequisite:** apply `migrations/2026_project_case_studies.sql` to the connected Supabase database before saving a project from Admin. The sandbox only has a service-role REST key, not database DDL credentials; this migration could not be applied here. Until it is applied, existing public detail pages continue to render, but the revised Admin save will fail because the new columns do not exist.

## Not Locked

- Unknown slugs render the not-found content and `noindex`, but Next 15's streamed/prerendered response currently sends HTTP 200. Calling `notFound()` in metadata and forcing dynamic rendering did not change this. Fix and verify a real 404 before SEO/status sign-off.
- Project, gallery and tag writes are separate DB operations. `saveGallery` deletes all previous image rows before inserting replacements; failed inserts or concurrent saves can leave a partial project. A transaction/RPC and optimistic concurrency check are needed before write-path sign-off.
- Authenticated Admin gallery add/reorder/caption/remove has not been exercised against the connected database; no live owner records were mutated during this audit.
- Several published case studies remain sparse and use stock/irrelevant Unsplash imagery. Owner-authored narratives and real screenshots are needed for content approval. A project-list outage can still show checked-in fallback cards on the separately audited Projects index while production detail links return not found.
