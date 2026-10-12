from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import get_current_user, hash_password, require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/",
    response_model=schemas.UserOut,
    status_code=201,
    dependencies=[Depends(require_admin)],
)
def create_user(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if data.role not in ("admin", "operator"):
        raise HTTPException(status_code=400, detail="Rol admin yoki operator bo'lishi kerak")

    exists = db.query(models.User).filter(models.User.email == data.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan")

    user = models.User(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get(
    "/",
    response_model=list[schemas.UserOut],
    dependencies=[Depends(get_current_user)],
)
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


@router.put(
    "/{user_id}",
    response_model=schemas.UserOut,
    dependencies=[Depends(require_admin)],
)
def update_user(user_id: int, data: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Xodim topilmadi")
    if data.role not in ("admin", "operator"):
        raise HTTPException(status_code=400, detail="Rol admin yoki operator bo'lishi kerak")

    user.full_name = data.full_name
    user.role = data.role
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete(
    "/{user_id}",
    status_code=204,
    dependencies=[Depends(require_admin)],
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="O'zingizni o'chira olmaysiz")
    user = db.get(models.User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Xodim topilmadi")
    db.delete(user)
    db.commit()
    return None