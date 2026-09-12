import { Atom, GraduationCap, Lock, LogIn, Mail, Sparkles, User, Zap } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "../router/Router";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginAsDemo } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await login(email, password);
      showToast(`Welcome back to SAMBHAV!`, "success", "Signed In");
      if (email.toLowerCase().includes("instructor")) {
        navigate("/instructor");
      } else {
        navigate("/dashboard");
      }
    } catch {
      showToast("Authentication failed. Please check your credentials.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDemoLogin(role: "student" | "instructor") {
    loginAsDemo(role);
    showToast(`Logged in as Demo ${role === "instructor" ? "Instructor" : "Student"}`, "success", "Demo Access");
    if (role === "instructor") {
      navigate("/instructor");
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="auth-page-root">
      <div className="auth-card-container">
        {/* Brand Header */}
        <div className="auth-header">
          <Link to="/" className="auth-brand-badge">
            <Atom size={28} className="spin-slow" />
            <span>SAMBHAV</span>
          </Link>
          <h2>Welcome Back</h2>
          <p>Sign in to continue your quantum learning journey.</p>
        </div>

        {/* 1-Click Demo Logins Banner */}
        <div className="demo-accounts-box">
          <div className="demo-accounts-title">
            <Sparkles size={14} className="text-amber" />
            <span>Quick Demo Access (Evaluation):</span>
          </div>
          <div className="demo-buttons-row">
            <button
              type="button"
              className="demo-btn demo-btn-student"
              onClick={() => handleDemoLogin("student")}
            >
              <Zap size={14} /> Demo Student
            </button>
            <button
              type="button"
              className="demo-btn demo-btn-instructor"
              onClick={() => handleDemoLogin("instructor")}
            >
              <GraduationCap size={14} /> Demo Instructor
            </button>
          </div>
        </div>

        <div className="auth-divider">
          <span>or sign in with email</span>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              <span>Remember me for 30 days</span>
            </label>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? "Signing In..." : "Sign In to Account"}
          </button>
        </form>

        <div className="auth-footer-link">
          <span>Don't have an account yet? </span>
          <Link to="/signup">Create account</Link>
        </div>
      </div>
    </div>
  );
}
