# VisionShield AI Project Blueprint

## 1. Product Definition

VisionShield AI is a human-in-the-loop warehouse video analytics prototype. It
detects visible physical objects with a custom YOLO model, preserves camera-local
track IDs, applies explicit geometric and temporal rules, creates explainable
event episodes, and presents evidence for operator review.

It is not an autonomous surveillance authority, intent classifier, facial
recognition system, or safety-certified control system.

## 2. Problem

Conventional CCTV records large amounts of video but requires continuous human
attention. The MVP reduces review load by surfacing observable, configurable
conditions such as a tracked person entering a restricted polygon or remaining
in a zone beyond a threshold.

The system assists an operator. It does not decide whether activity is criminal,
malicious, authorized, or legally noncompliant.

## 3. Users

- Assignment evaluator reviewing the complete CV pipeline.
- ML/CV reviewer reproducing training and evaluation.
- Safety/security operator reviewing potential events.
- System configurator defining zones, lines, schedules, and thresholds.
- Portfolio recruiter evaluating engineering depth and honesty.

## 4. Assignment MVP

### Inputs

- JPG/PNG images.
- Prerecorded MP4 videos.
- Fixed-camera warehouse footage only.

### YOLO Outputs

- Bounding box in original-image coordinates.
- Class ID and class name.
- Confidence score.
- Model and dataset version.

### Classes

| ID | Name | Purpose |
|---:|---|---|
| 0 | `person` | Zone, occupancy, dwell, PPE association |
| 1 | `forklift` | Vehicle-lane activity and co-occupancy |
| 2 | `hardhat` | Visible PPE association |
| 3 | `high_visibility_vest` | Visible PPE association |

### Conditional Product Extension Events

These events are not required for the detector-only assignment core. Include
them before the assignment freeze only if Phase 0 approves the added scope and
the separate event evaluation protocol can be completed.

- `restricted_zone_entry`
- `line_crossing`
- `prolonged_presence`
- `after_hours_presence`
- `occupancy_threshold_exceeded`
- `forklift_lane_co_occupancy`
- `ppe_visibility_warning`

### Outputs

- Annotated images and videos.
- Machine-readable detections and detector evaluation artifacts.
- If the extension is approved: machine-readable events, evidence snapshots,
  explainable risk factors, canonical human review, and event evaluation
  artifacts.

## 5. Explicit Non-Goals

- Facial recognition or personal identity.
- Cross-camera tracking.
- Age, gender, ethnicity, emotion, or health inference.
- Criminal, terrorist, suspicious-person, or intent labels.
- Theft, pursuit, fighting, weapon use, climbing, or fall claims.
- Exact metric distance without camera calibration.
- Exact crowd count under severe occlusion.
- Automated punishment, access denial, emergency dispatch, or machinery control.
- A universal model that works at every facility.
- A production or real-time claim without measured evidence.

## 6. Architecture

```text
Image / Prerecorded Video
          |
          v
Input Validation and Decode
          |
          v
Letterbox / Normalize
          |
          v
Custom YOLO Detector
          |
          v
NMS and Original-Coordinate Boxes
          |
          v
ByteTrack Camera-Local Tracks
          |
          +--------------------------+
          v                          v
Spatial Engine                Track State Store
Zones and Lines               Position and Time
          |                          |
          +-------------+------------+
                        v
                Temporal Rule Engine
                        |
                        v
               Event Episode Machine
                        |
                        v
             Explainable Risk Policy
                        |
          +-------------+--------------+
          v                            v
    Evidence Writer               Event Database
          |                            |
          +-------------+--------------+
                        v
                  FastAPI Layer
                        |
              REST and WebSocket Events
                        |
                        v
                Human Review Dashboard
```

## 7. Repository Architecture After Implementation

```text
KPITB-AIML-CV-Assignment/
├── apps/
│   ├── api/                 # FastAPI control plane
│   └── dashboard/           # Operator UI, created in portfolio phase
├── src/visionshield/
│   ├── data/                # schemas, validation, manifests
│   ├── detection/           # model adapter and postprocessing
│   ├── tracking/            # tracker adapter and state
│   ├── geometry/            # zones and line crossing
│   ├── events/              # rules, episodes, deduplication
│   ├── risk/                # versioned deterministic policy
│   ├── evidence/            # snapshots, clips, manifests
│   └── contracts/           # versioned API/event schemas
├── training/                # train/evaluate/export entry points
├── configs/                 # immutable run and rule configs
├── data/                    # manifests only; media ignored
├── tests/                   # unit, integration, golden video
├── docs/                    # cards, report, viva, architecture
├── demo_assets/             # licensed public demo inputs/outputs
├── results/                 # generated verified metrics and reports
└── submissions/             # final immutable bundle manifest
```

