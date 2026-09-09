import json
import sys
from datetime import UTC, datetime
from pathlib import Path

import pytest
from PIL import Image, ImageDraw
from pydantic import AnyHttpUrl, ValidationError

from visionshield.contracts import ObjectClass
from visionshield.data import (
    CoverageTargets,
    LeakageKind,
    PrivacyReview,
    SourceRecord,
    Split,
    assign_grouped_splits,
    audit_leakage,
    enrich_hashes,
    load_manifest,
    main,
    manifest_hash,
    resolve_media_path,
)


def _record(source_id: str, group: str, camera: str = "CAM-001") -> SourceRecord:
    return SourceRecord(
        source_id=source_id,
        source_group_id=group,
        camera_id=camera,
        recording_session_id=f"session-{group}",
        viewpoint_id=camera,
        local_path=Path(f"{source_id}.jpg"),
        retrieved_or_recorded_at=datetime(2026, 9, 9, tzinfo=UTC),
        owner_or_creator="Synthetic test",
        permission_or_license="Test fixture only",
        redistribution_allowed=False,
        staged_or_natural="staged",
        lighting="synthetic",
        privacy_review=PrivacyReview.PUBLIC_NON_SENSITIVE,
    )


def _image(path: Path, quality: int = 95) -> None:
    image = Image.new("RGB", (64, 64), "white")
    draw = ImageDraw.Draw(image)
    draw.rectangle((8, 8, 42, 45), fill="black")
    draw.ellipse((30, 20, 58, 54), fill="red")
    image.save(path, quality=quality)


def test_source_requires_path_or_url() -> None:
    data = _record("source-1", "group-1").model_dump()
    data.update(local_path=None, original_url=None)
    with pytest.raises(ValidationError, match="local path or original URL"):
        SourceRecord.model_validate(data)

    bad_url = _record("source-2", "group-2").model_dump()
    bad_url.update(local_path=None, original_url="http://user:secret@example.com/image.jpg")
    with pytest.raises(ValidationError, match="HTTPS"):
        SourceRecord.model_validate(bad_url)

    bad_license = _record("source-3", "group-3").model_dump()
    bad_license["license_url"] = "https://user:secret@example.com/license"
    with pytest.raises(ValidationError, match="license URL must not contain credentials"):
        SourceRecord.model_validate(bad_license)


def test_hash_enrichment_and_path_boundary(tmp_path: Path) -> None:
    path = tmp_path / "source-1.jpg"
    _image(path)

    enriched = enrich_hashes(_record("source-1", "group-1"), tmp_path)

    assert len(enriched.sha256 or "") == 64
    assert len(enriched.perceptual_hash or "") == 16
    with pytest.raises(ValueError, match="escapes"):
        resolve_media_path(tmp_path, Path("../outside.jpg"))
    with pytest.raises(ValueError, match="does not exist"):
        resolve_media_path(tmp_path, Path("missing.jpg"))

    remote_only = _record("remote", "group-remote").model_copy(
        update={"local_path": None, "original_url": "https://example.invalid/image.jpg"}
    )
    with pytest.raises(ValueError, match="no local media path"):
        enrich_hashes(remote_only, tmp_path)


def test_grouped_split_is_deterministic_and_reserves_viewpoint() -> None:
    records = (
        _record("one", "group-a"),
        _record("two", "group-a"),
        _record("three", "group-b", "CAM-TEST"),
    )

    first = assign_grouped_splits(records, unseen_test_viewpoints=frozenset({"CAM-TEST"}))
    second = assign_grouped_splits(records, unseen_test_viewpoints=frozenset({"CAM-TEST"}))

    assert first == second
    assert first[0].split == first[1].split
    assert first[2].split == Split.TEST


def test_invalid_ratios_and_mixed_unseen_group_are_rejected() -> None:
    with pytest.raises(ValueError, match="between zero and one"):
        assign_grouped_splits((_record("zero", "z"),), train_ratio=0)
    with pytest.raises(ValueError, match="leave a test"):
        assign_grouped_splits((_record("one", "a"),), train_ratio=0.8, validation_ratio=0.2)

    mixed = (_record("one", "a"), _record("two", "a", "CAM-TEST"))
    with pytest.raises(ValueError, match="cannot mix"):
        assign_grouped_splits(mixed, unseen_test_viewpoints=frozenset({"CAM-TEST"}))


