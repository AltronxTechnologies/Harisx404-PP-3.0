# Buildlog Page - Desktop Specification

Route: `/buildlog`

Status: implemented and verified; owner lock pending.

## Structure

1. Shared locked Navbar and global rails.
2. `mt-14` page start with `GridWrapper` and `PaperHeroTexture`.
3. Centered hero: 12px/500 mono kicker, 16px gap, 46px mobile/56px desktop
   Instrument Serif heading, 16px supporting-copy gap.
4. Release toolbar 56px below the hero, with collection description and
   shipped/planned totals.
5. Project regions separated by solid `border-border-primary` rules.
6. Shared locked CTA 112px below the collection, followed by the shared Footer.

## Project Region

- Below `lg`: one-column project header followed by release rows.
- `lg`: 4/8-column split with a sticky project header.
- `xl`: 3/9-column split.
- Project header uses a 12px mono index, 30px Instrument Serif project name,
  24px serif tagline, 14/24px summary, version pill, and shipped count.
- Release rows use a unique hand-drawn status glyph, 16/22px title, 13px/1.6
  description, and 10px uppercase badge.
- Each row exposes `Shipped` or `Planned` text to assistive technology.
- Hover is a neutral 2.5% surface step with motion-reduced transition support.

## Responsive Rules

- Global rails remain the only rails; Buildlog does not draw a duplicate frame.
- At less than 430px, release badges move below the copy so they cannot collide
  with long titles or overflow.
- At 430px and above, copy and badge share one horizontal row.
- Page and row containers use `min-w-0`; no horizontal overflow is accepted.

## Data and States

- Public source: published rows from `public_buildlog_projects`.
- Environment-safe fallback: `app/data/buildlog.ts` only when the database/view
  is unavailable.
- Loading skeleton mirrors hero, toolbar, project headers, and release rows.
- Empty collection and route error have explicit accessible recovery states.
- Admin management uses `/admin/buildlog` and `/api/admin/buildlog`.
