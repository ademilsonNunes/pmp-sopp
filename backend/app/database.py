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
            models.RefreshToken.__table__,
            models.LoginAudit.__table__,
            models.PasswordResetToken.__table__,
            models.PasswordHistory.__table__,
        ],
    )
    _ensure_user_role_column()
    _ensure_user_security_columns()
    _ensure_login_audit_columns()
    _ensure_user_email_column()
    _ensure_user_force_password_change_column()
    _ensure_password_history_table()
    


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

def _ensure_user_security_columns() -> None:
    with engine.begin() as conn:
        checks = {
            "failed_login_attempts": """
                ALTER TABLE ZPMP_USERS
                ADD failed_login_attempts INT NOT NULL
                CONSTRAINT DF_ZPMP_USERS_FAILED_LOGIN_ATTEMPTS DEFAULT 0
            """,
            "blocked_until": """
                ALTER TABLE ZPMP_USERS
                ADD blocked_until DATETIME NULL
            """,
            "last_failed_login_at": """
                ALTER TABLE ZPMP_USERS
                ADD last_failed_login_at DATETIME NULL
            """,
        }

        for column_name, ddl in checks.items():
            exists = conn.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'ZPMP_USERS'
                      AND COLUMN_NAME = :column_name
                    """
                ),
                {"column_name": column_name},
            ).scalar()

            if not exists:
                conn.execute(text(ddl))


def _ensure_login_audit_columns() -> None:
    with engine.begin() as conn:
        table_exists = conn.execute(
            text(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'ZPMP_LOGIN_AUDIT'
                """
            )
        ).scalar()

        if not table_exists:
            conn.execute(
                text(
                    """
                    CREATE TABLE ZPMP_LOGIN_AUDIT (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        user_id INT NULL,
                        ip VARCHAR(45) NOT NULL CONSTRAINT DF_ZPMP_LOGIN_AUDIT_IP DEFAULT '',
                        user_agent VARCHAR(500) NOT NULL CONSTRAINT DF_ZPMP_LOGIN_AUDIT_USER_AGENT DEFAULT '',
                        timestamp DATETIME NOT NULL CONSTRAINT DF_ZPMP_LOGIN_AUDIT_TIMESTAMP DEFAULT GETDATE(),
                        sucesso BIT NOT NULL,
                        motivo_falha VARCHAR(255) NULL
                    )
                    """
                )
            )


def _ensure_user_email_column() -> None:
    with engine.begin() as conn:
        exists = conn.execute(
            text("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'ZPMP_USERS'
                  AND COLUMN_NAME = 'email'
            """)
        ).scalar()

        if not exists:
            conn.execute(
                text("""
                    ALTER TABLE ZPMP_USERS
                    ADD email VARCHAR(255) NULL
                """)
            )


def _ensure_user_force_password_change_column() -> None:
    with engine.begin() as conn:
        exists = conn.execute(
            text("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'ZPMP_USERS'
                  AND COLUMN_NAME = 'force_password_change'
            """)
        ).scalar()

        if not exists:
            conn.execute(
                text("""
                    ALTER TABLE ZPMP_USERS
                    ADD force_password_change BIT NOT NULL
                    CONSTRAINT DF_ZPMP_USERS_FORCE_PASSWORD_CHANGE DEFAULT 0
                """)
            )

def _ensure_password_history_table() -> None:
    with engine.begin() as conn:
        table_exists = conn.execute(
            text(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = 'ZPMP_PASSWORD_HISTORY'
                """
            )
        ).scalar()

        if not table_exists:
            conn.execute(
                text(
                    """
                    CREATE TABLE ZPMP_PASSWORD_HISTORY (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        user_id INT NOT NULL,
                        hashed_password VARCHAR(255) NOT NULL,
                        created_at DATETIME NOT NULL
                            CONSTRAINT DF_ZPMP_PASSWORD_HISTORY_CREATED_AT DEFAULT GETDATE()
                    )
                    """
                )
            )

            conn.execute(
                text(
                    """
                    CREATE INDEX IX_ZPMP_PASSWORD_HISTORY_USER_ID
                    ON ZPMP_PASSWORD_HISTORY (user_id)
                    """
                )
            )

            conn.execute(
                text(
                    """
                    CREATE INDEX IX_ZPMP_PASSWORD_HISTORY_USER_CREATED
                    ON ZPMP_PASSWORD_HISTORY (user_id, created_at DESC)
                    """
                )
            )