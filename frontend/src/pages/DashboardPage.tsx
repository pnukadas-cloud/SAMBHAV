import {
  ArrowRight,
  Atom,
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import React from "react";
import { Link, useNavigate } from "../router/Router";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userName = user?.name || "Quantum Explorer";
  const userXP = user?.xp || 480;
  const userStreak = user?.streakDays || 4;
  const userLevel = user?.level || 3;

  return (
    <AppShell activeTitle="Student Dashboard" activeCategory="Home">
      <div className="dashboard-page-container">
        {/* Welcome Greeting Banner */}
        <section className="dashboard-welcome-banner">
          <div className="welcome-text-col">
            <div className="welcome-badge">
              <Sparkles size={14} className="text-amber" />
              <span>Level {userLevel} Quantum Pioneer</span>
            </div>
            <h2>Welcome back, {userName}! 👋</h2>
            <p>
              Continue exploring quantum mechanics and multi-qubit algorithms. Your AI tutor is ready to assist.
            </p>
          </div>

          <div className="welcome-stats-col">
            <div className="stat-pill-box">
              <Flame size={20} className="text-orange" />
              <div className="stat-meta">
                <span className="stat-val">{userStreak} Days</span>
                <span className="stat-lbl">Active Streak</span>
              </div>
            </div>

            <div className="stat-pill-box">
              <Trophy size={20} className="text-amber" />
              <div className="stat-meta">
                <span className="stat-val">{userXP} XP</span>
                <span className="stat-lbl">Earned Points</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Metric Summary Cards */}
        <div className="metrics-summary-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Curriculum Progress</span>
              <BookOpen size={18} className="text-teal" />
            </div>
            <div className="metric-value-row">
              <span className="metric-number">42%</span>
              <span className="metric-sub">4 of 12 Lessons</span>
            </div>
            <div className="metric-progress-bar">
              <div className="bar-fill" style={{ width: "42%" }} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Challenges Solved</span>
              <Trophy size={18} className="text-amber" />
            </div>
            <div className="metric-value-row">
              <span className="metric-number">3 / 8</span>
              <span className="metric-sub">+150 XP Earned</span>
            </div>
            <div className="metric-progress-bar">
              <div className="bar-fill bg-amber" style={{ width: "37.5%" }} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Lab Simulations</span>
              <BrainCircuit size={18} className="text-blue" />
            </div>
            <div className="metric-value-row">
              <span className="metric-number">18</span>
              <span className="metric-sub">Pure Statevectors</span>
            </div>
            <div className="metric-progress-bar">
              <div className="bar-fill bg-blue" style={{ width: "65%" }} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Mastery Accuracy</span>
              <Target size={18} className="text-purple" />
            </div>
            <div className="metric-value-row">
              <span className="metric-number">88%</span>
              <span className="metric-sub">Quiz Score Avg</span>
            </div>
            <div className="metric-progress-bar">
              <div className="bar-fill bg-purple" style={{ width: "88%" }} />
            </div>
          </div>
        </div>

        {/* Main Dashboard Layout: Left Action Column, Right AI & Activity */}
        <div className="dashboard-content-split">
          {/* Left Column */}
          <div className="dashboard-main-col">
            {/* Resume Current Lesson Card */}
            <div className="resume-lesson-card">
              <div className="resume-lesson-badge">
                <span>ACTIVE LESSON</span>
                <span className="course-tag">Quantum Foundations</span>
              </div>
              <h3>Building a Bell State (|Φ⁺⟩)</h3>
              <p>
                Learn how combining the Hadamard (H) gate with Controlled-NOT (CX) creates non-separable quantum correlation.
              </p>
              <div className="resume-lesson-footer">
                <div className="lesson-time-est">
                  <Clock size={15} /> 15 mins remaining
                </div>
                <Link to="/learn/quantum-foundations/bell-state" className="resume-btn-glow">
                  <Play size={16} /> Resume Interactive Lesson
                </Link>
              </div>
            </div>

            {/* Quick Action Shortcuts Grid */}
            <div className="quick-actions-section">
              <h4 className="section-subtitle">Quick Access</h4>
              <div className="quick-actions-grid">
                <div className="quick-action-card" onClick={() => navigate("/lab")}>
                  <div className="action-icon bg-teal-soft">
                    <BrainCircuit size={22} className="text-teal" />
                  </div>
                  <div className="action-text">
                    <h5>Quantum Lab</h5>
                    <p>Open full discrete circuit builder IDE</p>
                  </div>
                  <ArrowRight size={16} className="action-arrow" />
                </div>

                <div className="quick-action-card" onClick={() => navigate("/algorithms")}>
                  <div className="action-icon bg-blue-soft">
                    <Atom size={22} className="text-blue" />
                  </div>
                  <div className="action-text">
                    <h5>Algorithm Library</h5>
                    <p>Explore Bell, GHZ, Grover & Teleportation</p>
                  </div>
                  <ArrowRight size={16} className="action-arrow" />
                </div>

                <div className="quick-action-card" onClick={() => navigate("/challenges")}>
                  <div className="action-icon bg-amber-soft">
                    <Trophy size={22} className="text-amber" />
                  </div>
                  <div className="action-text">
                    <h5>Daily Challenge</h5>
                    <p>Solve circuit puzzles & earn XP</p>
                  </div>
                  <ArrowRight size={16} className="action-arrow" />
                </div>

                <div className="quick-action-card" onClick={() => navigate("/ai-tutor")}>
                  <div className="action-icon bg-purple-soft">
                    <Bot size={22} className="text-purple" />
                  </div>
                  <div className="action-text">
                    <h5>AI Quantum Tutor</h5>
                    <p>Ask questions & debug your circuits</p>
                  </div>
                  <ArrowRight size={16} className="action-arrow" />
                </div>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="recent-activity-section">
              <h4 className="section-subtitle">Recent Learning Activity</h4>
              <div className="activity-timeline-list">
                <div className="timeline-item">
                  <div className="timeline-icon-dot bg-teal" />
                  <div className="timeline-content">
                    <span className="timeline-action">Simulated 2-Qubit Bell Circuit</span>
                    <span className="timeline-meta">Statevector: |ψ⟩ = 0.707|00⟩ + 0.707|11⟩ • 10m ago</span>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-icon-dot bg-amber" />
                  <div className="timeline-content">
                    <span className="timeline-action">Passed Superposition Quiz</span>
                    <span className="timeline-meta">Score: 100% (+50 XP) • 2 hours ago</span>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-icon-dot bg-blue" />
                  <div className="timeline-content">
                    <span className="timeline-action">Completed Lesson: Qubit Wavefunctions</span>
                    <span className="timeline-meta">Quantum Foundations • Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Recommendations & Badges */}
          <div className="dashboard-side-col">
            {/* AI Recommendation Widget */}
            <div className="ai-recommendation-card">
              <div className="rec-header">
                <Sparkles size={16} className="text-amber" />
                <span>AI Personalized Recommendation</span>
              </div>
              <h4>Next Step: Explore Quantum Entanglement</h4>
              <p>
                Based on your completion of Single-Qubit Superposition, you are ready to study two-qubit state non-separability.
              </p>
              <Link to="/learn/quantum-foundations/bell-state" className="rec-action-btn">
                Start Recommended Module <ArrowRight size={14} />
              </Link>
            </div>

            {/* Achievement Badges Showcase */}
            <div className="badges-showcase-card">
              <div className="badges-header">
                <Award size={18} className="text-teal" />
                <h4>Unlocked Badges</h4>
              </div>
              <div className="badges-grid">
                <div className="badge-item" title="First Circuit Run">
                  <div className="badge-icon-circle active">
                    <Zap size={20} className="text-teal" />
                  </div>
                  <span>First Circuit</span>
                </div>

                <div className="badge-item" title="Superposition Master">
                  <div className="badge-icon-circle active">
                    <Atom size={20} className="text-amber" />
                  </div>
                  <span>Hadamard Star</span>
                </div>

                <div className="badge-item" title="4-Day Streak">
                  <div className="badge-icon-circle active">
                    <Flame size={20} className="text-orange" />
                  </div>
                  <span>4d Streak</span>
                </div>

                <div className="badge-item locked" title="Complete Entanglement Course">
                  <div className="badge-icon-circle">
                    <BrainCircuit size={20} className="text-muted" />
                  </div>
                  <span>Entangled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
