import re
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CategoryOut(BaseModel):
    id: int
    name: str

    # bazadagi obyektni avtomatik JSON'ga aylantirish uchun
    model_config = ConfigDict(from_attributes=True)

class BrandCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class BrandUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class BrandOut(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)
class VariantCreate(BaseModel):
    size: str = Field(min_length=1, max_length=20)
    color: str = Field(min_length=1, max_length=50)
    stock: int = Field(default=0, ge=0)  # ge=0: manfiy bo'lmasin
    sku: str | None = None


class VariantOut(BaseModel):
    id: int
    size: str
    color: str
    stock: int
    sku: str | None

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    price: float = Field(gt=0)
    category_id: int
    brand_id: int | None = None
    is_active: bool = True
    image_url: str | None = None


class ProductUpdate(ProductCreate):
    pass  # yaratishdagi maydonlarning o'zi


class ProductOut(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    is_active: bool
    image_url: str | None
    category: CategoryOut | None
    brand: BrandOut | None
    variants: list[VariantOut] = []
    total_stock: int = 0

    model_config = ConfigDict(from_attributes=True)

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str

class CustomerCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=7, max_length=20)
    telegram_id: int | None = None
    address: str | None = None


class CustomerOut(BaseModel):
    id: int
    full_name: str
    phone: str
    telegram_id: int | None
    address: str | None

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    variant_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    customer_id: int
    address: str | None = None
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderStatusUpdate(BaseModel):
    status: str


class OrderItemOut(BaseModel):
    id: int
    variant_id: int
    quantity: int
    price: float
    variant: VariantOut | None = None

    model_config = ConfigDict(from_attributes=True)


class OrderOut(BaseModel):
    id: int
    status: str
    total_price: float
    address: str | None
    created_at: datetime
    customer: CustomerOut
    items: list[OrderItemOut] = []

    model_config = ConfigDict(from_attributes=True)

class TopProduct(BaseModel):
    product_id: int
    name: str
    sold: int


class DashboardOut(BaseModel):
    today_orders: int
    today_revenue: float
    total_orders: int
    total_revenue: float
    new_orders: int
    low_stock_variants: int
    top_products: list[TopProduct]
    daily_revenue: list[DailyRevenue]

class DailyRevenue(BaseModel):
    date: str
    revenue: float
    orders: int

class UserCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(max_length=100)
    role: str = Field(default="operator")

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        if not re.search(r"[0-9]", v):
            raise ValueError("Parolda kamida 1 ta raqam bo'lishi kerak")
        if not any(ch.isupper() for ch in v):
            raise ValueError("Parolda kamida 1 ta katta harf bo'lishi kerak")
        return v


class UserUpdate(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    role: str
    is_active: bool