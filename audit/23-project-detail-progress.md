# Project Detail: Verification In Progress

The detail template now reads published project fields and ordered gallery media from Supabase. It renders the Admin-authored Markdown narrative, optional highlights, captioned gallery, metadata and structured data without generating generic project claims. The Admin form can choose, caption, reorder and remove gallery media. Fallback case studies are disabled in production; development fallback remains available when no published DB list is returned.

## Verified

- `npm run test:projects`: published index links resolve, missing content stays unindexable, unauthenticated mutations return 401, and the gallery/narrative plumbing remains connected.
- Container TypeScript (`npx tsc --noEmit`) and targeted ESLint pass.
- Browser checks at 320px, 390px and 1440px show no horizontal overflow. Light and dark themes render correctly. The share control opens with pointer/keyboard and Escape restores focus. Published `intrushield-nids` shows its gallery and related project links.

## Owner-Managed Expansion

- Project type remains free-form for cards, filtering, and related work but is no longer repeated in the facts box. Facts appear as Built, Stage, Visit, Latest update, Source. Stage is an optional Admin selection (In progress / Completed), separate from publication status. Visit shows a blue link only when a URL exists, otherwise None. The existing `source_note` field is now the source link name when a URL exists and remains the unavailable-source note when it does not; previously saved notes are preserved. The short card/page summary is capped at 160 characters in Admin and across public card/detail views.
- Tech stack entries are one per line with no project-level item cap; curated tools use the same simple-icons source as home cards, and unknown tools are displayed without a guessed icon. The media picker can load older images beyond the first 50.
- Profile-only GitHub URLs no longer claim to be project source; the Admin field now asks for a direct public repository URL.
- Optional Markdown fields for Why I built this, Key decisions, Results and What I learned complement the existing overview and Highlights (the concise key-features list). Sections are hidden when empty. Up to two related projects are selected by published tag/stack/specific-type overlap; if there are no trustworthy matches or the list cannot load, the page shows a Browse projects link instead of invented recommendations.
- The Share menu now offers Copy URL, View as Markdown, Open in ChatGPT, and Open in Claude. Opening Claude copies a prompt for pasting; ChatGPT receives a URL-based prompt. On small screens the menu expands inline below the button so it cannot cover the project title.
- **Database status update:** a subsequent read-only check found all columns from `migrations/2026_project_case_studies.sql` available in the connected Supabase project. The earlier missing-column (`42703`) observation is superseded. Authenticated Admin saves and gallery round trips are still untested; the Alloy-only preview seed in `audit/24-project-preview-seed.md` does not write to the database.
- **Stage migration pending:** `migrations/2026_project_stage.sql` adds the new stage column. Apply it to the connected Supabase project before saving with the revised Admin form. The API returns a migration-specific 503 if the column is missing.

## Not Locked

- Unknown slugs render the not-found content and `noindex`, but Next 15's streamed/prerendered response currently sends HTTP 200. Calling `notFound()` in metadata and forcing dynamic rendering did not change this. Fix and verify a real 404 before SEO/status sign-off.
- Project, gallery and tag writes are separate DB operations. `saveGallery` deletes all previous image rows before inserting replacements; failed inserts or concurrent saves can leave a partial project. A transaction/RPC and optimistic concurrency check are needed before write-path sign-off.
- Authenticated Admin gallery add/reorder/caption/remove has not been exercised against the connected database; no live owner records were mutated during this audit.
- Several published case studies remain sparse and use stock/irrelevant Unsplash imagery. Owner-authored narratives and real screenshots are needed for content approval. A project-list outage can still show checked-in fallback cards on the separately audited Projects index while production detail links return not found.
