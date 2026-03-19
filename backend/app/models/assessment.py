import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy import Enum as SAEnum
from app.db import Base


class RiskAssessment(Base):
    __tablename__ = "risk_assessment"

    assessment_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.submission_id"), nullable=False, index=True)
    ocr_confidence_score = Column(Integer, nullable=True)
    tribal_status_score = Column(Integer, nullable=True)
    dc_permission_score = Column(Integer, nullable=True)
    forest_risk_score = Column(Integer, nullable=True)
    mutation_history_score = Column(Integer, nullable=True)
    khatiyan_age_score = Column(Integer, nullable=True)
    chain_of_title_score = Column(Integer, nullable=True)
    poa_abuse_score = Column(Integer, nullable=True)
    final_risk_score = Column(Integer, nullable=True)
    risk_level = Column(
        SAEnum("GREEN", "YELLOW", "ORANGE", "RED", name="risk_level_assessment_enum"),
        nullable=True,
    )
    recommendation = Column(
        SAEnum("APPROVE", "REVIEW", "REJECT", name="recommendation_enum"),
        nullable=True,
    )
    flags = Column(JSON, nullable=True)
    checklist = Column(JSON, nullable=True)
    discrepancies = Column(JSON, nullable=True)
    cnt_compliance = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
