"""Dataset provenance, hashing, grouped splitting, and leakage checks."""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import defaultdict
from collections.abc import Iterable, Sequence
from enum import StrEnum
from pathlib import Path
from typing import Annotated

import imagehash
from PIL import Image
from pydantic import AnyHttpUrl, Field, model_validator

from visionshield.contracts import ObjectClass, StrictModel, UtcDatetime

Sha256 = Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]
PerceptualHash = Annotated[str, Field(pattern=r"^[0-9a-f]{16}$")]


class Split(StrEnum):
    UNASSIGNED = "unassigned"
    TRAIN = "train"
    VALIDATION = "validation"
    TEST = "test"


class PrivacyReview(StrEnum):
    PENDING = "pending"
    PUBLIC_NON_SENSITIVE = "public_non_sensitive"
    APPROVED_PRIVATE = "approved_private"
    REJECTED = "rejected"


class SourceRecord(StrictModel):
    source_id: str = Field(min_length=1)
    source_group_id: str = Field(min_length=1)
    camera_id: str = Field(min_length=1)
    recording_session_id: str = Field(min_length=1)
    viewpoint_id: str = Field(min_length=1)
    local_path: Path | None = None
    original_url: AnyHttpUrl | None = None
    retrieved_or_recorded_at: UtcDatetime
    owner_or_creator: str = Field(min_length=1)
    permission_or_license: str = Field(min_length=1)
    license_url: AnyHttpUrl | None = None
    license_verified_at: UtcDatetime | None = None
    redistribution_allowed: bool
    staged_or_natural: str = Field(pattern=r"^(staged|natural|unknown)$")
    lighting: str = Field(min_length=1)
    privacy_review: PrivacyReview
    sha256: Sha256 | None = None
    perceptual_hash: PerceptualHash | None = None
    split: Split = Split.UNASSIGNED
    frame_extraction_cadence_ms: int | None = Field(default=None, gt=0)
    event_evaluation_source: bool = False
    hard_negative: bool = False
    class_counts: dict[ObjectClass, int] = Field(default_factory=dict)
    notes: str = ""

    @model_validator(mode="after")
    def validate_location(self) -> SourceRecord:
        if self.local_path is None and self.original_url is None:
            raise ValueError("a local path or original URL is required")
        if self.original_url is not None:
            if self.original_url.scheme != "https":
                raise ValueError("original URL must use HTTPS")
            if self.original_url.username is not None or self.original_url.password is not None:
                raise ValueError("original URL must not contain credentials")
        if self.license_url is not None:
            if self.license_url.scheme != "https":
                raise ValueError("license URL must use HTTPS")
            if self.license_url.username is not None or self.license_url.password is not None:
                raise ValueError("license URL must not contain credentials")
        return self


class LeakageKind(StrEnum):
    SOURCE_GROUP = "source_group_cross_split"
    RECORDING_SESSION = "recording_session_cross_split"
    EXACT_DUPLICATE = "exact_duplicate"
    NEAR_DUPLICATE = "near_duplicate"
    UNSEEN_VIEWPOINT = "unseen_viewpoint_outside_test"
    UNASSIGNED = "unassigned_split"
    MISSING_HASH = "missing_hash"
    REDISTRIBUTION = "redistribution_not_allowed"
    PRIVACY = "privacy_not_approved"
    LICENSE = "license_not_verified"
    EVENT_SOURCE = "event_evaluation_source_in_detector_data"
    COVERAGE = "coverage_target_not_met"
    DUPLICATE_SOURCE_ID = "duplicate_source_id"
    MEDIA_UNVERIFIED = "media_unverified"
    HASH_MISMATCH = "hash_mismatch"


class LeakageFinding(StrictModel):
    kind: LeakageKind
    source_ids: tuple[str, ...]
    detail: str


class DatasetAudit(StrictModel):
    record_count: int = Field(ge=0)
    split_counts: dict[Split, int]
    source_group_counts: dict[Split, int]
    class_counts: dict[Split, dict[ObjectClass, int]]
    hard_negative_count: int = Field(ge=0)
    findings: tuple[LeakageFinding, ...]

    @property
    def passed(self) -> bool:
        return not self.findings


