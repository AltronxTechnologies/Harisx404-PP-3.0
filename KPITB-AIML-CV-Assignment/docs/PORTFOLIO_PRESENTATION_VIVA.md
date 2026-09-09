# Assignment, Portfolio, Presentation, and Viva Plan

## Honest Project Positioning

Assignment title:

> VisionShield AI: Custom YOLO Detection for Warehouse Images and Video

If tracking/events are included and evaluated, the approved title may append
“with Explainable Intrusion Events.”

Portfolio title after full product phases:

> VisionShield AI: Explainable Industrial Safety and Zone Intelligence

Never publish unverified values or call the assignment prototype enterprise,
production-ready, highly accurate, robust, compliant, or real-time.

## Assignment Report

1. Abstract
2. Problem and motivation
3. Confirmed requirements and scope
4. Related work
5. Dataset provenance and privacy
6. Class ontology and annotation
7. Roboflow preprocessing/augmentation
8. Split and leakage prevention
9. YOLO architecture and transfer learning
10. Experiment design
11. Detector results
12. Image testing
13. Video inference; tracking and event rules if included in approved scope
14. Event results if evaluated, otherwise planned portfolio extension
15. Error analysis
16. Security, privacy, ethics, and licensing
17. Limitations
18. Conclusions and roadmap
19. Requirement traceability
20. Reproducibility appendix

## Presentation

Ten core slides:

1. Title and one-sentence outcome
2. Problem, user, scope, and non-goals
3. Complete assignment pipeline
4. Dataset, classes, provenance, and split
5. Roboflow annotation and augmentation
6. YOLO training and experiments
7. Detector metrics and error analysis
8. Video inference; evaluated tracking/zones/events if approved
9. Live/offline demo, limitations, privacy
10. Requirement coverage, learning, next steps

Backup slides: hyperparameters, per-class table, confusion matrix, PR curves,
class counts, annotation policy, architecture, license inventory, threat model.

## Demo Script

1. State that events require human review.
2. Show one correct image detection.
3. Show one difficult image and explain uncertainty.
4. Show prerecorded detector video output.
5. If the approved assignment scope includes events, draw/load a restricted zone
   and trigger one evaluated event.
6. If events are included, show its exact reasons/risk factors and review it.
7. Show one false positive or false negative.
8. Open metrics/run manifest.
9. Close with limitations and roadmap.

Never demonstrate a planned product feature as an assignment result. If tracking,
events, the dashboard, or Copilot are not evaluated by submission time, present
them only as architecture/roadmap material.

Prepare a 60-90 second offline backup video.

## GitHub README Evidence Order

- Status: PLANNED/IMPLEMENTED/EVALUATED/RELEASED.
- One-sentence product definition.
- Real demo GIF/video.
- Scope and non-goals.
- Verified result table with hardware/test context.
- Five-command CPU quick start.
- Architecture and repository map.
- Training/evaluation instructions.
- Dataset/model access and licenses.
- Success and failure examples.
- Privacy/human-review warning.
- Assignment traceability.

## Resume Wording Template

Use only after measured results:

> VisionShield AI | Python, YOLO, OpenCV, FastAPI, PostgreSQL
>
> - Fine-tuned [exact model] on [N] source-grouped warehouse images across four
>   observable classes, achieving [verified mAP50-95] on a locked [N]-image test
>   set.
> - Built camera-local tracking and deterministic zone, line-crossing, dwell,
>   occupancy, and PPE-visibility events with explainable risk factors and
>   evidence capture.
> - Exported the selected model to ONNX and measured [latency/FPS] on [hardware],
>   with reproducible configs, tests, model/dataset cards, and privacy controls.

Delete any bullet whose evidence does not exist.

## LinkedIn Launch Template

> I built VisionShield AI for my KPITB AI/ML computer-vision assignment: a
> custom-trained YOLO warehouse detector evaluated on images and prerecorded
> videos. [If evaluated: I extended it with camera-local tracking, configurable
> zones, deterministic temporal rules, and explainable events for human review.]
>
> I completed the full pipeline in Roboflow, from annotation and justified
> augmentation to locked image/video evaluation. The selected model achieved
> [verified metrics] on [test size] and [verified latency] on [hardware].
>
> The project does not identify people or infer criminal intent. Its limitations,
> failure cases, dataset/model cards, and reproducibility artifacts are public.
>
> GitHub: [URL]
> Demo: [URL]

## Interview Narrative

Prepare a five-minute answer:

- Why the problem matters.
- Why scope is warehouse-specific.
- Why four physical classes are learnable.
- How data leakage was prevented.
- Why raw versus augmented experiments are controlled.
- How the selected model was chosen.
- Where it fails.
- Why ByteTrack and deterministic rules were used.
- How events stay explainable.
- How privacy and human review constrain deployment.

Every number should be openable from a run artifact.

## Viva Questions

Be ready to explain:

- Object detection versus classification/segmentation.
- Bounding boxes and normalized YOLO labels.
- IoU, NMS, precision, recall, AP, mAP50, mAP50-95.
- Train/validation/test roles.
- Source-video leakage.
- Transfer learning and why not train from scratch.
- Class imbalance and hard negatives.
- Why each augmentation is realistic.
- Confidence and IoU threshold selection.
- Small-object and occlusion failures.
- Tracking versus detection and temporary track IDs.
- Point-in-polygon and line-crossing direction.
- Dwell, hysteresis, persistence, cooldown, deduplication.
- Why risk score is policy, not probability.
- Why missing PPE can be unknown.
- Why human review is required.
- ONNX purpose and parity testing.
- Licensing, privacy, and AI assistance.

For each topic prepare a 20-second answer, a one-minute technical expansion,
the evidence file to open, and one honest limitation.

## Submission Bundle

```text
VisionShieldAI_KPITB_<StudentID>_<Date>/
├── READ_ME_FIRST.pdf
├── ASSIGNMENT_BRIEF.pdf
├── REQUIREMENTS_TRACEABILITY.pdf
├── FINAL_REPORT.pdf
├── PRESENTATION.pdf
├── SOURCE_CODE.zip
├── DEMO_VIDEO.mp4
├── RESULTS/
├── REPRODUCIBILITY/
├── CARDS_AND_DISCLOSURES/
└── checksums.sha256
```

Test every link/file and the archive on a clean machine before submission.
