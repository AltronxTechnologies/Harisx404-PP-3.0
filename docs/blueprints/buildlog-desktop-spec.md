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
5. Project regions separated by slightly stronger neutral hairlines.
6. Shared locked CTA 112px below the collection, followed by the shared Footer.

## Project Region

- Below `lg`: one-column project header followed by release rows.
- `lg`: 4/8-column split with a sticky project header.
- `xl`: 3/9-column split.
- Project header uses a 48px number/lifecycle bar followed by a 30px Instrument
  Serif project name, 24px serif tagline, and 14/24px summary.
- At `lg+`, the left number/lifecycle bar and right shipped-control bar use the
  same height, padding, and bottom divider, forming one aligned ledger row.
- Project-to-project boundaries use a slightly stronger neutral hairline
  (`neutral-400/60` light and `white/20` dark) while internal rows retain the
  quieter shared border token.
- An admin-managed lifecycle label appears beside the index: In progress, Live,
  or Completed. Draft/Published/Archived remains a separate visibility setting.
- Release rows use a crisp 20px rounded-square status mark, 16/22px title,
  13px/1.6 description, and 10px uppercase badge.
- Each row exposes `Shipped` or `Planned` text to assistive technology.
- Hover is a neutral 2.5% surface step with motion-reduced transition support.
- Planned items remain visible. Shipped history is collapsed by default, and
  only one project history can be expanded at a time.
- The same disclosure remains above the shipped region when closed and open, so
  the close action never moves below a long expanded list.
- Shipped controls and content precede Planned Next. The version pill lives in
  the shipped-control row, or in Planned Next when a project has no shipped items.
- All shipped rows remain collapsed until the top shipped-control row is opened.
- Optional GitHub and Live project actions appear below version metadata only
  when validated HTTPS links exist.
- Project actions use a bounded two-column grid: two links split equally, one
  link spans both columns, and no grid renders when neither link exists.
- Project-action labels remain on one line at every breakpoint, with compact
  responsive type, padding, and icon gaps inside the equal-width grid.

## Responsive Rules

- Global rails remain the only rails; Buildlog does not draw a duplicate frame.
- At less than 430px, release badges move below the copy so they cannot collide
  with long titles or overflow.
- At 430px and above, copy and badge share one horizontal row.
- Page and row containers use `min-w-0`; no horizontal overflow is accepted.
- Expansion state is reflected in the URL and restored by browser Back/Forward
  navigation.

## Data and States

- Public source: published rows from `public_buildlog_projects`.
- Environment-safe fallback: `app/data/buildlog.ts` only when the database/view
  is unavailable.
- Loading skeleton mirrors hero, toolbar, project headers, and release rows.
- Empty collection and route error have explicit accessible recovery states.
- Admin management uses `/admin/buildlog` and `/api/admin/buildlog`.
- Admin links are independent and optional: both, one, or neither may be shown.
- Project lifecycle is independently managed as In progress, Live, or Completed.
  Completed is accepted only when every release item is shipped.
