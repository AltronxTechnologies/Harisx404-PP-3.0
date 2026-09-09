# Dataset, Roboflow, Annotation, and Augmentation Plan

## Dataset Goal

Create a privacy-authorized, source-traceable warehouse dataset that measures
generalization across recording sessions and at least one unseen camera view.

Targets are planning goals, not current counts.

| Tier | Source frames | Use |
|---|---:|---|
| Assignment | 1,000-1,500 | Complete KPITB pipeline within limited time |
| Portfolio | 3,000 | Stronger unseen-view and event evaluation |

Recommended split: 70% train, 15% validation, 15% test. Split complete source
videos or recording sessions, never randomly extracted adjacent frames.

## Class Ontology

### `person`

Include a separately localizable visible person, including a visible forklift
operator. Box the visible extent. Exclude posters, reflections, mannequins, and
unidentifiable fragments.

### `forklift`

Include ride-on counterbalanced and reach forklifts with a distinguishable body.
Include visible forks and mast. Exclude hand pallet jacks, carts, trucks, and
ambiguous partial machinery.

### `hardhat`

Include a clearly visible industrial protective helmet worn on a person's head.
Exclude carried/stored helmets, caps, beanies, hair, decorative helmets, and
ambiguous tiny regions.

### `high_visibility_vest`

Include a clearly visible fluorescent safety vest/jacket or reflective-strip
garment worn on a person. Exclude carried/stored garments, ordinary
yellow/orange clothing, machinery paint, and signs.

## Annotation Rules

- Use tight axis-aligned boxes around visible pixels.
- Do not hallucinate the hidden extent behind occlusion.
- Label overlapping people separately when visible extents are distinguishable.
- Label PPE as separate objects; never label a whole person as vest or hardhat.
- Keep partially cropped objects only when class is unambiguous.
- Exclude objects smaller than an approved minimum, provisionally 8 pixels on
  the shorter source-image side; record exclusions.
- Null images have no boxes and are not a `none` class.
- Zones, unsafe states, missing PPE, intrusion, and behavior are never YOLO
  classes.

## Annotation Calibration

1. Select 100 diverse images.
2. Two reviewers annotate them independently.
3. Compare class decisions and boxes below IoU 0.70.
4. Resolve every disagreement.
5. Add examples to the ontology.
6. Freeze ontology version 1.0 before bulk labeling.

## Quality Assurance

- Second-person review of 100% of test labels.
- Second-person review of at least 20% of train/validation.
- Visual random sample of at least 50 images per split after export.
- Validate class IDs, normalized coordinates, zero/negative sizes, duplicates,
  missing labels, extreme boxes, and class distribution.
- Record annotation correction counts and unresolved ambiguity.
- Model-assisted labels are proposals and always require human acceptance.

## Collection Matrix

Capture variation across:

- At least five camera positions; reserve one entire position for test.
- Empty, low, medium, and crowded occupancy.
- Artificial light, daylight, low light, glare, and shadow.
- Near, medium, distant, partial, and occluded objects.
- Parked and moving forklifts.
- PPE worn, absent, carried/stored as hard negatives, partially visible, and
  unknown.
- Clean and cluttered aisles.
- Negative look-alikes: carts, pallet jacks, yellow clothing, posters, screens,
  helmets on shelves, reflective signs, and empty restricted zones.

Target 15-20% hard-negative images.

Before collection, freeze measurable targets in the dataset plan for minimum
independent source groups per split, per-class instances per split, and
small/distant/occluded examples. Every released class must occur in familiar-view
and unseen-view test subsets. Record frame extraction cadence, keep temporally
adjacent frames together, and do not extract training frames from locked event
evaluation clips. The numeric frame target alone is not an acceptance criterion.

## Provenance Manifest

Every source group must record:

```yaml
source_id:
camera_id:
recording_session_id:
original_path_or_url:
retrieved_or_recorded_at:
owner_or_creator:
permission_or_license:
redistribution_allowed:
staged_or_natural:
lighting:
privacy_review:
sha256:
split:
notes:
```

Do not use a source with unknown permission or license.

## Leakage Prevention

- Assign split by source video/session before frame extraction.
- Keep every adjacent frame group in one split.
- Remove exact duplicates with SHA-256.
- Report near duplicates with perceptual hash or embeddings.
- Reserve one unseen camera entirely for test.
- Never move difficult test images into training.
- Never inspect test metrics while choosing model or thresholds.
- Keep external auxiliary data in training only.
- Lock and hash the test manifest before E1.

## Roboflow Workflow

1. Confirm whether the workspace is private before uploading identifiable
   workplace footage.
2. Create an Object Detection project.
3. Create exactly four classes with names matching this document.
4. Upload in batches grouped by camera/session.
5. Attach source metadata outside the YOLO labels.
6. Annotate calibration set and revise ontology.
7. Complete and review labels.
8. Freeze train/validation/test groups.
9. Generate V1 and V2 as immutable dataset versions.
10. Export Ultralytics YOLO format and record version IDs/checksums.

## V1 Raw Baseline

- Auto-orient: enabled.
- Resize: fit within 640x640 with padding.
- Preserve aspect ratio.
- No augmentation.
- Validation/test unchanged.

## V2 Roboflow Augmentation

Maximum offline multiplier: 2x training data.

| Augmentation | Provisional setting | Reason |
|---|---|---|
| Horizontal flip | 50% | Plausible fixed-camera symmetry |
| Rotation | -5 to +5 degrees | Small mounting/view variation |
| Brightness | +/-15% | Lighting robustness |
| Exposure | +/-10% | Camera exposure changes |
| Blur | Up to 1.5px, 10% | Focus/compression variation |
| Motion blur | Up to 3px, 10% | Moving people/forklifts |
| Noise | Up to 1%, 10% | Sensor/compression noise |

Do not use vertical flips, 90-degree rotations, aggressive crops, grayscale,
large hue shifts, cutout, MixUp, or unrealistic perspective. Color distortion
can change high-visibility vest semantics.

## Version Comparison Rule

For the primary E1/E2 comparison, disable every YOLO online augmentation and pin
the related framework options in both run configurations. V1 and V2 must have
identical original-source membership, source-group split assignment,
preprocessing, class order, and base labels. V2 may add derivatives only from
training sources; every derivative must record its original source ID.
Validation and test file hashes must be byte-identical across exports.

## Dataset Release Gate

- Provenance and privacy permission complete.
- Four class definitions frozen.
- Split leakage checks pass.
- Class/instance counts documented.
- V1/V2 version IDs and checksums recorded.
- Validation/test contain no generated augmentations.
- Dataset card is complete.
