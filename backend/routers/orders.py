from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

STATUSES = ["yangi", "tasdiqlandi", "tayyorlanmoqda", "yetkazilmoqda", "yetkazildi", "bekor qilindi"]

# Qaysi statusdan qaysisiga o'tish mumkin
ALLOWED_TRANSITIONS = {
    "yangi": ["tasdiqlandi", "bekor qilindi"],
    "tasdiqlandi": ["tayyorlanmoqda", "bekor qilindi"],
    "tayyorlanmoqda": ["yetkazilmoqda", "bekor qilindi"],
    "yetkazilmoqda": ["yetkazildi", "bekor qilindi"],
    "yetkazildi": [],
    "bekor qilindi": [],
}


def get_order_or_404(order_id: int, db: Session) -> models.Order:
    order = db.get(models.Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    return order


@router.post(
    "/",
    response_model=schemas.OrderOut,
    status_code=201,
    dependencies=[Depends(get_current_user)],
)
def create_order(data: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, data.customer_id)
    if customer is None:
        raise HTTPException(status_code=400, detail="Bunday mijoz yo'q")

    order = models.Order(
        customer_id=customer.id,
        address=data.address or customer.address,
        status="yangi",
    )
    total = 0.0

    for item in data.items:
        variant = db.get(models.ProductVariant, item.variant_id)
        if variant is None:
            raise HTTPException(
                status_code=400, detail=f"Variant {item.variant_id} topilmadi"
            )
        if not variant.product.is_active:
            raise HTTPException(
                status_code=400, detail=f"'{variant.product.name}' sotuvda emas"
            )
        if variant.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"'{variant.product.name}' ({variant.color}, {variant.size}) "
                    f"omborda yetarli emas. Qolgan: {variant.stock}"
                ),
            )

        variant.stock -= item.quantity  # omborni kamaytirish
        price = variant.product.price  # narxni bazadan olamiz
        total += price * item.quantity
        order.items.append(
            models.OrderItem(variant_id=variant.id, quantity=item.quantity, price=price)
        )

    order.total_price = total
    db.add(order)
    db.commit()  # hammasi birga saqlanadi yoki hech narsa
    db.refresh(order)
    return order


@router.get(
    "/",
    response_model=list[schemas.OrderOut],
    dependencies=[Depends(get_current_user)],
)
def list_orders(
    status: str | None = None,
    customer_id: int | None = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(models.Order)
    if status:
        query = query.filter(models.Order.status == status)
    if customer_id:
        query = query.filter(models.Order.customer_id == customer_id)
    return query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()


@router.get(
    "/{order_id}",
    response_model=schemas.OrderOut,
    dependencies=[Depends(get_current_user)],
)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return get_order_or_404(order_id, db)


@router.patch(
    "/{order_id}/status",
    response_model=schemas.OrderOut,
    dependencies=[Depends(get_current_user)],
)
def update_status(
    order_id: int, data: schemas.OrderStatusUpdate, db: Session = Depends(get_db)
):
    order = get_order_or_404(order_id, db)
    if data.status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"Status: {', '.join(STATUSES)}")
    if data.status not in ALLOWED_TRANSITIONS[order.status]:
        raise HTTPException(
            status_code=400,
            detail=f"'{order.status}' dan '{data.status}' ga o'tib bo'lmaydi",
        )

    # bekor qilinsa, omborga qaytaramiz
    if data.status == "bekor qilindi":
        for item in order.items:
            item.variant.stock += item.quantity

    order.status = data.status
    db.commit()
    db.refresh(order)
    return order