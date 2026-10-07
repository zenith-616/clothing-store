from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
import models
from routers import categories, brands, products, auth, customers, orders, dashboard, storefront

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clothing Store API")

origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5501",
    "http://127.0.0.1:5501",
    "null",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.ngrok-free\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(brands.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
app.include_router(storefront.router)

app.mount("/app", StaticFiles(directory="../webapp", html=True), name="webapp")

@app.get("/")
def root():
    return {"message": "Kiyim do'koni API ishlayapti!"}


@app.get("/health")
def health():
    return {"status": "ok"}