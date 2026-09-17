import {
  AlertTriangle,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Flame,
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

  return (
    <AppShell activeTitle="My Progress & Analytics" activeCategory="Analytics">
      <div className="progress-page-container">
        {/* Top XP & Level Banner */}
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

        {/* 2-Column Split: Skills & Badges */}
        <div className="progress-split-grid">
          {/* Left Column: Skill Mastery & Weak Concepts */}
          <div className="skills-column">
            <div className="progress-section-card">
              <div className="card-header">
                <Target size={18} className="text-teal" />
                <h4>Skill Mastery Breakdown</h4>
              </div>
              <div className="skills-list">
                {skillBreakdown.map((s) => (
                  <div key={s.name} className="skill-item">
                    <div className="skill-header">
                      <span className="skill-name">{s.name}</span>
                      <span className={`skill-status-tag ${s.level.toLowerCase().replace(/\s/g, "-")}`}>
                        {s.level} ({s.score}%)
                      </span>
                    </div>
                    <div className="skill-bar-track">
                      <div className={`skill-bar-fill ${s.color}`} style={{ width: `${s.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Weak Concept Alert & Recommendation if any */}
              {weakConcepts.length > 0 ? (
                <div className="weak-concept-alert">
                  <AlertTriangle size={18} className="text-amber" />
                  <div className="alert-text">
                    <h5>Focus Area: {weakConcepts[0]}</h5>
                    <p>
                      Based on your recent assessment submissions, targeted practice in gate ordering and relative phases will strengthen your foundations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="weak-concept-alert" style={{ borderColor: "rgba(20, 184, 166, 0.3)", background: "rgba(20, 184, 166, 0.05)" }}>
                  <Sparkles size={18} className="text-teal" />
                  <div className="alert-text">
                    <h5 style={{ color: "#2dd4bf" }}>Skill Readiness Track</h5>
                    <p>
                      {completedLessons === 0
                        ? "Begin your foundational learning path in Quantum Foundations to unlock skill mastery metrics."
                        : "Great work! Continue progressing through multi-qubit algorithm modules and daily challenges."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Learning Hours & Stats */}
            <div className="progress-section-card">
              <div className="card-header">
                <Clock size={18} className="text-blue" />
                <h4>Learning Statistics</h4>
              </div>
              <div className="stats-2x2-grid">
                <div className="stat-box">
                  <span className="num">{totalHours}h</span>
                  <span className="lbl">Time Invested</span>
                </div>
                <div className="stat-box">
                  <span className="num">{simulationsRun}</span>
                  <span className="lbl">Circuits Simulated</span>
                </div>
                <div className="stat-box">
                  <span className="num">{completedLessons}/{totalLessons}</span>
                  <span className="lbl">Lessons Finished</span>
                </div>
                <div className="stat-box">
                  <span className="num">{avgScore > 0 ? `${avgScore}%` : "—"}</span>
                  <span className="lbl">Average Quiz Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Achievements & Badges */}
          <div className="badges-column">
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
