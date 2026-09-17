import { Atom, ShieldAlert } from "lucide-react";
import React, { useEffect } from "react";
import { Link, useLocation, useNavigate, validateReturnTo } from "./Router";
import { useAuth } from "../context/AuthContext";

interface GuardProps {
  children: React.ReactElement;
}

export function ProtectedRoute({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname, search, fullPath } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const destination = fullPath || (pathname + search);
      const safeDestination = validateReturnTo(destination, "/dashboard");
      navigate(`/login?returnTo=${encodeURIComponent(safeDestination)}`);
    }
  }, [isLoading, isAuthenticated, fullPath, pathname, search, navigate]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0b0f19",
          color: "#38bdf8",
          fontFamily: "Inter, sans-serif",
          gap: "16px",
        }}
      >
        <Atom size={40} className="spin-slow" />
        <span style={{ fontSize: "14px", color: "#94a3b8" }}>Verifying quantum session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}

export function InstructorRoute({ children }: GuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pathname, search, fullPath } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const destination = fullPath || (pathname + search);
      const safeDestination = validateReturnTo(destination, "/instructor");
      navigate(`/login?returnTo=${encodeURIComponent(safeDestination)}`);
    }
  }, [isLoading, isAuthenticated, fullPath, pathname, search, navigate]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0b0f19",
          color: "#38bdf8",
          fontFamily: "Inter, sans-serif",
          gap: "16px",
        }}
      >
        <Atom size={40} className="spin-slow" />
        <span style={{ fontSize: "14px", color: "#94a3b8" }}>Verifying instructor privileges...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== "instructor" && user?.role !== "admin") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0b0f19",
          color: "#f8fafc",
          fontFamily: "Inter, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            background: "#1e293b",
            border: "1px solid #ef4444",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          <ShieldAlert size={48} style={{ color: "#ef4444", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Instructor Portal Restricted</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
            Your account (<strong>{user?.email}</strong>) has the <strong>student</strong> role. Instructor course authoring and classroom analytics require an authenticated instructor account.
          </p>
          <Link
            to="/dashboard"
            style={{
              display: "inline-block",
              background: "#14b8a6",
              color: "#0f172a",
              fontWeight: "600",
              padding: "10px 20px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Return to Student Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
