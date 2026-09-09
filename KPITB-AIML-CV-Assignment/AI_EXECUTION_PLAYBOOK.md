# AI Execution Playbook

Use one prompt at a time. Supply only the files relevant to that phase. Every AI
response must identify assumptions, changed files, commands, evidence, and
unresolved blockers.

## Global System Prompt

```text
You are implementing VisionShield AI inside KPITB-AIML-CV-Assignment only.
Never modify files outside this directory.

Read AGENTS.md, PROJECT_STATE.md, REQUIREMENTS_TRACEABILITY.md, the active phase
in IMPLEMENTATION_PLAN.md, and the relevant docs before editing.

Rules:
- Do not invent requirements, licenses, data, metrics, logs, model weights,
  screenshots, citations, or completed work.
- Use PLANNED, IMPLEMENTED, EVALUATED, RELEASED, or BLOCKED exactly.
- Implement only the active phase and approved acceptance criteria.
- Do not add facial recognition, identity, intent, criminality, emotion, theft,
  fighting, climbing, fall, pursuit, or cross-camera tracking.
- Keep model detections, deterministic rule outputs, and human decisions clearly
  separated in code and documentation.
- Test every change. Report exact commands and results.
- Stop if privacy, license, provenance, test leakage, or scope is unclear.
- Never tune on the locked test set.
- Never call performance real-time without measured hardware evidence.
```

## Prompt 0 - Requirements Approval

```text
Audit ASSIGNMENT_BRIEF.md and REQUIREMENTS_TRACEABILITY.md against the supplied
instructor message. Preserve requirements verbatim. List every missing decision
needed for Phase 0. Do not propose code and do not mark a requirement complete.
Output only: confirmed requirements, unknowns, blockers, decisions requested.
```

## Prompt 1 - Foundation

```text
Implement Phase 1 only. Create an isolated typed Python project, package
structure, Pydantic contracts, deterministic configuration loader, Ruff, mypy,
pytest, coverage, pre-commit, Makefile, Docker development image, and CI.
Do not add model inference yet. Add contract/unit smoke tests. Run every gate and
update PROJECT_STATE.md only with observed results.
```

## Prompt 2 - Dataset Provenance

```text
Implement Phase 2 tooling only: source manifest schema, SHA-256 hashing,
perceptual near-duplicate reporting, grouped split generation, leakage checks,
class/count report placeholders, and provenance validation. Do not download or
redistribute data without an approved source and license. Test deterministic
splits with synthetic fixtures, not real private media.
```

## Prompt 3 - Annotation QA

```text
Implement Phase 3 validation around the approved four-class ontology. Validate
YOLO boxes, class IDs, missing/empty labels, duplicate boxes, extreme sizes,
split membership, and counts. Produce a review report and visualization command.
Do not auto-accept model-assisted labels. Do not change class definitions.
```

## Prompt 4 - Roboflow Versions

```text
Using owner-provided Roboflow exports and version metadata, verify V1 raw and V2
augmented manifests. Confirm identical original-source membership, source-group
split assignment, base labels, class order, and byte-identical validation/test
hashes. Verify lineage for every V2 training derivative. Record version IDs and
checksums. Never upload data or
call Roboflow APIs without explicit credentials and permission.
```

## Prompt 5 - Training

```text
Implement reproducible training entry points for E1 and E2 from immutable YAML
configs. Pin the approved YOLO package and starting checkpoint. Add a one-epoch
smoke mode and tiny-subset overfit mode. Save run manifests, environment, logs,
configs, hashes and artifacts. Do not train automatically. Do not write expected
metrics. Require the operator to provide hardware/device explicitly.
```

## Prompt 6 - Evaluation

```text
Implement evaluation against a locked manifest. Refuse to run if model, data,
config, split, or class hashes do not match. Produce machine-readable metrics,
per-class tables, PR/F1 plots, confusion matrix, latency protocol, prediction
exports, and error-analysis queue. Do not change thresholds using test results.
```

## Prompt 7 - Tracking

```text
Implement required detector video inference first. Add a ByteTrack adapter only
if Phase 0 includes tracking in the assignment scope. One tracker belongs to one
camera/video epoch. Reset between unrelated videos. Emit typed track observations
and render IDs/trajectories. Add tests for frame gaps, empty detections, reset,
occlusion, and bounded history. Do not add ReID unless a benchmark justifies it.
```

## Prompt 8 - Events

```text
Proceed only if Phase 0 includes events in the assignment scope or Phase 9 has
already frozen the assignment release. Implement point-in-polygon, finite
directed line crossing, dwell accumulation,
schedule evaluation, occupancy smoothing, episode state machine, event cooldown,
explainable risk factors, and evidence snapshots. Use deterministic functions and
typed contracts. Add unit, property, and golden-video tests. Use prolonged
presence, co-occupancy warning, and PPE visibility warning language only.
```

## Prompt 9 - Assignment Package

```text
Generate assignment documentation only from verified artifacts. Every metric
must cite run ID, model hash, dataset hash, split, sample count, threshold and
hardware. Include failures and limitations. Build report/slides/viva/demo script
and trace every instructor requirement. Write not measured or not implemented
where evidence is absent.
```

## Prompt 10 - API and Database

```text
Implement FastAPI/PostgreSQL Phase 10 only. Use migrations, constraints,
transactions, service/repository boundaries, idempotent event/outbox writes,
site-scoped authorization, signed evidence references, and API contract tests.
Binary media belongs in object storage, not PostgreSQL. Do not add dashboard UI.
```

## Prompt 11 - Dashboard

```text
Implement the approved dashboard against real typed APIs. Include camera health,
geometry editor, event queue/detail, risk explanation, evidence, human review,
filters, and audit history. Label occupancy as approximate visible occupancy and
risk as policy score. Add responsive, accessibility, keyboard and browser tests.
Do not use mock production metrics.
```

## Prompt 12 - Release Audit

```text
Perform a release-blocking audit. Verify clean setup, tests, hashes, model/data
licenses, requirements traceability, README/report/slides metric consistency,
privacy and security disclosures, demo assets, source archive, secret scan,
container scan, rollback and known limitations. Return PASS or BLOCKED with exact
evidence. Never waive a gate because the project looks complete.
```

## Completion Response Format

```text
Phase:
Status:
Requirements addressed:
Files changed:
Commands run:
Observed results:
Evidence paths:
Assumptions:
Open risks:
Blockers:
Next approved action:
```
