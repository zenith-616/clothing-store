from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/brands", tags=["Brands"])


@router.post("/", response_model=schemas.BrandOut, status_code=201)
def create_brand(data: schemas.BrandCreate, db: Session = Depends(get_db)):
    exists = db.query(models.Brand).filter(models.Brand.name == data.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Bunday brend allaqachon bor")
    brand = models.Brand(name=data.name)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


@router.get("/", response_model=list[schemas.BrandOut])
def list_brands(db: Session = Depends(get_db)):
    return db.query(models.Brand).all()


@router.get("/{brand_id}", response_model=schemas.BrandOut)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = db.get(models.Brand, brand_id)
    if brand is None:
        raise HTTPException(status_code=404, detail="Brend topilmadi")
    return brand


@router.put("/{brand_id}", response_model=schemas.BrandOut)
def update_brand(brand_id: int, data: schemas.BrandUpdate, db: Session = Depends(get_db)):
    brand = db.get(models.Brand, brand_id)
    if brand is None:
        raise HTTPException(status_code=404, detail="Brend topilmadi")
    duplicate = (
        db.query(models.Brand)
        .filter(models.Brand.name == data.name, models.Brand.id != brand_id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Bunday brend allaqachon bor")
    brand.name = data.name
    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/{brand_id}", status_code=204)
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = db.get(models.Brand, brand_id)
    if brand is None:
        raise HTTPException(status_code=404, detail="Brend topilmadi")
    if brand.products:
        raise HTTPException(
            status_code=400,
            detail="Bu brendda mahsulotlar bor, avval ularni ko'chiring",
        )
    db.delete(brand)
    db.commit()
    return Response(status_code=204)