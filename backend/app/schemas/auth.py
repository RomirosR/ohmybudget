from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.fields import LoginPassword, Password


class RegisterRequest(BaseModel):
    email: EmailStr
    password: Password


class LoginRequest(BaseModel):
    email: EmailStr
    password: LoginPassword


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}
