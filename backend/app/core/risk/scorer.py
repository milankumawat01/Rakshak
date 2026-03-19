"""8-component risk scorer with weighted aggregation."""

from datetime import datetime, timedelta
from typing import Optional

from app.core.ocr.extractor import KhatiyanExtraction
from app.core.risk.mock_govt import (
    check_chain_of_title,
    check_dc_permission,
    check_forest_boundary,
    check_mutation_history,
)
from app.core.tribal_surnames import detect_tribal_from_name, is_tribal_surname

# Component weights (must sum to 1.0)
WEIGHTS = {
    "ocr_confidence": 0.10,
    "tribal_status": 0.25,
    "dc_permission": 0.15,
    "forest_risk": 0.15,
    "mutation_history": 0.10,
    "khatiyan_age": 0.05,
    "chain_of_title": 0.10,
    "poa_abuse": 0.10,
}


def _score_ocr_confidence(extraction: KhatiyanExtraction) -> int:
    """overall_confidence * 100"""
    return int(extraction.overall_confidence * 100)


def _score_tribal_status(extraction: KhatiyanExtraction, buyer_tribal: bool) -> tuple[int, bool]:
    """
    T + non-tribal buyer = 0 (HARD OVERRIDE trigger)
    T + tribal buyer = 100
    H = 80
    UNKNOWN = tries surname detection, then 20

    Returns (score, surname_detected) where surname_detected indicates
    whether tribal status was inferred from the surname database.
    """
    status = (extraction.tribal_status or "UNKNOWN").upper()
    if status == "T":
        return (100 if buyer_tribal else 0), False
    if status == "H":
        return 80, False

    # UNKNOWN — try to infer from owner surname
    is_tribal, confidence = detect_tribal_from_name(extraction.owner_name or "")
    if is_tribal and confidence >= 0.85:
        # Treat as tribal land
        return (100 if buyer_tribal else 0), True

    return 20, False


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


def _score_poa_abuse(poa_count: int) -> int:
    """0 PoA = 100 (safe), 1-2 = 60 (caution), 3+ = 0 (RED FLAG)."""
    if poa_count >= 3:
        return 0
    if poa_count >= 1:
        return 60
    return 100


def detect_discrepancies(
    extraction: KhatiyanExtraction,
    seller_name: Optional[str] = None,
    village_name: Optional[str] = None,
    plot_number: Optional[str] = None,
) -> list[dict]:
    """Compare OCR-extracted values against user-entered values.
    Returns list of discrepancy dicts."""
    discrepancies = []

    def _fuzzy_match(a: str, b: str) -> float:
        """Simple token-overlap similarity (0.0-1.0)."""
        if not a or not b:
            return 1.0  # can't compare, assume OK
        ta = set(a.strip().lower().split())
        tb = set(b.strip().lower().split())
        if not ta or not tb:
            return 1.0
        overlap = len(ta & tb)
        return overlap / max(len(ta), len(tb))

    # Owner name vs seller name
    if seller_name and extraction.owner_name:
        score = _fuzzy_match(extraction.owner_name, seller_name)
        if score < 0.5:
            discrepancies.append({
                "field": "owner_name",
                "ocr_value": extraction.owner_name,
                "user_value": seller_name,
                "match_score": round(score, 2),
            })

    # Plot number
    if plot_number and extraction.plot_number:
        if extraction.plot_number.strip() != plot_number.strip():
            discrepancies.append({
                "field": "plot_number",
                "ocr_value": extraction.plot_number,
                "user_value": plot_number,
                "match_score": 0.0,
            })

    # Village name
    if village_name and extraction.village_name:
        score = _fuzzy_match(extraction.village_name, village_name)
        if score < 0.5:
            discrepancies.append({
                "field": "village_name",
                "ocr_value": extraction.village_name,
                "user_value": village_name,
                "match_score": round(score, 2),
            })

    return discrepancies


