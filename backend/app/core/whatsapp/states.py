"""Conversation state machine for WhatsApp bot."""

import time

# States
IDLE = "idle"
REG_NAME = "reg_name"
REG_EMAIL = "reg_email"
REG_OTP = "reg_otp"
AWAITING_DOCUMENT = "awaiting_doc"

# In-memory state store: {phone: {state, data, updated_at}}
_sessions: dict = {}

SESSION_TIMEOUT = 1800  # 30 minutes


def _cleanup():
    now = time.time()
    expired = [k for k, v in _sessions.items() if now - v["updated_at"] > SESSION_TIMEOUT]
    for k in expired:
        del _sessions[k]


def get_state(phone: str) -> tuple[str, dict]:
    """Get current state and data for a phone number."""
    _cleanup()
    session = _sessions.get(phone)
    if not session:
        return IDLE, {}
    return session["state"], session.get("data", {})


def set_state(phone: str, state: str, data: dict | None = None):
    """Set state for a phone number. Merges data if provided."""
    existing = _sessions.get(phone, {}).get("data", {})
    if data:
        existing.update(data)
    _sessions[phone] = {
        "state": state,
        "data": existing,
        "updated_at": time.time(),
    }


def clear_state(phone: str):
    """Clear state for a phone number."""
    _sessions.pop(phone, None)
