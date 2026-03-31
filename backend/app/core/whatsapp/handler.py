"""WhatsApp message handler — routes messages to appropriate flows."""

import os
import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.user import User
from app.models.submission import Submission
from app.core.whatsapp.client import WhatsAppClient
from app.core.whatsapp.states import (
    get_state, set_state, clear_state,
    IDLE, REG_NAME, REG_EMAIL, REG_OTP, AWAITING_DOCUMENT,
)
from app.core.email_otp import generate_and_send_otp, verify_otp
from app.core.pipeline import run_pipeline

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
BASE_URL = os.getenv("PUBLIC_URL", "https://bhumirakshak.com")

wa = WhatsAppClient()


def handle_incoming(payload: dict):
    """Parse Meta webhook payload and dispatch to handler."""
    try:
        entry = payload.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if not messages:
            return

        msg = messages[0]
        phone = msg.get("from", "")
        msg_type = msg.get("type", "")

        # Extract content based on type
        text = ""
        media_id = None
        button_id = None
        list_id = None

        if msg_type == "text":
            text = msg.get("text", {}).get("body", "").strip()
        elif msg_type == "interactive":
            interactive = msg.get("interactive", {})
            itype = interactive.get("type", "")
            if itype == "button_reply":
                button_id = interactive.get("button_reply", {}).get("id", "")
                text = button_id
            elif itype == "list_reply":
                list_id = interactive.get("list_reply", {}).get("id", "")
                text = list_id
        elif msg_type in ("image", "document"):
            media_id = msg.get(msg_type, {}).get("id")

        if not phone:
            return

        db = SessionLocal()
        try:
            _dispatch(phone, text, msg_type, media_id, button_id, list_id, db)
        finally:
            db.close()

    except Exception as e:
        print(f"[WhatsApp Handler] Error: {e}")


def _dispatch(phone: str, text: str, msg_type: str, media_id: str | None,
              button_id: str | None, list_id: str | None, db: Session):
    """Route message to registered or unregistered flow."""
    user = db.query(User).filter(User.whatsapp_phone == phone).first()
    state, data = get_state(phone)

    if user:
        _handle_registered(phone, text, msg_type, media_id, button_id, list_id, user, state, data, db)
    else:
        _handle_unregistered(phone, text, msg_type, state, data, db)


def _handle_registered(phone: str, text: str, msg_type: str, media_id: str | None,
                       button_id: str | None, list_id: str | None,
                       user: User, state: str, data: dict, db: Session):
    """Handle messages from registered users."""

    # Document upload in progress
    if state == AWAITING_DOCUMENT and media_id:
        _process_document(phone, media_id, msg_type, user, db)
        return

    if state == AWAITING_DOCUMENT and msg_type == "text":
        wa.send_text(phone, "Please send an image or PDF document of the Khatiyan. Or type 'cancel' to go back to menu.")
        if text.lower() == "cancel":
            clear_state(phone)
            _send_main_menu(phone, user.name)
        return

    # Button/list responses
    if button_id == "view_reports" or text.lower() in ("reports", "view", "history"):
        _send_reports_list(phone, user, db)
        return

    if button_id == "upload_doc" or text.lower() in ("upload", "verify", "check"):
        set_state(phone, AWAITING_DOCUMENT)
        wa.send_text(phone, "Please send an image (photo) or PDF of the Khatiyan document you want to verify.")
        return

    if button_id == "help":
        wa.send_text(phone,
            "BhomiRakshak helps you verify land documents.\n\n"
            "*Upload*: Send a photo/PDF of any Khatiyan document\n"
            "*View Reports*: See your previous verification results\n"
            "*Help*: Show this message\n\n"
            f"Or visit: {BASE_URL}"
        )
        return

    # List selection — view specific report
    if list_id and list_id.startswith("report_"):
        submission_id = list_id.replace("report_", "")
        report_url = f"{BASE_URL}/report/{submission_id}"
        sub = db.query(Submission).filter(Submission.submission_id == submission_id).first()
        if sub:
            wa.send_text(phone,
                f"*Report: {sub.village_name or 'Unknown'} — Plot {sub.plot_number or '—'}*\n"
                f"Risk: {sub.risk_level or 'PENDING'} ({sub.risk_score or '—'}/100)\n"
                f"Status: {sub.submission_status}\n\n"
                f"View full report: {report_url}"
            )
        else:
            wa.send_text(phone, f"View report: {report_url}")
        return

    # Default: send main menu
    _send_main_menu(phone, user.name)


