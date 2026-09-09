# Tracking, Spatial Intelligence, Events, and Risk

## Tracking Boundary

- ByteTrack is the fixed-camera baseline.
- One tracker instance belongs to one `(camera_id, stream_epoch)`.
- Reset on a different video, reconnect, discontinuity, or reassignment.
- Track IDs are temporary camera-local object IDs, never personal identity.
- Keep bounded trajectory history.

## Track Observation

```json
{
  "schema_version": "track.v1",
  "camera_id": "CAM-01",
  "stream_epoch": "uuid",
  "frame_id": 100,
  "observed_at": "UTC timestamp",
  "track_id": 27,
  "class_name": "person",
  "bbox_xyxy_norm": [0.1, 0.2, 0.3, 0.9],
  "anchor_norm": [0.2, 0.9],
  "confidence": 0.91,
  "age_ms": 4200,
  "quality_flags": []
}
```

## Zone Configuration

- Store normalized polygon points.
- Require three unique points.
- Reject self-intersection and zero area.
- Version every change.
- Define zone type: public, monitored, restricted, forklift lane, PPE required.
- Draw anchor point and polygon in evidence overlays.

## Geometry Tests

- Point inside/outside/on boundary.
- Concave polygons.
- Clockwise/counter-clockwise vertices.
- Invalid/self-intersecting polygon.
- Letterbox/original coordinate conversion.
- Finite-line intersection and direction.

## Event Rules

### Restricted Zone Entry

Open after person anchor is inside for configured consecutive observations.
Close after stable exit plus grace. Record track, zone, timestamps, model, and
rule version.

### Line Crossing

Use consecutive stable signed-side values and finite segment intersection.
Require minimum displacement, track age, and cooldown. Store direction.

### Prolonged Presence

Accumulate monotonic elapsed time while track remains in zone. Pause for short
missing gaps; close after grace. Never call this criminal loitering.

### After-Hours Presence

Combine confirmed person presence with versioned site schedule and IANA time
zone. Handle weekends/holidays explicitly. Invalid schedules create health
errors, not automatic alerts.

### Occupancy Threshold

Count confirmed visible person tracks in a zone, smooth over a short window,
and use separate open/close thresholds and hold times. Label as approximate
visible occupancy.

### Forklift-Lane Co-Occupancy

Require person and `moving_forklift` anchors in the same configured lane.
Movement is image displacement unless calibration exists. Freeze minimum track
age, displacement/time window, missing-gap behavior, and camera-jitter guard on
validation data. If motion is indeterminate, return unknown rather than alert.
Call it co-occupancy warning, not near-miss distance.

### PPE Visibility Warning

Apply only in PPE-required zones and for sufficiently large/visible person
boxes. Associate worn hardhat/vest detections spatially. A carried/stored item is
not PPE visibility evidence. Use `visible`, `missing`, or `unknown`. Persist
before alerting.

## Event State

`INACTIVE -> PENDING -> OPEN -> CLOSING -> CLOSED`

Event identity includes camera, stream epoch, rule, subject key, and episode.
Updates are idempotent. Merge short gaps and suppress frame-by-frame duplicates.

## Risk Policy

- Version every policy.
- Keep detector confidence separate.
- Calculate from deterministic factors.
- Store raw measurements and point contribution.
- Clamp score to 0-100.
- Map score to informational/low/medium/high/critical using configuration.
- Human explanation is generated from structured factors, never an LLM.

## Evidence

For each opened event:

- Evidence snapshot with overlay.
- Optional pre/post event clip.
- Raw event JSON.
- Model/tracker/rule/policy versions.
- Source timestamps and quality flags.
- SHA-256 for generated artifacts.
- Evidence status: pending, ready, partial, failed.

Raw video and annotated derivatives remain separate. A hash verifies file
integrity after capture; it does not prove the camera source was truthful.

## Human Review

Persisted statuses:

- Unreviewed
- Acknowledged
- Confirmed
- False positive
- Inconclusive
- Suppressed

Reason codes distinguish detector, tracker, geometry, schedule, authorized
activity, duplicate, poor visibility, and insufficient evidence failures.
UI actions map to these states: Confirm -> Confirmed, Dismiss -> False positive
plus a required reason code, and Defer -> Inconclusive. Suppression is a policy
action, not a reviewer claim that the event did not occur.

## Advanced Feature Gate

Abandoned object, fall, climbing, pursuit, theft, violence, and general anomaly
features are blocked. Each requires a separate approved problem definition,
dataset, model/rule design, privacy review, metrics, and rollback plan.
