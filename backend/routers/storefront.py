from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/storefront", tags=["Storefront"])


class TelegramRegisterIn(BaseModel):
    telegram_id: int
    full_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=7, max_length=20)
    address: str | None = None


class TelegramOrderItemIn(BaseModel):
    variant_id: int
    quantity: int = Field(gt=0)


class TelegramOrderIn(BaseModel):
    telegram_id: int
    address: str | None = None
    items: list[TelegramOrderItemIn] = Field(min_length=1)


@router.post("/register", response_model=schemas.CustomerOut)
def register(data: TelegramRegisterIn, db: Session = Depends(get_db)):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.telegram_id == data.telegram_id)
        .first()
    )
    if customer:
        customer.full_name = data.full_name
        customer.phone = data.phone
        if data.address:
            customer.address = data.address
        db.commit()
        db.refresh(customer)
        return customer

    phone_owner = db.query(models.Customer).filter(models.Customer.phone == data.phone).first()
    if phone_owner:
        phone_owner.telegram_id = data.telegram_id
        db.commit()
        db.refresh(phone_owner)
        return phone_owner

    customer = models.Customer(
        full_name=data.full_name,
        phone=data.phone,
        telegram_id=data.telegram_id,
        address=data.address,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/categories", response_model=list[schemas.CategoryOut])
def categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@router.get("/products", response_model=list[schemas.ProductOut])
def products(category_id: int | None = None, q: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Product).filter(models.Product.is_active == True)
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if q:
        query = query.filter(models.Product.name.ilike(f"%{q}%"))
    return query.all()


@router.post("/orders", response_model=schemas.OrderOut, status_code=201)
def create_order(data: TelegramOrderIn, db: Session = Depends(get_db)):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.telegram_id == data.telegram_id)
        .first()
    )
    if customer is None:
        raise HTTPException(status_code=400, detail="Avval ro'yxatdan o'ting")

    order = models.Order(
        customer_id=customer.id,
        address=data.address or customer.address,
        status="yangi",
    )
    total = 0.0

    for item in data.items:
        variant = db.get(models.ProductVariant, item.variant_id)
        if variant is None:
            raise HTTPException(status_code=400, detail=f"Variant {item.variant_id} topilmadi")
        if not variant.product.is_active:
            raise HTTPException(status_code=400, detail=f"'{variant.product.name}' sotuvda emas")
        if variant.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"'{variant.product.name}' ({variant.color}, {variant.size}) "
                    f"omborda yetarli emas. Qolgan: {variant.stock}"
                ),
            )
        variant.stock -= item.quantity
        price = variant.product.price
        total += price * item.quantity
        order.items.append(
            models.OrderItem(variant_id=variant.id, quantity=item.quantity, price=price)
        )

    order.total_price = total
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/orders/{telegram_id}", response_model=list[schemas.OrderOut])
def my_orders(telegram_id: int, db: Session = Depends(get_db)):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.telegram_id == telegram_id)
        .first()
    )
    if customer is None:
        return []
    return sorted(customer.orders, key=lambda o: o.created_at, reverse=True)