# Admin Design System Proposal

**Status:** proposed Admin-only guidance with limited owner-authenticated dashboard/Logs read-only renders. Reuse existing tokens without editing `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`, or locked public components. `app/admin/layout.tsx` adds robots metadata only; isolating public chrome still requires owner approval.

## Existing reference language (confirmed in source)

| Role | Existing value / family | Planned Admin use |
| --- | --- | --- |
| Sans | Outfit via `--font-outfit`, `font-sans` | Navigation, forms, body, metrics |
| Display | Instrument Serif via `--font-instrument-serif`, `font-display` | Sparing page title or editorial emphasis, not dense tables |
| Mono | System `ui-monospace, monospace`, `font-mono` | IDs, timestamps, small metadata |
| Canvas | `--bg-primary`: light `#F7F7F8`, dark `#0d0d0f` | Background; use token instead of new global colors |
| Primary text | `--text-primary`: `#0f172a` / `#fafafa` | Headers, values, form labels |
| Secondary text | `--text-secondary`: `#5E5F6E` / `#a1a1a1` | Explanatory text, timestamps; validate contrast |
| Divider | `--border-primary`: `#D6DADE` / `rgba(255,255,255,0.1)` | Borders and row separators |

Current Admin uses additional local indigo and surface styles and a dashboard background (`#F6F7F9` / `#10131A`); Media/About/Settings inherit that dashboard wrapper. Login passed a seven-width light/dark label/fit check. Owner dashboard dark 390/1440 visual review found no gross clipping after Admin-only responsive changes; sampled page geometry is not a design or CRUD sign-off. Audit computed colors before harmonizing; do not assume undefined-looking utility names such as `bg-muted/40` or `text-ink-primary` produce the intended result. Do not alter global palette or locked root to fix Admin.

## Admin-only component grammar

- Shell: clear title/context, persistent desktop nav, accessible mobile drawer. At 390px dark, dashboard main x15..375 originally contained an edge at x566, hidden by root clip. Admin-only layout/dashboard `minWidth: 0`/minmax tracks now have no uncontained overflow at 320/390/640; stats use two columns at `md`, three at `xl`, Quick Actions one on mobile/two at `lg`, panels split at `xl`. At 390px the drawer has 16 links with min-44px targets, one active `aria-current="page"`, and Escape/close restores focus. **Exception:** locked `/admin/buildlog` still has 9/9/6 out-of-viewport elements at 320/390/768; root clip is not a fix. Public Navbar/Footer/chat still overlap; isolate only after owner approval, and leave locked Buildlog unchanged without named unlock.
- Cards/panels: restrained token borders, predictable spacing and one surface hierarchy; charts and metrics need labels, time range/source and honest unavailable states. No color-only status distinction.
- Forms: visible labels and required/optional cues; inline validation tied to controls; sticky actions only if they do not obscure fields on small screens; clear save/cancel and unsaved-change affordance. FAQ form associates question/answer/order errors with labelled controls; section switch has accessible name. Legacy About's 14 fields now have IDs/labels and 44px minimum text-input height; authenticated same-origin offscreen iframe at 320/390/768/1440 measured all labelled and no overflow, with legacy warning preserved. Settings' seven fields were labelled with no overflow at 320/390/640/768/1024/1440. These checks do not verify typing, save/reopen or screen-reader behavior; Media picker restriction is not a server size cap.
- Lists: stacked row summaries on phones rather than forced wide tables; desktop density appropriate to content. Include accessible action names with item context; destructive controls visually distinct and confirmed.
- Feedback: skeleton only while loading; empty means a successful query with zero results; failure is a retryable error, 401/403 is an access boundary, conflict requires reload/merge decision. Dashboard/Projects and now local Changelog list distinguish query error from empty; Changelog edit icon has an accessible name. Logs owner list renders; Media source has load/copy failure states. Happy-path renders and JSX are not error-path interaction evidence; use focusable recovery and `role=alert`/live status deliberately.
- Motion: brief, optional state transitions; honor reduced motion. Preserve existing mobile drawer focus and inert behavior unless a tested, approved replacement is better.

## Visual acceptance

Expand the sampled authenticated width/theme checks to all Admin pages and error/content states; document `scrollWidth` alone is insufficient when root clips overflow. Test focus, clipboard failures, form input and keyboard interaction rather than relying on read-only geometry. Public presentation must remain unchanged; `app/layout.tsx` still supplies Navbar/Footer/chat plus WebSite JSON-LD/canonical despite Admin noindex. Isolating it requires explicit owner unlock or another approved architecture. Locked Buildlog needs its own named unlock before any correction or sign-off; no complete Admin visual baseline yet.
