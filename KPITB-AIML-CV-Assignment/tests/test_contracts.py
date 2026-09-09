from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from pydantic import ValidationError

from visionshield.contracts import (
    BoundingBox,
    DetectionV1,
    EventType,
    EventV1,
    Point,
    ReviewStatus,
    VirtualLineV1,
    ZoneType,
    ZoneV1,
)


def test_bounding_box_requires_positive_extent() -> None:
    with pytest.raises(ValidationError, match="positive width"):
        BoundingBox(x1=0.5, y1=0.1, x2=0.5, y2=0.9)


def test_zone_requires_three_unique_points() -> None:
    point = Point(x=0.1, y=0.1)
    with pytest.raises(ValidationError, match="three unique"):
        ZoneV1(
            zone_id=uuid4(),
            name="Restricted storage",
            zone_type=ZoneType.RESTRICTED,
            polygon=(point, Point(x=0.8, y=0.1), point),
            version=1,
        )


@pytest.mark.parametrize(
    "polygon, message",
    [
        ((Point(x=0.1, y=0.1), Point(x=0.2, y=0.2), Point(x=0.3, y=0.3)), "non-zero"),
        (
            (
                Point(x=0.1, y=0.1),
                Point(x=0.9, y=0.9),
                Point(x=0.1, y=0.9),
                Point(x=0.9, y=0.1),
            ),
            "self-intersect",
        ),
        (
            (
                Point(x=0.0, y=0.0),
                Point(x=1.0, y=0.0),
                Point(x=1.0, y=1.0),
                Point(x=0.0, y=1.0),
                Point(x=1.0, y=0.0),
            ),
            "repeat vertices",
        ),
    ],
)
def test_zone_rejects_invalid_geometry(polygon: tuple[Point, ...], message: str) -> None:
    with pytest.raises(ValidationError, match=message):
        ZoneV1(
            zone_id=uuid4(),
            name="Invalid",
            zone_type=ZoneType.RESTRICTED,
            polygon=polygon,
            version=1,
        )


def test_virtual_line_endpoints_must_differ() -> None:
    point = Point(x=0.2, y=0.2)
    with pytest.raises(ValidationError, match="endpoints must differ"):
        VirtualLineV1(
            line_id=uuid4(),
            name="Entry",
            start=point,
            end=point,
            cooldown_ms=1000,
            version=1,
        )


def test_event_cannot_close_before_opening() -> None:
    opened_at = datetime.now(UTC)
    with pytest.raises(ValidationError, match="close before"):
        EventV1(
            event_id=uuid4(),
            event_type=EventType.RESTRICTED_ZONE_ENTRY,
            camera_id="CAM-001",
            opened_at=opened_at,
            closed_at=opened_at - timedelta(seconds=1),
            track_ids=(12,),
            risk_score=30,
            risk_factors=(),
            review_status=ReviewStatus.UNREVIEWED,
            rule_version="1.0",
        )


def test_contract_requires_known_schema_and_timezone() -> None:
    data = {
        "schema_version": "2.0",
        "camera_id": "CAM-001",
        "frame_index": 0,
        "observed_at": datetime.now(),
        "object_class": "person",
        "confidence": 0.9,
        "box": {"x1": 0.1, "y1": 0.1, "x2": 0.4, "y2": 0.8},
        "model_version": "test",
    }
    with pytest.raises(ValidationError):
        DetectionV1.model_validate(data)
