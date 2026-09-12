import type { CircuitIR, SimulationResult } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function runSimulation(circuit: CircuitIR): Promise<SimulationResult> {
  return request<SimulationResult>("/api/simulations/run", {
    method: "POST",
    body: JSON.stringify({ circuit, options: { backend: "local_statevector", shots: 1024, includeStatevector: true } }),
  });
}

export function explainCircuit(circuit: CircuitIR): Promise<{ explanation: string; suggestions: string[] }> {
  return request("/api/ai/explain-circuit", {
    method: "POST",
    body: JSON.stringify({ circuit, learnerLevel: "beginner" }),
  });
}

export function toQiskitCode(circuit: CircuitIR): Promise<{ framework: string; code: string }> {
  return request("/api/circuits/to-code", {
    method: "POST",
    body: JSON.stringify({ circuit, framework: "qiskit" }),
  });
}

