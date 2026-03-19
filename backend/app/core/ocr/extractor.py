"""Unified OCR strategy: Tesseract primary, OpenAI Vision fallback."""

import os
import re
from dataclasses import dataclass
from typing import Optional

import pytesseract
from PIL import Image

from app.core.ocr.openai_client import OpenAIVisionClient

# Configure Tesseract path for Windows
_tesseract_paths = [
    os.getenv("TESSERACT_CMD", ""),
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
    os.path.join(os.path.expanduser("~"), "AppData", "Local", "Programs", "Tesseract-OCR", "tesseract.exe"),
]
for _path in _tesseract_paths:
    if _path and os.path.isfile(_path):
        pytesseract.pytesseract.tesseract_cmd = _path
        print(f"[Tesseract] Found at: {_path}")
        break

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


def _pdf_to_image(pdf_path: str) -> Image.Image:
    """Convert first page of PDF to a high-res PIL Image using PyMuPDF."""
    import fitz  # PyMuPDF
    doc = fitz.open(pdf_path)
    page = doc[0]
    # Render at 2x resolution for better OCR
    mat = fitz.Matrix(2.0, 2.0)
    pix = page.get_pixmap(matrix=mat)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    doc.close()
    return img


def _preprocess_image(img: Image.Image) -> Image.Image:
    """Preprocess image for better OCR: auto-rotate, grayscale, contrast."""
    # Convert to RGB if needed
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # Auto-rotate using EXIF data (phone photos are often rotated)
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass

    # Convert to grayscale
    if img.mode != "L":
        img = img.convert("L")

    # Enhance contrast using auto-contrast
    try:
        from PIL import ImageOps
        img = ImageOps.autocontrast(img, cutoff=2)
    except Exception:
        pass

    # If image is very large, resize to max 3000px on longest side
    max_dim = 3000
    if max(img.size) > max_dim:
        ratio = max_dim / max(img.size)
        img = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.LANCZOS)

    return img


def _try_rotations(img: Image.Image) -> tuple[str, dict, float]:
    """Try OCR at 0° and 90° rotations, return best result."""
    best_text = ""
    best_data = {"conf": []}
    best_conf = 0.0

    for angle in [0, 270, 90]:
        rotated = img.rotate(angle, expand=True) if angle else img
        try:
            try:
                text = pytesseract.image_to_string(rotated, lang="hin+eng", config="--psm 6")
                data = pytesseract.image_to_data(rotated, lang="hin+eng", config="--psm 6", output_type=pytesseract.Output.DICT)
            except pytesseract.TesseractError:
                text = pytesseract.image_to_string(rotated, lang="eng", config="--psm 6")
                data = pytesseract.image_to_data(rotated, lang="eng", config="--psm 6", output_type=pytesseract.Output.DICT)

            confs = [int(c) for c in data["conf"] if int(c) > 0]
            avg = sum(confs) / len(confs) / 100.0 if confs else 0.0

            if avg > best_conf:
                best_text = text
                best_data = data
                best_conf = avg

            # If good enough, stop trying
            if avg > 0.5:
                break
        except Exception:
            continue

    return best_text, best_data, best_conf


