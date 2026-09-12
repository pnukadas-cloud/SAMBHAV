import {
  Bell,
  Check,
  Cpu,
  Eye,
  Lock,
  Moon,
  Save,
  Settings,
  Shield,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function SettingsPage() {
  const { user, updateUserPreferences } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || "Punith Demo");
  const [email, setEmail] = useState(user?.email || "student@sambhav.edu");
  const [defaultBackend, setDefaultBackend] = useState("local_statevector");
  const [defaultShots, setDefaultShots] = useState(1024);
  const [aiVerbosity, setAiVerbosity] = useState<"concise" | "detailed" | "socratic">("detailed");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [reducedMotion, setReducedMotion] = useState(false);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    updateUserPreferences({ name, email });
    showToast("Profile settings saved successfully!", "success");
  }

  function handleSaveSimulationSettings() {
    showToast("Simulation defaults updated!", "success");
  }

  return (
    <AppShell activeTitle="Settings & Preferences" activeCategory="Account">
      <div className="settings-page-container">
        <div className="settings-grid-layout">
          {/* Profile Settings */}
          <div className="settings-section-card">
            <div className="section-title-row">
              <User size={18} className="text-teal" />
              <h3>Profile Information</h3>
            </div>

            <form className="settings-form" onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label htmlFor="settings-name">Full Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-email">Email Address</label>
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Active Role</label>
                <input
                  type="text"
                  value={user?.role === "instructor" ? "Instructor / Educator" : "Student Learner"}
                  disabled
                  className="input-disabled"
                />
              </div>

              <button type="submit" className="save-btn">
                <Save size={15} /> Save Profile Changes
              </button>
            </form>
          </div>

          {/* Simulation & Quantum Engine Settings */}
          <div className="settings-section-card">
            <div className="section-title-row">
              <Cpu size={18} className="text-blue" />
              <h3>Quantum Simulation Defaults</h3>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Default Simulation Engine</label>
                <select
                  value={defaultBackend}
                  onChange={(e) => setDefaultBackend(e.target.value)}
                >
                  <option value="local_statevector">Local Statevector (Fast, Analytical)</option>
                  <option value="qiskit_aer" disabled>Qiskit Aer (Noise Simulation - Planned)</option>
                  <option value="ibm_quantum" disabled>IBM Quantum Cloud (Hardware - Planned)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default Shots Sample Count ({defaultShots})</label>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={defaultShots}
                  onChange={(e) => setDefaultShots(Number(e.target.value))}
                />
                <div className="range-labels">
                  <span>256 (Fast)</span>
                  <span>1024 (Standard)</span>
                  <span>8192 (High Precision)</span>
                </div>
              </div>

              <button type="button" className="save-btn" onClick={handleSaveSimulationSettings}>
                <Save size={15} /> Update Simulation Defaults
              </button>
            </div>
          </div>

          {/* AI Tutor Preferences */}
          <div className="settings-section-card">
            <div className="section-title-row">
              <Sparkles size={18} className="text-purple" />
              <h3>AI Tutor Pedagogical Style</h3>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Explanation Depth</label>
                <div className="choice-pills-row">
                  <button
                    type="button"
                    className={`choice-pill ${aiVerbosity === "concise" ? "selected" : ""}`}
                    onClick={() => setAiVerbosity("concise")}
                  >
                    Concise (Bullet Points)
                  </button>
                  <button
                    type="button"
                    className={`choice-pill ${aiVerbosity === "detailed" ? "selected" : ""}`}
                    onClick={() => setAiVerbosity("detailed")}
                  >
                    Detailed (Physical Derivation)
                  </button>
                  <button
                    type="button"
                    className={`choice-pill ${aiVerbosity === "socratic" ? "selected" : ""}`}
                    onClick={() => setAiVerbosity("socratic")}
                  >
                    Socratic (Guiding Questions)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Accessibility & Appearance */}
          <div className="settings-section-card">
            <div className="section-title-row">
              <Eye size={18} className="text-amber" />
              <h3>Appearance & Accessibility</h3>
            </div>

            <div className="settings-form">
              <div className="toggle-row">
                <div>
                  <strong>Reduced Motion</strong>
                  <p>Minimize animations and particle effects across circuits</p>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
