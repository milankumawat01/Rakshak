"""Gemini Vision API wrapper for Khatiyan document OCR."""

import json
import re
from pathlib import Path

import google.generativeai as genai


class GeminiVisionClient:
    MODEL = "gemini-2.0-flash"  # cheapest, fast enough for demo

    PROMPT = """
    You are reading a Jharkhand (India) land document called a Khatiyan.
    Extract ONLY these fields. Return ONLY valid JSON, no explanation.
    {
      "plot_number": "string or null",
      "plot_confidence": 0.0-1.0,
      "khata_number": "string or null",
      "khata_confidence": 0.0-1.0,
      "area_bigha": number_or_null,
      "area_confidence": 0.0-1.0,
      "owner_name": "string or null",
      "owner_confidence": 0.0-1.0,
      "tribal_status": "T or H or UNKNOWN",
      "tribal_confidence": 0.0-1.0,
      "last_mutation_date": "YYYY-MM-DD or null",
      "mutation_confidence": 0.0-1.0,
      "village_name": "string or null",
      "extraction_language": "hindi or english or mixed"
    }
    tribal_status: T=Tribal/ST, H=Non-tribal/OBC/General
    Confidence: 1.0=certain, 0.5=unsure, 0.0=not found
    """

    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(self.MODEL)

    def extract(self, image_path: str) -> dict:
        try:
            img_data = Path(image_path).read_bytes()
            ext = Path(image_path).suffix.lower().strip(".")
            mime = {
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "png": "image/png",
                "pdf": "application/pdf",
            }.get(ext, "image/jpeg")
            response = self.model.generate_content([
                {"mime_type": mime, "data": img_data},
                self.PROMPT,
            ])
            raw = response.text.strip()
            raw = re.sub(r"```(?:json)?", "", raw).strip("` \n")
            return json.loads(raw)
        except Exception as e:
            print(f"[Gemini] Error: {e}")
            return {}  # safe empty fallback — never crash
