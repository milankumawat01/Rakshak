"""Payment endpoints: Razorpay order creation, webhook, history."""

import hashlib
import hmac
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.submission import Submission
from app.models.payment import PaymentHistory
from app.schemas import CreateOrderRequest, CreateOrderResponse, PaymentHistoryOut

router = APIRouter(prefix="/api/payment", tags=["payment"])

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

FREE_TIER_LIMIT = 1  # 1 free verification per month


def _get_monthly_submission_count(user_id: str, db: Session) -> int:
    """Count user's completed submissions this calendar month."""
    now = datetime.utcnow()
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return db.query(func.count(Submission.submission_id)).filter(
        Submission.user_id == user_id,
        Submission.submission_status == "completed",
        Submission.created_at >= first_of_month,
    ).scalar() or 0


@router.get("/config")
def get_payment_config(user: User = Depends(get_current_user)):
    """Return payment config for frontend (Razorpay key, demo mode, free tier status)."""
    return {
        "demo_mode": DEMO_MODE,
        "razorpay_key_id": RAZORPAY_KEY_ID if not DEMO_MODE else None,
    }


@router.get("/free-tier-status")
def free_tier_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check if user has free verifications remaining this month."""
    plan = user.subscription_plan or "free"
    if plan != "free":
        return {"plan": plan, "free_remaining": None, "requires_payment": False}

    used = _get_monthly_submission_count(user.user_id, db)
    remaining = max(0, FREE_TIER_LIMIT - used)
    return {
        "plan": "free",
        "used_this_month": used,
        "free_remaining": remaining,
        "requires_payment": remaining <= 0,
    }


@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(
    req: CreateOrderRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify submission belongs to user
    submission = db.query(Submission).filter(
        Submission.submission_id == req.submission_id,
        Submission.user_id == user.user_id,
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Demo mode: skip payment
    if DEMO_MODE:
        submission.payment_status = "demo_skip"
        try:
            db.commit()
        except Exception:
            db.rollback()
        return CreateOrderResponse(demo_mode=True, skip_payment=True)

    # Free tier: skip payment if user has free verifications remaining
    plan = user.subscription_plan or "free"
    if plan == "free":
        used = _get_monthly_submission_count(user.user_id, db)
        if used <= FREE_TIER_LIMIT:
            submission.payment_status = "demo_skip"
            try:
                db.commit()
            except Exception:
                db.rollback()
            return CreateOrderResponse(demo_mode=False, skip_payment=True)

    # Real Razorpay order creation
    try:
        import razorpay
        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order = client.order.create({
            "amount": 49900,  # ₹499 in paise
            "currency": "INR",
            "receipt": req.submission_id,
        })

        # Record payment
        payment = PaymentHistory(
            payment_id=str(uuid.uuid4()),
            user_id=user.user_id,
            submission_id=req.submission_id,
            payment_type="one_time",
            payment_amount=499.00,
            payment_status="pending",
            razorpay_order_id=order["id"],
        )
        db.add(payment)
        db.commit()

        return CreateOrderResponse(order_id=order["id"], amount=49900)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Payment creation failed: {e}")


@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """Razorpay webhook: verify HMAC signature and mark submission as paid."""
    try:
        body = await request.body()
        signature = request.headers.get("X-Razorpay-Signature", "")

        # Verify HMAC
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid signature")

        import json
        payload = json.loads(body)
        razorpay_order_id = payload.get("payload", {}).get("payment", {}).get("entity", {}).get("order_id")

        if razorpay_order_id:
            payment = db.query(PaymentHistory).filter(
                PaymentHistory.razorpay_order_id == razorpay_order_id
            ).first()
            if payment:
                payment.payment_status = "completed"
                payment.razorpay_payment_id = (
                    payload.get("payload", {}).get("payment", {}).get("entity", {}).get("id")
                )

                # Mark submission as paid
                submission = db.query(Submission).filter(
                    Submission.submission_id == payment.submission_id
                ).first()
                if submission:
                    submission.payment_status = "paid"

                db.commit()

        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[Webhook] Error: {e}")
        return {"status": "error"}


@router.get("/history", response_model=list[PaymentHistoryOut])
def get_payment_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payments = db.query(PaymentHistory).filter(
        PaymentHistory.user_id == user.user_id
    ).order_by(PaymentHistory.payment_date.desc()).all()

    return [
        PaymentHistoryOut(
            payment_id=p.payment_id,
            submission_id=p.submission_id,
            payment_type=p.payment_type,
            payment_amount=p.payment_amount,
            payment_status=p.payment_status,
            razorpay_order_id=p.razorpay_order_id,
            payment_date=p.payment_date,
        )
        for p in payments
    ]
