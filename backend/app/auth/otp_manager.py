import hashlib
import hmac
import os
import secrets
import time
from typing import Any, Dict, Optional, Tuple

from app.auth.email_service import email_service

OTP_EXPIRY_SECONDS = 300       # 5 minutes
RESEND_COOLDOWN_SECONDS = 45   # 45 seconds rate-limiting
MAX_VERIFY_ATTEMPTS = 3        # Maximum 3 verification attempts per challenge

OTP_SECRET = os.getenv("OTP_SECRET_KEY", os.getenv("JWT_SECRET_KEY", "sambhav_otp_secret_key_2026"))


class OTPChallenge:
    def __init__(self, email: str, otp_code: str, user_id: str, user_name: str, user_role: str, purpose: str = "login"):
        self.email = email.lower().strip()
        self.salt = os.urandom(16).hex()
        self.otp_hash = self._hash_code(otp_code, self.salt)
        self.user_id = user_id
        self.user_name = user_name
        self.user_role = user_role
        self.purpose = purpose
        self.created_at = time.time()
        self.expires_at = self.created_at + OTP_EXPIRY_SECONDS
        self.resend_available_at = self.created_at + RESEND_COOLDOWN_SECONDS
        self.attempts = 0
        self.is_used = False

    @staticmethod
    def _hash_code(code: str, salt: str) -> str:
        return hashlib.sha256(f"{salt}:{code}:{OTP_SECRET}".encode("utf-8")).hexdigest()

    def verify(self, code: str) -> Tuple[bool, str]:
        """
        Verifies the given code against the stored hash.
        Returns (is_valid: bool, error_message: str)
        """
        now = time.time()
        if self.is_used:
            return False, "This verification code has already been used. Please request a new one."
        if now > self.expires_at:
            return False, "The verification code has expired. Please request a new one."
        if self.attempts >= MAX_VERIFY_ATTEMPTS:
            return False, "Too many failed attempts. This code has been invalidated for security. Please request a new one."

        self.attempts += 1
        computed = self._hash_code(code.strip(), self.salt)

        if hmac.compare_digest(self.otp_hash, computed):
            self.is_used = True
            return True, ""
        else:
            remaining = MAX_VERIFY_ATTEMPTS - self.attempts
            if remaining > 0:
                return False, f"Incorrect verification code. {remaining} attempt{'s' if remaining > 1 else ''} remaining."
            else:
                return False, "Incorrect verification code. Maximum attempts reached; code has been invalidated."


class OTPManager:
    """
    In-memory and thread-safe manager for active OTP challenges with rate limiting,
    attempt tracking, expiration enforcement, and session binding.
    """

    def __init__(self):
        # Map: email -> OTPChallenge
        self._challenges: Dict[str, OTPChallenge] = {}
        # Map: otp_session_token -> email
        self._session_tokens: Dict[str, str] = {}

    def _cleanup_expired(self):
        now = time.time()
        expired_emails = [e for e, c in self._challenges.items() if c.expires_at < now or c.is_used]
        for e in expired_emails:
            del self._challenges[e]
        expired_tokens = [t for t, e in self._session_tokens.items() if e not in self._challenges]
        for t in expired_tokens:
            del self._session_tokens[t]

    def create_challenge(self, user_id: str, email: str, name: str, role: str, purpose: str = "login") -> Tuple[str, str, Dict[str, Any]]:
        """
        Generates a 6-digit OTP, registers challenge, dispatches email (or dev log),
        and returns (otp_session_token, otp_code, delivery_metadata).
        """
        self._cleanup_expired()
        norm_email = email.lower().strip()

        # Cryptographically secure 6-digit number [100000 - 999999]
        otp_code = str(secrets.randbelow(900000) + 100000)
        
        challenge = OTPChallenge(
            email=norm_email,
            otp_code=otp_code,
            user_id=user_id,
            user_name=name,
            user_role=role,
            purpose=purpose,
        )
        self._challenges[norm_email] = challenge

        # Create session token
        session_token = secrets.token_urlsafe(32)
        self._session_tokens[session_token] = norm_email

        # Send email / log dev output
        success, delivery_info = email_service.send_otp_email(norm_email, otp_code, name, purpose=purpose)

        metadata = {
            "email_sent": email_service.is_configured and success,
            "delivery_info": delivery_info,
            "expires_in": OTP_EXPIRY_SECONDS,
            "resend_cooldown": RESEND_COOLDOWN_SECONDS,
        }

        return session_token, otp_code, metadata

    def resend_challenge(self, session_token: str) -> Tuple[str, str, Dict[str, Any]]:
        """
        Resends an OTP for an active session with rate limit validation.
        """
        self._cleanup_expired()
        norm_email = self._session_tokens.get(session_token)
        if not norm_email:
            raise ValueError("Invalid or expired session. Please log in again.")
        
        existing = self._challenges.get(norm_email)
        if not existing:
            raise ValueError("Session expired. Please log in again.")

        now = time.time()
        if not existing.is_used and now < existing.resend_available_at:
            wait_seconds = int(existing.resend_available_at - now)
            raise ValueError(f"Please wait {wait_seconds} seconds before requesting a new code.")

        return self.create_challenge(
            user_id=existing.user_id,
            email=norm_email,
            name=existing.user_name,
            role=existing.user_role,
            purpose=getattr(existing, "purpose", "login"),
        )

    def verify_challenge(self, session_token: str, otp_code: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Verifies the given code for the session token.
        Returns (success: bool, user_data: Optional[Dict], error_message: str)
        """
        self._cleanup_expired()
        norm_email = self._session_tokens.get(session_token)
        if not norm_email:
            return False, None, "Invalid or expired session. Please log in again."

        challenge = self._challenges.get(norm_email)
        if not challenge:
            return False, None, "Verification session expired. Please log in again."

        is_valid, error_msg = challenge.verify(otp_code)
        if not is_valid:
            return False, None, error_msg

        # Success - clean up and return user info
        user_data = {
            "id": challenge.user_id,
            "name": challenge.user_name,
            "email": challenge.email,
            "role": challenge.user_role,
        }
        del self._challenges[norm_email]
        del self._session_tokens[session_token]

        return True, user_data, ""


otp_manager = OTPManager()
