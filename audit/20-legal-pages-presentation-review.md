# Legal Pages Presentation Review

- Date: 2026-09-24
- Routes: `/legal/privacy` and `/legal/terms`
- Status: presentation corrected; substantive legal wording awaiting owner review

## Scope

Privacy was reviewed and corrected first, then Terms. Changes were limited to
the local page frame, semantic hero, contrast, local card radii and borders, link
focus, and spacing before the existing shared CTA. The Navbar, Search, CTA,
Footer, and their locked implementations were not changed. Terms' visible
credit and dofollow link to Aayush Bharti remain intact.

Both pages now follow the same `mt-14` frame, `GridWrapper` and `PaperHeroTexture`
hero, 12px mono kicker, 46/56px Instrument Serif title, 15/24px description,
56px hero-to-content gap, and 112px CTA handoff used by the locked public pages.
The former paragraph-inside-`h1`, duplicate side rails, old hero texture, and
low-contrast subtitle gray were removed. Local panels use the site's 16px inner
radius and shared neutral border token where they are not status-colored.

## Verification

| Gate | Result |
|---|---|
| Privacy and Terms routes | HTTP 200 |
| Page hero semantics | One valid `h1` per route |
| Terms design-inspiration credit | Preserved |
| Desktop light/dark visual review | Passed |
| 390px dark-mode responsive check | No horizontal overflow or clipped cards |
| TypeScript | Passed |
| Targeted ESLint | Passed |
| Legal route integration | 3/3 passed |
| Navigation integration | 4/4 passed |
| Preview integration | 3/3 passed |
| `git diff --check` | Passed |

## Owner Review Required

The copy was intentionally not changed. It cannot be signed off as a complete
privacy or legal account without checking these statements against deployed
services and intended commitments:

1. Privacy says only data knowingly submitted is stored and that contact stores
   nothing beyond name, email, and message. The contact form also stores subject,
   inquiry type, request/delivery metadata, and a hashed request signal for rate
   limiting. Article reactions use visitor identifiers and cookies.
2. Privacy describes only GitHub sign-in, although the Community Wall offers both
   GitHub and Google. It omits the site-wide AI assistant's transfer of chat
   messages to Google's Gemini service and newsletter email transfer to Loops.
3. Privacy calls its service list complete, describes general page-view counts,
   and claims no cookies, IP signals, or personal-data sharing. Those absolute
   statements do not match the feature code. Third-party practices and deployed
   configuration also need verification.
4. Privacy promises permanent deletion and a turnaround of a few days. The owner
   must confirm what is actually possible for contact, newsletter, provider, and
   backup data, and approve the final request-handling wording.
5. Terms describes all code/content as original and proprietary despite imported
   blog material and third-party assets needing attribution or rights review.
   Its usage permissions, liability limits, moderation commitments, and effective
   date require owner or legal review. The required Aayush Bharti credit must stay.

## Lock Decision

The presentation-only changes are verified. **Neither legal document is
production content-locked yet.** Obtain owner-approved policy wording and verify
the relevant third-party/deployment behavior before final legal sign-off.

The later owner-directed content and production pass is documented in
`audit/21-legal-final-production-lock.md`. Its technical corrections supersede
the open copy issues listed above; this document remains the pre-rewrite audit.
