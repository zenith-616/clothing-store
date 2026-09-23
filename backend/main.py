from fastapi import FastAPI

from database import engine, Base
import models
from routers import categories
from routers import categories, brands
from routers import categories, brands, products
from routers import categories, brands, products, auth



Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clothing Store API")

app.include_router(categories.router)
app.include_router(brands.router)
app.include_router(products.router)
app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "Kiyim do'koni API ishlayapti!"}


@app.get("/health")
def health():
    return {"status": "ok"}