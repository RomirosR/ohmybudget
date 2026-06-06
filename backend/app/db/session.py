from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# SQLite требует check_same_thread=False для работы с пулом потоков FastAPI.
_connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(settings.database_url, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Iterator[Session]:
    """Зависимость FastAPI: сессия БД на время запроса."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
