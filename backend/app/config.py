from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # SQL Server connection (Protheus)
    DB_SERVER: str = "localhost"
    DB_USER: str = "sa"
    DB_PASSWORD: str = ""
    DB_NAME: str = "Protheus_Producao"
    DB_DRIVER: str = "ODBC Driver 17 for SQL Server"
    DB_CLIENT: str = "pymssql"

    # BI / S&OP database
    BI_DB_NAME: str = "BISOBEL"

    # JWT
    SECRET_KEY: str = "change-me-in-.env-with-a-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # App runtime
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    DEFAULT_ADMIN_USERNAME: str = "admin"
    DEFAULT_ADMIN_PASSWORD: str = "admin123"
    DEFAULT_ADMIN_FULL_NAME: str = "Administrador"
    DEFAULT_ADMIN_ROLE: str = "ADMIN"

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.BACKEND_CORS_ORIGINS.split(",")
            if origin.strip()
        ]


settings = Settings()
