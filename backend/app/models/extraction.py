import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, ForeignKey
from app.db import Base


class KhatiyanExtraction(Base):
    __tablename__ = "khatiyan_extractions"

    extraction_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.submission_id"), nullable=False, index=True)
    ocr_engine_used = Column(String(50), nullable=True)
    plot_number_extracted = Column(String(100), nullable=True)
    plot_confidence = Column(Float, nullable=True)
    khata_number_extracted = Column(String(100), nullable=True)
    area_bigha_extracted = Column(Float, nullable=True)
    owner_name_extracted = Column(String(200), nullable=True)
    tribal_status_extracted = Column(String(10), nullable=True)
    last_mutation_date_extracted = Column(String(20), nullable=True)
    overall_extraction_confidence = Column(Float, nullable=True)
    requires_manual_review = Column(Boolean, default=False)
    raw_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
