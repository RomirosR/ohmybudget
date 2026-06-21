from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.user import User


def normalize_username(username: str) -> str:
    return username.strip().lower()


def get_by_username(db: Session, username: str) -> User | None:
    return (
        db.query(User)
        .filter(User.username == normalize_username(username))
        .one_or_none()
    )


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).one_or_none()


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create(db: Session, username: str, email: str, hashed_password: str) -> User:
    user = User(
        username=normalize_username(username),
        email=email,
        hashed_password=hashed_password,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def mark_email_verified(db: Session, user: User) -> User:
    user.email_verified_at = datetime.now(UTC)
    db.commit()
    db.refresh(user)
    return user


def update_email(db: Session, user: User, new_email: str) -> User:
    user.email = new_email
    user.email_verified_at = datetime.now(UTC)
    db.commit()
    db.refresh(user)
    return user


def update_password(db: Session, user: User, hashed_password: str) -> User:
    user.hashed_password = hashed_password
    db.commit()
    db.refresh(user)
    return user


def is_email_verified(user: User) -> bool:
    return user.email_verified_at is not None
