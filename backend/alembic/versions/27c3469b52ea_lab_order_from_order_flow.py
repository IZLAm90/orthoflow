"""allow lab orders to originate from an Order, not just a Case

Revision ID: 27c3469b52ea
Revises: afa7b4520c28
Create Date: 2026-09-02 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '27c3469b52ea'
down_revision: Union[str, None] = 'afa7b4520c28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('lab_orders') as batch_op:
        batch_op.alter_column('case_id', existing_type=sa.String(), nullable=True)
        batch_op.add_column(sa.Column('order_id', sa.String(), nullable=True))
        batch_op.create_foreign_key('fk_lab_orders_order_id', 'orders', ['order_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('lab_orders') as batch_op:
        batch_op.drop_constraint('fk_lab_orders_order_id', type_='foreignkey')
        batch_op.drop_column('order_id')
        batch_op.alter_column('case_id', existing_type=sa.String(), nullable=False)
