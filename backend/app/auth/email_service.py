import os
import smtplib
from email.message import EmailMessage
from typing import Optional, Tuple


class EmailService:
    """
    Email service abstraction for dispatching authentication OTPs and notifications.
    Supports real SMTP dispatch when credentials are configured in the environment,
    with a clear development fallback when unconfigured.
    """

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_from = os.getenv("SMTP_FROM", "SAMBHAV Quantum Platform <noreply@sambhav.edu>")
        self.smtp_tls = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")

    @property
    def is_configured(self) -> bool:
        """Returns True if valid SMTP credentials are configured."""
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    def send_otp_email(self, to_email: str, otp_code: str, user_name: Optional[str] = None) -> Tuple[bool, str]:
        """
        Dispatches a 6-digit OTP email.
        Returns: (success: bool, delivery_info: str)
        """
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
