# Secondary-Control Border Consistency Audit

- Audit date: 2026-09-04
- Status: Implemented, verified, and owner-approved in the 2026-09-04 final re-lock
- Scope: Public neutral bordered secondary controls and fields already using a
  visible border

## Rule

Neutral secondary controls use the same subtle border for hover and
pointer-active states:

- Light: `border-neutral-400/70`.
- Dark: `border-white/25`.
- Existing stronger focus rings or borders remain unchanged.
- Selected, primary, inverted, and disabled states remain distinct.

The pass does not add borders to intentionally borderless fields or surfaces.
It also excludes card frames, modal chrome, layout, typography, spacing,
radii, dimensions, shadows, and motion.

## Changed surfaces

- Projects search, filters, rescue actions, Clear filters, and pagination.
- Search modal empty-state actions; its intentionally borderless search shell
  remains on the approved locked treatment.
- Home social pills, New Launch controls, section CTA arrow affordances,
  testimonial controls and form fields, and CTA email control.
- Contact copy-email control.
- Blog Search and RSS controls.
- Community Wall buttons and textarea.
- Newsletter, chatbot, AI search, and mobile tabs fields.
- Resume secondary actions and highlight toggle.
- Credentials and Links secondary actions.
- Article reactions, project-detail Up Next affordance, and error/not-found
  secondary actions.

## State safeguards

- Article reactions preserve the stronger selected border inherited from their
  selected text state; only inactive reactions receive neutral hover/active
  borders.
- Projects filters and pagination preserve selected inverted states.
- Search modal shell remains borderless, with its approved focus treatment.
- Contact textarea and inactive Blog category labels remain intentionally
  borderless; no box-model border was introduced.
- Community Wall buttons now have a visible 2px `white/70` keyboard-focus
  outline in addition to the shared hover/active border treatment.
- Mobile tabs retain their indigo focus treatment with an explicit 2px ring.

## Measured verification

The live preview was checked across 96 combinations: eight representative
routes, six required viewports, and both themes.

Routes: `/`, `/projects`, `/blog`, `/contact`, `/community-wall`, `/resume`,
`/links`, and `/credentials`.

Viewports: 1440x900, 1024x768, 768x1024, 390x844, 375x667, and 360x640.

- Document horizontal overflow introduced by this pass: 0px in every case.
- No new control clipping, wrapping, or geometry changes were found.
- Projects dark hover computed to `rgba(255,255,255,0.25)` while retaining its
  exact 49x32px measured size at 360px.
- Community Wall keyboard focus computed to a 2px
  `rgba(255,255,255,0.7)` outline with a 2px offset.
- Representative light hover computed to `rgba(163,163,163,0.7)`.
- Public routes returned their expected HTTP status, including a verified 404
  for the not-found route.
- Browser console had no application errors. Existing sandbox WebGL warnings
  on Home and the existing multiple-GoTrueClient warning on Community Wall are
  unrelated to this pass.

## Static verification

- `npx tsc --noEmit` inside the running web container: passed.
- Targeted ESLint for all 24 implementation files: passed.
- `git diff --check`: passed.
- Final code audit: no remaining in-scope mismatch, selected-state regression,
  focus regression, borderless-surface drift, or geometry-affecting addition.

## Pre-existing observations

The matrix also surfaced unrelated, pre-existing layout/accessibility items:
clipped edge items in Home's social strip at some widths, sub-24px text links
on Contact and Resume, and expected Contact tab wrapping on phones. These were
not caused by this border-only pass and were not changed because the affected
layouts are outside its authorized scope.
