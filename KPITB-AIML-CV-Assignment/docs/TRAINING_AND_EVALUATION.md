# Training and Evaluation Protocol

## Model Decision

Use a pinned Ultralytics YOLO implementation accepted by the instructor.
YOLO11n is the provisional baseline because it is established and lightweight;
do not finalize the package/version until Phase 0 approval. Record framework,
weights, license, exact version, and SHA-256.

## Preflight Gates

Before full training:

1. Validate dataset YAML and all image/label pairs.
2. Render at least 50 labels from every split.
3. Run one epoch end-to-end.
4. Overfit 16-32 images.
5. Inspect transformed batches.
6. Confirm output directories and manifests.

Failure to overfit the tiny subset blocks full training.

## Provisional Configuration

```yaml
model: yolo11n.pt
task: detect
imgsz: 640
epochs: 100
patience: 20
batch: 16
optimizer: AdamW
pretrained: true
seed: 42
deterministic: true
amp: true
workers: 4
```

Batch/workers must be adjusted to measured hardware. Never present these values
as used until a run manifest proves them.

## Experiment Ladder

| Run | Dataset | Model | Purpose |
|---|---|---|---|
| E0 | Validation or separate sanity corpus | Unmodified pretrained | Sanity only for overlapping classes; never inspect locked test |
| E1 | V1 raw | YOLO nano pretrained | Required custom baseline |
| E2 | V2 augmented | Same nano/config | Roboflow augmentation ablation |
| E3 | V1 raw | Nano random init | Transfer-learning ablation if compute allows |
| E4 | Better V1/V2 | YOLO small | Capacity/latency trade-off if justified |
| E5 | Selected model | ONNX | Deployment parity and latency |

E1 versus E2 is the primary assignment comparison. Keep all non-dataset
variables fixed. If compute allows, repeat E1/E2 with seeds 42, 43, 44 and
report each run plus mean and standard deviation.

## Run Manifest

Every run records:

- Run ID, parent/baseline, start/end/status.
- Git commit and dirty state.
- Dataset/Roboflow version and export hash.
- Split manifest hash and class order.
- Model source/version/hash/license.
- Full hyperparameters and seed.
- Python, OS, CUDA, framework, driver.
- CPU/GPU/RAM/VRAM.
- Best/last checkpoint hashes.
- Checkpoint selection rule.
- Raw logs and figure paths.

## Model Selection

- Freeze the primary validation metric, per-class recall guard, confidence/IoU
  threshold selection rule, and tie-break rule before training.
- Proposed primary metric: mAP50-95. Phase 0 must approve the exact guard values.
- Do not select from test performance.
- Do not choose a larger model unless validation gain justifies measured latency.
- Lock checkpoint and confidence/IoU thresholds before final test.

## Detector Metrics

- Precision and recall.
- F1 at validation-selected threshold.
- mAP50 and mAP50-95.
- Per-class AP/precision/recall.
- PR and F1 curves.
- Confusion matrix.
- Number of images and instances per class.
- Familiar-camera and unseen-camera results.
- Small, distant, occluded, low-light, and blurred slices.

Do not report generic accuracy as the primary detection metric.

## Latency Protocol

Record:

- Exact hardware and execution provider.
- Model format and precision.
- Input resolution, batch size, warmup count, measured samples.
- Whether decode, preprocessing, NMS, tracking, rendering, and encoding are
  included.
- Median and p95 latency.
- FPS only from a clearly defined end-to-end or inference-only calculation.

Never call the system real-time without meeting a predeclared FPS/latency target
on named hardware.

## Error Analysis

Categorize false positives and false negatives by:

- Small object
- Blur
- Occlusion/truncation
- Unusual viewpoint
- Reflection/depiction
- Look-alike negative
- Class confusion
- Annotation error
- Lighting/exposure
- Domain shift

Preserve representative good and bad examples. Do not show only ideal outputs.

## Video Testing and Event Evaluation

The assignment core requires detector inference on prerecorded positive and
negative videos. Tracking and event evaluation are portfolio extensions unless
Phase 0 explicitly promotes them into the assignment scope.

If events are released, create separate event-development/validation and locked
event-test manifests. Thresholds are selected on event validation only. The
locked test must include positive, boundary, multi-subject, and hard-negative
cases for every released rule: restricted entry, directed line crossing, dwell,
after-hours presence, occupancy, moving-forklift-lane co-occupancy, and PPE
visibility. Remove any rule that lacks adequate evaluation evidence.

Two reviewers label event intervals or crossing timestamps and resolve
disagreements. If fragmentation and ID switches are reported, selected clips
also require frame-level track identity ground truth and a declared
prediction-to-ground-truth assignment protocol. Otherwise report tracking only
through qualitative failures and deterministic golden-video behavior tests.

## Event Metrics

- Event precision, recall, F1.
- False alarms per video hour.
- Missed-event rate.
- Median and p95 onset delay.
- Results by rule and camera.
- Familiar versus unseen viewpoint.
- Tracker fragmentation and ID switches only where track-ID ground truth exists.
- Visible occupancy MAE/bias where ground truth exists.

Use one-to-one matching: each prediction and ground-truth event can be matched at
most once. Match event type, clip, configured subject/rule context, and then use
a frozen temporal-IoU threshold for duration episodes. Use a separately frozen
timestamp tolerance for point events such as line crossings. Count duplicate,
wrong-direction, unmatched prediction, and unmatched ground-truth cases
explicitly. Freeze matching, onset/offset tolerances, and multi-subject handling
before test.

## ONNX Parity

- Export selected checkpoint to ONNX.
- Run a frozen parity corpus through framework and ONNX.
- Compare final classes, boxes, confidence tolerance, and event output.
- Fail export if differences exceed declared tolerances.
- Benchmark CPU and available GPU execution providers separately.

## Evaluation Release Gate

- Model/data/config hashes agree.
- Test split remained locked.
- Evaluation command regenerates metrics/figures.
- Every reported number cites run ID and hardware.
- Error analysis includes failures.
- No unsupported production, compliance, or universality claim.
