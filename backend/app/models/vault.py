import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy import Enum as SAEnum
from app.db import Base


class UserVault(Base):
    __tablename__ = "user_vault"

    vault_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False, index=True)
    submission_id = Column(String(36), ForeignKey("submissions.submission_id"), nullable=True)
    vault_name = Column(String(200), nullable=True)
    plot_number = Column(String(100), nullable=True)
    village_name = Column(String(200), nullable=True)
    area_bigha = Column(Float, nullable=True)
    risk_level = Column(
        SAEnum("GREEN", "YELLOW", "ORANGE", "RED", name="risk_level_vault_enum"),
        nullable=True,
    )
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    is_favorite = Column(Boolean, default=False)
    share_permission = Column(
        SAEnum("private", "family", "public", name="share_permission_enum"),
        default="private",
    )
    family_members = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
