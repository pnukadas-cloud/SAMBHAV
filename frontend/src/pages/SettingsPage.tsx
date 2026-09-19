import {
  Bell,
  Check,
  CheckCircle2,
  Code2,
  Cpu,
  Eye,
  Laptop,
  Moon,
  Save,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  Sun,
  User,
  Volume2,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "../router/Router";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";

export function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { theme, setTheme, toggleTheme } = useTheme();

  const [defaultBackend, setDefaultBackend] = useState("local_statevector");
  const [defaultShots, setDefaultShots] = useState(1024);
  const [aiVerbosity, setAiVerbosity] = useState<"concise" | "detailed" | "socratic">("detailed");
  const [editorKeybinding, setEditorKeybinding] = useState<"standard" | "vim">("standard");
  const [autoSaveCircuits, setAutoSaveCircuits] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);

  function handleSaveSimulationSettings(e: React.FormEvent) {
    e.preventDefault();
    showToast("Quantum simulation parameters updated!", "success", "Saved");
  }

  function handleSaveEditorSettings(e: React.FormEvent) {
    e.preventDefault();
    showToast("Editor preferences saved successfully!", "success", "Saved");
  }

  return (
    <AppShell activeTitle="Application Settings" activeCategory="System">
      <div className="settings-page-container">
        {/* Profile Link Banner */}
        <div className="settings-profile-banner">
          <div className="banner-left">
            <div className="banner-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h4>{user?.name || "Quantum User"}</h4>
              <p>Looking to edit your display name, bio, or quantum achievements?</p>
            </div>
          </div>
          <Link to="/profile" className="banner-profile-btn">
            <User size={15} /> Open User Profile
          </Link>
        </div>

        <div className="settings-grid-layout">
          {/* Appearance & Theme Mode */}
          <div className="settings-section-card">
            <div className="section-title-row">
              {theme === "dark" ? <Moon size={18} className="text-indigo" /> : <Sun size={18} className="text-amber" />}
              <h3>Appearance & Theme Mode</h3>
            </div>
            <p className="settings-subtext">
              Choose your preferred visual theme for the SAMBHAV quantum learning platform. You can also toggle this instantly with the Sun/Moon button in the topbar.
            </p>

            <div className="settings-form">
              <div className="form-group">
                <label>Active Theme</label>
                <div className="choice-pills-row">
                  <button
                    type="button"
                    className={`choice-pill ${theme === "dark" ? "selected" : ""}`}
                    onClick={() => {
                      setTheme("dark");
                      showToast("Quantum Dark theme activated.", "info");
                    }}
                  >
                    <Moon size={14} className="text-indigo" style={{ marginRight: "6px" }} />
                    Quantum Dark (Default)
                  </button>
                  <button
                    type="button"
                    className={`choice-pill ${theme === "light" ? "selected" : ""}`}
                    onClick={() => {
                      setTheme("light");
                      showToast("Daylight theme activated.", "info");
                    }}
                  >
                    <Sun size={14} className="text-amber" style={{ marginRight: "6px" }} />
                    Daylight Light
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quantum Simulation Engine Settings */}
          <div className="settings-section-card">
            <div className="section-title-row">
              <Cpu size={18} className="text-teal" />
              <h3>Quantum Simulation Engine</h3>
            </div>
            <p className="settings-subtext">
              Configure the execution defaults for circuit statevector calculation and sampling.
            </p>

            <form className="settings-form" onSubmit={handleSaveSimulationSettings}>
              <div className="form-group">
                <label>Default Simulation Engine</label>
                <select
                  value={defaultBackend}
                  onChange={(e) => setDefaultBackend(e.target.value)}
                >
                  <option value="local_statevector">Local Analytical Statevector (Zero Latency)</option>
                  <option value="qiskit_aer" disabled>Qiskit Aer Noise Simulator (Experimental)</option>
                  <option value="ibm_quantum" disabled>IBM Quantum Hardware Cloud (Upcoming)</option>
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ margin: 0 }}>Default Shots Sample Count</label>
                  <span className="mono-text" style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
                    {defaultShots} shots
                  </span>
                </div>
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
                  <span>4096 (High Precision)</span>
                  <span>8192 (Max)</span>
                </div>
              </div>

              <button type="submit" className="save-btn">
                <Save size={15} /> Save Simulation Settings
              </button>
            </form>
          </div>

          {/* AI Tutor Pedagogical Mode */}
          <div className="settings-section-card">
            <div className="section-title-row">
              <Sparkles size={18} className="text-purple" />
              <h3>AI Educator & Tutor Style</h3>
            </div>
            <p className="settings-subtext">
              Customize how the AI Tutor explains quantum gates, derivations, and circuit errors.
            </p>

            <div className="settings-form">
              <div className="form-group">
                <label>Pedagogical Explanation Style</label>
                <div className="choice-pills-row">
                  <button
                    type="button"
                    className={`choice-pill ${aiVerbosity === "concise" ? "selected" : ""}`}
                    onClick={() => {
                      setAiVerbosity("concise");
                      showToast("AI explanation style set to Concise.", "info");
                    }}
                  >
                    Concise (Key Points)
                  </button>
                  <button
                    type="button"
                    className={`choice-pill ${aiVerbosity === "detailed" ? "selected" : ""}`}
                    onClick={() => {
                      setAiVerbosity("detailed");
                      showToast("AI explanation style set to Detailed Derivations.", "info");
                    }}
                  >
                    Detailed (Full Physics & Math)
                  </button>
                  <button
                    type="button"
                    className={`choice-pill ${aiVerbosity === "socratic" ? "selected" : ""}`}
                    onClick={() => {
                      setAiVerbosity("socratic");
                      showToast("AI explanation style set to Socratic Guide.", "info");
                    }}
                  >
                    Socratic (Guiding Questions)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Code Editor & Quantum IDE Settings */}
          <div className="settings-section-card">
            <div className="section-title-row">
              <Code2 size={18} className="text-blue" />
              <h3>Quantum Circuit IDE Preferences</h3>
            </div>
            <p className="settings-subtext">
              Editor settings for the interactive circuit designer and Python/Qiskit exporter.
            </p>

            <form className="settings-form" onSubmit={handleSaveEditorSettings}>
              <div className="form-group">
                <label>Keybinding Mode</label>
                <select
                  value={editorKeybinding}
                  onChange={(e) => setEditorKeybinding(e.target.value as any)}
                >
                  <option value="standard">Standard VS Code Keybindings</option>
                  <option value="vim">Vim Modal Editing</option>
                </select>
              </div>

              <div className="toggle-row">
                <div>
                  <strong>Auto-Save Circuits</strong>
                  <p>Automatically save circuit state changes to local browser storage</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSaveCircuits}
                  onChange={(e) => setAutoSaveCircuits(e.target.checked)}
                />
              </div>

              <button type="submit" className="save-btn">
                <Save size={15} /> Save IDE Preferences
              </button>
            </form>
          </div>

          {/* Accessibility & Audio */}
          <div className="settings-section-card">
            <div className="section-title-row">
              <Eye size={18} className="text-amber" />
              <h3>Accessibility & Feedback</h3>
            </div>

            <div className="settings-form">
              <div className="toggle-row">
                <div>
                  <strong>Reduced Motion</strong>
                  <p>Disable pulse animations, spin effects, and intensive Bloch sphere transitions</p>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => {
                    setReducedMotion(e.target.checked);
                    showToast(e.target.checked ? "Reduced motion enabled." : "Standard animations restored.", "info");
                  }}
                />
              </div>

              <div className="toggle-row">
                <div>
                  <strong>Audio Feedback</strong>
                  <p>Play subtle chime on circuit simulation completion and quiz success</p>
                </div>
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => {
                    setSoundEffects(e.target.checked);
                    showToast(e.target.checked ? "Sound effects enabled." : "Audio muted.", "info");
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