def evaluate_cnt_compliance(
    extraction: KhatiyanExtraction,
    buyer_tribal: bool,
) -> dict:
    """Evaluate CNT Act compliance and return structured result."""
    status = (extraction.tribal_status or "UNKNOWN").upper()

    # Check surname-based tribal detection
    surname = extraction.surname or ""
    surname_match = is_tribal_surname(surname)
    if not surname_match and extraction.owner_name:
        is_tribal, conf = detect_tribal_from_name(extraction.owner_name)
        surname_match = is_tribal and conf >= 0.85

    # Determine if CNT applies
    cnt_applicable = status == "T" or surname_match

    if not cnt_applicable:
        return {
            "cnt_applicable": False,
            "cnt_status": "PASS",
            "who_can_buy": ["Any buyer — CNT restrictions do not apply"],
            "permissions_needed": [],
            "tribal_surname_match": surname_match,
            "reason": "Land is not classified as tribal under CNT Act.",
        }

    # CNT applies — check buyer eligibility
    if buyer_tribal:
        return {
            "cnt_applicable": True,
            "cnt_status": "PASS",
            "who_can_buy": ["ST (Scheduled Tribe) buyers"],
            "permissions_needed": [],
            "tribal_surname_match": surname_match,
            "reason": "Tribal land being purchased by tribal buyer. Transaction is compliant with CNT Act.",
        }

    # Non-tribal buyer on tribal land
    dc_ref = extraction.dc_permission_ref
    if dc_ref:
        return {
            "cnt_applicable": True,
            "cnt_status": "NEEDS_REVIEW",
            "who_can_buy": [
                "Only ST (Scheduled Tribe) buyers without DC permission",
                "Non-tribal buyers with valid DC permission under Section 49 CNT Act",
            ],
            "permissions_needed": [
                f"DC Permission found (Ref: {dc_ref}) — verify validity and expiry (1 year limit)",
            ],
            "tribal_surname_match": surname_match,
            "reason": "DC permission reference found but must be verified for validity and expiry date.",
        }

    return {
        "cnt_applicable": True,
        "cnt_status": "FAIL",
        "who_can_buy": ["Only ST (Scheduled Tribe) buyers"],
        "permissions_needed": [
            "DC (District Collector) permission required under Section 49 of CNT Act",
            "Permission is valid for 1 year from date of issue",
        ],
        "tribal_surname_match": surname_match,
        "reason": "Tribal land cannot be transferred to non-tribal buyer without DC permission. No DC permission found.",
    }


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


def _build_flags(scores: dict, surname_detected: bool = False, discrepancies: list = None) -> list:
    flags = []
    if scores["tribal_status"] == 0:
        flags.append("CNT_ACT_VIOLATION: Tribal land transfer to non-tribal buyer")
    if surname_detected:
        flags.append("TRIBAL_SURNAME_DETECTED: Owner surname matches CNT tribal community list")
    if scores.get("poa_abuse", 100) == 0:
        flags.append("POA_ABUSE: 3+ Power of Attorney transactions detected — high fraud risk")
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
    if discrepancies:
        for d in discrepancies:
            flags.append(
                f"DATA_MISMATCH: {d['field']} — OCR extracted \"{d['ocr_value']}\" "
                f"but user entered \"{d['user_value']}\" (match: {d['match_score']})"
            )
    return flags


def calculate_risk(
    extraction: KhatiyanExtraction,
    buyer_tribal: bool,
    village_name: Optional[str] = None,
    plot_number: Optional[str] = None,
    seller_name: Optional[str] = None,
) -> dict:
    """
    Main risk calculation entry point.
    Returns full risk assessment dict ready for DB storage and API response.
    """
    # Use extraction values if not provided
    plot = plot_number or extraction.plot_number
    village = village_name or extraction.village_name

    # Calculate all 8 component scores
    tribal_score, surname_detected = _score_tribal_status(extraction, buyer_tribal)
    poa_count = getattr(extraction, "poa_count", 0) or 0
    scores = {
        "ocr_confidence": _score_ocr_confidence(extraction),
        "tribal_status": tribal_score,
        "dc_permission": _score_dc_permission(plot, village),
        "forest_risk": _score_forest_risk(village, plot),
        "mutation_history": _score_mutation_history(plot),
        "khatiyan_age": _score_khatiyan_age(extraction.last_mutation_date),
        "chain_of_title": _score_chain_of_title(plot),
        "poa_abuse": _score_poa_abuse(poa_count),
    }

    # Discrepancy detection (OCR vs user-entered)
    discrepancies = detect_discrepancies(extraction, seller_name, village_name, plot_number)

    # CNT compliance evaluation
    cnt_compliance = evaluate_cnt_compliance(extraction, buyer_tribal)

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
    flags = _build_flags(scores, surname_detected, discrepancies)

    return {
        "ocr_confidence_score": scores["ocr_confidence"],
        "tribal_status_score": scores["tribal_status"],
        "dc_permission_score": scores["dc_permission"],
        "forest_risk_score": scores["forest_risk"],
        "mutation_history_score": scores["mutation_history"],
        "khatiyan_age_score": scores["khatiyan_age"],
        "chain_of_title_score": scores["chain_of_title"],
        "poa_abuse_score": scores["poa_abuse"],
        "final_risk_score": final_score,
        "risk_level": level,
        "recommendation": rec,
        "flags": flags,
        "checklist": checklist,
        "discrepancies": discrepancies,
        "cnt_compliance": cnt_compliance,
    }
