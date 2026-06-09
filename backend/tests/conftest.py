from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401 — регистрирует таблицы в Base.metadata
from app.core.security import create_access_token, create_email_verify_token, hash_password
from app.db.base import Base
from app.db.seed import seed_lookups
from app.db.session import get_db
from app.main import app
from app.models.user import User

TEST_USER_ID = 1
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "password123"


@pytest.fixture()
def db_session():
    """Изолированная in-memory БД на каждый тест, с наполненными справочниками."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = TestingSession()
    seed_lookups(db)
    now = datetime.now(UTC)
    db.add(
        User(
            id=TEST_USER_ID,
            email=TEST_USER_EMAIL,
            hashed_password=hash_password(TEST_USER_PASSWORD),
            email_verified_at=now,
            created_at=now,
        )
    )
    db.commit()
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


@pytest.fixture()
def auth_headers(db_session):
    return {"Authorization": f"Bearer {create_access_token(TEST_USER_ID)}"}


@pytest.fixture()
def auth_client(client, auth_headers):
    for key, value in auth_headers.items():
        client.headers[key] = value
    return client
