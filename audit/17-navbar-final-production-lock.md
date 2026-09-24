# Navbar Final Production Lock Audit

- Date: 2026-09-24
- Routes: shared public Navbar
- Status: final production re-lock
- Base commit before final uncommitted refinement: `dc9f662`

## Scope

- `app/components/Navbar.tsx`
- Navbar use of `app/components/ThemeToggle.tsx`
- Navbar launch and return-focus behavior for Search and Reach Out
- `public/images/nav-community-wall.svg`
- `public/images/nav-buildlog.svg`

SearchModal and ReachOutModal implementations remain governed by their existing
locks. This audit exercised their Navbar handoffs but did not restyle or refactor
either dialog.

## Final Navbar State

- Desktop retains the centered primary pill, independent Search and Theme rail,
  active-route states, More control, and Let's Connect control.
- Mobile retains one 182x32 compact pill that opens Search; the desktop More panel
  and side-control rail are absent below the `md` breakpoint.
- More retains its measured 720x287 desktop panel, 228px minimum content height,
  two equal 236x211 feature cards, 212px links column, 24px final radius, and
  360px 0px transform origin at 1440px.
- More opens in 0.9s with `[0.19, 1, 0.22, 1]` and closes in 0.65s with
  `[0.4, 0, 0.2, 1]`. Both measured clip calculations use the final 720px width.
- Community Wall and Buildlog use local, dependency-free 1200x1073 SVG artwork.
  Their source ratio matches the rendered cards, so `object-cover` produces no
  meaningful crop or bars.
- Feature images are decorative inside already-labelled links and therefore use
  empty alt text. Visible title and subtitle text supplies each accessible name.
- Both themes use 60% resting and 80% hover image opacity. The bottom 58% overlay
  is white/white-85/transparent in light mode and panel-matched
  `#1c1c1c`/`#1c1c1c`-75/transparent in dark mode.
- Reduced motion removes timed morphing, delayed control entrances, image zoom,
  title translation, pulse animation, and mobile content cycling while preserving
  all controls, content, and geometry.

## Interaction Verification

| Gate | Result |
|---|---|
| Desktop Search initial focus | Search input |
| Desktop Search Escape return | Desktop Search trigger |
| Mobile Search initial focus | Dialog container; no forced software keyboard |
| Mobile Search Escape return | Visible mobile Navbar trigger |
| Reach Out initial focus | Message field on fine-pointer desktop |
| Reach Out Escape return | Let's Connect trigger |
| Theme toggle | Dark to light and light to dark passed |
| More keyboard opening | Passed; first More destination receives focus |
| More Escape return | More trigger |
| More outside-pointer close | Passed |
| ARIA state | `aria-expanded`, `aria-controls`, `aria-current` passed |

## Responsive And Visual Verification

| Viewport | Result |
|---|---|
| 1440x900 | 720x287 panel; 236x211 equal cards; no clipping |
| 1024x768 | Final desktop geometry; no clipping or overflow |
| 768x1024 | 707x287 constrained panel; 229x211 cards; no clipping |
| 390x844 | Mobile pill only; no More panel or overflow |
| 360x640 | Mobile pill only; no More panel or overflow |
| Light and dark themes | Text hierarchy and overlays match adjacent controls |
| Normal and reduced motion | Content and geometry preserved |

## Static And Integration Verification

| Gate | Result |
|---|---|
| TypeScript | Passed, 0 errors |
| Targeted ESLint | Passed, 0 errors |
| Links integration | 2/2 passed |
| Preview integration | 3/3 passed |
| Home/About surface integration | 3/3 passed |
| Local Navbar SVG responses | 2/2 HTTP 200 |
| Retired `/test`, `/attribution`, `/stats` routes | Remain removed |
| Application console errors | 0 |
| Horizontal overflow | 0 at audited widths |
| `git diff --check` | Passed |

## Lock Decision

All Navbar-specific production gates pass. The earlier apparent mobile Search
focus-restoration failure was invalid because it invoked the hidden mobile trigger
at a desktop viewport; the correctly sized 390px test restores focus to the visible
mobile trigger. No Navbar defect remains open. The complete Navbar system is frozen
in the state documented above.
