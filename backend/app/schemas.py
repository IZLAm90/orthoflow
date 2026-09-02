from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(ORMModel):
    id: str
    name: str
    email: str
    role: str
    status: str
    phone: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


# ---------- User ----------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "assistant"
    status: str = "active"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None


# ---------- Patient ----------

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    allergies: Optional[str] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    allergies: Optional[str] = None


class PatientRead(ORMModel):
    id: str
    first_name: str
    last_name: str
    email: Optional[str]
    phone: Optional[str]
    date_of_birth: Optional[date]
    gender: Optional[str]
    allergies: Optional[str]
    created_at: datetime
    cases_count: int = 0


# ---------- Doctor ----------

class DoctorCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    denomination: str = "dr"
    collegiate: Optional[str] = None


class DoctorUpdate(DoctorCreate):
    name: Optional[str] = None
    denomination: Optional[str] = None


class DoctorRead(ORMModel):
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    denomination: str
    collegiate: Optional[str]


# ---------- DeliveryCenter ----------

class DeliveryCenterCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None


class DeliveryCenterUpdate(DeliveryCenterCreate):
    name: Optional[str] = None


class DeliveryCenterRead(ORMModel):
    id: str
    name: str
    address: Optional[str]
    phone: Optional[str]
    city: Optional[str]
    locality: Optional[str]
    country: Optional[str]
    postal_code: Optional[str]


# ---------- Product ----------

class ProductCreate(BaseModel):
    name: str
    provider: Optional[str] = None
    price: float = 0
    rating: float = 0
    description: Optional[str] = None
    has_odontogram: bool = True
    has_treatment_plan: bool = True
    has_upload: bool = True
    has_upload_boxes: bool = True
    has_upload_boxes_optional: bool = True
    has_upload_optional: bool = False
    has_delivery_center: bool = True
    has_doctor_optional: bool = True
    has_consent: bool = False
    has_fases: bool = True
    has_treatment_plan_multiplier: bool = False
    has_treatment_final_retainer: bool = False
    share_materials: bool = False
    share_phases: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    price: Optional[float] = None
    rating: Optional[float] = None
    description: Optional[str] = None
    has_odontogram: Optional[bool] = None
    has_treatment_plan: Optional[bool] = None
    has_upload: Optional[bool] = None
    has_upload_boxes: Optional[bool] = None
    has_upload_boxes_optional: Optional[bool] = None
    has_upload_optional: Optional[bool] = None
    has_delivery_center: Optional[bool] = None
    has_doctor_optional: Optional[bool] = None
    has_consent: Optional[bool] = None
    has_fases: Optional[bool] = None
    has_treatment_plan_multiplier: Optional[bool] = None
    has_treatment_final_retainer: Optional[bool] = None
    share_materials: Optional[bool] = None
    share_phases: Optional[bool] = None


class ProductRead(ORMModel):
    id: str
    name: str
    provider: Optional[str]
    price: float
    rating: float
    description: Optional[str]
    has_odontogram: bool
    has_treatment_plan: bool
    has_upload: bool
    has_upload_boxes: bool
    has_upload_boxes_optional: bool
    has_upload_optional: bool
    has_delivery_center: bool
    has_doctor_optional: bool
    has_consent: bool
    has_fases: bool
    has_treatment_plan_multiplier: bool
    has_treatment_final_retainer: bool
    share_materials: bool
    share_phases: bool


# ---------- Scan ----------

class ScanRead(ORMModel):
    id: str
    case_id: str
    type: str
    file_name: str
    file_size: int
    format: str
    status: str


# ---------- Case ----------

class CaseCreate(BaseModel):
    patient_id: str
    status: str = "new"
    priority: str = "normal"
    treatment_type: str = "aligners"
    chief_complaint: Optional[str] = None


class CaseUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    treatment_type: Optional[str] = None
    chief_complaint: Optional[str] = None


class CaseRead(ORMModel):
    id: str
    case_number: str
    status: str
    priority: str
    treatment_type: str
    chief_complaint: Optional[str]
    patient_id: str
    patient: Optional[PatientRead] = None
    scans: list[ScanRead] = []
    created_at: datetime
    updated_at: datetime


# ---------- TreatmentPlan / Observation ----------

class TreatmentPlanCreate(BaseModel):
    name: str
    status: str = "Approved"
    type: str = "Treatment"
    total: float = 0
    issued: float = 0


class TreatmentPlanRead(ORMModel):
    id: str
    order_id: str
    name: str
    created_at: datetime
    status: str
    type: str
    total: float
    issued: float


class ObservationCreate(BaseModel):
    user_name: str
    plan: Optional[str] = None
    message: str


class ObservationRead(ORMModel):
    id: str
    order_id: str
    user_name: str
    created_at: datetime
    plan: Optional[str]
    message: str


# ---------- Order ----------

