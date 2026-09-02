# DESIGN_DEBT.md — remaining design-consistency work

Companion to `LOCKED_PERFECT.md`. This file tracks **known, audited** design
inconsistencies that are not yet fixed, so the analysis does not have to be
redone from scratch.

> **Workflow:** `AUDIT_TESTING.md` **Phase 11** cross-checks this file. When a
> page or component is audited before locking, any open item belonging to it
> must be fixed in that pass and **removed from this file in the same commit**.
> Newly-found issues that are out of scope for the current audit get added here.

- **Audited:** 2026-09-01
- **Line numbers valid as of commit:** `eeb900b`
- **Branch:** `haris-dev/set-up-this-codebase-for-FcY5YL` (merged to `main`)

---

## Ground rules (read before touching anything)

1. **Not every difference is a bug.** The whole value of the audit is knowing
   which differences are *intentional*. See "Do NOT change" below.
2. **Check the surrounding background before changing a colour.** The
   `text-text-secondary` token assumes the normal page background. On a dark
   chip, coloured banner, image overlay, or the white resume sheet it breaks.
3. **One issue per commit** so any single step can be reverted alone.
4. **Read `LOCKED_PERFECT.md` first** — the Reach Out modal (entry 1) and
   Search modal (entry 2) are frozen specs.
5. **Never run `next build` while the dev server is running.** Both write the
   same `.next` volume (`web_next_cache`) and it corrupts the dev chunk map
   (symptom: `Cannot find module './vendor-chunks/...'` + 500s).
   Recovery: `docker compose -f docker-compose.alloy.yaml exec -T web sh -lc 'rm -rf /workspace/.next/*'`
   then `docker compose -f docker-compose.alloy.yaml restart web`.
6. **Do not run `prettier --write`.** The repo has a `.prettierrc.json` but was
   never actually prettier-formatted. Running it produces an enormous unrelated
   diff and touches locked components. Match surrounding style by hand instead.

### Verification commands

```bash
docker compose -f docker-compose.alloy.yaml exec -T web npx tsc --noEmit
docker compose -f docker-compose.alloy.yaml exec -T web npx eslint <files>
# eslint baseline: 0 errors, ~10 pre-existing warnings (<img>, one hook dep)
```

---

## ✅ DONE (for context)

| Work | Commits |
|---|---|
| Theme-toggle glyph size + single ThemeToggle implementation | `f990088` |
| Shared modal surfaces, brand glyphs, banned token, footer X glyph, links grid, dead `/blog` search button | `11b34df` |
| Issue 1 — colour tokenisation (62 of 310 candidates) | `7601579` |
| Issue 1 — home page AA failures (6 of 9) | `eeb900b` |

---

## ISSUE 2 — Corner radius consistency

**Visible change: yes. Layout/alignment risk: none** (only the curve of corners).

The modal system uses a strict two-tier rule: **24px outer** (`rounded-3xl`) /
**16px inner** (`rounded-2xl`). Elsewhere radii are ad-hoc: 8, 12, 16, 18, 20,
22, 24, 26px plus JS-driven values.

### Modal chrome — third-tier violations
| File:line | Current | Note |
|---|---|---|
| `app/components/navbar/ReachOutModal.tsx:275` | `rounded-xl` | Continue button — only 12px in the modal, inside a `rounded-2xl` panel. **LOCKED file — needs permission.** |
| `app/components/navbar/ReachOutModal.tsx:262,266` | `rounded-md` | kbd chips. **LOCKED file.** |
| `app/components/home/TestimonialSubmitModal.tsx:17,353` | `rounded-xl` | Every form input is 12px; the modal has **no 16px inner tier at all** |
| `app/components/admin/MediaPickerModal.tsx:97,164` | `rounded-2xl` | **No 24px outer tier** — top tier is 16px |
| `app/components/admin/MediaPickerModal.tsx:144,182,195,202` | `rounded-xl` | third tier |
| `app/components/admin/MediaPickerModal.tsx:117,177` | `rounded-lg` | fourth tier |
| `app/components/blog/ImageLightbox.tsx:76` | `rounded-xl` | panel is 12px; no 24/16 tier |

