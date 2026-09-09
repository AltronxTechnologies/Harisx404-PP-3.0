# Project State

## Current Phase

Phase 2 - Data acquisition tooling.

## Current Status

`BLOCKED`

## Completed

- Assignment requirements preserved verbatim.
- Initial feasibility and architecture planning research completed; report
  claims still require source evidence in the ledger.
- Assignment MVP and portfolio roadmap separated.
- Initial class ontology, experiment design, evaluation protocol, and risk
  boundaries specified.
- Source-only planning audit completed on 2026-09-09; contradictions found by the
  audit were corrected without beginning implementation.
- Owner supplied the intrusion-first platform direction, camera/role/dashboard,
  evidence, Copilot, security, reliability, and delivery requirements; these are
  normalized in `PRODUCT_REQUIREMENTS.md`.
- Phase 0 defaults and gate decisions recorded in `PHASE_00_APPROVAL.md` on
  2026-09-09 after the owner delegated technical decisions.
- Phase 1 engineering foundation implemented and evaluated in Docker. Lint,
  formatting, strict typing, 7 tests, 94.82% branch coverage, configuration
  smoke, and non-root container smoke passed; see `PHASE_01_REPORT.md`.
- Phase 2 provenance, hashing, grouped-split, leakage, coverage, and manifest
  tooling implemented and evaluated after independent review; 22 tests and
  93.78% branch coverage passed. See `PHASE_02_TOOLING_REPORT.md`.

## Not Started

- Dataset approval and collection
- Roboflow project
- Annotation
- Dataset versions
- Training
- Evaluation
- Inference implementation
- Tracking/event implementation
- API/dashboard implementation
- Deployment
- Presentation and viva artifacts

## Phase 2 Work

- Admit a complete licensed source set after file-level license/privacy review.
- Obtain Roboflow workspace/export access for the required annotation phase.

## Next Gate

Acquisition remains `BLOCKED` until real media passes the evaluated audit tool.
Phase 3 cannot begin without admitted media and Roboflow access.
