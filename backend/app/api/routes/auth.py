from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_email_change_token,
    create_email_verify_token,
    create_password_reset_token,
    decode_email_change_token,
    decode_email_verify_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.repositories import user_repo
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    RegisterResponse,
    RequestEmailChangeRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailResponse,
)
from app.services.email import (
    send_email_change_email,
    send_password_reset_email,
    send_verification_email,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

EMAIL_NOT_VERIFIED = "Email not verified"
GENERIC_EMAIL_SENT = "If the account exists, an email was sent"
INVALID_LINK = "Invalid or expired link"


def _public_url(path_query: str) -> str:
    return settings.app_public_url.rstrip("/") + path_query


def _send_verification(user: User) -> None:
    token = create_email_verify_token(user.id)
    send_verification_email(user.email, _public_url(f"/?verify={token}"))


def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        email_verified=user_repo.is_email_verified(user),
        created_at=user.created_at,
    )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if user_repo.get_by_username(db, body.username):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username already taken")
    if user_repo.get_by_email(db, body.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    user = user_repo.create(
        db,
        body.username,
        body.email,
        hash_password(body.password),
    )
    _send_verification(user)
    return RegisterResponse(
        message="Проверьте почту — мы отправили ссылку для подтверждения регистрации.",
        email=user.email,
        username=user.username,
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = user_repo.get_by_username(db, body.username)
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")
    if not user_repo.is_email_verified(user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, EMAIL_NOT_VERIFIED)
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/verify-email", response_model=VerifyEmailResponse)
def verify_email(token: str = Query(..., min_length=10), db: Session = Depends(get_db)):
    user_id = decode_email_verify_token(token)
    if user_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, INVALID_LINK)
    user = user_repo.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, INVALID_LINK)
    if not user_repo.is_email_verified(user):
        user_repo.mark_email_verified(db, user)
    return VerifyEmailResponse(message="Email подтверждён. Теперь можно войти.")


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(body: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = user_repo.get_by_username(db, body.username)
    if user is not None and not user_repo.is_email_verified(user):
        _send_verification(user)
    return MessageResponse(message=GENERIC_EMAIL_SENT)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = user_repo.get_by_email(db, body.email)
    if user is not None and user_repo.is_email_verified(user):
        token = create_password_reset_token(user.id)
        send_password_reset_email(user.email, _public_url(f"/?reset={token}"))
    return MessageResponse(message=GENERIC_EMAIL_SENT)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user_id = decode_password_reset_token(body.token)
    if user_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, INVALID_LINK)
    user = user_repo.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, INVALID_LINK)
    user_repo.update_password(db, user, hash_password(body.password))
    return MessageResponse(message="Пароль обновлён. Теперь можно войти.")


@router.post("/request-email-change", response_model=MessageResponse)
def request_email_change(
    body: RequestEmailChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.new_email == current_user.email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "New email is the same")
    if user_repo.get_by_email(db, body.new_email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    token = create_email_change_token(current_user.id, body.new_email)
    send_email_change_email(body.new_email, _public_url(f"/?email-change={token}"))
    return MessageResponse(message="Проверьте новый email — мы отправили ссылку для подтверждения.")


@router.get("/confirm-email-change", response_model=MessageResponse)
def confirm_email_change(token: str = Query(..., min_length=10), db: Session = Depends(get_db)):
    decoded = decode_email_change_token(token)
    if decoded is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, INVALID_LINK)
    user_id, new_email = decoded
    user = user_repo.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, INVALID_LINK)
    if user_repo.get_by_email(db, new_email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    user_repo.update_email(db, user, new_email)
    return MessageResponse(message="Email обновлён.")


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return _user_response(current_user)
