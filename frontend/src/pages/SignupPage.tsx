import {
  ArrowLeft,
  ArrowRight,
  Atom,
  GraduationCap,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "../router/Router";
import { useAuth, UserRole } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { OtpInitiatedResponse } from "../api/client";

export function SignupPage() {
  const navigate = useNavigate();
  const { initiateSignup, verifyOtp, resendOtp, user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/onboarding");
    }
  }, [user]);

  // Stage: "details" | "otp"
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);

  // OTP State
  const [sessionToken, setSessionToken] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "otp") return;
    const timer = setInterval(() => {
      setOtpExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast("Please fill in all registration fields.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res: OtpInitiatedResponse = await initiateSignup(name.trim(), email.trim(), password, role);
      setSessionToken(res.session_token);
      setOtpExpiresIn(res.expires_in || 300);
      setResendCooldown(res.resend_cooldown || 45);
      setStep("otp");

      if (res.email_sent) {
        showToast(`Verification code sent to ${email}`, "success", "OTP Dispatched");
      } else {
        showToast("Verification code generated. Please check your inbox (or server console in local dev).", "info", "Code Dispatched");
      }
    } catch (err: any) {
      showToast(err?.message || "Registration failed. Please try again.", "error", "Registration Error");
    } finally {
      setIsLoading(false);
    }
  }

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

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      showToast("Please enter the complete 6-digit verification code.", "error");
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(sessionToken, fullCode);
      showToast(`Welcome to SAMBHAV! Let's personalize your path.`, "success", "Account Verified");
      navigate("/onboarding");
    } catch (err: any) {
      showToast(err?.message || "Invalid or expired verification code.", "error", "Verification Error");
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

  return (
    <div className="auth-page-root">
      <div className="auth-card-container">
        {/* Brand Header */}
        <div className="auth-header">
          <Link to="/" className="auth-brand-badge">
            <Atom size={28} className="spin-slow text-teal" />
            <span>SAMBHAV</span>
          </Link>
          <h2>{step === "details" ? "Create Your Account" : "Verify Your Email"}</h2>
          <p>
            {step === "details"
              ? "Join India's AI-powered quantum learning platform."
              : `Enter the 6-digit code dispatched to ${email}`}
          </p>
        </div>

        {/* STEP 1: REGISTRATION FORM */}
        {step === "details" && (
          <form className="auth-form" onSubmit={handleDetailsSubmit}>
            <div className="form-group">
              <label htmlFor="signup-name">Full Name</label>
              <div className="input-with-icon">
                <User size={17} className="input-icon" />
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={17} className="input-icon" />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="student@sambhav.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <div className="input-with-icon">
                <Lock size={17} className="input-icon" />
                <input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="form-group">
              <label>I am joining as a:</label>
              <div className="role-pills-row">
                <button
                  type="button"
                  className={`role-choice-pill ${role === "student" ? "selected" : ""}`}
                  onClick={() => setRole("student")}
                >
                  <Zap size={15} /> Student Learner
                </button>
                <button
                  type="button"
                  className={`role-choice-pill ${role === "instructor" ? "selected" : ""}`}
                  onClick={() => setRole("instructor")}
                >
                  <GraduationCap size={15} /> Instructor / Educator
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading || !name.trim() || !email.trim() || !password.trim()}
            >
              {isLoading ? "Creating Account..." : (
                <>
                  Register & Verify Email <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
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
                  <ShieldCheck size={18} /> Verify Code & Complete Registration
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("details");
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
              <ArrowLeft size={14} /> Back to details entry
            </button>
          </form>
        )}

        {/* Bottom Link */}
        <div className="auth-footer-link">
          <span>Already have an account? </span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
