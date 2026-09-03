# Site Font Inventory and Local-Font Migration Guide

Last audited: 2026-09-03

This document is the source of truth for the fonts currently declared, loaded,
and used by the site. It also records unused fonts, fallback stacks, synthetic
weight/style risks, third-party dependencies, and the files needed for a safe
local-font migration.

No font implementation was changed as part of this audit. The approved Home,
About, Navbar, Search, Reach Out, and Footer presentation remains locked under
`LOCKED_PERFECT.md`.

## Executive summary

The effective primary type system is:

| Role | Current font | How it is selected |
|---|---|---|
| Primary sans/body/UI | Reference Outfit | Inherited from `body.font-sans` |
| Primary mono/UI labels | Reference Core Mono | Explicit `font-mono` utility |
| Display/card/editorial serif | Reference Bluu Next | Explicit `font-display` utility |
| Large section/page serif | Instrument Serif | Explicit CSS variable family |
| Experience/education serif | Source Serif 4 | Explicit CSS variable family |
| Hero decode headline | JetBrains Mono | Explicit CSS variable family |
| Article code/table mono | Geist Mono | Direct scoped CSS rules |

The three fonts that define most of the site's appearance - Reference Outfit,
Reference Core Mono, and Reference Bluu Next - are fetched directly by the
browser from `aayushbharti.in`. They are not stored in this repository. This is
the main reliability and ownership issue to resolve.

Two loaded families are currently unused:

- Geist Sans
- Space Grotesk

No authored `.woff`, `.woff2`, `.ttf`, `.otf`, or `.eot` font files currently
exist in the repository.

## Current font-routing configuration

### Root loading

`app/layout.tsx:7-40` imports and configures:

- Geist Sans and Geist Mono from the `geist` npm package.
- Instrument Serif, Source Serif 4, JetBrains Mono, and Space Grotesk through
  `next/font/google`.

Their generated variables are attached to `<html>` at
`app/layout.tsx:125-129`:

```text
--font-geist-sans
--font-geist-mono
--font-instrument-serif
--font-source-serif
--font-jetbrains-mono
--font-space-grotesk
```

The `<body>` has `font-sans` at `app/layout.tsx:130`, making the Tailwind sans
alias the inherited font across the application.

### Tailwind aliases

The active aliases are defined in `tailwind.config.ts:13-18`:

```text
font-sans     = "Reference Outfit", system-ui, sans-serif
font-grotesk  = "Reference Outfit", system-ui, sans-serif
font-mono     = "Reference Core Mono", ui-monospace, monospace
font-display  = "Reference Bluu Next", Georgia, serif
```

Important consequences:

- `font-sans` does not mean Geist Sans. It means Reference Outfit.
- `font-mono` does not mean Geist Mono. It means Reference Core Mono.
- `font-display` does not mean Instrument Serif. It means Reference Bluu Next.
- `font-grotesk` is an alternate name for Reference Outfit and currently has
  no application-code consumers.

## Active web fonts

## 1. Reference Outfit

### Source and declaration

Declared in `app/globals.css:3-9`:

```css
font-family: "Reference Outfit";
font-style: normal;
font-weight: 100 900;
font-display: swap;
```

Current third-party runtime URL:

```text
https://aayushbharti.in/_next/static/immutable/media/1b99372b3eaef0c8-s.p.1ay-qk1u8nydy.woff2
```

The URL returned HTTP 200 on 2026-09-03 with `font/woff2`, wildcard CORS,
one-year immutable caching, and a 32,228-byte response. Availability today does
not make it an application-owned or guaranteed URL.

### Where it is used

This is the default inherited font for the entire site because:

- `font-sans` maps to Reference Outfit in `tailwind.config.ts:14`.
- `body` applies `font-sans` in `app/layout.tsx:130`.

It therefore renders ordinary text that does not explicitly select another
family, including:

- Navbar and modal UI text.
- Footer links and biography text.
- General body copy and buttons.
- Forms, cards, admin interfaces, and error-page descriptions.
- Blog article prose and article headings.
- Resume content outside explicitly selected serif/mono elements.

