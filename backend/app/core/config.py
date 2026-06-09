from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Каталог backend/ — относительно него по умолчанию кладём файл БД.
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Настройки приложения. Переопределяются через переменные окружения."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Строка подключения SQLAlchemy. По умолчанию — локальный SQLite-файл.
    database_url: str = f"sqlite:///{BACKEND_DIR / 'ohmybudget.db'}"

    # Источники, которым разрешён CORS (dev-фронт на Vite).
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # JWT: в production задайте JWT_SECRET через env (см. .env.example).
    jwt_secret: str = "dev-insecure-change-me"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 дней

    # Публичный URL фронта — ссылки подтверждения email (prod: https://ohmybudget.by).
    app_public_url: str = "http://localhost:5173"

    # Почта: console (лог в stdout) или smtp (Yandex Cloud Postbox).
    email_transport: str = "console"
    email_from: str = "noreply@ohmybudget.by"
    smtp_host: str = "postbox.cloud.yandex.net"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_verify_expire_hours: int = 24


settings = Settings()
