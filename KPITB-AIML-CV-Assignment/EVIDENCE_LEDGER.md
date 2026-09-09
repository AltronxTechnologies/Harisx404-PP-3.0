# Evidence Ledger

This ledger records current project truth. Planning files are specifications,
not proof that implementation or evaluation occurred.

| Claim or requirement | Status | Evidence | Limitation or next action |
|---|---|---|---|
| Supplied instructor requirements are preserved verbatim | EVALUATED | `ASSIGNMENT_BRIEF.md`, `PLANNING_AUDIT.md` | Owner must still confirm the supplied brief is complete |
| Requirements map to planned artifacts | PLANNED | `REQUIREMENTS_TRACEABILITY.md` | Artifacts do not exist yet |
| Scope and protocols have been source-audited | EVALUATED | `PLANNING_AUDIT.md` | Phase 0 decisions are recorded; implementation evidence remains phase-specific |
| Dataset exists | BLOCKED | None | Permission, source, privacy, and license decisions required |
| Roboflow annotation/augmentation exists | BLOCKED | None | Dataset upload is not authorized yet |
| YOLO model or measured metrics exist | BLOCKED | None | Training and evaluation have not started |
| Engineering foundation exists | EVALUATED | `PHASE_01_REPORT.md`, `src/`, `tests/`, `Dockerfile.dev` | ML and product features are not implemented |
| Phase 0 decisions are recorded | EVALUATED | `PHASE_00_APPROVAL.md` | Deadline remains unavailable from the instructor |
| Phase 2 data tooling is reliable | EVALUATED | `PHASE_02_TOOLING_REPORT.md`, `src/visionshield/data.py`, `tests/test_data.py` | Real acquisition remains blocked |

Research URLs in `docs/RESEARCH_SOURCES.md` are candidate references only until
retrieval date, relevant excerpt, and final-report use are recorded here.
