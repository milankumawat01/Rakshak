import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, ForeignKey, JSON, Integer
from sqlalchemy import Enum as SAEnum
from app.db import Base


class UserVault(Base):
    __tablename__ = "user_vault"

    vault_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False, index=True)
    submission_id = Column(String(36), ForeignKey("submissions.submission_id"), nullable=True)

    # Property info (new fields alongside old ones for backward compat)
    vault_name = Column(String(200), nullable=True)
    property_name = Column(String(200), nullable=True)
    plot_number = Column(String(100), nullable=True)
    khata_number = Column(String(100), nullable=True)
    area_bigha = Column(Float, nullable=True)
    area_value = Column(Float, nullable=True)
    area_unit = Column(
        SAEnum("bigha", "sqft", "hectare", "acre", name="area_unit_enum"),
        nullable=True,
    )
    land_type = Column(
        SAEnum("agricultural", "residential", "commercial", "mixed", name="land_type_enum"),
        nullable=True,
    )

    # Location
    village_name = Column(String(200), nullable=True)
    village = Column(String(200), nullable=True)
    block = Column(String(200), nullable=True)
    district = Column(String(200), nullable=True)
    state = Column(String(200), nullable=True, default="Jharkhand")
    pin_code = Column(String(10), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Financial
    purchase_price = Column(Float, nullable=True)
    purchase_date = Column(DateTime, nullable=True)
    circle_rate_at_purchase = Column(Float, nullable=True)
    current_market_value = Column(Float, nullable=True)
    current_circle_rate = Column(Float, nullable=True)

    # Ownership
    previous_owner = Column(String(200), nullable=True)
    registration_date = Column(DateTime, nullable=True)
    mutation_status = Column(
        SAEnum("complete", "pending", "not_started", name="mutation_status_enum"),
        nullable=True,
    )
    stamp_duty_paid = Column(Float, nullable=True)

    # Risk & status
    risk_level = Column(
        SAEnum("GREEN", "YELLOW", "ORANGE", "RED", name="risk_level_vault_enum"),
        nullable=True,
    )

    # Meta
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    is_favorite = Column(Boolean, default=False)
    share_permission = Column(
        SAEnum("private", "family", "public", name="share_permission_enum"),
        default="private",
    )
    family_members = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VaultDocument(Base):
    __tablename__ = "vault_documents"

    doc_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vault_id = Column(String(36), ForeignKey("user_vault.vault_id"), nullable=False, index=True)
    category = Column(
        SAEnum("registration", "stamp", "mutation", "khatiyan", "map", "other", name="doc_category_enum"),
        nullable=False,
    )
    file_name = Column(String(500), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_size_mb = Column(Float, nullable=True)
    file_type = Column(String(50), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)


class VaultValueHistory(Base):
    __tablename__ = "vault_value_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vault_id = Column(String(36), ForeignKey("user_vault.vault_id"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    estimated_value = Column(Float, nullable=True)
    circle_rate = Column(Float, nullable=True)
    calculated_at = Column(DateTime, default=datetime.utcnow)
