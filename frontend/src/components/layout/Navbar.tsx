import { Atom, Compass, LogIn, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import React, { useState } from "react";
import { Link } from "../../router/Router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export function Navbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getGatedUrl = (targetPath: string) =>
    user ? targetPath : `/login?returnTo=${encodeURIComponent(targetPath)}`;

  const getSignupUrl = (targetPath: string) =>
    user ? targetPath : `/signup?returnTo=${encodeURIComponent(targetPath)}`;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="public-navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <div className="brand-icon-box">
            <Atom size={26} className="spin-slow" />
          </div>
          <div className="brand-text-group">
            <span className="brand-name">SAMBHAV</span>
            <span className="brand-sub">Quantum Platform</span>
          </div>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <nav className="navbar-links" aria-label="Main Navigation">
          <Link to="/" className="nav-link" activeClassName="nav-link-active">
            Home
          </Link>
          <Link to={getGatedUrl("/learn")} className="nav-link" activeClassName="nav-link-active">
            Curriculum
          </Link>
          <Link to={getGatedUrl("/lab")} className="nav-link" activeClassName="nav-link-active">
            Quantum Lab
          </Link>
          <Link to={getGatedUrl("/algorithms")} className="nav-link" activeClassName="nav-link-active">
            Algorithms
          </Link>
          <Link to={getGatedUrl("/challenges")} className="nav-link" activeClassName="nav-link-active">
            Challenges
          </Link>
        </nav>

        {/* Right Actions (Desktop) */}
        <div className="navbar-actions">
          {/* Moon / Sun Theme Switcher */}
          <button
            type="button"
            className="navbar-theme-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {theme === "dark" ? (
              <Sun size={18} className="theme-toggle-sun text-amber" />
            ) : (
              <Moon size={18} className="theme-toggle-moon text-indigo" />
            )}
            <span className="theme-btn-label-desktop">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

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
              <Link to={getSignupUrl("/learn")} className="btn-primary-glow">
                <Sparkles size={16} /> Start Learning Free
              </Link>
            </>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="navbar-mobile-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="navbar-mobile-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Menu */}
      <div className={`navbar-mobile-drawer ${isMobileMenuOpen ? "mobile-drawer-open" : ""}`}>
        <div className="mobile-drawer-header">
          <div className="brand-text-group">
            <span className="brand-name">SAMBHAV</span>
            <span className="brand-sub">Navigation</span>
          </div>
          <button
            type="button"
            className="mobile-drawer-close-btn"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-drawer-links" aria-label="Mobile Navigation">
          <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
            Home
          </Link>
          <Link to={getGatedUrl("/learn")} className="mobile-nav-link" onClick={closeMobileMenu}>
            Curriculum
          </Link>
          <Link to={getGatedUrl("/lab")} className="mobile-nav-link" onClick={closeMobileMenu}>
            Quantum Lab
          </Link>
          <Link to={getGatedUrl("/algorithms")} className="mobile-nav-link" onClick={closeMobileMenu}>
            Algorithms
          </Link>
          <Link to={getGatedUrl("/challenges")} className="mobile-nav-link" onClick={closeMobileMenu}>
            Challenges
          </Link>
        </nav>

        <div className="mobile-drawer-footer">
          {/* Mobile Theme Switch Button */}
          <button
            type="button"
            className="mobile-theme-switch-btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            <div className="mobile-theme-switch-icon">
              {theme === "dark" ? <Sun size={18} className="text-amber" /> : <Moon size={18} className="text-indigo" />}
            </div>
            <span>Theme: {theme === "dark" ? "Dark Mode (Tap for Light)" : "Light Mode (Tap for Dark)"}</span>
          </button>

          <div className="mobile-drawer-auth-actions">
            {user ? (
              <Link
                to={user.role === "instructor" ? "/instructor" : "/dashboard"}
                className="btn-primary-glow btn-full-width"
                onClick={closeMobileMenu}
              >
                <Compass size={16} /> {user.role === "instructor" ? "Instructor Portal" : "Go to Dashboard"}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="nav-btn-ghost btn-full-width"
                  onClick={closeMobileMenu}
                >
                  <LogIn size={16} /> Sign In
                </Link>
                <Link
                  to={getSignupUrl("/learn")}
                  className="btn-primary-glow btn-full-width"
                  onClick={closeMobileMenu}
                >
                  <Sparkles size={16} /> Start Learning Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
