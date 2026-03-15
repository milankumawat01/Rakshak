import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy import Enum as SAEnum
from app.db import Base


class PaymentHistory(Base):
    __tablename__ = "payment_history"

    payment_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False, index=True)
    submission_id = Column(String(36), ForeignKey("submissions.submission_id"), nullable=True)
    payment_type = Column(
        SAEnum("one_time", "subscription", name="payment_type_enum"),
        nullable=True,
    )
    payment_amount = Column(Float, nullable=True)
    payment_status = Column(
        SAEnum("pending", "completed", "failed", "refunded", name="payment_status_history_enum"),
        default="pending",
    )
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    payment_date = Column(DateTime, default=datetime.utcnow)