def _handle_unregistered(phone: str, text: str, msg_type: str,
                         state: str, data: dict, db: Session):
    """Handle messages from unregistered users — registration flow."""

    if state == REG_NAME:
        name = text.strip()
        if len(name) < 2:
            wa.send_text(phone, "Please enter your full name (at least 2 characters).")
            return
        set_state(phone, REG_EMAIL, {"name": name})
        wa.send_text(phone, f"Thanks, {name}! Now please enter your email address:")
        return

    if state == REG_EMAIL:
        email = text.strip().lower()
        if "@" not in email or "." not in email:
            wa.send_text(phone, "That doesn't look like a valid email. Please try again:")
            return

        # Check if email already registered
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.whatsapp_phone:
                wa.send_text(phone, "This email is already registered with another WhatsApp number. Please use a different email or log in on the website.")
                clear_state(phone)
                return
            # Link existing account
            set_state(phone, REG_OTP, {"email": email, "link_existing": True})
        else:
            set_state(phone, REG_OTP, {"email": email})

        generate_and_send_otp(email)
        wa.send_text(phone, f"We sent a 6-digit OTP to *{email}*. Please enter it here:")
        return

    if state == REG_OTP:
        otp = text.strip()
        email = data.get("email", "")
        name = data.get("name", "")

        if not verify_otp(email, otp):
            wa.send_text(phone, "Invalid or expired OTP. Please try again, or type 'resend' to get a new code.")
            if otp.lower() == "resend":
                generate_and_send_otp(email)
                wa.send_text(phone, f"New OTP sent to *{email}*. Please enter it:")
            return

        # Create or link user
        if data.get("link_existing"):
            user = db.query(User).filter(User.email == email).first()
            user.whatsapp_phone = phone
        else:
            user = User(
                user_id=str(uuid.uuid4()),
                email=email,
                name=name,
                phone_number=phone,
                whatsapp_phone=phone,
                is_verified=True,
            )
            db.add(user)

        try:
            db.commit()
        except Exception:
            db.rollback()
            wa.send_text(phone, "Registration failed. Please try again later.")
            clear_state(phone)
            return

        clear_state(phone)
        wa.send_text(phone,
            f"Welcome to BhomiRakshak, {user.name}! Your account is verified.\n\n"
            "You can now send a Khatiyan document (photo or PDF) to verify it."
        )
        _send_main_menu(phone, user.name)
        return

    # Default for unregistered: welcome + register prompt
    if text.lower() in ("register", "start", "signup"):
        set_state(phone, REG_NAME)
        wa.send_text(phone, "Let's create your account! Please enter your full name:")
        return

    wa.send_buttons(phone,
        "Welcome to BhomiRakshak! AI-powered land verification for Jharkhand.\n\n"
        "You need an account to use this service.",
        [
            {"id": "register", "title": "Register"},
            {"id": "learn_more", "title": "Learn More"},
        ],
    )

    if text == "learn_more":
        wa.send_text(phone,
            "BhomiRakshak analyzes Khatiyan (land ownership) documents using AI to provide:\n\n"
            "- OCR data extraction\n"
            "- 8-component risk scoring\n"
            "- CNT Act compliance check\n"
            "- Tribal land verification\n\n"
            f"Learn more: {BASE_URL}"
        )

    if text == "register":
        set_state(phone, REG_NAME)
        wa.send_text(phone, "Let's create your account! Please enter your full name:")


def _send_main_menu(phone: str, name: str):
    wa.send_buttons(phone,
        f"Hi {name}! What would you like to do?",
        [
            {"id": "view_reports", "title": "View Reports"},
            {"id": "upload_doc", "title": "Upload Document"},
            {"id": "help", "title": "Help"},
        ],
    )


def _send_reports_list(phone: str, user: User, db: Session):
    submissions = db.query(Submission).filter(
        Submission.user_id == user.user_id,
    ).order_by(Submission.created_at.desc()).limit(10).all()

    if not submissions:
        wa.send_text(phone, "You don't have any verification reports yet. Send a document to get started!")
        return

    rows = []
    for s in submissions:
        risk = f"[{s.risk_level}]" if s.risk_level else "[Pending]"
        village = s.village_name or "Unknown"
        plot = s.plot_number or "—"
        rows.append({
            "id": f"report_{s.submission_id}",
            "title": f"{risk} {village}"[:24],
            "description": f"Plot {plot} — {s.submission_status}"[:72],
        })

    wa.send_list(phone,
        f"Your recent verifications ({len(submissions)}):",
        "View Reports",
        [{"title": "Verification Reports", "rows": rows}],
    )


def _process_document(phone: str, media_id: str, msg_type: str, user: User, db: Session):
    """Download media, create submission, run pipeline, send results."""
    clear_state(phone)
    wa.send_text(phone, "Received your document. Processing... This may take a minute.")

    # Download media
    file_bytes = wa.download_media(media_id)
    if not file_bytes:
        wa.send_text(phone, "Failed to download the document. Please try sending it again.")
        return

    # Determine extension
    ext = ".jpg" if msg_type == "image" else ".pdf"
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Create submission
    submission_id = str(uuid.uuid4())
    submission = Submission(
        submission_id=submission_id,
        user_id=user.user_id,
        document_file_path=file_path,
        submission_status="processing",
        pipeline_step="queued",
        payment_status="demo_skip",
    )
    db.add(submission)
    user.total_submissions = (user.total_submissions or 0) + 1

    try:
        db.commit()
    except Exception:
        db.rollback()
        wa.send_text(phone, "Failed to create submission. Please try again.")
        return

    # Run pipeline (synchronous in this context)
    try:
        run_pipeline(submission_id, db)
    except Exception as e:
        print(f"[WhatsApp Pipeline] Error: {e}")

    # Refresh submission
    db.refresh(submission)

    report_url = f"{BASE_URL}/report/{submission_id}"

    if submission.submission_status == "completed":
        risk_emoji = {"GREEN": "🟢", "YELLOW": "🟡", "ORANGE": "🟠", "RED": "🔴"}.get(submission.risk_level, "⚪")
        wa.send_text(phone,
            f"*Verification Complete!*\n\n"
            f"{risk_emoji} Risk Level: *{submission.risk_level}*\n"
            f"Score: {submission.risk_score}/100\n"
            f"Village: {submission.village_name or '—'}\n"
            f"Plot: {submission.plot_number or '—'}\n\n"
            f"View full report: {report_url}"
        )
    else:
        wa.send_text(phone,
            f"Processing encountered an issue. You can still view the partial results:\n{report_url}"
        )
