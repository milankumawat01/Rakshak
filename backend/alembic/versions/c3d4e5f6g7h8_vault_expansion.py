"""vault_expansion - add property portfolio fields, vault_documents, vault_value_history

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-03-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c3d4e5f6g7h8"
down_revision: Union[str, None] = "b2c3d4e5f6g7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Expand user_vault with new columns ---
    with op.batch_alter_table("user_vault") as batch_op:
        # Property info
        batch_op.add_column(sa.Column("property_name", sa.String(200), nullable=True))
        batch_op.add_column(sa.Column("khata_number", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("area_value", sa.Float, nullable=True))
        batch_op.add_column(sa.Column("area_unit", sa.String(20), nullable=True))
        batch_op.add_column(sa.Column("land_type", sa.String(20), nullable=True))

        # Location
        batch_op.add_column(sa.Column("village", sa.String(200), nullable=True))
        batch_op.add_column(sa.Column("block", sa.String(200), nullable=True))
        batch_op.add_column(sa.Column("district", sa.String(200), nullable=True))
        batch_op.add_column(sa.Column("state", sa.String(200), nullable=True))
        batch_op.add_column(sa.Column("pin_code", sa.String(10), nullable=True))
        batch_op.add_column(sa.Column("latitude", sa.Float, nullable=True))
        batch_op.add_column(sa.Column("longitude", sa.Float, nullable=True))

        # Financial
        batch_op.add_column(sa.Column("purchase_price", sa.Float, nullable=True))
        batch_op.add_column(sa.Column("purchase_date", sa.DateTime, nullable=True))
        batch_op.add_column(sa.Column("circle_rate_at_purchase", sa.Float, nullable=True))
        batch_op.add_column(sa.Column("current_market_value", sa.Float, nullable=True))
        batch_op.add_column(sa.Column("current_circle_rate", sa.Float, nullable=True))

        # Ownership
        batch_op.add_column(sa.Column("previous_owner", sa.String(200), nullable=True))
        batch_op.add_column(sa.Column("registration_date", sa.DateTime, nullable=True))
        batch_op.add_column(sa.Column("mutation_status", sa.String(20), nullable=True))
        batch_op.add_column(sa.Column("stamp_duty_paid", sa.Float, nullable=True))

        # Meta
        batch_op.add_column(sa.Column("updated_at", sa.DateTime, nullable=True))

    # --- Create vault_documents table ---
    op.create_table(
        "vault_documents",
        sa.Column("doc_id", sa.String(36), primary_key=True),
        sa.Column("vault_id", sa.String(36), sa.ForeignKey("user_vault.vault_id"), nullable=False),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("file_name", sa.String(500), nullable=False),
        sa.Column("file_url", sa.String(500), nullable=False),
        sa.Column("file_size_mb", sa.Float, nullable=True),
        sa.Column("file_type", sa.String(50), nullable=True),
        sa.Column("uploaded_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_vault_documents_vault_id", "vault_documents", ["vault_id"])

    # --- Create vault_value_history table ---
    op.create_table(
        "vault_value_history",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("vault_id", sa.String(36), sa.ForeignKey("user_vault.vault_id"), nullable=False),
        sa.Column("year", sa.Integer, nullable=False),
        sa.Column("estimated_value", sa.Float, nullable=True),
        sa.Column("circle_rate", sa.Float, nullable=True),
        sa.Column("calculated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_vault_value_history_vault_id", "vault_value_history", ["vault_id"])


def downgrade() -> None:
    op.drop_table("vault_value_history")
    op.drop_table("vault_documents")

    with op.batch_alter_table("user_vault") as batch_op:
        batch_op.drop_column("updated_at")
        batch_op.drop_column("stamp_duty_paid")
        batch_op.drop_column("mutation_status")
        batch_op.drop_column("registration_date")
        batch_op.drop_column("previous_owner")
        batch_op.drop_column("current_circle_rate")
        batch_op.drop_column("current_market_value")
        batch_op.drop_column("circle_rate_at_purchase")
        batch_op.drop_column("purchase_date")
        batch_op.drop_column("purchase_price")
        batch_op.drop_column("longitude")
        batch_op.drop_column("latitude")
        batch_op.drop_column("pin_code")
        batch_op.drop_column("state")
        batch_op.drop_column("district")
        batch_op.drop_column("block")
        batch_op.drop_column("village")
        batch_op.drop_column("land_type")
        batch_op.drop_column("area_unit")
        batch_op.drop_column("area_value")
        batch_op.drop_column("khata_number")
        batch_op.drop_column("property_name")
