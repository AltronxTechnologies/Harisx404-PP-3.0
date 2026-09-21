# Buildlog Page - Desktop Specification

Route: `/buildlog`

Status: implemented and verified; owner lock pending.

## Structure

1. Shared locked Navbar and global rails.
2. `mt-14` page start with `GridWrapper` and `PaperHeroTexture`.
3. Centered hero: 12px/500 mono kicker, 16px gap, 46px mobile/56px desktop
   Instrument Serif heading, 16px supporting-copy gap.
4. Release toolbar 56px below the hero, with the archive label and
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
- Project-to-project boundaries use a 1.5px neutral rule (`neutral-400/60` light
  and `white/20` dark) extended through the section padding to the full content
  width, while internal rows retain the quieter 1px shared border token.
- The Release archive has no outer rules. Its label sits left while two compact
  metrics sit right with numbers and labels sharing one mono treatment, separated
  by a 16px vertical hairline; the
  first project boundary provides the lower separation.
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
- Shipped controls and content precede Planned Next. The disclosure includes
  `Shipped updates · NN` and the highest semantic shipped version; no separate
  Shipped heading row is rendered. When no shipped item exists, the project
  version appears in Planned Next.
- Semantic ordering supports major/minor/patch, prerelease identifiers, and
  build metadata; non-version badges fall back to the Admin Current Version.
- Shipped and planned lists show exactly three fixed-geometry rows before using
  contained keyboard-focusable vertical scrolling. Mobile rows are 112px and
  wider rows are 104px; titles and descriptions are each limited to two lines.
- Nested release scrolling uses normal scroll chaining: after reaching the top
  or bottom, continued wheel/touchpad input resumes overall page scrolling.
- All shipped rows remain collapsed until the top shipped-control row is opened.
- Optional GitHub and Live project actions appear below version metadata only
  when validated HTTPS links exist.
- Project actions use a bounded two-column grid: two links split equally, one
  link spans both columns, and no grid renders when neither link exists.
- Project-action labels remain on one line at every breakpoint, with compact
  responsive type, padding, and icon gaps inside the equal-width grid.

## Responsive Rules

- Global rails remain the only rails; Buildlog does not draw a duplicate frame.
- Release copy and badge share one horizontal row at every breakpoint; titles
  and descriptions clamp to preserve the badge column without overflow.
- Page and row containers use `min-w-0`; no horizontal overflow is accepted.
- Expansion state is reflected in the URL and restored by browser Back/Forward
  navigation.

## Data and States

- Public source: published rows from `public_buildlog_projects`.
- Hero kicker, heading, accent, supporting copy, and archive label come from the
  restricted `public_buildlog_settings` view and are editable in Admin.
- Environment-safe fallback: `app/data/buildlog.ts` only when the database/view
  is unavailable.
- The Admin-managed hero renders outside the page loading boundary, eliminating
  copy-dependent layout mismatch. The loading skeleton mirrors the toolbar,
  project headers, release rows, and shared CTA footprint.
- Empty collection and route error have explicit accessible recovery states.
- Admin management uses `/admin/buildlog` and `/api/admin/buildlog`.
- Page copy is managed at `/admin/buildlog/settings` through the secured settings
  API, including search and social metadata; aggregate shipped/planned totals
  remain derived from release items.
- All project editorial content, lifecycle, visibility, links, releases, and
  ordering are managed at `/admin/buildlog`; shared CTA/Footer copy remains owned
  by the locked site-wide components.
- Admin links are independent and optional: both, one, or neither may be shown.
- Project lifecycle is independently managed as In progress, Live, or Completed.
  Completed is accepted only when every release item is shipped.
