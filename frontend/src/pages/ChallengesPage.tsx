import {
  AlertTriangle,
  ArrowRight,
  Atom,
  Award,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { CircuitBuilder } from "../features/circuit-builder/CircuitBuilder";
import { ResultsPanel } from "../features/visualization/ResultsPanel";
import { evaluateChallenge, runSimulation } from "../api/client";
import { useToast } from "../context/ToastContext";
import type { CircuitIR, SimulationResult } from "../types";

export type Challenge = {
  id: string;
  title: string;
  category: "Beginner" | "Intermediate" | "Advanced";
  xp: number;
  description: string;
  task: string;
  initialCircuit: CircuitIR;
  targetExpected: string;
  hint: string;
  verify: (res: SimulationResult) => boolean;
  completed?: boolean;
};

export const CHALLENGES_LIST: Challenge[] = [
  {
    id: "create-superposition",
    title: "1. Create an Equal Superposition (|+⟩)",
    category: "Beginner",
    xp: 50,
    description: "Prepare a single qubit in the equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2.",
    task: "Place a Hadamard (H) gate on qubit 0. Measurement should yield ~50% |0⟩ and ~50% |1⟩.",
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [],
    },
    targetExpected: "50% |0⟩ and 50% |1⟩ (Dirac: |ψ⟩ = 0.707|0⟩ + 0.707|1⟩)",
    hint: "Use the green H gate from the palette on qubit 0.",
    verify: (res) => {
      const p0 = res.probabilities["0"] || 0;
      const p1 = res.probabilities["1"] || 0;
      return Math.abs(p0 - 0.5) < 0.05 && Math.abs(p1 - 0.5) < 0.05;
    },
    completed: true,
  },
  {
    id: "build-bell-state",
    title: "2. Construct the Standard Bell State (|Φ⁺⟩)",
    category: "Beginner",
    xp: 100,
    description: "Generate a 2-qubit maximally entangled Bell state with 50% |00⟩ and 50% |11⟩ correlation.",
    task: "Apply an H gate on qubit 0, followed by a CX gate with control on q0 and target on q1.",
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [],
    },
    targetExpected: "50% |00⟩ and 50% |11⟩ with 0% |01⟩/|10⟩ (Dirac: |ψ⟩ = 0.707|00⟩ + 0.707|11⟩)",
    hint: "H on q0 creates superposition; CX(0, 1) copies the relationship onto q1.",
    verify: (res) => {
      const p00 = res.probabilities["00"] || 0;
      const p11 = res.probabilities["11"] || 0;
      return Math.abs(p00 - 0.5) < 0.05 && Math.abs(p11 - 0.5) < 0.05;
    },
    completed: true,
  },
  {
    id: "construct-ghz-state",
    title: "3. Build a 3-Qubit GHZ State",
    category: "Intermediate",
    xp: 150,
    description: "Entangle three qubits such that measurement yields 50% |000⟩ and 50% |111⟩.",
    task: "Apply H on q0, CX(q0, q1), and CX(q1, q2).",
    initialCircuit: {
      qubits: 3,
      classicalBits: 3,
      operations: [],
    },
    targetExpected: "50% |000⟩ and 50% |111⟩ with 0% other states.",
    hint: "Cascade the CX gates: first from q0 to q1, then from q1 to q2.",
    verify: (res) => {
      const p000 = res.probabilities["000"] || 0;
      const p111 = res.probabilities["111"] || 0;
      return Math.abs(p000 - 0.5) < 0.05 && Math.abs(p111 - 0.5) < 0.05;
    },
  },
  {
    id: "quantum-bit-flip-swap",
    title: "4. State Transfer via SWAP",
    category: "Intermediate",
    xp: 120,
    description: "Initialize qubit 0 to |1⟩ and swap it so qubit 1 ends in |1⟩ and qubit 0 in |0⟩.",
    task: "Apply an X gate on q0, followed by a SWAP(0, 1) gate. Outcome must be 100% |01⟩.",
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [],
    },
    targetExpected: "100% |01⟩ (Statevector |01⟩ = 1.0)",
    hint: "Use X on q0 to flip it to |1⟩, then use the SWAP gate between q0 and q1.",
    verify: (res) => {
      const p01 = res.probabilities["01"] || 0;
      return Math.abs(p01 - 1.0) < 0.05;
    },
  },
  {
    id: "phase-kickback-interference",
    title: "5. Observable CZ Phase Kickback",
    category: "Advanced",
    xp: 200,
    description: "Demonstrate that CZ creates an observable phase flip when preceded and followed by Hadamard gates.",
    task: "Apply X on q0, H on q1, CZ(0, 1), and H on q1. Output must be 100% |11⟩.",
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [],
    },
    targetExpected: "100% |11⟩",
    hint: "X(0) sets the control to 1 so CZ triggers a phase flip on q1; the second H on q1 converts the phase into |1⟩.",
    verify: (res) => {
      const p11 = res.probabilities["11"] || 0;
      return Math.abs(p11 - 1.0) < 0.05;
    },
  },
];

