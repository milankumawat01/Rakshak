"""WhatsApp webhook endpoints for Meta Cloud API."""

import os

from fastapi import APIRouter, Request, BackgroundTasks, HTTPException, Query
from fastapi.responses import PlainTextResponse

from app.core.whatsapp.handler import handle_incoming

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "rakshak-webhook-verify-2024")


@router.get("/webhook")
def verify_webhook(
    hub_mode: str = Query(alias="hub.mode", default=""),
    hub_token: str = Query(alias="hub.verify_token", default=""),
    hub_challenge: str = Query(alias="hub.challenge", default=""),
):
    """Meta webhook verification endpoint."""
    if hub_mode == "subscribe" and hub_token == VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_message(request: Request, background_tasks: BackgroundTasks):
    """Receive WhatsApp messages from Meta webhook."""
    body = await request.json()

    # Meta sends status updates too — only process actual messages
    entry = body.get("entry", [{}])[0]
    changes = entry.get("changes", [{}])[0]
    value = changes.get("value", {})

    if value.get("messages"):
        background_tasks.add_task(handle_incoming, body)

    # Must always return 200 quickly, or Meta will retry
    return {"status": "ok"}
