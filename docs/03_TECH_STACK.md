# ?? Approved Tech Stack

**NO NEW PACKAGES may be installed without:**
1. Logging a justification in docs/02_WORKDONE.md
2. Explicit user approval

---

## Core Framework

| Package | Version | Purpose |
|---|---|---|
| Next.js | 15.x (App Router) | Framework |
| React | 18.x | UI library |
| TypeScript | 5.x | Language |
| Tailwind CSS | 3.4.x | Styling |

## Database & Auth

| Package | Purpose | Tier |
|---|---|---|
| Supabase | PostgreSQL database, Auth, Storage | Free ? Pro (portable) |
| @supabase/ssr | Server-side Supabase client | — |
| @supabase/supabase-js | Client-side Supabase client | — |

**Why Supabase for portability:**
- Your data lives in a real PostgreSQL database
- You can export it as SQL at any time
- Migrating to paid Supabase Pro = just upgrade plan, same schema
- Migrating to another provider = export SQL dump, import to new Postgres

## Media & Images

| Service | Purpose | Free Tier |
|---|---|---|
| Cloudinary | Image upload, transform, CDN delivery | 25GB free |

**Why Cloudinary:**
- Images stored externally — never lost when changing hosting
- Auto-optimizes: WebP, AVIF, lazy loading, responsive sizes
- Free tier is generous for a portfolio
- Easy migration to paid: same URLs, same SDK

## AI Integration

| Package | Purpose |
|---|---|
| @google/generative-ai | Gemini API for writing assistant, search, chatbot |

**Why Gemini:**
- Generous free tier (1500 req/day)
- Strong text generation for blog writing assist
- Can add embeddings for semantic search later

## Content System (Current — To Be Migrated)

| Package | Purpose | Keep? |
|---|---|---|
| velite | MDX compilation to static data | Phase 1: Remove after DB migration |
| rehype-raw | Raw HTML in MDX | Phase 1: Remove after DB migration |

**Migration plan:** All blog content moves to Supabase. Velite removed in Phase 1 end.

## UI & Animation

| Package | Purpose |
|---|---|
| framer-motion | Page transitions, micro-animations |
| @headlessui/react | Accessible modals, dropdowns |
| geist | Geist font (sans + mono) |
| clsx + tailwind-merge | Conditional class utilities |
| swr | Client-side data fetching with cache |

## Rich Text Editor (Admin Dashboard — To Add in Phase 3)

| Package | Purpose | Notes |
|---|---|---|
| @tiptap/react | Rich text editor for blog posts | APPROVED for Phase 3 |
| @tiptap/starter-kit | Core Tiptap extensions | APPROVED for Phase 3 |

## Analytics & Monitoring

| Service | Purpose |
|---|---|
| Vemetric (already in layout.tsx) | Page analytics |
| Loops.so | Newsletter / email contacts |

## Dev Tools

| Package | Purpose |
|---|---|
| prettier | Code formatting |
| eslint + eslint-config-next | Linting |
| playwright | E2E testing (future) |
| tsx | TypeScript script runner |

---

## Technology Decisions & Rationale

### Why NOT use a headless CMS (Contentful, Sanity, Notion)?
- Vendor lock-in — your content is trapped in their format
- Costs money at scale
- You lose the flexibility to query and display your content as you want
- Supabase PostgreSQL gives you full control + easy portability

### Why NOT use PlanetScale / Neon / Railway?
- Supabase is already integrated and working
- Auth, Storage, and DB in one place = simpler architecture
- Free tier is sufficient for a portfolio
- PostgreSQL is standard SQL — easy to migrate if needed

### Why Cloudinary over Supabase Storage?
- Cloudinary has powerful image transformation at the URL level
- Automatic WebP/AVIF conversion
- Better CDN global distribution
- Supabase Storage has no image transforms on free tier

### Why Gemini over OpenAI?
- More generous free tier (1500 requests/day vs 3 for OpenAI free)
- You likely already have a Google account
- Strong enough for portfolio-scale AI features