Two explicit `font-sans` labels also occur in `app/components/Navbar.tsx`.

### Requested weights and styles

The declared variable range should support normal weights 100 through 900.
Actual application requests primarily use:

| Tailwind class | Numeric weight | Typical role |
|---|---:|---|
| inherited / `font-normal` | 400 | Body copy and descriptions |
| `font-medium` | 500 | Buttons, navigation, card titles, emphasis |
| `font-semibold` | 600 | Strong UI labels and subheadings |
| `font-bold` | 700 | Strong labels and article h2 text |
| `font-light` | 300 | Limited `/test` display copy |
| `font-extrabold` | 800 | Limited `/test` display copy |

Only a normal face is declared. Any inherited italic Outfit text is synthetic
browser slanting. Examples include italic emphasis on error/404 content.

### Current size range

- Most body and UI text: 14px to 16px.
- Small labels and resume/UI copy: approximately 9px to 15px.
- Navbar labels: up to 18px/700.
- Blog article paragraphs and lists: 16px with 1.75 line height.
- Blog article h2: 24px/700.
- Blog article h3: 20px/600.
- Blog article h4: 16px/600.

Article values are defined at `app/globals.css:1132-1169` and
`app/globals.css:1303-1314`.

### Fallback behavior

```text
Reference Outfit -> system-ui -> generic sans-serif
```

If the remote file fails, the exact fallback varies by operating system and
browser. Metrics, line wrapping, button widths, and page height can change.

## 2. Reference Core Mono

### Source and declaration

Declared in `app/globals.css:11-17`:

```css
font-family: "Reference Core Mono";
font-style: normal;
font-weight: 400;
font-display: swap;
```

Current third-party runtime URL:

```text
https://aayushbharti.in/_next/static/immutable/media/CoreMono_Beta01Regular-s.p.1d0e8tars77x7.woff2
```

The URL returned HTTP 200 on 2026-09-03 with `font/woff2`, wildcard CORS,
one-year immutable caching, and a 10,428-byte response.

### Where it is used

Tailwind `font-mono` selects this family. It is heavily used for:

- Page and section kickers.
- Uppercase eyebrow labels.
- Project filters, search fields, tags, metadata, and pagination.
- Project-detail section indexes and technology tags.
- Home-card metadata, chips, badges, and status labels.
- Footer metadata and utility text.
- Search and Reach Out modal shortcuts and values.
- Code-frame filenames and general utility labels.
- The skip-to-content link.

Representative locations:

- `app/components/home/SectionHeading.tsx`
- `app/components/home/CtaSection.tsx`
- `app/components/home/HomeBento.tsx`
- `app/components/home/MySiteGrid.tsx`
- `app/components/home/StatusRow.tsx`
- `app/projects/ProjectsIndex.tsx`
- `app/projects/[slug]/ProjectDetail.tsx`
- `app/components/navbar/SearchModal.tsx`
- `app/components/navbar/ReachOutModal.tsx`
- `app/components/Footer.tsx`
- `app/layout.tsx:141-145`

### Requested weights and styles

Only 400 normal is available, but the site requests:

- 400 for ordinary mono metadata.
- 500 for shared/page kickers.
- 700 for section numbers, tags, and some SVG/domain labels.

The 500 and 700 appearances are browser-synthesized from the 400 file. This is
one of the most important consistency issues in the current font setup.

No italic face is declared. Any future italic use would also be synthetic.

### Current size range

- Overall explicit range: approximately 7px to 16px.
- Dominant UI scale: 9px, 10px, 11px, and 12px.
- Common supporting sizes: 13px, 14px, and 16px.
- Shared kickers: 12px/500.
- Reach Out shortcut keys: 13px.
- Reach Out modal value text: up to 16px.
- Project detail's smallest decorative mono mark: 7px.

### Fallback behavior

```text
Reference Core Mono -> ui-monospace -> generic monospace
```

Fallback metrics differ substantially across macOS, Windows, and Linux.

## 3. Reference Bluu Next

### Source and declaration

Declared in `app/globals.css:19-25`:

