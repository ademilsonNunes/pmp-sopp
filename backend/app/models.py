from datetime import datetime
from sqlalchemy import (
    BigInteger, Integer, String, Float, Boolean, DateTime, ForeignKey,
    Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


# ---------------------------------------------------------------------------
# ZPMP_USERS — tabela customizada criada pela aplicação web
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "ZPMP_USERS"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="VIEWER")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    blocked_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_failed_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


# ---------------------------------------------------------------------------
# ZPM010 — tabela Protheus existente
# Estrutura real levantada via INFORMATION_SCHEMA:
#   - R_E_C_N_O_  bigint  (NOT IDENTITY — gerenciado pelo Protheus)
#   - R_E_C_D_E_L_ bigint
#   - D_E_L_E_T_  varchar(1)   registro ativo = ' ', excluído = '*'
#   - ZPM_DTIMPT  varchar(8)   data no formato Protheus AAAAMMDD
#   - ZPM_USRIMP  varchar(15)  (nome truncado — sem o T final)
# ---------------------------------------------------------------------------
class ZpmRecord(Base):
    __tablename__ = "ZPM010"
    __table_args__ = {"extend_existing": True}

    recno: Mapped[int] = mapped_column(
        "R_E_C_N_O_", BigInteger, primary_key=True, autoincrement=False
    )
    recdel: Mapped[int] = mapped_column(
        "R_E_C_D_E_L_", BigInteger, nullable=False, default=0
    )
    deleted: Mapped[str] = mapped_column(
        "D_E_L_E_T_", String(1), nullable=False, default=" "
    )

    filial:  Mapped[str] = mapped_column("ZPM_FILIAL",  String(2),  nullable=False, default="")
    prod:    Mapped[str] = mapped_column("ZPM_PROD",    String(20), nullable=False, default="")
    linha:   Mapped[str] = mapped_column("ZPM_LINHA",   String(20), nullable=False, default="")
    desc:    Mapped[str] = mapped_column("ZPM_DESC",    String(60), nullable=False, default="")
    mesref:  Mapped[str] = mapped_column("ZPM_MESREF",  String(6),  nullable=False, default="")
    pmpmes:  Mapped[float] = mapped_column("ZPM_PMPMES", Float, nullable=False, default=0.0)

    d01: Mapped[float] = mapped_column("ZPM_D01", Float, nullable=False, default=0.0)
    d02: Mapped[float] = mapped_column("ZPM_D02", Float, nullable=False, default=0.0)
    d03: Mapped[float] = mapped_column("ZPM_D03", Float, nullable=False, default=0.0)
    d04: Mapped[float] = mapped_column("ZPM_D04", Float, nullable=False, default=0.0)
    d05: Mapped[float] = mapped_column("ZPM_D05", Float, nullable=False, default=0.0)
    d06: Mapped[float] = mapped_column("ZPM_D06", Float, nullable=False, default=0.0)
    d07: Mapped[float] = mapped_column("ZPM_D07", Float, nullable=False, default=0.0)
    d08: Mapped[float] = mapped_column("ZPM_D08", Float, nullable=False, default=0.0)
    d09: Mapped[float] = mapped_column("ZPM_D09", Float, nullable=False, default=0.0)
    d10: Mapped[float] = mapped_column("ZPM_D10", Float, nullable=False, default=0.0)
    d11: Mapped[float] = mapped_column("ZPM_D11", Float, nullable=False, default=0.0)
    d12: Mapped[float] = mapped_column("ZPM_D12", Float, nullable=False, default=0.0)
    d13: Mapped[float] = mapped_column("ZPM_D13", Float, nullable=False, default=0.0)
    d14: Mapped[float] = mapped_column("ZPM_D14", Float, nullable=False, default=0.0)
    d15: Mapped[float] = mapped_column("ZPM_D15", Float, nullable=False, default=0.0)
    d16: Mapped[float] = mapped_column("ZPM_D16", Float, nullable=False, default=0.0)
    d17: Mapped[float] = mapped_column("ZPM_D17", Float, nullable=False, default=0.0)
    d18: Mapped[float] = mapped_column("ZPM_D18", Float, nullable=False, default=0.0)
    d19: Mapped[float] = mapped_column("ZPM_D19", Float, nullable=False, default=0.0)
    d20: Mapped[float] = mapped_column("ZPM_D20", Float, nullable=False, default=0.0)
    d21: Mapped[float] = mapped_column("ZPM_D21", Float, nullable=False, default=0.0)
    d22: Mapped[float] = mapped_column("ZPM_D22", Float, nullable=False, default=0.0)
    d23: Mapped[float] = mapped_column("ZPM_D23", Float, nullable=False, default=0.0)
    d24: Mapped[float] = mapped_column("ZPM_D24", Float, nullable=False, default=0.0)
    d25: Mapped[float] = mapped_column("ZPM_D25", Float, nullable=False, default=0.0)
    d26: Mapped[float] = mapped_column("ZPM_D26", Float, nullable=False, default=0.0)
    d27: Mapped[float] = mapped_column("ZPM_D27", Float, nullable=False, default=0.0)
    d28: Mapped[float] = mapped_column("ZPM_D28", Float, nullable=False, default=0.0)
    d29: Mapped[float] = mapped_column("ZPM_D29", Float, nullable=False, default=0.0)
    d30: Mapped[float] = mapped_column("ZPM_D30", Float, nullable=False, default=0.0)
    d31: Mapped[float] = mapped_column("ZPM_D31", Float, nullable=False, default=0.0)

    totpg:  Mapped[float] = mapped_column("ZPM_TOTPG",  Float,      nullable=False, default=0.0)
    # varchar(8) no formato Protheus: AAAAMMDD (ex: "20260327")
    dtimpt: Mapped[str]   = mapped_column("ZPM_DTIMPT", String(8),  nullable=False, default="")
    # Nome real no banco é ZPM_USRIMP (truncado pelo Protheus)
    usrimpt: Mapped[str]  = mapped_column("ZPM_USRIMP", String(15), nullable=False, default="")
    origem: Mapped[str]   = mapped_column("ZPM_ORIGEM", String(1),  nullable=False, default="M")

    @property
    def id(self) -> int:
        return self.recno

    def calc_totpg(self) -> float:
        return float(sum([
            self.d01 or 0, self.d02 or 0, self.d03 or 0, self.d04 or 0,
            self.d05 or 0, self.d06 or 0, self.d07 or 0, self.d08 or 0,
            self.d09 or 0, self.d10 or 0, self.d11 or 0, self.d12 or 0,
            self.d13 or 0, self.d14 or 0, self.d15 or 0, self.d16 or 0,
            self.d17 or 0, self.d18 or 0, self.d19 or 0, self.d20 or 0,
            self.d21 or 0, self.d22 or 0, self.d23 or 0, self.d24 or 0,
            self.d25 or 0, self.d26 or 0, self.d27 or 0, self.d28 or 0,
            self.d29 or 0, self.d30 or 0, self.d31 or 0,
        ]))


