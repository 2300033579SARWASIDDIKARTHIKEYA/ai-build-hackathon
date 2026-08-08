"""
User authentication endpoints: register, login, profile, password reset.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from datetime import timedelta
from app.core.config import settings
from app.core.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    get_current_user,
    require_current_user,
    send_password_reset_email,
    send_welcome_email,
)

router = APIRouter()

USERS: dict[str, dict] = {}
RESET_TOKENS: dict[str, dict] = {}


class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    name: str
    email: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=128)


@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister):
    email = payload.email.lower()
    if email in USERS:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = {
        "name": payload.name.strip(),
        "email": email,
        "password_hash": hash_password(payload.password),
        "created_at": __import__("time").time(),
    }
    USERS[email] = user
    access_token = create_access_token(
        {"sub": email, "email": email, "name": user["name"]},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    send_welcome_email(email, user["name"])
    return {"access_token": access_token, "token_type": "bearer", "user": {"name": user["name"], "email": email}}


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin):
    email = payload.email.lower()
    user = USERS.get(email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token = create_access_token(
        {"sub": email, "email": email, "name": user["name"]},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"name": user["name"], "email": email}}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(require_current_user)):
    return {"name": current_user.get("name", ""), "email": current_user.get("email", "")}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    email = payload.email.lower()
    user = USERS.get(email)
    reset_token = create_access_token(
        {"sub": email, "type": "password_reset"},
        expires_delta=timedelta(minutes=30),
    )
    RESET_TOKENS[reset_token] = {"email": email, "created_at": __import__("time").time()}
    if user:
        send_password_reset_email(email, reset_token)
    return {"message": "If an account exists, a password reset email has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    try:
        token_data = decode_access_token(payload.token)
    except HTTPException:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if token_data.get("type") != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid reset token")
    email = token_data.get("sub", "").lower()
    user = USERS.get(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["password_hash"] = hash_password(payload.new_password)
    RESET_TOKENS.pop(payload.token, None)
    return {"message": "Password reset successful"}
