# Architecture Decision Log

All ADRs are `PLANNED` until the Phase 0 approval record is signed.

## ADR-001: One Coherent Environment

Proposed decision: use fixed-camera warehouse/industrial footage for the MVP.

Reason: mixing roads, offices, construction, and warehouses creates domain
noise and weakens evaluation. One environment supports defensible custom
training and spatial rules.

## ADR-002: Four Physical YOLO Classes

Proposed decision: person, forklift, worn hardhat, worn high-visibility vest.

Reason: each is a visible physical object with a consistent bounding-box
definition. Unsafe, suspicious, criminal, intrusion, and loitering are not
object classes.

## ADR-003: Deterministic Derived Events

Proposed decision: derive events from tracks, zones, lines, schedules, and
durations.

Reason: deterministic rules are explainable, replayable, testable, and do not
misrepresent YOLO as an intent model.

## ADR-004: ByteTrack First

Proposed decision: use ByteTrack for the fixed-camera MVP. Benchmark BoT-SORT only if
occlusion or camera motion causes measured tracking failures.

## ADR-005: PostgreSQL Over MongoDB

Proposed decision: use PostgreSQL for cameras, zones, rules, events, reviews, and audit
history.

Reason: the domain is relational and benefits from transactions, constraints,
queryable timelines, and row-level access control.

## ADR-006: Human Review Required

Proposed decision: all alerts are potential events for human review.

Reason: detector and tracker outputs are uncertain and must not cause automatic
disciplinary, legal, or safety action.

## ADR-007: Assignment and Portfolio Releases Are Separate

Proposed decision: finish and freeze the assignment pipeline before expanding the
dashboard/product roadmap.

Reason: a small evaluated release is stronger than a large unfinished system.

## ADR-008: Subtree-Isolated Development and Release

Proposed decision: keep all source and artifacts under this directory while it
shares the parent worktree. Use path-scoped CI and dirty-state records. Before a
public release, export this directory into a standalone repository and create
release tags only there.

Reason: directory isolation protects the locked portfolio now, while a standalone
release repository gives assignment commits and tags unambiguous provenance.
