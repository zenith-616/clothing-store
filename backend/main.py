from fastapi import FastAPI

from database import engine, Base
import models
from routers import categories
from routers import categories, brands


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clothing Store API")

app.include_router(categories.router)
app.include_router(brands.router)


@app.get("/")
def root():
    return {"message": "Kiyim do'koni API ishlayapti!"}


@app.get("/health")
def health():
    return {"status": "ok"}