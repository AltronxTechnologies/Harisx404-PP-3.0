# Home Final Production Lock Audit

- Date: 2026-09-24
- Route: `/`
- Status: owner-approved production lock
- Base commit before lock record: `fdbb8b2`

## Scope

- `app/page.tsx` and `app/loading.tsx`
- `app/components/home/**`
- `app/components/github/GitHubActivityBentoServer.tsx`
- Home-facing credential preview and summary contracts
- `app/lib/live-stats.ts` and `app/lib/public-page-data.ts`
- The owner-authorized reduced-motion hydration correction at
  `app/components/Navbar.tsx:669,685`

Shared Navbar, Search, Reach Out, Footer, CTA, About, Projects, Blog, Buildlog,
Credentials, Community Wall, and legal surfaces remain governed by their own
existing locks. The Navbar audit change was limited to making the two side-control
`initial` props server/client stable; visual timing and final geometry are unchanged.

## Final Home State

- Hero, status row, social/technology bento, case studies, writing cards, About
  teaser, testimonials, Behind-the-site grid, FAQ, CTA, and Footer handoff retain
  their owner-approved presentation and responsive behavior.
- GitHub activity is one shared Home/About implementation with hourly caching,
  a 2.5-second request deadline, Suspense isolation, geometry-matched loading,
  last-known-good cached data, and a neutral unavailable state.
- The GitHub card pairs `GitHub activity` with its status, uses a fluid recent
  activity graph, and closes with `828 contributions` on the left and the
  `Less`-to-`High` intensity key on the right. The total is calculated from every
  public GitHub calendar year beginning with account creation and updates hourly.
- Contribution cells remain 12-14px while the number of complete recent weeks is
  calculated from the card's measured width. Empty and active levels use approved
  light/dark neutral-to-emerald scales.
- Mouse, pen, touch, and keyboard share one day-detail state. The transient detail
  is anchored to the chart's top-right; the chart uses one roving tab stop and
  arrow-key navigation.
- Behind-the-site Credentials is issuer-independent: three abstract rectangular
  proof/archive tiles, an automatically updating published count, and the fixed
  copy `Learning milestones, backed by proof.` It does not require redesign when
  credentials are added, removed, reordered, or replaced.

## Verification

| Gate | Result |
|---|---|
| TypeScript | Passed, 0 errors |
| Targeted ESLint | Passed, 0 errors |
| Home/About source and runtime contracts | 3/3 passed |
| Home/About responsive light/dark matrix | 12/12 passed |
| Protocol viewport matrix | 12/12 passed: 1440x900, 1024x768, 768x1024, 390x844, 375x667, 360x640 in both themes |
| Full public preview browser sweep | 13/13 routes passed |
| Blog | 3/3 passed, including every syndicated article route |
| Contact | 2/2 passed |
| Links | 2/2 passed |
| Credentials | 5/5 passed |
| Buildlog | 6/6 integration plus 4/4 semantic-version tests passed |
| Community Wall | 4/4 passed |
| Preview integration | 3/3 passed |
| Home internal links | 23/23 returned HTTP 200 |
| Browser/runtime errors | 0 |
| Failed requests and broken images | 0 |
| Horizontal overflow | 0 at every audited viewport |
| Duplicate IDs | 0 |
| GitHub chart clipping | 0 |
| Behind-the-site height spread | 0px |
| Reduced-motion hydration | Passed, 0 warnings |
| Visible non-chart controls below 24px | 0 |
| CLS | 0.00009 |
| Isolated warm Home TTFB | 0.257-0.283s |
| Isolated warm Home completion | 0.568-1.028s |
| `git diff --check` | Passed |

## Accepted Intentional Variations

- Individual contribution cells are 12-14px to preserve the essential dense
  calendar visualization. They are exempted from the standalone 24px target rule:
  the chart provides one keyboard stop with arrow navigation, pointer-coordinate
  hover, touch selection, full labels, and a large chart-level interaction region.
- The WebGL globe can emit Chromium software-renderer warnings in sandboxed
  headless environments. These are browser driver warnings, not application
  errors; the full preview sweep reports zero page errors or failed requests.
- GitHub and credential counts are intentionally dynamic. Data changes do not
  unlock or amend the frozen presentation.

## Lock Decision

All required production gates pass. No open Home-specific design debt remains.
The Home page is approved and frozen in its current state.