### `Navbar.tsx` dropdown — 4 radii + 2 JS values in one component
- `:461` `rounded-[24px]` (should be `rounded-3xl`)
- `:481,505` `rounded-[18px]`
- `:529,545,561` `rounded-[16px]` (should be `rounded-2xl`)
- `:531,547,563` `rounded-[12px]`
- `:185–186` animated inline `borderRadius: "22px" / "24px"`
- `:36,45` clip-path `round 22px`

### Dropdown / popover panels disagree with each other
- `app/projects/[slug]/ProjectDetail.tsx:241` panel `rounded-[22px]`, items `rounded-xl` (`:251,254,257`)
- `app/components/blog/CopyUrlButton.tsx:74` panel `rounded-xl`, items `rounded-lg` (`:84,92,105`)
- These are the **same share menu**, four different radii between them.

### Card / tile / button radii (lower priority)
- Cards: `rounded-2xl` (BentoCard:27, StatCard:70, BlogCard:47, links:204, ContactClient:91) vs `rounded-3xl` (AboutTeaser:109, ContactClient:128/138/203, FeaturedBlogCard:23) vs `rounded-[20px]` (BorderCard:6, ShadowBox:11, HomeBento:84) vs `rounded-[22px]` (CaseStudies:438) vs `rounded-[26px]` (TableOfContents:83) vs `rounded-xl` (links:133, privacy:68/200) vs `rounded-lg` (privacy:82, links:246/255/261/271, CaseStudies:377)
- Recessed-tile idiom uses two different pairs: `HomeBento:84` 20px frame + 12px inset, `HomeBento:866` 14px frame + 10px inset, `ShadowBox:11` 20px + 12px. Also two different greys (`#EDEEF0` vs `#E7E9ED`).
- Buttons: `rounded-full` (CtaSection:70/95, ProjectsIndex:596/609/630/686) vs `rounded-xl` (ReachOutModal:275, ContactClient:98) vs `rounded-lg` (BlogFilterBar:73/103, links:246/271, GuestbookActionCard:47)

**Suggested approach:** define the tier scale once (e.g. in a shared constants
file or as Tailwind theme values), then migrate panel/modal chrome first, cards
second, buttons last. Decide deliberately whether cards are 16 or 24px.

---

## ISSUE 4 — Page-hero kicker + heading

**Visible change: yes, small. Layout risk: low, EXCEPT the spacing question below.**

Shared component exists: `app/components/home/SectionHeading.tsx`
(kicker `:26`, h2 `:29`) — kicker is
`font-mono text-xs font-medium uppercase tracking-widest text-text-secondary`.

Used **correctly** by: `about/page.tsx:75,128,145,238`, `home/Writings.tsx:104`,
`home/Testimonials.tsx:142`, `home/HomeFaq.tsx:67`, `home/HomeBento.tsx:926`,
`home/CaseStudies.tsx:922`, `home/MySiteGrid.tsx:166`, `home/AboutTeaser.tsx:97`.

### 10 inline page-hero clones (all use `font-normal` + `text-black/80 dark:text-white/70`)
`app/blog/page.tsx:105-124` · `app/buildlog/page.tsx:30-48` ·
`app/community-wall/page.tsx:52-70` · `app/contact/page.tsx:47-65` ·
`app/credentials/page.tsx:71-89` · `app/legal/privacy/page.tsx:110-128` ·
`app/legal/terms/page.tsx:80-98` · `app/links/page.tsx:179-197` ·
`app/resume/page.tsx:104-122` · `app/test/page.tsx:28-35`

Kicker conflicts: weight `font-medium` vs `font-normal` vs unset; colour
`text-text-secondary` vs `text-black/80 dark:text-white/70` vs
`text-text-tertiary`; tracking `tracking-widest` vs `tracking-[0.35em]`.

