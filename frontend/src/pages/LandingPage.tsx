import {
  ArrowRight,
  Atom,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle,
  Clock,
  Compass,
  GraduationCap,
  Layers,
  Moon,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "../router/Router";
import { Navbar } from "../components/layout/Navbar";
import { CircuitBuilder } from "../features/circuit-builder/CircuitBuilder";
import { runSimulation } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { UNIFIED_CURRICULUM_MODULES } from "../data/lessonsData";
import type { CircuitIR, SimulationResult } from "../types";

const defaultHeroCircuit: CircuitIR = {
  qubits: 2,
  classicalBits: 2,
  operations: [
    { gate: "h", targets: [0] },
    { gate: "cx", controls: [0], targets: [1] },
  ],
};

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [circuit, setCircuit] = useState<CircuitIR>(defaultHeroCircuit);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Helper to gate protected features and preserve destination
  function navProtected(targetPath: string) {
    if (user) {
      navigate(targetPath);
    } else {
      navigate(`/login?returnTo=${encodeURIComponent(targetPath)}`);
    }
  }

  function getGatedUrl(targetPath: string): string {
    return user ? targetPath : `/login?returnTo=${encodeURIComponent(targetPath)}`;
  }

  function getSignupUrl(targetPath: string = "/learn"): string {
    return user ? targetPath : `/signup?returnTo=${encodeURIComponent(targetPath)}`;
  }

  async function handleSimulate() {
    setIsSimulating(true);
    try {
      const res = await runSimulation(circuit);
      setResult(res);
    } catch {
      // fallback
    } finally {
      setIsSimulating(false);
    }
  }

  function handleResetHero() {
    setCircuit(defaultHeroCircuit);
    setResult(null);
  }

  return (
    <div className="landing-page-root">
      <Navbar />

      {/* Floating Theme Switcher on Home Screen (Accessible on desktop & mobile) */}
      <div className="homescreen-floating-theme-switch">
        <button
          type="button"
          className="floating-theme-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
          aria-label={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {theme === "dark" ? (
            <Sun size={20} className="text-amber" />
          ) : (
            <Moon size={20} className="text-indigo" />
          )}
        </button>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-grid-bg" />
        <div className="hero-particles" />

        <div className="hero-content">
          <div className="hero-top-row">
            <div className="hero-pill-badge">
              <Sparkles size={14} className="text-teal" />
              <span>SAMBHAV Quantum Intelligence</span>
            </div>

            {/* Direct Moon/Sun Switch Button on Homepage Hero */}
            <button
              type="button"
              className="hero-theme-toggle-pill"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
              aria-label={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {theme === "dark" ? (
                <>
                  <Sun size={15} className="text-amber" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-indigo" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          <h1 className="hero-headline">
            AI-Powered Interactive <br />
            <span className="hero-gradient-text">Quantum Learning Platform</span>
          </h1>

          <p className="hero-subhead">
            Learn quantum computing from mathematical foundations to algorithms, quantum information, simulation, hardware and research — through interactive lessons, experiments and AI-guided learning.
          </p>

          <div className="hero-actions-row">
            <Link to={getSignupUrl("/learn")} className="hero-primary-btn">
              <Zap size={18} /> {user ? "Go to Curriculum" : "Start Learning Free"} <ArrowRight size={18} />
            </Link>
            <Link to={getGatedUrl("/lab")} className="hero-secondary-btn">
              <BrainCircuit size={18} /> Open Quantum Lab
            </Link>
          </div>

          <div className="hero-proof-points">
            <div className="proof-item">
              <CheckCircle size={15} className="text-teal" />
              <span>Unified 10-Module Journey</span>
            </div>
            <div className="proof-item">
              <CheckCircle size={15} className="text-teal" />
              <span>Pure Statevector Simulator</span>
            </div>
            <div className="proof-item">
              <CheckCircle size={15} className="text-teal" />
              <span>Contextual AI Quantum Tutor</span>
            </div>
            <div className="proof-item">
              <CheckCircle size={15} className="text-teal" />
              <span>Qiskit Code Generation</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Hero Canvas (Interactive Teaser) */}
        <div className="hero-interactive-demo">
          <div className="demo-window-card">
            <div className="demo-window-header">
              <div className="window-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <span className="demo-title">Live Interactive Playground — Bell State (|Φ⁺⟩)</span>
              <button
                className="demo-reset-btn"
                onClick={handleResetHero}
                title="Reset Circuit"
                aria-label="Reset Circuit"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            <div className="demo-window-body">
              <div className="hero-circuit-responsive-wrapper">
                <CircuitBuilder circuit={circuit} onChange={setCircuit} />
              </div>

              <div className="demo-actions-bar">
                <button
                  className="demo-run-btn"
                  onClick={handleSimulate}
                  disabled={isSimulating}
                >
                  <Play size={15} /> {isSimulating ? "Simulating..." : "Simulate Live"}
                </button>

                {result && (
                  <div className="demo-result-pill">
                    <span className="result-dirac">{result.dirac || "|ψ⟩ = 0.707|00⟩ + 0.707|11⟩"}</span>
                  </div>
                )}
              </div>

              {result && (
                <div className="demo-probabilities-row">
                  {Object.entries(result.probabilities).map(([basis, prob]) => (
                    <div key={basis} className="demo-prob-item">
                      <span className="basis">|{basis}⟩</span>
                      <div className="bar">
                        <div className="fill" style={{ width: `${prob * 100}%` }} />
                      </div>
                      <span className="pct">{Math.round(prob * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grids */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header-center">
            <span className="section-eyebrow">A COMPLETE QUANTUM ECOSYSTEM</span>
            <h2 className="section-title">Everything You Need to Master Quantum Computing</h2>
            <p className="section-description">
              From intuition and step-by-step mathematical derivations to interactive simulation and AI tutoring, SAMBHAV unifies the complete learning journey.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1: Lab */}
            <div className="feature-card" onClick={() => navProtected("/lab")}>
              <div className="feature-icon-wrapper bg-teal-soft">
                <BrainCircuit size={28} className="text-teal" />
              </div>
              <h3>Interactive Quantum IDE</h3>
              <p>
                Design discrete quantum circuits with drag-and-drop gates, multi-qubit controls, rotation parameters, and instant validation.
              </p>
              <div className="feature-link">
                <span>Explore Lab</span> <ArrowRight size={14} />
              </div>
            </div>

            {/* Feature 2: AI Tutor */}
            <div className="feature-card" onClick={() => navProtected("/ai-tutor")}>
              <div className="feature-icon-wrapper bg-purple-soft">
                <Bot size={28} className="text-purple" />
              </div>
              <h3>Context-Aware AI Tutor</h3>
              <p>
                Get step-by-step physical explanations of superposition, entanglement, phase kickback, and state collapse directly from your circuit.
              </p>
              <div className="feature-link">
                <span>Ask AI Tutor</span> <ArrowRight size={14} />
              </div>
            </div>

            {/* Feature 3: Challenges */}
            <div className="feature-card" onClick={() => navProtected("/challenges")}>
              <div className="feature-icon-wrapper bg-amber-soft">
                <Trophy size={28} className="text-amber" />
              </div>
              <h3>Automated Challenges & Scoring</h3>
              <p>
                Solve circuit puzzles evaluated automatically against target statevectors with instant feedback, XP, and milestone badges.
              </p>
              <div className="feature-link">
                <span>Try Challenges</span> <ArrowRight size={14} />
              </div>
            </div>

            {/* Feature 4: Algorithms */}
            <div className="feature-card" onClick={() => navProtected("/algorithms")}>
              <div className="feature-icon-wrapper bg-blue-soft">
                <Atom size={28} className="text-blue" />
              </div>
              <h3>Verified Algorithm Library</h3>
              <p>
                Step-by-step walkthroughs for Bell States, GHZ 3-Qubit Entanglement, Quantum Teleportation, Grover's Search, and Deutsch-Jozsa.
              </p>
              <div className="feature-link">
                <span>View Algorithms</span> <ArrowRight size={14} />
              </div>
            </div>

            {/* Feature 5: Curriculum */}
            <div className="feature-card" onClick={() => navProtected("/learn")}>
              <div className="feature-icon-wrapper bg-green-soft">
                <BookOpen size={28} className="text-green" />
              </div>
              <h3>Unified SAMBHAV Curriculum</h3>
              <p>
                10 structured modules from mathematical foundations to quantum algorithms, information, error correction, hardware, and research.
              </p>
              <div className="feature-link">
                <span>Start Learning</span> <ArrowRight size={14} />
              </div>
            </div>

            {/* Feature 6: Instructor */}
            <div className="feature-card" onClick={() => navProtected("/instructor")}>
              <div className="feature-icon-wrapper bg-coral-soft">
                <GraduationCap size={28} className="text-coral" />
              </div>
              <h3>Instructor Analytics & Insights</h3>
              <p>
                Classroom management, difficulty heatmaps, and common misconception diagnostics to guide student mastery.
              </p>
              <div className="feature-link">
                <span>Instructor Portal</span> <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Preview Section */}
      <section className="curriculum-preview-section" style={{ padding: "80px 24px", background: "var(--bg-subtle)" }}>
        <div className="section-container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="section-header-center" style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="section-eyebrow">CANONICAL LEARNING JOURNEY</span>
            <h2 className="section-title">The Unified SAMBHAV Curriculum</h2>
            <p className="section-description">
              A comprehensive 10-module progression bridging theoretical rigor and hands-on quantum lab experimentation.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {UNIFIED_CURRICULUM_MODULES.map((mod) => (
              <div
                key={mod.id}
                onClick={() => navProtected(`/learn`)}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "12px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                className="hover-card-glow"
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "1px" }}>
                      Module {mod.moduleNumber}
                    </span>
                    <span className={`difficulty-badge ${mod.difficulty.toLowerCase()}`}>
                      {mod.difficulty}
                    </span>
                  </div>
                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
                    {mod.title}
                  </h4>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "16px" }}>
                    {mod.tagline}
                  </p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <span>{mod.lessons.length} Lessons • {mod.estimatedHours}</span>
                  <span style={{ color: "var(--accent-cyan)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    Explore <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="cta-banner-section">
        <div className="cta-banner-card">
          <h2>Ready to Begin Your Quantum Journey?</h2>
          <p>Learn quantum computing from mathematical foundations to algorithms, quantum information, simulation, hardware and research.</p>
          <div className="cta-buttons">
            <Link to={getSignupUrl("/learn")} className="btn-primary-glow large">
              <Sparkles size={18} /> {user ? "Go to Curriculum" : "Start Learning Free"}
            </Link>
            <Link to={getGatedUrl("/lab")} className="btn-ghost-light large">
              Open Quantum Lab
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <Atom size={22} className="spin-slow" />
              <span>SAMBHAV</span>
            </div>
            <p>SAMBHAV — AI-Powered Interactive Quantum Learning & Research Platform.</p>
          </div>
          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Platform</h4>
              <Link to={getGatedUrl("/learn")}>Curriculum</Link>
              <Link to={getGatedUrl("/lab")}>Quantum Lab</Link>
              <Link to={getGatedUrl("/algorithms")}>Algorithms</Link>
              <Link to={getGatedUrl("/challenges")}>Challenges</Link>
            </div>
            <div className="footer-col">
              <h4>Intelligence</h4>
              <Link to={getGatedUrl("/ai-tutor")}>AI Quantum Tutor</Link>
              <Link to={getGatedUrl("/progress")}>Progress Tracker</Link>
              <Link to={getGatedUrl("/instructor")}>Instructor View</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 SAMBHAV Quantum Platform. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
