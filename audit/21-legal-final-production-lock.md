# Privacy And Terms Production Engineering Lock

- Date: 2026-09-25
- Routes: `/legal/privacy`, `/legal/terms`
- Status: layout and checked-in feature wording frozen; external legal review remains a release task

## Final State

- Both pages use the locked public-page frame, theme-aware paper texture,
  46/56px Instrument Serif hero, 12px mono kicker, 15px supporting copy,
  readable section subtitles, 16px inner-card radii, 56px content handoff,
  and 112px shared CTA/Footer handoff.
- Privacy covers the implemented Contact fields and delivery metadata, optional
  GitHub/Google wall sign-in, Loops newsletter signup, article-reaction cookies,
  Gemini chat processing, Gravatar checks, Supabase, Cloudinary, and
  request-derived abuse protection. It offers a clear contact path for access,
  correction, or deletion requests without guaranteeing blanket erasure or a
  processing deadline that cannot be verified from the application.
- Terms distinguishes portfolio work, credited third-party materials, and visitor
  contributions. It describes public wall notes, moderated testimonials, limits
  on misuse, and informational examples without claiming all published material
  is original or promising moderation outcomes it cannot guarantee.
- The visible dofollow design-inspiration credit to Aayush Bharti and its safe
  new-tab link remain unchanged.
- Both pages retain an explicit revision/effective date. These dates should only
  change when the actual policy changes, not just because time passes.

## Corrected Issues

1. Removed paragraph-inside-`h1` markup, duplicate frame rails, obsolete hero
   texture, low-contrast subtitle gray, and Resume-era section/CTA spacing drift.
2. Replaced Privacy's demonstrably false "only submitted data," "nothing else,"
   "no cookies/IP logs," and absolute no-sharing/deletion promises.
3. Described actual optional third-party and data flows rather than calling an
   incomplete provider list complete.
4. Removed Terms' blanket originality/proprietary claim about imported and
   credited material while retaining attribution and respectful-use guidance.
5. Added meaningful subsection headings to Privacy's feature and tool cards,
   clearer link focus treatment, and reduced-motion support on hero accents.

## Verification

| Gate | Result |
|---|---|
| Public routes | Both HTTP 200 |
| TypeScript and targeted ESLint | Passed |
| Legal integration | 5/5 passed |
| Navigation and preview integration | 4/4 and 3/3 passed |
| Desktop light/dark visual review | Passed |
| 1440, 1024, 768, 390, 375, 360px responsive checks | No horizontal overflow or clipped legal cards at measured widths |
| Section subtitle contrast | 5.88:1 light, 7.51:1 dark |
| Hero heading semantics | One valid `h1` per route |
| Terms design-inspiration link | Preserved |
| Browser console | No application errors |
| `git diff --check` | Passed |

## Lock Scope

The public design and feature descriptions are locked in the current checked-in
state. Do not change the legal-page layout, dates, credit, copy, or information
hierarchy without a new explicit owner request or a material change in site
behavior. This technical audit verifies alignment with the repository, not legal
compliance in any particular jurisdiction. Before deployment the owner should
confirm actual provider practices, data-request handling, rights to third-party
assets, and any jurisdiction-specific disclosures. Material changes to those facts
require an accurate policy update; no policy can be guaranteed correct forever.

## Owner-Authorized Clarity Amendment

On 2026-09-25 the owner requested generic, durable legal page headings and less
provider-specific policy copy. Both heroes now use the kicker `Legal`, with
`Privacy Policy.` and `Terms of Use.` as their respective `h1` labels.

- Privacy's standalone Newsletter Email card was replaced by a Testimonials
  disclosure. A conditional email-updates sentence remains under Email services:
  the newsletter form is still rendered on blog articles and sends subscriber
  addresses to an external mailing provider. Removing that sentence while the
  signup exists would make the notice inaccurate.
- AI chat is now described as sending relevant messages and chat history to an
  external AI provider, rather than hard-coding Gemini into the legal notice.
  Changing providers in the future still requires checking the new provider's
  data handling and applicable disclosure requirements.
- Wall sign-in, database/authentication, email, and media providers are described
  by function. Cookie, request-signal, contact-field, testimonial, and public
  contribution disclosures remain explicit.
- The separate Design inspiration card was removed from Terms. A small visible
  Aayush Bharti link remains in the Rights section to retain the existing
  reference-site attribution obligation documented in `audit/README.md`.

The new titles, card and service copy, and credit treatment are covered by the
legal integration tests. The amendment changes no shared locked components and
preserves the established responsive/theme visual system. It supersedes the
older title and provider-specific wording above.
