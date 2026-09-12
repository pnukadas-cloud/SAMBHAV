from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth.otp_manager import otp_manager
from app.auth.security import create_access_token, get_current_user, hash_password, verify_password
from app.db import repository


router = APIRouter()


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    role: str = Field(default="student", pattern="^(student|instructor)$")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class VerifyOTPRequest(BaseModel):
    session_token: str = Field(..., min_length=10)
    otp_code: str = Field(..., min_length=6, max_length=6)


class ResendOTPRequest(BaseModel):
    session_token: str = Field(..., min_length=10)


class LoginInitiatedResponse(BaseModel):
    status: str = "otp_required"
    session_token: str
    email: str
    expires_in: int
    resend_cooldown: int
    email_sent: bool
    delivery_info: str
    dev_otp: Optional[str] = None


class AuthSuccessResponse(BaseModel):
    token: str
    user: dict[str, Any]


@router.post("/register", response_model=LoginInitiatedResponse)
def register(payload: RegisterRequest) -> LoginInitiatedResponse:
    existing = repository.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )
    
    hashed = hash_password(payload.password)
    user = repository.create_user(
        name=payload.name,
        email=payload.email,
        password_hash=hashed,
        role=payload.role,
    )
    
    # Immediately initiate 2-factor OTP verification challenge
    try:
        session_token, otp_code, meta = otp_manager.create_challenge(
            user_id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))

    return LoginInitiatedResponse(
        status="otp_required",
        session_token=session_token,
        email=user["email"],
        expires_in=meta["expires_in"],
        resend_cooldown=meta["resend_cooldown"],
        email_sent=meta["email_sent"],
        delivery_info=meta["delivery_info"],
        dev_otp=meta.get("dev_otp"),
    )


@router.post("/login", response_model=LoginInitiatedResponse)
def login(payload: LoginRequest) -> LoginInitiatedResponse:
    user_record = repository.get_user_by_email(payload.email)
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    
    if not verify_password(payload.password, user_record.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    
    try:
        session_token, otp_code, meta = otp_manager.create_challenge(
            user_id=user_record["id"],
            email=user_record["email"],
            name=user_record["name"],
            role=user_record["role"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(e))

    return LoginInitiatedResponse(
        status="otp_required",
        session_token=session_token,
        email=user_record["email"],
        expires_in=meta["expires_in"],
        resend_cooldown=meta["resend_cooldown"],
        email_sent=meta["email_sent"],
        delivery_info=meta["delivery_info"],
        dev_otp=meta.get("dev_otp"),
    )


@router.post("/verify-otp", response_model=AuthSuccessResponse)
def verify_otp(payload: VerifyOTPRequest) -> AuthSuccessResponse:
    is_valid, user_data, error_msg = otp_manager.verify_challenge(
        session_token=payload.session_token,
        otp_code=payload.otp_code,
    )

    if not is_valid or not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or "Invalid or expired verification code.",
        )

    # Fetch full record from DB for complete consistency
    user_record = repository.get_user_by_id(user_data["id"]) or user_data

    safe_user = {
        "id": user_record["id"],
        "name": user_record["name"],
        "email": user_record["email"],
        "role": user_record["role"],
        "created_at": user_record.get("created_at"),
    }

    # Generate cryptographically signed JWT access token with immutable role
    token = create_access_token(
        user_id=safe_user["id"],
        email=safe_user["email"],
        role=safe_user["role"],
        name=safe_user["name"],
    )

    return AuthSuccessResponse(token=token, user=safe_user)


@router.post("/resend-otp", response_model=LoginInitiatedResponse)
def resend_otp(payload: ResendOTPRequest) -> LoginInitiatedResponse:
    try:
        session_token, otp_code, meta = otp_manager.resend_challenge(payload.session_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )

    return LoginInitiatedResponse(
        status="otp_required",
        session_token=session_token,
        email=meta.get("delivery_info", ""),
        expires_in=meta["expires_in"],
        resend_cooldown=meta["resend_cooldown"],
        email_sent=meta["email_sent"],
        delivery_info=meta["delivery_info"],
        dev_otp=meta.get("dev_otp"),
    )


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)) -> dict:
    user_data = repository.get_user_by_id(current_user["sub"])
    if not user_data:
        return {
            "id": current_user["sub"],
            "name": current_user.get("name", "User"),
            "email": current_user.get("email", ""),
            "role": current_user.get("role", "student"),
        }
    return user_data


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"message": "Successfully logged out"}
