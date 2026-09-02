from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/patients", tags=["patients"])


def _to_read(patient: models.Patient) -> schemas.PatientRead:
    read = schemas.PatientRead.model_validate(patient)
    read.cases_count = len(patient.cases)
    return read


@router.get("", response_model=list[schemas.PatientRead])
def list_patients(db: Session = Depends(get_db)):
    patients = db.query(models.Patient).order_by(models.Patient.created_at.desc()).all()
    return [_to_read(p) for p in patients]


@router.post("", response_model=schemas.PatientRead)
def create_patient(payload: schemas.PatientCreate, db: Session = Depends(get_db)):
    patient = models.Patient(**payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return _to_read(patient)


@router.get("/{patient_id}", response_model=schemas.PatientRead)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.get(models.Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _to_read(patient)


@router.put("/{patient_id}", response_model=schemas.PatientRead)
def update_patient(patient_id: str, payload: schemas.PatientUpdate, db: Session = Depends(get_db)):
    patient = db.get(models.Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return _to_read(patient)


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.get(models.Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