### Other competing variants
- `app/components/stats/StatsPageHeader.tsx:16,44` — `tracking-[0.35em]`
- `app/test/page.tsx:28` `Kicker` + `:35` `SectionHeader` — no `heading-glow`, uses `text-black dark:text-white` not the token
- `app/components/SectionTitlePill.tsx:11` — pill variant, `text-base`

### ⚠️ OPEN QUESTION FOR THE OWNER
The 10 clones **also have inconsistent top spacing**:
- 8 use `mt-24 mb-14 md:mt-28`
- `app/blog/page.tsx:105` uses `mb-16` + Instrument Serif + **dark-only** text-shadow
- `app/links/page.tsx:179` adds `hidden … md:block`
- `app/resume/page.tsx:104` drops `mt-24 mb-14` entirely

**Unifying spacing will shift those page titles vertically.** Do not do it
without an explicit decision. Unifying only font-weight/colour is safe.

### Also
Name collision: `app/components/navbar/SearchModal.tsx:112` declares a local
`SectionHeading` (an `h3` row label) unrelated to the shared one. Consider
renaming to `ResultGroupHeading`.

---

## ISSUE 3 — Duplicate controls (biggest visual change, do last)

**Visible change: yes, largest. Layout risk: real but manageable** — consolidating
means picking one size, so outliers shift by a few px. Verify screen by screen.

### Copy-to-clipboard — 6 implementations, no shared component
| File:line | Icon size |
|---|---|
| `app/components/blog/CopyUrlButton.tsx:15` | `size-3.5` |
| `app/components/guestbook/EntryLinkButton.tsx:14` | `size-3.5` |
| `app/components/home/CtaSection.tsx:17` | `h-4 w-4` |
| `app/components/navbar/ReachOutModal.tsx:108,301` | `size-7` (68px circle) |
| `app/components/contact/ContactClient.tsx:69` | `size-4` |
| `app/projects/[slug]/ProjectDetail.tsx:161` | `size-4` |
| `app/admin/media/page.tsx:75` | — |

