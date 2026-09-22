# Community Wall Production Audit

- Date: 2026-09-22
- Route: `/community-wall`
- Status: owner-approved and locked; implementation, live Supabase, and production-path verification complete

## Scope

The pass covers the public Community Wall route, managed settings, GitHub/Google-authenticated
submission flow, moderation model, Admin queue/actions, database schema/views/RLS,
rate limiting, pagination, loading/empty/error states, metadata, tests, and route
blueprints. Locked Navbar, Search, Reach Out, CTA, Footer, and other locked pages
were not modified.

## Production Changes

- Replaced invalid paragraph-inside-H1 markup and duplicate decorative rails with
  the locked page-header rhythm, shared paper texture, global rails, and shared CTA.
- Added managed supporting copy, collection label, empty state, composer/sign-in
  copy, SEO, Open Graph, and Twitter metadata.
- Rebuilt cards to the supplied reference: 176px stamp bodies, scalloped tear
  edges, `shadow-2xl`, subtle deterministic tilts, 24px masonry gaps, bounded copy,
  safe avatars, and accessible copy-link feedback.
- Removed the redundant scallop stroke and overlapped metadata surfaces by one
  pixel to eliminate light/dark raster seams. Message copy retains the reference
  18px/700 scale with a 28-character measure, tightened tracking, and restrained
  contrast shadow for clearer reading across every palette.
- Added the reference centered auth/composer dialog with blurred backdrop,
  focus trap, Escape/click-away close, focus restoration, scroll lock, responsive
  400px shell, animated scale/fade entry, and functional GitHub OAuth.
- Dialog and card motion honor `prefers-reduced-motion`; every dismissal path,
  including Escape, restores focus to the original card trigger.
- Modal open state inerts and hides background application roots from assistive
  technology, while the click-away backdrop remains non-focusable and the close
  control stays inside the dialog.
- Every published note is a labelled article whose visible message is its H3,
  preserving H1 → H2 → H3 → shared CTA H2 navigation semantics.
- Added explicit loading, empty, OAuth-failure, submission success/error, and
  focused route-error states.
- Added strict 24-note public pagination and independent 50-note Admin pending and
  reviewed pagination with canonical out-of-range recovery.
- Added immediate account publication, published-only restricted public view,
  anonymous/authenticated base-table denial, and removal of public `user_id`.
- Added Admin-email-protected list/approve/archive/return/delete endpoints and
  settings management.
- Added atomic database submission with per-user advisory locking and a partial
  unique index enforcing one note per account. GitHub/Google identities and photos
  are normalized; strict message/name/avatar/pattern/rotation/status constraints
  and deterministic indexes remain enforced.
- Expanded visual identity to 24 high-contrast card palettes and 24 deterministic
  illustrated profile/color avatar fallbacks. Real provider photos take precedence and switch to
  fallback automatically on load failure. Decorative SVGs are smaller/quieter,
  message shadow is restrained, and dark scallops have a thin separation stroke.
- Copy-link controls now provide visible and announced Copied/Copy failed feedback,
  use a legacy fallback when the modern Clipboard API is unavailable, and reset
  cleanly without leaking timers.
- Added safe migration normalization so legacy blank copy, long names, HTTP avatars,
  and old -5..5 rotations cannot block cutover; valid existing notes remain published.
- Removed five disconnected legacy modal/canvas components and repaired OAuth error
  routing.
- Community stats now count only approved public notes and are invalidated after
  moderation.

## Verification

| Gate | Result |
|---|---|
| TypeScript | Passed, 0 errors |
| Targeted ESLint | Passed, 0 errors/warnings |
| Community Wall integration | 4/4 passed |
| Responsive browser matrix | 12/12 light/dark combinations passed |
| Clean PostgreSQL 16 migration | Passed |
| Migration rerun | Passed |
| Historical-schema upgrade | Passed, malformed legacy data normalized |
| Restricted public views/grants | Passed |
| Pending/published/archive visibility | Passed |
| Database validation failures | Passed |
| `updated_at` trigger | Passed with `clock_timestamp()` |
| Atomic one-note-per-account limit | Passed |
| Consolidated schema | Passed on clean PostgreSQL 16 |
| 320px empty-state geometry | At least 266px cards, 24px stack gap, 0px overflow |
| Desktop empty-state geometry | Reference 3-column stamp grid, 0px overflow |
| CTA-to-Footer handoff | 0px |
| Duplicate IDs | 0 |
| Browser console warnings/errors | 0 |
| Reference mobile hero geometry | 152px top, 48px H1, 96px hero-to-wall gap |
| Reference desktop hero scale | 60px H1 |
| Reference mobile card width | 266px before tilt at 320px viewport |
| Reference mobile dialog | 288px wide, 16px viewport insets, centered |
| Dialog accessibility | Focus trap, scroll lock, Escape/click-away, focus restoration passed |
| Reduced motion | Dialog duration 0; card tilt/transition removed |
| Live Supabase cutover | Passed; published-only views and managed settings live |
| Atomic authenticated submission | Passed with temporary user and cleanup |
| Signed-in composer browser flow | Session, modal, server action, immediate publication, success feedback passed |
| Authenticated moderation lifecycle | Pending → published → archived → pending → deleted |
| Admin moderation UI | Approve, archive, restore, delete, settings page passed |
| Public cache invalidation | Passed after every moderation transition |
| Authenticated settings roundtrip | Passed with public revalidation |
| Blog regression | 3/3 passed |
| Contact regression | 2/2 passed |
| Links regression | 2/2 passed |
| Credentials regression | 5/5 passed |
| Full public preview sweep | Passed |
| Independent code/design review | No high or medium blockers |
| Temporary fixture cleanup | 17/17 removed; no verification users or notes remain |
| `git diff --check` | Passed |

## Live Cutover

The latest `migrations/2026_community_wall_messages.sql` revision is applied to the
connected Supabase project. Existing notes were preserved, duplicate legacy account
ownership was normalized, and immediate publication, one-note-per-account
uniqueness, and pattern 23 were verified with a reversible temporary user. Admin
moderation and settings cycles passed with public cache invalidation. No temporary
auth or verification records remain.

Supabase Auth currently reports GitHub and Google providers disabled. The owner has
classified provider credentials as deployment-time configuration; callback routes,
equal provider controls, failure recovery, and OAuth redirect generation are code-
verified. Both providers must be enabled before the deployed sign-in controls are
operational. The shared configured production domain also remains a site-wide
deployment dependency rather than a Community Wall implementation defect.

## Temporary Visual Preview

Seven natural-looking published fixtures exercised the complete multi-row wall
across all five palettes and varied copy lengths. The populated responsive matrix
passed, then all seven fixtures were removed. The production table contains only
the two pre-existing published owner records and no verification users or notes.

A second owner-requested preview set added ten published cards under the names
Daniel Kim, Fatima Noor, Lucas Meyer, Priya Shah, Ethan Cole, Hana Suzuki, Marcus
Reed, Amara Okafor, Theo Martin, and Nadia Ali. The populated 12-case responsive
matrix passed, then all ten records were removed before production lock.

## Owner Lock

The owner explicitly authorized locking Community Wall on 2026-09-22 after the
reference-aligned visual pass, live database verification, signed-in composer,
Admin moderation/settings workflows, responsive browser matrix, cross-page
regressions, and independent code/design reviews passed. The frozen contract is
recorded in entry 34 of `LOCKED_PERFECT.md`. Future Community Wall changes require
a new explicit owner unlock.
