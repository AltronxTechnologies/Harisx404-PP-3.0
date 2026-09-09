# Requirements Traceability

Status values: `PLANNED`, `IMPLEMENTED`, `EVALUATED`, `RELEASED`, `BLOCKED`.

| ID | Verbatim requirement | Planned evidence | Acceptance test | Status |
|---|---|---|---|---|
| KPITB-R01 | Train a YOLO model on a custom dataset. | Dataset card, training config, run manifest, best checkpoint | Clean training command completes and artifact hashes agree | PLANNED |
| KPITB-R02 | Data Collection - This step is optional. | Provenance ledger, collection protocol, source manifests | Every source has permission/license and stable ID | PLANNED |
| KPITB-R03 | Use Roboflow to annotate your dataset. | Project/version URL, annotation screenshots, ontology, QA report | Export labels pass automated and visual QA | PLANNED |
| KPITB-R04 | Apply appropriate augmentation techniques using Roboflow. | V1 raw and V2 augmented versions, augmentation rationale | V1/V2 differ only by approved train augmentation | PLANNED |
| KPITB-R05 | Model Training. | E1/E2 configs, logs, checkpoints, environment manifest | Reproducible run and validation-selected model | PLANNED |
| KPITB-R06 | Test on images. | Locked test metrics, predictions, success/failure grid | Evaluation regenerates from model and split hashes | PLANNED |
| KPITB-R07 | Test on videos. | Detector-annotated positive and negative videos; optional tracking/event artifacts if approved | Prerecorded videos run with the selected locked detector; any event claims use a separate locked event protocol | PLANNED |
| KPITB-R08 | Discuss the complete process followed. | Report, slides, demo script, viva map | Every pipeline step links to real evidence | PLANNED |
| PORT-R01 | Strong GitHub project. | README, CI, cards, architecture, release | Clean clone passes setup/test/demo instructions | PLANNED |
| PORT-R02 | Honest portfolio and resume evidence. | Verified metrics ledger and approved wording | Every claim maps to an artifact/run | PLANNED |
| GOV-R01 | Human review and responsible use. | Non-goals, risk policy, review workflow, privacy assessment | No event is framed as intent or automatic guilt | PLANNED |

No row may be marked `EVALUATED` or `RELEASED` merely because a file exists.
