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
import { fetchProgress, getCompletedLessonsCache } from "../api/client";

import { UNIFIED_CURRICULUM_MODULES } from "../data/lessonsData";

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

  const allLessons = UNIFIED_CURRICULUM_MODULES.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title }))
  );
  const totalLessons = allLessons.length; // 31

  const completedSet = new Set<string>();
  if (progress?.records && Array.isArray(progress.records)) {
    progress.records.forEach((r: any) => {
      if (r.status === "completed" && r.lesson_id) completedSet.add(r.lesson_id);
    });
  }
  getCompletedLessonsCache().forEach((id) => completedSet.add(id));
  const completedLessons = Math.max(progress?.completedLessons ?? 0, completedSet.size);

  const userName = user?.name || "Quantum Explorer";
  const simulationsRun = progress?.simulationsRun ?? 0;
  const challengesSolved = progress?.challengesSolved ?? 0;
  const avgScore = progress?.averageScore ?? 0;

  const userXP = progress?.xp ?? (completedLessons * 100 + challengesSolved * 150 + simulationsRun * 20);
  const userStreak = progress?.streakDays ?? (completedLessons > 0 || simulationsRun > 0 || challengesSolved > 0 ? 1 : 0);
  const userLevel = progress?.level ?? Math.max(1, Math.floor(userXP / 500) + 1);

  const lessonPct = Math.min(100, Math.round((completedLessons / totalLessons) * 100));
  const totalChallenges = 8;
  const challengePct = Math.min(100, Math.round((challengesSolved / totalChallenges) * 100));

  const nextUncompletedLesson = allLessons.find((l) => !completedSet.has(l.id)) || allLessons[0];
  const rec = {
    title: `${nextUncompletedLesson.moduleTitle}: ${nextUncompletedLesson.title}`,
    to: `/learn/${nextUncompletedLesson.moduleId}/${nextUncompletedLesson.id}`,
    reason: completedLessons === 0
      ? "Start your quantum journey by mastering mathematical foundations, vectors, and complex amplitudes."
      : "Continue progressing step-by-step through your canonical quantum curriculum.",
    action: completedLessons === 0 ? "Start Lesson 0.1" : "Continue Learning",
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
                <div className={`badge-item ${simulationsRun >= 1 ? "" : "locked"}`} title="First Circuit Run (Simulate in Quantum Lab)">
                  <div className={`badge-icon-circle ${simulationsRun >= 1 ? "active" : ""}`}>
                    <Zap size={20} className={simulationsRun >= 1 ? "text-teal" : "text-muted"} />
                  </div>
                  <span>First Circuit</span>
                </div>

                <div className={`badge-item ${completedLessons >= 2 ? "" : "locked"}`} title="Superposition Explorer (Complete 2 Lessons)">
                  <div className={`badge-icon-circle ${completedLessons >= 2 ? "active" : ""}`}>
                    <Atom size={20} className={completedLessons >= 2 ? "text-amber" : "text-muted"} />
                  </div>
                  <span>Superposition</span>
                </div>

                <div className={`badge-item ${userStreak >= 3 ? "" : "locked"}`} title="Consistent Learner (3-Day Streak)">
                  <div className={`badge-icon-circle ${userStreak >= 3 ? "active" : ""}`}>
                    <Flame size={20} className={userStreak >= 3 ? "text-orange" : "text-muted"} />
                  </div>
                  <span>3d Streak</span>
                </div>

                <div className={`badge-item ${completedLessons >= 5 ? "" : "locked"}`} title="Entanglement Pioneer (Complete 5 Lessons)">
                  <div className={`badge-icon-circle ${completedLessons >= 5 ? "active" : ""}`}>
                    <BrainCircuit size={20} className={completedLessons >= 5 ? "text-teal" : "text-muted"} />
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
