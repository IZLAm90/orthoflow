"""add fields for predictsmile parity: doctor denomination/collegiate,
delivery center address detail, product feature flags, order currency/urgent,
order_phases and company_settings tables

Revision ID: acd42de99827
Revises: e94efb1bc205
Create Date: 2026-09-02 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'acd42de99827'
down_revision: Union[str, None] = 'e94efb1bc205'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # doctors
    op.add_column('doctors', sa.Column('denomination', sa.String(), nullable=False, server_default='dr'))
    op.add_column('doctors', sa.Column('collegiate', sa.String(), nullable=True))

    # delivery_centers
    op.add_column('delivery_centers', sa.Column('city', sa.String(), nullable=True))
    op.add_column('delivery_centers', sa.Column('locality', sa.String(), nullable=True))
    op.add_column('delivery_centers', sa.Column('country', sa.String(), nullable=True))
    op.add_column('delivery_centers', sa.Column('postal_code', sa.String(), nullable=True))

    # products: feature flags
    product_flags = [
        ('has_odontogram', True),
        ('has_treatment_plan', True),
        ('has_upload', True),
        ('has_upload_boxes', True),
        ('has_upload_boxes_optional', True),
        ('has_upload_optional', False),
        ('has_delivery_center', True),
        ('has_doctor_optional', True),
        ('has_consent', False),
        ('has_fases', True),
        ('has_treatment_plan_multiplier', False),
        ('has_treatment_final_retainer', False),
        ('share_materials', False),
        ('share_phases', True),
    ]
    for name, default in product_flags:
        op.add_column('products', sa.Column(name, sa.Boolean(), nullable=False, server_default=sa.true() if default else sa.false()))

    # orders
    op.add_column('orders', sa.Column('currency', sa.String(length=3), nullable=False, server_default='EUR'))
    op.add_column('orders', sa.Column('urgent', sa.Boolean(), nullable=False, server_default=sa.false()))

    # order_phases
    op.create_table(
        'order_phases',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('order_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # company_settings
    op.create_table(
        'company_settings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('company_name', sa.String(), nullable=True),
        sa.Column('fiscal_name', sa.String(), nullable=True),
        sa.Column('nif', sa.String(), nullable=True),
        sa.Column('billing_address', sa.String(), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('postal_code', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('billing_email', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('company_settings')
    op.drop_table('order_phases')
    op.drop_column('orders', 'urgent')
    op.drop_column('orders', 'currency')
    for name, _ in [
        ('has_odontogram', True), ('has_treatment_plan', True), ('has_upload', True),
        ('has_upload_boxes', True), ('has_upload_boxes_optional', True), ('has_upload_optional', False),
        ('has_delivery_center', True), ('has_doctor_optional', True), ('has_consent', False),
        ('has_fases', True), ('has_treatment_plan_multiplier', False), ('has_treatment_final_retainer', False),
        ('share_materials', False), ('share_phases', True),
    ]:
        op.drop_column('products', name)
    op.drop_column('delivery_centers', 'postal_code')
    op.drop_column('delivery_centers', 'country')
    op.drop_column('delivery_centers', 'locality')
    op.drop_column('delivery_centers', 'city')
    op.drop_column('doctors', 'collegiate')
    op.drop_column('doctors', 'denomination')
