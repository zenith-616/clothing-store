from fastapi import FastAPI

from database import engine, Base
import models  # jadvallar ro'yxatdan o'tishi uchun kerak

# Server ishga tushganda jadvallar yo'q bo'lsa, yaratadi
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clothing Store API")


@app.get("/")
def root():
    return {"message": "Kiyim do'koni API ishlayapti!"}


@app.get("/health")
def health():
    return {"status": "ok"}