class CoverageTargets(StrictModel):
    minimum_source_groups: dict[Split, int] = Field(
        default_factory=lambda: {Split.TRAIN: 12, Split.VALIDATION: 3, Split.TEST: 3}
    )
    minimum_class_instances: dict[Split, dict[ObjectClass, int]] = Field(
        default_factory=lambda: {
            Split.TRAIN: {
                ObjectClass.PERSON: 600,
                ObjectClass.FORKLIFT: 300,
                ObjectClass.HARDHAT: 300,
                ObjectClass.HIGH_VISIBILITY_VEST: 300,
            },
            Split.VALIDATION: {object_class: 50 for object_class in ObjectClass},
            Split.TEST: {object_class: 50 for object_class in ObjectClass},
        }
    )
    minimum_viewpoints: int = 5
    hard_negative_min_ratio: float = Field(default=0.15, ge=0, le=1)
    hard_negative_max_ratio: float = Field(default=0.20, ge=0, le=1)


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


def perceptual_hash_file(path: Path) -> str:
    with Image.open(path) as image:
        return str(imagehash.phash(image.convert("RGB")))


def resolve_media_path(root: Path, relative_path: Path) -> Path:
    resolved_root = root.resolve()
    resolved = (resolved_root / relative_path).resolve()
    if not resolved.is_relative_to(resolved_root):
        raise ValueError("media path escapes the approved root")
    if not resolved.is_file():
        raise ValueError(f"media file does not exist: {relative_path}")
    return resolved


def enrich_hashes(record: SourceRecord, media_root: Path) -> SourceRecord:
    if record.local_path is None:
        raise ValueError(f"source {record.source_id} has no local media path")
    path = resolve_media_path(media_root, record.local_path)
    return record.model_copy(
        update={"sha256": sha256_file(path), "perceptual_hash": perceptual_hash_file(path)}
    )


def _group_score(group_id: str, seed: int) -> float:
    value = hashlib.sha256(f"{seed}:{group_id}".encode()).digest()
    return int.from_bytes(value[:8], "big") / (2**64 - 1)


def assign_grouped_splits(
    records: Sequence[SourceRecord],
    *,
    seed: int = 42,
    train_ratio: float = 0.70,
    validation_ratio: float = 0.15,
    unseen_test_viewpoints: frozenset[str] = frozenset(),
) -> tuple[SourceRecord, ...]:
    if not 0 < train_ratio < 1 or not 0 < validation_ratio < 1:
        raise ValueError("split ratios must be between zero and one")
    if train_ratio + validation_ratio >= 1:
        raise ValueError("train and validation ratios must leave a test partition")

    grouped: dict[str, list[SourceRecord]] = defaultdict(list)
    for record in records:
        grouped[record.source_group_id].append(record)

    reserved_test: set[str] = set()
    development: list[str] = []
    for group_id, group in grouped.items():
        viewpoints = {record.viewpoint_id for record in group}
        if viewpoints & unseen_test_viewpoints:
            if not viewpoints <= unseen_test_viewpoints:
                raise ValueError(
                    "one source group cannot mix unseen-test and development viewpoints"
                )
            reserved_test.add(group_id)
        else:
            development.append(group_id)

    ranked = sorted(development, key=lambda group_id: (_group_score(group_id, seed), group_id))
    count = len(ranked)
    train_count = round(count * train_ratio)
    validation_count = round(count * validation_ratio)
    if count >= 3:
        train_count = max(1, min(train_count, count - 2))
        validation_count = max(1, min(validation_count, count - train_count - 1))
    assignments = {
        group_id: (
            Split.TRAIN
            if index < train_count
            else Split.VALIDATION
            if index < train_count + validation_count
            else Split.TEST
        )
        for index, group_id in enumerate(ranked)
    }
    assignments.update(dict.fromkeys(reserved_test, Split.TEST))

    output: list[SourceRecord] = []
    for group_id in sorted(grouped):
        group = grouped[group_id]
        split = assignments[group_id]
        output.extend(record.model_copy(update={"split": split}) for record in group)
    return tuple(output)


