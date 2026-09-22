# Community Wall Production Audit

- Date: 2026-09-22
- Route: `/community-wall`
- Status: implementation and local verification complete; live migration and owner lock pending

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
- Replaced rotated shadow-heavy cards with equal 286px aligned cards, shared border
  language, stable one/two/three-column layouts, bounded copy, safe avatars, and
  accessible copy-link feedback.
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
| 320px empty-state geometry | 266px cards, equal 286px heights, 0px overflow |
| Desktop empty-state geometry | Equal 286px heights, 0px overflow |
| CTA-to-Footer handoff | 0px |
| Duplicate IDs | 0 |
| Browser console warnings/errors | 0 |
| `git diff --check` | Passed |

## Live Cutover

Apply `migrations/2026_community_wall_messages.sql` once in the connected Supabase
SQL Editor. The migration is rerunnable and upgrades the existing `messages` table
without deleting valid notes. After cutover, verify a reversible authenticated
submit/approve/archive/delete cycle, settings save, public cache invalidation, and
the full responsive browser matrix before owner lock approval.
