from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.auth import verify_password, get_password_hash, create_access_token
from app.deps import get_current_user, require_roles
from app import models, schemas
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.execute(
        select(models.User).where(models.User.username == form_data.username)
    ).scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário inativo")
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return schemas.Token(access_token=access_token)


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
):
    existing = db.execute(
        select(models.User).where(models.User.username == user_data.username)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Nome de usuário já está em uso")
    user = models.User(
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role.upper(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário nao encontrado")
    
    data = payload.model_dump(exclude_none=True)

    if "role" in data:
        data["role"] = data["role"].upper()

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user



@router.post("/change-password")
def change_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Senha atual inválida")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "Senha alterada com sucesso"}



@router.get("/users", response_model=list[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
):
    users = db.execute(
        select(models.User).order_by(models.User.username)
    ).scalars().all()
    return users


@router.patch("/users/{user_id}/inactive", response_model=schemas.UserOut)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.is_active = False
    db.commit()
    db.refresh(user)
    return user

@router.patch("/users/{user_id}/active", response_model=schemas.UserOut)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.is_active = True
    db.commit()
    db.refresh(user)
    return user

@router.patch("/users/{user_id}/password")
def reset_user_password(
    user_id: int,
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.hashed_password = get_password_hash(payload.password)
    db.commit()
    return {"message": "Senha redefinida com sucesso"}