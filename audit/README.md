# Design Parity Audit — Reference Site vs This Project

**Goal:** every page, section, component, window, feature, animation and
transition matches the reference design (aayushbharti.in) pixel-by-pixel
in *pattern* — while ALL content (text, photos, projects, goals,
testimonials) stays Muhammad Haris's own.

## Method (used for every item)
1. Open the reference at the same viewport (800px and 1440px) in Playwright.
2. Capture screenshot + accessibility snapshot of the target area.
3. Open ours at the same viewport; capture the same area.
4. Compare geometry (position/size via getBoundingClientRect), styling
   (computed styles: radius, colors, padding), typography, and motion.
5. Fix, re-verify live, commit with a phase-tagged message, push.

## Status legend
- ✅ VERIFIED — compared live on both sites, matches
- ⚠️ PARTIAL — matches with a known, listed delta
- 🔴 OPEN — not yet compared or known mismatch
- 📦 CONTENT — code matches; waiting on real owner content
- ❓ DECISION — needs owner's answer before changing

## Files
| File | Scope |
|---|---|
| `01-global.md` | Navbar, footer, theme, fonts, tokens, shared modals |
| `02-home.md` | Homepage — all 11 sections top to bottom |
| `03-pages.md` | Every subpage vs its reference counterpart |
| `04-motion.md` | Animations, transitions, hover/scroll effects |
| `05-data-seed.md` | DB seed status + random placeholder data log |

## Open decisions for the owner (❓)
1. **Hero column restructure** — reference desktop puts the launch pill
   ABOVE the headline (left) and the photo strip UNDER the name (right).
   Ours: photos bottom-left, launch pill top-right. Restructure to match?
2. Keep our extra pages (/stats, /connections, /speaking, /changelog)
   visible in footer, or trim to reference's exact footer link set?
3. Reference blog cards show 3 posts with cover IMAGES from frontmatter;
   ours uses gradient+caption fallback until posts get cover_image_url.
   Want random stock covers seeded onto the top posts?

## ⚠️ IMPORTANT — Reference site license constraint (found 2026-08-16)
The reference site's own Terms of Use state that its source code and visual
design are proprietary: cloning or replicating the site in its entirety is
prohibited; studying specific UI components for education/inspiration is
permitted; and substantial usage requires a visible dofollow backlink to the
site. Consequences for this project:
1. A visible credit + backlink to the reference has been added to /attribution.
2. Further "pixel-identical whole-site" refinement passes are STOPPED.
   The site keeps its current inspiration-informed state; future design work
   should deliberately differentiate rather than converge further.
3. All content (text, photos, projects, testimonials, goals) remains original.
