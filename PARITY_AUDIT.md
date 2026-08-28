# PARITY_AUDIT.md — Reference-Site Design Parity: Status & Remaining Work

> Comparison of this project against the reference design standard
> (aayushbharti.in) — structure, layout, styling, typography, motion, and UX.
> **Scope rule:** we match the *design language* (layouts, components,
> animations, fonts, interaction patterns). All *content* (text, photos,
> projects, bios, testimonials) is Muhammad Haris's own — never copied.
> Audited: 2026-08-15. Update this file whenever a gap is closed.

Legend: ✅ matched · 🟡 partial (minor visual delta) · 🔴 missing · 📦 content-blocked (code ready, needs owner content)

---

## 1. Global / shared

| Element | Status | Notes / remaining task |
|---|---|---|
| Dark-first near-black theme + light mode | ✅ | Token system, `#08090c` bg |
| Serif display font w/ gradient italic accents | ✅ | Instrument Serif + `.text-gradient-accent` |
| Mono uppercase kickers | ✅ | Shared `SectionHeading` |
| Floating pill navbar, spring lamp indicator, greeting morph | ✅ | |
| "More" mega-menu w/ staggered cards | ✅ | Card images are stock placeholders → swap to own photos 📦 |
| Top-left logo mark | ✅ | HX brand icon |
| ⌘K search modal | ✅ | Wired to AI search w/ keyword fallback |
| Book-a-Call / Reach-out modal w/ email copier | ✅ | |
| Theme toggle | ✅ | Reference has no visible toggle; ours is an intentional addition |
| Footer 4-col w/ hover arrows + legal row | ✅ | |
| Side hatch-pattern page borders | ✅ | |
| Page scroll progress on blog posts | ✅ | |
| Custom cursor/scroll-smoothing (reference uses none) | ✅ n/a | |

## 2. Homepage

| Section | Status | Remaining |
|---|---|---|
| Hero: "Full stack / *engineer*" + status line + name block | ✅ | |
| Hero photo strip (draggable polaroids) | 🟡📦 | Interaction + frames match; reference shows 4 real photos — ours has 1 real + 3 placeholders. **Task: owner supplies 3 photos → drop into `HomeHero.tsx`** |
| "Available for opportunities"-style badge + New launch card | ✅ | Links to real featured project |
| Rotating role titles | ✅ | (enhancement beyond reference) |
| 4-cell status row w/ colored squares + arrows | ✅ | |
| Bento: Build-together / Tech marquee / What-you-get / Timezones / Uses | 🟡 | Reference's timezone card has a world-clock visual with city chips; ours is a vertical chip ticker — close. Reference's uses-card shows real tool logos → ours letter tiles 📦 (add logo files) |
| Case studies: numbered cards, tinted media, tech chips | 🟡📦 | Layout matches; reference shows real product screenshots + per-tech icons. **Tasks: (a) owner adds project cover images via admin; (b) optional: add small tech-logo icons to chips (currently text-only)** |
| Case studies: sticky side panel with feature bullets (desktop) | ✅ | Sticky right rail at `xl:` in `CaseStudies.tsx` — IntersectionObserver-synced active project, crossfading title/description/feature bullets/tech chips. Below `xl` layout unchanged. |
| Writings 3-col cards w/ cover + read-time meta | ✅📦 | Covers appear when owner adds them |
| Know-about-me + socials + visual column | ✅📦 | Photo placeholder swap |
| Testimonials: tinted cards, segmented progress tabs, autoplay | ✅ | |
| My-site grid (Uses / Behind the code / Guestbook-equivalent) | ✅ | |
| CTA: spinning OPEN-TO-WORK badge, big serif lines, glow, arrow-swap button | ✅ | |

## 3. About page

