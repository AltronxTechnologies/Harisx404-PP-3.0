"""Versioned contracts shared by VisionShield components."""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Annotated, Any, Literal
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

NormalizedCoordinate = Annotated[float, Field(ge=0.0, le=1.0)]
Confidence = Annotated[float, Field(ge=0.0, le=1.0)]


def _to_utc(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("timestamp must include a timezone")
    return value.astimezone(UTC)


UtcDatetime = Annotated[datetime, AfterValidator(_to_utc)]


class StrictModel(BaseModel):
    """Reject unknown fields so contract drift fails at boundaries."""

    model_config = ConfigDict(extra="forbid", frozen=True, protected_namespaces=())


class ObjectClass(StrEnum):
    PERSON = "person"
    FORKLIFT = "forklift"
    HARDHAT = "hardhat"
    HIGH_VISIBILITY_VEST = "high_visibility_vest"


class EventType(StrEnum):
    RESTRICTED_ZONE_ENTRY = "restricted_zone_entry"
    LINE_CROSSING = "line_crossing"
    AFTER_HOURS_PRESENCE = "after_hours_presence"
    PROLONGED_PRESENCE = "prolonged_presence"
    OCCUPANCY_THRESHOLD_EXCEEDED = "occupancy_threshold_exceeded"
    FORKLIFT_LANE_CO_OCCUPANCY = "forklift_lane_co_occupancy"
    PPE_VISIBILITY_WARNING = "ppe_visibility_warning"


class ReviewStatus(StrEnum):
    UNREVIEWED = "unreviewed"
    ACKNOWLEDGED = "acknowledged"
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"
    INCONCLUSIVE = "inconclusive"
    SUPPRESSED = "suppressed"


class ZoneType(StrEnum):
    PUBLIC = "public"
    MONITORING = "monitoring"
    RESTRICTED = "restricted"
    CRITICAL = "critical"
    HAZARDOUS = "hazardous"
    LOADING = "loading"
    PARKING = "parking"
    CUSTOM = "custom"


class Point(StrictModel):
    x: NormalizedCoordinate
    y: NormalizedCoordinate


class BoundingBox(StrictModel):
    x1: NormalizedCoordinate
    y1: NormalizedCoordinate
    x2: NormalizedCoordinate
    y2: NormalizedCoordinate

    @model_validator(mode="after")
    def validate_extent(self) -> BoundingBox:
        if self.x2 <= self.x1 or self.y2 <= self.y1:
            raise ValueError("bounding box must have positive width and height")
        return self


class DetectionV1(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    camera_id: str = Field(min_length=1)
    frame_index: int = Field(ge=0)
    observed_at: UtcDatetime
    object_class: ObjectClass
    confidence: Confidence
    box: BoundingBox
    model_version: str = Field(min_length=1)
    track_id: int | None = Field(default=None, ge=0)


class TrackObservationV1(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    camera_id: str = Field(min_length=1)
    stream_epoch: UUID
    track_id: int = Field(ge=0)
    object_class: ObjectClass
    frame_index: int = Field(ge=0)
    observed_at: UtcDatetime
    anchor: Point
    age_ms: int = Field(ge=0)
    quality_flags: tuple[str, ...] = ()


class ZoneV1(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    zone_id: UUID
    name: str = Field(min_length=1, max_length=120)
    zone_type: ZoneType
    polygon: tuple[Point, ...]
    capabilities: frozenset[str] = frozenset()
    version: int = Field(ge=1)

    @model_validator(mode="after")
    def validate_polygon(self) -> ZoneV1:
        if len(set(self.polygon)) < 3:
            raise ValueError("zone polygon requires at least three unique points")
        if len(set(self.polygon)) != len(self.polygon):
            raise ValueError("zone polygon cannot repeat vertices")
        if _polygon_self_intersects(self.polygon):
            raise ValueError("zone polygon must not self-intersect")
        if _polygon_area(self.polygon) == 0:
            raise ValueError("zone polygon must have non-zero area")
        return self


class VirtualLineV1(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    line_id: UUID
    name: str = Field(min_length=1, max_length=120)
    start: Point
    end: Point
    allowed_direction: str | None = None
    cooldown_ms: int = Field(ge=0)
    version: int = Field(ge=1)

    @model_validator(mode="after")
    def validate_length(self) -> VirtualLineV1:
        if self.start == self.end:
            raise ValueError("virtual line endpoints must differ")
        return self


class RiskFactorV1(StrictModel):
    code: str = Field(pattern=r"^[a-z][a-z0-9_]*$")
    points: int
    explanation: str = Field(min_length=1)


class EventV1(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    event_id: UUID
    event_type: EventType
    camera_id: str = Field(min_length=1)
    opened_at: UtcDatetime
    closed_at: UtcDatetime | None = None
    track_ids: tuple[int, ...]
    zone_id: UUID | None = None
    risk_score: int = Field(ge=0, le=100)
    risk_factors: tuple[RiskFactorV1, ...]
    review_status: ReviewStatus = ReviewStatus.UNREVIEWED
    rule_version: str = Field(min_length=1)
    evidence_id: UUID | None = None

    @model_validator(mode="after")
    def validate_time_range(self) -> EventV1:
        if self.closed_at is not None and self.closed_at < self.opened_at:
            raise ValueError("event cannot close before it opens")
        return self


class ReviewV1(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    event_id: UUID
    status: ReviewStatus
    reviewer_id: UUID
    reviewed_at: UtcDatetime
    reason_code: str = Field(pattern=r"^[a-z][a-z0-9_]*$")
    note: str | None = Field(default=None, max_length=2000)


class RunManifestV1(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    run_id: str = Field(min_length=1)
    git_commit: str = Field(pattern=r"^[0-9a-f]{40}$")
    git_dirty: bool
    data_hash: str = Field(pattern=r"^[0-9a-f]{64}$")
    config_hash: str = Field(pattern=r"^[0-9a-f]{64}$")
    model_hash: str | None = Field(default=None, pattern=r"^[0-9a-f]{64}$")
    environment: dict[str, Any]


def _polygon_area(points: tuple[Point, ...]) -> float:
    return (
        abs(
            sum(
                left.x * right.y - right.x * left.y
                for left, right in zip(points, points[1:] + points[:1], strict=True)
            )
        )
        / 2
    )


def _orientation(first: Point, second: Point, third: Point) -> float:
    return (second.x - first.x) * (third.y - first.y) - (second.y - first.y) * (third.x - first.x)


def _on_segment(first: Point, second: Point, point: Point) -> bool:
    return min(first.x, second.x) <= point.x <= max(first.x, second.x) and min(
        first.y, second.y
    ) <= point.y <= max(first.y, second.y)


def _segments_cross(a: Point, b: Point, c: Point, d: Point) -> bool:
    first = _orientation(a, b, c)
    second = _orientation(a, b, d)
    third = _orientation(c, d, a)
    fourth = _orientation(c, d, b)
    if (first > 0) != (second > 0) and (third > 0) != (fourth > 0):
        return True
    return (
        (first == 0 and _on_segment(a, b, c))
        or (second == 0 and _on_segment(a, b, d))
        or (third == 0 and _on_segment(c, d, a))
        or (fourth == 0 and _on_segment(c, d, b))
    )


def _polygon_self_intersects(points: tuple[Point, ...]) -> bool:
    edges = list(zip(points, points[1:] + points[:1], strict=True))
    for index, (a, b) in enumerate(edges):
        for other_index, (c, d) in enumerate(edges[index + 1 :], start=index + 1):
            if other_index in {index + 1, len(edges) - 1 if index == 0 else -1}:
                continue
            if _segments_cross(a, b, c, d):
                return True
    return False
