import { Atom, GraduationCap, Lock, Mail, Sparkles, User, Zap } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "../router/Router";
import { useAuth, UserRole } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, loginAsDemo } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setIsLoading(true);
    try {
      await signup(name, email, password, role);
      showToast(`Account created successfully! Let's personalize your path.`, "success", "Welcome to SAMBHAV");
      navigate("/onboarding");
    } catch {
      showToast("Registration failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDemoLogin(demoRole: "student" | "instructor") {
    loginAsDemo(demoRole);
    showToast(`Logged in as Demo ${demoRole === "instructor" ? "Instructor" : "Student"}`, "success", "Demo Access");
    if (demoRole === "instructor") {
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
          <h2>Create Your Account</h2>
          <p>Join India's AI-powered quantum learning platform.</p>
        </div>

        {/* 1-Click Demo Logins Banner */}
        <div className="demo-accounts-box">
          <div className="demo-accounts-title">
            <Sparkles size={14} className="text-amber" />
            <span>Or explore with 1-click demo access:</span>
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
          <span>or sign up with details</span>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-name">Full Name</label>
            <div className="input-with-icon">
              <User size={17} className="input-icon" />
              <input
                id="signup-name"
                type="text"
                placeholder="Punith Venkat Sai"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Role selection pills */}
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
            disabled={isLoading || !name.trim() || !email.trim()}
          >
            {isLoading ? "Creating Account..." : "Create Free Account"}
          </button>
        </form>

        <div className="auth-footer-link">
          <span>Already have an account? </span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