# ---------------------------------------------------------------------------
# ZPMP_IMPORT_LOGS — tabela customizada para histórico de importações
# ---------------------------------------------------------------------------
class ImportLog(Base):
    __tablename__ = "ZPMP_IMPORT_LOGS"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mesref:   Mapped[str]      = mapped_column(String(6),   nullable=False)
    filename: Mapped[str]      = mapped_column(String(255), nullable=False, default="")
    mode:     Mapped[int]      = mapped_column(Integer,     default=1)
    total:    Mapped[int]      = mapped_column(Integer,     default=0)
    ok:       Mapped[int]      = mapped_column(Integer,     default=0)
    skip:     Mapped[int]      = mapped_column(Integer,     default=0)
    error:    Mapped[int]      = mapped_column(Integer,     default=0)
    username: Mapped[str]      = mapped_column(String(50),  nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime,  server_default=func.now())
    details:  Mapped[str | None] = mapped_column(Text,      nullable=True)


class RefreshToken(Base):
    __tablename__ = "ZPMP_REFRESH_TOKENS"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class LoginAudit(Base):
    __tablename__ = "ZPMP_LOGIN_AUDIT"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ip: Mapped[str] = mapped_column(String(45), nullable=False, default="")
    user_agent: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    sucesso: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    motivo_falha: Mapped[str | None] = mapped_column(String(255), nullable=True)


