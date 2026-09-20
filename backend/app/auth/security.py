import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "sambhav_quantum_production_secret_key_2026_dev_env")
ALGORITHM = "HS256"
TOKEN_EXPIRY_SECONDS = 7 * 24 * 3600  # 7 days

security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256 with a cryptographically secure random salt."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"pbkdf2:sha256:100000${salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored PBKDF2 hash."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        algo_iterations, salt_hex, key_hex = parts
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        computed_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(expected_key, computed_key)
    except Exception:
        return False


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str, name: str) -> str:
    """Creates a cryptographically signed session token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "name": name,
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS,
        "iat": int(time.time()),
    }
    
    header_b64 = _b64_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    
    message = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), message, hashlib.sha256).digest()
    signature_b64 = _b64_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Decodes and cryptographically verifies a signed session token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, signature_b64 = parts
        
        message = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), message, hashlib.sha256).digest()
        provided_sig = _b64_decode(signature_b64)
        
        if not hmac.compare_digest(expected_sig, provided_sig):
            return None
        
        payload = json.loads(_b64_decode(payload_b64).decode("utf-8"))
        if payload.get("exp", 0) < time.time():
            return None  # Token expired
        
        return payload
    except Exception:
        return None


def create_reset_token(user_id: str, email: str) -> str:
    """Creates a short-lived cryptographically signed token for password reset (15 minutes)."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "email": email,
        "purpose": "password_reset",
        "exp": int(time.time()) + 900,  # 15 minutes
        "iat": int(time.time()),
    }
    header_b64 = _b64_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    message = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), message, hashlib.sha256).digest()
    signature_b64 = _b64_encode(signature)
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_reset_token(token: str) -> Optional[dict[str, Any]]:
    """Decodes and validates a password reset token."""
    payload = decode_access_token(token)
    if not payload or payload.get("purpose") != "password_reset":
        return None
    return payload


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
) -> Optional[dict[str, Any]]:
    """Returns the authenticated user dict if valid bearer token is provided, or None."""
    if not credentials or not credentials.credentials:
        return None
    return decode_access_token(credentials.credentials)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
) -> dict[str, Any]:
    """Requires a valid authentication token or raises 401 Unauthorized."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = decode_access_token(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(required_role: str):
    """FastAPI dependency to enforce role-based access control (RBAC)."""
    def role_checker(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if user.get("role") != required_role and user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires '{required_role}' role",
            )
        return user
    return role_checker
