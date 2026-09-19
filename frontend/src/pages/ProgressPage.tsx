import {
  AlertTriangle,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  Layers,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { fetchProgress, getCompletedLessonsCache } from "../api/client";

import { UNIFIED_CURRICULUM_MODULES } from "../data/lessonsData";

export function ProgressPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress()
      .then((data) => {
        setProgress(data);
      })
      .catch((err) => {
        console.error("Failed to load user progress:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalLessons = UNIFIED_CURRICULUM_MODULES.reduce((sum, m) => sum + m.lessons.length, 0); // 31
  const cachedCompleted = getCompletedLessonsCache().size;
  const completedLessons = Math.max(progress?.completedLessons ?? 0, cachedCompleted);
  const simulationsRun = progress?.simulationsRun ?? 0;
  const challengesSolved = progress?.challengesSolved ?? 0;
  const avgScore = progress?.averageScore ?? 0;

  // Genuine XP calculation: 100 XP per lesson, 150 per challenge, 20 per simulation
  const xp = progress?.xp ?? (completedLessons * 100 + challengesSolved * 150 + simulationsRun * 20);
  const streak = progress?.streakDays ?? (completedLessons > 0 || simulationsRun > 0 || challengesSolved > 0 ? 1 : 0);
  const level = progress?.level ?? Math.max(1, Math.floor(xp / 500) + 1);

  // Level Progression XP calculation (500 XP per level)
  const currentLevelBaseXP = (level - 1) * 500;
  const nextLevelXP = level * 500;
  const levelProgressPct = Math.min(100, Math.max(0, Math.round(((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100)));

  // Calculate total time invested from recorded progress sessions
  const records = progress?.records || [];
  const totalSeconds = records.reduce((sum: number, r: any) => sum + (r.time_spent_seconds || 120), completedLessons * 180);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  const badges = [
    {
      id: "b1",
      title: "First Circuit Run",
      desc: "Execute your first statevector simulation in Quantum Lab",
      icon: Zap,
      unlocked: simulationsRun >= 1,
      condition: `${Math.min(1, simulationsRun)}/1 Simulated`,
    },
    {
      id: "b2",
      title: "Superposition Explorer",
      desc: "Successfully complete at least 2 foundational curriculum lessons",
      icon: Sparkles,
      unlocked: completedLessons >= 2,
      condition: `${Math.min(2, completedLessons)}/2 Lessons`,
    },
    {
      id: "b3",
      title: "Consistent Explorer",
      desc: "Maintain an active 3-day learning streak",
      icon: Flame,
      unlocked: streak >= 3,
      condition: `${Math.min(3, streak)}/3 Days`,
    },
    {
      id: "b4",
      title: "Entanglement Pioneer",
      desc: "Complete Bell State and multi-qubit curriculum (5+ lessons)",
      icon: BrainCircuit,
      unlocked: completedLessons >= 5,
      condition: `${Math.min(5, completedLessons)}/5 Lessons`,
    },
    {
      id: "b5",
      title: "Challenge Champion",
      desc: "Solve at least 3 algorithmic quantum challenges",
      icon: Award,
      unlocked: challengesSolved >= 3,
      condition: `${Math.min(3, challengesSolved)}/3 Solved`,
    },
    {
      id: "b6",
      title: "Quantum Master",
      desc: `Complete all ${totalLessons} canonical curriculum lessons`,
      icon: Trophy,
      unlocked: completedLessons >= totalLessons && totalLessons > 0,
      condition: `${completedLessons}/${totalLessons} Completed`,
    },
  ];

  const skillBreakdown = [
    {
      name: "Mathematical Foundations (Module 0)",
      level: completedLessons >= 2 ? "Proficient" : completedLessons >= 1 ? "Learning" : "Not Started",
      score: Math.min(100, completedLessons >= 2 ? 100 : completedLessons >= 1 ? 50 : 0),
      color: "bg-teal",
    },
    {
      name: "Single-Qubit Gates & Superposition (Module 1)",
      level: completedLessons >= 5 ? "Proficient" : completedLessons >= 3 ? "Intermediate" : completedLessons >= 1 ? "Learning" : "Not Started",
      score: Math.min(100, Math.max(0, completedLessons * 25)),
      color: "bg-blue",
    },
    {
      name: "Entanglement & Quantum Circuits (Module 2)",
      level: completedLessons >= 8 ? "Proficient" : completedLessons >= 5 ? "Intermediate" : "Not Started",
      score: Math.min(100, Math.max(0, (completedLessons - 2) * 20)),
      color: "bg-amber",
    },
    {
      name: "Quantum Algorithms (Module 4)",
      level: challengesSolved >= 2 || completedLessons >= 12 ? "Proficient" : challengesSolved >= 1 ? "Exploring" : "Not Started",
      score: Math.min(100, Math.max(challengesSolved * 35, (completedLessons - 5) * 15)),
      color: "bg-purple",
    },
  ];

  const weakConcepts = progress?.weakConcepts || [];

  const isInstructor = user?.role === "instructor";

  return (
    <AppShell activeTitle={isInstructor ? "Teaching & Curriculum Overview" : "My Progress & Analytics"} activeCategory={isInstructor ? "Teaching" : "Analytics"}>
      <div className="progress-page-container">
        {/* Top Hero Banner */}
        {isInstructor ? (
          <div className="progress-hero-banner">
            <div className="hero-level-info">
              <div className="level-badge-large" style={{ background: "rgba(245, 158, 11, 0.2)", borderColor: "#f59e0b" }}>
                <GraduationCap size={28} style={{ color: "#f59e0b" }} />
              </div>
              <div className="level-details">
                <h3>Educator Curriculum & Teaching Track</h3>
                <p>10 Canonical Quantum Modules • Interactive Laboratory Assignments • Cohort Assessments</p>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                  <span className="badge-pill" style={{ background: "rgba(2, 132, 199, 0.15)", color: "var(--accent-cyan)", border: "1px solid var(--accent-cyan)" }}>
                    {totalLessons} Canonical Lessons
                  </span>
                  <span className="badge-pill" style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--accent-green)", border: "1px solid var(--accent-green)" }}>
                    Interactive Lab IDE
                  </span>
                  <span className="badge-pill" style={{ background: "rgba(168, 85, 247, 0.15)", color: "var(--accent-purple)", border: "1px solid var(--accent-purple)" }}>
                    AI Copilot Drafts
                  </span>
                </div>
              </div>
            </div>

            <div className="hero-streak-card">
              <BookOpen size={28} className="text-teal" />
              <div className="streak-meta">
                <strong>10 Modules</strong>
                <span>Curriculum Depth</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="progress-hero-banner">
            <div className="hero-level-info">
              <div className="level-badge-large">
                <span className="lvl-num">{level}</span>
                <span className="lvl-tag">Level</span>
              </div>
              <div className="level-details">
                <h3>Quantum Pioneer (Level {level})</h3>
                <p>{xp} XP earned • {Math.max(0, nextLevelXP - xp)} XP to Level {level + 1}</p>
                <div className="xp-progress-bar">
                  <div className="fill" style={{ width: `${levelProgressPct}%` }} />
                </div>
              </div>
            </div>

            <div className="hero-streak-card">
              <Flame size={28} className="text-orange" />
              <div className="streak-meta">
                <strong>{streak} Days</strong>
                <span>Current Streak</span>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Split: Skills & Overview */}
        <div className="progress-split-grid">
          {/* Left Column: Skill Mastery */}
          <div className="skills-column">
            <div className="progress-section-card">
              <div className="card-header">
                <Target size={18} className="text-teal" />
                <h4>{isInstructor ? "Curriculum Framework Modules" : "Skill Mastery Breakdown"}</h4>
              </div>
              <div className="skills-list">
                {skillBreakdown.map((s) => (
                  <div key={s.name} className="skill-item">
                    <div className="skill-header">
                      <span className="skill-name">{s.name}</span>
                      <span className={`skill-status-tag ${s.level.toLowerCase().replace(/\s/g, "-")}`}>
                        {isInstructor ? "Standard Core" : `${s.level} (${s.score}%)`}
                      </span>
                    </div>
                    <div className="skill-bar-track">
                      <div className={`skill-bar-fill ${s.color}`} style={{ width: isInstructor ? "100%" : `${s.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Focus Area / Guidance */}
              <div className="weak-concept-alert" style={{ borderColor: "rgba(2, 132, 199, 0.3)", background: "rgba(2, 132, 199, 0.05)" }}>
                <Sparkles size={18} className="text-teal" />
                <div className="alert-text">
                  <h5 style={{ color: "var(--accent-cyan)" }}>{isInstructor ? "Pedagogical Structure" : "Skill Readiness Track"}</h5>
                  <p>
                    {isInstructor
                      ? "Each module blends rigorous mathematical formulations, circuit experiments, Dirac notation derivations, and interactive quizzes."
                      : completedLessons === 0
                      ? "Begin your foundational learning path in Quantum Foundations to unlock skill mastery metrics."
                      : "Great work! Continue progressing through multi-qubit algorithm modules and daily challenges."}
                  </p>
                </div>
              </div>
            </div>

            {/* Learning / Teaching Stats */}
            <div className="progress-section-card">
              <div className="card-header">
                <Clock size={18} className="text-blue" />
                <h4>{isInstructor ? "Teaching & Laboratory Scope" : "Learning Statistics"}</h4>
              </div>
              <div className="stats-2x2-grid">
                <div className="stat-box">
                  <span className="num">{totalLessons}</span>
                  <span className="lbl">{isInstructor ? "Total Lessons" : "Lessons Finished"}</span>
                </div>
                <div className="stat-box">
                  <span className="num">10</span>
                  <span className="lbl">Core Modules</span>
                </div>
                <div className="stat-box">
                  <span className="num">3</span>
                  <span className="lbl">Sim Backends</span>
                </div>
                <div className="stat-box">
                  <span className="num">Qiskit</span>
                  <span className="lbl">Code Integration</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Educator Quick Access OR Student Badges */}
          <div className="badges-column">
            {isInstructor ? (
              <div className="progress-section-card">
                <div className="card-header">
                  <GraduationCap size={18} className="text-amber" />
                  <h4>Educator Workflows</h4>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                  <div style={{ padding: "16px", background: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                    <h5 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "var(--text-primary)" }}>Curriculum & Authoring</h5>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      Draft customized lessons, specify starter circuits, configure multiple choice questions, and publish to your cohorts.
                    </p>
                  </div>

                  <div style={{ padding: "16px", background: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                    <h5 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "var(--text-primary)" }}>AI Educator Copilot</h5>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      Generate comprehensive lesson plans, quiz question banks, and lab exercises with server-side Gemini.
                    </p>
                  </div>

                  <div style={{ padding: "16px", background: "var(--bg-subtle)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                    <h5 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "var(--text-primary)" }}>Classes & Cohort Management</h5>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      Track learner performance, review laboratory experiment submissions, and identify at-risk learners.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="progress-section-card">
                <div className="card-header">
                  <Award size={18} className="text-amber" />
                  <h4>Achievement Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})</h4>
                </div>

                <div className="badges-full-grid">
                  {badges.map((b) => {
                    const Icon = b.icon;
                    return (
                      <div key={b.id} className={`badge-card-full ${b.unlocked ? "unlocked" : "locked"}`}>
                        <div className="badge-icon-wrap">
                          <Icon size={24} className={b.unlocked ? "text-teal" : "text-muted"} />
                        </div>
                        <div className="badge-info">
                          <h5>{b.title}</h5>
                          <p>{b.desc}</p>
                          {b.unlocked ? (
                            <span className="unlock-date">✓ Unlocked</span>
                          ) : (
                            <span className="locked-text">🔒 {b.condition || "Locked"}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
