from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_email_verify_token,
    decode_email_verify_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.repositories import user_repo
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    TokenResponse,
    UserResponse,
    VerifyEmailResponse,
)
from app.services.email import send_verification_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

EMAIL_NOT_VERIFIED = "Email not verified"
RESEND_OK = "If the account exists and is not verified, a new email was sent"


def _verification_url(token: str) -> str:
    base = settings.app_public_url.rstrip("/")
    return f"{base}/?verify={token}"


def _send_verification(user: User) -> None:
    token = create_email_verify_token(user.id)
    send_verification_email(user.email, _verification_url(token))


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        email_verified=user_repo.is_email_verified(user),
        created_at=user.created_at,
    )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if user_repo.get_by_email(db, body.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    user = user_repo.create(db, body.email, hash_password(body.password))
    _send_verification(user)
    return RegisterResponse(
        message="Проверьте почту — мы отправили ссылку для подтверждения регистрации.",
        email=user.email,
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = user_repo.get_by_email(db, body.email)
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user_repo.is_email_verified(user):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            EMAIL_NOT_VERIFIED,
        )
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/verify-email", response_model=VerifyEmailResponse)
def verify_email(token: str = Query(..., min_length=10), db: Session = Depends(get_db)):
    user_id = decode_email_verify_token(token)
    if user_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification link")
    user = user_repo.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification link")
    if not user_repo.is_email_verified(user):
        user_repo.mark_email_verified(db, user)
    return VerifyEmailResponse(message="Email подтверждён. Теперь можно войти.")


@router.post("/resend-verification", response_model=ResendVerificationResponse)
def resend_verification(body: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = user_repo.get_by_email(db, body.email)
    if user is not None and not user_repo.is_email_verified(user):
        _send_verification(user)
    return ResendVerificationResponse(message=RESEND_OK)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return _user_response(current_user)