```css
font-family: "Reference Bluu Next";
font-style: normal;
font-weight: 400 700;
font-display: swap;
```

Current third-party runtime URL:

```text
https://aayushbharti.in/_next/static/immutable/media/e41d5df559864f9e-s.p.2rlzm4mj5kw8e.woff2
```

The URL returned HTTP 200 on 2026-09-03 with `font/woff2`, wildcard CORS,
one-year immutable caching, and a 15,040-byte response.

### Where it is used

Tailwind `font-display` selects this family. It is used for:

- Homepage identity text and card titles.
- Case-study titles.
- Writings/blog-card titles and cover-overlay quotations.
- Testimonials and testimonial-modal quotations.
- Project index and project-detail headings.
- Blog post titles.
- Legal, Buildlog, Contact, Credentials, and Links card headings.
- Error and not-found display headings.
- Decorative education numerals.

Representative locations:

- `app/components/home/HomeHero.tsx`
- `app/components/home/CaseStudies.tsx`
- `app/components/home/Writings.tsx`
- `app/components/home/Testimonials.tsx`
- `app/components/home/TestimonialSubmitModal.tsx`
- `app/components/home/MySiteGrid.tsx`
- `app/projects/page.tsx`
- `app/projects/[slug]/ProjectDetail.tsx`
- `app/blog/[slug]/page.tsx`
- `app/components/BlogCard.tsx`
- `app/legal/privacy/page.tsx`
- `app/legal/terms/page.tsx`
- `app/buildlog/page.tsx`
- `app/contact/page.tsx`
- `app/credentials/page.tsx`
- `app/not-found.tsx`
- `app/error.tsx`

### Requested weights and styles

- Normal 400, 500, and 700 are requested.
- The declared 400-700 variable range should support those normal weights if
  the remote binary contains the advertised variable weight axis.
- Italic `font-display` is used extensively, but no italic face is declared.
  Those appearances are synthetic obliques.

Synthetic italic examples include:

- Project heading accent words.
- Blog-card cover titles.
- Writings cover titles.
- Testimonial quotations.
- Testimonial submission modal quotations.

### Current size range

- Small identity text: approximately 16px.
- Card/editorial titles: approximately 18px to 36px.
- Testimonial quotations: approximately 20px to 24px.
- Project/blog headings: approximately 24px to 56px.
- Homepage identity display: up to 72px.
- Decorative education numerals: 60px.
- Not-found display: up to Tailwind `text-9xl`/128px.

### Fallback behavior

```text
Reference Bluu Next -> Georgia -> generic serif
```

Georgia is not metrically equivalent and will materially alter wrapping and
the visual tone if the remote font fails.

## 4. Instrument Serif

### Source and loading

Configured through `next/font/google` at `app/layout.tsx:12-18`:

```text
Weight: 400
Styles: normal and italic
Subset: latin
Display: swap
Variable: --font-instrument-serif
```

Next.js normally downloads these files at build time and emits hashed,
application-hosted assets. Browsers should request them from this application's
`/_next/static/media/` output rather than directly from Google.

### Where it is used

Instrument Serif is selected only by explicit arbitrary family classes such as:

```text
[font-family:var(--font-instrument-serif),serif]
```

It is used for:

- Shared Home and About section headings through
  `app/components/home/SectionHeading.tsx`.
- Homepage CTA heading in `app/components/home/CtaSection.tsx`.
- Large page-title spans on Blog, Buildlog, Resume, Links, Contact,
  Credentials, Community Wall, Privacy, Terms, and Test Page.
- Guestbook action-card quotations.

### Requested weights, styles, and sizes

- Real files requested from Google: 400 normal and 400 italic.
- Shared headings request 500, so their weight is synthesized from 400.
- Italic accent words use a real italic design, but their requested 500 weight
  is still synthesized.
- Standard section headings: 46px mobile, 56px from `md`.
- CTA heading: 40px mobile, 48px at `sm`, 56px at `md`, 60px at `lg`.
- Standalone page titles: generally 46px mobile and 60px at larger widths.
- Guestbook quotations: 24px italic.
- The `/test` route exercises a much wider display-size range up to 96px.

