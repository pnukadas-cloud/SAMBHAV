import type { CircuitIR } from "../types";

export interface LessonData {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  subtitle: string;
  duration: string;
  objective: string;
  theory: {
    intro: string;
    keyPoints: string[];
    mathSteps: { step: string; label: string; math: string; explanation: string }[];
  };
  initialCircuit: CircuitIR;
  quiz: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  miniChallenge: {
    title: string;
    instructions: string;
    expectedGoal: string;
  };
}

export const LESSONS_DATABASE: Record<string, LessonData> = {
  "superposition": {
    id: "superposition",
    courseId: "quantum-foundations",
    courseTitle: "Quantum Foundations",
    title: "1.2 Creating Superposition with Hadamard (H)",
    subtitle: "From Deterministic Bits to Quantum Probability Amplitudes",
    duration: "15 mins",
    objective: "Master how the Hadamard gate transforms a deterministic basis state into an equal quantum superposition with 50/50 measurement probabilities.",
    theory: {
      intro: "In classical computation, a bit is strictly either 0 or 1. In quantum computing, a qubit can exist in a linear combination of both basis states simultaneously. The Hadamard (H) gate is the fundamental quantum gate used to create this superposition.",
      keyPoints: [
        "A qubit state is written as |ψ⟩ = α|0⟩ + β|1⟩, where |α|² + |β|² = 1.",
        "The Hadamard gate acts as a unitary transformation that rotates the computational basis vector onto the equatorial plane of the Bloch sphere.",
        "When measured in the computational basis, a superposed state collapses to |0⟩ with probability |α|² and |1⟩ with probability |β|².",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Initial Ground State",
          math: "|ψ₀⟩ = |0⟩ = [1, 0]ᵀ",
          explanation: "The single-qubit register is prepared in the default ground state |0⟩.",
        },
        {
          step: "Step 2",
          label: "Hadamard Transformation",
          math: "H = 1/√2 * [[1, 1], [1, -1]]",
          explanation: "Applying matrix multiplication: H|0⟩ = 1/√2 [1, 1]ᵀ = (|0⟩ + |1⟩)/√2 = |+⟩.",
        },
        {
          step: "Step 3",
          label: "Measurement & Born Rule",
          math: "P(0) = |1/√2|² = 1/2 = 50%, P(1) = |1/√2|² = 1/2 = 50%",
          explanation: "Measuring the qubit yields 0 or 1 with equal 50% likelihood, collapsing the wave function.",
        },
      ],
    },
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "measure", targets: [0], classicalTargets: [0] },
      ],
    },
    quiz: {
      prompt: "What happens when you apply two consecutive Hadamard gates (H · H) to a qubit in state |0⟩?",
      options: [
        "The qubit remains in an entangled superposition state |+⟩.",
        "The qubit returns deterministically to the ground state |0⟩ because H is Hermitian and unitary (H² = I).",
        "The qubit flips to state |1⟩ due to phase interference.",
        "The quantum state becomes undefined and collapses automatically.",
      ],
      correctIndex: 1,
      explanation: "Correct! The Hadamard gate is self-inverse: H · H = I (the identity matrix). Applying it twice restores the original state |0⟩.",
    },
    miniChallenge: {
      title: "Superposition Inversion",
      instructions: "Apply an X gate before the H gate. Observe how |1⟩ transforms into the |−⟩ state (|0⟩ - |1⟩)/√2.",
      expectedGoal: "Equal 50% probabilities with a relative phase of π in the Dirac notation.",
    },
  },

  "bell-state": {
    id: "bell-state",
    courseId: "quantum-foundations",
    courseTitle: "Quantum Foundations",
    title: "2.1 Building a Bell State (|Φ⁺⟩)",
    subtitle: "Creating Maximal Quantum Entanglement with Hadamard and CNOT",
    duration: "20 mins",
    objective: "Understand how combining a Hadamard gate on qubit 0 with a Controlled-NOT gate across qubits 0 and 1 creates non-separable 2-qubit Einstein-Podolsky-Rosen (EPR) entanglement.",
    theory: {
      intro: "Quantum entanglement is a phenomenon where the quantum states of two or more qubits become intertwined such that neither qubit's state can be described independently of the other. The Bell state |Φ⁺⟩ is the quintessential maximally entangled state.",
      keyPoints: [
        "The 2-qubit Hilbert space has dimension 4: {|00⟩, |01⟩, |10⟩, |11⟩}.",
        "A separable state can be written as |ψ_A⟩ ⊗ |ψ_B⟩. An entangled state cannot be factored.",
        "Measuring one entangled qubit instantly correlates the outcome of the other qubit with 100% fidelity.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Register Initialization",
          math: "|ψ₀⟩ = |00⟩ = |0⟩ ⊗ |0⟩",
          explanation: "The 2-qubit system starts in the joint ground state.",
        },
        {
          step: "Step 2",
          label: "Superposition on Qubit 0",
          math: "|ψ₁⟩ = (H ⊗ I)|00⟩ = (|00⟩ + |10⟩)/√2",
          explanation: "Qubit 0 enters equal superposition while qubit 1 remains in state |0⟩.",
        },
        {
          step: "Step 3",
          label: "Controlled-NOT Entanglement",
          math: "|ψ₂⟩ = CX|ψ₁⟩ = (|00⟩ + |11⟩)/√2 = |Φ⁺⟩",
          explanation: "CX flips qubit 1 if and only if qubit 0 is |1⟩. Notice that |01⟩ and |10⟩ have 0 amplitude!",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    },
    quiz: {
      prompt: "Why does the Bell circuit produce only |00⟩ and |11⟩ outcomes with 50% probability each?",
      options: [
        "Because the CX gate destroys the |01⟩ and |10⟩ states through wave collapse.",
        "Because the H gate creates superposition on q0, and CX conditionally flips q1 only when q0 is |1⟩.",
        "Because quantum computers can only output states with equal bit values.",
        "Because measurement always forces all qubits to match the first qubit.",
      ],
      correctIndex: 1,
      explanation: "Correct! The Hadamard gate creates superposition (|0⟩+|1⟩)/√2 on q0. When CX acts with q0 as control, |0⟩⊗|0⟩ remains |00⟩ and |1⟩⊗|0⟩ becomes |11⟩.",
    },
    miniChallenge: {
      title: "Generate Bell State |Ψ⁺⟩",
      instructions: "Add an X gate on qubit 1 before the CNOT to create (|01⟩ + |10⟩)/√2.",
      expectedGoal: "Outcome probabilities of 50% |01⟩ and 50% |10⟩.",
    },
  },

  "ghz-state": {
    id: "ghz-state",
    courseId: "quantum-foundations",
    courseTitle: "Quantum Foundations",
    title: "2.2 Multi-Qubit GHZ Entanglement",
    subtitle: "Extending Entanglement to N Qubits: Greenberger-Horne-Zeilinger",
    duration: "25 mins",
    objective: "Learn how to generalize quantum entanglement across 3 or more qubits to synthesize macroscopic quantum superpositions.",
    theory: {
      intro: "The Greenberger-Horne-Zeilinger (GHZ) state is a maximally entangled quantum state involving three or more subsystems. It exhibits non-local correlations that cannot be explained by any local hidden variable theory.",
      keyPoints: [
        "For 3 qubits, the GHZ state is (|000⟩ + |111⟩)/√2.",
        "Measuring any single qubit in the computational basis instantly collapses all remaining qubits into the identical value.",
        "GHZ states are fundamental resources for quantum secret sharing and distributed quantum computing.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "H on Qubit 0",
          math: "|ψ₁⟩ = (|000⟩ + |100⟩)/√2",
          explanation: "Creates superposition in the first qubit.",
        },
        {
          step: "Step 2",
          label: "CX(0 → 1)",
          math: "|ψ₂⟩ = (|000⟩ + |110⟩)/√2",
          explanation: "Entangles qubit 0 with qubit 1.",
        },
        {
          step: "Step 3",
          label: "CX(1 → 2)",
          math: "|ψ₃⟩ = (|000⟩ + |111⟩)/√2 = |GHZ⟩",
          explanation: "Propagates entanglement to qubit 2.",
        },
      ],
    },
    initialCircuit: {
      qubits: 3,
      classicalBits: 3,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "cx", controls: [1], targets: [2] },
        { gate: "measure", targets: [0, 1, 2], classicalTargets: [0, 1, 2] },
      ],
    },
    quiz: {
      prompt: "If you measure only qubit 0 in a 3-qubit GHZ state and obtain '1', what is the state of qubits 1 and 2?",
      options: [
        "They remain in an entangled Bell state.",
        "They are in state |11⟩ with 100% certainty.",
        "They collapse to |00⟩ due to quantum conservation.",
        "Their states remain indeterminate until directly measured.",
      ],
      correctIndex: 1,
      explanation: "Correct! The GHZ state has non-zero amplitudes only for |000⟩ and |111⟩. A measurement of '1' on qubit 0 projects the whole register to |111⟩.",
    },
    miniChallenge: {
      title: "Synthesize 4-Qubit GHZ",
      instructions: "Extend the cascade to 4 qubits by adding a 4th qubit and CX(2 → 3).",
      expectedGoal: "50% |0000⟩ and 50% |1111⟩.",
    },
  },

  "pauli-gates": {
    id: "pauli-gates",
    courseId: "quantum-gates-logic",
    courseTitle: "Quantum Logic & Unitary Gates",
    title: "1.1 Pauli-X, Y, Z Matrix Transformations",
    subtitle: "The Fundamental Single-Qubit Rotations by π",
    duration: "15 mins",
    objective: "Master the Pauli matrices (σ_x, σ_y, σ_z) as single-qubit quantum logic gates and their geometric representation on the Bloch sphere.",
    theory: {
      intro: "The Pauli matrices are the cornerstone of quantum mechanics and quantum computation. Every single-qubit unitary operation can be expressed as a linear combination of the identity and the Pauli matrices.",
      keyPoints: [
        "Pauli-X: Bit-flip gate, equivalent to classical NOT. Rotates π radians around the X-axis.",
        "Pauli-Z: Phase-flip gate. Leaves |0⟩ unchanged, maps |1⟩ to -|1⟩.",
        "Pauli-Y: Bit and phase flip combined: Y = iXZ.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Pauli-X Transformation",
          math: "X|0⟩ = |1⟩,  X|1⟩ = |0⟩",
          explanation: "Bit flip matrix [[0, 1], [1, 0]].",
        },
        {
          step: "Step 2",
          label: "Pauli-Z Transformation",
          math: "Z|0⟩ = |0⟩,  Z|1⟩ = -|1⟩",
          explanation: "Phase flip matrix [[1, 0], [0, -1]].",
        },
        {
          step: "Step 3",
          label: "Pauli-Y Transformation",
          math: "Y|0⟩ = i|1⟩,  Y|1⟩ = -i|0⟩",
          explanation: "Matrix [[0, -i], [i, 0]].",
        },
      ],
    },
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "x", targets: [0] },
        { gate: "z", targets: [0] },
        { gate: "measure", targets: [0], classicalTargets: [0] },
      ],
    },
    quiz: {
      prompt: "What is the action of Pauli-Z on the superposition state |+⟩ = (|0⟩ + |1⟩)/√2?",
      options: [
        "It leaves |+⟩ unchanged.",
        "It transforms |+⟩ into |−⟩ = (|0⟩ - |1⟩)/√2.",
        "It flips |+⟩ to |0⟩.",
        "It produces the imaginary state i|+⟩.",
      ],
      correctIndex: 1,
      explanation: "Correct! Z|+⟩ = Z((|0⟩+|1⟩)/√2) = (Z|0⟩ + Z|1⟩)/√2 = (|0⟩ - |1⟩)/√2 = |−⟩.",
    },
    miniChallenge: {
      title: "Phase Flip Cancellation",
      instructions: "Apply two consecutive Z gates (Z · Z) to state |1⟩ and confirm Z² = I.",
      expectedGoal: "State |1⟩ with 100% measurement probability.",
    },
  },
};
