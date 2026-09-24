from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post(
    "/",
    response_model=schemas.CustomerOut,
    status_code=201,
    dependencies=[Depends(get_current_user)],
)
def create_customer(data: schemas.CustomerCreate, db: Session = Depends(get_db)):
    if db.query(models.Customer).filter(models.Customer.phone == data.phone).first():
        raise HTTPException(status_code=400, detail="Bu telefon raqam allaqachon bor")
    customer = models.Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get(
    "/",
    response_model=list[schemas.CustomerOut],
    dependencies=[Depends(get_current_user)],
)
def list_customers(
    q: str | None = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(models.Customer)
    if q:
        query = query.filter(
            models.Customer.full_name.ilike(f"%{q}%")
            | models.Customer.phone.ilike(f"%{q}%")
        )
    return query.offset(skip).limit(limit).all()


@router.get(
    "/{customer_id}",
    response_model=schemas.CustomerOut,
    dependencies=[Depends(get_current_user)],
)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    return customer


@router.put(
    "/{customer_id}",
    response_model=schemas.CustomerOut,
    dependencies=[Depends(get_current_user)],
)
def update_customer(
    customer_id: int, data: schemas.CustomerCreate, db: Session = Depends(get_db)
):
    customer = db.get(models.Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    duplicate = (
        db.query(models.Customer)
        .filter(models.Customer.phone == data.phone, models.Customer.id != customer_id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Bu telefon raqam allaqachon bor")
    for field, value in data.model_dump().items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.get(
    "/{customer_id}/orders",
    response_model=list[schemas.OrderOut],
    dependencies=[Depends(get_current_user)],
)
def customer_orders(customer_id: int, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    return customer.orders