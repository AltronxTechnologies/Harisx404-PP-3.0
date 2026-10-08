# Blog Article and Admin System: Audit and Specification

Date: 2026-09-29. Status: Phase 0 complete; implementation not yet signed off.
Progress: `audit/26-blog-worklog.md`. Prior index audit: `audit/08-blog-page.md`.

## Scope and baseline

- Public routes: `/blog`, `/blog/[slug]`, legacy `/blog/category/[category]`,
  `/rss.xml`, and `/sitemap.xml`. Admin routes: `/admin/blogs`,
  `/admin/blogs/new`, `/admin/blogs/[id]`, and `/api/admin/blogs`.
- Next.js 15 App Router, React 18, Tailwind, Supabase Auth/Postgres, server
  components for routes and client components for editing, sharing, reactions,
  TOC and lightbox. Media lives in Cloudinary/the `media` table; Admin writes
  use the verified `ADMIN_EMAIL` identity, service-role client and transactional
  `save_blog_post_with_tags` RPC. Do not create a parallel CMS or auth system.
- Locked references: `LOCKED_PERFECT.md` (Home, About, Projects, Navbar,
  Footer, shared CTA and legal pages). No global style, shared CTA, unrelated
  page, or shared editor change without demonstrated need and lock approval.
- Existing public article: cover texture, centered title/deck, meta/share row,
  `max-w-3xl` prose (body 16px/32px), reactions, floating TOC, related cards,
  and the existing CTA. MDX rendering supports lists, links, quotes, callouts,
  code, images, tables and limited embeds. `app/blog/[slug]/page.tsx`,
  `app/components/mdx.tsx`, `app/components/mdx-components.tsx`.
- Existing Admin: neutral raised surfaces, hairline borders, rounded controls,
  indigo signal accent, compact tables and a mobile drawer. The Blog form
  offers title, manual slug, summary, content, draft/published, publish date,
  cover picker/URL, canonical URL and free-text tags. It has no functional
  delete, private preview, list search/filter/sort or rich MDX-preserving editor.
  See `app/admin/(dashboard)/blogs/` and `app/components/admin/BlogForm.tsx`.

## Findings, before fixes

| Priority | Finding | Evidence / acceptance impact |
|---|---|---|
| Blocker | Imported first-person articles have unresolved authorship/rights; detail JSON-LD and OG identify Muhammad Haris for every article | `DESIGN_DEBT.md` B1a; `app/blog/[slug]/page.tsx` 82-94, 250-265. Owner must decide attribution, licenses, canonical sources and publication. No invented author claims. |
| Blocker | The Blog Admin delete button is inert | `app/admin/(dashboard)/blogs/page.tsx` 65-76; API has only POST/PUT. Remove the misleading control until a safe confirmed delete or archive flow exists. |
| High | Imported MDX can be lost on editor round-trip | `app/components/admin/TiptapEditor.tsx` 251-276; migrator stores MDX in `blog_posts.content`. A no-op edit must be byte-preserving. Do not expose a lossy rich editor to existing MDX. |
| High | Post/tag join RLS and migration application are unverified | `supabase_schema.sql` 56-61, 184-203; the retired root `fix_permissions.sql` (formerly granted ALL to anon/authenticated); `migrations/2026_blog_publication_policy.sql`. Inspect live grants/RLS read-only before claiming public draft isolation. Do not replay broad grants. |
| High | Mobile Blog index depends on a JS URL redirect to show cards | `app/blog/page.tsx` 362-364, 516-523; `BlogFilterBar.tsx` 179-202. Below `lg`, no-JS readers see only a status message. |
| High | Formatted/duplicate MDX headings can diverge from TOC IDs | `app/lib/toc-utils.ts` 31-53 vs `app/components/mdx-components.tsx` 380-414. One heading source must generate unique IDs and TOC entries. |
| High | Article image zoom is pointer-only, dialog lacks focus management | `app/components/blog/ImageLightbox.tsx` 23-80. Keyboard and screen-reader users need equivalent access. |
| Medium | Public runtime evaluates database MDX and falls back to raw source on compile failure | `app/components/mdx.tsx` 101-119. Publication must use a trusted content contract; no arbitrary untrusted MDX execution. |
| Medium | Article metadata/image provenance and indexability need validation | `app/blog/[slug]/page.tsx` 82-95, 230-274; `app/sitemap.ts` 8-17; `/api/og` ignores passed summary/image. Relative JSON-LD image, hard-coded author, canonical conflicts and date semantics need review. |
| Medium | Admin list hides query errors and labels future published rows as live | `app/admin/(dashboard)/blogs/page.tsx` 5-10, 39-64. Add bounded search/filter/sort, Draft/Scheduled/Live distinctions and useful errors. |
| Medium | Cover URL edits retain the old media ID; tag slug collisions can attach the wrong name | `BlogForm.tsx` 193-219; `migrations/2026_blog_admin_atomic_save.sql` 120-139. Preserve media identity and tag names, including concurrent saves. |

