import {
  ArrowRight,
  Atom,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "../router/Router";
import { AppShell } from "../components/layout/AppShell";
import { runSimulation } from "../api/client";
import { ResultsPanel } from "../features/visualization/ResultsPanel";
import { useToast } from "../context/ToastContext";
import type { CircuitIR, SimulationResult } from "../types";

export type AlgorithmItem = {
  id: string;
  name: string;
  moduleTitle: string;
  moduleId: string;
  lessonId: string;
  category: "Foundations" | "Entanglement" | "Protocols" | "Search & Estimation" | "Applications" | "Error Correction";
  description: string;
  complexity: "O(1)" | "O(√N)" | "O(log N)" | "O(poly(n))";
  qubits: number;
  circuit: CircuitIR;
  theory: string;
  steps: string[];
  significance: string;
};

export const ALGORITHMS_DATA: AlgorithmItem[] = [
  {
    id: "bell-state",
    name: "Bell State Generation (|Φ⁺⟩)",
    moduleTitle: "Module 2: Multi-Qubit Systems",
    moduleId: "module-2",
    lessonId: "bell-state",
    category: "Foundations",
    description: "Creates maximally entangled 2-qubit Einstein-Podolsky-Rosen (EPR) pairs with perfect correlation.",
    complexity: "O(1)",
    qubits: 2,
    circuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    },
    theory: "Transforms independent product states |00⟩ into the entangled state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 using Hadamard and CNOT.",
    steps: [
      "Initialize qubits in state |00⟩",
      "Apply Hadamard on q0 → (|0⟩ + |1⟩)/√2 ⊗ |0⟩",
      "Apply CX(q0, q1) → (|00⟩ + |11⟩)/√2",
      "Measure in Z-basis → 50% |00⟩, 50% |11⟩",
    ],
    significance: "Fundamental building block for quantum teleportation, superdense coding, and quantum key distribution (E91).",
  },
  {
    id: "ghz-state",
    name: "GHZ 3-Qubit Entangled State",
    moduleTitle: "Module 2: Multi-Qubit Systems",
    moduleId: "module-2",
    lessonId: "ghz-state",
    category: "Entanglement",
    description: "Generates the Greenberger-Horne-Zeilinger state demonstrating non-local multipartite quantum correlation.",
    complexity: "O(1)",
    qubits: 3,
    circuit: {
      qubits: 3,
      classicalBits: 3,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "cx", controls: [1], targets: [2] },
        { gate: "measure", targets: [0, 1, 2], classicalTargets: [0, 1, 2] },
      ],
    },
    theory: "A 3-qubit maximally entangled state |GHZ⟩ = (|000⟩ + |111⟩)/√2 that strictly refutes local hidden variable theories.",
    steps: [
      "Initialize 3 qubits in |000⟩",
      "Apply H on q0 → (|0⟩ + |1⟩)/√2 ⊗ |00⟩",
      "Apply CX(q0, q1) → (|00⟩ + |11⟩)/√2 ⊗ |0⟩",
      "Apply CX(q1, q2) → (|000⟩ + |111⟩)/√2",
      "Measure all 3 qubits → 50% |000⟩, 50% |111⟩",
    ],
    significance: "Crucial for quantum error correction codes (Shor code) and multipartite quantum cryptography.",
  },
  {
    id: "deutsch-jozsa",
    name: "Deutsch-Jozsa Algorithm",
    moduleTitle: "Module 4: Fundamental Algorithms",
    moduleId: "module-4",
    lessonId: "deutsch-jozsa",
    category: "Search & Estimation",
    description: "Determines if an oracle boolean function is constant or balanced in a single quantum query.",
    complexity: "O(1)",
    qubits: 2,
    circuit: {
      qubits: 2,
      classicalBits: 1,
      operations: [
        { gate: "x", targets: [1] },
        { gate: "h", targets: [0] },
        { gate: "h", targets: [1] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "h", targets: [0] },
        { gate: "measure", targets: [0], classicalTargets: [0] },
      ],
    },
    theory: "Uses quantum parallelism and phase kickback to evaluate f(0) ⊕ f(1) in O(1) query versus classical O(2^(n-1)+1).",
    steps: [
      "Prepare ancilla qubit in |1⟩ using X gate",
      "Apply Hadamard on both input and ancilla qubits",
      "Apply Balanced Oracle via CX(q0, q1) to induce phase kickback (-1)^f(x)",
      "Apply Hadamard on input qubit to create constructive/destructive interference",
      "Measure q0: |0⟩ indicates Constant function, |1⟩ indicates Balanced function",
    ],
    significance: "One of the earliest deterministic demonstrations of exponential quantum speedup over classical computation.",
  },
  {
    id: "quantum-teleportation",
    name: "Quantum Teleportation Protocol",
    moduleTitle: "Module 5: Quantum Information",
    moduleId: "module-5",
    lessonId: "teleportation",
    category: "Protocols",
    description: "Transfers an unknown quantum state |ψ⟩ from Alice to Bob using a shared Bell pair and 2 classical bits.",
    complexity: "O(1)",
    qubits: 3,
    circuit: {
      qubits: 3,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [1] },
        { gate: "cx", controls: [1], targets: [2] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "h", targets: [0] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    },
    theory: "Transfers quantum information without violating the No-Cloning Theorem by performing a joint Bell-state measurement.",
    steps: [
      "Alice and Bob share an entangled Bell pair on q1 and q2",
      "Alice interacts her unknown state q0 with her half of the Bell pair q1 using CX and H",
      "Alice measures q0 and q1 in computational basis",
      "Alice transmits 2 classical bits to Bob",
      "Bob applies conditional X and Z corrections to reconstruct |ψ⟩ perfectly on q2",
    ],
    significance: "The foundation of the Quantum Internet and distributed quantum computing networks.",
  },
  {
    id: "superdense-coding",
    name: "Superdense Coding Protocol",
    moduleTitle: "Module 5: Quantum Information",
    moduleId: "module-5",
    lessonId: "superdense-coding",
    category: "Protocols",
    description: "Transmits two classical bits of information by sending only one physical quantum bit over a pre-shared Bell state.",
    complexity: "O(1)",
    qubits: 2,
    circuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "x", targets: [0] },
        { gate: "z", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "h", targets: [0] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    },
    theory: "Alice applies one of {I, X, Z, XZ} Pauli operators to her qubit, mapping between the 4 orthogonal Bell states.",
    steps: [
      "Generate shared Bell pair |Φ⁺⟩",
      "Alice encodes two classical bits (e.g. '11' using X and Z gates)",
      "Alice sends her single qubit to Bob",
      "Bob performs Bell-basis decoding using CX and H",
      "Bob measures both qubits to recover the two transmitted bits with 100% fidelity",
    ],
    significance: "Demonstrates quantum channel capacity doubling via entanglement.",
  },
  {
    id: "grovers-search",
    name: "Grover's Search Algorithm (2-Qubit)",
    moduleTitle: "Module 4: Fundamental Algorithms",
    moduleId: "module-4",
    lessonId: "grovers-search",
    category: "Search & Estimation",
    description: "Locates a marked item in an unsorted database of N elements in O(√N) queries via amplitude amplification.",
    complexity: "O(√N)",
    qubits: 2,
    circuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "h", targets: [1] },
        { gate: "cz", controls: [0], targets: [1] },
        { gate: "h", targets: [0] },
        { gate: "h", targets: [1] },
        { gate: "x", targets: [0] },
        { gate: "x", targets: [1] },
        { gate: "cz", controls: [0], targets: [1] },
        { gate: "x", targets: [0] },
        { gate: "x", targets: [1] },
        { gate: "h", targets: [0] },
        { gate: "h", targets: [1] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    },
    theory: "Alternates Oracle phase inversion with the Grover Diffusion Operator (inversion about the mean) to amplify the marked state's probability to ~100%.",
    steps: [
      "Initialize equal superposition with Hadamard gates on all qubits",
      "Apply Oracle: Controlled-Z marks target state |11⟩ with phase -1",
      "Apply Diffusion Operator: Inversion about the mean (H-X-CZ-X-H)",
      "Measure: Target state |11⟩ appears with 100% probability",
    ],
    significance: "Quadratic speedup for unstructured search, SAT solvers, and cryptographic analysis.",
  },
  {
    id: "qpe",
    name: "Quantum Phase Estimation (QPE)",
    moduleTitle: "Module 4: Fundamental Algorithms",
    moduleId: "module-4",
    lessonId: "qpe-shor",
    category: "Search & Estimation",
    description: "Estimates the unknown phase θ in the eigenvalue e^(2πiθ) of a unitary operator acting on an eigenstate.",
    complexity: "O(poly(n))",
    qubits: 2,
    circuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "x", targets: [1] },
        { gate: "h", targets: [0] },
        { gate: "cz", controls: [0], targets: [1] },
        { gate: "h", targets: [0] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    },
    theory: "Extracts eigenphase information into the relative phase of a counting qubit register, then applies Inverse Quantum Fourier Transform (QFT) to read out the binary phase.",
    steps: [
      "Prepare eigenstate |u⟩ on target register (e.g. state |1⟩ for Pauli-Z)",
      "Apply Hadamard on counting qubit q0",
      "Apply Controlled-Unitary (CZ) to impart phase e^(iπ) = -1 onto counting qubit",
      "Apply Inverse QFT (Hadamard on q0)",
      "Measure counting qubit: deterministic binary readout of θ = 0.5 (binary .1)",
    ],
    significance: "The core quantum subroutine behind Shor's factoring algorithm, quantum chemistry simulations, and HHL linear system solver.",
  },
  {
    id: "shor-error-code",
    name: "3-Qubit Bit-Flip Error Correction",
    moduleTitle: "Module 6: Error Correction",
    moduleId: "module-6",
    lessonId: "shor-error-code",
    category: "Error Correction",
    description: "Protects a single quantum bit against arbitrary bit-flip noise using a 3-qubit repetition encoding.",
    complexity: "O(1)",
    qubits: 3,
    circuit: {
      qubits: 3,
      classicalBits: 3,
      operations: [
        { gate: "x", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "cx", controls: [0], targets: [2] },
        { gate: "measure", targets: [0, 1, 2], classicalTargets: [0, 1, 2] },
      ],
    },
    theory: "Encodes logical |0⟩_L = |000⟩ and |1⟩_L = |111⟩ to identify and correct single-qubit bit-flip faults without collapsing quantum superposition.",
    steps: [
      "Initialize data qubit |ψ⟩ = α|0⟩ + β|1⟩",
      "Apply CX(0, 1) and CX(0, 2) to encode into α|000⟩ + β|111⟩",
      "Simulate noisy environment / error occurrence",
      "Measure syndrome parity to isolate flipped qubit without disturbing superposition",
      "Apply corrective Pauli-X to restore ideal state",
    ],
    significance: "The foundational building block of fault-tolerant quantum computing and stabilizer codes.",
  },
];

