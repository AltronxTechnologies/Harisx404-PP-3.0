# Project Detail: Verification In Progress

The detail template now reads published project fields and ordered gallery media from Supabase. It renders the Admin-authored Markdown narrative, optional highlights, captioned gallery, metadata and structured data without generating generic project claims. The Admin form can choose, caption, reorder and remove gallery media. Fallback case studies are disabled in production; development fallback remains available when no published DB list is returned.

## Verified

- `npm run test:projects`: published index links resolve, missing content stays unindexable, unauthenticated mutations return 401, and the gallery/narrative plumbing remains connected.
- Container TypeScript (`npx tsc --noEmit`) and targeted ESLint pass.
- Browser checks at 320px, 390px and 1440px show no horizontal overflow. Light and dark themes render correctly. The share control opens with pointer/keyboard and Escape restores focus. Published `intrushield-nids` shows its gallery and the next project link.

## Not Locked

- Unknown slugs render the not-found content and `noindex`, but Next 15's streamed/prerendered response currently sends HTTP 200. Calling `notFound()` in metadata and forcing dynamic rendering did not change this. Fix and verify a real 404 before SEO/status sign-off.
- Project, gallery and tag writes are separate DB operations. `saveGallery` deletes all previous image rows before inserting replacements; failed inserts or concurrent saves can leave a partial project. A transaction/RPC and optimistic concurrency check are needed before write-path sign-off.
- Authenticated Admin gallery add/reorder/caption/remove has not been exercised against the connected database; no live owner records were mutated during this audit.
- Several published case studies remain sparse and use stock/irrelevant Unsplash imagery. Owner-authored narratives and real screenshots are needed for content approval. A project-list outage can still show checked-in fallback cards on the separately audited Projects index while production detail links return not found.
