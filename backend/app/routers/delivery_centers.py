from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/delivery-centers", tags=["delivery-centers"])


@router.get("", response_model=list[schemas.DeliveryCenterRead])
def list_delivery_centers(db: Session = Depends(get_db)):
    return db.query(models.DeliveryCenter).all()


@router.post("", response_model=schemas.DeliveryCenterRead)
def create_delivery_center(payload: schemas.DeliveryCenterCreate, db: Session = Depends(get_db)):
    center = models.DeliveryCenter(**payload.model_dump())
    db.add(center)
    db.commit()
    db.refresh(center)
    return center


@router.put("/{center_id}", response_model=schemas.DeliveryCenterRead)
def update_delivery_center(center_id: str, payload: schemas.DeliveryCenterUpdate, db: Session = Depends(get_db)):
    center = db.get(models.DeliveryCenter, center_id)
    if center is None:
        raise HTTPException(status_code=404, detail="Delivery center not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(center, field, value)
    db.commit()
    db.refresh(center)
    return center


@router.delete("/{center_id}", status_code=204)
def delete_delivery_center(center_id: str, db: Session = Depends(get_db)):
    center = db.get(models.DeliveryCenter, center_id)
    if center is None:
        raise HTTPException(status_code=404, detail="Delivery center not found")
    db.delete(center)
    db.commit()
