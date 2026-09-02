from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("", response_model=list[schemas.DoctorRead])
def list_doctors(db: Session = Depends(get_db)):
    return db.query(models.Doctor).all()


@router.post("", response_model=schemas.DoctorRead)
def create_doctor(payload: schemas.DoctorCreate, db: Session = Depends(get_db)):
    doctor = models.Doctor(**payload.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.put("/{doctor_id}", response_model=schemas.DoctorRead)
def update_doctor(doctor_id: str, payload: schemas.DoctorUpdate, db: Session = Depends(get_db)):
    doctor = db.get(models.Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(doctor, field, value)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/{doctor_id}", status_code=204)
def delete_doctor(doctor_id: str, db: Session = Depends(get_db)):
    doctor = db.get(models.Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db.delete(doctor)
    db.commit()