def test_audit_finds_group_exact_and_near_duplicate_leakage(tmp_path: Path) -> None:
    _image(tmp_path / "one.jpg", quality=95)
    _image(tmp_path / "two.jpg", quality=75)
    one = enrich_hashes(_record("one", "shared"), tmp_path).model_copy(
        update={"split": Split.TRAIN}
    )
    two = enrich_hashes(_record("two", "shared"), tmp_path).model_copy(update={"split": Split.TEST})
    exact = one.model_copy(update={"source_id": "exact", "split": Split.VALIDATION})

    audit = audit_leakage((one, two, exact))
    kinds = {finding.kind for finding in audit.findings}

    assert not audit.passed
    assert LeakageKind.SOURCE_GROUP in kinds
    assert LeakageKind.EXACT_DUPLICATE in kinds
    assert LeakageKind.NEAR_DUPLICATE in kinds


def test_unseen_camera_audit_and_manifest_cli(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    record = _record("one", "group-a", "CAM-TEST").model_copy(update={"split": Split.TRAIN})
    audit = audit_leakage((record,), unseen_test_viewpoints=frozenset({"CAM-TEST"}))
    assert LeakageKind.UNSEEN_VIEWPOINT in {finding.kind for finding in audit.findings}

    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps([record.model_dump(mode="json")]), encoding="utf-8")
    assert load_manifest(manifest) == (record,)
    monkeypatch.setattr(
        sys,
        "argv",
        ["visionshield-data-audit", str(manifest), "--media-root", str(tmp_path)],
    )
    assert main() == 1
    assert '"record_count": 1' in capsys.readouterr().out

    invalid = tmp_path / "invalid.json"
    invalid.write_text("{}", encoding="utf-8")
    with pytest.raises(ValueError, match="root must be a list"):
        load_manifest(invalid)


def test_release_eligibility_coverage_and_manifest_hash(tmp_path: Path) -> None:
    _image(tmp_path / "one.jpg")
    record = enrich_hashes(_record("one", "group-a"), tmp_path).model_copy(
        update={
            "split": Split.TRAIN,
            "redistribution_allowed": True,
            "license_url": AnyHttpUrl("https://creativecommons.org/licenses/by/4.0/"),
            "license_verified_at": datetime(2026, 9, 9, tzinfo=UTC),
            "class_counts": {ObjectClass.PERSON: 1},
            "hard_negative": True,
        }
    )
    audit = audit_leakage((record,), coverage_targets=CoverageTargets())
    kinds = {finding.kind for finding in audit.findings}

    assert LeakageKind.COVERAGE in kinds
    assert LeakageKind.LICENSE not in kinds
    assert manifest_hash((record,)) == manifest_hash((record,))
    with pytest.raises(ValueError, match="between 0 and 64"):
        audit_leakage((record,), near_duplicate_distance=65)


def test_same_session_and_same_split_duplicates_are_reported(tmp_path: Path) -> None:
    _image(tmp_path / "one.jpg")
    one = enrich_hashes(_record("one", "group-a"), tmp_path).model_copy(
        update={"split": Split.TRAIN}
    )
    duplicate = one.model_copy(update={"source_id": "duplicate", "source_group_id": "group-b"})
    duplicate_id = one.model_copy(
        update={"source_group_id": "group-unique", "recording_session_id": "session-unique"}
    )
    other_split = one.model_copy(
        update={"source_id": "other", "source_group_id": "group-c", "split": Split.TEST}
    )

    kinds = {
        finding.kind
        for finding in audit_leakage(
            (one, duplicate, duplicate_id, other_split), media_root=tmp_path
        ).findings
    }
    assert LeakageKind.EXACT_DUPLICATE in kinds
    assert LeakageKind.RECORDING_SESSION in kinds
    assert LeakageKind.DUPLICATE_SOURCE_ID in kinds


def test_hash_mismatch_and_unseen_view_coverage_are_blocking(tmp_path: Path) -> None:
    _image(tmp_path / "one.jpg")
    record = enrich_hashes(_record("one", "group-a"), tmp_path).model_copy(
        update={
            "split": Split.TEST,
            "sha256": "0" * 64,
            "redistribution_allowed": True,
            "license_url": AnyHttpUrl("https://creativecommons.org/licenses/by/4.0/"),
            "license_verified_at": datetime(2026, 9, 9, tzinfo=UTC),
        }
    )
    findings = audit_leakage(
        (record,), coverage_targets=CoverageTargets(), media_root=tmp_path
    ).findings
    kinds = {finding.kind for finding in findings}

    assert LeakageKind.HASH_MISMATCH in kinds
    assert LeakageKind.COVERAGE in kinds
