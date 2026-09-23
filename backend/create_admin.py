from getpass import getpass

from database import Base, SessionLocal, engine
import models
from security import hash_password

Base.metadata.create_all(bind=engine)

full_name = input("To'liq ism: ")
email = input("Email: ")
password = getpass("Parol (yozganingiz ko'rinmaydi): ")

db = SessionLocal()
if db.query(models.User).filter(models.User.email == email).first():
    print("Bunday email allaqachon bor")
else:
    user = models.User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        role="admin",
    )
    db.add(user)
    db.commit()
    print("Admin yaratildi!")
db.close()