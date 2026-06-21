from datetime import UTC, datetime

from app.core.security import (
    create_email_change_token,
    create_email_verify_token,
    create_password_reset_token,
    hash_password,
)
from app.models import MonthlyPlan
from app.models.user import User
from app.repositories import user_repo
from tests.conftest import (
    TEST_USER_EMAIL,
    TEST_USER_ID,
    TEST_USER_PASSWORD,
    TEST_USER_USERNAME,
)


def _register_payload(username: str, email: str, password: str = "secretpass") -> dict:
    return {"username": username, "email": email, "password": password}


def test_register_sends_verification_not_token(client):
    r = client.post(
        "/api/auth/register",
        json=_register_payload("newuser", "new@example.com"),
    )
    assert r.status_code == 201
    data = r.json()
    assert "access_token" not in data
    assert data["email"] == "new@example.com"
    assert data["username"] == "newuser"
    assert "Проверьте почту" in data["message"]


def test_register_duplicate_username(client):
    client.post(
        "/api/auth/register",
        json=_register_payload("dupuser", "first@example.com"),
    )
    r = client.post(
        "/api/auth/register",
        json=_register_payload("dupuser", "second@example.com"),
    )
    assert r.status_code == 400


def test_register_duplicate_email(client):
    client.post(
        "/api/auth/register",
        json=_register_payload("user1", "dup@example.com"),
    )
    r = client.post(
        "/api/auth/register",
        json=_register_payload("user2", "dup@example.com"),
    )
    assert r.status_code == 400


def test_login_blocked_until_email_verified(client):
    client.post(
        "/api/auth/register",
        json=_register_payload("unverified", "unverified@example.com"),
    )
    r = client.post(
        "/api/auth/login",
        json={"username": "unverified", "password": "secretpass"},
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "Email not verified"


def test_verify_email_then_login(client, db_session):
    client.post(
        "/api/auth/register",
        json=_register_payload("verifyme", "verify@example.com"),
    )
    user = user_repo.get_by_email(db_session, "verify@example.com")
    token = create_email_verify_token(user.id)

    r = client.get(f"/api/auth/verify-email?token={token}")
    assert r.status_code == 200

    r = client.post(
        "/api/auth/login",
        json={"username": "verifyme", "password": "secretpass"},
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_resend_verification(client):
    client.post(
        "/api/auth/register",
        json=_register_payload("resenduser", "resend@example.com"),
    )
    r = client.post(
        "/api/auth/resend-verification",
        json={"username": "resenduser"},
    )
    assert r.status_code == 200


def test_forgot_and_reset_password(client, db_session):
    client.post(
        "/api/auth/register",
        json=_register_payload("resetme", "reset@example.com"),
    )
    user = user_repo.get_by_email(db_session, "reset@example.com")
    user_repo.mark_email_verified(db_session, user)

    r = client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    assert r.status_code == 200

    token = create_password_reset_token(user.id)
    r = client.post(
        "/api/auth/reset-password",
        json={"token": token, "password": "newpass123"},
    )
    assert r.status_code == 200

    r = client.post(
        "/api/auth/login",
        json={"username": "resetme", "password": "newpass123"},
    )
    assert r.status_code == 200


def test_request_email_change(auth_client, client, db_session):
    token = create_email_change_token(TEST_USER_ID, "newmail@example.com")
    r = client.get(f"/api/auth/confirm-email-change?token={token}")
    assert r.status_code == 200

    r = auth_client.get("/api/auth/me")
    assert r.json()["email"] == "newmail@example.com"


def test_login_success(client, db_session):
    now = datetime.now(UTC)
    db_session.add(
        User(
            username="loginuser",
            email="login@example.com",
            hashed_password=hash_password("mypassword"),
            email_verified_at=now,
        )
    )
    db_session.commit()

    r = client.post(
        "/api/auth/login",
        json={"username": "loginuser", "password": "mypassword"},
    )
    assert r.status_code == 200


def test_login_wrong_password(client, db_session):
    now = datetime.now(UTC)
    db_session.add(
        User(
            username="loginuser2",
            email="login2@example.com",
            hashed_password=hash_password("mypassword"),
            email_verified_at=now,
        )
    )
    db_session.commit()

    r = client.post(
        "/api/auth/login",
        json={"username": "loginuser2", "password": "wrongpass"},
    )
    assert r.status_code == 401


def test_me_returns_user(auth_client):
    r = auth_client.get("/api/auth/me")
    assert r.status_code == 200
    data = r.json()
    assert data["username"] == TEST_USER_USERNAME
    assert data["email"] == TEST_USER_EMAIL
    assert data["email_verified"] is True


def test_tenancy_users_isolated(client, db_session):
    user_b = User(
        username="userb",
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
