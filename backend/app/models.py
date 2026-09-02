import uuid
from datetime import datetime, date

from sqlalchemy import (
    String,
    Text,
    Boolean,
    Integer,
    Numeric,
    Date,
    DateTime,
    ForeignKey,
    Enum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def gen_id() -> str:
    return uuid.uuid4().hex


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(Enum("admin", "doctor", "assistant", name="user_role"), default="assistant")
    status: Mapped[str] = mapped_column(Enum("active", "inactive", name="user_status"), default="active")
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(Enum("female", "male", "other", name="patient_gender"), nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    cases: Mapped[list["Case"]] = relationship(back_populates="patient")


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    denomination: Mapped[str] = mapped_column(Enum("dr", "dra", name="doctor_denomination"), default="dr")
    collegiate: Mapped[str | None] = mapped_column(String, nullable=True)


class DeliveryCenter(Base):
    __tablename__ = "delivery_centers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    locality: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str | None] = mapped_column(String, nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String, nullable=True)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    provider: Mapped[str | None] = mapped_column(String, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    rating: Mapped[float] = mapped_column(Numeric(2, 1), default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivery_start_days: Mapped[int] = mapped_column(Integer, default=3)

    # Feature flags gate which sections of the order form render for this product,
    # mirroring the reference platform's config-driven order form.
    has_odontogram: Mapped[bool] = mapped_column(Boolean, default=True)
    has_treatment_plan: Mapped[bool] = mapped_column(Boolean, default=True)
    has_upload: Mapped[bool] = mapped_column(Boolean, default=True)
    has_upload_boxes: Mapped[bool] = mapped_column(Boolean, default=True)
    has_upload_boxes_optional: Mapped[bool] = mapped_column(Boolean, default=True)
    has_upload_optional: Mapped[bool] = mapped_column(Boolean, default=False)
    has_delivery_center: Mapped[bool] = mapped_column(Boolean, default=True)
    has_doctor_optional: Mapped[bool] = mapped_column(Boolean, default=True)
    has_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    has_fases: Mapped[bool] = mapped_column(Boolean, default=True)
    has_treatment_plan_multiplier: Mapped[bool] = mapped_column(Boolean, default=False)
    has_treatment_final_retainer: Mapped[bool] = mapped_column(Boolean, default=False)
    share_materials: Mapped[bool] = mapped_column(Boolean, default=False)
    share_phases: Mapped[bool] = mapped_column(Boolean, default=True)


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    case_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(
            "new", "in_planning", "awaiting_approval", "approved",
            "in_treatment", "completed", "on_hold", name="case_status",
        ),
        default="new",
    )
    priority: Mapped[str] = mapped_column(Enum("low", "normal", "high", name="case_priority"), default="normal")
    treatment_type: Mapped[str] = mapped_column(
        Enum("aligners", "braces", "retainer", "surgical", name="case_treatment_type"),
        default="aligners",
    )
    chief_complaint: Mapped[str | None] = mapped_column(Text, nullable=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient: Mapped["Patient"] = relationship(back_populates="cases")
    scans: Mapped[list["Scan"]] = relationship(back_populates="case", cascade="all, delete-orphan")


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    type: Mapped[str] = mapped_column(Enum("upper", "lower", name="scan_type"), nullable=False)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    format: Mapped[str] = mapped_column(String, default="stl")
    status: Mapped[str] = mapped_column(String, default="ready")

    case: Mapped["Case"] = relationship(back_populates="scans")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    ref: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("plan_pending", "processing", "finished", name="order_status"), default="plan_pending"
    )
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    doctor_id: Mapped[str | None] = mapped_column(ForeignKey("doctors.id"), nullable=True)
    delivery_center_id: Mapped[str | None] = mapped_column(ForeignKey("delivery_centers.id"), nullable=True)
    total: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    delivery_on: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    chief_complain: Mapped[str | None] = mapped_column(Text, nullable=True)
    treat_both_arch: Mapped[bool] = mapped_column(Boolean, default=False)
    treatment_plan_type: Mapped[str | None] = mapped_column(
        Enum("full_arch", "anterior_only", "4_4_only", "no_6_7", name="order_treatment_plan_type"), nullable=True
    )
    dont_move: Mapped[str | None] = mapped_column(Text, nullable=True)
    ap_relationship: Mapped[str | None] = mapped_column(
        Enum("maintain", "canine_only", "canine_molar", "both", name="order_ap_relationship"), nullable=True
    )
    anteroposterior: Mapped[str | None] = mapped_column(String, nullable=True)
    elastics: Mapped[str | None] = mapped_column(Text, nullable=True)
    open_bite: Mapped[str | None] = mapped_column(
        Enum("correct", "maintain", "improved", name="order_open_bite"), nullable=True
    )
    midline: Mapped[str | None] = mapped_column(Enum("maintain", "correct", name="order_midline"), nullable=True)
    ipr: Mapped[str | None] = mapped_column(Text, nullable=True)
    bite_ramps: Mapped[str | None] = mapped_column(Text, nullable=True)
    crossbite: Mapped[str | None] = mapped_column(
        Enum("correct", "maintain", "anterior", "posterior", name="order_crossbite"), nullable=True
    )
    spaces: Mapped[str | None] = mapped_column(Enum("close_all", "maintain", name="order_spaces"), nullable=True)
    special_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    cbct_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    want_manufacturing: Mapped[bool] = mapped_column(Boolean, default=False)
    material: Mapped[str | None] = mapped_column(
        Enum("taglus", "zendura", "none", name="order_material"), nullable=True
    )

    patient: Mapped["Patient"] = relationship()
    product: Mapped["Product | None"] = relationship()
    doctor: Mapped["Doctor | None"] = relationship()
    delivery_center: Mapped["DeliveryCenter | None"] = relationship()
    treatment_plans: Mapped[list["TreatmentPlan"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    observations: Mapped[list["Observation"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    phases: Mapped[list["OrderPhase"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderPhase.created_at"
    )


class OrderPhase(Base):
    """Fulfillment timeline entry (e.g. "Order Accepted" -> "Shipping"), appended
    automatically as an order's status changes — mirrors the reference platform's
    faseline concept."""

    __tablename__ = "order_phases"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    order: Mapped["Order"] = relationship(back_populates="phases")


class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String, default="Approved")
    type: Mapped[str] = mapped_column(String, default="Treatment")
    total: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    issued: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    order: Mapped["Order"] = relationship(back_populates="treatment_plans")


class Observation(Base):
    __tablename__ = "observations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), nullable=False)
    user_name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    plan: Mapped[str | None] = mapped_column(String, nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="observations")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    status: Mapped[str] = mapped_column(Enum("draft", "paid", name="invoice_status"), default="draft")
    issue_date: Mapped[date] = mapped_column(Date, default=date.today)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    billing_company: Mapped[str | None] = mapped_column(String, nullable=True)
    billing_address: Mapped[str | None] = mapped_column(String, nullable=True)
    billing_vat: Mapped[str | None] = mapped_column(String, nullable=True)
    billing_email: Mapped[str | None] = mapped_column(String, nullable=True)

    invoice_orders: Mapped[list["InvoiceOrder"]] = relationship(back_populates="invoice", cascade="all, delete-orphan")


class InvoiceOrder(Base):
    __tablename__ = "invoice_orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    invoice_id: Mapped[str] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), nullable=False)

    invoice: Mapped["Invoice"] = relationship(back_populates="invoice_orders")
    order: Mapped["Order"] = relationship()


class LabOrder(Base):
    __tablename__ = "lab_orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    ref: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    # A lab order originates from either the Cases flow (case_id) or the
    # Products/Orders flow (order_id, auto-created when an order requests
    # manufacturing) — exactly one is expected to be set.
    case_id: Mapped[str | None] = mapped_column(ForeignKey("cases.id"), nullable=True)
    order_id: Mapped[str | None] = mapped_column(ForeignKey("orders.id"), nullable=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False)
    lab: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("pending", "in_production", "shipped", "delivered", "revision_needed", name="lab_order_status"),
        default="pending",
    )
    ordered_at: Mapped[date] = mapped_column(Date, default=date.today)
    eta: Mapped[date | None] = mapped_column(Date, nullable=True)
    stages: Mapped[int] = mapped_column(Integer, default=1)

    case: Mapped["Case | None"] = relationship()
    order: Mapped["Order | None"] = relationship()
    patient: Mapped["Patient"] = relationship()


class CompanySettings(Base):
    """Single tenant-level billing record (one row per deployment). New invoices
    snapshot these fields at issue time rather than reference this table live."""

    __tablename__ = "company_settings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: "default")
    company_name: Mapped[str | None] = mapped_column(String, nullable=True)
    fiscal_name: Mapped[str | None] = mapped_column(String, nullable=True)
    nif: Mapped[str | None] = mapped_column(String, nullable=True)
    billing_address: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    billing_email: Mapped[str | None] = mapped_column(String, nullable=True)
