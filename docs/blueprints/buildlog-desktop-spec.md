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
5. URL-backed All/In progress/Completed filter rail.
6. Compact editorial project directory with number, lifecycle state, and update
   count; each cell anchors to its project ledger.
7. Project regions separated by solid `border-border-primary` rules.
8. Shared locked CTA 112px below the collection, followed by the shared Footer.

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
- Planned items remain visible. Shipped history is collapsed by default, and
  only one project history can be expanded at a time.
- Projects without planned work preview their latest two shipped items.
- Optional GitHub and Live project actions appear below version metadata only
  when validated HTTPS links exist.
- In the All view, active projects precede completed projects while preserving
  administrator order within each group.

## Responsive Rules

- Global rails remain the only rails; Buildlog does not draw a duplicate frame.
- At less than 430px, release badges move below the copy so they cannot collide
  with long titles or overflow.
- At 430px and above, copy and badge share one horizontal row.
- Page and row containers use `min-w-0`; no horizontal overflow is accepted.
- Filter and expansion state is reflected in the URL and restored by browser
  Back/Forward navigation.

## Data and States

- Public source: published rows from `public_buildlog_projects`.
- Environment-safe fallback: `app/data/buildlog.ts` only when the database/view
  is unavailable.
- Loading skeleton mirrors hero, toolbar, project headers, and release rows.
- Empty collection and route error have explicit accessible recovery states.
- Admin management uses `/admin/buildlog` and `/api/admin/buildlog`.
- Admin links are independent and optional: both, one, or neither may be shown.
