from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app import models, schemas
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    decode_token,
    get_token_hash,
    generate_password_reset_token,
    get_password_reset_token_hash,
)
from app.config import settings
from app.database import get_db
from app.deps import (
     get_current_user,
     get_current_user_allow_password_change,
     require_roles,
)
from app.email_service import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 10

def _validate_password_policy(password: str) -> None:
    if len(password) < 10:
        raise HTTPException(
            status_code=400,
            detail="A nova senha deve ter no mínimo 10 caracteres",
        )

    if not any(char.isupper() for char in password):
        raise HTTPException(
            status_code=400,
            detail="A nova senha deve ter pelo menos 1 letra maiúscula",
        )

    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=400,
            detail="A nova senha deve ter pelo menos 1 número",
        )

    if not any(not char.isalnum() for char in password):
        raise HTTPException(
            status_code=400,
            detail="A nova senha deve ter pelo menos 1 caractere especial",
        )


def _ensure_password_not_in_history(
    db: Session,
    user: models.User,
    new_password: str,
) -> None:
    # não pode ser igual à senha atual
    if verify_password(new_password, user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="A nova senha não pode ser igual à senha atual",
        )

    # não pode repetir nenhuma das 5 últimas senhas
    history_items = db.execute(
        select(models.PasswordHistory)
        .where(models.PasswordHistory.user_id == user.id)
        .order_by(desc(models.PasswordHistory.created_at), desc(models.PasswordHistory.id))
        .limit(5)
    ).scalars().all()

    for item in history_items:
        if verify_password(new_password, item.hashed_password):
            raise HTTPException(
                status_code=400,
                detail="A nova senha não pode repetir nenhuma das últimas 5 senhas",
            )


def _store_current_password_in_history(
    db: Session,
    user: models.User,
) -> None:
    db.add(
        models.PasswordHistory(
            user_id=user.id,
            hashed_password=user.hashed_password,
        )
    )


def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client:
        return request.client.host or ""

    return ""


def _register_login_audit(
    db: Session,
    request: Request,
    user: models.User | None,
    sucesso: bool,
    motivo_falha: str | None = None,
) -> None:
    audit = models.LoginAudit(
        user_id=user.id if user else None,
        ip=_get_client_ip(request),
        user_agent=request.headers.get("user-agent", ""),
        sucesso=sucesso,
        motivo_falha=motivo_falha,
    )
    db.add(audit)
    db.commit()


@router.post("/login", response_model=schemas.Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    username = form_data.username.strip()

    user = db.execute(
        select(models.User).where(models.User.username == username)
    ).scalar_one_or_none()

    now = datetime.now()

    if user and user.blocked_until and user.blocked_until > now:
        _register_login_audit(
            db=db,
            request=request,
            user=user,
            sucesso=False,
            motivo_falha="USUARIO_BLOQUEADO",
        )
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Usuário bloqueado até {user.blocked_until.strftime('%d/%m/%Y %H:%M:%S')}. Procure um ADMIN ou aguarde 10 minutos.",
        )

    if not user:
        _register_login_audit(
            db=db,
            request=request,
            user=None,
            sucesso=False,
            motivo_falha="USUARIO_NAO_ENCONTRADO",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        user.last_failed_login_at = now

        motivo = "SENHA_INVALIDA"

        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.blocked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            motivo = "USUARIO_BLOQUEADO_POR_EXCESSO_DE_TENTATIVAS"

        db.commit()

        _register_login_audit(
            db=db,
            request=request,
            user=user,
            sucesso=False,
            motivo_falha=motivo,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        _register_login_audit(
            db=db,
            request=request,
            user=user,
            sucesso=False,
            motivo_falha="USUARIO_INATIVO",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )

    user.failed_login_attempts = 0
    user.blocked_until = None
    user.last_failed_login_at = None
    db.commit()

    _register_login_audit(
        db=db,
        request=request,
        user=user,
        sucesso=True,
        motivo_falha=None,
    )

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    refresh_token = create_refresh_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
    )

    refresh_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(
        minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
    )

    db.add(
        models.RefreshToken(
            user_id=user.id,
            token_hash=get_token_hash(refresh_token),
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None)
            + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
        )
    )
    db.commit()

    return schemas.Token(
        access_token=access_token,
        refresh_token=refresh_token,
        force_password_change=user.force_password_change,
        token_type="bearer",
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

    if user.force_password_change:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Troca de senha obrigatória. Altere a senha em /auth/change-password para continuar.",
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
            expires_at=now + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
        )
    )
    db.commit()

    return schemas.Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        force_password_change=False,
        token_type="bearer",
    )