class OrderCreate(BaseModel):
    patient_id: str
    product_id: Optional[str] = None
    doctor_id: Optional[str] = None
    delivery_center_id: Optional[str] = None
    status: str = "plan_pending"
    total: float = 0
    currency: str = "EUR"
    urgent: bool = False
    delivery_on: Optional[datetime] = None
    chief_complain: Optional[str] = None
    treat_both_arch: bool = False
    treatment_plan_type: Optional[str] = None
    dont_move: Optional[str] = None
    ap_relationship: Optional[str] = None
    anteroposterior: Optional[str] = None
    elastics: Optional[str] = None
    open_bite: Optional[str] = None
    midline: Optional[str] = None
    ipr: Optional[str] = None
    bite_ramps: Optional[str] = None
    crossbite: Optional[str] = None
    spaces: Optional[str] = None
    special_instructions: Optional[str] = None
    cbct_enabled: bool = False
    want_manufacturing: bool = False
    material: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    total: Optional[float] = None
    urgent: Optional[bool] = None
    delivery_on: Optional[datetime] = None
    special_instructions: Optional[str] = None


class OrderPhaseRead(ORMModel):
    id: str
    title: str
    details: Optional[str]
    created_at: datetime


class OrderRead(ORMModel):
    id: str
    ref: str
    status: str
    patient_id: str
    patient: Optional[PatientRead] = None
    product_id: Optional[str]
    product: Optional[ProductRead] = None
    doctor_id: Optional[str]
    doctor: Optional[DoctorRead] = None
    delivery_center_id: Optional[str]
    delivery_center: Optional[DeliveryCenterRead] = None
    total: float
    currency: str
    urgent: bool
    requested_at: datetime
    delivery_on: Optional[datetime]
    chief_complain: Optional[str]
    treat_both_arch: bool
    treatment_plan_type: Optional[str]
    dont_move: Optional[str]
    ap_relationship: Optional[str]
    anteroposterior: Optional[str]
    elastics: Optional[str]
    open_bite: Optional[str]
    midline: Optional[str]
    ipr: Optional[str]
    bite_ramps: Optional[str]
    crossbite: Optional[str]
    spaces: Optional[str]
    special_instructions: Optional[str]
    cbct_enabled: bool
    want_manufacturing: bool
    material: Optional[str]
    treatment_plans: list[TreatmentPlanRead] = []
    observations: list[ObservationRead] = []
    phases: list[OrderPhaseRead] = []


# ---------- Invoice ----------

class InvoiceCreate(BaseModel):
    status: str = "draft"
    due_date: Optional[date] = None
    total: float = 0
    summary: Optional[str] = None
    billing_company: Optional[str] = None
    billing_address: Optional[str] = None
    billing_vat: Optional[str] = None
    billing_email: Optional[str] = None
    order_ids: list[str] = []


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    total: Optional[float] = None
    summary: Optional[str] = None


class InvoiceOrderLine(BaseModel):
    ref: str
    patient: str
    product: str
    date: datetime
    amount: float
    doctor: Optional[str] = None


class InvoiceRead(ORMModel):
    id: str
    number: str
    status: str
    issue_date: date
    due_date: Optional[date]
    total: float
    summary: Optional[str]
    billing_company: Optional[str]
    billing_address: Optional[str]
    billing_vat: Optional[str]
    billing_email: Optional[str]
    orders: list[InvoiceOrderLine] = []


# ---------- LabOrder ----------

class LabOrderCreate(BaseModel):
    case_id: str
    patient_id: str
    lab: Optional[str] = None
    status: str = "pending"
    eta: Optional[date] = None
    stages: int = 1


class LabOrderUpdate(BaseModel):
    lab: Optional[str] = None
    status: Optional[str] = None
    eta: Optional[date] = None
    stages: Optional[int] = None


class LabOrderRead(ORMModel):
    id: str
    ref: str
    case_id: str
    case_number: Optional[str] = None
    patient_id: str
    patient: Optional[PatientRead] = None
    lab: Optional[str]
    status: str
    ordered_at: date
    eta: Optional[date]
    stages: int


# ---------- Calendar ----------

class CalendarEvent(BaseModel):
    id: str
    category: str
    date: datetime
    title: str
    ref: str
    url: str


# ---------- Notifications ----------

class NotificationItem(BaseModel):
    id: str
    message: str
    order_ref: str
    created_at: datetime


# ---------- Company settings ----------

class CompanySettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    fiscal_name: Optional[str] = None
    nif: Optional[str] = None
    billing_address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    billing_email: Optional[str] = None


class CompanySettingsRead(ORMModel):
    company_name: Optional[str]
    fiscal_name: Optional[str]
    nif: Optional[str]
    billing_address: Optional[str]
    city: Optional[str]
    postal_code: Optional[str]
    country: Optional[str]
    phone: Optional[str]
    billing_email: Optional[str]
