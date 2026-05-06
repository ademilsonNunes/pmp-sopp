from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app import models
from app.auth import get_password_hash
from app.config import settings
from app.database import SessionLocal, create_tables
from app.routers import auth, imports, pmp, sopp, feriados


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    _create_default_admin()
    yield


def _create_default_admin():
    with SessionLocal() as db:
        existing = db.execute(select(models.User)).scalars().first()
        if existing is None:
            admin = models.User(
                username=settings.DEFAULT_ADMIN_USERNAME,
                full_name=settings.DEFAULT_ADMIN_FULL_NAME,
                hashed_password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
                role=settings.DEFAULT_ADMIN_ROLE,
                is_active=True,
                force_password_change=False,
            )
            db.add(admin)
            db.commit()
            print(
                "Usuario padrao criado: "
                f"{settings.DEFAULT_ADMIN_USERNAME} / "
                f"{settings.DEFAULT_ADMIN_PASSWORD}"
            )


app = FastAPI(
    title="PMP Sistema - Sobel Suprema",
    description="Plano Mestre de Producao - Sistema Web",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(pmp.router)
app.include_router(imports.router)
app.include_router(sopp.router)
app.include_router(feriados.router)


@app.get("/health")
def health():
    return {"status": "ok", "system": "PMP Sistema - Sobel Suprema"}
