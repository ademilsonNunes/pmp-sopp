from __future__ import annotations
from datetime import datetime
from typing import Generic, TypeVar, Any, Literal
from pydantic import BaseModel, Field

T = TypeVar("T")


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str | None = Field(None, max_length=255)
    full_name: str = Field("", max_length=100)
    password: str = Field(..., min_length=6)
    role: Literal["ADMIN", "PCP", "VIEWER"] = "VIEWER"


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    force_password_change: bool = False


class TokenData(BaseModel):
    username: str | None = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str | None = None
    full_name: str
    role: str
    is_active: bool
    force_password_change: bool
    failed_login_attempts: int
    blocked_until: datetime | None = None
    last_failed_login_at: datetime | None = None

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    email: str | None = Field(None, max_length=255)
    full_name: str | None = Field(None, max_length=100)
    role: str | None = Field(None, max_length=20)
    is_active: bool | None = None


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=10, max_length=100)


class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=10, max_length=100)


class ChangePasswordRequest(BaseModel):
    password: str = Field(..., min_length=10, max_length=100)

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class LoginAuditOut(BaseModel):
    id: int
    user_id: int | None
    ip: str
    user_agent: str
    timestamp: datetime
    sucesso: bool
    motivo_falha: str | None = None

    model_config = {"from_attributes": True}


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., max_length=255)

class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=10, max_length=100)

class MessageResponse(BaseModel):
    message: str    


# ─── ZPM ─────────────────────────────────────────────────────────────────────

class ZpmBase(BaseModel):
    filial: str = Field(..., max_length=2)
    prod: str = Field(..., max_length=20)
    mesref: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    linha: str = Field("", max_length=20)
    desc: str = Field("", max_length=60)
    pmpmes: float = Field(0.0, ge=0)

    d01: float = Field(0.0, ge=0)
    d02: float = Field(0.0, ge=0)
    d03: float = Field(0.0, ge=0)
    d04: float = Field(0.0, ge=0)
    d05: float = Field(0.0, ge=0)
    d06: float = Field(0.0, ge=0)
    d07: float = Field(0.0, ge=0)
    d08: float = Field(0.0, ge=0)
    d09: float = Field(0.0, ge=0)
    d10: float = Field(0.0, ge=0)
    d11: float = Field(0.0, ge=0)
    d12: float = Field(0.0, ge=0)
    d13: float = Field(0.0, ge=0)
    d14: float = Field(0.0, ge=0)
    d15: float = Field(0.0, ge=0)
    d16: float = Field(0.0, ge=0)
    d17: float = Field(0.0, ge=0)
    d18: float = Field(0.0, ge=0)
    d19: float = Field(0.0, ge=0)
    d20: float = Field(0.0, ge=0)
    d21: float = Field(0.0, ge=0)
    d22: float = Field(0.0, ge=0)
    d23: float = Field(0.0, ge=0)
    d24: float = Field(0.0, ge=0)
    d25: float = Field(0.0, ge=0)
    d26: float = Field(0.0, ge=0)
    d27: float = Field(0.0, ge=0)
    d28: float = Field(0.0, ge=0)
    d29: float = Field(0.0, ge=0)
    d30: float = Field(0.0, ge=0)
    d31: float = Field(0.0, ge=0)


class ZpmCreate(ZpmBase):
    pass


class ZpmUpdate(BaseModel):
    linha: str | None = Field(None, max_length=20)
    desc: str | None = Field(None, max_length=60)
    pmpmes: float | None = Field(None, ge=0)

    d01: float | None = Field(None, ge=0)
    d02: float | None = Field(None, ge=0)
    d03: float | None = Field(None, ge=0)
    d04: float | None = Field(None, ge=0)
    d05: float | None = Field(None, ge=0)
    d06: float | None = Field(None, ge=0)
    d07: float | None = Field(None, ge=0)
    d08: float | None = Field(None, ge=0)
    d09: float | None = Field(None, ge=0)
    d10: float | None = Field(None, ge=0)
    d11: float | None = Field(None, ge=0)
    d12: float | None = Field(None, ge=0)
    d13: float | None = Field(None, ge=0)
    d14: float | None = Field(None, ge=0)
    d15: float | None = Field(None, ge=0)
    d16: float | None = Field(None, ge=0)
    d17: float | None = Field(None, ge=0)
    d18: float | None = Field(None, ge=0)
    d19: float | None = Field(None, ge=0)
    d20: float | None = Field(None, ge=0)
    d21: float | None = Field(None, ge=0)
    d22: float | None = Field(None, ge=0)
    d23: float | None = Field(None, ge=0)
    d24: float | None = Field(None, ge=0)
    d25: float | None = Field(None, ge=0)
    d26: float | None = Field(None, ge=0)
    d27: float | None = Field(None, ge=0)
    d28: float | None = Field(None, ge=0)
    d29: float | None = Field(None, ge=0)
    d30: float | None = Field(None, ge=0)
    d31: float | None = Field(None, ge=0)


class ZpmOut(ZpmBase):
    id: int
    totpg: float
    dtimpt: str | None   # varchar(8) Protheus: AAAAMMDD
    usrimpt: str
    origem: str

    model_config = {"from_attributes": True}


class ZpmFilter(BaseModel):
    filial: str | None = None
    mesref: str | None = None
    search: str | None = None


# ─── Import ───────────────────────────────────────────────────────────────────

class ImportRequest(BaseModel):
    mesref: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    mode: int = Field(1, ge=1, le=3)


class ImportDetailItem(BaseModel):
    row: int
    prod: str
    desc: str
    status: str  # "ok" | "skip" | "error"
    message: str


class ImportLogOut(BaseModel):
    id: int
    mesref: str
    filename: str
    mode: int
    total: int
    ok: int
    skip: int
    error: int
    created_at: datetime
    username: str
    details: list[ImportDetailItem] | None = None

    model_config = {"from_attributes": True}


# ─── Pagination ───────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
