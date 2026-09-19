import type { AITutorRequest, AITutorResponse, CircuitIR, SimulationResult } from "../types";

// Complex number helpers
interface Complex {
  r: number;
  i: number;
}

function cAdd(a: Complex, b: Complex): Complex {
  return { r: a.r + b.r, i: a.i + b.i };
}

function cMult(a: Complex, b: Complex): Complex {
  return { r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r };
}

function cAbs(a: Complex): number {
  return Math.sqrt(a.r * a.r + a.i * a.i);
}

function cPhase(a: Complex): number {
  return Math.atan2(a.i, a.r);
}

const INV_SQRT_2 = 1 / Math.SQRT2;

function getGateMatrix(gate: string): [[Complex, Complex], [Complex, Complex]] {
  switch (gate) {
    case "h":
      return [
        [{ r: INV_SQRT_2, i: 0 }, { r: INV_SQRT_2, i: 0 }],
        [{ r: INV_SQRT_2, i: 0 }, { r: -INV_SQRT_2, i: 0 }],
      ];
    case "x":
      return [
        [{ r: 0, i: 0 }, { r: 1, i: 0 }],
        [{ r: 1, i: 0 }, { r: 0, i: 0 }],
      ];
    case "y":
      return [
        [{ r: 0, i: 0 }, { r: 0, i: -1 }],
        [{ r: 0, i: 1 }, { r: 0, i: 0 }],
      ];
    case "z":
      return [
        [{ r: 1, i: 0 }, { r: 0, i: 0 }],
        [{ r: 0, i: 0 }, { r: -1, i: 0 }],
      ];
    case "s":
      return [
        [{ r: 1, i: 0 }, { r: 0, i: 0 }],
        [{ r: 0, i: 0 }, { r: 0, i: 1 }],
      ];
    case "t":
      return [
        [{ r: 1, i: 0 }, { r: 0, i: 0 }],
        [{ r: 0, i: 0 }, { r: Math.cos(Math.PI / 4), i: Math.sin(Math.PI / 4) }],
      ];
    default:
      return [
        [{ r: 1, i: 0 }, { r: 0, i: 0 }],
        [{ r: 0, i: 0 }, { r: 1, i: 0 }],
      ];
  }
}

function getRotationMatrix(gate: string, theta: number): [[Complex, Complex], [Complex, Complex]] {
  const c = Math.cos(theta / 2);
  const s = Math.sin(theta / 2);
  if (gate === "rx") {
    return [
      [{ r: c, i: 0 }, { r: 0, i: -s }],
      [{ r: 0, i: -s }, { r: c, i: 0 }],
    ];
  }
  if (gate === "ry") {
    return [
      [{ r: c, i: 0 }, { r: -s, i: 0 }],
      [{ r: s, i: 0 }, { r: c, i: 0 }],
    ];
  }
  // rz
  return [
    [{ r: Math.cos(-theta / 2), i: Math.sin(-theta / 2) }, { r: 0, i: 0 }],
    [{ r: 0, i: 0 }, { r: Math.cos(theta / 2), i: Math.sin(theta / 2) }],
  ];
}

