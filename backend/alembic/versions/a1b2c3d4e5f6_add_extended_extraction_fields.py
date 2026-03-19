"""add_extended_extraction_fields

Revision ID: a1b2c3d4e5f6
Revises: e6ec1e40da17
Create Date: 2026-03-18 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e6ec1e40da17'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('khatiyan_extractions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('surname_extracted', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('surname_confidence', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('first_registration_date_extracted', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('first_reg_confidence', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('land_use_type_extracted', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('land_use_confidence', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('mutation_type_extracted', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('mutation_type_confidence', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('vanshavali_extracted', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('co_heirs_extracted', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('dc_permission_ref_extracted', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('poa_count_extracted', sa.Integer(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('khatiyan_extractions', schema=None) as batch_op:
        batch_op.drop_column('poa_count_extracted')
        batch_op.drop_column('dc_permission_ref_extracted')
        batch_op.drop_column('co_heirs_extracted')
        batch_op.drop_column('vanshavali_extracted')
        batch_op.drop_column('mutation_type_confidence')
        batch_op.drop_column('mutation_type_extracted')
        batch_op.drop_column('land_use_confidence')
        batch_op.drop_column('land_use_type_extracted')
        batch_op.drop_column('first_reg_confidence')
        batch_op.drop_column('first_registration_date_extracted')
        batch_op.drop_column('surname_confidence')
        batch_op.drop_column('surname_extracted')
