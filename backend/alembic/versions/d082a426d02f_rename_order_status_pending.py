"""rename order status pending to plan_pending

Revision ID: d082a426d02f
Revises: 1495ebe5dc18
Create Date: 2026-09-02 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd082a426d02f'
down_revision: Union[str, None] = '1495ebe5dc18'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("ALTER TYPE order_status RENAME VALUE 'pending' TO 'plan_pending'")
    else:
        op.execute("UPDATE orders SET status = 'plan_pending' WHERE status = 'pending'")


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("ALTER TYPE order_status RENAME VALUE 'plan_pending' TO 'pending'")
    else:
        op.execute("UPDATE orders SET status = 'pending' WHERE status = 'plan_pending'")
