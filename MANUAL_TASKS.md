# MANUAL_TASKS.md — Owner's Step-by-Step Launch Playbook

> **For:** Muhammad Haris (repo owner). This is everything YOU must do by hand
> to take the site from its current state to a fully launched production
> portfolio. Work top to bottom. Each step says exactly where to click and
> what to paste. AI agents: this file is owner work — do not attempt the
> Supabase dashboard or deployment steps yourself; keep code null-safe so the
> site works before AND after each step.

**Current state (2026-08-15):** All code phases complete. Dev environment runs
with your real keys in `.env.local` (gitignored). Supabase is live and seeded
with settings/about/tools/projects. Remaining manual work is below.

---

## STEP 1 — Run the database migration (DONE 2026-08-15)

~~The `testimonials` and `experience` tables + new project columns don't exist
yet.~~ **Done:** the owner ran `migrations/2026_redesign.sql` in the Supabase
SQL editor. `testimonials`, `experience`, `article_views`, and `system_logs`
all exist in the live DB, and blog view counting is verified working. Keep
these steps for reference if the DB is ever recreated:

1. Open https://supabase.com/dashboard → your project (`ripmzkazzihyafqhtapv`).
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `migrations/2026_redesign.sql` from this repo, copy ALL of it, paste,
   press **Run**. It is safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
4. Verify: sidebar → **Table Editor** → you should now see `testimonials` and
   `experience`, and `projects` should have new columns (tagline, tech_stack,
   category, year, features, live_url, github_url).

### STEP 1B — Enable Blog reactions (DONE 2026-09-04)

The owner ran `migrations/2026_article_reactions.sql`. Both reaction tables and
the atomic adjustment function are active. A reversible end-to-end test added
an Insightful reaction, verified the `💡 1` card summary, removed the reaction,
and confirmed both tables returned to zero rows.

## STEP 2 — Re-run the seed (1 min)

From the repo root (or inside the dev container):

```sh
node --env-file=.env.local scripts/seed-initial-data.mjs
```

Expected output: all sections seeded including testimonials + experience
(previously skipped). The homepage testimonial carousel and the About
experience timeline now read from YOUR database.

## STEP 3 — Log in to the admin panel (2 min)

