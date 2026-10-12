from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

LOW_STOCK_LIMIT = 5


@router.get(
    "/",
    response_model=schemas.DashboardOut,
    dependencies=[Depends(get_current_user)],
)
def dashboard(db: Session = Depends(get_db)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # bekor qilingan buyurtmalar daromadga kirmaydi
    valid = models.Order.status != "bekor qilindi"

    today_orders = (
        db.query(func.count(models.Order.id))
        .filter(models.Order.created_at >= today_start)
        .scalar()
    )
    today_revenue = (
        db.query(func.coalesce(func.sum(models.Order.total_price), 0))
        .filter(models.Order.created_at >= today_start, valid)
        .scalar()
    )
    total_orders = db.query(func.count(models.Order.id)).scalar()
    total_revenue = (
        db.query(func.coalesce(func.sum(models.Order.total_price), 0))
        .filter(valid)
        .scalar()
    )
    new_orders = (
        db.query(func.count(models.Order.id))
        .filter(models.Order.status == "yangi")
        .scalar()
    )
    low_stock = (
        db.query(func.count(models.ProductVariant.id))
        .filter(models.ProductVariant.stock <= LOW_STOCK_LIMIT)
        .scalar()
    )

    # eng ko'p sotilgan 5 ta mahsulot
    rows = (
        db.query(
            models.Product.id,
            models.Product.name,
            func.sum(models.OrderItem.quantity).label("sold"),
        )
        .join(models.ProductVariant, models.ProductVariant.product_id == models.Product.id)
        .join(models.OrderItem, models.OrderItem.variant_id == models.ProductVariant.id)
        .join(models.Order, models.Order.id == models.OrderItem.order_id)
        .filter(valid)
        .group_by(models.Product.id, models.Product.name)
        .order_by(func.sum(models.OrderItem.quantity).desc())
        .limit(5)
        .all()
    )
        # Oxirgi 7 kunlik daromad
    daily_data = []
    for i in range(6, -1, -1):
        day_start = (datetime.utcnow() - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)

        day_revenue = (
            db.query(func.coalesce(func.sum(models.Order.total_price), 0))
            .filter(
                models.Order.created_at >= day_start,
                models.Order.created_at < day_end,
                valid,
            )
            .scalar()
        )
        day_orders = (
            db.query(func.count(models.Order.id))
            .filter(
                models.Order.created_at >= day_start,
                models.Order.created_at < day_end,
            )
            .scalar()
        )
        daily_data.append({
            "date": day_start.strftime("%d.%m"),
            "revenue": day_revenue,
            "orders": day_orders,
        })

    return {
    "today_orders": today_orders,
    "today_revenue": today_revenue,
    "total_orders": total_orders,
    "total_revenue": total_revenue,
    "new_orders": new_orders,
    "low_stock_variants": low_stock,
    "top_products": [
        {"product_id": r.id, "name": r.name, "sold": int(r.sold)} for r in rows
    ],
    "daily_revenue": daily_data,
    }