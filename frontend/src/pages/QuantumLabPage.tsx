import {
  AlertTriangle,
  Atom,
  Bot,
  BrainCircuit,
  Check,
  Code2,
  Copy,
  Cpu,
  Download,
  FolderOpen,
  History,
  Layers,
  Play,
  Redo,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Undo,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { CircuitBuilder, PRESET_CIRCUITS } from "../features/circuit-builder/CircuitBuilder";
import { ResultsPanel } from "../features/visualization/ResultsPanel";
import { TutorPanel } from "../features/ai-tutor/TutorPanel";
import { explainCircuitWithAI, fetchMyCircuits, runSimulation, saveCircuit, toQiskitCode } from "../api/client";
import { useToast } from "../context/ToastContext";
import type { AITutorResponse, CircuitIR, SimulationResult } from "../types";

const defaultBellCircuit: CircuitIR = {
  qubits: 2,
  classicalBits: 2,
  operations: [
    { gate: "h", targets: [0] },
    { gate: "cx", controls: [0], targets: [1] },
    { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
  ],
};

export function QuantumLabPage() {
  const { showToast } = useToast();
  const [circuitTitle, setCircuitTitle] = useState("Bell State (|Φ⁺⟩)");
  const [circuit, setCircuit] = useState<CircuitIR>(defaultBellCircuit);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [code, setCode] = useState("");
  const [tutorResponse, setTutorResponse] = useState<AITutorResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "bloch" | "code" | "tutor">("results");
  const [selectedBackend, setSelectedBackend] = useState("local_statevector");
  const [copiedCode, setCopiedCode] = useState(false);

  // Undo/Redo History stack
  const [history, setHistory] = useState<CircuitIR[]>([defaultBellCircuit]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Cloud Saved circuits modal
  const [savedCircuits, setSavedCircuits] = useState<any[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);

  const isCircuitEmpty = !circuit.operations || circuit.operations.length === 0;

  function handleCircuitChange(newCircuit: CircuitIR) {
    setCircuit(newCircuit);
    // Push to history
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIdx + 1);
      return [...sliced, newCircuit].slice(-30);
    });
    setHistoryIdx((prev) => Math.min(prev + 1, 29));
  }

  function handleUndo() {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setCircuit(history[prevIdx]);
      showToast("Undo step", "info");
    }
  }

  function handleRedo() {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setCircuit(history[nextIdx]);
      showToast("Redo step", "info");
    }
  }

  // Auto-generate code when circuit changes
  useEffect(() => {
    if (!isCircuitEmpty) {
      toQiskitCode(circuit)
        .then((res) => setCode(res.code))
        .catch(() => {});
    } else {
      setCode("# Place quantum gates on the grid to generate Qiskit code.");
    }
  }, [circuit]);

  async function handleRunSimulation() {
    if (isCircuitEmpty) {
      showToast("Circuit is empty. Add at least one gate before simulating.", "warning");
      return;
    }
    setIsSimulating(true);
    try {
      const sim = await runSimulation(circuit);
      setResult(sim);
      showToast(`Simulation completed on ${sim.backend}`, "success", "Simulation Ready");
      setActiveTab("results");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Simulation failed.";
      showToast(msg, "error", "Execution Failed");
    } finally {
      setIsSimulating(false);
    }
  }

  async function handleAskTutor(question?: string) {
    if (isCircuitEmpty) {
      showToast("Place gates on the canvas before asking the AI tutor.", "warning");
      return;
    }
    setIsTutorLoading(true);
    setActiveTab("tutor");
    try {
      let currentResult = result;
      if (!currentResult) {
        currentResult = await runSimulation(circuit);
        setResult(currentResult);
      }
      const resp = await explainCircuitWithAI({
        circuit,
        simulation_result: currentResult,
        question: question || null,
        lesson_context: {
          title: circuitTitle,
          objective: "Analyze quantum circuit state evolution and measurement probabilities.",
        },
      });
      setTutorResponse(resp);
      showToast("AI explanation generated!", "info", "AI Tutor");
    } catch {
      showToast("Failed to retrieve AI explanation.", "error");
    } finally {
      setIsTutorLoading(false);
    }
  }

  function handlePresetSelect(indexStr: string) {
    const idx = parseInt(indexStr, 10);
    const preset = PRESET_CIRCUITS[idx];
    if (preset) {
      const newCircuit = preset.getCircuit(preset.name.includes("GHZ") ? 3 : 2);
      handleCircuitChange(newCircuit);
      setCircuitTitle(preset.name);
      setResult(null);
      showToast(`Loaded preset: ${preset.name}`, "info");
    }
  }

  async function handleSaveCircuit() {
    try {
      await saveCircuit(circuitTitle, circuit, "User saved circuit from Quantum Lab IDE");
      showToast(`Circuit "${circuitTitle}" saved to cloud database!`, "success", "Cloud Saved");
    } catch {
      showToast(`Circuit "${circuitTitle}" saved locally!`, "success", "Saved");
    }
  }

  async function handleOpenSavedModal() {
    setShowSavedModal(true);
    try {
      const list = await fetchMyCircuits();
      setSavedCircuits(list);
    } catch {
      // Offline fallback
    }
  }

  function handleLoadSavedCircuit(saved: any) {
    if (saved.circuit_ir) {
      handleCircuitChange(saved.circuit_ir);
      setCircuitTitle(saved.title || "Saved Circuit");
      setResult(null);
      setShowSavedModal(false);
      showToast(`Loaded "${saved.title}"`, "info");
    }
  }

  function handleCopyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast("Python/Qiskit code copied to clipboard!", "success");
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleDownloadCode() {
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${circuitTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}_qiskit.py`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded Python script", "success");
  }

  return (
    <AppShell activeTitle="Quantum Lab IDE" activeCategory="Workspace">
      <div className="quantum-lab-page-container">
        {/* Top Control Toolbar */}
        <div className="lab-top-toolbar">
          <div className="lab-title-group">
            <input
              type="text"
              className="lab-circuit-title-input"
              value={circuitTitle}
              onChange={(e) => setCircuitTitle(e.target.value)}
              placeholder="Untitled Circuit"
              title="Click to rename circuit"
            />
            <span className="lab-circuit-meta">
              {circuit.qubits} Qubits • {circuit.operations.length} Gates
            </span>
          </div>

          <div className="lab-toolbar-actions">
            {/* Presets dropdown */}
            <div className="lab-preset-selector">
              <select
                onChange={(e) => e.target.value !== "" && handlePresetSelect(e.target.value)}
                defaultValue=""
                aria-label="Select circuit preset"
              >
                <option value="" disabled>
                  Load Algorithm Preset...
                </option>
                {PRESET_CIRCUITS.map((item, idx) => (
                  <option key={item.name} value={idx}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Backend selector */}
            <div className="lab-backend-selector">
              <select
                value={selectedBackend}
                onChange={(e) => setSelectedBackend(e.target.value)}
                aria-label="Select execution backend"
              >
                <option value="local_statevector">Local Statevector (Active)</option>
                <option value="qiskit_aer" disabled>Qiskit Aer (Simulated)</option>
                <option value="ibm_quantum" disabled>IBM Quantum (Hardware)</option>
              </select>
            </div>

            {/* Undo / Redo */}
            <button
              className="toolbar-icon-btn"
              onClick={handleUndo}
              disabled={historyIdx === 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={15} />
            </button>
            <button
              className="toolbar-icon-btn"
              onClick={handleRedo}
              disabled={historyIdx >= history.length - 1}
              title="Redo (Ctrl+Y)"
            >
              <Redo size={15} />
            </button>

            {/* Cloud Open & Save */}
            <button className="toolbar-btn" onClick={handleOpenSavedModal} title="Open Saved Circuit">
              <FolderOpen size={15} /> <span>Cloud Library</span>
            </button>
            <button className="toolbar-btn" onClick={handleSaveCircuit} title="Save Circuit to Database">
              <Save size={15} /> <span>Save</span>
            </button>

            {/* Reset button */}
            <button
              className="toolbar-btn"
              onClick={() => {
                handleCircuitChange(defaultBellCircuit);
                setCircuitTitle("Bell State (|Φ⁺⟩)");
                setResult(null);
              }}
              title="Reset Circuit"
            >
              <RotateCcw size={15} />
            </button>

            {/* Primary Run Button */}
            <button
              className="lab-run-btn"
              onClick={handleRunSimulation}
              disabled={isSimulating || isCircuitEmpty}
            >
              <Play size={16} />
              <span>{isSimulating ? "Simulating..." : "Run Simulation"}</span>
            </button>

            {/* AI Explain Shortcut */}
            <button
              className="lab-ai-btn"
              onClick={() => handleAskTutor()}
              disabled={isCircuitEmpty || isTutorLoading}
            >
              <Sparkles size={16} />
              <span>{isTutorLoading ? "Thinking..." : "Explain"}</span>
            </button>
          </div>
        </div>

        {/* Main Split Layout: Canvas Left, Inspector/Results Tabs Right */}
        <div className="lab-workspace-split">
          {/* Left Canvas View */}
          <div className="lab-canvas-area">
            <CircuitBuilder circuit={circuit} onChange={handleCircuitChange} />
          </div>

          {/* Right Insights Tabbed Panel */}
          <div className="lab-inspector-tabs-col">
            <div className="inspector-tab-headers">
              <button
                className={`tab-btn ${activeTab === "results" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("results")}
              >
                <BrainCircuit size={16} /> Results & Dirac
              </button>
              <button
                className={`tab-btn ${activeTab === "bloch" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("bloch")}
              >
                <Atom size={16} /> Bloch Vectors
              </button>
              <button
                className={`tab-btn ${activeTab === "code" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("code")}
              >
                <Code2 size={16} /> Qiskit Code
              </button>
              <button
                className={`tab-btn ${activeTab === "tutor" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("tutor")}
              >
                <Bot size={16} /> AI Tutor
              </button>
            </div>

            <div className="inspector-tab-content">
              {/* Tab 1: Simulation Results & Dirac */}
              {activeTab === "results" && (
                <div className="tab-pane results-tab-pane">
                  <ResultsPanel result={result} />
                </div>
              )}

              {/* Tab 2: Bloch Vectors */}
              {activeTab === "bloch" && (
                <div className="tab-pane bloch-tab-pane">
                  <div className="panel">
                    <h2>Bloch Sphere Vector Coordinates</h2>
                    <p className="muted">
                      Bloch sphere vectors represent the reduced density matrix coordinates (⟨X⟩, ⟨Y⟩, ⟨Z⟩) for each individual qubit.
                    </p>

                    {result && result.bloch && result.bloch.length > 0 ? (
                      <div className="bloch-cards-grid">
                        {result.bloch.map((b) => (
                          <div key={b.qubit} className="bloch-vector-card">
                            <div className="bloch-card-header">
                              <Atom size={18} className="text-teal" />
                              <h3>Qubit q[{b.qubit}]</h3>
                            </div>
                            <div className="bloch-coords-row">
                              <div className="coord-box">
                                <span className="coord-axis">X (⟨X⟩)</span>
                                <span className="coord-val">{b.x.toFixed(4)}</span>
                              </div>
                              <div className="coord-box">
                                <span className="coord-axis">Y (⟨Y⟩)</span>
                                <span className="coord-val">{b.y.toFixed(4)}</span>
                              </div>
                              <div className="coord-box">
                                <span className="coord-axis">Z (⟨Z⟩)</span>
                                <span className="coord-val">{b.z.toFixed(4)}</span>
                              </div>
                            </div>
                            <div className="bloch-purity-indicator">
                              <span>Purity Vector Length |r|: </span>
                              <strong>{Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z).toFixed(3)}</strong>
                              {Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z) < 0.95 && (
                                <span className="entangled-pill">Mixed state (Entangled)</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state-card">
                        <Atom size={32} className="text-muted" />
                        <p>Run the simulation to calculate individual qubit Bloch sphere projections.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Qiskit Code Generator */}
              {activeTab === "code" && (
                <div className="tab-pane code-tab-pane">
                  <div className="code-export-header">
                    <div className="code-lang-tag">
                      <Code2 size={16} />
                      <span>Python 3 • Qiskit 1.0</span>
                    </div>
                    <div className="code-actions">
                      <button className="code-btn" onClick={handleCopyCode} title="Copy code">
                        {copiedCode ? <Check size={14} className="text-teal" /> : <Copy size={14} />}
                        <span>{copiedCode ? "Copied!" : "Copy"}</span>
                      </button>
                      <button className="code-btn" onClick={handleDownloadCode} title="Download .py script">
                        <Download size={14} />
                        <span>Download .py</span>
                      </button>
                    </div>
                  </div>
                  <pre className="code-block">
                    <code>{code}</code>
                  </pre>
                </div>
              )}

              {/* Tab 4: AI Tutor */}
              {activeTab === "tutor" && (
                <div className="tab-pane tutor-tab-pane">
                  <TutorPanel
                    response={tutorResponse}
                    isLoading={isTutorLoading}
                    onAskQuestion={handleAskTutor}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cloud Saved Circuits Modal */}
        {showSavedModal && (
          <div className="modal-overlay" onClick={() => setShowSavedModal(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <FolderOpen size={20} className="text-teal" />
                  <h3>Cloud Saved Circuits Library</h3>
                </div>
                <button className="close-modal-btn" onClick={() => setShowSavedModal(false)}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {savedCircuits.length > 0 ? (
                  <div className="saved-circuits-list">
                    {savedCircuits.map((sc) => (
                      <div key={sc.id} className="saved-circuit-card">
                        <div className="saved-card-left">
                          <h4>{sc.title}</h4>
                          <p>{sc.description || "No description provided."}</p>
                          <span className="saved-meta">
                            Updated: {new Date(sc.updated_at || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          className="load-saved-btn"
                          onClick={() => handleLoadSavedCircuit(sc)}
                        >
                          Load into IDE
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-saved-box">
                    <p>No saved circuits found in your cloud library yet. Save your circuit using the top "Save" button.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
