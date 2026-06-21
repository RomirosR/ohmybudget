from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(subject: int) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    payload: dict[str, Any] = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        if payload.get("typ") not in (None, "access"):
            return None
        sub = payload.get("sub")
        if sub is None:
            return None
        return int(sub)
    except (JWTError, ValueError):
        return None


def create_email_verify_token(user_id: int) -> str:
    expire = datetime.now(UTC) + timedelta(hours=settings.email_verify_expire_hours)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "exp": expire,
        "typ": "email_verify",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_email_verify_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        if payload.get("typ") != "email_verify":
            return None
        sub = payload.get("sub")
        if sub is None:
            return None
        return int(sub)
    except (JWTError, ValueError):
        return None


def create_password_reset_token(user_id: int) -> str:
    expire = datetime.now(UTC) + timedelta(hours=settings.password_reset_expire_hours)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "exp": expire,
        "typ": "password_reset",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_password_reset_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        if payload.get("typ") != "password_reset":
            return None
        sub = payload.get("sub")
        if sub is None:
            return None
        return int(sub)
    except (JWTError, ValueError):
        return None


def create_email_change_token(user_id: int, new_email: str) -> str:
    expire = datetime.now(UTC) + timedelta(hours=settings.email_verify_expire_hours)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "exp": expire,
        "typ": "email_change",
        "new_email": new_email,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_email_change_token(token: str) -> tuple[int, str] | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        if payload.get("typ") != "email_change":
            return None
        sub = payload.get("sub")
        new_email = payload.get("new_email")
        if sub is None or not new_email:
            return None
        return int(sub), str(new_email)
    except (JWTError, ValueError):
        return None
