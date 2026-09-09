# VisionShield AI Product Requirements

Status: `PLANNED`

This is the authoritative product-level specification. The smaller KPITB
assignment release remains separately gated in `REQUIREMENTS_TRACEABILITY.md`.

## 1. Product Purpose

VisionShield transforms fixed CCTV streams, uploaded images, and recorded videos
into explainable visual security intelligence. Its primary use case is
policy-defined intrusion monitoring. Industrial safety rules are complementary.

The system answers what is visible, where it is, where it moved, which zone or
line it interacted with, when and for how long, which configured policy fired,
why an alert exists, what evidence supports it, and whether a human reviewed it.

An `unauthorized_entry` means that an observable track violated a configured
zone, line, schedule, or direction policy. It does not mean VisionShield knows a
person's identity, permission, intent, or legal status.

## 2. Processing Flow

```text
RTSP / Image / Video
  -> validation and safe decode
  -> custom YOLO detection
  -> ByteTrack camera-local tracking
  -> spatial and temporal analysis
  -> deterministic event and risk rules
  -> evidence and alerts
  -> PostgreSQL/object storage/WebSockets
  -> dashboard and CCTV Copilot
  -> human review
```

Long media and streams run in background workers, never synchronously inside a
long FastAPI request.

## 3. Inputs and AI

- Sources: RTSP camera, JPG/JPEG/PNG/WebP image, MP4/AVI/MOV video, MKV where the
  deployed decoder supports it, and licensed sample/demo media.
- Initial configurable classes: `person`, `forklift`, `hardhat`,
  `high_visibility_vest`.
- Initial training domain: fixed-camera warehouse/industrial footage. Claims for
  campuses, offices, or other controlled facilities require domain evaluation.
- Each detection records class, confidence, bounding box, frame, timestamp,
  camera, model version, and camera-local track ID when tracking applies.
- Each track records first/last seen, duration, trajectory, current/previous
  zone, image-plane speed estimate, direction, and quality state.
- Additional classes require a versioned ontology, compatible labels, retraining,
  and evaluation; configuration alone cannot create model capability.

## 4. Cameras and Processing

Authorized users can create, view, update, disable, reconnect, and remove camera
sources. A camera records ID, name, description, location, source type, protected
source reference, resolution, source/processing FPS, status, creation time, last
heartbeat/frame, processing state, configuration version, latency, uptime,
reconnect attempts, and sanitized error state.

- Maximum configured cameras is deployment-configurable; never claim unlimited
  capacity.
- The UI shows maximum, configured, and available camera slots.
- Camera states distinguish online, degraded, reconnecting, offline, disabled,
  and error. An outage must never appear as “no event.”
- Configurable controls include processing FPS, resolution, frame skipping,
  batch size, model, detection classes, zones, lines, schedules, thresholds, and
  evidence policy.
- Live processing uses bounded queues, stale-frame policy, retries, reconnection,
  graceful shutdown, failed-job states, and worker recovery.
- Upload jobs expose validated progress and terminal success/failure states.

## 5. Spatial and Temporal Rules

Users can draw, rename, edit, delete, and version polygon zones and directed
virtual lines. Zone types include public, monitoring, restricted, critical,
hazardous, loading, parking, and custom.

Rules may produce:

- Restricted-zone entry and policy-defined perimeter breach.
- Wrong-direction and repeated directed-line crossing.
- After-hours presence using IANA time zones, holidays, and versioned schedules.
- Prolonged presence using configurable hold, gap, and clear thresholds.
- Approximate visible occupancy and configured overcrowding thresholds.
- Person and moving-forklift lane co-occupancy warning.
- Hardhat/vest visibility warning with `visible`, `missing`, or `unknown` states.

The system must not label policy events as criminal intent, prove legal
noncompliance, or claim calibrated distance/collision prediction without the
required calibration and evaluation.

## 6. Events, Risk, and Evidence

Each event records ID/type, camera, timestamps, track IDs, zone/line/rule
versions, severity, risk score and factors, relevant detector confidence,
quality flags, review status, evidence reference, and creation/update times.

- Severity and risk are deterministic, configurable policy outputs.
- Risk factors and point contributions are stored and displayed.
- A risk score is not the probability that a person is committing a crime.
- Event episodes deduplicate frame-level triggers and preserve a timeline.
- Evidence may include snapshot, pre-event clip, event clip, post-event clip,
  metadata, versions, and hashes.
- Pre/post duration and retention are configurable; expiry jobs remove evidence
  according to policy while retaining lawful audit metadata.
- Events enter human review. Actions are Confirm, Dismiss, and Defer, with
  reviewer, timestamp, comment, previous state, and reason code.

## 7. Authentication and Authorization

The platform supports secure login/logout, password hashing where local
credentials are enabled, account status, failed-login controls, session expiry,
password-reset architecture, and secure access/refresh token rotation or an
approved server-session equivalent. Product deployment should remain compatible
with OIDC Authorization Code + PKCE and MFA.

Roles are site-scoped and least-privileged:

| Role | Planned access |
|---|---|
| Administrator | Users, cameras, zones, rules, models, settings, audit, and full operational access |
| Security Operator | Monitor assigned cameras, inspect evidence, and review events |
| Viewer | Read-only access to explicitly assigned operational data |

