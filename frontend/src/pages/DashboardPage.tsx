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
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "../router/Router";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { fetchProgress } from "../api/client";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [progress, setProgress] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    fetchProgress()
      .then((data) => {
        setProgress(data);
      })
      .catch((err) => {
        console.error("Failed to load progress:", err);
      })
      .finally(() => {
        setLoadingProgress(false);
      });
  }, []);

  const userName = user?.name || "Quantum Explorer";
  const userXP = progress?.xp ?? user?.xp ?? 0;
  const userStreak = progress?.streakDays ?? user?.streakDays ?? 0;
  const userLevel = progress?.level ?? user?.level ?? 1;

  const completedLessons = progress?.completedLessons ?? 0;
  const totalLessons = 12;
  const lessonPct = Math.min(100, Math.round((completedLessons / totalLessons) * 100));

  const challengesSolved = progress?.challengesSolved ?? 0;
  const totalChallenges = 8;
  const challengePct = Math.min(100, Math.round((challengesSolved / totalChallenges) * 100));

  const simulationsRun = progress?.simulationsRun ?? 0;
  const avgScore = progress?.averageScore ?? 0;

  const rec = progress?.recommendations?.[0] || {
    title: "Quantum Foundations: 1.1 The Qubit & Bloch Sphere",
    to: "/learn/quantum-foundations/qubit-basics",
    reason: "Start your quantum journey by mastering single-qubit superpositions and Bloch sphere states.",
    action: "Start Lesson 1.1",
  };

  const hasActivity = completedLessons > 0 || simulationsRun > 0 || challengesSolved > 0;

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
              <span className="metric-number">{lessonPct}%</span>
              <span className="metric-sub">{completedLessons} of {totalLessons} Lessons</span>
            </div>
            <div className="metric-progress-bar">
              <div className="bar-fill" style={{ width: `${lessonPct}%` }} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Challenges Solved</span>
              <Trophy size={18} className="text-amber" />
            </div>
            <div className="metric-value-row">
              <span className="metric-number">{challengesSolved} / {totalChallenges}</span>
              <span className="metric-sub">+{challengesSolved * 150} XP Earned</span>
            </div>
            <div className="metric-progress-bar">
              <div className="bar-fill bg-amber" style={{ width: `${challengePct}%` }} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Lab Simulations</span>
              <BrainCircuit size={18} className="text-blue" />
            </div>
            <div className="metric-value-row">
              <span className="metric-number">{simulationsRun}</span>
              <span className="metric-sub">{simulationsRun > 0 ? "Pure Statevectors" : "No runs yet"}</span>
            </div>
            <div className="metric-progress-bar">
              <div className="bar-fill bg-blue" style={{ width: `${Math.min(100, simulationsRun * 10)}%` }} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Mastery Accuracy</span>
              <Target size={18} className="text-purple" />
            </div>
            <div className="metric-value-row">
              <span className="metric-number">{avgScore > 0 ? `${avgScore}%` : "—"}</span>
              <span className="metric-sub">{avgScore > 0 ? "Assessment Score Avg" : "No assessments yet"}</span>
            </div>
            <div className="metric-progress-bar">
              <div className="bar-fill bg-purple" style={{ width: `${avgScore}%` }} />
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
                <span>{completedLessons > 0 ? "RECOMMENDED NEXT" : "GET STARTED"}</span>
                <span className="course-tag">Quantum Foundations</span>
              </div>
              <h3>{rec.title}</h3>
              <p>{rec.reason}</p>
              <div className="resume-lesson-footer">
                <div className="lesson-time-est">
                  <Clock size={15} /> 15 mins
                </div>
                <Link to={rec.to || "/learn/quantum-foundations/qubit-basics"} className="resume-btn-glow">
                  <Play size={16} /> {rec.action || "Start Learning"}
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
                {hasActivity ? (
                  <>
                    {simulationsRun > 0 && (
                      <div className="timeline-item">
                        <div className="timeline-icon-dot bg-teal" />
                        <div className="timeline-content">
                          <span className="timeline-action">Executed Quantum Simulation</span>
                          <span className="timeline-meta">{simulationsRun} circuit{simulationsRun > 1 ? "s" : ""} computed with pure statevector math</span>
                        </div>
                      </div>
                    )}
                    {challengesSolved > 0 && (
                      <div className="timeline-item">
                        <div className="timeline-icon-dot bg-amber" />
                        <div className="timeline-content">
                          <span className="timeline-action">Completed Challenge Assessment</span>
                          <span className="timeline-meta">Average score: {avgScore}% (+{challengesSolved * 150} XP)</span>
                        </div>
                      </div>
                    )}
                    {completedLessons > 0 && (
                      <div className="timeline-item">
                        <div className="timeline-icon-dot bg-blue" />
                        <div className="timeline-content">
                          <span className="timeline-action">Completed {completedLessons} Curriculum Lesson{completedLessons > 1 ? "s" : ""}</span>
                          <span className="timeline-meta">Quantum Foundations & Algorithms</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="timeline-item" style={{ opacity: 0.8 }}>
                    <div className="timeline-icon-dot bg-teal" />
                    <div className="timeline-content">
                      <span className="timeline-action">No learning activity recorded yet</span>
                      <span className="timeline-meta">Complete your first lesson or simulate a circuit in the Quantum Lab to start your journey!</span>
                    </div>
                  </div>
                )}
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
              <h4>{rec.title}</h4>
              <p>{rec.reason}</p>
              <Link to={rec.to || "/learn/quantum-foundations/qubit-basics"} className="rec-action-btn">
                {rec.action || "Start Learning"} <ArrowRight size={14} />
              </Link>
            </div>

            {/* Achievement Badges Showcase */}
            <div className="badges-showcase-card">
              <div className="badges-header">
                <Award size={18} className="text-teal" />
                <h4>Unlocked Badges</h4>
              </div>
              <div className="badges-grid">
                <div className={`badge-item ${simulationsRun > 0 ? "" : "locked"}`} title="First Circuit Run">
                  <div className={`badge-icon-circle ${simulationsRun > 0 ? "active" : ""}`}>
                    <Zap size={20} className={simulationsRun > 0 ? "text-teal" : "text-muted"} />
                  </div>
                  <span>First Circuit</span>
                </div>

                <div className={`badge-item ${completedLessons >= 2 ? "" : "locked"}`} title="Superposition Master">
                  <div className={`badge-icon-circle ${completedLessons >= 2 ? "active" : ""}`}>
                    <Atom size={20} className={completedLessons >= 2 ? "text-amber" : "text-muted"} />
                  </div>
                  <span>Hadamard Star</span>
                </div>

                <div className={`badge-item ${userStreak >= 4 ? "" : "locked"}`} title="4-Day Streak">
                  <div className={`badge-icon-circle ${userStreak >= 4 ? "active" : ""}`}>
                    <Flame size={20} className={userStreak >= 4 ? "text-orange" : "text-muted"} />
                  </div>
                  <span>4d Streak</span>
                </div>

                <div className={`badge-item ${completedLessons >= 4 ? "" : "locked"}`} title="Complete Entanglement Course">
                  <div className={`badge-icon-circle ${completedLessons >= 4 ? "active" : ""}`}>
                    <BrainCircuit size={20} className={completedLessons >= 4 ? "text-teal" : "text-muted"} />
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
