from datetime import UTC, datetime

from app.core.security import create_email_verify_token, hash_password
from app.models import MonthlyPlan
from app.models.user import User
from app.repositories import user_repo
from tests.conftest import TEST_USER_EMAIL, TEST_USER_ID, TEST_USER_PASSWORD


def test_register_sends_verification_not_token(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "password": "secretpass"},
    )
    assert r.status_code == 201
    data = r.json()
    assert "access_token" not in data
    assert data["email"] == "new@example.com"
    assert "Проверьте почту" in data["message"]


def test_register_duplicate_email(client):
    client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "password": "secretpass"},
    )
    r = client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "password": "otherpass1"},
    )
    assert r.status_code == 400


def test_login_blocked_until_email_verified(client, db_session):
    client.post(
        "/api/auth/register",
        json={"email": "unverified@example.com", "password": "secretpass"},
    )
    r = client.post(
        "/api/auth/login",
        json={"email": "unverified@example.com", "password": "secretpass"},
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "Email not verified"


def test_verify_email_then_login(client, db_session):
    client.post(
        "/api/auth/register",
        json={"email": "verify@example.com", "password": "secretpass"},
    )
    user = user_repo.get_by_email(db_session, "verify@example.com")
    token = create_email_verify_token(user.id)

    r = client.get(f"/api/auth/verify-email?token={token}")
    assert r.status_code == 200
    assert "подтверждён" in r.json()["message"].lower()

    r = client.post(
        "/api/auth/login",
        json={"email": "verify@example.com", "password": "secretpass"},
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_resend_verification(client):
    client.post(
        "/api/auth/register",
        json={"email": "resend@example.com", "password": "secretpass"},
    )
    r = client.post(
        "/api/auth/resend-verification",
        json={"email": "resend@example.com"},
    )
    assert r.status_code == 200


def test_login_success(client, db_session):
    now = datetime.now(UTC)
    db_session.add(
        User(
            email="login@example.com",
            hashed_password=hash_password("mypassword"),
            email_verified_at=now,
        )
    )
    db_session.commit()

    r = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "mypassword"},
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client, db_session):
    now = datetime.now(UTC)
    db_session.add(
        User(
            email="login@example.com",
            hashed_password=hash_password("mypassword"),
            email_verified_at=now,
        )
    )
    db_session.commit()

    r = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "wrongpass"},
    )
    assert r.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code in (401, 403)


def test_me_returns_user(auth_client):
    r = auth_client.get("/api/auth/me")
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == TEST_USER_EMAIL
    assert data["email_verified"] is True


def test_tenancy_users_isolated(client, db_session):
    user_b = User(
        email="b@example.com",
        hashed_password=hash_password("password123"),
        email_verified_at=datetime.now(UTC),
    )
    db_session.add(user_b)
    db_session.commit()
    db_session.refresh(user_b)

    db_session.add(
        MonthlyPlan(
            user_id=user_b.id,
            year=2026,
            month=1,
            category="Чужой",
            is_income=True,
            amount=999,
        )
    )
    db_session.commit()

    from app.core.security import create_access_token

    token_a = create_access_token(TEST_USER_ID)
    r = client.get(
        "/api/plans",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert r.status_code == 200
    assert r.json() == []
