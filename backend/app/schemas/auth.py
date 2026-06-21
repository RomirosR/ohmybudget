from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.fields import LoginPassword, Password, Username


class RegisterRequest(BaseModel):
    username: Username
    email: EmailStr
    password: Password


class LoginRequest(BaseModel):
    username: Username
    password: LoginPassword


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterResponse(BaseModel):
    message: str
    email: str
    username: str


class MessageResponse(BaseModel):
    message: str


class VerifyEmailResponse(BaseModel):
    message: str


class ResendVerificationRequest(BaseModel):
    username: Username


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: Password


class RequestEmailChangeRequest(BaseModel):
    new_email: EmailStr


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    email_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}
