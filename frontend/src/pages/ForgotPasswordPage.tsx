import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Atom,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, validateReturnTo } from "../router/Router";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { OtpInitiatedResponse } from "../api/client";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initiateForgotPassword, verifyResetOtp, completePasswordReset, resendOtp, user } = useAuth();
  const { showToast } = useToast();

  // Extract ?returnTo=/destination or ?redirect=/destination from URL
  const searchParams = new URLSearchParams(location.search || window.location.search);
  const rawReturnTo = searchParams.get("returnTo") || searchParams.get("redirect") || "";
  const returnToDestination = validateReturnTo(rawReturnTo, "");

  // Safe redirect helper
  const performRedirect = (role?: string) => {
    if (returnToDestination) {
      navigate(returnToDestination);
    } else if (role === "instructor") {
      navigate("/instructor");
    } else {
      navigate("/dashboard");
    }
  };

  // If already authenticated and not actively resetting, route appropriately
  useEffect(() => {
    if (user && step !== "success") {
      performRedirect(user.role);
    }
  }, [user]);

  // Steps: "email" | "otp" | "password" | "success"
  const [step, setStep] = useState<"email" | "otp" | "password" | "success">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // OTP State
  const [sessionToken, setSessionToken] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300); // 5 mins
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Password Reset State
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    if (step !== "otp") return;
    const timer = setInterval(() => {
      setOtpExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Password Strength Calculation
  const passwordCriteria = useMemo(() => {
    const hasMinLength = newPassword.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumberOrSymbol = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (hasMinLength) score += 1;
    if (hasLetter && hasNumberOrSymbol) score += 1;
    if (newPassword.length >= 12 && hasLetter && hasNumberOrSymbol) score += 1;

    let strengthLabel = "Weak";
    let strengthColor = "#ef4444";
    let strengthPercent = 25;

    if (score === 2) {
      strengthLabel = "Fair";
      strengthColor = "#f59e0b";
      strengthPercent = 50;
    } else if (score === 3) {
      strengthLabel = "Good";
      strengthColor = "#38bdf8";
      strengthPercent = 75;
    } else if (score >= 4) {
      strengthLabel = "Strong";
      strengthColor = "#10b981";
      strengthPercent = 100;
    }

    return {
      hasMinLength,
      hasLetter,
      hasNumberOrSymbol,
      passwordsMatch,
      score,
      strengthLabel,
      strengthColor,
      strengthPercent,
    };
  }, [newPassword, confirmPassword]);

  // =========================================================================
  // STEP 1: REQUEST OTP FOR EMAIL
  // =========================================================================
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showToast("Please enter your registered email address.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res: OtpInitiatedResponse = await initiateForgotPassword(cleanEmail);
      setSessionToken(res.session_token);
      setOtpExpiresIn(res.expires_in || 300);
      setResendCooldown(res.resend_cooldown || 45);
      setEmailSent(res.email_sent);
      setStep("otp");

      if (res.email_sent) {
        showToast(`Verification code sent to ${cleanEmail}`, "success", "OTP Dispatched");
      } else {
        showToast("Password reset code generated. Check your inbox (or dev server console).", "info", "Code Dispatched");
      }
    } catch (err: any) {
      const message = err?.message || "Could not find an account with this email address.";
      showToast(message, "error", "Request Failed");
    } finally {
      setIsLoading(false);
    }
  }

  // =========================================================================
  // STEP 2: DIGIT OTP INPUT HANDLING
  // =========================================================================
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    const focusIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[focusIndex]?.focus();
  };

  async function handleVerifyOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      showToast("Please enter the complete 6-digit verification code.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyResetOtp(sessionToken, fullCode);
      setResetToken(res.reset_token);
      setStep("password");
      showToast("Verification code confirmed. Please set your new password.", "success", "Identity Verified");
    } catch (err: any) {
      const message = err?.message || "Invalid or expired verification code.";
      showToast(message, "error", "Verification Error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const res = await resendOtp(sessionToken);
      setSessionToken(res.session_token);
      setOtpExpiresIn(res.expires_in || 300);
      setResendCooldown(res.resend_cooldown || 45);
      setOtpDigits(["", "", "", "", "", ""]);
      showToast("A fresh verification code has been dispatched.", "success", "Code Resent");
    } catch (err: any) {
      showToast(err?.message || "Failed to resend code. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  // =========================================================================
  // STEP 3: SUBMIT NEW PASSWORD & SIGN IN
  // =========================================================================
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match. Please verify your entries.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const authenticatedUser = await completePasswordReset(resetToken, newPassword);
      setStep("success");
      showToast(`Password successfully reset! Welcome back, ${authenticatedUser.name}.`, "success", "Success");

      // Auto-redirect to dashboard / destination after brief celebratory presentation
      setTimeout(() => {
        performRedirect(authenticatedUser.role);
      }, 2200);
    } catch (err: any) {
      const message = err?.message || "Failed to reset password. The session may have expired.";
      showToast(message, "error", "Reset Error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page-root">
      <div className="auth-card-container">
        {/* Brand Header */}
        <div className="auth-header">
          <Link to="/" className="auth-brand-badge">
            <Atom size={28} className="spin-slow text-teal" />
            <span>SAMBHAV</span>
          </Link>

          {/* Stepper Progress Bar */}
          <div className="forgot-stepper">
            <div className={`stepper-step ${step === "email" ? "active" : "completed"}`}>
              <div className="stepper-bubble">1</div>
              <span>Email</span>
            </div>
            <div className="stepper-line" />
            <div
              className={`stepper-step ${
                step === "otp"
                  ? "active"
                  : step === "password" || step === "success"
                  ? "completed"
                  : ""
              }`}
            >
              <div className="stepper-bubble">2</div>
              <span>OTP</span>
            </div>
            <div className="stepper-line" />
            <div
              className={`stepper-step ${
                step === "password" ? "active" : step === "success" ? "completed" : ""
              }`}
            >
              <div className="stepper-bubble">3</div>
              <span>Reset</span>
            </div>
          </div>

          <h2>
            {step === "email" && "Forgot Your Password?"}
            {step === "otp" && "Enter Verification Code"}
            {step === "password" && "Create New Password"}
            {step === "success" && "Password Reset Complete!"}
          </h2>
          <p>
            {step === "email" &&
              "Enter the email associated with your SAMBHAV account to receive a secure OTP code."}
            {step === "otp" && `Enter the 6-digit verification code dispatched to ${email}.`}
            {step === "password" &&
              "Choose a strong, secure password for your quantum learning account."}
            {step === "success" &&
              "Your credentials have been securely updated. Signing you in..."}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: EMAIL ENTRY FORM */}
        {/* ========================================================================= */}
        {step === "email" && (
          <form className="auth-form" onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="forgot-email">Account Email Address</label>
              <div className="input-with-icon">
                <Mail size={17} className="input-icon" />
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="name@sambhav.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? "Sending Verification Code..." : (
                <>
                  Send Verification Code <ArrowRight size={16} />
                </>
              )}
            </button>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <Link
                to={returnToDestination ? `/login?returnTo=${encodeURIComponent(returnToDestination)}` : "/login"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#94a3b8",
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: 6-DIGIT OTP VERIFICATION FORM */}
        {/* ========================================================================= */}
        {step === "otp" && (
          <form className="auth-form" onSubmit={handleVerifyOtpSubmit}>
            <div className="form-group" style={{ textAlign: "center" }}>
              <label style={{ marginBottom: "12px", display: "block" }}>
                6-Digit Security Code
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePasteOtp : undefined}
                    autoFocus={idx === 0}
                    style={{
                      width: "44px",
                      height: "52px",
                      textAlign: "center",
                      fontSize: "22px",
                      fontWeight: "700",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "2px solid rgba(56, 189, 248, 0.3)",
                      borderRadius: "8px",
                      color: "#38bdf8",
                      outline: "none",
                      boxShadow: digit ? "0 0 10px rgba(56, 189, 248, 0.3)" : "none",
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                  color: "#94a3b8",
                  marginTop: "8px",
                }}
              >
                <span>
                  Expires in:{" "}
                  <strong style={{ color: otpExpiresIn < 60 ? "#f87171" : "#e2e8f0" }}>
                    {formatTime(otpExpiresIn)}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCooldown > 0 ? "#64748b" : "#38bdf8",
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "13px",
                  }}
                >
                  <RefreshCw size={13} className={isLoading ? "spin" : ""} />
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend code"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading || otpDigits.join("").length !== 6 || otpExpiresIn === 0}
            >
              {isLoading ? "Verifying Code..." : (
                <>
                  <ShieldCheck size={18} /> Verify Code & Continue
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtpDigits(["", "", "", "", "", ""]);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                marginTop: "12px",
                width: "100%",
              }}
            >
              <ArrowLeft size={14} /> Change email address
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SET NEW PASSWORD */}
        {/* ========================================================================= */}
        {step === "password" && (
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="reset-new-password">New Password</label>
              <div className="input-with-icon">
                <Lock size={17} className="input-icon" />
                <input
                  id="reset-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter at least 6-8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div style={{ marginTop: "8px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "#94a3b8" }}>Strength:</span>
                    <span style={{ color: passwordCriteria.strengthColor, fontWeight: "600" }}>
                      {passwordCriteria.strengthLabel}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "4px",
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${passwordCriteria.strengthPercent}%`,
                        background: passwordCriteria.strengthColor,
                        transition: "width 0.3s ease, background-color 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reset-confirm-password">Confirm New Password</label>
              <div className="input-with-icon">
                <KeyRound size={17} className="input-icon" />
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {confirmPassword && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    marginTop: "6px",
                    color: passwordCriteria.passwordsMatch ? "#10b981" : "#ef4444",
                  }}
                >
                  {passwordCriteria.passwordsMatch ? (
                    <>
                      <CheckCircle2 size={14} /> Passwords match
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} /> Passwords do not match
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={
                isLoading ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
            >
              {isLoading ? "Updating Password..." : (
                <>
                  <Sparkles size={16} /> Reset Password & Sign In
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SUCCESS CONFIRMATION */}
        {/* ========================================================================= */}
        {step === "success" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.2)",
                border: "2px solid #10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#10b981",
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#f8fafc", marginBottom: "8px" }}>
              Password Reset Successful!
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px" }}>
              Your account security has been updated. You are now being authenticated and redirected to your workspace.
            </p>

            <button
              type="button"
              className="auth-submit-btn"
              onClick={() => performRedirect()}
            >
              Continue to Workspace <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Bottom Link */}
        <div className="auth-footer-link">
          <span>Remember your credentials? </span>
          <Link to={returnToDestination ? `/login?returnTo=${encodeURIComponent(returnToDestination)}` : "/login"}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