| Element | Status | Remaining |
|---|---|---|
| Kicker + gradient heading + bio + photo stack | ✅📦 | 2 photo placeholders remain |
| `#experience` timeline | ✅ | Full `bullets[]` + per-role `tech text[]` chip rows (column added to migration + schema; admin form + API updated; defensive when live DB lacks the column until owner re-runs migration). |
| Education section | ✅ | (our addition; admin-managed) |
| Certifications grid | ✅ | (our addition; admin-managed) |
| Skills marquee card | ✅ | |
| Beyond-the-code interest cards | ✅ | |
| CTA reuse | ✅ | |

## 4. Projects

| Element | Status | Remaining |
|---|---|---|
| Index: kicker/heading + category filter pills + all projects | ✅ | |
| Detail: title/tagline/tech/buttons/media/overview/highlights/prev-next | ✅📦 | Cover images from admin |
| Reference detail extras: multi-screenshot gallery + "visit live" hero button cluster | 🟡 | We render one media block; reference shows 2–3 staggered screenshots for some projects. **Task: support `gallery text[]` column → render 2-up staggered images when present.** Optional-polish tier. |

## 5. Blog

| Element | Status | Remaining |
|---|---|---|
| Index: featured wide card + grid + search + categories | ✅ | |
| Post: serif header, meta, cover, MDX, TOC, related, reactions, progress bar | ✅ | |
| Reference extra: per-post cover art w/ title overlay label | 📦 | Comes automatically with cover images |

## 6. Uses page

| Element | Status | Remaining |
|---|---|---|
| Grouped tool sections w/ cards | ✅📦 | Logo (`logo_url`) + external-link (`url` + hover ArrowUpRight) rendering wired on /uses and /toolbox; falls back to letter tiles until owner adds logos/URLs in admin. Owner may still rename tool categories. |

## 7. Pages reference has that we mapped differently (intentional)

