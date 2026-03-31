"""Meta WhatsApp Cloud API client for sending messages."""

import os
import httpx

GRAPH_API_VERSION = "v21.0"
BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


class WhatsAppClient:
    def __init__(self):
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")

    @property
    def _url(self):
        return f"{BASE_URL}/{self.phone_number_id}/messages"

    @property
    def _headers(self):
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    def _send(self, payload: dict) -> dict:
        try:
            resp = httpx.post(self._url, json=payload, headers=self._headers, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"[WhatsApp] Send error: {e}")
            return {}

    def send_text(self, to: str, text: str) -> dict:
        return self._send({
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text},
        })

    def send_buttons(self, to: str, body: str, buttons: list[dict]) -> dict:
        """Send interactive button message. buttons: [{id, title}] (max 3)."""
        return self._send({
            "messaging_product": "whatsapp",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": body},
                "action": {
                    "buttons": [
                        {"type": "reply", "reply": {"id": b["id"], "title": b["title"][:20]}}
                        for b in buttons[:3]
                    ]
                },
            },
        })

    def send_list(self, to: str, body: str, button_text: str, sections: list[dict]) -> dict:
        """Send interactive list message. sections: [{title, rows: [{id, title, description}]}]."""
        return self._send({
            "messaging_product": "whatsapp",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "list",
                "body": {"text": body},
                "action": {
                    "button": button_text[:20],
                    "sections": sections,
                },
            },
        })

    def download_media(self, media_id: str) -> bytes | None:
        """Download media from WhatsApp (2-step: get URL, then download)."""
        try:
            # Step 1: Get media URL
            url_resp = httpx.get(
                f"{BASE_URL}/{media_id}",
                headers={"Authorization": f"Bearer {self.access_token}"},
                timeout=30,
            )
            url_resp.raise_for_status()
            media_url = url_resp.json().get("url")
            if not media_url:
                return None

            # Step 2: Download the actual file
            file_resp = httpx.get(
                media_url,
                headers={"Authorization": f"Bearer {self.access_token}"},
                timeout=60,
            )
            file_resp.raise_for_status()
            return file_resp.content
        except Exception as e:
            print(f"[WhatsApp] Media download error: {e}")
            return None