The successful `test:blog` checks availability and RSS/sitemap parity; it does
not prove content ownership, Admin CRUD, MDX fidelity, RLS or accessibility.
Earlier Blog index audit measurements are historical, not current sign-off.

## Design specification

- Preserve the existing editorial identity: Instrument Serif display headlines,
  Outfit body, mono kicker/metadata, page and text color tokens, dashed rails,
  restrained accent links, and the existing CTA. Do not introduce a second
  accent system, generic dashboard theme, or ornamental widgets for their own
  sake. The existing red/green semantics are reserved for meaningful states.
- Public hierarchy: Blog back link > one h1 and concise deck > accurate
  author/date/reading metadata when known > semantic article > optional
  interactions > related posts > shared CTA > Footer. Only show author/avatar,
  category, updated date, previous/next, or featured image as content elements
  when backed by reliable data. Current hero cover is decorative, not a
  replacement for a meaningful alt/caption when the image conveys information.
- Retain a readable body column near the current `max-w-3xl`; use existing
  16px/32px paragraphs, intentional heading/paragraph rhythm, ordered and
  nested lists, scrollable code and tables, alt/caption/credit where available.
  Keep single-column prose on phone; adapt metadata wrapping, TOC and related
  cards at `sm`, `md`, `lg` without horizontal page scroll.
- Admin hierarchy: searchable/filterable/sortable bounded post list; clear
  Draft/Scheduled/Live status; create/edit form with primary Save and a
  distinct Publish/Unpublish flow; non-indexed authorized preview and a
  confirmed destructive action only after its data semantics are defined.
  Reuse current raised surfaces, form controls, sidebar, media picker and
  error/feedback patterns. Keep keyboard and touch use first-class.
- Both themes: text contrast >= 4.5:1 (or 3:1 for large text); visible focus,
  readable code/quotes/tables/inputs, reduced-motion behavior and no overlays
  that obscure reading. Preserve localized Blog styling; avoid shared globals.

## Technical and content contract

- Keep `blog_posts` as canonical source: `id` UUID, unique normalized `slug`,
  `title`, nullable `summary`, MDX/Markdown `content`, `status` (draft,
  published, archived), `published_at`, `created_at`, `updated_at`,
  `reading_time_minutes`, `cover_image_id`/`cover_image_url`, `canonical_url`,
  `featured`, and optional `og_image_id`. `tags` are shared with projects via
  `blog_post_tags`; there is no separate categories table. Do not invent a new
  category taxonomy or author table before the owner resolves provenance.
- Publishing is an authorized server mutation only. A future publication date
  means Scheduled, not Live; public queries, RSS, sitemap and metadata must
  reject draft, archived and future rows. Confirm the deployed publication
  policy and tag-join privileges with role-specific queries. Keep optimistic
  `updated_at` conflict checks and atomic tag sync.
- Rich editing for ordinary Markdown must not silently degrade imported MDX,
  HTML, embeds, captions, tables or special syntax. Define an allowlisted
  content vocabulary and offer lossless source editing/preview for unsupported
  constructs. Test a no-op open/save before broad editor enhancements. Do not
  insert untrusted executable MDX, unsafe URLs or arbitrary embed HTML.
