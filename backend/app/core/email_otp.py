"""Email OTP generation, storage, and verification."""

import os
import random
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

MOCK_OTP = os.getenv("MOCK_OTP", "true").lower() == "true"

# In-memory OTP store: {email: {otp, expires_at, attempts}}
_otp_store: dict = {}

OTP_EXPIRY_SECONDS = 600  # 10 minutes
MAX_ATTEMPTS = 5


def _cleanup_expired():
    now = time.time()
    expired = [k for k, v in _otp_store.items() if v["expires_at"] < now]
    for k in expired:
        del _otp_store[k]


def generate_and_send_otp(email: str) -> bool:
    """Generate a 6-digit OTP, store it, and send via email. Returns True on success."""
    _cleanup_expired()

    otp = str(random.randint(100000, 999999))
    _otp_store[email] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRY_SECONDS,
        "attempts": 0,
    }

    if MOCK_OTP:
        print(f"[OTP Mock] Email: {email}, OTP: {otp} (mock mode — use 123456)")
        return True

    return _send_email(email, otp)


def verify_otp(email: str, code: str) -> bool:
    """Verify OTP for email. Returns True if valid."""
    if MOCK_OTP and code == "123456":
        _otp_store.pop(email, None)
        return True

    entry = _otp_store.get(email)
    if not entry:
        return False

    if entry["expires_at"] < time.time():
        del _otp_store[email]
        return False

    entry["attempts"] += 1
    if entry["attempts"] > MAX_ATTEMPTS:
        del _otp_store[email]
        return False

    if entry["otp"] == code:
        del _otp_store[email]
        return True

    return False


def _send_email(to_email: str, otp: str) -> bool:
    """Send OTP via SMTP."""
    try:
        host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        port = int(os.getenv("SMTP_PORT", "587"))
        user = os.getenv("SMTP_USER", "")
        password = os.getenv("SMTP_PASSWORD", "")
        from_email = os.getenv("SMTP_FROM", user)

        if not user or not password:
            print("[OTP] SMTP credentials not configured, cannot send email")
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"BhomiRakshak - Your verification code: {otp}"
        msg["From"] = from_email
        msg["To"] = to_email

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">BhomiRakshak</h2>
            <p>Your verification code is:</p>
            <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1F2937;">{otp}</span>
            </div>
            <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">BhomiRakshak - Land Verification Platform for Jharkhand</p>
        </div>
        """
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(from_email, to_email, msg.as_string())

        print(f"[OTP] Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[OTP] Failed to send email: {e}")
        return False
