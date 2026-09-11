# Buildlog Page - Mobile Specification

Companion: `buildlog-desktop-spec.md`.

## Mobile Geometry

- Verified widths: 320, 360, 375, and 390px.
- Shared mobile Navbar and global rails remain unchanged.
- Hero uses the locked 46px Instrument Serif page-heading scale and wraps to two
  balanced lines where necessary.
- Toolbar stacks its count below the collection description.
- Filters use the established horizontally scrollable pill rail; a partial next
  option communicates horizontal continuation on narrow phones.
- Project headers use 16px padding; release rows use 16px horizontal and 20px
  vertical padding.
- Crisp shipped/planned status marks and copy stay aligned at the top of each row.
- Badges stack below release copy under 430px and retain content width.
- Optional GitHub/live actions wrap below project metadata without overflow.
- Two actions remain equal-width; one action fills the bounded row; no empty
  placeholder is reserved when links are unavailable.
- Planned rows remain visible; shipped rows use one full-width disclosure.
- The same disclosure stays above expanded shipped rows in both states.
- Project sections remain one column; sticky behavior starts only at `lg`.

## Verified Behavior

- Zero document overflow at 320, 360, 375, and 390px in light and dark themes.
- Zero badge overflow, duplicate SVG IDs, broken images, or Buildlog console
  errors.
- Every release item exposes a textual Shipped/Planned state.
- Heading order is one H1, collection H2, project H3 headings, then shared CTA H2.
- Disclosure, filtering, URL state, and browser Back behavior pass at every
  verified phone width.
