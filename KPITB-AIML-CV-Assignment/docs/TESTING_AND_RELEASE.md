# Testing, CI, Deployment, and Release Strategy

## Test Pyramid

### Unit Tests

- Configuration parsing and invalid values.
- Image resize, letterbox, and coordinate reversal.
- Detection confidence/class filtering.
- Box clipping and empty detections.
- Point-in-polygon and boundary behavior.
- Finite-line crossing and direction.
- Dwell accumulation with frame gaps.
- Schedule/time-zone behavior.
- Occupancy smoothing and hysteresis.
- Risk score factors and clamping.
- Event episode transitions/deduplication.
- Temporary-file cleanup.

### Property Tests

- Normalized coordinates remain 0-1.
- Reversing a line reverses crossing direction.
- Risk score remains bounded.
- Replaying observations is idempotent.
- Invalid polygons are rejected.
- Event count does not increase for repeated frames in one episode.

### Contract Tests

- Detection, track, event, risk, evidence, review, API, and WebSocket schemas.
- Additive versus breaking schema changes.
- Framework-to-ONNX output parity.
- Database migrations and constraints.

### Integration Tests

- Image upload -> inference -> response -> cleanup.
- Video -> tracks -> events -> evidence.
- Event and outbox created transactionally.
- API auth and site-scoped authorization.
- Review state and immutable event provenance.
- Object-store failure and evidence retry.
- WebSocket cursor replay and reconnect.

### Golden Video Tests

Use small licensed clips with frozen expected event intervals. Test positive,
negative, occlusion, frame-drop, reconnect, and no-detection conditions. Avoid
brittle exact floating-point predictions; assert contracts and tolerant geometry.

## CI Pull Request Gates

- Formatting and lint.
- Static type checking.
- Unit/property/contract tests.
- Coverage threshold on core non-ML logic.
- CPU inference smoke test with tiny licensed fixture.
- Dataset/schema/config validation.
- Documentation link and card validation.
- Secret scan.
- Dependency vulnerability and license scan.
- Container build and scan.

Do not train a full model in routine CI.

## Failure Injection

Test:

- Corrupt/oversized input.
- Decoder crash/timeout.
- Empty and low-confidence detections.
- GPU OOM/provider fallback.
- Tracker reset and ID switch.
- Database/object-store/WebSocket failure.
- Camera disconnect and timestamp reversal.
- Evidence clip missing keyframe.
- Full disk and queue pressure.
- Invalid schedule/zone/risk policy.

The dashboard must never present camera outage as no event.

## Docker Development Plan

Standalone project Compose services:

- `api`
- `media-worker`
- `dashboard` in portfolio phase
- `postgres`
- `minio` for local evidence
- one-shot `migrate`

Containers run non-root where possible, use health checks, resource limits,
read-only roots, explicit volumes, pinned images, and no baked secrets/models.

## ONNX Release

- Export selected checkpoint only after test lock.
- Preserve framework checkpoint and ONNX hashes.
- Run parity corpus and fail on unacceptable drift.
- Benchmark target providers separately.
- Record fallback provider; never silently claim GPU execution.

## Assignment Release Gate

- Requirements matrix has evidence for every confirmed requirement.
- Clean setup and CPU demo work.
- Dataset/model/config/commit hashes agree.
- Report and slides match `metrics.json` exactly.
- Image/video demonstrations use the selected release model.
- Failure examples and limitations included.
- No secret/private/raw media in archive.
- Offline backup demo works.
- Final ZIP opened and tested on another environment.

## Portfolio Release Gate

- Assignment release complete and immutable.
- API/dashboard use real event data.
- Auth/RBAC/evidence authorization tested.
- ONNX parity/latency measured.
- Docker clean-start and migration tests pass.
- Privacy, security, threat, model, dataset, and license reviews complete.
- Backup/restore and rollback tested.
- GitHub release artifacts and checksums published where licensing permits.

## Release Artifacts

```text
submissions/VisionShieldAI_KPITB_<StudentID>_<Date>/
├── source.tar.gz
├── model-or-download-manifest.json
├── metrics.json
├── dataset-manifest.json
├── checksums.sha256
├── final-report.pdf
├── presentation.pdf
├── demo.mp4
├── model-card.pdf
├── dataset-card.pdf
├── security-privacy.pdf
└── license-inventory.pdf
```

## Observability

Measure ingest FPS, inference latency, dropped frames, queue depth, active tracks,
open episodes, event rate, false-positive review reasons, evidence failures,
camera health, database latency, and storage use. Logs use request, camera,
stream-epoch, and event IDs without recording secrets or raw media.
