"""7-component risk scorer with weighted aggregation."""

from datetime import datetime, timedelta
from typing import Optional

from app.core.ocr.extractor import KhatiyanExtraction
from app.core.risk.mock_govt import (
    check_chain_of_title,
    check_dc_permission,
    check_forest_boundary,
    check_mutation_history,
)

# Component weights (must sum to 1.0)
WEIGHTS = {
    "ocr_confidence": 0.15,
    "tribal_status": 0.25,
    "dc_permission": 0.20,
    "forest_risk": 0.15,
    "mutation_history": 0.10,
    "khatiyan_age": 0.05,
    "chain_of_title": 0.10,
}


def _score_ocr_confidence(extraction: KhatiyanExtraction) -> int:
    """overall_confidence * 100"""
    return int(extraction.overall_confidence * 100)


def _score_tribal_status(extraction: KhatiyanExtraction, buyer_tribal: bool) -> int:
    """
    T + non-tribal buyer = 0 (HARD OVERRIDE trigger)
    T + tribal buyer = 100
    H = 80
    UNKNOWN = 20
    """
    status = (extraction.tribal_status or "UNKNOWN").upper()
    if status == "T":
        return 100 if buyer_tribal else 0
    if status == "H":
        return 80
    return 20  # UNKNOWN


def _score_dc_permission(plot_number: Optional[str], village: Optional[str]) -> int:
    result = check_dc_permission(plot_number or "", village or "")
    return result.get("score", 0)


def _score_forest_risk(village: Optional[str], plot_number: Optional[str]) -> int:
    result = check_forest_boundary(village or "", plot_number or "")
    return result.get("score", 0)


def _score_mutation_history(plot_number: Optional[str]) -> int:
    result = check_mutation_history(plot_number or "")
    return result.get("score", 0)


def _score_khatiyan_age(last_mutation_date: Optional[str]) -> int:
    """
    Mutation <1yr ago = 100
    Never mutated = 10
    >10yr = 20
    Otherwise scale between 20-100
    """
    if not last_mutation_date:
        return 10  # Never mutated

    try:
        mutation_dt = datetime.strptime(last_mutation_date[:10], "%Y-%m-%d")
    except (ValueError, TypeError):
        return 10

    age = datetime.utcnow() - mutation_dt
    if age < timedelta(days=365):
        return 100
    if age > timedelta(days=365 * 10):
        return 20
    # Linear scale: 1yr=100 -> 10yr=20
    years = age.days / 365.0
    return int(100 - (years - 1) * (80 / 9))


def _score_chain_of_title(plot_number: Optional[str]) -> int:
    result = check_chain_of_title(plot_number or "")
    return result.get("score", 0)


def _risk_level(score: int) -> str:
    if score <= 25:
        return "GREEN"
    if score <= 60:
        return "YELLOW"
    if score <= 85:
        return "ORANGE"
    return "RED"


def _recommendation(level: str) -> str:
    return {"GREEN": "APPROVE", "YELLOW": "REVIEW", "ORANGE": "REVIEW", "RED": "REJECT"}.get(level, "REVIEW")


def _build_checklist(scores: dict, extraction: KhatiyanExtraction) -> dict:
    return {
        "tribal_valid": scores["tribal_status"] > 0,
        "dc_permission": scores["dc_permission"] >= 100,
        "forest_clear": scores["forest_risk"] >= 100,
        "mutation_clean": scores["mutation_history"] >= 100,
        "chain_complete": scores["chain_of_title"] >= 100,
    }


def _build_flags(scores: dict) -> list:
    flags = []
    if scores["tribal_status"] == 0:
        flags.append("CNT_ACT_VIOLATION: Tribal land transfer to non-tribal buyer")
    if scores["dc_permission"] < 40:
        flags.append("DC_PERMISSION_MISSING: No valid DC permission found")
    if scores["forest_risk"] < 50:
        flags.append("FOREST_RISK: Land may be in forest or eco-sensitive zone")
    if scores["mutation_history"] < 50:
        flags.append("MUTATION_SUSPICIOUS: Suspicious mutation activity detected")
    if scores["chain_of_title"] < 50:
        flags.append("CHAIN_INCOMPLETE: Ownership chain has gaps")
    if scores["ocr_confidence"] < 50:
        flags.append("LOW_OCR_CONFIDENCE: Document extraction confidence is low")
    return flags


def calculate_risk(
    extraction: KhatiyanExtraction,
    buyer_tribal: bool,
    village_name: Optional[str] = None,
    plot_number: Optional[str] = None,
) -> dict:
    """
    Main risk calculation entry point.
    Returns full risk assessment dict ready for DB storage and API response.
    """
    # Use extraction values if not provided
    plot = plot_number or extraction.plot_number
    village = village_name or extraction.village_name

    # Calculate all 7 component scores
    scores = {
        "ocr_confidence": _score_ocr_confidence(extraction),
        "tribal_status": _score_tribal_status(extraction, buyer_tribal),
        "dc_permission": _score_dc_permission(plot, village),
        "forest_risk": _score_forest_risk(village, plot),
        "mutation_history": _score_mutation_history(plot),
        "khatiyan_age": _score_khatiyan_age(extraction.last_mutation_date),
        "chain_of_title": _score_chain_of_title(plot),
    }

    # Weighted average of component scores (0-100, higher = safer)
    # Invert to get risk score (0-100, higher = riskier)
    safety_score = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
    final_score = max(0, min(100, int(100 - safety_score)))

    level = _risk_level(final_score)
    rec = _recommendation(level)

    # HARD OVERRIDE: CNT Act compliance
    if scores["tribal_status"] == 0:
        level = "RED"
        rec = "REJECT"

    checklist = _build_checklist(scores, extraction)
    flags = _build_flags(scores)

    return {
        "ocr_confidence_score": scores["ocr_confidence"],
        "tribal_status_score": scores["tribal_status"],
        "dc_permission_score": scores["dc_permission"],
        "forest_risk_score": scores["forest_risk"],
        "mutation_history_score": scores["mutation_history"],
        "khatiyan_age_score": scores["khatiyan_age"],
        "chain_of_title_score": scores["chain_of_title"],
        "final_risk_score": final_score,
        "risk_level": level,
        "recommendation": rec,
        "flags": flags,
        "checklist": checklist,
    }
