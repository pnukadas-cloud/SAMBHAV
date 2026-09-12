export type Gate =
  | "h"
  | "x"
  | "y"
  | "z"
  | "s"
  | "t"
  | "rx"
  | "ry"
  | "rz"
  | "cx"
  | "cz"
  | "swap"
  | "measure";

export type CircuitOperation = {
  gate: Gate;
  targets: number[];
  controls?: number[];
  classicalTargets?: number[];
  params?: number[];
};

export type GridOperation = CircuitOperation & {
  id: string;
  step: number;
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
  dirac?: string;
  warnings: string[];
};

export type AITutorRequest = {
  circuit: CircuitIR;
  simulation_result?: SimulationResult | null;
  lesson_context?: {
    title: string;
    objective: string;
  } | null;
  question?: string | null;
};

export type AITutorResponse = {
  source: "llm" | "fallback";
  explanation: string;
  key_concepts?: string[];
  suggestions: string[];
};



