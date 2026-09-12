import type { AITutorRequest, AITutorResponse, CircuitIR, SimulationResult } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

let authToken: string | null = typeof window !== "undefined" ? localStorage.getItem("sambhav_auth_token") : null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("sambhav_auth_token", token);
    } else {
      localStorage.removeItem("sambhav_auth_token");
    }
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...init,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ==========================================
// QUANTUM SIMULATION & CODE EXPORT
// ==========================================

export function runSimulation(circuit: CircuitIR): Promise<SimulationResult> {
  return request<SimulationResult>("/api/simulations/run", {
    method: "POST",
    body: JSON.stringify({
      circuit,
      options: { backend: "local_statevector", shots: 1024, includeStatevector: true },
    }),
  });
}

export function explainCircuitWithAI(payload: AITutorRequest): Promise<AITutorResponse> {
  return request<AITutorResponse>("/api/ai/explain", {
    method: "POST",
    body: JSON.stringify(payload),
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

// ==========================================
// AUTHENTICATION APIS
// ==========================================

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "student" | "instructor" | "admin";
  };
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(res.token);
  return res;
}

export async function registerApi(name: string, email: string, password: string, role: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
  setAuthToken(res.token);
  return res;
}

export function getMeApi(): Promise<any> {
  return request("/api/auth/me");
}

export function logoutApi(): Promise<{ message: string }> {
  setAuthToken(null);
  return request("/api/auth/logout", { method: "POST" });
}

// ==========================================
// COURSES, PROGRESS & CHALLENGES
// ==========================================

export function fetchCourses(): Promise<any[]> {
  return request<any[]>("/api/courses");
}

export function fetchCourseById(courseId: string): Promise<any> {
  return request<any>(`/api/courses/${courseId}`);
}

export function createCourseApi(payload: { title: string; description: string; difficulty: string; published?: boolean }): Promise<any> {
  return request<any>("/api/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createModuleApi(courseId: string, payload: { title: string; order_index?: number }): Promise<any> {
  return request<any>(`/api/courses/${courseId}/modules`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createLessonApi(moduleId: string, payload: { title: string; content_markdown?: string; estimated_minutes?: number; order_index?: number }): Promise<any> {
  return request<any>(`/api/courses/modules/${moduleId}/lessons`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchChallenges(): Promise<any[]> {
  return request<any[]>("/api/challenges");
}

export interface ChallengeEvaluation {
  challenge_id: string;
  passed: boolean;
  score: number;
  xp_earned: number;
  feedback: string;
  measured_probabilities: Record<string, number>;
  expected_probabilities: Record<string, number>;
}

export function evaluateChallenge(challengeId: string, circuit: CircuitIR): Promise<ChallengeEvaluation> {
  return request<ChallengeEvaluation>("/api/challenges/evaluate", {
    method: "POST",
    body: JSON.stringify({ challenge_id: challengeId, circuit }),
  });
}

export function fetchProgress(): Promise<any> {
  return request<any>("/api/progress/demo");
}

export function saveCircuit(title: string, circuit: CircuitIR, description?: string): Promise<any> {
  return request<any>("/api/circuits/save", {
    method: "POST",
    body: JSON.stringify({ title, circuit, description, framework: "qiskit" }),
  });
}

export function fetchMyCircuits(): Promise<any[]> {
  return request<any[]>("/api/circuits/my-circuits");
}

export function fetchInstructorDashboard(): Promise<any> {
  return request<any>("/api/instructor/dashboard");
}
