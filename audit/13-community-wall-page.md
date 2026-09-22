# Community Wall Production Audit

- Date: 2026-09-22
- Route: `/community-wall`
- Status: implementation and production-path verification complete; owner visual review with temporary preview notes in progress

## Scope

The pass covers the public Community Wall route, managed settings, GitHub-authenticated
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
- Added the reference centered auth/composer dialog with blurred backdrop,
  focus trap, Escape/click-away close, focus restoration, scroll lock, responsive
  400px shell, animated scale/fade entry, and functional GitHub OAuth.
- Dialog and card motion honor `prefers-reduced-motion`; every dismissal path,
  including Escape, restores focus to the original card trigger.
- Added explicit loading, empty, OAuth-failure, submission success/error, and
  focused route-error states.
- Added strict 24-note public pagination and independent 50-note Admin pending and
  reviewed pagination with canonical out-of-range recovery.
- Added pending-by-default moderation, published-only restricted public view,
  anonymous/authenticated base-table denial, and removal of public `user_id`.
- Added Admin-email-protected list/approve/archive/return/delete endpoints and
  settings management.
- Added atomic database submission with per-user advisory locking, 60-second
  cooldown, three-per-24-hour limit, normalized verified GitHub identity, strict
  message/name/avatar/pattern/rotation/status constraints, and deterministic indexes.
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
| Atomic cooldown/daily limits | Passed |
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
| Authenticated moderation lifecycle | Pending → published → archived → pending → deleted |
| Public cache invalidation | Passed after every moderation transition |
| Authenticated settings roundtrip | Passed with public revalidation |
| Blog regression | 3/3 passed |
| Contact regression | 2/2 passed |
| Links regression | 2/2 passed |
| Credentials regression | 5/5 passed |
| Full public preview sweep | Passed |
| Independent code/design review | No high or medium blockers |
| `git diff --check` | Passed |

## Live Cutover

`migrations/2026_community_wall_messages.sql` is applied to the connected Supabase
project. Existing notes were preserved as published and malformed legacy values
were safely normalized. A reversible temporary-user submission and authenticated
Admin moderation cycle passed through pending, published, archived, pending, and
deleted states with public cache invalidation at each transition. The settings API
passed an authenticated save/revalidation roundtrip. No temporary auth or note
records remain. The page is ready for final owner visual approval before locking.

## Temporary Visual Preview

At the owner's request, seven natural-looking published preview notes were added
to exercise the complete multi-row wall across all five palettes and varied copy
lengths. They use the author names Maya Chen, Omar Khan, Sofia Martinez, Noah
Williams, Ava Patel, Liam Brooks, and Elena Rossi. Remove these seven exact preview
records before production lock unless the owner explicitly chooses to retain them.