export function AlgorithmsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmItem>(ALGORITHMS_DATA[0]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  async function handleSimulate(algo: AlgorithmItem) {
    setIsSimulating(true);
    try {
      const sim = await runSimulation(algo.circuit);
      setResult(sim);
      showToast(`Simulation computed for ${algo.name}`, "success");
    } catch {
      showToast("Simulation failed.", "error");
    } finally {
      setIsSimulating(false);
    }
  }

  function handleOpenInLab(algo: AlgorithmItem) {
    showToast(`Loaded ${algo.name} into Quantum Lab`, "info");
    navigate("/lab");
  }

  return (
    <AppShell activeTitle="Algorithm Library" activeCategory="Algorithms">
      <div className="algorithms-page-container">
        {/* Header */}
        <div className="algo-header-banner">
          <div className="algo-header-text">
            <span className="algo-eyebrow">VERIFIED QUANTUM ALGORITHMS</span>
            <h2>Interactive Algorithm Library</h2>
            <p>
              Explore and simulate canonical quantum algorithms with step-by-step physical derivations, complexity benchmarks, and instant lab execution.
            </p>
          </div>
        </div>

        {/* 2-Column Layout: Algorithm Selector Left, Active Algorithm Breakdown Right */}
        <div className="algo-split-layout">
          {/* Left Cards List */}
          <div className="algo-list-col">
            {ALGORITHMS_DATA.map((algo) => (
              <div
                key={algo.id}
                className={`algo-summary-card ${selectedAlgo.id === algo.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedAlgo(algo);
                  setResult(null);
                }}
              >
                <div className="algo-card-top">
                  <span className="algo-cat-tag">{algo.category}</span>
                  <span className="algo-complexity-tag">{algo.complexity}</span>
                </div>
                <h4>{algo.name}</h4>
                <p>{algo.description}</p>
                <div className="algo-card-footer">
                  <span>{algo.qubits} Qubits</span>
                  <span className="select-hint">{selectedAlgo.id === algo.id ? "Active" : "Inspect"} →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Detail Pane */}
          <div className="algo-detail-pane">
            <div className="algo-detail-header">
              <div className="detail-title-group">
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <span className="detail-cat">{selectedAlgo.category}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#0284c7", background: "rgba(13, 148, 136, 0.1)", padding: "2px 8px", borderRadius: "999px" }}>
                    {selectedAlgo.moduleTitle}
                  </span>
                </div>
                <h3>{selectedAlgo.name}</h3>
                <span className="detail-speedup">Computational Speedup: {selectedAlgo.complexity}</span>
              </div>

              <div className="detail-actions">
                <button
                  className="algo-action-btn primary"
                  onClick={() => handleSimulate(selectedAlgo)}
                  disabled={isSimulating}
                >
                  <Play size={16} /> {isSimulating ? "Simulating..." : "Simulate Algorithm"}
                </button>
                <Link
                  to={`/learn/${selectedAlgo.moduleId}/${selectedAlgo.lessonId}`}
                  className="algo-action-btn"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0fdf4", color: "#166534", border: "1.5px solid #bbf7d0" }}
                >
                  <BookOpen size={16} /> Study Theory
                </Link>
                <button
                  className="algo-action-btn secondary"
                  onClick={() => handleOpenInLab(selectedAlgo)}
                >
                  <BrainCircuit size={16} /> Open in Lab IDE
                </button>
              </div>
            </div>

            {/* Theory & Significance */}
            <div className="algo-content-card">
              <h4>Theoretical Foundation</h4>
              <p>{selectedAlgo.theory}</p>
            </div>

            <div className="algo-content-card">
              <h4>Step-by-Step Execution Flow</h4>
              <ol className="algo-steps-list">
                {selectedAlgo.steps.map((step, idx) => (
                  <li key={idx}>
                    <strong>Step {idx + 1}:</strong> {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="algo-content-card">
              <h4>Why This Algorithm Matters</h4>
              <p>{selectedAlgo.significance}</p>
            </div>

            {/* Live Simulation Results */}
            <div className="algo-simulation-section">
              <h4>Simulation Outcome</h4>
              <ResultsPanel result={result} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
