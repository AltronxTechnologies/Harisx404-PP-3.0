# VisionShield AI Scope Guard

This directory is a standalone KPITB AI/ML computer-vision assignment and
portfolio project. Work performed under this plan MUST remain inside
`KPITB-AIML-CV-Assignment/`.

## Non-Negotiable Isolation Rules

1. Never edit, import from, move, or delete files outside this directory.
2. Never modify the portfolio application, root package files, root Docker
   Compose files, root environment files, migrations, or lock documentation.
3. Use this directory's own Python, backend, dashboard, Docker, test, and
   environment files when implementation begins.
4. Raw datasets, private videos, secrets, model weights, and generated runs must
   never be committed to Git.
5. Do not claim a feature, metric, speed, or result unless an artifact in this
   directory proves it.
6. Do not create fake weights, logs, metrics, charts, screenshots, citations, or
   experiment outputs.
7. Execute one phase at a time. Do not start the next phase until its exit gate
   is documented as passed in `PROJECT_STATE.md`.
8. Treat advanced behavior recognition as out of scope unless it receives a
   separate dataset, model, evaluation protocol, and owner approval.

## Required Reading Order

1. `ASSIGNMENT_BRIEF.md`
2. `REQUIREMENTS_TRACEABILITY.md`
3. `PRODUCT_REQUIREMENTS.md`
4. `PROJECT_BLUEPRINT.md`
5. `IMPLEMENTATION_PLAN.md`
6. `AI_EXECUTION_PLAYBOOK.md`
7. Relevant document under `docs/` for the active phase
8. `PROJECT_STATE.md`

## Evidence Vocabulary

- `PLANNED`: specified but not implemented.
- `IMPLEMENTED`: code exists and static/unit checks pass.
- `EVALUATED`: measured against the approved protocol.
- `RELEASED`: included in a tested immutable release.
- `BLOCKED`: cannot proceed without a named dependency or decision.

No other status language may be used to inflate progress.

## Stop Conditions

Stop and request clarification when:

- A requirement, class definition, license, or source provenance is unclear.
- A task requires modifying files outside this directory.
- A requested claim has no evidence.
- Dataset privacy or redistribution rights cannot be established.
- Test-set data would be used for tuning.
- A new feature exceeds the approved phase scope.
