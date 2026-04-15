from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.auth import verify_token
from app.database import get_db

security = HTTPBearer()


def _get_authenticated_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    token = credentials.credentials
    username = verify_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.execute(
        select(models.User).where(models.User.username == username)
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario nao encontrado",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inativo",
        )

    return user


def get_current_user(
    current_user: models.User = Depends(_get_authenticated_user),
) -> models.User:
    if current_user.force_password_change:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Troca de senha obrigatória. Altere a senha em /auth/change-password para continuar.",
        )
    return current_user


def get_current_user_allow_password_change(
    current_user: models.User = Depends(_get_authenticated_user),
) -> models.User:
    return current_user


def require_roles(*allowed_roles: str):
    allowed = {role.upper() for role in allowed_roles}

    def dependency(
        current_user: models.User = Depends(get_current_user),
    ) -> models.User:
        if current_user.role.upper() not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario sem permissao para esta operacao",
            )
        return current_user

    return dependency