import { Atom, Compass, LogIn, Sparkles, UserPlus } from "lucide-react";
import { Link } from "../../router/Router";
import { useAuth } from "../../context/AuthContext";

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="public-navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon-box">
            <Atom size={26} className="spin-slow" />
          </div>
          <div className="brand-text-group">
            <span className="brand-name">SAMBHAV</span>
            <span className="brand-sub">Quantum Platform</span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="navbar-links" aria-label="Main Navigation">
          <Link to="/" className="nav-link" activeClassName="nav-link-active">
            Home
          </Link>
          <Link to="/learn" className="nav-link" activeClassName="nav-link-active">
            Curriculum
          </Link>
          <Link to="/lab" className="nav-link" activeClassName="nav-link-active">
            Quantum Lab
          </Link>
          <Link to="/algorithms" className="nav-link" activeClassName="nav-link-active">
            Algorithms
          </Link>
          <Link to="/challenges" className="nav-link" activeClassName="nav-link-active">
            Challenges
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="navbar-actions">
          {user ? (
            <Link
              to={user.role === "instructor" ? "/instructor" : "/dashboard"}
              className="btn-primary-glow"
            >
              <Compass size={16} /> {user.role === "instructor" ? "Instructor Portal" : "Go to Dashboard"}
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-btn-ghost">
                <LogIn size={16} /> Sign In
              </Link>
              <Link to="/signup" className="btn-primary-glow">
                <Sparkles size={16} /> Start Learning Free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
