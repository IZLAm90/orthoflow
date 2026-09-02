from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/cases", tags=["cases"])


def _gen_case_number(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(models.Case).filter(models.Case.case_number.like(f"OC-{year}-%")).count()
    return f"OC-{year}-{count + 1:04d}"


@router.get("", response_model=list[schemas.CaseRead])
def list_cases(db: Session = Depends(get_db)):
    return db.query(models.Case).order_by(models.Case.created_at.desc()).all()


@router.post("", response_model=schemas.CaseRead)
def create_case(payload: schemas.CaseCreate, db: Session = Depends(get_db)):
    patient = db.get(models.Patient, payload.patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    case = models.Case(**payload.model_dump(), case_number=_gen_case_number(db))
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}", response_model=schemas.CaseRead)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.get(models.Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.put("/{case_id}", response_model=schemas.CaseRead)
def update_case(case_id: str, payload: schemas.CaseUpdate, db: Session = Depends(get_db)):
    case = db.get(models.Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(case, field, value)
    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=204)
def delete_case(case_id: str, db: Session = Depends(get_db)):
    case = db.get(models.Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()


@router.post("/{case_id}/scans", response_model=schemas.ScanRead)
async def upload_scan(case_id: str, type: str = Form(...), file: UploadFile = None, db: Session = Depends(get_db)):
    case = db.get(models.Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    if file is None:
        raise HTTPException(status_code=400, detail="file is required")
    content = await file.read()
    scan = models.Scan(
        case_id=case_id,
        type=type,
        file_name=file.filename or "scan.stl",
        file_size=len(content),
        format=(file.filename or "").rsplit(".", 1)[-1].lower() if file.filename else "stl",
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan
