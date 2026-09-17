import type { CircuitIR } from "../types";

export interface MathStep {
  step: string;
  label: string;
  math: string;
  explanation: string;
}

export interface LessonData {
  id: string;
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  title: string;
  subtitle: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  objective: string;
  prerequisites: string[];
  theory: {
    intro: string;
    keyPoints: string[];
    mathSteps: MathStep[];
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
  labLink?: string;
}

export interface CurriculumModule {
  id: string;
  moduleNumber: number;
  title: string;
  tagline: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: string;
  prerequisites: string;
  topics: string[];
  hasLab: boolean;
  hasAssessment: boolean;
  lessons: {
    id: string;
    title: string;
    duration: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
  }[];
}

export const UNIFIED_CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: "module-0",
    moduleNumber: 0,
    title: "Mathematical & Computational Foundations",
    tagline: "Linear algebra, complex vector spaces, probability & computational complexity",
    difficulty: "Beginner",
    estimatedHours: "4 Hours",
    prerequisites: "High school algebra & basic programming",
    hasLab: true,
    hasAssessment: true,
    topics: [
      "Complex numbers",
      "Vectors and vector spaces",
      "Basis and orthogonality",
      "Inner products",
      "Matrix algebra",
      "Eigenvalues and eigenvectors",
      "Tensor products",
      "Probability distributions",
      "Basic algorithms",
      "Computational complexity",
      "Python/programming foundations",
    ],
    lessons: [
      { id: "complex-vectors", title: "0.1 Complex Numbers, Vectors & Orthogonality", duration: "20 mins", difficulty: "Beginner" },
      { id: "matrix-tensor-products", title: "0.2 Matrix Algebra, Eigenvalues & Tensor Products", duration: "25 mins", difficulty: "Beginner" },
      { id: "prob-complexity", title: "0.3 Probability Distributions & Computational Complexity", duration: "20 mins", difficulty: "Beginner" },
    ],
  },
  {
    id: "module-1",
    moduleNumber: 1,
    title: "Quantum Foundations",
    tagline: "Postulates of quantum mechanics, Hilbert space, statevectors & Dirac notation",
    difficulty: "Beginner",
    estimatedHours: "5 Hours",
    prerequisites: "Module 0 (Linear Algebra & Complex Numbers)",
    hasLab: true,
    hasAssessment: true,
    topics: [
      "Postulates of quantum mechanics",
      "Hilbert spaces",
      "State vectors",
      "Bra-ket / Dirac notation",
      "Qubits",
      "Computational basis",
      "Probability amplitudes",
      "Superposition",
      "Global and relative phase",
      "Bloch sphere",
      "Observables",
      "Hermitian operators",
      "Expectation values",
      "Measurement collapse & Born rule",
      "Uncertainty principle",
      "Unitary transformations",
      "Schrödinger & time evolution",
    ],
    lessons: [
      { id: "qubit-basics", title: "1.1 The Qubit, Dirac Notation & Bloch Sphere", duration: "18 mins", difficulty: "Beginner" },
      { id: "superposition", title: "1.2 Creating Superposition with Hadamard (H)", duration: "15 mins", difficulty: "Beginner" },
      { id: "measurement", title: "1.3 Measurement Collapse & The Born Rule", duration: "18 mins", difficulty: "Beginner" },
      { id: "observables-evolution", title: "1.4 Observables, Hermitian Operators & Unitary Time Evolution", duration: "22 mins", difficulty: "Beginner" },
    ],
  },
  {
    id: "module-2",
    moduleNumber: 2,
    title: "Multi-Qubit Systems & Quantum Circuits",
    tagline: "Composite Hilbert spaces, entanglement, Bell states & universal quantum gates",
    difficulty: "Intermediate",
    estimatedHours: "6 Hours",
    prerequisites: "Module 1 (Quantum Foundations)",
    hasLab: true,
    hasAssessment: true,
    topics: [
      "Multi-qubit states",
      "Tensor products",
      "Entanglement",
      "Bell states",
      "No-cloning theorem",
      "X, Y, Z gates",
      "Hadamard gate",
      "S and T gates",
      "Rx, Ry, Rz rotations",
      "Controlled gates (CNOT, CZ)",
      "SWAP networks",
      "Quantum circuits",
      "Circuit measurement",
      "Circuit depth",
      "Reversible computation",
      "Universal gate sets",
      "Circuit visualization",
    ],
    lessons: [
      { id: "pauli-rotations", title: "2.1 Pauli Transformations & Continuous Rotations (Rx, Ry, Rz)", duration: "20 mins", difficulty: "Intermediate" },
      { id: "phase-gates", title: "2.2 Phase Shifts & Universality: S and T Gates", duration: "20 mins", difficulty: "Intermediate" },
      { id: "bell-state", title: "2.3 Building a Bell State (|Φ⁺⟩) & Entanglement", duration: "20 mins", difficulty: "Intermediate" },
      { id: "ghz-state", title: "2.4 Multi-Qubit GHZ State & SWAP Networks", duration: "25 mins", difficulty: "Intermediate" },
    ],
  },
  {
    id: "module-3",
    moduleNumber: 3,
    title: "Quantum Programming & Simulation Lab",
    tagline: "Interactive circuit design, statevector simulation, Bloch spheres & Qiskit export",
    difficulty: "Intermediate",
    estimatedHours: "4 Hours",
    prerequisites: "Module 2 (Multi-Qubit Systems)",
    hasLab: true,
    hasAssessment: true,
    topics: [
      "Interactive circuit construction",
      "Quantum simulation",
      "Statevector inspection",
      "Probability distributions",
      "Shot-based simulation",
      "Bloch-sphere visualization",
      "Qiskit programming",
      "Quantum code generation",
      "Circuit/code relationship",
      "Quantum debugging",
      "Circuit optimization",
      "Simulator concepts",
      "Cloud quantum computing concepts",
    ],
    lessons: [
      { id: "statevector-simulation", title: "3.1 Interactive Quantum Simulation & Statevector Inspection", duration: "20 mins", difficulty: "Intermediate" },
      { id: "qiskit-code-gen", title: "3.2 Qiskit Code Generation & Python Integration", duration: "22 mins", difficulty: "Intermediate" },
      { id: "circuit-optimization", title: "3.3 Quantum Debugging, Depth & Circuit Optimization", duration: "25 mins", difficulty: "Intermediate" },
    ],
  },
  {
    id: "module-4",
    moduleNumber: 4,
    title: "Fundamental Quantum Algorithms",
    tagline: "Oracles, phase kickback, Grover's search, QPE & Shor's algorithm",
    difficulty: "Advanced",
    estimatedHours: "8 Hours",
    prerequisites: "Module 2 & Module 3 (Circuits & Simulation)",
    hasLab: true,
    hasAssessment: true,
    topics: [
      "Quantum algorithmic advantage",
      "Oracle model",
      "Deutsch algorithm",
      "Deutsch-Jozsa algorithm",
      "Bernstein-Vazirani algorithm",
      "Simon's periodicity algorithm",
      "Grover's search",
      "Amplitude amplification",
      "Quantum Fourier Transform (QFT)",
      "Phase kickback",
      "Quantum Phase Estimation (QPE)",
      "Shor's factoring algorithm",
    ],
    lessons: [
      { id: "deutsch-jozsa", title: "4.1 Quantum Oracles: Deutsch & Deutsch-Jozsa Algorithm", duration: "30 mins", difficulty: "Advanced" },
      { id: "bernstein-simon", title: "4.2 Bernstein-Vazirani & Simon's Periodicity Algorithm", duration: "35 mins", difficulty: "Advanced" },
      { id: "grovers-search", title: "4.3 Grover's Search & Amplitude Amplification", duration: "45 mins", difficulty: "Advanced" },
      { id: "qpe-shor", title: "4.4 Quantum Phase Estimation (QPE) & Shor's Factoring", duration: "50 mins", difficulty: "Advanced" },
    ],
  },
  {
    id: "module-5",
    moduleNumber: 5,
    title: "Quantum Information & Communication",
    tagline: "Density matrices, quantum channels, teleportation, superdense coding & QKD",
    difficulty: "Advanced",
    estimatedHours: "6 Hours",
    prerequisites: "Module 2 (Multi-Qubit Systems)",
    hasLab: true,
    hasAssessment: true,
    topics: [
      "Classical vs quantum information",
      "Shannon entropy",
      "Mutual information",
      "Density matrices",
      "Pure states and mixed states",
      "Partial trace",
      "Quantum channels",
      "Quantum noise",
      "Von Neumann entropy",
      "General quantum measurements",
      "Quantum teleportation",
      "Superdense coding",
      "Bell/CHSH inequality concepts",
      "Quantum cryptography",
      "BB84 protocol",
      "B92 protocol",
    ],
    lessons: [
      { id: "teleportation", title: "5.1 Quantum Teleportation Protocol", duration: "35 mins", difficulty: "Advanced" },
      { id: "superdense-coding", title: "5.2 Superdense Coding: Transmitting 2 Bits with 1 Qubit", duration: "25 mins", difficulty: "Advanced" },
      { id: "density-matrices", title: "5.3 Density Matrices, Mixed States & Von Neumann Entropy", duration: "30 mins", difficulty: "Advanced" },
      { id: "bb84-cryptography", title: "5.4 Quantum Key Distribution: BB84 & B92 Protocols", duration: "30 mins", difficulty: "Advanced" },
    ],
  },
  {
    id: "module-6",
    moduleNumber: 6,
    title: "Quantum Noise & Error Correction",
    tagline: "Decoherence (T1/T2), stabilizer codes, Shor's 9-qubit code & fault tolerance",
    difficulty: "Advanced",
    estimatedHours: "6 Hours",
    prerequisites: "Module 2 & Module 5 (Circuits & Information)",
    hasLab: true,
    hasAssessment: true,
    topics: [
      "Decoherence",
      "Bit-flip errors",
      "Phase-flip errors",
      "Quantum noise channels",
      "Error detection",
      "Error correction",
      "Repetition codes",
      "Shor 9-qubit code",
      "Stabilizer formalism",
      "CSS codes",
      "Surface codes",
      "Fault-tolerant quantum computing",
      "Threshold theorem",
    ],
    lessons: [
      { id: "noise-decoherence", title: "6.1 Quantum Noise Channels, Relaxation (T1) & Dephasing (T2)", duration: "25 mins", difficulty: "Advanced" },
      { id: "shor-error-code", title: "6.2 Quantum Error Correction: Bit-Flip & Shor 9-Qubit Code", duration: "35 mins", difficulty: "Advanced" },
      { id: "stabilizer-surface-codes", title: "6.3 Stabilizer Formalism, Surface Codes & Fault Tolerance", duration: "40 mins", difficulty: "Advanced" },
    ],
  },
  {
    id: "module-7",
    moduleNumber: 7,
    title: "Quantum Computing Applications",
    tagline: "Variational algorithms (VQE, QAOA), quantum chemistry, QML & post-quantum security",
    difficulty: "Advanced",
    estimatedHours: "6 Hours",
    prerequisites: "Module 4 (Quantum Algorithms)",
    hasLab: true,
    hasAssessment: true,
    topics: [
      "Quantum simulation",
      "Quantum chemistry",
      "VQE (Variational Quantum Eigensolver)",
      "QAOA (Quantum Approximate Optimization)",
      "Quantum optimization",
      "Quantum machine learning (QML)",
      "Quantum cryptography",
      "Post-quantum cryptography (PQC)",
      "Quantum sensing",
      "Quantum metrology",
      "Quantum communication networks",
    ],
    lessons: [
      { id: "vqe-quantum-chemistry", title: "7.1 Variational Quantum Eigensolver (VQE) & Molecular Simulation", duration: "35 mins", difficulty: "Advanced" },
      { id: "qaoa-optimization", title: "7.2 Quantum Approximate Optimization Algorithm (QAOA)", duration: "35 mins", difficulty: "Advanced" },
      { id: "qml-quantum-sensing", title: "7.3 Quantum Machine Learning & Quantum Metrology", duration: "30 mins", difficulty: "Advanced" },
    ],
  },
  {
    id: "module-8",
    moduleNumber: 8,
    title: "Quantum Hardware & Real-World Systems",
    tagline: "Superconducting transmons, trapped ions, photonics, neutral atoms & NISQ limits",
    difficulty: "Intermediate",
    estimatedHours: "5 Hours",
    prerequisites: "Module 1 & Module 2 (Foundations & Circuits)",
    hasLab: true,
    hasAssessment: true,
    topics: [
      "Quantum computer architecture",
      "Superconducting qubits (Transmons)",
      "Trapped-ion systems",
      "Photonic quantum computing",
      "Neutral atoms",
      "Spin-based quantum systems",
      "Quantum control electronics",
      "Quantum readout",
      "Cryogenic dilution refrigerators",
      "Microwave/RF control pulses",
      "Quantum optics",
      "Photonics",
      "NISQ computing era",
      "Cloud quantum processors",
      "Hardware limitations & gate fidelities",
    ],
    lessons: [
      { id: "qubit-modalities", title: "8.1 Superconducting Transmons & Trapped-Ion Processors", duration: "25 mins", difficulty: "Intermediate" },
      { id: "photonic-neutral-atoms", title: "8.2 Photonic, Neutral Atom & Silicon Spin Qubits", duration: "25 mins", difficulty: "Intermediate" },
      { id: "cryogenics-control-nisq", title: "8.3 Cryogenics, Microwave Control & NISQ Constraints", duration: "25 mins", difficulty: "Intermediate" },
    ],
  },
  {
    id: "module-9",
    moduleNumber: 9,
    title: "Research & Advanced Quantum Computing",
    tagline: "Reading papers, reproducing experiments, BQP/QMA complexity & research workflow",
    difficulty: "Advanced",
    estimatedHours: "5 Hours",
    prerequisites: "Module 4 & Module 6 (Algorithms & Error Correction)",
    hasLab: true,
    hasAssessment: true,
    topics: [
      "Reading quantum computing papers",
      "Reproducing published experiments",
      "Quantum computational complexity",
      "P vs NP vs BPP vs BQP vs QMA",
      "Quantum advantage demonstrations",
      "Current research frontiers",
      "Research methodology",
      "Experiment design",
      "Simulation and benchmarking",
      "Result interpretation",
      "Research project workflow",
      "Scientific presentation & publication",
    ],
    lessons: [
      { id: "quantum-complexity", title: "9.1 Computational Complexity: P, NP, BPP, BQP & QMA", duration: "30 mins", difficulty: "Advanced" },
      { id: "paper-reproduction", title: "9.2 Reading Quantum Papers & Reproducing Published Circuits", duration: "35 mins", difficulty: "Advanced" },
      { id: "research-methodology", title: "9.3 Research Project Workflow, Benchmarking & Experimentation", duration: "30 mins", difficulty: "Advanced" },
    ],
  },
];

export const LESSONS_DATABASE: Record<string, LessonData> = {
  // MODULE 0
  "complex-vectors": {
    id: "complex-vectors",
    moduleId: "module-0",
    moduleNumber: 0,
    moduleTitle: "Mathematical & Computational Foundations",
    title: "0.1 Complex Numbers, Vectors & Orthogonality",
    subtitle: "The Mathematical Language of Quantum Amplitudes",
    duration: "20 mins",
    difficulty: "Beginner",
    objective: "Master complex numbers, Euler's formula, statevectors, inner products, and orthonormal basis representations required for quantum state descriptions.",
    prerequisites: ["Basic high school algebra"],
    theory: {
      intro: "Quantum states live in complex vector spaces called Hilbert spaces. Unlike classical probability where states have real probabilities between 0 and 1, quantum systems assign complex probability amplitudes to basis states.",
      keyPoints: [
        "A complex number has the form z = a + bi = r · e^(iθ), where |z|² = a² + b².",
        "The inner product ⟨u|v⟩ measures the geometric overlap and projection between two quantum statevectors.",
        "Two vectors |u⟩ and |v⟩ are orthogonal if ⟨u|v⟩ = 0, representing mutually exclusive, perfectly distinguishable physical outcomes.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Complex Amplitude Definition",
          math: "z = r(cos θ + i sin θ) = r e^(iθ)",
          explanation: "Magnitude r represents probability magnitude |z| = r, and θ represents the relative quantum phase.",
        },
        {
          step: "Step 2",
          label: "Inner Product in Dirac Notation",
          math: "⟨u|v⟩ = u₀* v₀ + u₁* v₁",
          explanation: "The conjugate transpose bra ⟨u| multiplies the ket vector |v⟩ to produce a complex scalar.",
        },
        {
          step: "Step 3",
          label: "Orthonormality Condition",
          math: "⟨i|j⟩ = δ_ij = 1 (if i=j), 0 (if i≠j)",
          explanation: "The computational basis states |0⟩ = [1,0]ᵀ and |1⟩ = [0,1]ᵀ satisfy ⟨0|0⟩ = 1 and ⟨0|1⟩ = 0.",
        },
      ],
    },
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "x", targets: [0] },
        { gate: "measure", targets: [0], classicalTargets: [0] },
      ],
    },
    quiz: {
      prompt: "If a quantum state is |ψ⟩ = (1/√2)|0⟩ + (i/√2)|1⟩, what is the probability of measuring state |1⟩?",
      options: [
        "0% because i is imaginary.",
        "50% because |i/√2|² = (1/√2)² = 1/2.",
        "100% because i adds an extra imaginary dimension.",
        "25% because imaginary numbers attenuate real measurement outcomes.",
      ],
      correctIndex: 1,
      explanation: "Correct! The Born rule takes the squared modulus: |i/√2|² = (-i * i)/2 = 1/2 = 50%.",
    },
    miniChallenge: {
      title: "Orthogonal State Inversion",
      instructions: "Apply an X gate to transform the ground basis vector |0⟩ into its orthogonal counterpart |1⟩.",
      expectedGoal: "Statevector |1⟩ with 100% probability.",
    },
    labLink: "/quantum-lab",
  },

  "matrix-tensor-products": {
    id: "matrix-tensor-products",
    moduleId: "module-0",
    moduleNumber: 0,
    moduleTitle: "Mathematical & Computational Foundations",
    title: "0.2 Matrix Algebra, Eigenvalues & Tensor Products",
    subtitle: "Operators, Observables & Composite Hilbert Spaces",
    duration: "25 mins",
    difficulty: "Beginner",
    objective: "Understand unitary matrix operations, eigenvalue-eigenvector decomposition, and how Kronecker tensor products scale multi-qubit system dimensions.",
    prerequisites: ["Module 0.1 (Complex Numbers & Vectors)"],
    theory: {
      intro: "Quantum logic gates are represented by unitary matrices (U†U = I). When combining multiple qubits, their individual Hilbert spaces combine via the Kronecker tensor product (⊗), causing dimension to scale exponentially as 2^N.",
      keyPoints: [
        "A matrix U is Unitary if U†U = I, ensuring probability conservation (total probability = 100%).",
        "Hermitian matrices (A = A†) have real eigenvalues, corresponding directly to physical observables.",
        "For 2 qubits, the 4-dimensional state is constructed via |q0⟩ ⊗ |q1⟩.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Tensor Product of Basis States",
          math: "|0⟩ ⊗ |1⟩ = [1, 0]ᵀ ⊗ [0, 1]ᵀ = [0, 1, 0, 0]ᵀ = |01⟩",
          explanation: "The Kronecker product combines the 2D basis vectors into a 4D composite Hilbert space vector.",
        },
        {
          step: "Step 2",
          label: "Unitary Preservation",
          math: "⟨Uψ|Uψ⟩ = ⟨ψ|U†U|ψ⟩ = ⟨ψ|I|ψ⟩ = ⟨ψ|ψ⟩ = 1",
          explanation: "Unitary transformations preserve the norm (length) of the quantum statevector.",
        },
        {
          step: "Step 3",
          label: "Eigenvalue Equation",
          math: "Z|0⟩ = +1|0⟩,  Z|1⟩ = -1|1⟩",
          explanation: "States |0⟩ and |1⟩ are eigenvectors of the Pauli-Z operator with eigenvalues +1 and -1.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "x", targets: [1] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    },
    quiz: {
      prompt: "How does the dimension of a quantum Hilbert space scale with N qubits?",
      options: [
        "Linearly as 2 · N",
        "Polynomially as N²",
        "Exponentially as 2^N",
        "Logarithmically as log₂(N)",
      ],
      correctIndex: 2,
      explanation: "Correct! Each additional qubit doubles the dimension of the statevector: 1 qubit = 2D, 2 qubits = 4D, 3 qubits = 8D, N qubits = 2^N dimensions.",
    },
    miniChallenge: {
      title: "Synthesize State |10⟩",
      instructions: "Apply an X gate on qubit 0 (and leave qubit 1 in state 0) to produce the composite state |10⟩.",
      expectedGoal: "Statevector [0, 0, 1, 0]ᵀ with 100% probability on |10⟩.",
    },
    labLink: "/quantum-lab",
  },

  "prob-complexity": {
    id: "prob-complexity",
    moduleId: "module-0",
    moduleNumber: 0,
    moduleTitle: "Mathematical & Computational Foundations",
    title: "0.3 Probability Distributions & Computational Complexity",
    subtitle: "Classical vs Quantum Probability Amplitudes & Scaling",
    duration: "20 mins",
    difficulty: "Beginner",
    objective: "Contrast classical Markov probability distributions with quantum complex amplitudes, wave interference, and computational complexity hierarchies.",
    prerequisites: ["Module 0.1 & 0.2"],
    theory: {
      intro: "Classical computers operate on probability distributions P(x) ≥ 0, which always add constructively. Quantum mechanics operates on complex amplitudes whose interference can cancel out incorrect answers (destructive interference) and amplify correct ones (constructive interference).",
      keyPoints: [
        "In classical probability, P(A or B) = P(A) + P(B).",
        "In quantum probability, |α + β|² = |α|² + |β|² + 2 Re(α* β), where the cross-term causes quantum interference.",
        "Destructive interference enables quantum algorithms like Grover and Shor to achieve polynomial/exponential speedups.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Constructive Interference",
          math: "|1/√2 + 1/√2|² = |2/√2|² = |√2|² = 2 (amplified)",
          explanation: "Amplitudes in phase reinforce each other, boosting the probability of the desired outcome.",
        },
        {
          step: "Step 2",
          label: "Destructive Interference",
          math: "|1/√2 - 1/√2|² = |0|² = 0 (cancelled)",
          explanation: "Amplitudes with a π relative phase cancel to zero probability.",
        },
      ],
    },
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "h", targets: [0] },
        { gate: "measure", targets: [0], classicalTargets: [0] },
      ],
    },
    quiz: {
      prompt: "Why does applying two Hadamard gates in series (H · H) to state |0⟩ result in |0⟩ with 100% certainty?",
      options: [
        "Because measurement causes the qubit to forget the first gate.",
        "Because destructive interference cancels the |1⟩ amplitude while constructive interference restores |0⟩.",
        "Because the second gate reverses the direction of time in the simulator.",
        "Because Hadamard is a classical NOT gate.",
      ],
      correctIndex: 1,
      explanation: "Correct! H|0⟩ = (|0⟩+|1⟩)/√2. Applying H again gives (|0⟩+|1⟩ + |0⟩-|1⟩)/2 = 2|0⟩/2 = |0⟩ via destructive interference of |1⟩.",
    },
    miniChallenge: {
      title: "Interference Demonstration",
      instructions: "Run H · Z · H on qubit 0 to flip the state |0⟩ to |1⟩ entirely through phase interference.",
      expectedGoal: "State |1⟩ with 100% measurement outcome.",
    },
    labLink: "/quantum-lab",
  },

  // MODULE 1
  "qubit-basics": {
    id: "qubit-basics",
    moduleId: "module-1",
    moduleNumber: 1,
    moduleTitle: "Quantum Foundations",
    title: "1.1 The Qubit, Dirac Notation & Bloch Sphere",
    subtitle: "From Classical Bits to Pure Single-Qubit Geometric States",
    duration: "18 mins",
    difficulty: "Beginner",
    objective: "Understand statevectors, Dirac bra-ket notation, probability amplitudes, and the Bloch sphere coordinates (θ, φ).",
    prerequisites: ["Module 0 (Mathematical Foundations)"],
    theory: {
      intro: "A classical bit can only be 0 or 1. A qubit (quantum bit) is a two-level quantum system represented as a unit vector in a 2-dimensional complex Hilbert space: |ψ⟩ = α|0⟩ + β|1⟩, parameterized by angles θ and φ on the surface of the Bloch sphere.",
      keyPoints: [
        "Dirac ket |ψ⟩ denotes a column vector; bra ⟨ψ| denotes its conjugate transpose row vector.",
        "Normalization constraint: |α|² + |β|² = 1 (total measurement probability = 100%).",
        "Bloch sphere parameterization: |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Ground State on North Pole",
          math: "θ = 0 → |ψ⟩ = cos(0)|0⟩ + sin(0)|1⟩ = |0⟩",
          explanation: "The North Pole of the Bloch sphere corresponds to computational basis state |0⟩.",
        },
        {
          step: "Step 2",
          label: "South Pole Inversion",
          math: "θ = π → |ψ⟩ = cos(π/2)|0⟩ + sin(π/2)|1⟩ = |1⟩",
          explanation: "The South Pole of the Bloch sphere corresponds to basis state |1⟩.",
        },
        {
          step: "Step 3",
          label: "Equator Superposition",
          math: "θ = π/2, φ = 0 → |ψ⟩ = (|0⟩ + |1⟩)/√2 = |+⟩",
          explanation: "The positive X-axis represents the equal superposition state |+⟩.",
        },
      ],
    },
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "h", targets: [0] },
      ],
    },
    quiz: {
      prompt: "What point on the Bloch sphere corresponds to the state |+⟩ = (|0⟩ + |1⟩)/√2?",
      options: [
        "The North Pole (Z = +1)",
        "The South Pole (Z = -1)",
        "The intersection of the equator with the positive X-axis (θ = π/2, φ = 0)",
        "The center of the sphere (origin)",
      ],
      correctIndex: 2,
      explanation: "Correct! The state |+⟩ lies on the equator pointing along the +X direction with equal |0⟩ and |1⟩ amplitudes.",
    },
    miniChallenge: {
      title: "Rotate to South Pole",
      instructions: "Add an X gate to the qubit to flip from the North Pole (|0⟩) to the South Pole (|1⟩).",
      expectedGoal: "Bloch vector pointing along -Z with state |1⟩.",
    },
    labLink: "/quantum-lab",
  },

  "superposition": {
    id: "superposition",
    moduleId: "module-1",
    moduleNumber: 1,
    moduleTitle: "Quantum Foundations",
    title: "1.2 Creating Superposition with Hadamard (H)",
    subtitle: "From Deterministic Bits to Quantum Probability Amplitudes",
    duration: "15 mins",
    difficulty: "Beginner",
    objective: "Master how the Hadamard gate transforms a deterministic basis state into an equal quantum superposition with 50/50 measurement probabilities.",
    prerequisites: ["Module 1.1 (Qubit & Bloch Sphere)"],
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
    labLink: "/quantum-lab",
  },

  "measurement": {
    id: "measurement",
    moduleId: "module-1",
    moduleNumber: 1,
    moduleTitle: "Quantum Foundations",
    title: "1.3 Measurement Collapse & The Born Rule",
    subtitle: "Projective Measurements, Wavefunction Collapse & Uncertainty",
    duration: "18 mins",
    difficulty: "Beginner",
    objective: "Understand projective measurement operators (P₀, P₁), the Born rule probability calculation, and post-measurement state collapse.",
    prerequisites: ["Module 1.2 (Superposition)"],
    theory: {
      intro: "Measurement in quantum mechanics is fundamentally irreversible and non-deterministic. When an observable is measured, the continuous quantum superposition projects onto one of the discrete eigenstates of the measurement operator.",
      keyPoints: [
        "Born Rule: P(i) = |⟨i|ψ⟩|² = ⟨ψ|P_i|ψ⟩.",
        "Post-measurement state: |ψ'⟩ = P_i|ψ⟩ / √P(i).",
        "Measurement destroys quantum superposition, yielding a definite classical bit value (0 or 1).",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "General Superposition",
          math: "|ψ⟩ = α|0⟩ + β|1⟩",
          explanation: "The state contains continuous complex amplitudes α and β.",
        },
        {
          step: "Step 2",
          label: "Measurement Projection",
          math: "P₀ = |0⟩⟨0|,  P₁ = |1⟩⟨1|",
          explanation: "Projectors filter the statevector into orthogonal subspaces.",
        },
        {
          step: "Step 3",
          label: "State Collapse",
          math: "Outcome 0 → |ψ'⟩ = |0⟩;  Outcome 1 → |ψ'⟩ = |1⟩",
          explanation: "Repeating the measurement immediately returns the same outcome with 100% fidelity.",
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
      prompt: "If you measure a qubit in state |+⟩ and observe '0', what is the state of the qubit immediately after the measurement?",
      options: [
        "|+⟩ = (|0⟩ + |1⟩)/√2",
        "|0⟩ with 100% certainty",
        "|1⟩ with 100% certainty",
        "An undefined mixture with 50% purity",
      ],
      correctIndex: 1,
      explanation: "Correct! Projective measurement collapses the wave function to the observed eigenstate |0⟩.",
    },
    miniChallenge: {
      title: "Biased Measurement Superposition",
      instructions: "Use an Ry rotation gate with angle π/3 (60°) to create an asymmetric superposition (75% |0⟩, 25% |1⟩).",
      expectedGoal: "Probability P(0) = 75% and P(1) = 25%.",
    },
    labLink: "/quantum-lab",
  },

  "observables-evolution": {
    id: "observables-evolution",
    moduleId: "module-1",
    moduleNumber: 1,
    moduleTitle: "Quantum Foundations",
    title: "1.4 Observables, Hermitian Operators & Unitary Time Evolution",
    subtitle: "Hamiltonians, Expectation Values & Schrödinger Equation",
    duration: "22 mins",
    difficulty: "Beginner",
    objective: "Master Hermitian operators, expectation values ⟨A⟩ = ⟨ψ|A|ψ⟩, and unitary time evolution generated by the system Hamiltonian U(t) = exp(-iHt/ℏ).",
    prerequisites: ["Module 1.1 - 1.3"],
    theory: {
      intro: "In quantum mechanics, every physically measurable quantity corresponds to a Hermitian operator (A = A†). Unitary quantum logic gates are realized physically by letting a physical Hamiltonian act on the system for a calibrated duration t.",
      keyPoints: [
        "Expectation value ⟨A⟩ represents the statistical average of many repeated measurements: ⟨A⟩ = Σ a_i P(a_i).",
        "Schrödinger Equation: iℏ d|ψ(t)⟩/dt = H|ψ(t)⟩.",
        "Unitary evolution: U(t) = exp(-iHt/ℏ) maintains state normalization ⟨ψ(t)|ψ(t)⟩ = 1.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Pauli-Z Expectation on |0⟩",
          math: "⟨0|Z|0⟩ = [1, 0] [[1, 0], [0, -1]] [1, 0]ᵀ = +1",
          explanation: "State |0⟩ has a deterministic Z-spin expectation of +1.",
        },
        {
          step: "Step 2",
          label: "Pauli-Z Expectation on Superposition |+⟩",
          math: "⟨+|Z|+⟩ = 1/2 [1, 1] [1, -1]ᵀ = 1/2 (1 - 1) = 0",
          explanation: "Equal superposition yields an expectation value of 0, reflecting symmetric 50/50 balance.",
        },
      ],
    },
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "rz", targets: [0], params: [1.570796] },
      ],
    },
    quiz: {
      prompt: "Why must physical quantum operators be Hermitian (A = A†)?",
      options: [
        "Because only Hermitian operators have real eigenvalues, ensuring physical measurement outcomes are real numbers.",
        "Because Hermitian matrices are always diagonal.",
        "Because non-Hermitian matrices cannot be inverted on a computer.",
        "Because Hermitian operators prevent quantum noise completely.",
      ],
      correctIndex: 0,
      explanation: "Correct! The spectral theorem guarantees that all eigenvalues of Hermitian matrices are strictly real numbers, which correspond to physically measurable values.",
    },
    miniChallenge: {
      title: "Expectation Shift",
      instructions: "Apply an X gate followed by Rz rotation to see how phase rotations evolve on the Bloch sphere.",
      expectedGoal: "State |1⟩ with relative phase shift.",
    },
    labLink: "/quantum-lab",
  },

  // MODULE 2
  "pauli-rotations": {
    id: "pauli-rotations",
    moduleId: "module-2",
    moduleNumber: 2,
    moduleTitle: "Multi-Qubit Systems & Quantum Circuits",
    title: "2.1 Pauli Transformations & Continuous Rotations (Rx, Ry, Rz)",
    subtitle: "Single-Qubit Gate Algebra and Bloch Sphere Rotations",
    duration: "20 mins",
    difficulty: "Intermediate",
    objective: "Master the Pauli matrices (X, Y, Z) and parameterized continuous rotations Rx(θ), Ry(θ), Rz(θ) around arbitrary Bloch axes.",
    prerequisites: ["Module 1 (Quantum Foundations)"],
    theory: {
      intro: "Single-qubit quantum gates are rotations of the Bloch vector. Pauli gates represent π-radian rotations, while arbitrary angle rotations Rx(θ), Ry(θ), Rz(θ) allow synthesizing any single-qubit quantum operation.",
      keyPoints: [
        "Pauli-X flips computational basis: X|0⟩ = |1⟩, X|1⟩ = |0⟩ (Bit Flip).",
        "Pauli-Z flips the phase: Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩ (Phase Flip).",
        "Rotation formula: R_n(θ) = exp(-i θ (n · σ) / 2) = cos(θ/2) I - i sin(θ/2) (n · σ).",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Ry Rotation by Angle θ",
          math: "Ry(θ) = [[cos(θ/2), -sin(θ/2)], [sin(θ/2), cos(θ/2)]]",
          explanation: "Rotates the statevector along the X-Z plane without introducing complex phases.",
        },
        {
          step: "Step 2",
          label: "Rz Phase Rotation",
          math: "Rz(λ) = [[e^(-iλ/2), 0], [0, e^(iλ/2)]]",
          explanation: "Rotates the statevector along the equator around the Z-axis, adjusting the relative phase.",
        },
      ],
    },
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "rx", targets: [0], params: [3.14159] },
        { gate: "measure", targets: [0], classicalTargets: [0] },
      ],
    },
    quiz: {
      prompt: "What is the result of applying an Rx(π) rotation to the ground state |0⟩?",
      options: [
        "State |0⟩ unchanged",
        "State -i|1⟩ (equivalent to a bit flip up to global phase)",
        "State |+⟩ equal superposition",
        "State |−⟩ phase inverted",
      ],
      correctIndex: 1,
      explanation: "Correct! Rx(π) = -iX. Acting on |0⟩ produces -i|1⟩, flipping the qubit to state 1 with 100% measurement probability.",
    },
    miniChallenge: {
      title: "Synthesize Hadamard using Rotations",
      instructions: "Combine Ry(π/2) and Rz(π) to create equal superposition |+⟩ from |0⟩.",
      expectedGoal: "Equal 50% probability on |0⟩ and |1⟩.",
    },
    labLink: "/quantum-lab",
  },

  "phase-gates": {
    id: "phase-gates",
    moduleId: "module-2",
    moduleNumber: 2,
    moduleTitle: "Multi-Qubit Systems & Quantum Circuits",
    title: "2.2 Phase Shifts & Universality: S and T Gates",
    subtitle: "Discrete Gate Sets & Fault-Tolerant Clifford+T Universality",
    duration: "20 mins",
    difficulty: "Intermediate",
    objective: "Master S (Phase) and T (π/8) gates, their non-Clifford properties, and the Solovay-Kitaev theorem for universal quantum computation.",
    prerequisites: ["Module 2.1 (Pauli Rotations)"],
    theory: {
      intro: "While Clifford gates (H, S, CNOT) can be simulated efficiently on classical computers (Gottesman-Knill theorem), adding the non-Clifford T gate (T = √S = Z^(1/4)) enables universal quantum computation.",
      keyPoints: [
        "S Gate: Phase shift of π/2 (90°): S = [[1, 0], [0, i]]. S² = Z.",
        "T Gate: Phase shift of π/4 (45°): T = [[1, 0], [0, e^(iπ/4)]]. T² = S, T⁴ = Z.",
        "Clifford + T gate set is universal: any arbitrary unitary can be approximated to precision ε in O(log^c(1/ε)) gates.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Action of S on Superposition |+⟩",
          math: "S |+⟩ = S ((|0⟩ + |1⟩)/√2) = (|0⟩ + i|1⟩)/√2 = |R⟩",
          explanation: "Rotates the state to the positive Y-axis on the Bloch equator.",
        },
        {
          step: "Step 2",
          label: "Action of T on |+⟩",
          math: "T |+⟩ = (|0⟩ + e^(iπ/4)|1⟩)/√2",
          explanation: "Advances the relative quantum phase by exactly 45 degrees.",
        },
      ],
    },
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "s", targets: [0] },
        { gate: "t", targets: [0] },
      ],
    },
    quiz: {
      prompt: "Why is the T gate essential for universal fault-tolerant quantum computing?",
      options: [
        "Because Clifford gates alone can be simulated efficiently in polynomial time on a classical computer.",
        "Because the T gate is the only gate that can perform entanglement.",
        "Because the T gate eliminates decoherence errors automatically.",
        "Because T gates have zero circuit depth.",
      ],
      correctIndex: 0,
      explanation: "Correct! The Gottesman-Knill theorem proves Clifford circuits (H, S, CNOT) are classically simulable. The T gate breaks Clifford symmetry, enabling true quantum universality.",
    },
    miniChallenge: {
      title: "Synthesize Pauli-Z with T Gates",
      instructions: "Apply 4 consecutive T gates (T⁴) to state |1⟩ to verify that T⁴ = Z.",
      expectedGoal: "State |1⟩ with a relative phase of π.",
    },
    labLink: "/quantum-lab",
  },

  "bell-state": {
    id: "bell-state",
    moduleId: "module-2",
    moduleNumber: 2,
    moduleTitle: "Multi-Qubit Systems & Quantum Circuits",
    title: "2.3 Building a Bell State (|Φ⁺⟩) & Entanglement",
    subtitle: "Creating Maximal Quantum Entanglement with Hadamard and CNOT",
    duration: "20 mins",
    difficulty: "Intermediate",
    objective: "Understand how combining a Hadamard gate on qubit 0 with a Controlled-NOT gate across qubits 0 and 1 creates non-separable 2-qubit Einstein-Podolsky-Rosen (EPR) entanglement.",
    prerequisites: ["Module 2.1 (Pauli & Superposition)"],
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
    labLink: "/quantum-lab",
  },

  "ghz-state": {
    id: "ghz-state",
    moduleId: "module-2",
    moduleNumber: 2,
    moduleTitle: "Multi-Qubit Systems & Quantum Circuits",
    title: "2.4 Multi-Qubit GHZ State & SWAP Networks",
    subtitle: "Extending Entanglement to N Qubits: Greenberger-Horne-Zeilinger",
    duration: "25 mins",
    difficulty: "Intermediate",
    objective: "Learn how to generalize quantum entanglement across 3 or more qubits to synthesize macroscopic quantum superpositions and route states with SWAP gates.",
    prerequisites: ["Module 2.3 (Bell States)"],
    theory: {
      intro: "The Greenberger-Horne-Zeilinger (GHZ) state is a maximally entangled quantum state involving three or more subsystems: (|000⟩ + |111⟩)/√2. It exhibits non-local correlations that cannot be explained by any local hidden variable theory.",
      keyPoints: [
        "For 3 qubits, the GHZ state is (|000⟩ + |111⟩)/√2.",
        "Measuring any single qubit in the computational basis instantly collapses all remaining qubits into the identical value.",
        "SWAP gates interchange the states of two qubits: SWAP = CX(0,1) CX(1,0) CX(0,1).",
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
    labLink: "/quantum-lab",
  },

  // MODULE 3
  "statevector-simulation": {
    id: "statevector-simulation",
    moduleId: "module-3",
    moduleNumber: 3,
    moduleTitle: "Quantum Programming & Simulation Lab",
    title: "3.1 Interactive Circuit Simulation & Statevector Inspection",
    subtitle: "Real-Time Quantum Simulator Engine & Dirac Deconstruction",
    duration: "20 mins",
    difficulty: "Intermediate",
    objective: "Understand how classical matrix engines simulate pure quantum statevectors, calculate Dirac notation terms, and compute measurement histograms.",
    prerequisites: ["Module 2 (Quantum Circuits)"],
    theory: {
      intro: "SAMBHAV uses a pure statevector simulation engine that models quantum registers as 2^N dimensional complex vectors. This allows tracking exact probability amplitudes, relative phases, and purity.",
      keyPoints: [
        "Statevector simulator computes exact amplitudes α_i for all 2^N basis states.",
        "Shot-based simulation samples from the probability distribution |α_i|² across M shots (e.g. 1024 shots).",
        "Bloch sphere visualizers display single-qubit reduced density matrix coordinates.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Full Statevector Vector Representation",
          math: "|ψ⟩ = [c₀, c₁, c₂, ..., c_{2^N-1}]ᵀ",
          explanation: "Contains full quantum information including global and relative phases.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "rx", targets: [1], params: [1.570796] },
      ],
    },
    quiz: {
      prompt: "What is the difference between statevector simulation and shot-based simulation?",
      options: [
        "Statevector gives exact mathematical amplitudes; shot-based simulates probabilistic sampling from physical measurements.",
        "Statevector simulation only works on physical quantum hardware.",
        "Shot-based simulation computes exact complex phases directly.",
        "There is no difference; they are identical algorithms.",
      ],
      correctIndex: 0,
      explanation: "Correct! Statevector simulation computes the full 2^N complex amplitude vector, whereas shot-based simulation models statistical sampling over repeated projective measurements.",
    },
    miniChallenge: {
      title: "Inspect Superposition",
      instructions: "Add an H gate on qubit 1 and simulate to inspect the 4-element equal statevector.",
      expectedGoal: "25% equal probabilities on |00⟩, |01⟩, |10⟩, and |11⟩.",
    },
    labLink: "/quantum-lab",
  },

  "qiskit-code-gen": {
    id: "qiskit-code-gen",
    moduleId: "module-3",
    moduleNumber: 3,
    moduleTitle: "Quantum Programming & Simulation Lab",
    title: "3.2 Qiskit Code Generation & Python Integration",
    subtitle: "Exporting Visual Circuits to IBM Qiskit & OpenQASM 3.0",
    duration: "22 mins",
    difficulty: "Intermediate",
    objective: "Learn how visual drag-and-drop circuit IRs translate seamlessly into Python Qiskit QuantumCircuit objects and OpenQASM scripts.",
    prerequisites: ["Module 3.1 (Statevector Simulation)"],
    theory: {
      intro: "Qiskit is the leading open-source quantum development SDK. Every circuit you build in SAMBHAV can be exported directly into executable Python Qiskit code ready to run on IBM Quantum processors.",
      keyPoints: [
        "QuantumCircuit(qubits, clbits) initializes the quantum and classical registers.",
        "Gates are applied sequentially: qc.h(0), qc.cx(0, 1), qc.measure(0, 0).",
        "Qiskit Aer provides local high-performance C++ statevector and QASM simulators.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Qiskit Circuit Translation",
          math: "qc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)",
          explanation: "Generates the standard 2-qubit Bell state circuit in Python.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
      ],
    },
    quiz: {
      prompt: "Which Qiskit method is used to measure all qubits into classical bits simultaneously?",
      options: [
        "qc.measure_all()",
        "qc.collapse_register()",
        "qc.execute_now()",
        "qc.sample_amplitudes()",
      ],
      correctIndex: 0,
      explanation: "Correct! In Qiskit, `qc.measure_all()` automatically adds classical registers and measures all qubits in the computational basis.",
    },
    miniChallenge: {
      title: "Generate Qiskit Code",
      instructions: "Build a 3-qubit circuit and use the Qiskit export panel in Quantum Lab to copy Python code.",
      expectedGoal: "Verified Qiskit QuantumCircuit snippet.",
    },
    labLink: "/quantum-lab",
  },

  "circuit-optimization": {
    id: "circuit-optimization",
    moduleId: "module-3",
    moduleNumber: 3,
    moduleTitle: "Quantum Programming & Simulation Lab",
    title: "3.3 Quantum Debugging, Depth & Circuit Optimization",
    subtitle: "Gate Cancellation, Commutation Relations & Transpilation",
    duration: "25 mins",
    difficulty: "Intermediate",
    objective: "Master circuit depth reduction, gate cancellation (H·H=I, X·X=I), and quantum circuit transpilation for NISQ hardware constraints.",
    prerequisites: ["Module 3.1 & 3.2"],
    theory: {
      intro: "Physical quantum computers have limited coherence times (T1, T2). Minimizing circuit depth and 2-qubit CNOT count through automated transpilation is critical for maximizing algorithm fidelity.",
      keyPoints: [
        "Circuit Depth is the critical path length of quantum gates that cannot be executed in parallel.",
        "Adjacent self-inverse gates cancel: H·H = I, X·X = I, Z·Z = I.",
        "Commutation relations [Z, CZ] = 0 allow reordering gates to minimize 2-qubit gate latency.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Gate Cancellation Rule",
          math: "U · U† = I",
          explanation: "Consecutive inverse unitary gates collapse to the identity wire.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "h", targets: [0] },
        { gate: "x", targets: [1] },
      ],
    },
    quiz: {
      prompt: "Why is minimizing 2-qubit CNOT gates prioritized during quantum circuit transpilation?",
      options: [
        "Because CNOT gates have higher error rates (0.5%–2%) and take 5–10x longer to execute than single-qubit gates on physical hardware.",
        "Because CNOT gates use more electricity.",
        "Because CNOT gates violate the no-cloning theorem.",
        "Because Qiskit cannot compile more than two CNOT gates.",
      ],
      correctIndex: 0,
      explanation: "Correct! On current physical quantum processors, 2-qubit entangling gates are the dominant source of error and decoherence.",
    },
    miniChallenge: {
      title: "Optimize Identity Wire",
      instructions: "Remove redundant H·H gates to reduce circuit depth to minimum.",
      expectedGoal: "Circuit depth minimized with identical output state.",
    },
    labLink: "/quantum-lab",
  },

  // MODULE 4
  "deutsch-jozsa": {
    id: "deutsch-jozsa",
    moduleId: "module-4",
    moduleNumber: 4,
    moduleTitle: "Fundamental Quantum Algorithms",
    title: "4.1 Quantum Oracles: Deutsch & Deutsch-Jozsa Algorithm",
    subtitle: "Demonstrating Deterministic Quantum Speedup with Oracles",
    duration: "30 mins",
    difficulty: "Advanced",
    objective: "Understand quantum black-box oracles, phase kickback, and how the Deutsch-Jozsa algorithm determines if a boolean function is constant or balanced in a single evaluation.",
    prerequisites: ["Module 2 (Quantum Circuits & Phase Kickback)"],
    theory: {
      intro: "The Deutsch-Jozsa algorithm was the first quantum algorithm to demonstrate an exponential separation between quantum and classical deterministic query complexity. While a classical deterministic algorithm requires 2^(n-1) + 1 oracle queries in the worst case, the quantum algorithm requires exactly 1 query.",
      keyPoints: [
        "An oracle function f: {0,1}^n → {0,1} is either Constant (same output for all inputs) or Balanced (outputs 0 for half, 1 for half).",
        "Phase Kickback encodes the oracle answer into the quantum phase: U_f (|x⟩ ⊗ |−⟩) = (-1)^f(x) (|x⟩ ⊗ |−⟩).",
        "If f is constant, measurement yields |00...0⟩ with 100% probability; if balanced, probability of |00...0⟩ is exactly 0%.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Ancilla in |−⟩ State",
          math: "|ancilla⟩ = H X |0⟩ = (|0⟩ - |1⟩)/√2 = |−⟩",
          explanation: "Preparing the target qubit in |−⟩ enables phase kickback.",
        },
        {
          step: "Step 2",
          label: "Hadamard Transformation of Input Register",
          math: "H^{⊗n} |0⟩^{⊗n} = 1/√(2^n) Σ_{x} |x⟩",
          explanation: "Creates an equal superposition of all 2^n possible inputs.",
        },
        {
          step: "Step 3",
          label: "Oracle Evaluation & Interference",
          math: "H^{⊗n} (1/√(2^n) Σ_x (-1)^{f(x)} |x⟩)",
          explanation: "If f is constant, amplitudes interfere constructively into |0⟩^{⊗n}. If balanced, they interfere destructively to 0.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 1,
      operations: [
        { gate: "x", targets: [1] },
        { gate: "h", targets: [0, 1] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "h", targets: [0] },
        { gate: "measure", targets: [0], classicalTargets: [0] },
      ],
    },
    quiz: {
      prompt: "How many oracle queries does the Deutsch-Jozsa algorithm need to classify an n-bit function with 100% certainty?",
      options: [
        "2^(n-1) + 1 queries",
        "Exactly 1 query",
        "O(√N) queries",
        "n · log(n) queries",
      ],
      correctIndex: 1,
      explanation: "Correct! The quantum algorithm evaluates all inputs simultaneously in superposition and extracts the global balanced/constant property in a single query.",
    },
    miniChallenge: {
      title: "Evaluate Constant Oracle",
      instructions: "Remove the CNOT gate (constant f(x)=0) and confirm the measurement returns |0⟩ with 100% probability.",
      expectedGoal: "Measured outcome '0' with 100% fidelity.",
    },
    labLink: "/quantum-lab",
  },

  "bernstein-simon": {
    id: "bernstein-simon",
    moduleId: "module-4",
    moduleNumber: 4,
    moduleTitle: "Fundamental Quantum Algorithms",
    title: "4.2 Bernstein-Vazirani & Simon's Periodicity Algorithm",
    subtitle: "Extracting Hidden Bitstrings & Exponential Oracle Speedups",
    duration: "35 mins",
    difficulty: "Advanced",
    objective: "Master the Bernstein-Vazirani algorithm for finding hidden bitstrings s in 1 query, and Simon's algorithm for finding period s with O(n) queries.",
    prerequisites: ["Module 4.1 (Deutsch-Jozsa)"],
    theory: {
      intro: "Bernstein-Vazirani finds a hidden bitstring s where f(x) = s · x (mod 2) in 1 query instead of n classical queries. Simon's algorithm finds hidden period s such that f(x) = f(y) ⟺ x ⊕ y ∈ {0, s} with exponential quantum speedup, directly inspiring Shor's algorithm.",
      keyPoints: [
        "Bernstein-Vazirani uses phase kickback and Hadamard interference to read out the exact bitstring s in a single shot.",
        "Simon's algorithm produces linear equations s · y = 0 (mod 2) that can be solved classically via Gaussian elimination in polynomial time.",
        "Simon's algorithm established the first provable exponential speedup over any classical randomized algorithm.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Bernstein-Vazirani Phase Oracle",
          math: "U_f |x⟩|−⟩ = (-1)^{s · x} |x⟩|−⟩",
          explanation: "Applies phase shift depending on the inner product s · x.",
        },
        {
          step: "Step 2",
          label: "Final Hadamard Decoding",
          math: "H^{⊗n} (1/√(2^n) Σ_x (-1)^{s · x} |x⟩) = |s⟩",
          explanation: "Destructive interference eliminates all basis states except the hidden string |s⟩!",
        },
      ],
    },
    initialCircuit: {
      qubits: 3,
      classicalBits: 2,
      operations: [
        { gate: "x", targets: [2] },
        { gate: "h", targets: [0, 1, 2] },
        { gate: "cx", controls: [0], targets: [2] },
        { gate: "cx", controls: [1], targets: [2] },
        { gate: "h", targets: [0, 1] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    },
    quiz: {
      prompt: "For an n-bit string, how many queries does Bernstein-Vazirani take compared to classical query complexity?",
      options: [
        "Quantum: 1 query vs Classical: n queries",
        "Quantum: n queries vs Classical: 2^n queries",
        "Quantum: √n queries vs Classical: n² queries",
        "Quantum: log(n) queries vs Classical: n log(n) queries",
      ],
      correctIndex: 0,
      explanation: "Correct! Classical deterministic algorithms must test n unit vectors (100...0, 010...0, etc.) requiring n queries, while quantum BV finds s in exactly 1 query.",
    },
    miniChallenge: {
      title: "Find Hidden String s = 10",
      instructions: "Modify the circuit by removing the CNOT from qubit 1 to encode s = 10.",
      expectedGoal: "Measurement outcome '01' (q0=1, q1=0) with 100% probability.",
    },
    labLink: "/quantum-lab",
  },

  "grovers-search": {
    id: "grovers-search",
    moduleId: "module-4",
    moduleNumber: 4,
    moduleTitle: "Fundamental Quantum Algorithms",
    title: "4.3 Grover's Search & Amplitude Amplification",
    subtitle: "Quadratic Speedup for Unstructured Database Search",
    duration: "45 mins",
    difficulty: "Advanced",
    objective: "Master the Oracle phase flip, the Grover Diffusion Operator (inversion about the mean), and optimal iteration count R ≈ (π/4)√N for unstructured search.",
    prerequisites: ["Module 4.1 (Quantum Oracles)"],
    theory: {
      intro: "Searching an unsorted database of N items classically requires O(N) evaluations. Grover's algorithm performs this search in O(√N) queries with quadratic speedup by iteratively amplifying the amplitude of the target marked state.",
      keyPoints: [
        "Phase Oracle flips the sign of the target item: O|x⟩ = -|x⟩ if x=w, else +|x⟩.",
        "Diffusion Operator D = 2|s⟩⟨s| - I inverts all amplitudes about their mean.",
        "Optimal number of iterations for N=2^n items: R ≈ (π/4) √(2^n). Over-rotating decreases success probability!",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Equal Superposition State",
          math: "|s⟩ = 1/√N Σ_{x=0}^{N-1} |x⟩",
          explanation: "All N basis states start with uniform amplitude 1/√N.",
        },
        {
          step: "Step 2",
          label: "Phase Oracle Inversion",
          math: "O = I - 2|w⟩⟨w|",
          explanation: "Target state |w⟩ has its amplitude flipped to negative: -1/√N.",
        },
        {
          step: "Step 3",
          label: "Inversion About the Mean",
          math: "D = 2|s⟩⟨s| - I = H^{⊗n} (2|0⟩⟨0| - I) H^{⊗n}",
          explanation: "Reflects all amplitudes across the mean, boosting the marked item to near 100% probability.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0, 1] },
        { gate: "cz", controls: [0], targets: [1] },
        { gate: "h", targets: [0, 1] },
        { gate: "x", targets: [0, 1] },
        { gate: "cz", controls: [0], targets: [1] },
        { gate: "x", targets: [0, 1] },
        { gate: "h", targets: [0, 1] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    },
    quiz: {
      prompt: "For a database of N = 1,000,000 items, approximately how many queries does Grover's algorithm need compared to classical search?",
      options: [
        "1,000 quantum queries vs 500,000 classical queries on average",
        "1 quantum query vs 1,000,000 classical queries",
        "20 quantum queries vs 1,000 classical queries",
        "500,000 quantum queries vs 1,000,000 classical queries",
      ],
      correctIndex: 0,
      explanation: "Correct! Grover's algorithm requires O(√N) ≈ (π/4)·1000 ≈ 785 queries, achieving quadratic speedup over the classical average of N/2 = 500,000 queries.",
    },
    miniChallenge: {
      title: "Grover Search Target |11⟩",
      instructions: "Simulate the 2-qubit Grover circuit and observe the 100% measurement probability on target state |11⟩.",
      expectedGoal: "P(|11⟩) = 100%.",
    },
    labLink: "/quantum-lab",
  },

  "qpe-shor": {
    id: "qpe-shor",
    moduleId: "module-4",
    moduleNumber: 4,
    moduleTitle: "Fundamental Quantum Algorithms",
    title: "4.4 Quantum Phase Estimation (QPE) & Shor's Factoring",
    subtitle: "Eigenvalue Estimation, Quantum Fourier Transform & RSA Cryptanalysis",
    duration: "50 mins",
    difficulty: "Advanced",
    objective: "Understand Quantum Phase Estimation (QPE), Quantum Fourier Transform (QFT), and how Shor's algorithm achieves polynomial time O((log N)³) prime factorization.",
    prerequisites: ["Module 4.3 (Grover & Interference)"],
    theory: {
      intro: "Quantum Phase Estimation is the computational engine behind Shor's factoring algorithm and quantum chemistry simulation. Given a unitary operator U with eigenvector |u⟩ such that U|u⟩ = e^(2πiθ)|u⟩, QPE computes θ to t bits of precision in polynomial time.",
      keyPoints: [
        "Uses Controlled-U^(2^j) operations to write the binary phase into the state amplitudes.",
        "Inverse Quantum Fourier Transform (QFT†) extracts the phase θ into computational basis register.",
        "Shor's algorithm reduces integer factorization to order finding: r such that a^r ≡ 1 (mod N).",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Phase Encoding",
          math: "1/√(2^t) Σ_{k=0}^{2^t-1} e^{2πi θ k} |k⟩ ⊗ |u⟩",
          explanation: "Entangles the counting register with the eigenvalue phase.",
        },
        {
          step: "Step 2",
          label: "Inverse QFT Decoding",
          math: "QFT† (1/√(2^t) Σ e^{2πi θ k} |k⟩) = |2^t θ⟩",
          explanation: "Converts frequency-domain phase into a sharp probability spike on the binary representation of θ.",
        },
      ],
    },
    initialCircuit: {
      qubits: 3,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0, 1] },
        { gate: "x", targets: [2] },
        { gate: "rz", targets: [2], params: [1.570796] },
        { gate: "h", targets: [0] },
      ],
    },
    quiz: {
      prompt: "What classical cryptographic system is directly broken by Shor's polynomial-time factoring algorithm?",
      options: [
        "RSA and Elliptic Curve Cryptography (ECC)",
        "AES-256 Symmetric Encryption",
        "SHA-256 Hash Functions",
        "One-Time Pad (OTP)",
      ],
      correctIndex: 0,
      explanation: "Correct! RSA depends on the difficulty of integer factorization, and ECC depends on discrete logarithms. Shor's algorithm solves both in polynomial time O((log N)³).",
    },
    miniChallenge: {
      title: "Simulate Phase Rotation QPE",
      instructions: "Inspect how Rz phase shifts map to interference peaks on the counting register.",
      expectedGoal: "High probability spike corresponding to phase fraction.",
    },
    labLink: "/quantum-lab",
  },

  // MODULE 5
  "teleportation": {
    id: "teleportation",
    moduleId: "module-5",
    moduleNumber: 5,
    moduleTitle: "Quantum Information & Communication",
    title: "5.1 Quantum Teleportation Protocol",
    subtitle: "Transmitting Arbitrary Quantum States via Entanglement and Classical Bits",
    duration: "35 mins",
    difficulty: "Advanced",
    objective: "Master the 3-qubit quantum teleportation circuit: Bell measurement, classical communication, and conditional Pauli corrections (X and Z).",
    prerequisites: ["Module 2.3 (Bell States)"],
    theory: {
      intro: "Quantum teleportation allows transferring an unknown quantum state |ψ⟩ from Alice to Bob without physically moving the qubit itself. It consumes one shared Bell pair (|Φ⁺⟩) and requires transmitting 2 classical bits.",
      keyPoints: [
        "No-Cloning Theorem is preserved because Alice's original state |ψ⟩ is destroyed by her Bell measurement.",
        "Faster-than-light communication is impossible because Bob cannot decode the state until receiving Alice's 2 classical bits.",
        "Bob applies Pauli corrections based on Alice's 2-bit measurement outcome: 00 → I, 01 → X, 10 → Z, 11 → XZ.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Initial 3-Qubit Composite State",
          math: "|ψ⟩_A ⊗ |Φ⁺⟩_{AB} = (α|0⟩ + β|1⟩) ⊗ (|00⟩ + |11⟩)/√2",
          explanation: "Alice holds qubit 0 (|ψ⟩) and qubit 1 (Bell pair half); Bob holds qubit 2.",
        },
        {
          step: "Step 2",
          label: "Alice Bell Basis Measurement",
          math: "1/2 [ |Φ⁺⟩(α|0⟩+β|1⟩) + |Φ⁻⟩(α|0⟩-β|1⟩) + |Ψ⁺⟩(α|1⟩+β|0⟩) + |Ψ⁻⟩(α|1⟩-β|0⟩) ]",
          explanation: "Alice measures qubits 0 and 1, projecting Bob's qubit 2 into one of 4 transformed states.",
        },
        {
          step: "Step 3",
          label: "Bob Pauli Correction",
          math: "Z^{m0} X^{m1} |ψ_Bob⟩ = α|0⟩ + β|1⟩ = |ψ⟩",
          explanation: "Bob restores Alice's original state with 100% fidelity.",
        },
      ],
    },
    initialCircuit: {
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
    quiz: {
      prompt: "Why can't quantum teleportation be used to transmit information faster than light (superluminal)?",
      options: [
        "Because Bob must wait to receive Alice's 2 classical bits to know which Pauli correction (I, X, Z, XZ) to apply.",
        "Because quantum entanglement travels at the speed of sound.",
        "Because measuring a qubit creates a black hole.",
        "Because classical bits move faster than quantum amplitudes.",
      ],
      correctIndex: 0,
      explanation: "Correct! Until Bob receives Alice's 2 classical bits over a standard classical channel (bounded by the speed of light c), Bob's reduced density matrix is a completely mixed state with zero accessible information.",
    },
    miniChallenge: {
      title: "Prepare Teleportation Source",
      instructions: "Apply an X gate to qubit 0 to prepare state |1⟩ as the source and verify teleportation to Bob.",
      expectedGoal: "State |1⟩ teleported to qubit 2.",
    },
    labLink: "/quantum-lab",
  },

  "superdense-coding": {
    id: "superdense-coding",
    moduleId: "module-5",
    moduleNumber: 5,
    moduleTitle: "Quantum Information & Communication",
    title: "5.2 Superdense Coding: Transmitting 2 Classical Bits on 1 Qubit",
    subtitle: "Dual Protocol to Teleportation Using Pre-Shared Entanglement",
    duration: "25 mins",
    difficulty: "Advanced",
    objective: "Understand how pre-shared entanglement allows transmitting two classical bits (00, 01, 10, 11) by sending only a single physical qubit.",
    prerequisites: ["Module 5.1 (Quantum Teleportation)"],
    theory: {
      intro: "Superdense coding is the dual of quantum teleportation. By manipulating her half of a shared Bell pair with single-qubit Pauli operations (I, X, Z, XZ) and sending that single qubit to Bob, Alice transmits two classical bits.",
      keyPoints: [
        "Bit 00: Alice applies I → State remains |Φ⁺⟩.",
        "Bit 01: Alice applies X → State becomes |Ψ⁺⟩.",
        "Bit 10: Alice applies Z → State becomes |Φ⁻⟩.",
        "Bit 11: Alice applies iY (XZ) → State becomes |Ψ⁻⟩.",
        "Bob performs a Bell measurement to decode both classical bits with 100% fidelity.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Shared Bell Pair",
          math: "|Φ⁺⟩ = (|00⟩ + |11⟩)/√2",
          explanation: "Alice and Bob each hold one qubit of the entangled pair.",
        },
        {
          step: "Step 2",
          label: "Alice Encodes 2 Bits (e.g. '11')",
          math: "(XZ ⊗ I) |Φ⁺⟩ = (|01⟩ - |10⟩)/√2 = |Ψ⁻⟩",
          explanation: "Alice only modifies her local qubit.",
        },
        {
          step: "Step 3",
          label: "Bob Bell Decoding",
          math: "CX(0,1) · (H ⊗ I) |Ψ⁻⟩ = |11⟩",
          explanation: "Bob measures '11' deterministically.",
        },
      ],
    },
    initialCircuit: {
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
    quiz: {
      prompt: "How many physical qubits are sent through the physical channel in Superdense Coding to transmit 2 classical bits?",
      options: [
        "1 physical qubit (leveraging 1 pre-shared entangled qubit)",
        "2 physical qubits",
        "4 physical qubits",
        "Zero qubits (wireless classical radio)",
      ],
      correctIndex: 0,
      explanation: "Correct! Alice transmits only 1 single qubit to Bob over the transmission channel to convey 2 classical bits.",
    },
    miniChallenge: {
      title: "Encode Message '01'",
      instructions: "Change Alice's gate to only Pauli-X and verify Bob measures '01'.",
      expectedGoal: "100% measurement outcome on |01⟩.",
    },
    labLink: "/quantum-lab",
  },

  "density-matrices": {
    id: "density-matrices",
    moduleId: "module-5",
    moduleNumber: 5,
    moduleTitle: "Quantum Information & Communication",
    title: "5.3 Density Matrices, Mixed States & Von Neumann Entropy",
    subtitle: "Statistical Ensembles, Partial Trace & Quantum Information Loss",
    duration: "30 mins",
    difficulty: "Advanced",
    objective: "Master density matrices ρ = Σ p_i |ψ_i⟩⟨ψ_i|, the purity metric Tr(ρ²), partial tracing for subsystems, and Von Neumann entropy S(ρ) = -Tr(ρ log₂ ρ).",
    prerequisites: ["Module 2 (Multi-Qubit Systems)"],
    theory: {
      intro: "Pure quantum states can be written as statevectors |ψ⟩ with Tr(ρ²) = 1. Mixed states arise when we have classical uncertainty or when we observe an entangled subsystem by tracing out the rest of the universe.",
      keyPoints: [
        "Pure state: ρ = |ψ⟩⟨ψ| (Purity Tr(ρ²) = 1).",
        "Mixed state: ρ = Σ p_i |ψ_i⟩⟨ψ_i| (Purity Tr(ρ²) < 1).",
        "Maximally mixed single-qubit state: ρ = I/2 = [[1/2, 0], [0, 1/2]] (lies at the exact center of the Bloch sphere).",
        "Von Neumann Entropy S(ρ) = 0 for pure states, S(ρ) = 1 for maximally entangled subsystems.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Density Matrix of Bell State Subsystem",
          math: "ρ_A = Tr_B (|Φ⁺⟩⟨Φ⁺|) = 1/2 |0⟩⟨0| + 1/2 |1⟩⟨1| = I/2",
          explanation: "Tracing out Bob's qubit leaves Alice with a completely mixed state with zero coherence.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
      ],
    },
    quiz: {
      prompt: "What is the purity Tr(ρ²) of one qubit from a maximally entangled Bell state after tracing out the second qubit?",
      options: [
        "1/2 (0.5), indicating a maximally mixed subsystem",
        "1.0, indicating a pure state",
        "0.0, indicating the qubit ceased to exist",
        "2.0, indicating quantum superposition",
      ],
      correctIndex: 0,
      explanation: "Correct! Tr((I/2)²) = Tr(I/4) = 1/4 + 1/4 = 1/2, confirming it is maximally mixed.",
    },
    miniChallenge: {
      title: "Simulate Density Matrix",
      instructions: "Inspect the Bloch coordinates of an entangled qubit in Quantum Lab to see the vector length drop to 0.",
      expectedGoal: "Bloch vector length r = 0.",
    },
    labLink: "/quantum-lab",
  },

  "bb84-cryptography": {
    id: "bb84-cryptography",
    moduleId: "module-5",
    moduleNumber: 5,
    moduleTitle: "Quantum Information & Communication",
    title: "5.4 Quantum Key Distribution: BB84 & B92 Protocols",
    subtitle: "Unconditionally Secure Quantum Cryptography & Eavesdropping Detection",
    duration: "30 mins",
    difficulty: "Advanced",
    objective: "Learn the BB84 protocol: conjugate basis encoding (Z-basis vs X-basis), quantum key sifting, error rate calculation, and detecting eavesdroppers (Eve) via the no-cloning theorem.",
    prerequisites: ["Module 1 (Quantum Foundations)"],
    theory: {
      intro: "BB84, created by Charles Bennett and Gilles Brassard in 1984, provides information-theoretically secure key distribution. Security is guaranteed by the laws of quantum physics: any eavesdropper attempting to measure qubits in transit unavoidably introduces a detectable ~25% quantum bit error rate (QBER).",
      keyPoints: [
        "Alice randomly prepares bits in either Rectilinear basis {|0⟩, |1⟩} or Diagonal basis {|+⟩, |−⟩}.",
        "Bob randomly measures in either Rectilinear or Diagonal basis.",
        "Sifting: Alice and Bob publicly compare which bases they used, keeping only bits where bases matched (~50% of bits).",
        "If Eve intercepts, she introduces a 25% error rate in the matched basis bits, immediately revealing her presence.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Alice Prepares |+⟩ (X-basis)",
          math: "H |0⟩ = |+⟩",
          explanation: "Encodes bit '0' in the diagonal basis.",
        },
        {
          step: "Step 2",
          label: "Bob Measures in Z-Basis (Mismatched)",
          math: "P(0) = |⟨0|+⟩|² = 1/2,  P(1) = |⟨1|+⟩|² = 1/2",
          explanation: "Mismatched basis yields random 50/50 noise; discarded during public sifting.",
        },
      ],
    },
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "h", targets: [0] },
        { gate: "measure", targets: [0], classicalTargets: [0] },
      ],
    },
    quiz: {
      prompt: "What fundamental quantum theorem prevents an eavesdropper (Eve) from copying qubits in transit without altering them?",
      options: [
        "The No-Cloning Theorem",
        "The Born Rule",
        "The Central Limit Theorem",
        "The Pauli Exclusion Principle",
      ],
      correctIndex: 0,
      explanation: "Correct! The No-Cloning theorem proves that an unknown quantum state cannot be cloned with unit fidelity. Any intercept-resend attack introduces quantum errors that Alice and Bob detect.",
    },
    miniChallenge: {
      title: "Basis Sifting Simulation",
      instructions: "Match preparation basis (H) with measurement basis (H) to achieve 100% deterministic key transmission.",
      expectedGoal: "100% agreement on sifted key bit.",
    },
    labLink: "/quantum-lab",
  },

  // MODULE 6
  "noise-decoherence": {
    id: "noise-decoherence",
    moduleId: "module-6",
    moduleNumber: 6,
    moduleTitle: "Quantum Noise & Error Correction",
    title: "6.1 Quantum Noise Channels, Relaxation (T1) & Dephasing (T2)",
    subtitle: "Open Quantum Systems, Amplitude Damping & Phase Damping",
    duration: "25 mins",
    difficulty: "Advanced",
    objective: "Understand open quantum systems, Kraus operators, energy relaxation time T1, and phase coherence time T2* in physical qubits.",
    prerequisites: ["Module 5.3 (Density Matrices)"],
    theory: {
      intro: "Physical qubits are never perfectly isolated from their environment. Thermal fluctuations and stray electromagnetic fields cause energy dissipation (amplitude damping characterized by T1) and loss of phase coherence (phase damping characterized by T2).",
      keyPoints: [
        "T1 (Longitudinal Relaxation): Time for an excited qubit |1⟩ to decay spontaneously to ground state |0⟩.",
        "T2 (Transverse Dephasing): Time for relative phase coherence to decay into a statistical mixture: T2 ≤ 2·T1.",
        "Kraus representation: ρ(t) = Σ E_k ρ E_k† where Σ E_k† E_k = I.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Phase Damping Kraus Operators",
          math: "E₀ = [[1, 0], [0, √(1-λ)]],  E₁ = [[0, 0], [0, √λ]]",
          explanation: "Attenuates off-diagonal coherence terms ρ₀₁ and ρ₁₀ by factor (1-λ).",
        },
      ],
    },
    initialCircuit: {
      qubits: 1,
      classicalBits: 1,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "rz", targets: [0], params: [0.785398] },
      ],
    },
    quiz: {
      prompt: "What is the fundamental mathematical relationship between T1 (relaxation) and T2 (dephasing) in physical qubits?",
      options: [
        "T2 can never exceed 2·T1 (T2 ≤ 2·T1)",
        "T2 is always equal to T1²",
        "T1 is always 10 times larger than T2",
        "There is no relationship between T1 and T2",
      ],
      correctIndex: 0,
      explanation: "Correct! Pure dephasing (1/T_phi) adds to energy relaxation (1/(2T1)) such that 1/T2 = 1/(2T1) + 1/T_phi, making T2 ≤ 2·T1 a strict physical bound.",
    },
    miniChallenge: {
      title: "Model Dephasing",
      instructions: "Apply small random Z-rotations to observe how relative phase errors disrupt constructive interference.",
      expectedGoal: "Interference fidelity reduction.",
    },
    labLink: "/quantum-lab",
  },

  "shor-error-code": {
    id: "shor-error-code",
    moduleId: "module-6",
    moduleNumber: 6,
    moduleTitle: "Quantum Noise & Error Correction",
    title: "6.2 Quantum Error Correction: Bit-Flip & Shor 9-Qubit Code",
    subtitle: "Protecting Logical Qubits Against Arbitrary Quantum Errors",
    duration: "35 mins",
    difficulty: "Advanced",
    objective: "Understand 3-qubit bit-flip and phase-flip repetition codes, syndrome measurement without collapsing data, and the 9-qubit Shor code that protects against arbitrary single-qubit errors.",
    prerequisites: ["Module 6.1 (Quantum Noise)"],
    theory: {
      intro: "Classical error correction uses simple duplication (0 → 000). In quantum computing, the no-cloning theorem prevents copying states, and direct measurement destroys superposition. Quantum error correction solves this by encoding 1 logical qubit into entangled multi-qubit code spaces and measuring error syndromes non-destructively.",
      keyPoints: [
        "3-Qubit Bit-Flip Code encodes |0_L⟩ = |000⟩ and |1_L⟩ = |111⟩.",
        "Syndrome measurement measures parity operators Z₁Z₂ and Z₂Z₃ using ancilla qubits without measuring the data bits directly.",
        "Shor 9-Qubit Code concatenates bit-flip and phase-flip codes, protecting against any arbitrary single-qubit error E = c₀I + c₁X + c₂Y + c₃Z.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Logical State Encoding",
          math: "|0_L⟩ = (|000⟩ + |111⟩)(|000⟩ + |111⟩)(|000⟩ + |111⟩) / 2√2",
          explanation: "Concatenates 3-qubit phase flip blocks with 3-qubit bit flip blocks.",
        },
      ],
    },
    initialCircuit: {
      qubits: 3,
      classicalBits: 3,
      operations: [
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "cx", controls: [0], targets: [2] },
        { gate: "x", targets: [1] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "cx", controls: [0], targets: [2] },
        { gate: "measure", targets: [0, 1, 2], classicalTargets: [0, 1, 2] },
      ],
    },
    quiz: {
      prompt: "Why can quantum error correction correct continuous rotation errors (e.g. Rx(ε)) using only discrete Pauli error syndrome measurements?",
      options: [
        "Because measuring the discrete error syndrome projects continuous errors onto discrete Pauli operators (I, X, Y, Z).",
        "Because continuous errors do not happen on real quantum hardware.",
        "Because quantum hardware only has integer angles.",
        "Because the ancilla qubit absorbs the continuous angle.",
      ],
      correctIndex: 0,
      explanation: "Correct! The discretization of errors principle shows that measuring discrete Pauli syndromes collapses any continuous error αI + βX into either no error (I) or a discrete bit-flip (X), which can then be corrected cleanly.",
    },
    miniChallenge: {
      title: "Correct a Bit-Flip Error",
      instructions: "Simulate the 3-qubit bit-flip code with an injected X error on qubit 1 and verify error recovery.",
      expectedGoal: "Logical state preserved with 100% fidelity.",
    },
    labLink: "/quantum-lab",
  },

  "stabilizer-surface-codes": {
    id: "stabilizer-surface-codes",
    moduleId: "module-6",
    moduleNumber: 6,
    moduleTitle: "Quantum Noise & Error Correction",
    title: "6.3 Stabilizer Formalism, Surface Codes & Fault Tolerance",
    subtitle: "2D Lattice Surface Codes & The Fault-Tolerance Threshold Theorem",
    duration: "40 mins",
    difficulty: "Advanced",
    objective: "Master the Stabilizer Formalism (Abelian subgroup of Pauli group), 2D Surface Codes with localized nearest-neighbor syndrome checks, and the threshold theorem for fault tolerance.",
    prerequisites: ["Module 6.2 (Shor Error Code)"],
    theory: {
      intro: "Surface codes are the leading architecture for practical fault-tolerant quantum computing due to their high error threshold (~1%) and 2D nearest-neighbor grid layout. Qubits are arranged on a 2D checkerboard where data qubits interact only with adjacent X and Z syndrome ancillas.",
      keyPoints: [
        "Stabilizer Group S: An abelian subgroup of the n-qubit Pauli group with -I ∉ S. Code space is the +1 eigenspace: S|ψ⟩ = |ψ⟩.",
        "Surface Code defines Z-plaquette stabilizer checks (detecting X bit flips) and X-star stabilizer checks (detecting Z phase flips).",
        "Threshold Theorem: If physical gate error rate p < p_th (~1%), logical error rate decays exponentially with code distance d: P_L ∝ (p/p_th)^((d+1)/2).",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Stabilizer Generator Commutation",
          math: "[g_i, g_j] = 0  ∀ g_i, g_j ∈ S",
          explanation: "Commuting generators can be measured simultaneously without mutual disturbance.",
        },
      ],
    },
    initialCircuit: {
      qubits: 4,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "cx", controls: [1], targets: [2] },
        { gate: "cx", controls: [2], targets: [3] },
      ],
    },
    quiz: {
      prompt: "What does the Quantum Fault-Tolerance Threshold Theorem guarantee?",
      options: [
        "Arbitrarily long quantum computations can be executed with arbitrary accuracy provided the physical gate error rate is below a fixed threshold.",
        "Quantum computers can operate at room temperature without cryogenics.",
        "Quantum error correction eliminates the need for physical qubits.",
        "Quantum computers will always be 100% faster than classical computers.",
      ],
      correctIndex: 0,
      explanation: "Correct! The threshold theorem proves that as long as physical noise is below threshold (~1% for surface codes), scaling code distance d exponentially suppresses logical errors.",
    },
    miniChallenge: {
      title: "Stabilizer Parity Check",
      instructions: "Construct a 4-qubit stabilizer syndrome circuit and verify zero logical error.",
      expectedGoal: "Stabilizer state verified in simulator.",
    },
    labLink: "/quantum-lab",
  },

  // MODULE 7
  "vqe-quantum-chemistry": {
    id: "vqe-quantum-chemistry",
    moduleId: "module-7",
    moduleNumber: 7,
    moduleTitle: "Quantum Computing Applications",
    title: "7.1 Variational Quantum Eigensolver (VQE) & Molecular Simulation",
    subtitle: "Hybrid Quantum-Classical Algorithms for Ground State Energy",
    duration: "35 mins",
    difficulty: "Advanced",
    objective: "Understand the Variational Quantum Eigensolver (VQE), parameterized quantum circuits (Ansatz U(θ)), the Rayleigh-Ritz variational principle, and molecular ground state energy calculation.",
    prerequisites: ["Module 2 & Module 4 (Circuits & Oracles)"],
    theory: {
      intro: "Exact quantum chemistry simulation is classically intractable due to exponential electron configuration spaces. VQE is a hybrid quantum-classical algorithm designed for NISQ devices: a quantum processor prepares parameterized ansatz states |ψ(θ)⟩ and measures energy ⟨H⟩, while a classical optimizer updates θ to find the minimum ground state energy E₀.",
      keyPoints: [
        "Variational Principle: ⟨ψ(θ)|H|ψ(θ)⟩ ≥ E₀ (measured energy is always an upper bound on the true ground state).",
        "Jordan-Wigner or Bravyi-Kitaev mappings convert fermionic molecular Hamiltonians into Pauli operator sums: H = Σ c_i P_i.",
        "Hardware-efficient or Unitary Coupled Cluster (UCCSD) ansätze balance expressibility with circuit depth.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Energy Expectation Value",
          math: "E(θ) = ⟨0| U†(θ) H U(θ) |0⟩ = Σ c_i ⟨ψ(θ)| P_i |ψ(θ)⟩",
          explanation: "Quantum circuit evaluates individual Pauli string expectations.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "ry", targets: [0], params: [0.785] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "ry", targets: [1], params: [1.57] },
      ],
    },
    quiz: {
      prompt: "Why is VQE categorized as a hybrid quantum-classical algorithm?",
      options: [
        "Because state preparation and energy measurement happen on quantum hardware, while parameter optimization (gradient descent/COBYLA) runs on a classical computer.",
        "Because it uses half classical bits and half quantum bits.",
        "Because it requires a classical supercomputer to simulate the quantum processor.",
        "Because it only works on hybrid cars.",
      ],
      correctIndex: 0,
      explanation: "Correct! VQE delegates only the exponentially hard quantum state preparation and observable evaluation to the quantum processor, using classical optimizers to adjust parameters in a feedback loop.",
    },
    miniChallenge: {
      title: "Parameter Sweep",
      instructions: "Tune the Ry angle in the ansatz circuit to minimize the energy expectation value.",
      expectedGoal: "Minimized expectation value corresponding to ground state.",
    },
    labLink: "/quantum-lab",
  },

  "qaoa-optimization": {
    id: "qaoa-optimization",
    moduleId: "module-7",
    moduleNumber: 7,
    moduleTitle: "Quantum Computing Applications",
    title: "7.2 Quantum Approximate Optimization Algorithm (QAOA)",
    subtitle: "Solving Combinatorial NP-Hard Optimization Problems (Max-Cut)",
    duration: "35 mins",
    difficulty: "Advanced",
    objective: "Master QAOA for combinatorial optimization: Cost Hamiltonian H_C, Mixer Hamiltonian H_M, parameter vectors (γ, β), and graph Max-Cut solving.",
    prerequisites: ["Module 7.1 (VQE)"],
    theory: {
      intro: "QAOA is a variational algorithm developed by Edward Farhi et al. to approximate solutions to NP-hard combinatorial optimization problems like Max-Cut and Traveling Salesperson. It alternates applying a problem-specific cost Hamiltonian and a transverse-field mixer Hamiltonian.",
      keyPoints: [
        "Cost Layer: U(C, γ) = exp(-i γ H_C) encodes the optimization objective into quantum phases.",
        "Mixer Layer: U(B, β) = exp(-i β H_M) = Π_i Rx(2β) drives quantum tunneling across candidate solutions.",
        "As depth p → ∞, QAOA converges to the exact adiabatic quantum state, yielding the optimal solution.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Max-Cut Cost Hamiltonian for Edge (i, j)",
          math: "H_C = 1/2 Σ_{(i,j) ∈ E} (I - Z_i Z_j)",
          explanation: "Assigns lower energy when connected vertices have opposite bit assignments (Z_i Z_j = -1).",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0, 1] },
        { gate: "cz", controls: [0], targets: [1] },
        { gate: "rx", targets: [0, 1], params: [0.785] },
      ],
    },
    quiz: {
      prompt: "What is the purpose of the Mixer Hamiltonian (H_M = Σ X_i) in QAOA?",
      options: [
        "To induce quantum tunneling and interference between different classical bit configurations.",
        "To cool the quantum processor to absolute zero.",
        "To measure the final state into classical memory.",
        "To eliminate all CNOT gates.",
      ],
      correctIndex: 0,
      explanation: "Correct! The mixer Hamiltonian acts as a transverse magnetic field that creates quantum transitions between orthogonal computational basis states, allowing the system to explore the solution space.",
    },
    miniChallenge: {
      title: "QAOA Max-Cut Layer",
      instructions: "Construct a 2-qubit QAOA layer with cost CZ interaction and mixer Rx rotation.",
      expectedGoal: "High probability on anti-correlated cuts |01⟩ and |10⟩.",
    },
    labLink: "/quantum-lab",
  },

  "qml-quantum-sensing": {
    id: "qml-quantum-sensing",
    moduleId: "module-7",
    moduleNumber: 7,
    moduleTitle: "Quantum Computing Applications",
    title: "7.3 Quantum Machine Learning & Quantum Sensing",
    subtitle: "Quantum Neural Networks, Kernel Methods & Heisenberg-Limited Metrology",
    duration: "30 mins",
    difficulty: "Advanced",
    objective: "Explore Quantum Machine Learning (Quantum Kernel Estimation, QNNs, Barren Plateaus) and Quantum Sensing utilizing entangled GHZ states to achieve the Heisenberg precision limit Δθ ∝ 1/N.",
    prerequisites: ["Module 7.1 & 7.2 (Variational Algorithms)"],
    theory: {
      intro: "Quantum Machine Learning maps classical data into exponentially large Hilbert spaces via quantum feature maps, enabling linear separation of complex data using quantum kernel estimation. In quantum metrology, entangled states surpass the classical Standard Quantum Limit (1/√N) to reach the fundamental Heisenberg limit (1/N).",
      keyPoints: [
        "Quantum Feature Maps: Φ(x) maps classical data vector x to quantum state |Φ(x)⟩.",
        "Quantum Kernel: K(x, y) = |⟨Φ(x)|Φ(y)⟩|² computed directly on a quantum simulator.",
        "Heisenberg Limit: Entangled N-qubit probes achieve measurement precision Δθ = 1/N compared to classical uncorrelated precision 1/√N.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Standard Quantum Limit vs Heisenberg Limit",
          math: "Δθ_{classical} = 1/√N  vs  Δθ_{Heisenberg} = 1/N",
          explanation: "Entanglement provides a quadratic improvement in phase estimation precision.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0, 1] },
        { gate: "rz", targets: [0], params: [1.2] },
        { gate: "rz", targets: [1], params: [2.4] },
        { gate: "cz", controls: [0], targets: [1] },
      ],
    },
    quiz: {
      prompt: "What challenge in variational quantum machine learning causes gradients to vanish exponentially with qubit count?",
      options: [
        "Barren Plateaus",
        "Overfitting",
        "The Born Rule",
        "Quantum Teleportation",
      ],
      correctIndex: 0,
      explanation: "Correct! Barren plateaus occur in random deep parameterized quantum circuits where the gradient of the loss function vanishes exponentially in the number of qubits (Var[∂L/∂θ] ∝ 2^(-n)).",
    },
    miniChallenge: {
      title: "Quantum Kernel Feature Map",
      instructions: "Simulate a 2-qubit feature map circuit and observe the resulting statevector overlap.",
      expectedGoal: "Parameterized quantum statevector generated.",
    },
    labLink: "/quantum-lab",
  },

  // MODULE 8
  "qubit-modalities": {
    id: "qubit-modalities",
    moduleId: "module-8",
    moduleNumber: 8,
    moduleTitle: "Quantum Hardware & Real-World Systems",
    title: "8.1 Superconducting Transmons & Trapped-Ion Processors",
    subtitle: "Josephson Junctions, Microwave Control & Laser-Cooled Ions",
    duration: "25 mins",
    difficulty: "Intermediate",
    objective: "Understand physical superconducting transmon qubits (Josephson non-linear inductance, dispersive readout) and trapped-ion systems (Coulomb crystals, Mølmer-Sørensen entangling gates).",
    prerequisites: ["Module 1 & Module 2 (Foundations & Circuits)"],
    theory: {
      intro: "Realizing physical qubits requires isolating two discrete quantum energy levels with long coherence times and fast gate control. Superconducting circuits (IBM, Google, Rigetti) and Trapped Ions (IonQ, Quantinuum) represent the two most mature commercial hardware modalities.",
      keyPoints: [
        "Superconducting Transmon: Non-linear LC oscillator using a Josephson junction to isolate the |0⟩ ↔ |1⟩ transition frequency (~4-6 GHz).",
        "Trapped Ions: Individual atomic ions (e.g. 171Yb⁺, 40Ca⁺) suspended in electromagnetic Paul traps, driven by ultra-stable lasers with all-to-all connectivity.",
        "Fidelity Tradeoff: Superconducting gates are fast (10-100 ns) but have shorter coherence (~100 μs); Trapped ions have long coherence (>seconds) but slower gate speeds (~10-100 μs).",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Transmon Hamiltonian Anharmonicity",
          math: "H = 4 E_C (n - n_g)² - E_J cos(φ) ≈ ℏω₀₁ |1⟩⟨1| + ℏ(2ω₀₁ - η) |2⟩⟨2|",
          explanation: "Anharmonicity η ensures microwave pulses at ω₀₁ only excite |0⟩ → |1⟩ without leaking into |2⟩.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
      ],
    },
    quiz: {
      prompt: "Why is the non-linear Josephson junction necessary in superconducting transmon qubits?",
      options: [
        "It makes the energy level spacing non-uniform (anharmonic), preventing microwave pulses from unintentionally exciting higher leakage states (|2⟩, |3⟩).",
        "It generates electricity to power the quantum chip.",
        "It acts as a physical thermometer inside the fridge.",
        "It eliminates all magnetic fields.",
      ],
      correctIndex: 0,
      explanation: "Correct! A standard LC circuit has equidistant harmonic energy levels. The non-linear Josephson inductance creates an anharmonic energy spectrum where the 0→1 transition frequency differs uniquely from 1→2.",
    },
    miniChallenge: {
      title: "Model Hardware Topology",
      instructions: "Construct a 2-qubit circuit with CNOT and inspect how gate fidelity impacts state preparation.",
      expectedGoal: "2-qubit entangled state on hardware model.",
    },
    labLink: "/quantum-lab",
  },

  "photonic-neutral-atoms": {
    id: "photonic-neutral-atoms",
    moduleId: "module-8",
    moduleNumber: 8,
    moduleTitle: "Quantum Hardware & Real-World Systems",
    title: "8.2 Photonic, Neutral Atom & Silicon Spin Qubits",
    subtitle: "Optical Tweezers, Rydberg Blockade & Room-Temperature Photons",
    duration: "25 mins",
    difficulty: "Intermediate",
    objective: "Learn about neutral atom quantum processors (optical tweezers, Rydberg blockade), photonic quantum computing (beam splitters, squeeze states), and silicon spin qubits (quantum dots).",
    prerequisites: ["Module 8.1 (Qubit Modalities)"],
    theory: {
      intro: "Beyond transmons and ions, emerging quantum hardware includes Neutral Atoms (QuEra, Pasqal) positioned with optical tweezers, Photonic processors (PsiQuantum, Xanadu) operating at room temperature, and Silicon Quantum Dots (Intel) leveraging industrial semiconductor fabrication.",
      keyPoints: [
        "Neutral Atoms: Hundreds of individual neutral atoms arranged in dynamic 2D/3D geometries; entangling gates leverage the strong dipole-dipole Rydberg Blockade.",
        "Photonic Qubits: Encode quantum information in single photons using polarization or path modes; minimal decoherence, operates at ambient temperature.",
        "Silicon Spin Qubits: Electron spins trapped in semiconductor quantum dots, promising scalable integration with existing CMOS foundry manufacturing.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Rydberg Blockade Radius",
          math: "V_{vdW} = C₆ / R⁶",
          explanation: "Exciting one atom to a high Rydberg state shifts the energy of neighbors within radius R_b, preventing multiple excitations and creating deterministic CNOT gates.",
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
      ],
    },
    quiz: {
      prompt: "What physical mechanism enables 2-qubit entangling gates in neutral atom quantum processors?",
      options: [
        "The Rydberg Blockade effect",
        "Superconducting Josephson tunneling",
        "Optical fiber total internal reflection",
        "Nuclear magnetic resonance",
      ],
      correctIndex: 0,
      explanation: "Correct! When an atom is excited to a high principal quantum number Rydberg state, its massive electric dipole shifts the energy levels of nearby atoms, blocking simultaneous excitation and creating conditional logic.",
    },
    miniChallenge: {
      title: "Neutral Atom 3-Qubit Array",
      instructions: "Simulate a 3-qubit entangling sequence matching Rydberg array geometry.",
      expectedGoal: "3-qubit entangled GHZ state.",
    },
    labLink: "/quantum-lab",
  },

  "cryogenics-control-nisq": {
    id: "cryogenics-control-nisq",
    moduleId: "module-8",
    moduleNumber: 8,
    moduleTitle: "Quantum Hardware & Real-World Systems",
    title: "8.3 Cryogenics, Microwave Control & NISQ Constraints",
    subtitle: "Dilution Refrigerators, Arbitrary Waveform Generators & Crosstalk",
    duration: "25 mins",
    difficulty: "Intermediate",
    objective: "Understand dilution refrigerator stages (15 mK), microwave control pulse shaping (DRAG), readout resonators, crosstalk, and NISQ hardware constraints.",
    prerequisites: ["Module 8.1 & 8.2"],
    theory: {
      intro: "To prevent thermal noise (k_B T) from destroying superconducting quantum states, quantum processors operate inside dilution refrigerators cooled to ~15 milliKelvin—colder than deep space. High-speed Arbitrary Waveform Generators (AWGs) deliver nanosecond microwave pulses down coaxial lines to execute gates.",
      keyPoints: [
        "Dilution Refrigerator uses 3He/4He isotope phase separation to reach ~10–15 mK.",
        "DRAG (Derivative Removal by Adiabatic Gate) pulse shaping prevents leakage into higher transmon energy levels.",
        "NISQ Constraints: Limited qubit count (50–1000), gate errors (0.1%–1%), and restricted nearest-neighbor qubit connectivity.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Thermal Energy vs Transition Frequency",
          math: "k_B T << ℏ ω₀₁  (at 15 mK, k_B T ≈ 0.3 GHz << 5 GHz)",
          explanation: "Ensures the thermal occupation of the excited state |1⟩ is practically zero.",
        },
      ],
    },
    initialCircuit: {
      qubits: 2,
      classicalBits: 2,
      operations: [
        { gate: "rx", targets: [0], params: [1.570796] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
      ],
    },
    quiz: {
      prompt: "Why must superconducting quantum processors be cooled to ~15 milliKelvin inside a dilution refrigerator?",
      options: [
        "To ensure thermal energy (k_B T) is much lower than the qubit transition energy (ℏω), keeping qubits in their ground state.",
        "To make the computer run faster like an overclocked CPU.",
        "To freeze the statevectors in place so they don't move.",
        "Because laser light requires cryogenic temperatures to reflect.",
      ],
      correctIndex: 0,
      explanation: "Correct! At room temperature (300 K), thermal energy would violently scramble the 5 GHz quantum states. At 15 mK, thermal excitation is negligible.",
    },
    miniChallenge: {
      title: "Model Pulse Sequence",
      instructions: "Simulate a calibrated Rx pulse sequence followed by measurement.",
      expectedGoal: "Equal superposition measurement on physical model.",
    },
    labLink: "/quantum-lab",
  },

  // MODULE 9
  "quantum-complexity": {
    id: "quantum-complexity",
    moduleId: "module-9",
    moduleNumber: 9,
    moduleTitle: "Research & Advanced Quantum Computing",
    title: "9.1 Computational Complexity: P, NP, BPP, BQP & QMA",
    subtitle: "The Theoretical Boundaries of Quantum Computational Advantage",
    duration: "30 mins",
    difficulty: "Advanced",
    objective: "Master quantum complexity theory: BPP (classical randomized), BQP (bounded-error quantum polynomial), NP, and QMA (Quantum Merlin-Arthur, the quantum analog of NP).",
    prerequisites: ["Module 0 & Module 4 (Foundations & Algorithms)"],
    theory: {
      intro: "Complexity theory formally defines what quantum computers can and cannot solve efficiently. BQP encompasses problems solvable in polynomial time by a quantum computer with bounded error probability (≤ 1/3).",
      keyPoints: [
        "P ⊆ BPP ⊆ BQP ⊆ PSPACE.",
        "Factoring is in BQP but not believed to be in P, illustrating quantum algorithmic advantage.",
        "NP-Complete problems are not believed to be solvable in polynomial time by quantum computers (BQP is not believed to contain NP-Complete).",
        "QMA is the quantum generalization of NP, where the witness (proof) is itself a quantum state |ψ⟩.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "BQP Decision Rule",
          math: "x ∈ L ⟹ P_{accept} ≥ 2/3,   x ∉ L ⟹ P_{accept} ≤ 1/3",
          explanation: "Standard amplification allows reducing error probability exponentially in O(k) repetitions.",
        },
      ],
    },
    initialCircuit: {
      qubits: 3,
      classicalBits: 3,
      operations: [
        { gate: "h", targets: [0, 1, 2] },
        { gate: "cz", controls: [0], targets: [1] },
        { gate: "cz", controls: [1], targets: [2] },
        { gate: "h", targets: [0, 1, 2] },
        { gate: "measure", targets: [0, 1, 2], classicalTargets: [0, 1, 2] },
      ],
    },
    quiz: {
      prompt: "Can quantum computers solve all NP-Complete problems (like Traveling Salesperson) in polynomial time (O(n^k))?",
      options: [
        "No, complexity theory strongly believes BQP does not contain NP-Complete; quantum algorithms provide polynomial speedups (Grover O(√N)), but not general polynomial-time solutions.",
        "Yes, Shor's algorithm proves all NP problems are in BQP.",
        "Yes, quantum computers test infinite universes simultaneously.",
        "No, quantum computers cannot solve any NP problems.",
      ],
      correctIndex: 0,
      explanation: "Correct! Quantum computers do not magically try all combinations instantaneously. Grover search provides a quadratic speedup (O(2^(n/2))), but no known quantum algorithm solves general NP-Complete problems in polynomial time.",
    },
    miniChallenge: {
      title: "BQP Decision Circuit",
      instructions: "Construct an interference decision circuit that distinguishes language membership with >80% probability.",
      expectedGoal: "Clear probability separation on output register.",
    },
    labLink: "/quantum-lab",
  },

  "paper-reproduction": {
    id: "paper-reproduction",
    moduleId: "module-9",
    moduleNumber: 9,
    moduleTitle: "Research & Advanced Quantum Computing",
    title: "9.2 Reading Quantum Papers & Reproducing Published Circuits",
    subtitle: "Literature Analysis, Experiment Reconstruction & Benchmarking",
    duration: "35 mins",
    difficulty: "Advanced",
    objective: "Develop research skills to read quantum computing literature (arXiv/Nature/PRL), parse circuit diagrams, reproduce published experiments in code, and validate numerical results.",
    prerequisites: ["Module 3 & Module 4 (Programming & Algorithms)"],
    theory: {
      intro: "Reproducing published quantum experiments is a foundational skill in quantum research. This lesson walks through reading quantum physics preprints on arXiv, extracting Hamiltonian parameters, mapping circuits into Qiskit/SAMBHAV, and validating results against published figures.",
      keyPoints: [
        "Deconstruct arXiv papers: Identify problem Hamiltonian, state preparation ansatz, error mitigation techniques, and measurement metrics.",
        "Verify circuit equivalence: Map published multi-qubit unitary blocks into elementary universal gates (CX, Rz, SX).",
        "Benchmark against published fidelity: Compare simulation outputs with experimental state tomography or randomized benchmarking data.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "State Fidelity Metric (Uhlmann)",
          math: "F(ρ, σ) = (Tr √(√ρ σ √ρ))²",
          explanation: "Quantifies overlap between simulated output ρ and published experimental target σ.",
        },
      ],
    },
    initialCircuit: {
      qubits: 3,
      classicalBits: 3,
      operations: [
        { gate: "h", targets: [0] },
        { gate: "cx", controls: [0], targets: [1] },
        { gate: "rx", targets: [2], params: [0.785398] },
        { gate: "cz", controls: [1], targets: [2] },
        { gate: "h", targets: [0, 1] },
        { gate: "measure", targets: [0, 1, 2], classicalTargets: [0, 1, 2] },
      ],
    },
    quiz: {
      prompt: "When reproducing a published quantum algorithm from a research paper, what is the best metric to verify that your reproduced circuit matches the theoretical pure state?",
      options: [
        "Quantum State Fidelity F(|ψ_sim⟩, |ψ_theory⟩) = |⟨ψ_theory|ψ_sim⟩|² = 1.0",
        "The number of lines of Python code written",
        "The time of day the simulation ran",
        "The temperature of the room",
      ],
      correctIndex: 0,
      explanation: "Correct! Quantum state fidelity measures the squared overlap between the simulated statevector and the theoretical expectation, with F = 1.0 indicating perfect mathematical reproduction.",
    },
    miniChallenge: {
      title: "Reproduce 3-Qubit Entanglement",
      instructions: "Simulate the published benchmark circuit and confirm statevector fidelity.",
      expectedGoal: "High fidelity output matching theoretical target.",
    },
    labLink: "/quantum-lab",
  },

  "research-methodology": {
    id: "research-methodology",
    moduleId: "module-9",
    moduleNumber: 9,
    moduleTitle: "Research & Advanced Quantum Computing",
    title: "9.3 Research Project Workflow, Benchmarking & Experimentation",
    subtitle: "From Hypothesis to Execution: Scientific Quantum Methodology",
    duration: "30 mins",
    difficulty: "Advanced",
    objective: "Master the complete quantum research workflow: formulating hypotheses, designing numerical benchmarks, applying error mitigation, analyzing statistical uncertainty, and presenting findings.",
    prerequisites: ["Module 9.1 & 9.2 (Complexity & Paper Reproduction)"],
    theory: {
      intro: "Conducting rigorous quantum computing research requires a disciplined methodology: defining quantifiable hypotheses, selecting proper baselines (classical vs quantum), calculating error margins with bootstrapping, and presenting reproducible code and artifacts.",
      keyPoints: [
        "Research Hypothesis: Formulate testable assertions regarding algorithmic scaling, gate depth, or error resilience.",
        "Error Mitigation: Apply Zero-Noise Extrapolation (ZNE), Readout Error Mitigation (M3), and Randomized Compiling to suppress NISQ hardware noise.",
        "Statistical Rigor: Run sufficient shot budgets (e.g. 10,000 shots) and report 95% confidence intervals on expectation values.",
      ],
      mathSteps: [
        {
          step: "Step 1",
          label: "Statistical Standard Error of the Mean",
          math: "SE = σ / √M = √(P(1 - P) / M)",
          explanation: "For M shots, standard deviation decreases as 1/√M.",
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
      prompt: "Why is Zero-Noise Extrapolation (ZNE) used in quantum computing research on NISQ hardware?",
      options: [
        "It deliberately scales physical noise upwards to extrapolate the ideal zero-noise result without requiring physical fault tolerance.",
        "It removes all hardware noise at zero financial cost.",
        "It converts quantum circuits into classical Python scripts.",
        "It increases the clock frequency of the processor.",
      ],
      correctIndex: 0,
      explanation: "Correct! ZNE intentionally amplifies noise (via gate pulse stretching or unitary folding) to measure expectation values at multiple noise levels, then extrapolates back to the theoretical zero-noise limit.",
    },
    miniChallenge: {
      title: "Design Research Benchmark",
      instructions: "Build and execute a multi-qubit experiment in Quantum Lab and export data for scientific presentation.",
      expectedGoal: "Benchmark dataset generated and verified.",
    },
    labLink: "/quantum-lab",
  },
};
