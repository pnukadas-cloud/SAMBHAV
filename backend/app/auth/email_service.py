import os
import smtplib
from email.message import EmailMessage
from typing import Optional, Tuple


# =========================================================================
# SMTP CREDENTIALS CONFIGURATION (READ FROM SERVER ENVIRONMENT / .env)
# =========================================================================
DEFAULT_SMTP_HOST = "smtp.gmail.com"
DEFAULT_SMTP_PORT = 587
DEFAULT_SMTP_USER = ""
DEFAULT_SMTP_PASSWORD = ""
DEFAULT_SMTP_FROM = ""
DEFAULT_SMTP_TLS = True
# =========================================================================


from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class EmailService:
    """
    Email service abstraction for dispatching authentication OTPs and notifications.
    Supports real SMTP dispatch when credentials are configured in the environment or in code above,
    with a clear development fallback when unconfigured.
    """

    def __init__(self):
        self.last_dispatched_code_for_test: Optional[str] = None

    def _reload_env(self):
        if ENV_PATH.exists():
            load_dotenv(dotenv_path=ENV_PATH, override=True)

    @property
    def smtp_host(self) -> str:
        self._reload_env()
        return os.getenv("SMTP_HOST", DEFAULT_SMTP_HOST).strip()

    @property
    def smtp_port(self) -> int:
        self._reload_env()
        return int(os.getenv("SMTP_PORT", str(DEFAULT_SMTP_PORT)))

    @property
    def smtp_user(self) -> str:
        self._reload_env()
        return os.getenv("SMTP_USER", DEFAULT_SMTP_USER).strip()

    @property
    def smtp_password(self) -> str:
        self._reload_env()
        raw = os.getenv("SMTP_PASSWORD", DEFAULT_SMTP_PASSWORD).strip()
        # If user entered 16-digit Google App Password with spaces (e.g. "abcd efgh ijkl mnop"), strip spaces
        if " " in raw and len(raw.replace(" ", "")) == 16:
            return raw.replace(" ", "")
        return raw

    @property
    def smtp_from(self) -> str:
        self._reload_env()
        return os.getenv("SMTP_FROM", DEFAULT_SMTP_FROM).strip() or f"SAMBHAV Quantum Platform <{self.smtp_user or 'noreply@sambhav.edu'}>"

    @property
    def smtp_tls(self) -> bool:
        self._reload_env()
        env_tls = os.getenv("SMTP_TLS")
        if env_tls is not None:
            return env_tls.lower() in ("true", "1", "yes")
        return DEFAULT_SMTP_TLS

    @property
    def is_configured(self) -> bool:
        """Returns True if valid SMTP credentials are configured."""
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    def send_otp_email(self, to_email: str, otp_code: str, user_name: Optional[str] = None) -> Tuple[bool, str]:
        """
        Dispatches a 6-digit OTP email.
        Returns: (success: bool, delivery_info: str)
        """
        self.last_dispatched_code_for_test = otp_code
        greeting = f"Hello {user_name}," if user_name else "Hello Quantum Learner,"
        subject = f"SAMBHAV Quantum Platform — Your Verification Code is {otp_code}"
        
        text_body = f"""{greeting}

Your 6-digit verification code for SAMBHAV Quantum Platform is:

    {otp_code}

This code is valid for 5 minutes and can only be used once.
If you did not request this verification code, please ignore this email.

— The SAMBHAV Quantum Team (Smart India Hackathon 2026)
"""

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; }}
    .card {{ max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }}
    .logo {{ font-size: 24px; font-weight: bold; color: #14b8a6; margin-bottom: 20px; }}
    .otp-box {{ background: #0f172a; border: 2px dashed #14b8a6; border-radius: 8px; font-size: 32px; font-weight: 800; letter-spacing: 6px; text-align: center; color: #38bdf8; padding: 16px; margin: 24px 0; }}
    .footer {{ font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚛️ SAMBHAV Quantum Platform</div>
    <h2>Two-Factor Verification</h2>
    <p>{greeting}</p>
    <p>Please enter the following 6-digit verification code to complete your login:</p>
    <div class="otp-box">{otp_code}</div>
    <p style="font-size: 14px; color: #94a3b8;">This code is valid for <strong>5 minutes</strong> and can only be used once.</p>
    <div class="footer">
      Smart India Hackathon 2026 Innovation<br>
      If you did not request this login, you can safely disregard this message.
    </div>
  </div>
</body>
</html>
"""

        if self.is_configured:
            try:
                msg = EmailMessage()
                msg["Subject"] = subject
                msg["From"] = self.smtp_from
                msg["To"] = to_email
                msg.set_content(text_body)
                msg.add_alternative(html_body, subtype="html")

                if self.smtp_port == 465:
                    with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=10.0) as server:
                        server.login(self.smtp_user, self.smtp_password)
                        server.send_message(msg)
                else:
                    with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10.0) as server:
                        if self.smtp_tls:
                            server.starttls()
                        server.login(self.smtp_user, self.smtp_password)
                        server.send_message(msg)
                return True, f"Email sent via SMTP to {to_email}"
            except Exception as e:
                # Log error and inform
                print(f"[AUTH-EMAIL-ERROR] SMTP delivery failed: {e}")
                return False, f"SMTP delivery failed: {str(e)}"
        else:
            # Development / Demo Fallback
            print(f"\n=======================================================")
            print(f"[AUTH-OTP] (DEV/DEMO MODE — No SMTP Configured)")
            print(f"Recipient : {to_email}")
            print(f"OTP Code  : {otp_code}")
            print(f"Expires   : 5 minutes")
            print(f"=======================================================\n")
            return True, "Development console delivery (SMTP not configured)"


email_service = EmailService()
