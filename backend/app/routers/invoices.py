from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _gen_number(db: Session) -> str:
    count = db.query(models.Invoice).count()
    return f"#{count + 1:06d}"


def _to_read(invoice: models.Invoice) -> schemas.InvoiceRead:
    read = schemas.InvoiceRead.model_validate(invoice)
    lines = []
    for io in invoice.invoice_orders:
        order = io.order
        if order is None:
            continue
        lines.append(
            schemas.InvoiceOrderLine(
                ref=order.ref,
                patient=f"{order.patient.first_name} {order.patient.last_name}" if order.patient else "",
                product=order.product.name if order.product else "",
                date=order.requested_at,
                amount=float(order.total),
                doctor=order.doctor.name if order.doctor else None,
            )
        )
    read.orders = lines
    return read


@router.get("", response_model=list[schemas.InvoiceRead])
def list_invoices(db: Session = Depends(get_db)):
    invoices = db.query(models.Invoice).order_by(models.Invoice.issue_date.desc()).all()
    return [_to_read(i) for i in invoices]


@router.post("", response_model=schemas.InvoiceRead)
def create_invoice(payload: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"order_ids"}, exclude_unset=True)
    # New invoices snapshot the tenant's current billing info unless the caller
    # explicitly overrides a field.
    company = db.get(models.CompanySettings, "default")
    if company is not None:
        data.setdefault("billing_company", company.company_name)
        data.setdefault("billing_address", company.billing_address)
        data.setdefault("billing_vat", company.nif)
        data.setdefault("billing_email", company.billing_email)
    invoice = models.Invoice(**data, number=_gen_number(db))
    db.add(invoice)
    db.flush()
    for order_id in payload.order_ids:
        if db.get(models.Order, order_id) is None:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
        db.add(models.InvoiceOrder(invoice_id=invoice.id, order_id=order_id))
    db.commit()
    db.refresh(invoice)
    return _to_read(invoice)


@router.get("/{invoice_id}", response_model=schemas.InvoiceRead)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    invoice = db.get(models.Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _to_read(invoice)


@router.put("/{invoice_id}", response_model=schemas.InvoiceRead)
def update_invoice(invoice_id: str, payload: schemas.InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = db.get(models.Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(invoice, field, value)
    db.commit()
    db.refresh(invoice)
    return _to_read(invoice)


@router.delete("/{invoice_id}", status_code=204)
def delete_invoice(invoice_id: str, db: Session = Depends(get_db)):
    invoice = db.get(models.Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()
