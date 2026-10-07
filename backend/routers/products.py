from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])


def check_relations(data, db: Session):
    """Kategoriya va brend haqiqatan mavjudligini tekshiradi."""
    if db.get(models.Category, data.category_id) is None:
        raise HTTPException(status_code=400, detail="Bunday kategoriya yo'q")
    if data.brand_id is not None and db.get(models.Brand, data.brand_id) is None:
        raise HTTPException(status_code=400, detail="Bunday brend yo'q")


def get_product_or_404(product_id: int, db: Session) -> models.Product:
    product = db.get(models.Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    return product


# ---------- MAHSULOTLAR ----------

@router.post(
    "/",
    response_model=schemas.ProductOut,
    status_code=201,
    dependencies=[Depends(get_current_user)],  # ← himoyalangan
)
def create_product(data: schemas.ProductCreate, db: Session = Depends(get_db)):
    check_relations(data, db)
    product = models.Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/", response_model=list[schemas.ProductOut])
def list_products(
    q: str | None = None,
    category_id: int | None = None,
    brand_id: int | None = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(models.Product)
    if q:
        query = query.filter(models.Product.name.ilike(f"%{q}%"))
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if brand_id:
        query = query.filter(models.Product.brand_id == brand_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return get_product_or_404(product_id, db)


@router.put(
    "/{product_id}",
    response_model=schemas.ProductOut,
    dependencies=[Depends(get_current_user)],  # ← himoyalangan
)
def update_product(
    product_id: int, data: schemas.ProductUpdate, db: Session = Depends(get_db)
):
    product = get_product_or_404(product_id, db)
    check_relations(data, db)
    for field, value in data.model_dump().items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete(
    "/{product_id}",
    status_code=204,
    dependencies=[Depends(get_current_user)],
)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = get_product_or_404(product_id, db)

    variant_ids = [v.id for v in product.variants]
    if variant_ids:
        used = (
            db.query(models.OrderItem)
            .filter(models.OrderItem.variant_id.in_(variant_ids))
            .first()
        )
        if used:
            raise HTTPException(
                status_code=400,
                detail="Bu mahsulot buyurtmalarda ishlatilgan, o'chirib bo'lmaydi. Buning o'rniga 'Nofaol' qiling.",
            )

    db.delete(product)
    db.commit()
    return Response(status_code=204)


# ---------- VARIANTLAR ----------

@router.post(
    "/{product_id}/variants",
    response_model=schemas.VariantOut,
    status_code=201,
    dependencies=[Depends(get_current_user)],  # ← himoyalangan
)
def create_variant(
    product_id: int, data: schemas.VariantCreate, db: Session = Depends(get_db)
):
    get_product_or_404(product_id, db)
    exists = (
        db.query(models.ProductVariant)
        .filter(
            models.ProductVariant.product_id == product_id,
            models.ProductVariant.size == data.size,
            models.ProductVariant.color == data.color,
        )
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=400, detail="Bu o'lcham va rangdagi variant allaqachon bor"
        )
    variant = models.ProductVariant(product_id=product_id, **data.model_dump())
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


@router.put(
    "/{product_id}/variants/{variant_id}",
    response_model=schemas.VariantOut,
    dependencies=[Depends(get_current_user)],  # ← himoyalangan
)
def update_variant(
    product_id: int,
    variant_id: int,
    data: schemas.VariantCreate,
    db: Session = Depends(get_db),
):
    variant = db.get(models.ProductVariant, variant_id)
    if variant is None or variant.product_id != product_id:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    for field, value in data.model_dump().items():
        setattr(variant, field, value)
    db.commit()
    db.refresh(variant)
    return variant


@router.delete(
    "/{product_id}/variants/{variant_id}",
    status_code=204,
    dependencies=[Depends(get_current_user)],
)
def delete_variant(product_id: int, variant_id: int, db: Session = Depends(get_db)):
    variant = db.get(models.ProductVariant, variant_id)
    if variant is None or variant.product_id != product_id:
        raise HTTPException(status_code=404, detail="Variant topilmadi")

    used = (
        db.query(models.OrderItem)
        .filter(models.OrderItem.variant_id == variant_id)
        .first()
    )
    if used:
        raise HTTPException(
            status_code=400,
            detail="Bu variant buyurtmalarda ishlatilgan, o'chirib bo'lmaydi",
        )

    db.delete(variant)
    db.commit()
    return Response(status_code=204)