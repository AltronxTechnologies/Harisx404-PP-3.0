# Phased Implementation Plan

Each phase has an entry condition, outputs, verification, and exit gate. Do not
parallelize phases that depend on unverified artifacts.

## Phase Summary

| Phase | Name | Primary outcome |
|---:|---|---|
| 0 | Approval and governance | Frozen scope, classes, permissions, hardware |
| 1 | Engineering foundation | Isolated Python project, CI, contracts, tests |
| 2 | Data acquisition | Licensed/authorized source manifest |
| 3 | Roboflow annotation | Reviewed object-detection labels |
| 4 | Dataset versions | Frozen V1 raw and V2 augmented exports |
| 5 | Training | E1 raw and E2 augmented checkpoints/logs |
| 6 | Evaluation | Locked detector metrics and error analysis |
| 7 | Video inference and optional tracking | Required detector videos; tracks only if approved |
| 8 | Optional spatial/event extension | Zones, lines, dwell, occupancy, evidence |
| 9 | Assignment release | Report, slides, demo, viva, submission bundle |
| 10 | Product backend | FastAPI, PostgreSQL, review and audit contracts |
| 11 | Dashboard | Human review, events, camera configuration, analytics |
| 12 | Deployment hardening | Docker, ONNX, security, benchmarks, release |

## Phase 0 - Approval and Governance

Entry: planning package exists.

Tasks:

- Record deadline, submission format, instructor expectations, hardware.
- Approve warehouse domain and four classes.
- Determine collection permission and Roboflow privacy.
- Review dataset/framework/model licenses.
- Freeze assignment MVP/non-goals.

Outputs:

- Completed `PHASE_00_APPROVAL.md`.
- Updated assignment traceability.
- License/provenance decision.

Exit gate: no unresolved legal, privacy, scope, or compute blocker.

## Phase 1 - Engineering Foundation

Tasks:

- Create `pyproject.toml`, lock dependencies, and pin Python/tool versions.
- Create package skeleton under `src/visionshield`.
- Add Ruff, mypy, pytest, coverage, pre-commit, and CI.
- Define Pydantic contracts before implementation.
- Add Make targets: setup, lint, typecheck, test, smoke.
- Add a minimal reproducible Docker development image.
- Add `.env.example`; no real secret values.

Exit gate:

- Clean install succeeds.
- Lint/type/unit smoke checks pass.
- No data/model artifact enters Git.

## Phase 2 - Data Acquisition

Target tiers:

- Assignment minimum: 1,000-1,500 unique source frames.
- Portfolio target: 3,000 source frames.
- Null/hard negatives: 15-20%.
- At least five viewpoints; reserve one viewpoint entirely for test.
- Freeze minimum independent source groups, per-class instances per split, and
  small/distant/occluded slice coverage before acquisition.
- Record frame extraction cadence and keep event-evaluation videos isolated from
  detector training frames.

Tasks:

- Record permissions and licenses.
- Hash exact files; detect near duplicates.
- Record camera/session/source IDs and conditions.
- Split by source video/session before augmentation.
- Lock the test manifest.

Exit gate: provenance complete, no cross-split source leakage, minimum class
coverage feasible.

## Phase 3 - Roboflow Annotation

Tasks:

- Create object-detection project with exact four-class names.
- Label 100-image calibration batch independently twice.
- Resolve ontology disagreements.
- Annotate remaining images.
- Review all test labels and at least 20% of train/validation.
- Export annotation statistics and QA screenshots.

Exit gate: automated label validator and manual random audit pass.

## Phase 4 - Dataset Versions

V1 raw baseline:

- Auto-orient.
- Fit/pad 640x640.
- No augmentation.

V2 Roboflow augmentation:

- Maximum 2x train multiplier.
- Horizontal flip, small rotation, modest brightness/exposure.
- Mild blur, motion blur, and sensor noise.
- No augmentation in validation/test.

Exit gate: class order, original-source membership, source-group split assignment,
base labels, version IDs, and validation/test checksums agree across manifests.
V2 training derivatives have complete lineage to V1 source IDs.

## Phase 5 - Training

Required experiments:

- E0 pretrained sanity reference on validation or a separate sanity corpus;
  never on the locked test set.
- E1 YOLO nano fine-tune on V1.
- E2 same configuration on V2.
- E3 random-initialization ablation if compute allows.
- E4 YOLO small capacity comparison only if validation evidence justifies it.

Before full training:

- One-epoch smoke run.
- Overfit 16-32 images.
- Inspect transformed training batches and labels.

