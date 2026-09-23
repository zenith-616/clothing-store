from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite: bitta fayl ko'rinishidagi baza (store.db)
DATABASE_URL = "sqlite:///./store.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # faqat SQLite uchun kerak
)

# Har bir so'rov uchun bazaga ochiladigan "sessiya"
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Barcha modellar shu klassdan meros oladi
Base = declarative_base()


# FastAPI endpointlarda bazani olish uchun yordamchi funksiya
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()