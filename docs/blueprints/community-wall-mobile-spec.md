# Community Wall - Mobile Specification

Companion: `community-wall-desktop-spec.md`.

## Mobile Geometry

- Required widths: 320, 360, 375, and 390px in light and dark themes.
- Shared mobile Navbar and global rails remain unchanged.
- Hero uses the reference 48px Instrument Serif page-heading scale with balanced
  wrapping and 16px supporting-copy gap.
- Collection toolbar stays one row and exposes the approved total without
  wrapping.
- Cards form a single column with 24px gap and at least 266px usable width at 320px.
- Sticky notes retain subtle deterministic 1-2 degree tilts with enough inset to
  prevent document overflow.
- Author uses 12px/600 copy and timestamp uses 10px mono.
- Provider photos use 28px circles; missing or failed photos receive a stable
  emoji/color identity selected from 24 variants.
- The dark theme adds a thin scallop stroke for clear body/footer separation;
  light mode remains seam-free.
- Dialog uses `width: calc(100% - 32px)` with a 400px maximum and centered fixed
  positioning.
- No horizontal clipping, badge overflow, or duplicated local rails.
- Shared CTA begins 112px after the collection and ends directly at Footer.

## Interaction

- Dialog OAuth and submit controls are 48px; the card trigger is 36px.
- Textarea does not resize and reports the 200-character limit.
- Focus treatment is visible in both themes.
- Hash links scroll notes below the fixed Navbar and announce copy success.
- Pagination actions remain 40px and preserve canonical `/community-wall` for page
  one.