Exit gate: runs are complete, hashed, immutable, and model selection uses only
validation evidence.

## Phase 6 - Detector Evaluation

Report:

- Precision, recall, F1.
- mAP50 and mAP50-95.
- Per-class AP and recall.
- PR/F1 curves and confusion matrix.
- In-domain versus unseen-view results.
- Small, occluded, blurred, and low-light slices.
- Median/p95 latency on named hardware.
- At least 50 false positives and 50 false negatives categorized if dataset
  size permits; otherwise inspect every available error and state the count.

Exit gate: test metrics regenerate from the locked model/data/config hashes and
all claims cite artifacts.

## Phase 7 - Video Inference and Optional Tracking

- Implement image/video inference from one model adapter.
- Render required detector-annotated positive and negative videos.
- If tracking is in the approved assignment scope, add ByteTrack with state reset
  per video/camera epoch and render track ID/trajectory.
- If tracking is approved, benchmark fragmentation and ID switches only on clips with frame-level track
  identity ground truth; otherwise report qualitative/golden-test failures.
- Compare BoT-SORT only if approved tracking has a measured failure mode.

Exit gate: required positive and negative detector videos render without
unbounded memory or repeated model initialization. If tracking is included, it
also passes state-isolation and approved evaluation gates.

## Phase 8 - Optional Spatial and Event Extension

Run this phase before the assignment package only when Phase 0 includes events in
the assignment scope. Otherwise defer it until after Phase 9 as a portfolio
extension; Phase 9 is not blocked by deferred Phase 8 work.

- Point-in-polygon and line-crossing geometry.
- Zone hysteresis and persistence.
- Dwell using monotonic elapsed time.
- Schedule-aware after-hours rules.
- Smoothed visible-track occupancy.
- Forklift motion/co-occupancy warning.
- Conservative PPE association with unknown state.
- Episode deduplication and explainable risk factors.
- Snapshot and event JSON generation.

Exit gate when included: unit/property/golden-video tests pass and every released
event has measured results on the separate locked event-test set.

## Phase 9 - Assignment Release

- Freeze assignment checkpoint and metrics.
- Produce README, report, dataset/model cards, slides, demo and backup video.
- Complete requirement traceability.
- Prepare viva answers from real evidence.
- Complete the privacy impact assessment, structured threat model,
  dependency/license inventory, Roboflow data-handling review, and AI-assistance
  disclosure.
- Test source archive on a clean environment.
- Export this directory to a standalone release repository after approval; tag
  `v1.0-kpitb-submission` only in that repository.

## Phase 10 - Product Backend

- FastAPI REST and resumable WebSocket contracts.
- PostgreSQL migrations for cameras, geometry, rules, events, reviews, evidence,
  outbox, and audit history.
- Secure account/session architecture, failed-login controls, password reset,
  OIDC compatibility, and site-scoped Admin/Operator/Viewer RBAC.
- S3-compatible evidence storage.
- Transactional event/outbox creation.
- Configurable camera capacity, protected RTSP references, camera health and
  reconnect state.
- Asynchronous image/video/stream jobs with progress, bounded queues, retries,
  failure states, and worker recovery.
- Adapter-based in-app/WebSocket/email notifications.

Exit gate: authorization, RLS, idempotency, failure injection, and API contract
tests pass.

## Phase 11 - Dashboard

- Camera health and low-rate preview.
- SVG/canvas zone and line editor.
- Active event queue and explainable risk factors.
- Event detail, timeline, evidence, Confirm/Dismiss/Defer actions mapped to
  persisted review states.
- Filtered event history and measured analytics.
- Model/config versions and audit history.
- Route set and operations-center interaction model from
  `PRODUCT_REQUIREMENTS.md`.
- Controlled CCTV Copilot over authorized, structured event data with cited
  records and auditable queries.

Exit gate: responsive/accessibility/browser tests pass and every screen uses real
API data.

## Phase 12 - Deployment and Portfolio Release

- ONNX export and framework parity corpus.
- CPU/GPU benchmark on named hardware.
- Non-root containers, resource limits, health checks, SBOM and scans.
- Bounded uploads, decode isolation, cleanup, rate/concurrency limits.
- Signed/hashed model and evidence manifests.
- Frontend, API, worker, PostgreSQL, object-storage, and migration containers.
- Retention jobs, camera limits, health/readiness, metrics, structured logs, and
  recovery checks.
- GitHub release, portfolio assets, LinkedIn post, resume bullets.

Exit gate: clean deployment test, security review, restore/rollback exercise,
documentation consistency audit, and immutable release.