@router.get("/admin/audit", response_model=list[schemas.LoginAuditOut])
def get_login_audit(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN")),
):
    audits = db.execute(
        select(models.LoginAudit).order_by(models.LoginAudit.timestamp.desc())
    ).scalars().all()
    return audits


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

    email = user_data.email.strip().lower() if user_data.email else None

    if email:
        existing_email = db.execute(
            select(models.User).where(models.User.email == email)
        ).scalar_one_or_none()

        if existing_email:
            raise HTTPException(status_code=400, detail="E-mail já está em uso")

    user = models.User(
        username=user_data.username,
        email=email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role.upper(),
        force_password_change=True,
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

    if "email" in data:
        data["email"] = data["email"].strip().lower() if data["email"] else None
    
        if data["email"]:
            existing_email = db.execute(
                select(models.User).where(
                    models.User.email == data["email"],
                    models.User.id != user_id,
                )
            ).scalar_one_or_none()
    
            if existing_email:
                raise HTTPException(status_code=400, detail="E-mail já está em uso") 

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.post("/change-password")
def change_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_allow_password_change),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Senha atual inválida")

    _validate_password_policy(payload.new_password)
    _ensure_password_not_in_history(db, current_user, payload.new_password)

    _store_current_password_in_history(db, current_user)

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.force_password_change = False
    current_user.failed_login_attempts = 0
    current_user.blocked_until = None
    current_user.last_failed_login_at = None

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
    user.force_password_change = True

    db.commit()
    return {"message": "Senha redefinida com sucesso"}


@router.post("/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()

    user = db.execute(
        select(models.User).where(models.User.email == email)
    ).scalar_one_or_none()

    # resposta genérica para não revelar existência do usuário
    generic_response = {
        "message": "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha."
    }

    if not user or not user.is_active:
        return generic_response

    # invalida tokens anteriores ainda abertos desse usuário
    active_tokens = db.execute(
        select(models.PasswordResetToken).where(
            models.PasswordResetToken.user_id == user.id,
            models.PasswordResetToken.used_at.is_(None),
        )
    ).scalars().all()

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for item in active_tokens:
        item.used_at = now

    raw_token = generate_password_reset_token()
    token_hash = get_password_reset_token_hash(raw_token)

    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=now + timedelta(minutes=15),
    )
    db.add(reset_token)
    db.commit()

    reset_link = f"{settings.FRONTEND_URL}/reset-password/{raw_token}"

    try:
        send_password_reset_email(
            to_email=user.email,
            reset_link=reset_link,
            full_name=user.full_name,
        )
    except Exception:
        # opcional: logar o erro
        pass

    return generic_response


@router.post("/reset-password/{token}", response_model=schemas.MessageResponse)
def reset_password(
    token: str,
    payload: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    token_hash = get_password_reset_token_hash(token)

    reset_entry = db.execute(
        select(models.PasswordResetToken).where(
            models.PasswordResetToken.token_hash == token_hash
        )
    ).scalar_one_or_none()

    if not reset_entry:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if reset_entry.used_at is not None:
        raise HTTPException(status_code=400, detail="Token inválido ou já utilizado")

    if reset_entry.expires_at <= now:
        raise HTTPException(status_code=400, detail="Token expirado")

    user = db.get(models.User, reset_entry.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inválido")

    user.hashed_password = get_password_hash(payload.new_password)
    user.failed_login_attempts = 0
    user.blocked_until = None
    user.last_failed_login_at = None

    reset_entry.used_at = now

    # opcional e recomendado: revogar refresh tokens do usuário
    refresh_tokens = db.execute(
        select(models.RefreshToken).where(
            models.RefreshToken.user_id == user.id,
            models.RefreshToken.revoked_at.is_(None),
        )
    ).scalars().all()

    for item in refresh_tokens:
        item.revoked_at = now

    db.commit()

    return {"message": "Senha redefinida com sucesso"}