import { BrainCircuit, ChartNoAxesColumnIncreasing, GraduationCap, LayoutDashboard, Play, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { explainCircuit, runSimulation, toQiskitCode } from "./api/client";
import { CircuitBuilder } from "./features/circuit-builder/CircuitBuilder";
import { TutorPanel } from "./features/ai-tutor/TutorPanel";
import { LearningPanel } from "./features/learning/LearningPanel";
import { InstructorPanel } from "./features/instructor/InstructorPanel";
import { ResultsPanel } from "./features/visualization/ResultsPanel";
import type { CircuitIR, Gate, SimulationResult } from "./types";

const bellCircuit: CircuitIR = {
  qubits: 2,
  classicalBits: 2,
  operations: [
    { gate: "h", targets: [0] },
    { gate: "cx", controls: [0], targets: [1] },
    { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
  ],
};

export function App() {
  const [circuit, setCircuit] = useState<CircuitIR>(bellCircuit);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [explanation, setExplanation] = useState("Run the Bell circuit and ask the tutor why the outcomes are correlated.");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Ready");

  const operationsByQubit = useMemo(() => {
    return circuit.operations.reduce<Record<number, Gate[]>>((acc, operation) => {
      for (const target of operation.targets) {
        acc[target] = [...(acc[target] ?? []), operation.gate];
      }
      return acc;
    }, {});
  }, [circuit]);

  async function handleRun() {
    setStatus("Running simulation...");
    try {
      const simulation = await runSimulation(circuit);
      const generatedCode = await toQiskitCode(circuit);
      setResult(simulation);
      setCode(generatedCode.code);
      setStatus(`Completed on ${simulation.backend}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Simulation failed");
    }
  }

  async function handleExplain() {
    setStatus("Asking AI tutor...");
    try {
      const response = await explainCircuit(circuit);
      setExplanation(`${response.explanation}\n\nTry next: ${response.suggestions.join(" ")}`);
      setStatus("Tutor explanation ready");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Tutor request failed");
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Project overview">
        <div>
          <p className="eyebrow">SIH 2026 Prototype</p>
          <h1>SAMBHAV Quantum Learning</h1>
        </div>
        <div className="status-pill">{status}</div>
      </section>

      <section className="workspace">
        <LearningPanel />
        <div className="builder-column">
          <div className="section-heading">
            <BrainCircuit size={20} />
            <h2>Visual Circuit Builder</h2>
          </div>
          <CircuitBuilder circuit={circuit} operationsByQubit={operationsByQubit} onChange={setCircuit} />
          <div className="action-row">
            <button className="primary-button" onClick={handleRun}>
              <Play size={18} /> Run Simulation
            </button>
            <button className="secondary-button" onClick={handleExplain}>
              <GraduationCap size={18} /> Explain
            </button>
            <button className="icon-button" aria-label="Reset to Bell circuit" onClick={() => setCircuit(bellCircuit)}>
              <RotateCcw size={18} />
            </button>
          </div>
          <div className="code-panel">
            <div className="section-heading compact">
              <ChartNoAxesColumnIncreasing size={18} />
              <h2>Generated Qiskit Code</h2>
            </div>
            <pre>{code || "Run the circuit to generate backend code."}</pre>
          </div>
        </div>
        <div className="insight-column">
          <ResultsPanel result={result} />
          <TutorPanel explanation={explanation} />
          <div className="section-heading compact">
            <LayoutDashboard size={18} />
            <h2>Instructor Snapshot</h2>
          </div>
          <InstructorPanel />
        </div>
      </section>
    </main>
  );
}

