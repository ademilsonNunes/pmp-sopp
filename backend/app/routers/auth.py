from datetime import datetime,timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_hash,
)
from app.deps import get_current_user, require_roles
from app import models, schemas
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 10


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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )

    access_token = create_access_token({
        "sub": user.username,
        "role": user.role,
    })

    refresh_token = create_refresh_token({
        "sub": user.username,
    })

    db_refresh = models.RefreshToken(
        user_id=user.id,
        token_hash=get_token_hash(refresh_token),
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None)
        + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
    )
    db.add(db_refresh)
    db.commit()

    return schemas.Token(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=schemas.Token)
def refresh_token(
    payload: schemas.RefreshRequest,
    db: Session = Depends(get_db),
):
    decoded = decode_token(payload.refresh_token)

    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido",
        )

    username = decoded.get("sub")
    token_hash = get_token_hash(payload.refresh_token)

    stored = db.execute(
        select(models.RefreshToken).where(models.RefreshToken.token_hash == token_hash)
    ).scalar_one_or_none()

    if not stored:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token não encontrado",
        )

    if stored.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revogado",
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if stored.expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expirado",
        )

    user = db.execute(
        select(models.User).where(models.User.username == username)
    ).scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inválido",
        )

    stored.revoked_at = now

    new_access_token = create_access_token({
        "sub": user.username,
        "role": user.role,
    })

    new_refresh_token = create_refresh_token({
        "sub": user.username,
    })

    db.add(
        models.RefreshToken(
            user_id=user.id,
            token_hash=get_token_hash(new_refresh_token),
            expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
        )
    )
    db.commit()

    return schemas.Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )

@router.post("/logout")
def logout(
    payload: schemas.LogoutRequest,
    db: Session = Depends(get_db),
):
    token_hash = get_token_hash(payload.refresh_token)

    stored = db.execute(
        select(models.RefreshToken).where(models.RefreshToken.token_hash == token_hash)
    ).scalar_one_or_none()

    if stored and stored.revoked_at is None:
        stored.revoked_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()

    return {"message": "Logout realizado com sucesso"}


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

@router.patch("/users/{user_id}/unlock", response_model=schemas.UserOut)
def unlock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.failed_login_attempts = 0
    user.blocked_until = None
    user.last_failed_login_at = None

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