### Close buttons — 4 implementations
- `SearchModal.tsx:396` / `ReachOutModal.tsx:211` — `circleBtn` 72px, glyph `size-8`
- `SearchModal.tsx:368-374` — clear-query, `size-5`
- `home/TestimonialSubmitModal.tsx:168-175` — `h-9 w-9` + `h-4 w-4` (also uses `h-/w-` instead of the project's `size-*` shorthand)
- `blog/ImageLightbox.tsx:67`, `TableOfContents.tsx:126` (`size-7` container, `size-4` glyph)

### Tag / chip — 9 recipes
`home/CaseStudies.tsx:77,78,369` · `projects/[slug]/ProjectDetail.tsx:291` ·
`blog/FeaturedBlogCard.tsx:80` · `links/page.tsx:225` · `home/MySiteGrid.tsx:198` ·
`EducationCards.tsx:100` · `test/page.tsx:232`
Text sizes `text-[8px]`, `text-[10px]`, `text-[11px]`, `text-xs`; two colour
systems (`text-text-secondary` vs `text-neutral-600 dark:text-neutral-400`).

### Avatar — 9 treatments, no shared component
`ReachOutModal.tsx:230` · `ContactClient.tsx:140,206` (all `size-11`) ·
`home/HomeHero.tsx:362` (`size-24 → lg:size-[140px]`) ·
`home/AboutTeaser.tsx:117` (`rounded-2xl`, not round) ·
`links/page.tsx:205` (`size-24`) · `test/page.tsx:157,382` ·
`ConnectionsBento.tsx:98` (raw `<img>`) · `ProfilePicture.tsx:114` (raw `motion.img`)

**⚠️ Correction (2026-09-01, owner-reviewed):** an earlier note here claimed
`ProfilePicture.tsx` and `ConnectionsBento.tsx` were a duplicated widget
"pointing at different images", implying a live visual bug. **That was
misleading.** Verified: **neither component is imported anywhere** — both are
dead code. The avatars actually rendered on the homepage come from
`home/HomeHero.tsx` and `home/AboutTeaser.tsx`, and **both already use the same
`/harisx404.png`**, so they are consistent and correct. No visual bug exists.

**RESOLVED 2026-09-01** — the owner approved deletion. The three never-imported
files below were removed (commit follows this note). The live
`app/components/blog/FeaturedBlogCard.tsx` was **kept** — it is imported by
`app/blog/page.tsx`; only the orphaned root-level copy was deleted.

| Deleted file | Was |
|---|---|
| `app/components/ProfilePicture.tsx` | 0 imports; 148px ring widget + orphaned Cloudinary URL |
| `app/components/ConnectionsBento.tsx` | 0 imports; near-identical ring widget |
| `app/components/FeaturedBlogCard.tsx` | 0 imports; basename clashed with the live `blog/` one |

### `Icon()` helper — same body, 4 files, 3 defaults
`contact/page.tsx:14` (`size-4`) · `credentials/page.tsx:30` (`size-5`) ·
`legal/privacy/page.tsx:16` (`size-5`) · `legal/terms/page.tsx:16` (`size-5`).
Also `links/page.tsx:59,68` re-declare the mail/globe paths already in
`contact/page.tsx:24,25` at a different default size.

### Blog cards — duplicate + orphan
- `app/components/BlogCard.tsx` used only by `blog/category/[category]/page.tsx`
- `app/components/blog/BlogGridCard.tsx` used by `/blog`
- **`app/components/FeaturedBlogCard.tsx` — ORPHAN, zero imports.** Probably delete.
- `app/components/blog/FeaturedBlogCard.tsx` — the live one.
- Two files share the basename `FeaturedBlogCard.tsx`.

### Search triggers — 5 implementations
`Navbar.tsx:594` (Phosphor `size-[18px]`) · `Navbar.tsx:216` (mobile pill) ·
`ReachOutModal.tsx:194` (lucide `size-8`) · `blog/BlogFilterBar.tsx:69` (Phosphor `size-4`) ·
`projects/ProjectsIndex.tsx:264` (bespoke `size-4`) · `SearchModal.tsx:356` (lucide `size-7`).
Note the navbar uses **Phosphor** icons while the modals use **lucide** — different
stroke weight and optical size at nominally equal px.

### `DoubleArrow` fork
Shared: `app/components/home/DoubleArrow.tsx:6`. Fork with different animation
distance/direction and no `size-8` circle: `app/test/page.tsx:64`.
`app/resume/page.tsx:379` uses `tracking-[0.25em]` and a literal `↓`.

---

## Deliberately NOT to change (verified intentional)

Changing any of these is a **regression**, not a fix.

| Location | Why |
|---|---|
| `app/components/EducationCards.tsx` | Card is **intentionally inverted** (`bg-[#0b0b10] dark:bg-[#f4f5f7]` — dark poster in light mode). The token is light-in-dark-mode, so tokenising makes text vanish. File header documents this. |
| `app/components/SocialPill.tsx:29` `text-gray-400` | Icons sit on an always-dark `#3C3C3F` chip. |
| `app/resume/page.tsx` (whole Europass sheet) | `bg-white` with **no dark variant** — a printed document in both themes. Tokenising = `#fafafa` on white. Includes the `text-[#1e64c8]` Europass brand blue. |
| Gradient / image covers | `home/CaseStudies.tsx:484,493,514,640` · `home/Writings.tsx:155,161` · `BlogCard.tsx:61,73` · `Navbar.tsx:505,529` · `guestbook/GuestbookActionCard.tsx:95,118` · `guestbook/GuestbookEntryCard.tsx:75` — white text on coloured/photo panels. |
| `NewsletterSignUp.tsx:106` | Inside an always-dark `bg-dark-primary` panel. |
| `CommunityWallCard.tsx:50` | Always-light card, no dark variant. |
| `ViewCounter.tsx:8` | Default prop targets dark panels; changing the default affects every callsite. |
| `StatusRow.tsx:191,257` tertiary | 3.5px decorative arrows, `opacity-0` until group-hover. |
| `TestimonialSubmitModal.tsx:17` tertiary | Placeholder text. |
| `border-text-tertiary` / `outline-text-tertiary` (23 usages) | Borders/outlines are UI-component contrast at **3:1**, a different WCAG rule than text. Changing them darkens borders and alters the design. |
| ~150 other hardcoded greys | Headings, link/accent colours, hover/active state pairs, placeholders, disabled states, semantic status badges — different jobs, not secondary body copy. |
| `Navbar.tsx:193` shadow string | The mobile pill legitimately shares only the elevation recipe with the circle buttons; not a duplicate surface. |

---

## Unrelated open items (pre-existing, not design)

- `/test` page is a self-declared throwaway ("Delete this file … when done") and
  is still linked from `Footer.tsx` "Test Page". Deleting both was proposed but
  never approved.
- `/stats` PageSpeed API returns 400.
- GitHub contribution graph shows 0.
- Admin changelog revalidate is stale.
- Live Supabase mismatches: prod `site_settings` is one row with named columns
  (breaks `/admin/settings`); `community_wall_messages` and
  `testimonial_submissions` do not exist remotely.
- Owner manual tasks: Supabase GitHub OAuth, Cal.com link, real certifications.

---

## 🔴 BUGS FOUND 2026-09-02 (infrastructure sweep)

### B1. Blog category filtering returns nothing — USER-FACING
`/blog?category=<any>` renders the empty state *"No published articles match
the selected category"* for **every** category, including ones the filter bar
itself lists (nextjs, react, performance, …). Verified in-browser with JS.
`/blog` alone renders 63 post links; `/blog?category=nextjs` renders 0.

Clicking any category pill on the blog index therefore appears broken to a
visitor. Likely a field mismatch: the pills are built from
`extractUniqueBlogCategories()` reading `post.categories`
(= `blog_post_tags.tags.name`, `app/lib/utils.ts:135`), but the filter on the
blog index compares against a different value or a different post set.
**Not yet diagnosed. Highest-priority open bug.**

### B2. `/projects/<bad-slug>` returns HTTP 200 instead of 404 — SEO
Body correctly renders the 404 UI, but the status line is `200 OK`, so crawlers
treat every made-up project URL as a real page. `app/projects/[slug]/page.tsx`
calls `notFound()` at line 122 and `resolveProject()` correctly returns `null`,
and its route config (`revalidate`, `dynamicParams`, `generateStaticParams`)
plus its `generateMetadata` not-found branch are **identical** to
`app/blog/[slug]/page.tsx`, which returns a correct 404. Cause not identified.
**Needs verification against a production build** — dev-server status codes for
`notFound()` could not be trusted here, and `next build` must not be run while
the dev server is up (see process rules).

### B3. Missing professional-standard files
| Item | Impact |
|---|---|
| `app/loading.tsx` (root) | Root fallback is still missing; `/projects` and `/about` now have route-level loading states, while other routes show nothing during navigation |
| `app/manifest.ts` | No PWA manifest at all; breaks Add-to-Home-Screen, costs Lighthouse points |
| `app/apple-icon.png` + `app/icon.png` | Only `favicon.ico` exists, so iOS home-screen saves a screenshot instead of the logo. Source available: `public/brand/harisx404 favicon transparent.png` |
| `themeColor` / `viewport` in `app/layout.tsx` | Mobile browser chrome will not match the dark theme |
| `/.well-known/security.txt` | Vulnerability-disclosure contact. Strong fit for a cybersecurity portfolio |

### B4. Content pages absent (need owner wording — do not invent)
- **Cookie Policy** — relevant, the site runs view counters/analytics.
- **Accessibility Statement** — nice-to-have.

### ✅ Verified healthy in the same sweep
404 (`not-found.tsx`), error boundary (`error.tsx`), root error
(`global-error.tsx`), `sitemap.ts` (no dead URLs), `robots.ts`, `rss.xml`,
OG/Twitter images (`/brand/logo-wide.png` → 200), `favicon.ico`, and all 15
public routes returning 200. No broken internal links anywhere.
