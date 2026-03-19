"""add_enhanced_assessment_fields

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-18 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('risk_assessment', schema=None) as batch_op:
        batch_op.add_column(sa.Column('poa_abuse_score', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('discrepancies', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('cnt_compliance', sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('risk_assessment', schema=None) as batch_op:
        batch_op.drop_column('cnt_compliance')
        batch_op.drop_column('discrepancies')
        batch_op.drop_column('poa_abuse_score')
