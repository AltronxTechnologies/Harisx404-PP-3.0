# X Profile Activation

- Date: 2026-09-25
- Approved destination: `https://x.com/harisx404`
- Scope: active X/Twitter profile links and seed data only

## Changes

- `app/data/siteMetadata.ts` now owns the public X profile destination used by
  Footer, Reach Out, and Home Person structured data.
- Navbar Search Connect uses that shared destination instead of a separate old
  `twitter.com` URL.
- Links' former noninteractive `Soon` card is now an accessible external link.
- Contact's former `href="#"` social control now opens the real profile in a new
  tab. Existing icon, size, focus, layout, and other social links are unchanged.
- Existing Home account tile already used the correct `x.com` URL and did not
  require a change.
- Future database seeds now use the new URL. The connected Supabase setting with
  the old URL was updated to the new URL and verified by the response.
- Third-party X links in historical articles and `twitter.com/intent/tweet`
  sharing URLs are deliberately unchanged: they are not Haris's profile links.

## Verification

| Gate | Result |
|---|---|
| TypeScript and targeted ESLint | Passed |
| Links integration | 2/2 passed |
| Contact integration | 2/2 passed |
| Navigation integration | 4/4 passed |
| Home/About surfaces | 3/3 passed |
| Preview integration | 3/3 passed |
| Live Links, Contact, Footer, and Search accessibility snapshots | Correct X destination |
| `git diff --check` | Passed |

## Boundary

This amends only the X destination and its former placeholder behavior on locked
public surfaces. It does not redesign Home, Links, Contact, Navbar, Search,
Reach Out, or Footer. The existing Admin Settings API assumes key/value rows,
while the connected `site_settings` table stores fields as columns; the public
profile links do not depend on that Admin form. The connected `twitter_url`
column was updated directly. Correcting the Admin Settings persistence model is
a separate task, not a precondition for the public X links.