def audit_leakage(
    records: Sequence[SourceRecord],
    *,
    near_duplicate_distance: int = 4,
    unseen_test_viewpoints: frozenset[str] = frozenset(),
    coverage_targets: CoverageTargets | None = None,
    media_root: Path | None = None,
) -> DatasetAudit:
    if not 0 <= near_duplicate_distance <= 64:
        raise ValueError("near-duplicate distance must be between 0 and 64")
    findings: list[LeakageFinding] = []
    split_counts = {split: 0 for split in Split}
    groups: dict[str, list[SourceRecord]] = defaultdict(list)
    sessions: dict[str, list[SourceRecord]] = defaultdict(list)
    exact: dict[str, list[SourceRecord]] = defaultdict(list)
    source_ids: dict[str, list[SourceRecord]] = defaultdict(list)
    hashed_records: list[SourceRecord] = []
    class_counts: dict[Split, dict[ObjectClass, int]] = {
        split: {object_class: 0 for object_class in ObjectClass} for split in Split
    }
    hard_negative_count = 0

    for record in records:
        split_counts[record.split] += 1
        groups[record.source_group_id].append(record)
        sessions[record.recording_session_id].append(record)
        source_ids[record.source_id].append(record)
        hard_negative_count += int(record.hard_negative)
        for object_class, count in record.class_counts.items():
            class_counts[record.split][object_class] += count
        findings.extend(_eligibility_findings(record))
        findings.extend(_media_findings(record, media_root))
        if record.sha256 is not None:
            exact[record.sha256].append(record)
        if record.perceptual_hash is not None:
            hashed_records.append(record)
        if record.viewpoint_id in unseen_test_viewpoints and record.split != Split.TEST:
            findings.append(
                LeakageFinding(
                    kind=LeakageKind.UNSEEN_VIEWPOINT,
                    source_ids=(record.source_id,),
                    detail=f"viewpoint {record.viewpoint_id} must occur only in test",
                )
            )

    findings.extend(_cross_split_findings(groups.values(), LeakageKind.SOURCE_GROUP))
    findings.extend(_cross_split_findings(sessions.values(), LeakageKind.RECORDING_SESSION))
    findings.extend(_duplicate_findings(source_ids.values(), LeakageKind.DUPLICATE_SOURCE_ID))
    findings.extend(_duplicate_findings(exact.values(), LeakageKind.EXACT_DUPLICATE))

    for index, left in enumerate(hashed_records):
        for right in hashed_records[index + 1 :]:
            if left.sha256 == right.sha256:
                continue
            assert left.perceptual_hash is not None
            assert right.perceptual_hash is not None
            distance = imagehash.hex_to_hash(left.perceptual_hash) - imagehash.hex_to_hash(
                right.perceptual_hash
            )
            if distance <= near_duplicate_distance:
                findings.append(
                    LeakageFinding(
                        kind=LeakageKind.NEAR_DUPLICATE,
                        source_ids=(left.source_id, right.source_id),
                        detail=f"perceptual hash distance {distance}",
                    )
                )

    source_group_counts = {
        split: len({record.source_group_id for record in records if record.split == split})
        for split in Split
    }
    if coverage_targets is not None:
        findings.extend(
            _coverage_findings(
                records,
                source_group_counts,
                class_counts,
                hard_negative_count,
                coverage_targets,
                unseen_test_viewpoints,
            )
        )
    return DatasetAudit(
        record_count=len(records),
        split_counts=split_counts,
        source_group_counts=source_group_counts,
        class_counts=class_counts,
        hard_negative_count=hard_negative_count,
        findings=tuple(findings),
    )


def _eligibility_findings(record: SourceRecord) -> list[LeakageFinding]:
    findings: list[LeakageFinding] = []
    checks = (
        (record.split == Split.UNASSIGNED, LeakageKind.UNASSIGNED, "split is unassigned"),
        (
            record.sha256 is None or record.perceptual_hash is None,
            LeakageKind.MISSING_HASH,
            "exact and perceptual hashes are required",
        ),
        (
            not record.redistribution_allowed,
            LeakageKind.REDISTRIBUTION,
            "redistribution permission is required by the approved data policy",
        ),
        (
            record.privacy_review != PrivacyReview.PUBLIC_NON_SENSITIVE,
            LeakageKind.PRIVACY,
            "public non-sensitive privacy review is required",
        ),
        (
            record.license_url is None or record.license_verified_at is None,
            LeakageKind.LICENSE,
            "license URL and verification timestamp are required",
        ),
        (
            record.event_evaluation_source,
            LeakageKind.EVENT_SOURCE,
            "event-evaluation sources cannot supply detector dataset frames",
        ),
    )
    for failed, kind, detail in checks:
        if failed:
            findings.append(
                LeakageFinding(kind=kind, source_ids=(record.source_id,), detail=detail)
            )
    return findings


