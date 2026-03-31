"""OpenRouter API client for Khatiyan document OCR using Claude Vision."""

import base64
import json
import os
import re
from pathlib import Path

import openai


class OpenRouterClient:
    MODEL = "anthropic/claude-sonnet-4-5"
    BASE_URL = "https://openrouter.ai/api/v1"

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
      "owner_name": "full name string or null",
      "owner_confidence": 0.0-1.0,
      "surname": "family/last name of owner or null",
      "surname_confidence": 0.0-1.0,
      "tribal_status": "T or H or UNKNOWN",
      "tribal_confidence": 0.0-1.0,
      "last_mutation_date": "YYYY-MM-DD or null",
      "mutation_confidence": 0.0-1.0,
      "first_registration_date": "YYYY-MM-DD or null",
      "first_reg_confidence": 0.0-1.0,
      "land_use_type": "Agricultural or Residential or Forest or Unknown",
      "land_use_confidence": 0.0-1.0,
      "mutation_type": "Sale or Gift or Inheritance or Partition or Unknown",
      "mutation_type_confidence": 0.0-1.0,
      "village_name": "string or null",
      "extraction_language": "hindi or english or mixed",
      "vanshavali": [{"name": "string", "relationship": "grandfather/father/self/brother/son/co-heir", "generation": 1}],
      "co_heirs": [{"name": "string", "relationship": "string", "noc_status": "yes/no/unknown"}],
      "dc_permission_ref": "DC permission/order number string or null",
      "poa_count": 0
    }
    tribal_status: T=Tribal/ST, H=Non-tribal/OBC/General
    vanshavali: ownership chain from oldest ancestor to current owner. generation: 1=oldest, 2=next, etc.
    co_heirs: all family members/co-heirs mentioned. noc_status: whether they gave No Objection Certificate.
    poa_count: number of Power of Attorney transactions visible in the document.
    Confidence: 1.0=certain, 0.5=unsure, 0.0=not found
    """

    def __init__(self, api_key: str):
        self.client = openai.OpenAI(
            api_key=api_key,
            base_url=self.BASE_URL,
            default_headers={
                "HTTP-Referer": "https://bhumirakshak.com",
                "X-Title": "BhomiRakshak",
            },
        )

    def extract(self, image_path: str) -> dict:
        try:
            path = Path(image_path)
            ext = path.suffix.lower().strip(".")

            # PDF: convert first page to PNG bytes using PyMuPDF
            if ext == "pdf":
                import fitz
                doc = fitz.open(str(path))
                pix = doc[0].get_pixmap(matrix=fitz.Matrix(2, 2))
                img_bytes = pix.tobytes("png")
                doc.close()
                mime = "image/png"
            else:
                img_bytes = path.read_bytes()
                mime = {
                    "jpg": "image/jpeg",
                    "jpeg": "image/jpeg",
                    "png": "image/png",
                }.get(ext, "image/jpeg")

            img_b64 = base64.standard_b64encode(img_bytes).decode()

            response = self.client.chat.completions.create(
                model=self.MODEL,
                max_tokens=2000,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime};base64,{img_b64}"},
                        },
                        {"type": "text", "text": self.PROMPT},
                    ],
                }],
            )
            raw = response.choices[0].message.content.strip()
            raw = re.sub(r"```(?:json)?", "", raw).strip("` \n")
            return json.loads(raw)
        except Exception as e:
            print(f"[OpenRouter] Error: {e}")
            return {}
