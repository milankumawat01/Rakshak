import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Enum as SAEnum
from app.db import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number = Column(String(15), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=True)
    email = Column(String(150), nullable=True)
    user_type = Column(
        SAEnum("citizen", "broker", "govt", name="user_type_enum"),
        default="citizen",
    )
    subscription_plan = Column(
        SAEnum("free", "basic", "premium", name="subscription_plan_enum"),
        default="free",
    )
    subscription_expires = Column(DateTime, nullable=True)
    total_submissions = Column(Integer, default=0)
    total_vault_items = Column(Integer, default=0)
    registration_date = Column(DateTime, default=datetime.utcnow)
