# Phase 0 Decision Record

Date: 2026-09-09

Gate status: `APPROVED`

The owner delegated technical defaults to the implementation agent and requested
autonomous phase-by-phase delivery. `APPROVED`, `DEFERRED`, and `N/A` below are
gate dispositions, not implementation-status claims.

| Decision | Disposition | Selected approach and rationale |
|---|---|---|
| Assignment deadline | N/A | Instructor supplied no date. Prioritize an independently releasable assignment core before product phases. |
| Submission format | APPROVED | Standalone repository/archive, README, source, report, slides, metrics, cards, demo video, checksums, and viva material. |
| Team mode | APPROVED | Individual project unless the instructor later says otherwise. |
| Development hardware | APPROVED | Python 3.11, Node 22, Docker; CPU smoke validation. No local NVIDIA runtime was detected. |
| Training hardware | APPROVED | Google Colab-compatible GPU training with explicit hardware recorded per run; CPU fallback only for smoke tests. |
| YOLO implementation | APPROVED | Ultralytics 8.3.0 with `yolo11n.pt`, 640px baseline. Record package/checkpoint hashes before training. |
| Initial domain | APPROVED | Fixed-camera warehouse/industrial footage for training and evaluation. Broader controlled environments require later evidence. |
| Detector ontology | APPROVED | `person`, `forklift`, `hardhat`, `high_visibility_vest`; PPE labels mean visibly worn PPE. |
| Data source | APPROVED | Licensed, redistributable online media only. Do not collect workplace footage without later written authority and notice. |
| Roboflow privacy | APPROVED | Public project may contain only redistribution-approved, non-sensitive media. Private/identifiable media remains blocked. |
| Dataset target | APPROVED | 1,200 unique source frames, five viewpoints, 15-20% hard negatives, grouped source splits, one unseen test viewpoint. |
| Minimum class coverage | APPROVED | Target train/validation/test instances: person 600/100/100; forklift 300/50/50; worn hardhat 300/50/50; worn vest 300/50/50. Reduce only with documented evidence and limitation. |
| Source/slice coverage | APPROVED | At least 12/3/3 independent train/validation/test source groups and 50 examples per reported test slice where feasible. Event clips cannot supply training frames. |
| Assignment event scope | APPROVED | ByteTrack plus restricted-zone entry, directed line crossing, after-hours presence, and prolonged presence, each separately evaluated. Detector-only output remains the minimum fallback if deadline changes. |
| Product event scope | APPROVED | Add occupancy, moving-forklift co-occupancy, PPE visibility, evidence, alerts, dashboard, and Copilot after assignment freeze. |
| Detector selection | APPROVED | Primary validation metric mAP50-95; minimum 0.50 per-class validation recall guard. Select thresholds on validation only; locked test runs once. |
| Event evaluation | APPROVED | Separate development/validation and locked event-test manifests; one-to-one duration/point matching as specified in `docs/TRAINING_AND_EVALUATION.md`. |
| Non-goals | APPROVED | No identity, ReID, intent/criminal profiling, automated punishment/enforcement, or unsupported advanced behavior claims. |
| Human review | APPROVED | Significant events require Confirm/Dismiss/Defer review; risk is policy severity, not criminal probability. |
| Source isolation | APPROVED | Develop under this subtree with path-scoped checks; export to a standalone repository before release tagging. |
| Code license | APPROVED | AGPL-3.0-or-later for the open-source application, subject to final dependency inventory. |
| Data/model licensing | APPROVED | Record each source separately. Dataset redistribution follows source rights; model distribution requires Ultralytics and dataset-derived-rights review. |
| Authentication | APPROVED | Development local accounts with Argon2id, short-lived access tokens, rotating refresh sessions in secure cookies, account/failed-login controls; OIDC-ready boundary for deployment. |
| Copilot | APPROVED | Deterministic authorized search/query first. External LLM provider is deferred; the platform must remain useful without one. |

## Dataset Split Targets

- Assign groups before extraction: 70% train, 15% validation, 15% test by
  source group, adjusted to preserve the unseen-camera test requirement.
- Keep adjacent frames and derivatives with their source group.
- Freeze exact numeric detector and event matching thresholds in versioned
  configuration before locked-test execution.

## Approval Record

```text
Approved by: Project owner through delegated autonomous implementation request
Date: 2026-09-09
Changes requested: Build professionally, phase by phase, without owner-managed technical choices
Evidence: PRODUCT_REQUIREMENTS.md and conversation direction
```
