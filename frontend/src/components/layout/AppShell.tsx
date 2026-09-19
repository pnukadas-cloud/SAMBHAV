import {
  Atom,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  ChevronRight,
  FilePlus,
  Flame,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Trophy,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "../../router/Router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

type Props = {
  children: React.ReactNode;
  activeTitle?: string;
  activeCategory?: string;
};

interface NavItem {
  label: string;
  to: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
}

export function AppShell({ children, activeTitle, activeCategory }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("sambhav_sidebar_expanded");
      if (saved !== null) {
        return saved === "true";
      }
    } catch {
      // ignore
    }
    return true;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sambhav_sidebar_expanded", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isInstructor = user?.role === "instructor" || location.pathname.startsWith("/instructor");

  const navItemsStudent: NavItem[] = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Curriculum", to: "/learn", icon: BookOpen },
    { label: "Quantum Lab", to: "/lab", icon: BrainCircuit, badge: "IDE" },
    { label: "Algorithm Library", to: "/algorithms", icon: Atom },
    { label: "Challenges & Quizzes", to: "/challenges", icon: Trophy, badge: "XP" },
    { label: "AI Quantum Tutor", to: "/ai-tutor", icon: Bot, highlight: true },
    { label: "My Progress", to: "/progress", icon: Award },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  const navItemsInstructor: NavItem[] = [
    { label: "Dashboard", to: "/instructor", icon: LayoutDashboard },
    { label: "Curriculum", to: "/instructor/curriculum", icon: Layers },
    { label: "Lesson Builder", to: "/instructor/authoring", icon: FilePlus },
    { label: "Classes & Cohorts", to: "/instructor/classes", icon: GraduationCap },
    { label: "Learners", to: "/instructor/learners", icon: Users },
    { label: "Assessments", to: "/instructor/assessments", icon: Trophy },
    { label: "Lab Assignments", to: "/instructor/labs", icon: BrainCircuit },
    { label: "Analytics", to: "/instructor/analytics", icon: BarChart3 },
    { label: "AI Copilot", to: "/instructor/ai-copilot", icon: Sparkles, highlight: true },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  const currentNavItems = isInstructor ? navItemsInstructor : navItemsStudent;

  return (
    <div className={`app-container ${isSidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Primary Unified Sidebar Navigation (Fixed in place) */}
      <aside className={`app-sidebar ${isMobileOpen ? "mobile-open" : ""}`} aria-label="Sidebar Navigation">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" title="SAMBHAV Quantum Learning">
            <div className="sidebar-logo-badge">
              <Atom size={22} className="spin-slow" />
            </div>
            {isSidebarOpen && (
              <div className="sidebar-brand-text">
                <span className="brand-title">SAMBHAV</span>
                <span className="brand-tagline">Quantum Learning</span>
              </div>
            )}
          </Link>
          <button
            className="sidebar-toggle-btn"
            onClick={handleToggleSidebar}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Static Role Badge */}
        {isSidebarOpen && (
          <div className="sidebar-role-selector">
            <div className="role-selector-card">
              <div className="role-current-info">
                <span className="role-label">Workspace Role</span>
                <span className={`role-badge ${isInstructor ? "badge-instructor" : "badge-student"}`}>
                  {isInstructor ? <GraduationCap size={13} /> : <Zap size={13} />}
                  {isInstructor ? "Instructor / Educator" : "Student Learner"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Nav Links */}
        <nav className="sidebar-nav" aria-label="Portal Navigation">
          {isSidebarOpen && (
            <div className="nav-section-title">
              {isInstructor ? "TEACHING" : "LEARNING"}
            </div>
          )}
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/instructor" && item.to !== "/dashboard" && location.pathname.startsWith(item.to));

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-nav-item ${isActive ? "item-active" : ""} ${item.highlight ? "item-highlight" : ""}`}
                title={item.label}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon size={19} className="nav-item-icon" />
                {isSidebarOpen && <span className="nav-item-label">{item.label}</span>}
                {isSidebarOpen && item.badge && <span className="nav-item-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Clickable User Profile Footer - Navigates to /profile */}
        {user && (
          <div className="sidebar-user-footer">
            <button
              type="button"
              className={`user-profile-summary-btn ${location.pathname === "/profile" ? "active-profile" : ""}`}
              onClick={() => {
                setIsMobileOpen(false);
                navigate("/profile");
              }}
              title="Click to view & edit your User Profile"
              aria-label="User Profile"
            >
              <div className="user-avatar-circle" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              {isSidebarOpen && (
                <div className="user-details">
                  <div className="user-name-row">
                    <span className="user-name">{user.name}</span>
                    <span className="user-profile-hint">Profile</span>
                  </div>
                  <div className="user-stats-row">
                    <span className="user-level">
                      {isInstructor ? "Educator" : `Lvl ${user.level || 1}`}
                    </span>
                    {!isInstructor && (
                      <span className="user-streak">
                        <Flame size={12} className="text-orange" /> {user.streakDays || 0}d
                      </span>
                    )}
                  </div>
                </div>
              )}
            </button>
            <button
              className="user-logout-btn"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="app-main-layout">
        {/* Top Header */}
        <header className="app-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Open navigation menu"
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="topbar-breadcrumbs">
              <span className="breadcrumb-cat">{activeCategory || (isInstructor ? "Teaching" : "Learning")}</span>
              <ChevronRight size={14} className="breadcrumb-sep" />
              <h1 className="topbar-page-title">{activeTitle || (isInstructor ? "Instructor Dashboard" : "Dashboard")}</h1>
            </div>
          </div>

          <div className="topbar-right-actions">
            {/* Quick search input */}
            <div className="topbar-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={isInstructor ? "Search classes, learners, quizzes..." : "Search lessons, algorithms, gates..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    if (isInstructor) {
                      navigate(`/instructor/curriculum?q=${encodeURIComponent(searchQuery.trim())}`);
                    } else {
                      navigate(`/learn?q=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }
                }}
              />
            </div>

            {/* Dark / Light Theme Toggle Switch */}
            <button
              type="button"
              className="topbar-theme-toggle"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun size={18} className="theme-icon sun-icon" />
              ) : (
                <Moon size={18} className="theme-icon moon-icon" />
              )}
            </button>

            {/* User Profile Quick Avatar Button */}
            {user && (
              <button
                type="button"
                className={`topbar-profile-btn ${location.pathname === "/profile" ? "active" : ""}`}
                onClick={() => navigate("/profile")}
                title={`Logged in as ${user.name} (View Profile)`}
                aria-label="View user profile"
              >
                <div className="topbar-avatar-circle">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>
            )}
          </div>
        </header>

        {/* Page Content Body (Only this area scrolls up and down) */}
        <main className="app-content-view">
          {children}
        </main>
      </div>
    </div>
  );
}

