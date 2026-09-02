from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/company", tags=["company"])


def _get_or_create(db: Session) -> models.CompanySettings:
    settings = db.get(models.CompanySettings, "default")
    if settings is None:
        settings = models.CompanySettings(id="default")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("", response_model=schemas.CompanySettingsRead)
def get_company_settings(db: Session = Depends(get_db)):
    return _get_or_create(db)


@router.put("", response_model=schemas.CompanySettingsRead)
def update_company_settings(payload: schemas.CompanySettingsUpdate, db: Session = Depends(get_db)):
    settings = _get_or_create(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
