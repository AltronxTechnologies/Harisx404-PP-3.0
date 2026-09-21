# Buildlog Page - Mobile Specification

Companion: `buildlog-desktop-spec.md`.

## Mobile Geometry

- Verified widths: 320, 360, 375, and 390px.
- Shared mobile Navbar and global rails remain unchanged.
- The exact Admin-managed hero renders before the collection loading boundary;
  no fallback copy is used to guess mobile heading or description wrapping.
- Hero uses the locked 46px Instrument Serif page-heading scale and wraps to two
  balanced lines where necessary.
- Archive metrics remain right-aligned opposite the archive label.
- The Release archive uses no outer rules; compact shipped/planned metrics stay
  right-aligned opposite the label, followed directly by the first project boundary.
- No project filter rail is rendered; lifecycle is communicated directly beside
  each project title block.
- The number/lifecycle row and shipped-control row share the same 48px height and
  full-width bottom divider.
- Project headers use 16px padding; fixed-height release rows use 16px horizontal
  padding with vertically centered content.
- Crisp shipped/planned status marks and copy stay aligned at the top of each row.
- Badges remain to the right of release copy at every width, matching tablet and
  desktop alignment.
- Optional GitHub/live actions wrap below project metadata without overflow.
- Two actions remain equal-width; one action fills the bounded row; no empty
  placeholder is reserved when links are unavailable.
- GitHub and Live project labels remain single-line down to 320px.
- Planned rows remain visible; shipped rows use one full-width disclosure.
- Shipped updates appear before Planned Next, with the version pill in the top
  release-control row.
- Both shipped and planned lists show three complete 112px rows before scrolling;
  descriptions are clamped to two lines for stable geometry.
- Release-list scrolling chains naturally back to page scrolling at either edge.
- The same disclosure stays above expanded shipped rows in both states.
- Project sections remain one column; sticky behavior starts only at `lg`.

## Verified Behavior

- Zero document overflow at 320, 360, 375, and 390px in light and dark themes.
- Zero badge overflow, duplicate SVG IDs, broken images, or Buildlog console
  errors.
- Every release item exposes a textual Shipped/Planned state.
- Heading order is one H1, collection H2, project H3 headings, then shared CTA H2.
- Disclosure, lifecycle labels, URL state, and browser Back behavior pass at every
  verified phone width.
- The shared CTA section ends directly at the Footer boundary with no
  Buildlog-owned margin or padding after it.
