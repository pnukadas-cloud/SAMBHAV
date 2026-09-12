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
import React from "react";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";

export function ProgressPage() {
  const { user } = useAuth();

  const xp = user?.xp || 480;
  const streak = user?.streakDays || 4;
  const level = user?.level || 3;
  const nextLevelXP = 750;
  const currentLevelBaseXP = 300;
  const levelProgressPct = Math.round(((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100);

  const badges = [
    { id: "b1", title: "First Circuit Run", desc: "Executed your first statevector simulation", icon: Zap, unlocked: true, date: "3 days ago" },
    { id: "b2", title: "Superposition Master", desc: "Successfully applied Hadamard transformation", icon: Sparkles, unlocked: true, date: "2 days ago" },
    { id: "b3", title: "Consistent Explorer", desc: "Maintained a 4-day learning streak", icon: Flame, unlocked: true, date: "Today" },
    { id: "b4", title: "Entanglement Pioneer", desc: "Constructed standard Bell State |Φ⁺⟩", icon: BrainCircuit, unlocked: true, date: "Yesterday" },
    { id: "b5", title: "Algorithm Architect", desc: "Executed a complete Grover or Teleportation circuit", icon: Award, unlocked: false },
    { id: "b6", title: "Quantum Master", desc: "Complete all 3 foundational courses", icon: Trophy, unlocked: false },
  ];

  const skillBreakdown = [
    { name: "Single-Qubit Gates (Pauli, H)", level: "Proficient", score: 92, color: "bg-teal" },
    { name: "Entanglement & Multi-Qubit Operations", level: "Intermediate", score: 78, color: "bg-blue" },
    { name: "Quantum Phase & Kickback", level: "Needs Practice", score: 54, color: "bg-amber" },
    { name: "Quantum Algorithms (Grover, DJ)", level: "Exploring", score: 35, color: "bg-purple" },
  ];

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
              <h3>Quantum Apprentice (Level {level})</h3>
              <p>{xp} XP earned • {nextLevelXP - xp} XP to Level {level + 1} (Quantum Practitioner)</p>
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

              {/* Weak Concept Alert & Recommendation */}
              <div className="weak-concept-alert">
                <AlertTriangle size={18} className="text-amber" />
                <div className="alert-text">
                  <h5>Focus Area: Quantum Phase & Kickback</h5>
                  <p>
                    Your recent challenge submissions indicate minor confusion regarding how relative phase turns into observable probabilities.
                  </p>
                </div>
              </div>
            </div>

            {/* Learning Hours & Stats */}
            <div className="progress-section-card">
              <div className="card-header">
                <Clock size={18} className="text-blue" />
                <h4>Learning Statistics</h4>
              </div>
              <div className="stats-2x2-grid">
                <div className="stat-box">
                  <span className="num">6.4h</span>
                  <span className="lbl">Total Time Invested</span>
                </div>
                <div className="stat-box">
                  <span className="num">18</span>
                  <span className="lbl">Circuits Simulated</span>
                </div>
                <div className="stat-box">
                  <span className="num">4/12</span>
                  <span className="lbl">Lessons Finished</span>
                </div>
                <div className="stat-box">
                  <span className="num">88%</span>
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
                        {b.unlocked && <span className="unlock-date">Unlocked {b.date}</span>}
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