export function simulateCircuitLocally(circuit: CircuitIR, shots: number = 1024): SimulationResult {
  const qubits = circuit.qubits || 1;
  const numStates = 1 << qubits;
  let state: Complex[] = Array.from({ length: numStates }, (_, i) => (i === 0 ? { r: 1, i: 0 } : { r: 0, i: 0 }));

  for (const op of circuit.operations || []) {
    if (op.gate === "measure") continue;

    if (["h", "x", "y", "z", "s", "t"].includes(op.gate)) {
      const mat = getGateMatrix(op.gate);
      const target = op.targets[0];
      const mask = 1 << (qubits - target - 1);
      const next = [...state];
      for (let basis = 0; basis < numStates; basis++) {
        if (basis & mask) continue;
        const paired = basis | mask;
        const zero = state[basis];
        const one = state[paired];
        next[basis] = cAdd(cMult(mat[0][0], zero), cMult(mat[0][1], one));
        next[paired] = cAdd(cMult(mat[1][0], zero), cMult(mat[1][1], one));
      }
      state = next;
    } else if (["rx", "ry", "rz"].includes(op.gate)) {
      const theta = op.params?.[0] ?? Math.PI;
      const mat = getRotationMatrix(op.gate, theta);
      const target = op.targets[0];
      const mask = 1 << (qubits - target - 1);
      const next = [...state];
      for (let basis = 0; basis < numStates; basis++) {
        if (basis & mask) continue;
        const paired = basis | mask;
        const zero = state[basis];
        const one = state[paired];
        next[basis] = cAdd(cMult(mat[0][0], zero), cMult(mat[0][1], one));
        next[paired] = cAdd(cMult(mat[1][0], zero), cMult(mat[1][1], one));
      }
      state = next;
    } else if (op.gate === "cx" || op.gate === "cz") {
      const mat = getGateMatrix(op.gate === "cx" ? "x" : "z");
      const ctrl = op.controls?.[0] ?? 0;
      const target = op.targets[0];
      const ctrlMask = 1 << (qubits - ctrl - 1);
      const targetMask = 1 << (qubits - target - 1);
      const next = [...state];
      for (let basis = 0; basis < numStates; basis++) {
        if (!(basis & ctrlMask) || basis & targetMask) continue;
        const paired = basis | targetMask;
        const zero = state[basis];
        const one = state[paired];
        next[basis] = cAdd(cMult(mat[0][0], zero), cMult(mat[0][1], one));
        next[paired] = cAdd(cMult(mat[1][0], zero), cMult(mat[1][1], one));
      }
      state = next;
    } else if (op.gate === "swap") {
      const first = op.targets[0];
      const second = op.targets[1];
      const firstMask = 1 << (qubits - first - 1);
      const secondMask = 1 << (qubits - second - 1);
      const next = [...state];
      for (let basis = 0; basis < numStates; basis++) {
        const firstBit = Boolean(basis & firstMask);
        const secondBit = Boolean(basis & secondMask);
        if (firstBit === secondBit) continue;
        const swapped = basis ^ firstMask ^ secondMask;
        next[swapped] = state[basis];
      }
      state = next;
    }
  }

  // Calculate probabilities & counts
  const probabilities: Record<string, number> = {};
  const counts: Record<string, number> = {};
  let totalSampled = 0;

  for (let i = 0; i < numStates; i++) {
    const basisStr = i.toString(2).padStart(qubits, "0");
    const prob = cAbs(state[i]) ** 2;
    if (prob > 1e-7) {
      probabilities[basisStr] = Math.round(prob * 1e6) / 1e6;
      const count = Math.round(prob * shots);
      counts[basisStr] = count;
      totalSampled += count;
    }
  }

  // Adjust count difference
  const diff = shots - totalSampled;
  if (diff !== 0 && Object.keys(counts).length > 0) {
    const highest = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
    counts[highest] = Math.max(0, counts[highest] + diff);
  }

  // State amplitudes
  const statevector = state
    .map((amp, idx) => {
      const mag = cAbs(amp);
      if (mag <= 1e-7) return null;
      return {
        basis: idx.toString(2).padStart(qubits, "0"),
        real: Math.round(amp.r * 1e6) / 1e6,
        imag: Math.round(amp.i * 1e6) / 1e6,
        magnitude: Math.round(mag * 1e6) / 1e6,
        phase: Math.round(cPhase(amp) * 1e6) / 1e6,
      };
    })
    .filter(Boolean) as SimulationResult["statevector"];

  // Bloch vectors (for 1-qubit)
  const bloch: SimulationResult["bloch"] = [];
  if (qubits === 1) {
    const a = state[0];
    const b = state[1];
    // a* * b = (ar - i ai)(br + i bi) = (ar br + ai bi) + i (ar bi - ai br)
    const x = 2 * (a.r * b.r + a.i * b.i);
    const y = 2 * (a.r * b.i - a.i * b.r);
    const z = a.r * a.r + a.i * a.i - (b.r * b.r + b.i * b.i);
    bloch.push({
      qubit: 0,
      x: Math.round(x * 1e6) / 1e6,
      y: Math.round(y * 1e6) / 1e6,
      z: Math.round(z * 1e6) / 1e6,
    });
  }

  // Dirac notation string
  const diracTerms: string[] = [];
  for (let i = 0; i < numStates; i++) {
    const amp = state[i];
    const mag = cAbs(amp);
    if (mag <= 1e-4) continue;
    const basis = i.toString(2).padStart(qubits, "0");
    const r = Math.round(amp.r * 1000) / 1000;
    const im = Math.round(amp.i * 1000) / 1000;

    if (Math.abs(im) < 1e-4) {
      if (r === 1) diracTerms.push(diracTerms.length ? `+ |${basis}⟩` : `|${basis}⟩`);
      else if (r === -1) diracTerms.push(`- |${basis}⟩`);
      else diracTerms.push(`${r >= 0 && diracTerms.length ? "+" : ""}${r}|${basis}⟩`);
    } else if (Math.abs(r) < 1e-4) {
      if (im === 1) diracTerms.push(diracTerms.length ? `+ i|${basis}⟩` : `i|${basis}⟩`);
      else if (im === -1) diracTerms.push(`- i|${basis}⟩`);
      else diracTerms.push(`${im >= 0 && diracTerms.length ? "+" : ""}${im}i|${basis}⟩`);
    } else {
      const sign = im > 0 ? "+" : "-";
      diracTerms.push(`${diracTerms.length ? "+ " : ""}(${r} ${sign} ${Math.abs(im)}i)|${basis}⟩`);
    }
  }

  const dirac = diracTerms.length ? `|ψ⟩ = ${diracTerms.join(" ")}` : "|ψ⟩ = |0⟩";

  return {
    backend: "local_statevector_in_browser",
    shots,
    counts,
    probabilities,
    statevector,
    bloch,
    dirac,
    warnings: [],
  };
}

