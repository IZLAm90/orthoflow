import random
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/lab-orders", tags=["lab-orders"])


def _gen_ref(db: Session) -> str:
    year = datetime.utcnow().year
    while True:
        ref = f"LOD-{year}-" + "".join(random.choices(string.digits, k=3))
        if not db.query(models.LabOrder).filter(models.LabOrder.ref == ref).first():
            return ref


def _to_read(lab_order: models.LabOrder) -> schemas.LabOrderRead:
    read = schemas.LabOrderRead.model_validate(lab_order)
    read.case_number = lab_order.case.case_number if lab_order.case else None
    read.order_ref = lab_order.order.ref if lab_order.order else None
    return read


@router.get("", response_model=list[schemas.LabOrderRead])
def list_lab_orders(db: Session = Depends(get_db)):
    orders = db.query(models.LabOrder).order_by(models.LabOrder.ordered_at.desc()).all()
    return [_to_read(o) for o in orders]


@router.post("", response_model=schemas.LabOrderRead)
def create_lab_order(payload: schemas.LabOrderCreate, db: Session = Depends(get_db)):
    if not payload.case_id and not payload.order_id:
        raise HTTPException(status_code=400, detail="Either case_id or order_id is required")
    if payload.case_id and db.get(models.Case, payload.case_id) is None:
        raise HTTPException(status_code=404, detail="Case not found")
    if payload.order_id and db.get(models.Order, payload.order_id) is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if db.get(models.Patient, payload.patient_id) is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    lab_order = models.LabOrder(**payload.model_dump(), ref=_gen_ref(db))
    db.add(lab_order)
    db.commit()
    db.refresh(lab_order)
    return _to_read(lab_order)


@router.get("/{lab_order_id}", response_model=schemas.LabOrderRead)
def get_lab_order(lab_order_id: str, db: Session = Depends(get_db)):
    lab_order = db.get(models.LabOrder, lab_order_id)
    if lab_order is None:
        raise HTTPException(status_code=404, detail="Lab order not found")
    return _to_read(lab_order)


@router.put("/{lab_order_id}", response_model=schemas.LabOrderRead)
def update_lab_order(lab_order_id: str, payload: schemas.LabOrderUpdate, db: Session = Depends(get_db)):
    lab_order = db.get(models.LabOrder, lab_order_id)
    if lab_order is None:
        raise HTTPException(status_code=404, detail="Lab order not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lab_order, field, value)
    db.commit()
    db.refresh(lab_order)
    return _to_read(lab_order)


@router.delete("/{lab_order_id}", status_code=204)
def delete_lab_order(lab_order_id: str, db: Session = Depends(get_db)):
    lab_order = db.get(models.LabOrder, lab_order_id)
    if lab_order is None:
        raise HTTPException(status_code=404, detail="Lab order not found")
    db.delete(lab_order)
    db.commit()
