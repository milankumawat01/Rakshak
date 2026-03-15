"""Unified OCR strategy: Tesseract primary, Gemini Vision fallback."""

import os
import re
from dataclasses import dataclass
from typing import Optional

import pytesseract
from PIL import Image

from app.core.ocr.gemini_client import GeminiVisionClient

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
    tribal_status: str = "UNKNOWN"  # T / H / UNKNOWN
    tribal_confidence: float = 0.0
    last_mutation_date: Optional[str] = None
    mutation_confidence: float = 0.0
    village_name: Optional[str] = None
    extraction_language: str = "mixed"
    overall_confidence: float = 0.0
    requires_manual_review: bool = True
    raw_text: str = ""
    ocr_engine_used: str = ""

    def to_dict(self) -> dict:
        return {
            "plot_number": self.plot_number,
            "plot_confidence": self.plot_confidence,
            "khata_number": self.khata_number,
            "khata_confidence": self.khata_confidence,
            "area_bigha": self.area_bigha,
            "area_confidence": self.area_confidence,
            "owner_name": self.owner_name,
            "owner_confidence": self.owner_confidence,
            "tribal_status": self.tribal_status,
            "tribal_confidence": self.tribal_confidence,
            "last_mutation_date": self.last_mutation_date,
            "mutation_confidence": self.mutation_confidence,
            "village_name": self.village_name,
            "extraction_language": self.extraction_language,
            "overall_confidence": self.overall_confidence,
            "requires_manual_review": self.requires_manual_review,
            "raw_text": self.raw_text,
            "ocr_engine_used": self.ocr_engine_used,
        }


# Field pairs: (value_key, confidence_key)
_FIELDS = [
    ("plot_number", "plot_confidence"),
    ("khata_number", "khata_confidence"),
    ("area_bigha", "area_confidence"),
    ("owner_name", "owner_confidence"),
    ("tribal_status", "tribal_confidence"),
    ("last_mutation_date", "mutation_confidence"),
]


def _tesseract_extract(image_path: str) -> dict:
    """Run Tesseract OCR and attempt basic field extraction from raw text."""
    try:
        img = Image.open(image_path)
        # Try Hindi + English first, fall back to English only if hin not available
        try:
            raw_text = pytesseract.image_to_string(img, lang="hin+eng", config="--psm 6")
            data = pytesseract.image_to_data(img, lang="hin+eng", config="--psm 6", output_type=pytesseract.Output.DICT)
        except pytesseract.TesseractError:
            raw_text = pytesseract.image_to_string(img, lang="eng", config="--psm 6")
            data = pytesseract.image_to_data(img, lang="eng", config="--psm 6", output_type=pytesseract.Output.DICT)

        # Calculate average confidence from Tesseract word confidences
        confidences = [int(c) for c in data["conf"] if int(c) > 0]
        avg_conf = sum(confidences) / len(confidences) / 100.0 if confidences else 0.0

        result = {
            "raw_text": raw_text,
            "overall_confidence": avg_conf,
        }

        # Try to extract plot number (digits near "खाता" or "plot")
        plot_match = re.search(r"(?:plot|प्लॉट|खेसरा)[^\d]{0,10}(\d+)", raw_text, re.IGNORECASE)
        if plot_match:
            result["plot_number"] = plot_match.group(1)
            result["plot_confidence"] = min(avg_conf + 0.1, 1.0)

        # Try to extract khata number
        khata_match = re.search(r"(?:khata|खाता)[^\d]{0,10}(\d+)", raw_text, re.IGNORECASE)
        if khata_match:
            result["khata_number"] = khata_match.group(1)
            result["khata_confidence"] = min(avg_conf + 0.1, 1.0)

        # Try to extract area in bigha
        area_match = re.search(r"(\d+\.?\d*)\s*(?:बीघा|bigha|acre)", raw_text, re.IGNORECASE)
        if area_match:
            result["area_bigha"] = float(area_match.group(1))
            result["area_confidence"] = min(avg_conf + 0.1, 1.0)

        # Try to extract date (YYYY-MM-DD or DD/MM/YYYY)
        date_match = re.search(r"(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})", raw_text)
        if date_match:
            result["last_mutation_date"] = date_match.group(1)
            result["mutation_confidence"] = min(avg_conf + 0.1, 1.0)

        return result
    except Exception as e:
        print(f"[Tesseract] Error: {e}")
        return {"raw_text": "", "overall_confidence": 0.0}


