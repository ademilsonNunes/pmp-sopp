from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings


def _build_connection_url() -> URL:
    if settings.DB_CLIENT.lower() == "pymssql":
        return URL.create(
            drivername="mssql+pymssql",
            username=settings.DB_USER,
            password=settings.DB_PASSWORD,
            host=settings.DB_SERVER,
            database=settings.DB_NAME,
        )

    return URL.create(
        drivername="mssql+pyodbc",
        username=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_SERVER,
        database=settings.DB_NAME,
        query={
            "driver": settings.DB_DRIVER,
            "Encrypt": "no",
            "TrustServerCertificate": "yes",
            "LongAsMax": "yes",
        },
    )


engine = create_engine(
    _build_connection_url(),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Cria apenas as tabelas customizadas (ZPMP_USERS e ZPMP_IMPORT_LOGS).
    A tabela ZPM010 já existe no Protheus e não deve ser alterada."""
    from app import models  # noqa: F401
    Base.metadata.create_all(
        bind=engine,
        tables=[
            models.User.__table__,
            models.ImportLog.__table__,
        ],
    )
    _ensure_user_role_column()


def _ensure_user_role_column() -> None:
    with engine.begin() as conn:
        has_role = conn.execute(
            text(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'ZPMP_USERS'
                  AND COLUMN_NAME = 'role'
                """
            )
        ).scalar()

        if not has_role:
            conn.execute(
                text(
                    """
                    ALTER TABLE ZPMP_USERS
                    ADD role VARCHAR(20) NOT NULL
                    CONSTRAINT DF_ZPMP_USERS_ROLE DEFAULT 'VIEWER'
                    """
                )
            )

        conn.execute(
            text(
                """
                UPDATE ZPMP_USERS
                SET role = CASE
                    WHEN username = :admin_username THEN :admin_role
                    ELSE 'VIEWER'
                END
                WHERE role IS NULL OR LTRIM(RTRIM(role)) = ''
                """
            ),
            {
                "admin_username": settings.DEFAULT_ADMIN_USERNAME,
                "admin_role": settings.DEFAULT_ADMIN_ROLE,
            },
        )

        conn.execute(
            text(
                """
                UPDATE ZPMP_USERS
                SET role = :admin_role
                WHERE username = :admin_username
                  AND role <> :admin_role
                """
            ),
            {
                "admin_username": settings.DEFAULT_ADMIN_USERNAME,
                "admin_role": settings.DEFAULT_ADMIN_ROLE,
            },
        )
