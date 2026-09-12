import {
  AlertTriangle,
  Atom,
  BrainCircuit,
  Code2,
  GraduationCap,
  LayoutDashboard,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { explainCircuitWithAI, runSimulation, toQiskitCode } from "./api/client";
import { CircuitBuilder } from "./features/circuit-builder/CircuitBuilder";
import { TutorPanel } from "./features/ai-tutor/TutorPanel";
import { LearningPanel } from "./features/learning/LearningPanel";
import { InstructorPanel } from "./features/instructor/InstructorPanel";
import { ResultsPanel } from "./features/visualization/ResultsPanel";
import type { AITutorResponse, CircuitIR, SimulationResult } from "./types";

const defaultBellCircuit: CircuitIR = {
  qubits: 2,
  classicalBits: 2,
  operations: [
    { gate: "h", targets: [0] },
    { gate: "cx", controls: [0], targets: [1] },
    { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
  ],
};

export function App() {
  const [circuit, setCircuit] = useState<CircuitIR>(defaultBellCircuit);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [tutorResponse, setTutorResponse] = useState<AITutorResponse | null>(null);
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Ready");
  const [isRunning, setIsRunning] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isCircuitEmpty = !circuit.operations || circuit.operations.length === 0;

  async function handleRun() {
    if (isCircuitEmpty) {
      setValidationError("Your circuit is empty. Add at least one gate before running the simulation.");
      setStatus("Circuit empty");
      return;
    }

    setValidationError(null);
    setIsRunning(true);
    setStatus("Running quantum simulation...");

    try {
      const simulation = await runSimulation(circuit);
      const generatedCode = await toQiskitCode(circuit);
      setResult(simulation);
      setCode(generatedCode.code);
      setStatus(`Completed on ${simulation.backend}`);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Simulation execution failed.";
      setStatus("Simulation failed");
      setValidationError(
        errorMsg.includes("422") || errorMsg.includes("at least one operation")
          ? "Your circuit is empty. Add at least one gate before running the simulation."
          : errorMsg
      );
    } finally {
      setIsRunning(false);
    }
  }

  async function handleAskTutor(question?: string) {
    if (isCircuitEmpty) {
      setValidationError("Your circuit is empty. Add at least one gate before asking the AI tutor.");
      return;
    }

    setValidationError(null);
    setIsTutorLoading(true);
    setStatus("Asking AI tutor...");

    try {
      // Ensure we have current simulation results for rich contextual reasoning
      let currentResult = result;
      if (!currentResult) {
        try {
          currentResult = await runSimulation(circuit);
          setResult(currentResult);
        } catch {
          // If simulation fails here, backend will still simulate internally
        }
      }

      const response = await explainCircuitWithAI({
        circuit,
        simulation_result: currentResult,
        question: question || null,
        lesson_context: {
          title: "Quantum Entanglement & Superposition",
          objective: "Understand how Hadamard and CX gates create non-separable states.",
        },
      });

      setTutorResponse(response);
      setStatus(
        response.source === "llm"
          ? "AI tutor response ready (LLM)"
          : "AI tutor explanation ready"
      );
    } catch (error) {
      setStatus("Tutor request failed");
      setValidationError("Failed to retrieve AI explanation. Please check backend connectivity.");
    } finally {
      setIsTutorLoading(false);
    }
  }

  function handleReset() {
    setCircuit(defaultBellCircuit);
    setValidationError(null);
    setStatus("Reset to Bell circuit");
  }

  function handleCircuitChange(newCircuit: CircuitIR) {
    setCircuit(newCircuit);
    if (newCircuit.operations.length > 0 && validationError) {
      setValidationError(null);
    }
  }

  return (
    <main className="app-shell">
      {/* Platform Header Topbar */}
      <header className="topbar" aria-label="SAMBHAV header">
        <div className="topbar-brand">
          <div className="brand-logo-badge">
            <Atom size={24} className="spin-slow" />
          </div>
          <div>
            <p className="eyebrow">Smart India Hackathon 2026</p>
            <h1>SAMBHAV Quantum Learning Platform</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <div className={`status-pill ${isRunning || isTutorLoading ? "status-running" : ""}`}>
            {status}
          </div>
        </div>
      </header>

      {/* Main Quantum IDE Workspace */}
      <div className="workspace">
        {/* Left Column: Interactive Learning & Module Guide */}
        <div className="learning-column">
          <LearningPanel />
        </div>

        {/* Center Column: Discrete Circuit Grid Builder & Code Engine */}
        <div className="builder-column">
          <div className="section-heading">
            <BrainCircuit size={20} className="text-teal" />
            <h2>Interactive Circuit Builder</h2>
            <span className="badge-pill">{circuit.qubits} Qubits • {circuit.operations.length} Gates</span>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="circuit-validation-alert" role="alert">
              <AlertTriangle size={18} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Circuit Canvas Grid Component */}
          <CircuitBuilder circuit={circuit} onChange={handleCircuitChange} />

          {/* Primary Action Buttons */}
          <div className="action-row">
            <button
              className="primary-button"
              onClick={handleRun}
              disabled={isRunning || isCircuitEmpty}
              title={isCircuitEmpty ? "Add gates before running" : "Execute simulation"}
            >
              <Play size={18} /> {isRunning ? "Simulating..." : "Run Simulation"}
            </button>

            <button
              className="secondary-button"
              onClick={() => handleAskTutor()}
              disabled={isCircuitEmpty || isTutorLoading}
              title={isCircuitEmpty ? "Add gates before asking AI" : "Explain this circuit"}
            >
              <Sparkles size={18} /> {isTutorLoading ? "Thinking..." : "Explain Circuit"}
            </button>

            <button
              className="icon-button"
              aria-label="Reset to default Bell circuit"
              onClick={handleReset}
              title="Reset to Bell State (|Φ⁺⟩)"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Generated Python/Qiskit Code Panel */}
          <div className="code-panel">
            <div className="section-heading compact">
              <Code2 size={18} />
              <h2>Generated Qiskit Code</h2>
            </div>
            <pre className="qiskit-code-block">
              {code || "# Run the simulation or place gates to generate Qiskit code."}
            </pre>
          </div>
        </div>

        {/* Right Column: Quantum Simulation Results, AI Tutor & Instructor Snapshot */}
        <div className="insight-column">
          <ResultsPanel result={result} />
          <TutorPanel
            response={tutorResponse}
            isLoading={isTutorLoading}
            onAskQuestion={(q) => handleAskTutor(q)}
          />
          <div className="section-heading compact">
            <LayoutDashboard size={18} />
            <h2>Instructor Snapshot</h2>
          </div>
          <InstructorPanel />
        </div>
      </div>
    </main>
  );
}
