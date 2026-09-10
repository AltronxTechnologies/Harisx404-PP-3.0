# Buildlog Page - Mobile Specification

Companion: `buildlog-desktop-spec.md`.

## Mobile Geometry

- Verified widths: 320, 360, 375, and 390px.
- Shared mobile Navbar and global rails remain unchanged.
- Hero uses the locked 46px Instrument Serif page-heading scale and wraps to two
  balanced lines where necessary.
- Toolbar stacks its count below the collection description.
- Project headers use 16px padding; release rows use 16px horizontal and 20px
  vertical padding.
- Status glyph and copy stay aligned at the top of each row.
- Badges stack below release copy under 430px and retain content width.
- Project sections remain one column; sticky behavior starts only at `lg`.

## Verified Behavior

- Zero document overflow at 320, 360, 375, and 390px in light and dark themes.
- Zero badge overflow, duplicate SVG IDs, broken images, or Buildlog console
  errors.
- Every release item exposes a textual Shipped/Planned state.
- Heading order is one H1, collection H2, project H3 headings, then shared CTA H2.
