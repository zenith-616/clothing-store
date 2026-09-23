from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/categories", tags=["Categories"])


# CREATE: yangi kategoriya qo'shish
@router.post("/", response_model=schemas.CategoryOut, status_code=201)
def create_category(data: schemas.CategoryCreate, db: Session = Depends(get_db)):
    exists = db.query(models.Category).filter(models.Category.name == data.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Bunday kategoriya allaqachon bor")
    category = models.Category(name=data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# READ: barcha kategoriyalar ro'yxati
@router.get("/", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


# READ: bitta kategoriya
@router.get("/{category_id}", response_model=schemas.CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.get(models.Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")
    return category


# UPDATE: kategoriya nomini o'zgartirish
@router.put("/{category_id}", response_model=schemas.CategoryOut)
def update_category(
    category_id: int, data: schemas.CategoryUpdate, db: Session = Depends(get_db)
):
    category = db.get(models.Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")
    category.name = data.name
    db.commit()
    db.refresh(category)
    return category


# DELETE: kategoriyani o'chirish
@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.get(models.Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")
    if category.products:
        raise HTTPException(
            status_code=400,
            detail="Bu kategoriyada mahsulotlar bor, avval ularni ko'chiring",
        )
    db.delete(category)
    db.commit()
    return Response(status_code=204)