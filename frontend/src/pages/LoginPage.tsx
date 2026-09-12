import {
  ArrowLeft,
  ArrowRight,
  Atom,
  CheckCircle,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "../router/Router";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { OtpInitiatedResponse } from "../api/client";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initiateLogin, verifyOtp, resendOtp, user } = useAuth();
  const { showToast } = useToast();

  // Extract ?redirect=/destination from URL
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get("redirect") || "";

  // If already authenticated, route appropriately
  useEffect(() => {
    if (user) {
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (user.role === "instructor") {
        navigate("/instructor");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user]);

  // Stage: "credentials" | "otp"
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // OTP State
  const [sessionToken, setSessionToken] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300); // 5 mins
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

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

  // Step 1: Submit Credentials
  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Please enter both email and password.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res: OtpInitiatedResponse = await initiateLogin(email.trim(), password);
      setSessionToken(res.session_token);
      setOtpExpiresIn(res.expires_in || 300);
      setResendCooldown(res.resend_cooldown || 45);
      setEmailSent(res.email_sent);
      setStep("otp");

      if (res.email_sent) {
        showToast(`Verification code sent to ${email}`, "success", "OTP Dispatched");
      } else {
        showToast("Verification code generated. Please check your inbox (or server console in local dev).", "info", "Code Dispatched");
      }
    } catch (err: any) {
      const message = err?.message || "Invalid credentials. Please verify your email and password.";
      showToast(message, "error", "Authentication Failed");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle individual OTP digit change
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-focus next input
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

  // Step 2: Verify OTP
  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      showToast("Please enter the complete 6-digit verification code.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const authUser = await verifyOtp(sessionToken, fullCode);
      showToast(`Welcome back, ${authUser.name}!`, "success", "Authentication Complete");

      // Redirect logic
      if (redirectUrl) {
        navigate(redirectUrl);
      } else if (authUser.role === "instructor") {
        navigate("/instructor");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const message = err?.message || "Invalid or expired verification code.";
      showToast(message, "error", "Verification Error");
    } finally {
      setIsLoading(false);
    }
  }

  // Resend OTP
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

  // Helper to prefill evaluation credentials
  const fillCredentials = (type: "student" | "instructor") => {
    if (type === "student") {
      setEmail("student@sambhav.edu");
      setPassword("QuantumLearner#2026");
    } else {
      setEmail("instructor@sambhav.edu");
      setPassword("ProfessorQuantum#2026");
    }
  };

  return (
    <div className="auth-page-root">
      <div className="auth-card-container">
        {/* Brand Header */}
        <div className="auth-header">
          <Link to="/" className="auth-brand-badge">
            <Atom size={28} className="spin-slow text-teal" />
            <span>SAMBHAV</span>
          </Link>
          <h2>{step === "credentials" ? "Sign In to Account" : "Two-Factor Verification"}</h2>
          <p>
            {step === "credentials"
              ? "Enter your account credentials to access SAMBHAV."
              : `Enter the 6-digit code dispatched to ${email}`}
          </p>
        </div>

        {/* STEP 1: CREDENTIALS FORM */}
        {step === "credentials" && (
          <>
            {/* Quick-fill credentials badge for evaluation */}
            <div className="demo-accounts-box">
              <div className="demo-accounts-title">
                <Sparkles size={14} className="text-amber" />
                <span>Evaluation Credentials (Auto-fill):</span>
              </div>
              <div className="demo-buttons-row">
                <button
                  type="button"
                  className="demo-btn demo-btn-student"
                  onClick={() => fillCredentials("student")}
                >
                  Student: student@sambhav.edu
                </button>
                <button
                  type="button"
                  className="demo-btn demo-btn-instructor"
                  onClick={() => fillCredentials("instructor")}
                >
                  Instructor: instructor@sambhav.edu
                </button>
              </div>
            </div>

            <form className="auth-form" onSubmit={handleCredentialsSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={17} className="input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="student@sambhav.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="label-with-link">
                  <label htmlFor="login-password">Password</label>
                  <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                </div>
                <div className="input-with-icon">
                  <Lock size={17} className="input-icon" />
                  <input
                    id="login-password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-remember-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember my device</span>
                </label>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading || !email.trim() || !password.trim()}
              >
                {isLoading ? "Verifying Credentials..." : (
                  <>
                    Continue with Email OTP <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: 6-DIGIT OTP VERIFICATION FORM */}
        {step === "otp" && (
          <form className="auth-form" onSubmit={handleVerifySubmit}>

            <div className="form-group" style={{ textAlign: "center" }}>
              <label style={{ marginBottom: "12px", display: "block" }}>
                Enter 6-Digit Verification Code
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
                  Expires in: <strong style={{ color: otpExpiresIn < 60 ? "#f87171" : "#e2e8f0" }}>{formatTime(otpExpiresIn)}</strong>
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
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
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
                  <ShieldCheck size={18} /> Verify Code & Sign In
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("credentials");
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
              <ArrowLeft size={14} /> Back to credential entry
            </button>
          </form>
        )}

        {/* Bottom Link */}
        <div className="auth-footer-link">
          <span>Don't have an account yet? </span>
          <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