def _media_findings(record: SourceRecord, media_root: Path | None) -> list[LeakageFinding]:
    if media_root is None or record.local_path is None:
        return [
            LeakageFinding(
                kind=LeakageKind.MEDIA_UNVERIFIED,
                source_ids=(record.source_id,),
                detail="local media root/path is required to verify declared hashes",
            )
        ]
    try:
        path = resolve_media_path(media_root, record.local_path)
    except ValueError as error:
        return [
            LeakageFinding(
                kind=LeakageKind.MEDIA_UNVERIFIED,
                source_ids=(record.source_id,),
                detail=str(error),
            )
        ]
    if record.sha256 is None or record.perceptual_hash is None:
        return []
    if record.sha256 == sha256_file(path) and record.perceptual_hash == perceptual_hash_file(path):
        return []
    return [
        LeakageFinding(
            kind=LeakageKind.HASH_MISMATCH,
            source_ids=(record.source_id,),
            detail="declared media hash does not match the referenced file",
        )
    ]


def _cross_split_findings(
    groups: Iterable[Sequence[SourceRecord]], kind: LeakageKind
) -> list[LeakageFinding]:
    findings: list[LeakageFinding] = []
    for group in groups:
        if len({record.split for record in group}) > 1:
            findings.append(
                LeakageFinding(
                    kind=kind,
                    source_ids=tuple(sorted(record.source_id for record in group)),
                    detail="records occur in multiple splits",
                )
            )
    return findings


def _duplicate_findings(
    groups: Iterable[Sequence[SourceRecord]], kind: LeakageKind
) -> list[LeakageFinding]:
    return [
        LeakageFinding(
            kind=kind,
            source_ids=tuple(sorted(record.source_id for record in group)),
            detail="duplicate records must be removed before release",
        )
        for group in groups
        if len(group) > 1
    ]


def _coverage_findings(
    records: Sequence[SourceRecord],
    source_group_counts: dict[Split, int],
    class_counts: dict[Split, dict[ObjectClass, int]],
    hard_negative_count: int,
    targets: CoverageTargets,
    unseen_test_viewpoints: frozenset[str],
) -> list[LeakageFinding]:
    details: list[str] = []
    for split, minimum in targets.minimum_source_groups.items():
        if source_group_counts[split] < minimum:
            details.append(f"{split} source groups {source_group_counts[split]} < {minimum}")
    for split, minimums in targets.minimum_class_instances.items():
        for object_class, minimum in minimums.items():
            if class_counts[split][object_class] < minimum:
                details.append(
                    f"{split} {object_class} instances "
                    f"{class_counts[split][object_class]} < {minimum}"
                )
    viewpoints = {record.viewpoint_id for record in records}
    if len(viewpoints) < targets.minimum_viewpoints:
        details.append(f"viewpoints {len(viewpoints)} < {targets.minimum_viewpoints}")
    if not unseen_test_viewpoints:
        details.append("at least one exclusively held-out test viewpoint is required")
    else:
        for object_class in ObjectClass:
            unseen_count = sum(
                record.class_counts.get(object_class, 0)
                for record in records
                if record.split == Split.TEST and record.viewpoint_id in unseen_test_viewpoints
            )
            familiar_count = sum(
                record.class_counts.get(object_class, 0)
                for record in records
                if record.split == Split.TEST and record.viewpoint_id not in unseen_test_viewpoints
            )
            if unseen_count == 0 or familiar_count == 0:
                details.append(
                    f"test class {object_class} requires familiar and unseen-view instances"
                )
    ratio = hard_negative_count / len(records) if records else 0
    if not targets.hard_negative_min_ratio <= ratio <= targets.hard_negative_max_ratio:
        details.append(
            f"hard-negative ratio {ratio:.3f} outside "
            f"{targets.hard_negative_min_ratio:.3f}-{targets.hard_negative_max_ratio:.3f}"
        )
    return [
        LeakageFinding(kind=LeakageKind.COVERAGE, source_ids=(), detail=detail)
        for detail in details
    ]


def load_manifest(path: Path) -> tuple[SourceRecord, ...]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("manifest root must be a list")
    return tuple(SourceRecord.model_validate(item) for item in raw)


def manifest_hash(records: Sequence[SourceRecord]) -> str:
    payload = [record.model_dump(mode="json") for record in records]
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit a VisionShield source manifest")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--media-root", type=Path, required=True)
    parser.add_argument("--near-distance", type=int, default=4)
    parser.add_argument("--unseen-test-viewpoint", action="append", default=[])
    args = parser.parse_args()

    audit = audit_leakage(
        load_manifest(args.manifest),
        near_duplicate_distance=args.near_distance,
        unseen_test_viewpoints=frozenset(args.unseen_test_viewpoint),
        coverage_targets=CoverageTargets(),
        media_root=args.media_root,
    )
    print(audit.model_dump_json(indent=2))
    return 0 if audit.passed else 1
