# Community Wall - Mobile Specification

Companion: `community-wall-desktop-spec.md`.

## Mobile Geometry

- Required widths: 320, 360, 375, and 390px in light and dark themes.
- Shared mobile Navbar and global rails remain unchanged.
- Hero uses the locked 46px Instrument Serif page-heading scale with balanced
  wrapping and 16px supporting-copy gap.
- Collection toolbar stays one row and exposes the approved total without
  wrapping.
- Cards form a single aligned column with 16px gap, 266px minimum usable width at
  320px, and equal 286px minimum height.
- Card message/footer geometry and action positions remain stable across states.
- Author uses 14px/500 copy and timestamp uses 12px mono on phones; both return to
  compact desktop scales at `sm`.
- No card rotation, horizontal clipping, badge overflow, or duplicated local rails.
- Shared CTA begins 112px after the collection and ends directly at Footer.

## Interaction

- OAuth and submit controls remain at least 40px high.
- Textarea does not resize and reports the 200-character limit.
- Focus treatment is visible in both themes.
- Hash links scroll notes below the fixed Navbar and announce copy success.
- Pagination actions remain 40px and preserve canonical `/community-wall` for page
  one.