### Fallback behavior

Most uses specify only generic `serif`; the Blog page additionally uses
Georgia:

```text
Instrument Serif -> serif
Instrument Serif -> Georgia -> serif (Blog page variant)
```

## 5. Source Serif 4

### Source and loading

Configured through `next/font/google` at `app/layout.tsx:20-26`:

```text
Weight: 600
Style: normal
Subset: latin
Display: swap
Variable: --font-source-serif
```

### Where it is used

- Experience organization names and job titles in
  `app/components/Resume.tsx`.
- Education qualification/program names in `app/about/page.tsx`.

### Requested weights, styles, and sizes

- 22px/600 normal in all identified uses.
- The requested face exactly matches the loaded face, so no synthesis is
  expected.

### Fallback behavior

```text
Source Serif 4 -> Georgia -> generic serif
```

## 6. JetBrains Mono

### Source and loading

Configured through `next/font/google` at `app/layout.tsx:28-35`:

```text
Weight: 700
Style: normal
Subset: latin
Display: swap
Variable: --font-jetbrains-mono
```

### Where it is used

The only identified use is the animated decode/scramble domain headline in
`app/components/home/HomeHero.tsx:250-273`.

### Requested weights, styles, and sizes

- 700 normal, matching the loaded face.
- Uppercase.
- 35.6px by default.
- 50px from `sm`.
- 42px from `md`.
- 59.6px from `lg`.

### Fallback behavior

```text
JetBrains Mono -> generic monospace
```

An older note in `LOCKED_PERFECT.md` says Space Grotesk powers this headline.
That note is stale; the current implementation explicitly uses JetBrains Mono.

## 7. Geist Mono

### Source and loading

- Imported from `geist/font/mono` in `app/layout.tsx:7`.
- Supplied by the `geist` npm package in `package.json`.
- Exposed through `--font-geist-mono` on `<html>`.
- Bundled/self-hosted by the application build rather than loaded from Google
  at browser runtime.

### Where it is used

Direct CSS references exist at:

- `app/globals.css:252-259`: `.kicker`, 12px/500. No current `.kicker`
  consumer was found, so this rule is presently dormant.
- `app/globals.css:968-977`: inline blog article code, `0.875em`/400.
- `app/globals.css:1104-1113`: blog table-header badges, 11px/400.

This is separate from `font-mono`, which selects Reference Core Mono.

### Fallback behavior

```text
Geist Mono -> generic monospace
```

## Loaded but unused fonts

## 8. Geist Sans

- Imported from `geist/font/sans` in `app/layout.tsx:8`.
- Its variable is attached to `<html>`.
- No `var(--font-geist-sans)` or equivalent authored family use was found.
- Tailwind `font-sans` selects Reference Outfit instead.
- Result: loaded/registered but not used by the current authored typography.

## 9. Space Grotesk

- Imported through `next/font/google` in `app/layout.tsx:9`.
- Configured at `app/layout.tsx:37-41` with the Latin subset and
  `--font-space-grotesk` variable.
- Space Grotesk's variable range is normally 300-700, but the source does not
  explicitly select a weight because `next/font` handles the variable face.
- No authored family rule consumes `--font-space-grotesk`.
- `font-grotesk` does not select Space Grotesk; it selects Reference Outfit.
- Result: loaded/registered but unused.

## Other active or declared font stacks

## Sandpack code playground

`app/components/CodePlayground.tsx` configures system stacks rather than loading
additional web fonts:

```text
UI: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
Code: "Fira Code", "Fira Mono", monospace
```

- Editor size: 15px.
- Line height: 1.75.
- Comments request italic.
- Fira Code and Fira Mono are not present in dependencies, local assets,
  `next/font`, or `@font-face` declarations. Unless Sandpack supplies them or
  the visitor has them installed, this stack falls through to generic
  monospace.

## Open Graph image route

`app/api/og/route.tsx` uses generic `sans-serif` inside `ImageResponse`.
It does not provide custom font binary data, so its exact rendering depends on
the image-rendering environment rather than the website's CSS fonts.