def _tesseract_extract(image_path: str) -> dict:
    """Run Tesseract OCR with preprocessing and field extraction."""
    try:
        # Handle PDF files by converting to image first
        if image_path.lower().endswith(".pdf"):
            img = _pdf_to_image(image_path)
        else:
            img = Image.open(image_path)

        img = _preprocess_image(img)

        # Try rotations to handle phone photos taken sideways
        raw_text, data, avg_conf = _try_rotations(img)

        result = {
            "raw_text": raw_text,
            "overall_confidence": avg_conf,
        }

        # --- Khesra / Plot number ---
        # Jharkhand docs: "खेसरा संख्या" or "खेसरा" followed by numbers
        plot_match = (
            re.search(r"(?:खेसरा\s*(?:संख्या)?|plot\s*(?:no|number)?|khasra)[^\d]{0,20}([\d,\s]+\d)", raw_text, re.IGNORECASE)
            or re.search(r"(?:plot|khasra)\s*[:.\-]?\s*(\d[\d,\s]*)", raw_text, re.IGNORECASE)
        )
        if plot_match:
            result["plot_number"] = re.sub(r"\s+", "", plot_match.group(1).strip().rstrip(","))
            result["plot_confidence"] = min(avg_conf + 0.15, 1.0)

        # --- Khata number ---
        # "खाता संख्या" or "खाता" followed by number
        khata_match = (
            re.search(r"(?:खाता\s*(?:संख्या)?|khata\s*(?:no|number)?)[^\d]{0,20}(\d+)", raw_text, re.IGNORECASE)
        )
        if khata_match:
            result["khata_number"] = khata_match.group(1)
            result["khata_confidence"] = min(avg_conf + 0.15, 1.0)

        # --- Area ---
        # Jharkhand uses: एकड़ (acre), डिसमील (dismil), हेक्टर, बीघा
        area_match = (
            re.search(r"(\d+\.?\d*)\s*(?:एकड़|acre)", raw_text, re.IGNORECASE)
            or re.search(r"(\d+\.?\d*)\s*(?:डिसमील|dismil|decimal)", raw_text, re.IGNORECASE)
            or re.search(r"(\d+\.?\d*)\s*(?:बीघा|bigha)", raw_text, re.IGNORECASE)
            or re.search(r"(\d+\.?\d*)\s*(?:हेक्टर|hectare)", raw_text, re.IGNORECASE)
            or re.search(r"रकबा[^\d]{0,15}(\d+\.?\d*)", raw_text, re.IGNORECASE)
        )
        if area_match:
            result["area_bigha"] = float(area_match.group(1))
            result["area_confidence"] = min(avg_conf + 0.1, 1.0)

        # --- Owner name ---
        # Look for "नाम रेयत" or "रैयत का नाम" or name after "नाम"
        name_match = (
            re.search(r"(?:रैयत\s*(?:का)?\s*नाम|नाम\s*रेयत|name\s*of\s*raiyat)[^\n]{0,5}([^\n|,]{3,40})", raw_text, re.IGNORECASE)
            or re.search(r"(?:नाम\s*सर्कल|नाम\s*मौजा)[^\n]*?\n[^\n]*?(\b[अ-ह][ा-ो]?\s*[अ-ह\w]{2,}(?:\s+[अ-ह\w]{2,})*)", raw_text)
        )
        if name_match:
            name = name_match.group(1).strip()
            # Clean up common OCR artifacts
            name = re.sub(r"[|।\[\]{}]", "", name).strip()
            if len(name) >= 3:
                result["owner_name"] = name
                result["owner_confidence"] = min(avg_conf + 0.05, 1.0)

        # --- Dates ---
        # Multiple formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD
        all_dates = re.findall(
            r"(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{4}|\d{4}[/\-\.]\d{1,2}[/\-\.]\d{1,2})",
            raw_text,
        )
        if all_dates:
            result["last_mutation_date"] = all_dates[-1]  # Last date is usually most recent
            result["mutation_confidence"] = min(avg_conf + 0.1, 1.0)
            if len(all_dates) >= 2:
                result["first_registration_date"] = all_dates[0]
                result["first_reg_confidence"] = min(avg_conf + 0.05, 1.0)

        # --- Thana / Village ---
        # "मौजा" = village in Jharkhand records
        village_match = (
            re.search(r"(?:मौजा|village|ग्राम)[^\w]{0,10}([\w\u0900-\u097F]{3,30})", raw_text, re.IGNORECASE)
        )
        if village_match:
            result["village_name"] = village_match.group(1).strip()

        # --- Mutation type ---
        mutation_type_match = re.search(
            r"(?:sale|बिक्री|By\s*Sale|gift|दान|हिबा|inheritance|उत्तराधिकार|वंशानुक्रम|partition|बंटवारा|विभाजन)",
            raw_text, re.IGNORECASE,
        )
        if mutation_type_match:
            token = mutation_type_match.group(0).lower().strip()
            type_map = {
                "sale": "Sale", "by sale": "Sale", "बिक्री": "Sale",
                "gift": "Gift", "दान": "Gift", "हिबा": "Gift",
                "inheritance": "Inheritance", "उत्तराधिकार": "Inheritance", "वंशानुक्रम": "Inheritance",
                "partition": "Partition", "बंटवारा": "Partition", "विभाजन": "Partition",
            }
            result["mutation_type"] = type_map.get(token, "Unknown")
            result["mutation_type_confidence"] = min(avg_conf + 0.1, 1.0)

        # --- DC permission reference ---
        dc_match = re.search(
            r"(?:DC|जिला\s*समाहर्ता|collector|अनुमति)[^\d]{0,15}(\d+[/\-]\d+[/\-]?\d*)",
            raw_text, re.IGNORECASE,
        )
        if dc_match:
            result["dc_permission_ref"] = dc_match.group(1)

        # --- Land use type ---
        if re.search(r"(?:कृषि|agricultural|खेती)", raw_text, re.IGNORECASE):
            result["land_use_type"] = "Agricultural"
            result["land_use_confidence"] = min(avg_conf + 0.1, 1.0)
        elif re.search(r"(?:आवासीय|residential|वासभूमि)", raw_text, re.IGNORECASE):
            result["land_use_type"] = "Residential"
            result["land_use_confidence"] = min(avg_conf + 0.1, 1.0)
        elif re.search(r"(?:वन\s*भूमि|forest|जंगल)", raw_text, re.IGNORECASE):
            result["land_use_type"] = "Forest"
            result["land_use_confidence"] = min(avg_conf + 0.1, 1.0)

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

    # Complex/list fields — prefer Gemini (Tesseract can't extract these)
    merged["vanshavali"] = gemini.get("vanshavali") or tesseract.get("vanshavali")
    merged["co_heirs"] = gemini.get("co_heirs") or tesseract.get("co_heirs")
    merged["dc_permission_ref"] = gemini.get("dc_permission_ref") or tesseract.get("dc_permission_ref")
    merged["poa_count"] = gemini.get("poa_count") or tesseract.get("poa_count", 0) or 0

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

    vision_result = {}

    # Step 2: OpenAI Vision fallback if Tesseract confidence is low
    if tesseract_conf < CONFIDENCE_THRESHOLD:
        api_key = os.getenv("OPENAI_API_KEY", "")
        if api_key:
            try:
                client = OpenAIVisionClient(api_key)
                vision_result = client.extract(image_path)
                engine_used = "tesseract+openai"
            except Exception as e:
                print(f"[Extractor] OpenAI Vision fallback failed: {e}")

    # Step 3: Merge
    if vision_result:
        merged = _merge_extractions(tesseract_result, vision_result)
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
        surname=merged.get("surname"),
        surname_confidence=merged.get("surname_confidence", 0.0) or 0.0,
        tribal_status=merged.get("tribal_status", "UNKNOWN") or "UNKNOWN",
        tribal_confidence=merged.get("tribal_confidence", 0.0) or 0.0,
        last_mutation_date=merged.get("last_mutation_date"),
        mutation_confidence=merged.get("mutation_confidence", 0.0) or 0.0,
        first_registration_date=merged.get("first_registration_date"),
        first_reg_confidence=merged.get("first_reg_confidence", 0.0) or 0.0,
        land_use_type=merged.get("land_use_type"),
        land_use_confidence=merged.get("land_use_confidence", 0.0) or 0.0,
        mutation_type=merged.get("mutation_type"),
        mutation_type_confidence=merged.get("mutation_type_confidence", 0.0) or 0.0,
        village_name=merged.get("village_name"),
        extraction_language=merged.get("extraction_language", "mixed"),
        overall_confidence=overall,
        requires_manual_review=overall < CONFIDENCE_THRESHOLD,
        raw_text=merged.get("raw_text", ""),
        ocr_engine_used=engine_used,
        vanshavali=merged.get("vanshavali"),
        co_heirs=merged.get("co_heirs"),
        dc_permission_ref=merged.get("dc_permission_ref"),
        poa_count=int(merged.get("poa_count", 0) or 0),
    )