def _merge_extractions(tesseract: dict, gemini: dict) -> dict:
    """Merge two extraction results, taking the higher-confidence value per field."""
    merged = {}

    for value_key, conf_key in _FIELDS:
        t_conf = tesseract.get(conf_key, 0.0) or 0.0
        g_conf = gemini.get(conf_key, 0.0) or 0.0

        if g_conf >= t_conf:
            merged[value_key] = gemini.get(value_key)
            merged[conf_key] = g_conf
        else:
            merged[value_key] = tesseract.get(value_key)
            merged[conf_key] = t_conf

    # Non-field attributes
    merged["village_name"] = gemini.get("village_name") or tesseract.get("village_name")
    merged["extraction_language"] = gemini.get("extraction_language", "mixed")
    merged["raw_text"] = tesseract.get("raw_text", "")

    return merged


def _compute_overall_confidence(data: dict) -> float:
    """Average of all per-field confidences."""
    confs = [data.get(conf_key, 0.0) or 0.0 for _, conf_key in _FIELDS]
    return sum(confs) / len(confs) if confs else 0.0


def extract_khatiyan(image_path: str) -> KhatiyanExtraction:
    """
    Main extraction entry point.
    1. Run Tesseract
    2. If confidence < threshold, call Gemini Vision
    3. Merge results (higher confidence wins per field)
    4. Return KhatiyanExtraction
    """
    # Step 1: Tesseract
    tesseract_result = _tesseract_extract(image_path)
    tesseract_conf = tesseract_result.get("overall_confidence", 0.0)
    engine_used = "tesseract"

    gemini_result = {}

    # Step 2: Gemini fallback if Tesseract confidence is low
    if tesseract_conf < CONFIDENCE_THRESHOLD:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key and api_key != "your-gemini-api-key-here":
            try:
                client = GeminiVisionClient(api_key)
                gemini_result = client.extract(image_path)
                engine_used = "tesseract+gemini"
            except Exception as e:
                print(f"[Extractor] Gemini fallback failed: {e}")

    # Step 3: Merge
    if gemini_result:
        merged = _merge_extractions(tesseract_result, gemini_result)
    else:
        merged = tesseract_result

    # Step 4: Compute overall confidence
    overall = _compute_overall_confidence(merged)

    return KhatiyanExtraction(
        plot_number=merged.get("plot_number"),
        plot_confidence=merged.get("plot_confidence", 0.0) or 0.0,
        khata_number=merged.get("khata_number"),
        khata_confidence=merged.get("khata_confidence", 0.0) or 0.0,
        area_bigha=merged.get("area_bigha"),
        area_confidence=merged.get("area_confidence", 0.0) or 0.0,
        owner_name=merged.get("owner_name"),
        owner_confidence=merged.get("owner_confidence", 0.0) or 0.0,
        tribal_status=merged.get("tribal_status", "UNKNOWN") or "UNKNOWN",
        tribal_confidence=merged.get("tribal_confidence", 0.0) or 0.0,
        last_mutation_date=merged.get("last_mutation_date"),
        mutation_confidence=merged.get("mutation_confidence", 0.0) or 0.0,
        village_name=merged.get("village_name"),
        extraction_language=merged.get("extraction_language", "mixed"),
        overall_confidence=overall,
        requires_manual_review=overall < CONFIDENCE_THRESHOLD,
        raw_text=merged.get("raw_text", ""),
        ocr_engine_used=engine_used,
    )