## Decorative sticker SVG typography

The active sticker artwork is stored as SVG strings in
`app/components/sticker-art.ts` and injected by
`app/components/ScrapbookBento.tsx`.

It uses these system stacks:

| Stack | Sizes/weights/styles | Purpose |
|---|---|---|
| Georgia, Times New Roman, serif | 58px/500 italic; 27px/500 italic | Monogram and nametag handle |
| Arial, Helvetica, sans-serif | 16px/800; 9.5px/700; 22px/800 | Nametag and Ship It labels |
| ui-monospace, SFMono-Regular, Menlo, monospace | 9px, 10px, 10.5px, 13px; one 13px italic line | Terminal and sticker metadata |

Equivalent declarations exist in `public/sticker_*.svg`, but no application
reference to those standalone copies was found. The TypeScript SVG strings are
the active copies.

## Content that mentions fonts but does not style the site

- Font-family declarations inside MDX code examples are displayed article
  content, not active global CSS.
- Files under `guide/` are reference/starter material and are not part of the
  active Tailwind content configuration.
- `guide/core.tsx` assumes variables such as `--font-serif` and
  `--font-display` that are not the application's actual variable names.
- Bricolage Grotesque is mentioned in guide material but is not loaded or used
  by the active application.

## Synthetic face audit

Synthetic faces are generated by the browser when a requested weight or style
has no matching font file. Results can differ between browsers and operating
systems.

| Font | Missing face | Current affected use |
|---|---|---|
| Reference Outfit | Italic | Any inherited sans italic text |
| Reference Core Mono | 500 and 700 | Kickers, section numbers, bold mono labels |
| Reference Core Mono | Italic | Any future mono italic use |
| Reference Bluu Next | Italic/oblique | Project accents, blog overlays, testimonials |
| Instrument Serif | 500 normal | Shared section and page headings |
| Instrument Serif | 500 italic | Italic accent words inside 500 headings |

Source Serif 4 at 600 normal and JetBrains Mono at 700 normal currently match
their loaded files exactly.

## External-font risk assessment

The browser directly depends on these three files owned by another website:

1. Reference Outfit WOFF2.
2. Reference Core Mono Regular WOFF2.
3. Reference Bluu Next WOFF2.

Current technical status:

- All three URLs returned HTTP 200 during this audit.
- All three currently return `Access-Control-Allow-Origin: *`.
- All three currently advertise immutable one-year caching.
- None of the binaries is checked into this repository.
- The remote owner can still remove, rename, replace, restrict, or block them.
- Repository comments calling the files immutable describe remote cache policy,
  not ownership or permanent availability.

Legal/licensing status cannot be determined from a binary URL. Do not copy a
font from the reference site into this repository unless its license permits
redistribution and project use. Obtain files from the font's official source
or from a valid license, not merely by saving the reference site's response.

## Recommended files to obtain

Before changing implementation, place lawfully licensed source files in a
temporary review location or provide their official download/license links.
Do not overwrite the current setup until the files have been compared visually.

### Highest priority

1. Outfit or the exact legally licensed equivalent:
   - Variable normal WOFF2 covering 100-900.
   - Variable italic WOFF2 covering 100-900 if italic Outfit should remain.
2. Core Mono or the exact legally licensed equivalent:
   - Regular 400 WOFF2.
   - Medium 500 WOFF2.
   - Bold 700 WOFF2.
   - If only Regular legally exists, decide whether to keep synthesis or stop
     requesting unavailable weights.
3. Bluu Next or the exact legally licensed equivalent:
   - Normal variable WOFF2 covering at least 400-700, or static 400/500/700.
   - Real italic/oblique files covering the used 400/500 range.

### Optional cleanup inputs

4. Fira Code variable WOFF2 if the Sandpack editor must consistently use it.
5. Any custom font intended for Open Graph images, supplied in a format that
   can be passed as font data to `ImageResponse`.

The Google/Geist families do not need manual downloads unless the project wants
all font sources managed uniformly. Next Font and the Geist package already
produce same-origin application assets.