export function ChallengesPage() {
  const { showToast } = useToast();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge>(CHALLENGES_LIST[0]);
  const [circuit, setCircuit] = useState<CircuitIR>(CHALLENGES_LIST[0].initialCircuit);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<"untested" | "passed" | "failed">("untested");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  function handleSelectChallenge(c: Challenge) {
    setSelectedChallenge(c);
    setCircuit(c.initialCircuit);
    setResult(null);
    setEvaluationStatus("untested");
    setFeedback(null);
  }

  async function handleEvaluate() {
    if (!circuit.operations || circuit.operations.length === 0) {
      showToast("Please place gates on the canvas before submitting.", "warning");
      return;
    }
    setIsEvaluating(true);
    try {
      // 1. Run simulation locally for instant visualization
      const sim = await runSimulation(circuit);
      setResult(sim);

      // 2. Call backend automated grading
      try {
        const evalRes = await evaluateChallenge(selectedChallenge.id, circuit);
        if (evalRes.passed) {
          setEvaluationStatus("passed");
          setFeedback(evalRes.feedback || `🎉 Excellent work! Your circuit meets all target requirements. +${evalRes.xp_earned} XP awarded.`);
          showToast(`Challenge Passed! +${evalRes.xp_earned} XP`, "success", "Challenge Complete");
        } else {
          setEvaluationStatus("failed");
          setFeedback(evalRes.feedback || "The simulation output does not match the target distribution. Check your gate choices and wire order.");
          showToast("Output does not match target. Try again!", "error", "Verification Failed");
        }
      } catch {
        // Fallback to local verify if offline
        const isPassed = selectedChallenge.verify(sim);
        if (isPassed) {
          setEvaluationStatus("passed");
          setFeedback(`🎉 Excellent work! Your circuit meets the target state requirements. +${selectedChallenge.xp} XP awarded.`);
          showToast(`Challenge Passed! +${selectedChallenge.xp} XP`, "success", "Challenge Complete");
        } else {
          setEvaluationStatus("failed");
          setFeedback("The simulation output does not match the target distribution. Check your gate choices, target wires, and gate sequence.");
          showToast("Output does not match target. Try again!", "error", "Verification Failed");
        }
      }
    } catch {
      showToast("Evaluation execution failed.", "error");
    } finally {
      setIsEvaluating(false);
    }
  }

  return (
    <AppShell activeTitle="Challenges & Assessments" activeCategory="Practice">
      <div className="challenges-page-container">
        {/* Header */}
        <div className="challenges-header-banner">
          <div className="challenges-header-text">
            <span className="challenges-eyebrow">PRACTICAL SKILL ASSESSMENTS</span>
            <h2>Quantum Challenges & Quizzes</h2>
            <p>
              Put your quantum intuition to the test. Build circuits that satisfy specific target states, evaluate against simulation ground truth, and earn XP.
            </p>
          </div>
          <div className="challenges-header-stats">
            <div className="xp-pill">
              <Trophy size={16} className="text-amber" />
              <strong>620 Total XP Available</strong>
            </div>
          </div>
        </div>

        {/* Split: Challenge List Left, Interactive Solver Right */}
        <div className="challenges-split-layout">
          {/* Challenge Selector Column */}
          <div className="challenges-list-col">
            {CHALLENGES_LIST.map((item) => (
              <div
                key={item.id}
                className={`challenge-card ${selectedChallenge.id === item.id ? "selected" : ""}`}
                onClick={() => handleSelectChallenge(item)}
              >
                <div className="challenge-card-header">
                  <span className={`diff-pill ${item.category.toLowerCase()}`}>{item.category}</span>
                  <span className="xp-badge">+{item.xp} XP</span>
                </div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <div className="challenge-card-footer">
                  <span className="challenge-status">
                    {item.completed ? (
                      <span className="completed-text">
                        <CheckCircle2 size={14} className="text-teal" /> Solved
                      </span>
                    ) : (
                      "Unsolved"
                    )}
                  </span>
                  <span className="select-arrow">Solve →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Challenge Solver Pane */}
          <div className="challenge-solver-pane">
            <div className="solver-header">
              <div className="solver-title-group">
                <span className={`diff-pill ${selectedChallenge.category.toLowerCase()}`}>
                  {selectedChallenge.category}
                </span>
                <h3>{selectedChallenge.title}</h3>
              </div>
              <div className="solver-xp-tag">Reward: +{selectedChallenge.xp} XP</div>
            </div>

            <div className="solver-task-card">
              <h4>🎯 Goal</h4>
              <p>{selectedChallenge.task}</p>
              <div className="target-outcome-box">
                <strong>Target Outcome:</strong> {selectedChallenge.targetExpected}
              </div>
              <div className="hint-box">
                <strong>💡 Hint:</strong> {selectedChallenge.hint}
              </div>
            </div>

            {/* Evaluation Result Alert */}
            {evaluationStatus !== "untested" && (
              <div className={`eval-feedback-card ${evaluationStatus}`}>
                {evaluationStatus === "passed" ? (
                  <CheckCircle2 size={20} className="text-teal" />
                ) : (
                  <XCircle size={20} className="text-coral" />
                )}
                <div className="eval-text">
                  <h5>{evaluationStatus === "passed" ? "Challenge Complete!" : "Target Not Met"}</h5>
                  <p>{feedback}</p>
                </div>
              </div>
            )}

            {/* Interactive Builder */}
            <div className="solver-canvas-wrapper">
              <div className="canvas-header-bar">
                <span>Circuit Canvas ({circuit.qubits} Qubits)</span>
                <button
                  className="canvas-reset-btn"
                  onClick={() => setCircuit(selectedChallenge.initialCircuit)}
                  title="Reset canvas"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
              <CircuitBuilder circuit={circuit} onChange={setCircuit} />
            </div>

            {/* Submit / Verify Button */}
            <div className="solver-submit-bar">
              <button
                className="solver-submit-btn"
                onClick={handleEvaluate}
                disabled={isEvaluating}
              >
                <Sparkles size={16} />
                <span>{isEvaluating ? "Evaluating Output..." : "Submit & Verify Circuit"}</span>
              </button>
            </div>

            {/* Simulation Results */}
            <div className="solver-results-wrapper">
              <h4>Simulation Verification</h4>
              <ResultsPanel result={result} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
