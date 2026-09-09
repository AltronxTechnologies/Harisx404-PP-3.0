from pathlib import Path

import pytest
from pydantic import ValidationError

from visionshield.config import load_config


def _write_config(path: Path, *, status: str = "PLANNED") -> None:
    path.write_text(
        f"""
project:
  name: visionshield-ai
  status: {status}
  environment: warehouse_fixed_camera
classes:
  0: person
  1: forklift
  2: hardhat
  3: high_visibility_vest
dataset:
  roboflow_workspace: NEEDS_SOURCE_APPROVAL
  roboflow_project: NEEDS_SOURCE_APPROVAL
  raw_version: NEEDS_SOURCE_APPROVAL
  augmented_version: NEEDS_SOURCE_APPROVAL
  image_size: 640
  split_manifest: data/manifests/splits.json
training:
  framework: ultralytics
  version: 8.3.0
  model: yolo11n.pt
  epochs: 100
  patience: 20
  batch: REQUIRED_PER_RUN
  seed: 42
  device: REQUIRED_PER_RUN
  online_augmentation: DISABLED_FOR_E1_E2_ABLATION
inference:
  confidence: NEEDS_VALIDATION_SELECTION
  iou: NEEDS_VALIDATION_SELECTION
  max_detections: 300
tracking:
  tracker: bytetrack
  config: NEEDS_VALIDATION_SELECTION
governance:
  human_review_required: true
  facial_recognition: false
  cross_camera_identity: false
  intent_inference: false
""".strip(),
        encoding="utf-8",
    )


def test_load_config_is_deterministic(tmp_path: Path) -> None:
    path = tmp_path / "project.yaml"
    _write_config(path)

    first = load_config(path)
    second = load_config(path)

    assert first == second
    assert first.config.classes[0].value == "person"
    assert len(first.sha256) == 64


def test_invalid_status_is_rejected(tmp_path: Path) -> None:
    path = tmp_path / "project.yaml"
    _write_config(path, status="DONE")

    with pytest.raises(ValidationError):
        load_config(path)


def test_non_mapping_config_is_rejected(tmp_path: Path) -> None:
    path = tmp_path / "project.yaml"
    path.write_text("- invalid", encoding="utf-8")

    with pytest.raises(ValueError, match="root must be a mapping"):
        load_config(path)


def test_full_configuration_affects_hash_and_unknown_fields_fail(tmp_path: Path) -> None:
    path = tmp_path / "project.yaml"
    _write_config(path)
    first = load_config(path)
    changed = path.read_text(encoding="utf-8").replace("epochs: 100", "epochs: 99")
    path.write_text(changed, encoding="utf-8")

    assert load_config(path).sha256 != first.sha256

    path.write_text(changed + "\nunknown: true\n", encoding="utf-8")
    with pytest.raises(ValidationError, match="Extra inputs"):
        load_config(path)


def test_malformed_dataset_section_is_a_validation_error(tmp_path: Path) -> None:
    path = tmp_path / "project.yaml"
    _write_config(path)
    content = path.read_text(encoding="utf-8")
    start = content.index("dataset:")
    end = content.index("training:")
    path.write_text(content[:start] + "dataset: invalid\n" + content[end:], encoding="utf-8")

    with pytest.raises(ValidationError):
        load_config(path)
