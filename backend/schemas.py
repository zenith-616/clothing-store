from pydantic import BaseModel, ConfigDict, Field


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
    price: float = Field(gt=0)  # gt=0: noldan katta bo'lsin
    category_id: int
    brand_id: int | None = None
    is_active: bool = True


class ProductUpdate(ProductCreate):
    pass  # yaratishdagi maydonlarning o'zi


class ProductOut(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    is_active: bool
    category: CategoryOut | None
    brand: BrandOut | None
    variants: list[VariantOut] = []

    model_config = ConfigDict(from_attributes=True)

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str