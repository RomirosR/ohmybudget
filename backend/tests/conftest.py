import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401 — регистрирует таблицы в Base.metadata
from app.db.base import Base
from app.db.seed import seed_lookups
from app.db.session import get_db
from app.main import app


@pytest.fixture()
def db_session():
    """Изолированная in-memory БД на каждый тест, с наполненными справочниками."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # один shared connection → одна in-memory БД
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = TestingSession()
    seed_lookups(db)
    try:
        yield db
    finally:
        db.close()
        engine.dispose()


@pytest.fixture()
def client(db_session):
    """TestClient, использующий ту же in-memory сессию, что и тест."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
