import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy import Enum as SAEnum
from app.db import Base


class Submission(Base):
    __tablename__ = "submissions"

    submission_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False, index=True)
    document_file_path = Column(String(500), nullable=True)
    village_name = Column(String(200), nullable=True)
    plot_number = Column(String(100), nullable=True)
    seller_name = Column(String(200), nullable=True)
    buyer_tribal = Column(Boolean, default=False)
    submission_status = Column(
        SAEnum("processing", "completed", "failed", name="submission_status_enum"),
        default="processing",
    )
    pipeline_step = Column(String(100), nullable=True)
    risk_score = Column(Integer, nullable=True)
    risk_level = Column(
        SAEnum("GREEN", "YELLOW", "ORANGE", "RED", name="risk_level_enum"),
        nullable=True,
    )
    payment_status = Column(
        SAEnum("pending", "paid", "failed", "demo_skip", name="payment_status_enum"),
        default="pending",
    )
    created_at = Column(DateTime, default=datetime.utcnow)