1. Visit `/admin/login` (locally: http://localhost:3000/admin/login).
2. Sign in with the Supabase auth account for `itsharis.tech@gmail.com`
   (create the user first in Supabase dashboard → Authentication → Users →
   "Add user" if you haven't). Only this email is allowed (ADMIN_EMAIL).
3. Confirm you can see: Blogs, Projects, Changelogs, Testimonials, Experience,
   Toolbox, Media, Settings, Logs.

## STEP 4 — Replace every placeholder with your real content

Do these inside `/admin` (order doesn't matter):

| What | Where | Notes |
|---|---|---|
| Your 4 hero photos | Media → upload, then update hero (see below) | ~3:4 ratio, ≥640×800 px |
| Project cover images | Projects → edit each → image URL | screenshots/mockups per project |
| Real projects | Projects | replace the 5 seeded placeholders (SecureVault etc.) with your actual work; fill tagline, tech stack, category, year, live/GitHub URLs, features |
| Blog posts | Blogs → New | the fallback posts on the site are placeholders that 404 — your first real published post replaces them everywhere |
| Testimonials | Testimonials | replace the 6 placeholder quotes with real ones (or delete extras) |
| Work experience | Experience | replace the 3 placeholder entries with your real history |
| Tools/Uses | Toolbox | your real tools; category names map to /uses sections (workstation/development/design/site) |
| Site settings | Settings | name, SEO description, social URLs, contact email |

**Hero photos are the one code touchpoint:** the hero currently renders
gradient placeholder cards. After uploading photos to Cloudinary via Media,
give the 4 image URLs to your AI agent with: *"Replace the hero polaroid
placeholders in app/components/home/HomeHero.tsx with these next/image URLs"*.
Same for the About page photo stack and the Know-About-Me visual.

## STEP 5 — Contact email + legal review (10 min)

- The hero status row and CTA button already use the real address
  (`itsharis.tech@gmail.com`) — done 2026-08-15.
- Read `/legal/privacy` and `/legal/terms` — they are clearly-marked templates.
  Adjust wording to match reality (analytics you actually use, newsletter, etc.).
- `/attribution` — review the credits text.

## STEP 6 — Enable AI extras (optional, 5 min)

- **Blog embeddings (semantic search + related posts):** requires Step 1 done
  AND at least one published post. In Supabase SQL Editor also ensure the
  pgvector extension is enabled (Database → Extensions → `vector`). Then in
  `/admin/blogs` use the embed action (or POST `/api/admin/blogs/embed`).
  Until then, search automatically uses keyword mode — already working.
- **Chatbot / ⌘K search / admin AI assist:** already live with your Gemini key.

## STEP 7 — Deploy to production (30 min)

You said you'll use DIFFERENT keys for deployment — good practice. Checklist:

1. **Rotate the keys you shared during development** (they were exposed in
   chat/tooling): GitHub PAT, Supabase service-role key (Settings → API →
   "Reset" service key), Gemini key, Cloudinary secret, Loops key. Update
   `.env.local` locally with the new ones.
2. Create the production deployment (Vercel recommended for Next.js 15):
   - Import the GitHub repo, set the production branch.
   - Add ALL env vars from `.env.local` (with the NEW rotated values) in
     Project → Settings → Environment Variables.
   - **Change `NEXT_PUBLIC_SITE_URL` to your real domain** (e.g.
     `https://harisx404.dev`) — this drives sitemap/RSS/OG URLs.
3. Add your custom domain in Vercel; update Supabase Auth → URL configuration
   (Site URL + redirect URLs) to the production domain so admin login works.
4. Verify after deploy: `/`, `/admin/login` (log in), `/sitemap.xml`,
   `/rss.xml`, `/api/og?title=Test`, chatbot answer, ⌘K search.

## STEP 8 — Final quality pass (after real assets are live)

1. Run Lighthouse (Chrome DevTools → Lighthouse) on `/`, one blog post, and
   one project page. Target ≥90 Performance / SEO / Accessibility / Best
   Practices. If Performance dips, the usual fix is compressing your uploaded
   images (Cloudinary `f_auto,q_auto` URL params).
2. Submit `https://<your-domain>/sitemap.xml` to Google Search Console.
3. Check the site on your phone (light + dark) top to bottom.

---

## Reference: content you'll add later (exact locations & specs)

Add these whenever you're ready — nothing blocks the site; every slot shows a
clean placeholder until you fill it. For image swaps that need a code edit,
just tell any AI agent the file path listed here plus your image URL/filename.

### Images

| # | What | Where it appears | How to add | Specs |
|---|---|---|---|---|
| 1 | Hero photos 2–4 | Homepage draggable polaroid stack (photo 1 = /harisx404.png already live) | Drop files in `public/` (e.g. `haris-2.png`) → tell agent: "fill polaroids 2–4 in `app/components/home/HomeHero.tsx` with these" | portrait ~3:4, ≥640×800px, <400KB each |
| 2 | About photo stack (2 more) | /about right column (top card already shows your photo) | Same pattern → `app/about/AboutView.tsx` | portrait 3:4 |
| 3 | Project cover images | Homepage case-study cards + /projects + project detail hero | **No code needed** — `/admin/projects` → edit project → image URL (upload via `/admin/media` first) | landscape 16:9 or 4:3, ~1200px wide |
| 4 | Blog cover images | Blog cards + post header + OG previews | **No code needed** — `/admin/blogs` → cover image URL | 1200×630 ideal (doubles as OG image) |
| 5 | Testimonial avatars | Homepage carousel (currently initials circles) | Add `avatar_url` in `/admin/testimonials`; then tell agent: "render avatar_url in `app/components/home/Testimonials.tsx`" | square ≥96×96px |
| 6 | Tool/uses logos | /toolbox, /uses, homepage toolbox card (currently letter tiles) | Add logo URL per tool in `/admin/toolbox`; agent wires rendering if needed | square PNG/SVG ~64px |
| 7 | Real OG banner (optional) | Social link previews (currently /brand/logo-wide.png) | Create a 1200×630 banner (photo + name), save as `public/brand/og-banner.png` → tell agent to point `app/layout.tsx` OG images at it | exactly 1200×630 |
| 8 | Old template photos cleanup | `public/` still contains the original template author's photos (braydon_*.jpeg etc.) | Tell agent: "delete unused legacy images from public/ after checking references" | — |

### Text & data (all via /admin, no code)

- Testimonials: replace the 6 seeded placeholder quotes with real ones
- Experience: replace the 3 seeded placeholder entries with your real history
- Site settings: confirm name, SEO description, social URLs
- Legal pages (`/legal/privacy`, `/legal/terms`) + `/attribution`: review wording once before deploy

### Contact email

✅ Done — `itsharis.tech@gmail.com` is wired into the hero "Start a
conversation" button and the CTA "Get In Touch" button.

---

## Reference: environment variables

Defined in `.env.local` (dev) and your host's env settings (prod). The app
reads these names — keep them exact:

| Variable | Required | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | all public data |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | admin CRUD APIs, seeds |
| `ADMIN_EMAIL` | yes | who may access /admin |
| `GOOGLE_AI_API_KEY` | for AI | chatbot, ⌘K semantic search, admin assist, embeddings (`GEMINI_API_KEY` kept as alias only) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | for media | /admin/media uploads |
| `GITHUB_TOKEN` | optional | /stats GitHub cards |
| `PAGESPEED_API_KEY` | optional | /stats Lighthouse card |
| `LOOPS_API_KEY` | optional | newsletter signups |
| `SPOTIFY_CLIENT_ID/SECRET/REFRESH_TOKEN` | optional | currently-playing card |
| `NEXT_PUBLIC_SITE_URL` | yes | canonical URLs, sitemap, RSS, OG |
| `NEXT_PUBLIC_SITE_NAME` | yes | fallback site title |

**Never commit `.env.local`** (already gitignored). When deploying, use the
rotated keys, not the development ones.

---

## Done-tracking

- [x] Step 1 — migration run in Supabase (verified 2026-08-15; incl. article_views + system_logs, view counting working)
- [x] Step 2 — seed re-run (testimonials + experience seeded, live on site)
- [ ] Step 3 — admin login works (login page itself fixed — useActionState compat — waiting on owner to sign in)
- [ ] Step 4 — placeholders replaced (photos, projects, posts, testimonials, experience, tools, settings)
- [x] Step 5a — real contact email wired (itsharis.tech@gmail.com); [ ] 5b — legal pages review before deploy
- [ ] Step 6 — pgvector + embeddings (optional; education+certifications tables DONE 2026-08-15, seeded, live)
- [ ] Step 7 — keys rotated + production deploy + domain + Supabase auth URLs
- [ ] Step 8 — Lighthouse ≥90 + Search Console + mobile pass

## Booking calendar (/contact)

The Book a Call buttons (navbar, Reach Out modal, footer) now lead to `/contact`.
To show the embedded scheduling calendar there:

1. Create a free Cal.com account and a "30 min" event type.
2. Open `app/data/site-content.ts` → `contact.calLink` and set it to your
   handle + event slug, e.g. `"harisx404/30min"`.
3. Until then the page shows an email-based "request a call" card instead.

- [ ] Step 9 — Cal.com account created + `contact.calLink` filled in

## Community Wall — GitHub OAuth setup (required for posting notes)

- [x] `messages` table migration run in Supabase (2026_community_wall_messages.sql)
- [ ] GitHub OAuth App created (github.com → Settings → Developer settings → OAuth Apps → New):
      - Authorization callback URL (exact): `https://ripmzkazzihyafqhtapv.supabase.co/auth/v1/callback`
      - Copy Client ID + generate Client Secret
- [ ] Supabase → Authentication → Providers → GitHub: toggle ON, paste Client ID + Secret, Save
- [ ] Supabase → Authentication → URL Configuration:
      - Site URL: production domain (use `http://localhost:3000` while developing)
      - Redirect URLs: add `http://localhost:3000/auth/callback` and `http://localhost:3000/**`
        (add the production equivalents at deploy time)
- [ ] Test: /community-wall → "Write a message..." → authorize on GitHub → composer appears → post a note
