from fastapi import FastAPI

from database import engine, Base
import models
from routers import categories
from routers import categories, brands
from routers import categories, brands, products
from routers import categories, brands, products, auth
from routers import categories, brands, products, auth, customers, orders




Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clothing Store API")

app.include_router(categories.router)
app.include_router(brands.router)
app.include_router(products.router)
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(orders.router)


@app.get("/")
def root():
    return {"message": "Kiyim do'koni API ishlayapti!"}


@app.get("/health")
def health():
    return {"status": "ok"}