"""
Authentication utilities: JWT creation/validation, password hashing,
token dependency for protected routes, and SMTP email sending.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    if token is None:
        return None
    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return {"user_id": user_id, "email": payload.get("email"), "name": payload.get("name")}


async def require_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    user = await get_current_user(token)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(to_email: str, subject: str, body: str, html: bool = False) -> bool:
    if not settings.ENABLE_SMTP or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        content_type = "html" if html else "plain"
        msg.attach(MIMEText(body, content_type))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        return True
    except Exception:
        return False


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    body = f"""
Hi,

You requested a password reset for your ALGUD AI account.
Click the link below to reset your password (valid for 30 minutes):

{reset_url}

If you did not request this, please ignore this email.
"""
    return send_email(to_email, "ALGUD AI - Password Reset", body)


def send_welcome_email(to_email: str, name: str) -> bool:
    body = f"""
Hi {name},

Welcome to ALGUD AI — your personalized product discovery engine.

You can now enjoy AI-powered recommendations, semantic search, and smart shopping assistance.

Visit us at http://localhost:5173
"""
    return send_email(to_email, "Welcome to ALGUD AI", body)
