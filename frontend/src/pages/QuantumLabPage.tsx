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
  Play,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { CircuitBuilder, PRESET_CIRCUITS } from "../features/circuit-builder/CircuitBuilder";
import { ResultsPanel } from "../features/visualization/ResultsPanel";
import { TutorPanel } from "../features/ai-tutor/TutorPanel";
import { explainCircuitWithAI, runSimulation, toQiskitCode } from "../api/client";
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
  const [activeTab, setActiveTab] = useState<"results" | "code" | "tutor">("results");
  const [selectedBackend, setSelectedBackend] = useState("local_statevector");
  const [copiedCode, setCopiedCode] = useState(false);

  const isCircuitEmpty = !circuit.operations || circuit.operations.length === 0;

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
      setCircuit(preset.getCircuit(preset.name.includes("GHZ") ? 3 : 2));
      setCircuitTitle(preset.name);
      setResult(null);
      showToast(`Loaded preset: ${preset.name}`, "info");
    }
  }

  function handleSaveCircuit() {
    showToast(`Circuit "${circuitTitle}" saved to your cloud library!`, "success", "Saved");
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

            {/* Save button */}
            <button className="toolbar-btn" onClick={handleSaveCircuit} title="Save Circuit">
              <Save size={16} /> <span>Save</span>
            </button>

            {/* Reset button */}
            <button
              className="toolbar-btn"
              onClick={() => {
                setCircuit(defaultBellCircuit);
                setCircuitTitle("Bell State (|Φ⁺⟩)");
                setResult(null);
              }}
              title="Reset Circuit"
            >
              <RotateCcw size={16} />
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
            <CircuitBuilder circuit={circuit} onChange={setCircuit} />
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
                className={`tab-btn ${activeTab === "tutor" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("tutor")}
              >
                <Bot size={16} /> AI Tutor
              </button>
              <button
                className={`tab-btn ${activeTab === "code" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("code")}
              >
                <Code2 size={16} /> Qiskit Code
              </button>
            </div>

            <div className="inspector-tab-body">
              {activeTab === "results" && (
                <div className="tab-pane-results">
                  <ResultsPanel result={result} />
                </div>
              )}

              {activeTab === "tutor" && (
                <div className="tab-pane-tutor">
                  <TutorPanel
                    response={tutorResponse}
                    isLoading={isTutorLoading}
                    onAskQuestion={handleAskTutor}
                  />
                </div>
              )}

              {activeTab === "code" && (
                <div className="tab-pane-code">
                  <div className="code-header-row">
                    <span className="code-lang-label">Python (Qiskit 1.0)</span>
                    <div className="code-actions">
                      <button className="code-action-btn" onClick={handleCopyCode} title="Copy code">
                        {copiedCode ? <Check size={14} className="text-teal" /> : <Copy size={14} />}
                        <span>{copiedCode ? "Copied" : "Copy"}</span>
                      </button>
                      <button className="code-action-btn" onClick={handleDownloadCode} title="Download .py file">
                        <Download size={14} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                  <pre className="qiskit-code-block">{code}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
