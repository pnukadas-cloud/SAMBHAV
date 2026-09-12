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
import { fetchProgress } from "../api/client";

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

  const xp = progress?.xp ?? user?.xp ?? 0;
  const streak = progress?.streakDays ?? user?.streakDays ?? 0;
  const level = progress?.level ?? user?.level ?? 1;
  const completedLessons = progress?.completedLessons ?? 0;
  const simulationsRun = progress?.simulationsRun ?? 0;
  const challengesSolved = progress?.challengesSolved ?? 0;
  const avgScore = progress?.averageScore ?? 0;

  // Level Progression XP calculation (500 XP per level)
  const currentLevelBaseXP = (level - 1) * 500;
  const nextLevelXP = level * 500;
  const levelProgressPct = Math.min(100, Math.max(0, Math.round(((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100)));

  // Calculate total time invested from recorded progress sessions
  const records = progress?.records || [];
  const totalSeconds = records.reduce((sum: number, r: any) => sum + (r.time_spent_seconds || 120), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  const badges = [
    {
      id: "b1",
      title: "First Circuit Run",
      desc: "Executed your first statevector simulation",
      icon: Zap,
      unlocked: simulationsRun > 0,
      date: "Active",
    },
    {
      id: "b2",
      title: "Superposition Master",
      desc: "Successfully finished 2 quantum foundation lessons",
      icon: Sparkles,
      unlocked: completedLessons >= 2,
      date: "Earned",
    },
    {
      id: "b3",
      title: "Consistent Explorer",
      desc: "Maintained an active 4-day learning streak",
      icon: Flame,
      unlocked: streak >= 4,
      date: "Active",
    },
    {
      id: "b4",
      title: "Entanglement Pioneer",
      desc: "Completed Bell State and multi-qubit curriculum",
      icon: BrainCircuit,
      unlocked: completedLessons >= 4,
      date: "Earned",
    },
    {
      id: "b5",
      title: "Challenge Champion",
      desc: "Solved at least 3 algorithmic challenges",
      icon: Award,
      unlocked: challengesSolved >= 3,
      date: "Earned",
    },
    {
      id: "b6",
      title: "Quantum Master",
      desc: "Complete all 12 foundational lessons",
      icon: Trophy,
      unlocked: completedLessons >= 12,
    },
  ];

  const skillBreakdown = [
    {
      name: "Single-Qubit Gates (Pauli, H)",
      level: completedLessons >= 2 ? "Proficient" : completedLessons >= 1 ? "Learning" : "Not Started",
      score: Math.min(100, completedLessons * 30),
      color: "bg-teal",
    },
    {
      name: "Entanglement & Multi-Qubit Operations",
      level: completedLessons >= 4 ? "Proficient" : completedLessons >= 2 ? "Intermediate" : "Not Started",
      score: Math.min(100, Math.max(0, (completedLessons - 1) * 25)),
      color: "bg-blue",
    },
    {
      name: "Quantum Phase & Kickback",
      level: completedLessons >= 6 ? "Proficient" : completedLessons >= 3 ? "In Progress" : "Not Started",
      score: Math.min(100, Math.max(0, (completedLessons - 2) * 20)),
      color: "bg-amber",
    },
    {
      name: "Quantum Algorithms (Grover, DJ)",
      level: challengesSolved >= 2 ? "Proficient" : challengesSolved >= 1 ? "Exploring" : "Not Started",
      score: Math.min(100, challengesSolved * 35),
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
                  <span className="num">{completedLessons}/12</span>
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
                        {b.unlocked && <span className="unlock-date">Unlocked</span>}
                        {!b.unlocked && <span className="locked-text">Locked</span>}
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
