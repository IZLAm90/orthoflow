from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[schemas.ProductRead])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@router.post("", response_model=schemas.ProductRead)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=schemas.ProductRead)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.get(models.Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=schemas.ProductRead)
def update_product(product_id: str, payload: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.get(models.Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.get(models.Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
