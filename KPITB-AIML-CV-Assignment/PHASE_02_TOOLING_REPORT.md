# Phase 2 Data Tooling Report

Date: 2026-09-09

Tooling status: `EVALUATED`

Acquisition status: `BLOCKED`

## Implemented

- Strict provenance records with source/session/viewpoint identity, license and
  privacy fields, extraction cadence, event-source isolation, split, class
  counts, and hard-negative status.
- Root-confined local media resolution, SHA-256, and perceptual hashing.
- Deterministic source-group splitting with an exclusively held-out viewpoint.
- Global source-ID, exact duplicate, near-duplicate, session, and source-group
  leakage detection.
- Release eligibility checks for assignment, hashes, redistribution, privacy,
  license evidence, and detector/event-source separation.
- Coverage gates for 12/3/3 groups, class targets, viewpoints, hard negatives,
  and familiar/unseen test-class presence.
- Canonical manifest hashing and a command-line audit that requires the actual
  media root and recomputes declared hashes.
- Full configuration validation/hashing, UTC/schema-version contracts, and
  non-degenerate/non-self-intersecting polygon validation strengthened during
  independent review.

## Verification

| Gate | Observed result |
|---|---|
| Ruff lint | Passed |
| Ruff format | Passed; 7 files checked |
| mypy strict | Passed; no issues in 7 source files |
| pytest | Passed; 22 tests |
| Branch coverage | 93.78%; required minimum 90% |
| Independent blocker review | Passed after three correction rounds |
| Dependency integrity | Exact versions and artifact hashes in `requirements.lock` |
| Base image integrity | Python image pinned by digest |
| Final development image | `sha256:2828899bf63e060234523a8027842f1efa53cad186c58b8838974beacb5eb624` |

## Acquisition Blocker

No real media has been admitted. Candidate research is in
`docs/SOURCE_RESEARCH.md`. A complete four-class source set, file-level privacy
review, and Roboflow export access are not available in the sandbox. Therefore
Phase 2 cannot be marked fully complete and Phase 3 must not start.
