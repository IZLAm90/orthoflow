import random
import string
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/orders", tags=["orders"])


def _gen_ref(db: Session) -> str:
    while True:
        ref = "#" + "".join(random.choices(string.digits, k=6))
        if not db.query(models.Order).filter(models.Order.ref == ref).first():
            return ref


def _gen_lab_ref(db: Session) -> str:
    year = datetime.utcnow().year
    while True:
        ref = f"LOD-{year}-" + "".join(random.choices(string.digits, k=3))
        if not db.query(models.LabOrder).filter(models.LabOrder.ref == ref).first():
            return ref


def _ensure_lab_order(db: Session, order: models.Order) -> None:
    """A manufacturing-requesting order gets a linked LabOrder, mirroring how
    the reference platform's manufacturing step feeds its own fulfillment
    tracking. Only ever creates one per order."""
    if not order.want_manufacturing:
        return
    if db.query(models.LabOrder).filter(models.LabOrder.order_id == order.id).first():
        return
    lab_name = order.product.provider if order.product else order.material
    db.add(models.LabOrder(
        ref=_gen_lab_ref(db),
        order_id=order.id,
        patient_id=order.patient_id,
        lab=lab_name,
        eta=order.delivery_on.date() if order.delivery_on else None,
    ))


@router.get("", response_model=list[schemas.OrderRead])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.requested_at.desc()).all()


PHASE_FOR_STATUS = {
    "processing": ("Order Accepted", "Order was accepted by manufacturer"),
    "finished": ("Shipping", "Order has been sent"),
}


@router.post("", response_model=schemas.OrderRead)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    if db.get(models.Patient, payload.patient_id) is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    data = payload.model_dump()
    if data.get("delivery_on") is None:
        product = db.get(models.Product, payload.product_id) if payload.product_id else None
        delivery_days = product.delivery_start_days if product else 3
        data["delivery_on"] = datetime.utcnow() + timedelta(days=delivery_days)
    order = models.Order(**data, ref=_gen_ref(db))
    db.add(order)
    db.flush()
    db.add(models.OrderPhase(order_id=order.id, title="Order Placed", details="Order received and awaiting treatment plan review"))
    _ensure_lab_order(db, order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}", response_model=schemas.OrderRead)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/{order_id}", response_model=schemas.OrderRead)
def update_order(order_id: str, payload: schemas.OrderUpdate, db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    data = payload.model_dump(exclude_unset=True)
    new_status = data.get("status")
    for field, value in data.items():
        setattr(order, field, value)
    if new_status and new_status in PHASE_FOR_STATUS:
        title, details = PHASE_FOR_STATUS[new_status]
        db.add(models.OrderPhase(order_id=order.id, title=title, details=details))
    _ensure_lab_order(db, order)
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: str, db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()


@router.post("/{order_id}/treatment-plans", response_model=schemas.TreatmentPlanRead)
def add_treatment_plan(order_id: str, payload: schemas.TreatmentPlanCreate, db: Session = Depends(get_db)):
    if db.get(models.Order, order_id) is None:
        raise HTTPException(status_code=404, detail="Order not found")
    plan = models.TreatmentPlan(order_id=order_id, **payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.post("/{order_id}/observations", response_model=schemas.ObservationRead)
def add_observation(order_id: str, payload: schemas.ObservationCreate, db: Session = Depends(get_db)):
    if db.get(models.Order, order_id) is None:
        raise HTTPException(status_code=404, detail="Order not found")
    obs = models.Observation(order_id=order_id, **payload.model_dump())
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs
