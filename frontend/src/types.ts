export type Gate = "h" | "x" | "z" | "cx" | "measure";

export type CircuitOperation = {
  gate: Gate;
  targets: number[];
  controls?: number[];
  classicalTargets?: number[];
  params?: number[];
};

export type CircuitIR = {
  qubits: number;
  classicalBits: number;
  operations: CircuitOperation[];
};

export type SimulationResult = {
  backend: string;
  shots: number;
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  statevector: Array<{
    basis: string;
    real: number;
    imag: number;
    magnitude: number;
    phase: number;
  }>;
  bloch: Array<{ qubit: number; x: number; y: number; z: number }>;
  warnings: string[];
};

