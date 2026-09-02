"""add product delivery_start_days

Revision ID: afa7b4520c28
Revises: acd42de99827
Create Date: 2026-09-02 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'afa7b4520c28'
down_revision: Union[str, None] = 'acd42de99827'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('delivery_start_days', sa.Integer(), nullable=False, server_default='3'))


def downgrade() -> None:
    op.drop_column('products', 'delivery_start_days')
