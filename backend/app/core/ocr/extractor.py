"""OCR extraction using OpenRouter + Claude Vision."""

import os
from dataclasses import dataclass
from typing import Optional

from app.core.ocr.openrouter_client import OpenRouterClient

CONFIDENCE_THRESHOLD = float(os.getenv("OCR_CONFIDENCE_THRESHOLD", "0.75"))


@dataclass
class KhatiyanExtraction:
    plot_number: Optional[str] = None
    plot_confidence: float = 0.0
    khata_number: Optional[str] = None
    khata_confidence: float = 0.0
    area_bigha: Optional[float] = None
    area_confidence: float = 0.0
    owner_name: Optional[str] = None
    owner_confidence: float = 0.0
    surname: Optional[str] = None
    surname_confidence: float = 0.0
    tribal_status: str = "UNKNOWN"  # T / H / UNKNOWN
    tribal_confidence: float = 0.0
    last_mutation_date: Optional[str] = None
    mutation_confidence: float = 0.0
    first_registration_date: Optional[str] = None
    first_reg_confidence: float = 0.0
    land_use_type: Optional[str] = None  # Agricultural / Residential / Forest
    land_use_confidence: float = 0.0
    mutation_type: Optional[str] = None  # Sale / Gift / Inheritance / Partition
    mutation_type_confidence: float = 0.0
    village_name: Optional[str] = None
    extraction_language: str = "mixed"
    overall_confidence: float = 0.0
    requires_manual_review: bool = True
    raw_text: str = ""
    ocr_engine_used: str = ""
    vanshavali: Optional[list] = None  # [{name, relationship, generation}]
    co_heirs: Optional[list] = None  # [{name, relationship, noc_status}]
    dc_permission_ref: Optional[str] = None
    poa_count: int = 0


# Field pairs: (value_key, confidence_key)
_FIELDS = [
    ("plot_number", "plot_confidence"),
    ("khata_number", "khata_confidence"),
    ("area_bigha", "area_confidence"),
    ("owner_name", "owner_confidence"),
    ("surname", "surname_confidence"),
    ("tribal_status", "tribal_confidence"),
    ("last_mutation_date", "mutation_confidence"),
    ("first_registration_date", "first_reg_confidence"),
    ("land_use_type", "land_use_confidence"),
    ("mutation_type", "mutation_type_confidence"),
]


def _compute_overall_confidence(data: dict) -> float:
    """Average of all per-field confidences."""
    confs = [data.get(conf_key, 0.0) or 0.0 for _, conf_key in _FIELDS]
    return sum(confs) / len(confs) if confs else 0.0


def extract_khatiyan(image_path: str) -> KhatiyanExtraction:
    """
    Main extraction entry point.
    Sends document image to Claude Vision via OpenRouter, returns structured extraction.
    """
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY not set")

    client = OpenRouterClient(api_key)
    result = client.extract(image_path)

    overall = _compute_overall_confidence(result)

    return KhatiyanExtraction(
        plot_number=result.get("plot_number"),
        plot_confidence=result.get("plot_confidence", 0.0) or 0.0,
        khata_number=result.get("khata_number"),
        khata_confidence=result.get("khata_confidence", 0.0) or 0.0,
        area_bigha=result.get("area_bigha"),
        area_confidence=result.get("area_confidence", 0.0) or 0.0,
        owner_name=result.get("owner_name"),
        owner_confidence=result.get("owner_confidence", 0.0) or 0.0,
        surname=result.get("surname"),
        surname_confidence=result.get("surname_confidence", 0.0) or 0.0,
        tribal_status=result.get("tribal_status", "UNKNOWN") or "UNKNOWN",
        tribal_confidence=result.get("tribal_confidence", 0.0) or 0.0,
        last_mutation_date=result.get("last_mutation_date"),
        mutation_confidence=result.get("mutation_confidence", 0.0) or 0.0,
        first_registration_date=result.get("first_registration_date"),
        first_reg_confidence=result.get("first_reg_confidence", 0.0) or 0.0,
        land_use_type=result.get("land_use_type"),
        land_use_confidence=result.get("land_use_confidence", 0.0) or 0.0,
        mutation_type=result.get("mutation_type"),
        mutation_type_confidence=result.get("mutation_type_confidence", 0.0) or 0.0,
        village_name=result.get("village_name"),
        extraction_language=result.get("extraction_language", "mixed"),
        overall_confidence=overall,
        requires_manual_review=overall < CONFIDENCE_THRESHOLD,
        raw_text=result.get("raw_text", ""),
        ocr_engine_used="openrouter/claude-sonnet",
        vanshavali=result.get("vanshavali"),
        co_heirs=result.get("co_heirs"),
        dc_permission_ref=result.get("dc_permission_ref"),
        poa_count=int(result.get("poa_count", 0) or 0),
    )
