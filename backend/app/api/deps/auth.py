from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.repositories import user_repo

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


def _user_from_token(
    credentials: HTTPAuthorizationCredentials | None, db: Session
) -> User | None:
    if credentials is None:
        return None
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        return None
    return user_repo.get_by_id(db, user_id)


def get_optional_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(optional_security)
    ] = None,
    db: Session = Depends(get_db),
) -> User | None:
    """Текущий пользователь или None для гостевого просмотра (только чтение)."""
    return _user_from_token(credentials, db)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    user_id = decode_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = user_repo.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user
