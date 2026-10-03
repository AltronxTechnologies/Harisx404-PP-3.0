# Admin Design System Proposal

**Status:** proposed Admin-only guidance with a source-level login/shell update; authenticated rendering is unverified. Reuse existing tokens without editing `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`, or locked public components. `app/admin/layout.tsx` adds robots metadata only; isolating public chrome still requires owner approval.

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

Current Admin uses additional local indigo and surface styles and a dashboard background (`#F6F7F9` / `#10131A`); Media/About/Settings now inherit that dashboard wrapper. The login uses tokenized surfaces and an Instrument Serif `h1`; a seven-width light/dark browser check passed for card fit, no overflow, accessible field names, 44px+ fields and 48px+ submit. Form submission and authenticated pages remain unverified. Audit computed colors before harmonizing; do not assume undefined-looking utility names such as `bg-muted/40` or `text-ink-primary` produce the intended result. Do not alter the global palette to fix Admin.

## Admin-only component grammar

- Shell: clear page title and context, persistent desktop nav, accessible mobile drawer; Media/About/Settings already join the dashboard route group at unchanged URLs. Reserve space for form content and narrow screens. Public Navbar/Footer/chat remain inherited, so isolate only after owner approval and public regression review.
- Cards/panels: restrained token borders, predictable spacing and one surface hierarchy; charts and metrics need labels, time range/source and honest unavailable states. No color-only status distinction.
- Forms: visible labels and required/optional cues; inline validation tied to controls; sticky actions only if they do not obscure fields on small screens; clear save/cancel and unsaved-change affordance. FAQ form source associates question/answer/order errors with labelled controls; the whole-section switch has an accessible label. Media source uses a keyboard upload button and a restricted file picker (not a server size cap). Verify these interactions with authenticated keyboard/screen-reader use before accepting them. Successful save announces persisted state.
- Lists: stacked row summaries on phones rather than forced wide tables; desktop density appropriate to content. Include accessible action names with item context; destructive controls visually distinct and confirmed.
- Feedback: skeleton only while loading; empty means a successful query with zero results; failure is a retryable error, 401/403 is an access boundary, conflict requires reload/merge decision. Current dashboard/Projects distinguish query error from zero/empty, Logs shows unavailable on schema read failure, and Media shows a distinct load failure with retry, copy failure and upload-success-but-refresh-failed notice. Source states are not authenticated interaction evidence; use focusable recovery and `role=alert`/live status deliberately.
- Motion: brief, optional state transitions; honor reduced motion. Preserve existing mobile drawer focus and inert behavior unless a tested, approved replacement is better.

## Visual acceptance

The seven-width login layout/field browser check is complete; compare authenticated pages, including Media image/copy/upload states, at 320/390/768/1440 in light/dark with long titles, errors, empty lists and large forms. Media copy is visible to touch and keyboard users in source; test focus/clipboard failure rather than relying on code inspection. Check reading order, keyboard submission, zoom, contrast and no clipping. Public presentation must remain unchanged; isolating inherited Navbar/Footer/chat via `app/layout.tsx` requires an explicit owner unlock or another approved architecture. Owner review is needed before locking an Admin visual baseline.
