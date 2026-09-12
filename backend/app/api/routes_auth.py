from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from app.auth.security import create_access_token, get_current_user, hash_password, verify_password
from app.db import repository


router = APIRouter()


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    role: str = Field(default="student", pattern="^(student|instructor)$")


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest) -> AuthResponse:
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
    
    token = create_access_token(
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
        name=user["name"],
    )
    
    return AuthResponse(token=token, user=user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
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
    
    safe_user = {
        "id": user_record["id"],
        "name": user_record["name"],
        "email": user_record["email"],
        "role": user_record["role"],
        "created_at": user_record.get("created_at"),
    }
    
    token = create_access_token(
        user_id=safe_user["id"],
        email=safe_user["email"],
        role=safe_user["role"],
        name=safe_user["name"],
    )
    
    return AuthResponse(token=token, user=safe_user)


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)) -> dict:
    user_data = repository.get_user_by_id(current_user["sub"])
    if not user_data:
        # Fallback to token claims
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