export function generateLocalQiskitCode(circuit: CircuitIR): string {
  const lines: string[] = [
    "# SAMBHAV Quantum Circuit Generator (Auto-Generated)",
    "from qiskit import QuantumCircuit, transpile",
    "from qiskit_aer import AerSimulator",
    "",
    `qc = QuantumCircuit(${circuit.qubits}, ${circuit.classicalBits || circuit.qubits})`,
    "",
  ];

  for (const op of circuit.operations || []) {
    const t = op.targets[0];
    switch (op.gate) {
      case "h":
        lines.push(`qc.h(${t})`);
        break;
      case "x":
        lines.push(`qc.x(${t})`);
        break;
      case "y":
        lines.push(`qc.y(${t})`);
        break;
      case "z":
        lines.push(`qc.z(${t})`);
        break;
      case "s":
        lines.push(`qc.s(${t})`);
        break;
      case "t":
        lines.push(`qc.t(${t})`);
        break;
      case "rx":
        lines.push(`qc.rx(${op.params?.[0] ?? "np.pi"}, ${t})`);
        break;
      case "ry":
        lines.push(`qc.ry(${op.params?.[0] ?? "np.pi/2"}, ${t})`);
        break;
      case "rz":
        lines.push(`qc.rz(${op.params?.[0] ?? "np.pi"}, ${t})`);
        break;
      case "cx":
        lines.push(`qc.cx(${op.controls?.[0] ?? 0}, ${t})`);
        break;
      case "cz":
        lines.push(`qc.cz(${op.controls?.[0] ?? 0}, ${t})`);
        break;
      case "swap":
        lines.push(`qc.swap(${op.targets[0]}, ${op.targets[1]})`);
        break;
      case "measure":
        lines.push(`qc.measure([${op.targets.join(", ")}], [${(op.classicalTargets || op.targets).join(", ")}])`);
        break;
    }
  }

  lines.push("", "# Execute on Aer Simulator", "simulator = AerSimulator()", "compiled_circuit = transpile(qc, simulator)", "job = simulator.run(compiled_circuit, shots=1024)", "result = job.result()", "counts = result.get_counts()", "print('Simulation Measurement Counts:', counts)");
  return lines.join("\n");
}

export function generateLocalAIExplanation(payload: AITutorRequest): AITutorResponse {
  const circuit = payload.circuit;
  const numQubits = circuit?.qubits || 1;
  const opCount = circuit?.operations?.length || 0;
  const gates = circuit?.operations?.map((op) => op.gate.toUpperCase()).join(", ") || "None";

  let explanation = `### ⚛️ Quantum Circuit Analysis\n\nThis circuit operates on **${numQubits} qubit(s)** with **${opCount} gate operation(s)**: \`${gates}\`.\n\n`;

  if (gates.includes("H") && gates.includes("CX")) {
    explanation += `**Entanglement Detected**: Your circuit incorporates both a **Hadamard (H)** gate and a **Controlled-NOT (CX)** gate. This configuration prepares a maximally entangled **Bell state** $(|00\\rangle + |11\\rangle)/\\sqrt{2}$, where measurements of both qubits are completely correlated.\n\n`;
  } else if (gates.includes("H")) {
    explanation += `**Superposition State**: The **Hadamard (H)** gate maps basis state $|0\\rangle$ into an equal superposition $(|0\\rangle + |1\\rangle)/\\sqrt{2}$, enabling quantum interference across computational paths.\n\n`;
  } else if (gates.includes("X")) {
    explanation += `**Pauli-X Bit Flip**: The Pauli-X gate acts as a quantum NOT gate, flipping amplitude between basis states $|0\\rangle \\leftrightarrow |1\\rangle$.\n\n`;
  } else {
    explanation += `**State Evolution**: The applied unitary operations evolve the statevector according to Schrödinger's equation while preserving total probability.\n\n`;
  }

  if (payload.question) {
    explanation += `**Answer to your query ("${payload.question}")**:\nIn quantum mechanics, quantum gates are represented by unitary matrices ($U^\\dagger U = I$). Every operation is reversible and preserves the $L_2$ norm of probability amplitudes.`;
  }

  return {
    source: "fallback",
    explanation,
    key_concepts: ["Superposition", "Unitary Evolution", "Quantum Measurement", "Statevector Probabilities"],
    suggestions: [
      "Add a Hadamard (H) gate to test quantum superposition",
      "Connect two qubits with a CX gate to create quantum entanglement",
      "Inspect the Bloch Sphere coordinates for 3D state visualization",
    ],
  };
}