Canonical generated outputs live under `results/`. Final release bundles live
under `submissions/<bundle-name>/`; names such as `RESULTS/` inside that bundle
are packaging labels, not additional source directories.

## 8. Core Algorithms

### Zone Entry

Use the bottom-center of a person box as the ground-contact proxy. Require the
point to remain inside the normalized polygon for `K_ENTER` observations before
opening an event. Require `K_EXIT` outside observations before closing it.

### Line Crossing

Compute the signed side of a directed finite line for consecutive track anchor
points. Emit one directional crossing only when the stable sign changes, the
motion segment intersects the finite line, displacement exceeds a minimum, and
the cooldown has elapsed.

### Dwell

Accumulate monotonic elapsed time only between valid consecutive observations.
Clamp large gaps and stop accumulation after the missing-track grace period.
Call the result prolonged presence, not intent-based loitering.

### Occupancy

Count confirmed person tracks whose anchors are inside a zone. Smooth using a
short median window. Open and close episodes with different thresholds and hold
times to prevent flicker.

### PPE Association

- Associate a worn-hardhat center with the upper 35% of a sufficiently large person
  box.
- Associate a worn-vest center with the 25-75% torso band.
- Resolve duplicate candidates by containment then normalized center distance.
- Return `unknown`, not missing, when person size or visibility is insufficient.
- Trigger only after persistent missing visibility in a PPE-required zone.

All thresholds are tuned on validation data and frozen before test evaluation.

## 9. Event Episode State Machine

```text
INACTIVE -> PENDING -> OPEN -> CLOSING -> CLOSED
              |          ^         |
              +----------+---------+
```

- `PENDING`: rule condition has started but hold time is not met.
- `OPEN`: one durable event and evidence request are created.
- `CLOSING`: condition cleared but grace period has not elapsed.
- `CLOSED`: episode is finalized.
- A recurrence within the merge gap reopens the same episode.
- A recurrence after cooldown creates a new episode.

## 10. Explainable Risk Policy

Risk is a configurable policy score, not probability.

```text
score = clamp(base + zone + schedule + duration + occupancy, 0, 100)
```

Provisional demonstration configuration only; Phase 0 policy review must approve
values before release:

| Factor | Points |
|---|---:|
| Restricted-zone entry | 30 |
| After-hours presence | 20 |
| Prolonged presence | 15 |
| Forklift-lane co-occupancy | 25 |
| PPE visibility warning | 15 |
| Occupancy threshold exceeded | 20 |

Every event stores each factor and contribution. Never describe 70/100 as a
70% probability of danger.

## 11. Product Data Contracts

Required schemas:

- `DetectionV1`: frame, model, boxes, confidence, quality.
- `TrackObservationV1`: camera epoch, track ID, anchor, age, quality.
- `ZoneV1`: normalized polygon, type, version, thresholds.
- `VirtualLineV1`: directed segment, cooldown, version.
- `RuleV1`: event type, schedule, hold/clear times, risk factors.
- `EventV1`: episode state, subject, measurements, risk explanation, evidence.
- `ReviewV1`: human decision, reason code, note, reviewer, timestamp.
- `RunManifestV1`: commit, data/model/config hashes, hardware, environment.

Schemas are versioned and validated at every boundary.

## 12. Non-Functional Requirements

- Deterministic/replayable rules.
- Source-grouped dataset splits.
- No raw private media in Git.
- Bounded upload size, duration, dimensions, and decode resources.
- Temporary input cleanup on success and failure.
- No reusable secrets in source, URLs, or logs.
- Model artifact hash verification.
- Human review for every event.
- Measured latency on named hardware before performance claims.
- Graceful empty detections and camera/video failures.
- CPU smoke-test path for evaluators.
- Reproducible training/evaluation configs.

## 13. Assignment Acceptance

The assignment release is complete only when:

- Roboflow annotation and augmentation evidence exists.
- Raw and augmented runs are comparable.
- The selected checkpoint came from validation evidence.
- The locked test set was evaluated once after selection.
- Image and video outputs exist.
- Metrics and failure cases are documented.
- Every assignment requirement links to a real artifact.
- The student can explain every pipeline stage in the viva.

## 14. Portfolio Acceptance

The portfolio release additionally requires:

- Tracking, zones, events, evidence, human review, and dashboard.
- API and schema documentation.
- Dockerized clean setup.
- Automated unit/integration/golden-video tests.
- ONNX export and parity test.
- Measured CPU/GPU latency.
- Dataset card, model card, threat model, and license inventory.
- A short real demo and offline backup video.
- Honest GitHub, LinkedIn, and resume wording from verified evidence.