## Recommended repository destination

Preferred future location for approved local files:

```text
app/fonts/
```

Suggested organization:

```text
app/fonts/
  outfit/
  core-mono/
  bluu-next/
  licenses/
```

Keep each font's license or attribution text under `app/fonts/licenses/`.
Use clear filenames that include family, style, and weight, for example:

```text
Outfit-Variable-Normal.woff2
Outfit-Variable-Italic.woff2
CoreMono-Regular.woff2
CoreMono-Medium.woff2
CoreMono-Bold.woff2
BluuNext-Variable-Normal.woff2
BluuNext-Variable-Italic.woff2
```

These names are recommendations, not claims about which official files exist.

## Recommended implementation after files are supplied

Use `next/font/local` from `app/layout.tsx` rather than public runtime URLs.
Preserve the current CSS variables or Tailwind aliases during the first pass so
the migration does not unintentionally restyle locked pages.

Migration order:

1. Verify the license, internal family name, supported weights, styles, Unicode
   coverage, and variable axes of each supplied file.
2. Add local files and license records under `app/fonts/`.
3. Configure them with `next/font/local` and `display: "swap"`.
4. Preserve current family roles and fallback stacks.
5. Remove only the three external `@font-face` URLs after local files load.
6. Resolve synthetic Core Mono weights and Bluu/Outfit italics using real faces
   where available.
7. Remove unused Geist Sans and Space Grotesk loading only after confirming no
   runtime-generated content depends on them.
8. Decide whether the dormant `.kicker` rule should use Geist Mono or the site's
   primary `font-mono` family.
9. Decide whether Sandpack should receive a real Fira Code source or use the
   established site mono stack.
10. Update stale typography documentation after implementation is approved.

## Required visual regression checks

Font replacement changes layout even when the family appears similar. Verify:

- Home hero line breaks and animated headline width stability.
- All shared section-heading wraps.
- Case-study title wraps and sticky project title dimensions.
- About Experience timeline title wrapping and alignment.
- Navbar width, modal scaling, and Search/Reach Out labels.
- Footer wrapping and target dimensions.
- Project filters, pagination, tags, and result grids.
- Blog-card overlays, article headings, inline code, and tables.
- Testimonials and every synthetic-italic replacement.
- Light and dark themes.
- Viewports: 1440x900, 1024x768, 768x1024, 390x844, 375x667, and 360x640.
- Browser console and font network requests.
- No remaining browser requests to `aayushbharti.in` after migration.

Because the core surfaces are locked, replacing their fonts requires explicit
owner unlock permission even if the intended result is visual parity.

## Documentation drift found by this audit

Several older documents describe a previous font system. Current source code,
not those historical statements, determines actual rendering.

- Some documents say the body uses Geist Sans. It currently uses Reference
  Outfit.
- Some documents say `font-mono` means Geist Mono. It currently means Reference
  Core Mono.
- Some documents say `font-display` means Instrument Serif. It currently means
  Reference Bluu Next.
- An older lock note says the hero headline uses Space Grotesk. It currently
  uses JetBrains Mono.
- Guide material mentions Bricolage Grotesque. It is not loaded or used.

Known stale references include `AI_GUIDE.md`, `PROJECT_PHASES.md`,
`PARITY_AUDIT.md`, `docs/09_DESIGN_SYSTEM.md`, selected files under
`docs/blueprints/`, `audit/01-global.md`, `guide/DESIGN_SPEC.md`, and historical
entries in `LOCKED_PERFECT.md`.

Historical lock entries should not be rewritten casually. A future approved
font migration should add a superseding dated note and update non-historical
design documentation.

## Handoff checklist for supplied font files

For every font file or official link supplied later, record:

- Official family name.
- Official source URL or vendor.
- License name and redistribution permission.
- File format.
- Static or variable status.
- Supported weight range.
- Supported styles.
- Supported character subsets/languages.
- Whether it is intended to replace an existing family exactly.
- Any visual differences the owner accepts.

Do not commit unverified font binaries or files without a known license.
