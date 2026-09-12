import {
  Atom,
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  ChevronRight,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "../../router/Router";
import { useAuth } from "../../context/AuthContext";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isInstructor = user?.role === "instructor";

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
    { label: "Classroom Dashboard", to: "/instructor", icon: LayoutDashboard },
    { label: "Student Roster", to: "/instructor/students", icon: Users },
    { label: "Curriculum Manager", to: "/instructor/courses", icon: BookOpen },
    { label: "Quantum Lab", to: "/lab", icon: BrainCircuit },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

  const currentNavItems = isInstructor ? navItemsInstructor : navItemsStudent;

  return (
    <div className={`app-container ${isSidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${isMobileOpen ? "mobile-open" : ""}`} aria-label="Sidebar Navigation">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <div className="sidebar-logo-badge">
              <Atom size={24} className="spin-slow" />
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
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar width"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Static Immutable Role Badge */}
        {isSidebarOpen && (
          <div className="sidebar-role-selector">
            <div className="role-selector-card">
              <div className="role-current-info">
                <span className="role-label">Authenticated Role</span>
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
          <div className="nav-section-title">{isSidebarOpen ? (isInstructor ? "TEACHING" : "LEARNING") : "•"}</div>
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-nav-item ${isActive ? "item-active" : ""} ${item.highlight ? "item-highlight" : ""}`}
                title={!isSidebarOpen ? item.label : undefined}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon size={19} className="nav-item-icon" />
                {isSidebarOpen && <span className="nav-item-label">{item.label}</span>}
                {isSidebarOpen && item.badge && <span className="nav-item-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        {user && (
          <div className="sidebar-user-footer">
            <div className="user-profile-summary">
              <div className="user-avatar-circle">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {isSidebarOpen && (
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <div className="user-stats-row">
                    <span className="user-level">Lvl {user.level}</span>
                    <span className="user-streak">
                      <Flame size={12} className="text-orange" /> {user.streakDays}d
                    </span>
                  </div>
                </div>
              )}
            </div>
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
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Open navigation menu"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="topbar-breadcrumbs">
            {activeCategory && <span className="breadcrumb-cat">{activeCategory}</span>}
            {activeCategory && <ChevronRight size={14} className="breadcrumb-sep" />}
            <h1 className="topbar-page-title">{activeTitle || "Dashboard"}</h1>
          </div>

          <div className="topbar-right-actions">
            {/* Quick search input */}
            <div className="topbar-search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search lessons, algorithms, gates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    navigate(`/learn?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
              />
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="app-content-view">
          {children}
        </main>
      </div>
    </div>
  );
}
