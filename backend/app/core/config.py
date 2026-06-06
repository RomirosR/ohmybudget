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


settings = Settings()