Authorization applies at API, database, WebSocket, export, Copilot, and evidence
boundaries; hiding a UI control is not authorization.

## 8. Dashboard and Search

Planned routes:

```text
/login                 /dashboard
/cameras               /cameras/[id]
/events                /events/[id]
/evidence              /analytics
/copilot               /zones
/rules                 /models
/datasets              /system-health
/audit-logs            /settings
/users
```

The dark-first security operations interface includes a camera grid, overlays,
event timeline, active alerts, event detail and evidence viewer, zone/line
editor, filters, analytics, health, model/dataset versions, settings, users, and
audit history. It must be responsive, keyboard accessible, high-density without
clutter, and avoid decorative “AI” gimmicks.

Search/filter fields include event ID, camera, zone, event type, camera-local
track ID, date/time, severity, risk range, and review status. Analytics use real
records and include events by date/camera/type/severity, visible object counts,
occupancy, dwell, latency/FPS, uptime, queue pressure, and error rate.

## 9. CCTV Copilot

The Copilot answers questions only from data the requesting user is authorized
to access. It uses controlled intent extraction and allowlisted, parameterized
queries over structured camera/event/evidence records, then returns answers with
event IDs, timestamps, cameras, and evidence references.

- It does not inspect raw video as an unrestricted vision-language oracle.
- It must not invent an event, identity, permission, motive, or evidence.
- Missing data produces an explicit unknown/no-record response.
- Query scope, source records, model/prompt version where applicable, and access
  decision are auditable.
- Deterministic query results remain usable without an LLM; summarization is an
  optional adapter.

## 10. Alerts and Live Updates

- In-app and resumable WebSocket notifications are initial adapters.
- Email is an adapter; SMS and push are future adapters.
- External providers never belong inside the core event engine.
- WebSockets carry authorized event, camera-health, processing-progress,
  detection-statistic, and review updates with reconnect/cursor behavior.
- No automated enforcement, accusation, punishment, access denial, emergency
  dispatch, or machinery control is permitted.

## 11. Security, Privacy, and Audit

- Treat uploads, RTSP endpoints, decoded media, model files, and metadata as
  untrusted.
- Validate extension, MIME/signature, size, dimensions, duration, filename, and
  decoded content; use generated storage keys and isolated constrained decoders.
- Protect against path traversal, SSRF, SQL injection, unsafe model loading,
  decompression bombs, unrestricted CORS, brute-force login, and resource abuse.
- Keep database, RTSP, API, model-signing, and storage credentials out of Git,
  URLs, browser payloads, and logs.
- Use secure evidence authorization, short-lived references, rate/concurrency
  limits, transaction handling, and immutable-from-normal-UI audit records.
- Audit authentication, camera/rule/zone/model changes, event reviews, evidence
  access, exports, Copilot queries, and administrative actions.
- Optional privacy modules include face blurring and configurable evidence
  retention; no face recognition, face identification, ReID, criminal profiling,
  or protected-attribute inference.

## 12. Reliability and Observability

Services expose health/readiness and sanitized failures for API, database,
worker, WebSocket, object storage, model, and cameras. Errors record timestamp,
service, severity, correlation/request/event ID, safe message, and internal stack
trace where appropriate; users never receive internal traces.

Measure rather than invent FPS, median/p95 latency, processing time, memory,
CPU/GPU utilization, queue size, drops, retries, uptime, and errors. “Real-time”
requires a predeclared target measured on named hardware.

## 13. Versioning and Configuration

Version model, dataset, training run, camera, zone, line, rule, risk policy, API,
and database schema. Record checksums for promoted model/config artifacts.
Training parameters, camera limits, inference controls, thresholds, schedules,
retention, and provider adapters live in validated configuration, not buried in
Python source.

## 14. Testing and Delivery

- Unit/property tests: geometry, lines, schedules, risk, occupancy, episodes,
  validation, and configuration.
- ML tests: loading, inference, output contracts, tracking reset, and ONNX parity.
- Integration tests: auth, API/database, jobs, event pipeline, evidence, storage,
  WebSockets, and failure recovery.
- Browser tests: login, dashboard, filtering, event review, camera/zone/rule
  configuration, Copilot authorization, and accessibility.
- CI: formatting, lint, type checking, tests, builds, secret/dependency/license
  scans, and container checks; full model training does not run in routine CI.
- Docker services: Next.js frontend, FastAPI API, media workers, PostgreSQL,
  S3-compatible local object storage, and migrations.

## 15. Deliverables

The completed program ultimately includes custom dataset and Roboflow evidence,
YOLO model and training/evaluation artifacts, image/video/stream inference,
tracking, event/risk/evidence engines, authentication, API, PostgreSQL,
WebSockets, camera management, dashboard, controlled Copilot, analytics, health,
audit, Docker, tests, CI, logging, configuration/versioning, architecture and
dataset/model documentation, report, presentation, viva material, and demo.

## 16. Future Research Modules

Fall detection, climbing, abandoned-object detection, object removal, pose
estimation, pursuit, advanced anomaly detection, cross-camera re-identification,
predictive analytics, and natural-language video understanding remain blocked
until each has a suitable dataset, design, privacy review, and evaluation.