| Reference page | Our equivalent | Status |
|---|---|---|
| /guestbook | /community-wall (+ /guestbook redirect) | ✅ |
| /bucket-list | not built — closest: none | 🔴 optional. **Task if wanted: simple `bucket_list` table + checklist-style page + admin CRUD** |
| /contact (book a call) | Reach-out modal + mailto | 🟡 optional dedicated /contact page w/ cal embed |
| /resume | not built | 🔴 optional. **Task: /resume route rendering a PDF link or styled resume page** |
| /attribution, /legal/* | ✅ built | |

## 8. Motion & micro-interaction parity

| Pattern | Status |
|---|---|
| whileInView fade+y staggers | ✅ |
| Spring hover card lifts (400/30/0.8) | ✅ |
| Image zoom-on-hover in overflow containers | ✅ |
| Marquee loops (tech, cities, OPEN-TO-WORK ring) | ✅ |
| Testimonial autoplay + segmented progress | ✅ |
| Navbar spring lamp + mega-menu cascade | ✅ |
| Reference: subtle parallax on hero photos while scrolling | ✅ | useScroll/useTransform y-offsets (-8 to -20px) on polaroid wrappers; drag preserved. |
| Reference: section titles have per-word reveal on some headings | ✅ | `animateWords` prop on SectionHeading (plain-string parts only); enabled on Testimonials + MySiteGrid. |

## 9. Priority order for closing remaining gaps

**Tier 1 — content-blocked (owner, no/low code):**
1. Project cover images + blog covers (admin) — biggest visual jump
2. Hero photos 2–4 + About photos (files → 5-min code swap)
3. Tool logos + URLs in admin; mega-menu card photos
4. Real testimonials/experience/education/cert data (admin)

**Tier 2 — small code polish:** ✅ DONE 2026-08-15
5. ✅ Experience entries: tech chip rows (`tech text[]` column + render)
6. ✅ Uses/toolbox cards: logo + external-link rendering
7. ✅ Hero polaroid scroll parallax; SectionHeading word-stagger option

**Tier 3 — optional feature parity (only if owner wants):**
8. ✅ Case-studies sticky side panel (xl+) — done 2026-08-15
9. Project detail screenshot gallery (`gallery text[]`)
10. /resume page; dedicated /contact page; bucket-list page

**Verdict:** structural/motion/typography parity is effectively complete
(~98%). Every remaining visible difference is either owner content (Tier 1)
or optional polish (Tiers 2–3) documented above with exact file paths.

---

## Full page-inventory audit — 2026-08-16

Reference sitemap crawled (sitemap.xml + live pages) vs our `app/` routes.

### Pages present on BOTH sites
| Reference page | Our route | Notes |
|---|---|---|
| `/` | `/` | Same section order; see §diffs below |
| `/about` | `/about` | We ADD Education / Certifications / Tools sections (upgrade) |
| `/projects` + details | `/projects` + `[slug]` | Ref has 8 projects w/ quarter labels + icon chips; ours 3, text chips |
| `/blog` + posts | `/blog` + `[slug]` | Ref posts have cover images w/ overlay caption; ours text-only cards |
| `/contact` | `/contact` | Ours built; Cal.com embed pending `contact.calLink` |
| `/guestbook` | `/community-wall` | Same feature, different name; ref hero: serif headline + "sign in to leave your mark" gate |
| `/uses` | `/uses` + `/toolbox` | Ref = 3 link-lists (Dev/CLI/Apps) w/ real tool logos; ours = richer cards |
| `/links` | `/links` | Both link-in-bio style |
| `/attribution` | `/attribution` | Both present |
| `/legal/privacy`, `/legal/terms` | same | Present |
| `/rss`, `/sitemap.xml` | `/rss.xml`, `/sitemap.xml` | Present |

### On reference but NOT ours
| Page | Status |
|---|---|
| `/bucket-list` | 🔴 MISSING — 3 numbered groups (Build/Grind/Wander), checked items w/ date + note, unchecked = aspirations; crumpled-paper hero, serif headline |
| `/resume` | 🔴 MISSING — direct resume link (referenced from about metadata) |

### Ours but NOT on reference (extras, keep)
`/changelog`, `/stats`, `/connections`, `/speaking`, `/blog/category/[cat]`, full `/admin` CMS, AI chatbot + AI search.

### Section-level diffs still open (homepage + shared)
1. Hero: ref is CENTERED at narrow widths (pill → headline → mono line → 3 photos → name); ours left-aligned 2-col at all widths.
2. Kickers: ref uses UPPERCASE (`CASE STUDIES`); ours title-case.
3. Case studies: ref quarter labels (Q2 2026) + icon tech chips + per-project ✦ bullets are real content; ours generic bullets + text chips, no dates.
4. Blog cards: ref cover image + overlay label; ours text-only.
5. Know About Me: ref has 3-photo hover stack (coding/travel/gym) + logo & photo block; ours "H" monogram block.
6. Timezones card: ref 7 cities incl. Tokyo/Sydney/San Francisco + "Based in India"; ours 6 cities, generic line (content choice, fine).
7. Uses/Toolbox cards: ref shows real tool logos (Zed, Claude Code, Ghostty, Arc, Linear); ours 2-letter placeholder chips ("VS","Fi").
8. Guestbook hero: ref serif "The wall remembers" + auth-gated composer at top; compare w/ our community-wall layout.
9. Ref pages share crumpled-paper texture hero backdrop on subpages; ours plain bg.

### Phase series closed — 2026-08-16
1. Uppercase kickers — already matched (CSS `uppercase` site-wide) ✅
2. Real tool logos in Toolbox cards (devicon + simple-icons via jsDelivr, dark:invert for monochrome) ✅
3. Blog card cover captions — serif italic overlay on image/gradient covers ✅
4. HeroTexture paper-grain backdrop on 6 subpage heroes (own SVG noise) ✅
5. /bucket-list page — 3 numbered groups, checked/unchecked markers, editable in site-content ✅
6. Case-study quarter labels (start_date → created_at fallback; set real dates in admin) ✅
7. Know About Me photo hover stack — 3 fanned cards spread on hover + "I build." caption
   (📦 swap in 3 distinct photos via ✏️ EDIT marker in AboutTeaser) ✅
Remaining known deltas: centered hero variant at narrow widths; per-project unique ✦ bullets (needs owner content); Cal.com embed (needs contact.calLink).