- Slug, reading-time, summary fallback and social metadata should default
  automatically, remain editable where useful, and validate on the server.
  Prefer existing media library and allowlisted HTTPS images; retain meaningful
  alt/credit metadata. Future schema changes require additive migrations and
  a documented live rollout, not assumptions based on checked-in SQL.
- For deletion, first define reversible archive vs permanent removal and
  related tag/reaction/media behavior. Never present a nonfunctional action as
  working; require owner confirmation of data retention policy before a
  destructive live mutation. Preview must not relax public RLS or index drafts.

## SEO, AEO and AI-readable output

- Public article HTML must contain one h1, real h2/h3 order, readable intro,
  descriptive anchors, meaningful image alt/captions, published/updated dates
  only when true, and internal links to related material. TOC entries must
  target real, unique rendered heading IDs. No fake FAQ, claims or citations.
- Use `generateMetadata` for an accurate title/description, one absolute
  canonical (respect verified external originals), OG/X images with tested
  generation or fallback, and `BlogPosting` JSON-LD matching the rendered
  content/author/date and absolute image URL. Add breadcrumbs only when the
  visible navigation and schema agree. Avoid duplicate content through
  canonical and sitemap rules; drafts/previews must not be indexed.
- RSS/sitemap include only publicly available canonical articles. List search
  and pagination need a consistent canonical/noindex policy and a no-JS
  discoverability path. Article summaries/headings should be useful for
  answer engines without keyword stuffing or generated unsupported assertions.

## QA and acceptance gates

1. Run TypeScript, targeted ESLint, `npm run test:blog`, navigation and preview
   integration; add Admin route/RPC and browser tests before calling CRUD done.
2. Browser matrix: 320/360/390/768/1024/1440px in light and dark. Measure
   page and inner-card overflow, line length, section gaps, images, code/tables,
   fixed TOC, dropdowns, Admin form/list and CTA/Footer handoff.
3. Content fixtures: short/long/no-summary, formatted/duplicate headings,
   nested lists, long code/links, images with/without alt, tables, quotes,
   callouts, special chars, invalid URLs and broken MDX. No raw-source fallback
   disguised as a published article.
4. Interaction: keyboard order, focus trap/restore for lightbox and dialogs,
   reduced motion, readable validation/errors, draft preview, publish/schedule/
   unpublish, edit without MDX loss, delete/archive confirmation and cancel.
5. Security: unauthenticated and non-admin API rejection, direct anon/
   authenticated RLS checks, failed-write rollback, tag collisions, media
   validation, CSP/unsafe MDX review, and no secrets in browser responses.
6. SEO: HTTP statuses, canonical, robots, sitemap/RSS consistency, absolute
   JSON-LD image, truthful author/date, social preview, non-indexed drafts.
   Recheck Home/About/Projects/Contact/Nav/Footer for regressions without
   changing those locked surfaces.

## Phased implementation roadmap

0. **Audit and document** (complete): source baseline, risks and gates here;
   worklog in `audit/26-blog-worklog.md`. No public/Admin claim of completion.
1. **Protect existing behavior**: add browser and unit checks for the high
   priority public defects and Admin auth/no-op MDX; verify live schema read-only.
2. **Public reliability**: fix Blog mobile no-JS visibility, heading/TOC ID
   mismatch, keyboard lightbox and critical image/schema issues; test both
   themes and representative content without changing locked globals.
3. **Admin safety**: correct list error/status and no-op delete, preserve MDX,
   validate server-side inputs/media and CRUD authorization; create controlled
   migrations for RLS/tag integrity if live inspection confirms need.
4. **Editorial workflow**: searchable/paginated list, practical editor tools,
   private preview, publish/schedule/unpublish and safe delete/archive per
   owner data-retention decision. Add focused tests per operation.
5. **Final QA and sign-off**: full responsive/theme/accessibility/SEO/security
   sweep; authenticated Admin and deployed database acceptance; owner content
   rights decision. Do not lock or claim production-readiness until gates pass.
