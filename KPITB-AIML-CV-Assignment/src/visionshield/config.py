"""Validated, deterministic project configuration loading."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator

from visionshield.contracts import ObjectClass


class ConfigModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, protected_namespaces=())


class ProjectMetadata(ConfigModel):
    name: str = Field(min_length=1)
    status: Literal["PLANNED", "IMPLEMENTED", "EVALUATED", "RELEASED", "BLOCKED"]
    environment: str = Field(min_length=1)


class DatasetConfig(ConfigModel):
    roboflow_workspace: str
    roboflow_project: str
    raw_version: str
    augmented_version: str
    split_manifest: Path
    image_size: int = Field(ge=320, le=1280)


class TrainingConfig(ConfigModel):
    framework: Literal["ultralytics"]
    version: str = Field(pattern=r"^\d+\.\d+\.\d+$")
    model: str = Field(min_length=1)
    epochs: int = Field(gt=0)
    patience: int = Field(ge=0)
    batch: int | str
    seed: int = Field(ge=0)
    device: int | str
    online_augmentation: Literal["DISABLED_FOR_E1_E2_ABLATION"]


class InferenceConfig(ConfigModel):
    confidence: float | str
    iou: float | str
    max_detections: int = Field(gt=0)


class TrackingConfig(ConfigModel):
    tracker: Literal["bytetrack"]
    config: str


class GovernanceConfig(ConfigModel):
    human_review_required: Literal[True]
    facial_recognition: Literal[False]
    cross_camera_identity: Literal[False]
    intent_inference: Literal[False]


class AppConfig(ConfigModel):
    project: ProjectMetadata
    classes: dict[int, ObjectClass]
    dataset: DatasetConfig
    training: TrainingConfig
    inference: InferenceConfig
    tracking: TrackingConfig
    governance: GovernanceConfig

    @model_validator(mode="after")
    def validate_classes(self) -> AppConfig:
        expected = {index: item for index, item in enumerate(ObjectClass)}
        if self.classes != expected:
            raise ValueError(f"classes must exactly match canonical order: {expected}")
        return self


class LoadedConfig(ConfigModel):
    config: AppConfig
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")


def _canonical_json(config: AppConfig) -> bytes:
    value = config.model_dump(mode="json")
    return json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")


def load_config(path: Path) -> LoadedConfig:
    """Load a YAML mapping, validate every field, and hash its canonical form."""

    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("configuration root must be a mapping")
    config = AppConfig.model_validate(raw)
    digest = hashlib.sha256(_canonical_json(config)).hexdigest()
    return LoadedConfig(config=config, sha256=digest)
