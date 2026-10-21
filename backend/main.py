import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from database import engine, Base, SessionLocal
import models
from security import hash_password
from routers import categories, brands, products, auth, customers, orders, dashboard, storefront, users

Base.metadata.create_all(bind=engine)


def fix_telegram_id_column():
    with engine.connect() as conn:
        try:
            conn.execute(text(
                "ALTER TABLE customers ALTER COLUMN telegram_id TYPE BIGINT"
            ))
            conn.commit()
        except Exception:
            pass


fix_telegram_id_column()

def fix_product_image_column():
    with engine.connect() as conn:
        try:
            conn.execute(text(
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)"
            ))
            conn.commit()
        except Exception:
            pass


fix_product_image_column()


def create_default_admin():
    db = SessionLocal()
    try:
        email = os.getenv("ADMIN_EMAIL")
        password = os.getenv("ADMIN_PASSWORD")
        if not email or not password:
            return
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            return
        admin = models.User(
            full_name="Admin",
            email=email,
            password_hash=hash_password(password),
            role="admin",
        )
        db.add(admin)
        db.commit()
    finally:
        db.close()


create_default_admin()

app = FastAPI(title="Clothing Store API")

origins = [
    "https://clothing-store-admin-eu9q.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def no_cache_for_webapp(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/app"):
        response.headers["Cache-Control"] = "no-cache"
    return response

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(brands.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
app.include_router(storefront.router)
app.include_router(users.router)

app.mount("/app", StaticFiles(directory="../webapp", html=True), name="webapp")


@app.get("/")
def root():
    return {"message": "Kiyim do'koni API ishlayapti!"}


@app.get("/health")
def health():
    return {"status": "ok"}