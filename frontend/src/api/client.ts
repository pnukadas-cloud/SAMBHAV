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
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    authToken = localStorage.getItem("sambhav_auth_token");
  }
  return authToken;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers,
      ...init,
    });
    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      try {
        const json = await response.json();
        if (json && json.detail) {
          errorMsg = typeof json.detail === "string" ? json.detail : JSON.stringify(json.detail);
        }
      } catch {
        const text = await response.text().catch(() => "");
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }
    return (await response.json()) as Promise<T>;
  } catch (err: any) {
    if (err.message && err.message.includes("Failed to fetch")) {
      throw new Error("Cannot connect to backend server. Please ensure the backend is running at http://127.0.0.1:8000");
    }
    throw err;
  }
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
// AUTHENTICATION & 2-FACTOR OTP APIS
// ==========================================

export interface OtpInitiatedResponse {
  status: "otp_required";
  session_token: string;
  email: string;
  expires_in: number;
  resend_cooldown: number;
  email_sent: boolean;
  delivery_info: string;
}

export interface AuthSuccessResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "student" | "instructor" | "admin";
  };
}

export async function loginRequestOtpApi(email: string, password: string): Promise<OtpInitiatedResponse> {
  return request<OtpInitiatedResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequestOtpApi(name: string, email: string, password: string, role: string): Promise<OtpInitiatedResponse> {
  return request<OtpInitiatedResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
}

export async function verifyOtpApi(sessionToken: string, otpCode: string): Promise<AuthSuccessResponse> {
  const res = await request<AuthSuccessResponse>("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ session_token: sessionToken, otp_code: otpCode }),
  });
  setAuthToken(res.token);
  return res;
}

export async function resendOtpApi(sessionToken: string): Promise<OtpInitiatedResponse> {
  return request<OtpInitiatedResponse>("/api/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ session_token: sessionToken }),
  });
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

export function getCompletedLessonsCache(): Set<string> {
  try {
    const raw = localStorage.getItem("sambhav_completed_lessons");
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch {}
  return new Set();
}

export function addCompletedLessonToCache(lessonId: string) {
  try {
    const set = getCompletedLessonsCache();
    set.add(lessonId);
    localStorage.setItem("sambhav_completed_lessons", JSON.stringify(Array.from(set)));
  } catch {}
}

export function getSolvedChallengesCache(): Set<string> {
  try {
    const raw = localStorage.getItem("sambhav_solved_challenges");
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch {}
  return new Set();
}

export function addSolvedChallengeToCache(challengeId: string) {
  try {
    const set = getSolvedChallengesCache();
    set.add(challengeId);
    localStorage.setItem("sambhav_solved_challenges", JSON.stringify(Array.from(set)));
  } catch {}
}

export async function fetchProgress(): Promise<any> {
  try {
    const data = await request<any>("/api/progress/me");
    if (data && Array.isArray(data.records)) {
      const cached = getCompletedLessonsCache();
      data.records.forEach((r: any) => {
        if (r.lesson_id && r.status === "completed") {
          cached.add(r.lesson_id);
        }
      });
      localStorage.setItem("sambhav_completed_lessons", JSON.stringify(Array.from(cached)));
    }
    return data;
  } catch (err) {
    const cached = getCompletedLessonsCache();
    const completedCount = cached.size;
    return {
      userId: "local-learner",
      xp: completedCount * 100,
      level: Math.max(1, Math.floor((completedCount * 100) / 500) + 1),
      streakDays: completedCount > 0 ? 1 : 0,
      completedLessons: completedCount,
      simulationsRun: 0,
      challengesSolved: 0,
      averageScore: 100.0,
      records: Array.from(cached).map((id) => ({ lesson_id: id, course_id: "quantum-foundations", status: "completed", score: 100 })),
      recommendations: [],
    };
  }
}

export async function recordLessonProgress(courseId: string, lessonId: string, score = 100.0, timeSpent = 120): Promise<any> {
  addCompletedLessonToCache(lessonId);
  try {
    return await request<any>("/api/progress/record", {
      method: "POST",
      body: JSON.stringify({ course_id: courseId, lesson_id: lessonId, status: "completed", score, time_spent: timeSpent }),
    });
  } catch (err) {
    return { status: "recorded_locally" };
  }
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

export function fetchStudentAssignedLabs(): Promise<any[]> {
  return request<any[]>("/api/circuits/assigned-labs");
}

export function submitStudentLabApi(labId: string, payload: { circuit: CircuitIR; simulation_result?: any }): Promise<any> {
  return request<any>(`/api/circuits/assigned-labs/${labId}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ==========================================
// INSTRUCTOR SUITE APIS (PROTECTED)
// ==========================================

export function fetchInstructorDashboard(): Promise<any> {
  return request<any>("/api/instructor/dashboard");
}

export function fetchInstructorAnalytics(): Promise<any> {
  return request<any>("/api/instructor/analytics");
}

export function fetchInstructorCurriculum(): Promise<any[]> {
  return request<any[]>("/api/instructor/curriculum");
}

export function createInstructorLessonApi(payload: any): Promise<any> {
  return request<any>("/api/instructor/lessons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchInstructorLessonById(lessonId: string): Promise<any> {
  return request<any>(`/api/instructor/lessons/${lessonId}`);
}

export function updateInstructorLessonApi(lessonId: string, payload: any): Promise<any> {
  return request<any>(`/api/instructor/lessons/${lessonId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function publishInstructorLessonApi(lessonId: string, status: "draft" | "published"): Promise<any> {
  return request<any>(`/api/instructor/lessons/${lessonId}/publish`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export function deleteInstructorLessonApi(lessonId: string): Promise<any> {
  return request<any>(`/api/instructor/lessons/${lessonId}`, {
    method: "DELETE",
  });
}

export function duplicateInstructorLessonApi(lessonId: string): Promise<any> {
  return request<any>(`/api/instructor/lessons/${lessonId}/duplicate`, {
    method: "POST",
  });
}

export function fetchInstructorClasses(): Promise<any[]> {
  return request<any[]>("/api/instructor/classes");
}

export function createInstructorClassApi(payload: { name: string; description?: string; enrollment_code?: string }): Promise<any> {
  return request<any>("/api/instructor/classes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchInstructorClassById(classId: string): Promise<any> {
  return request<any>(`/api/instructor/classes/${classId}`);
}

export function deleteInstructorClassApi(classId: string): Promise<any> {
  return request<any>(`/api/instructor/classes/${classId}`, {
    method: "DELETE",
  });
}

export function enrollStudentInClassApi(classId: string, studentIdOrEmail: string): Promise<any> {
  return request<any>(`/api/instructor/classes/${classId}/enroll`, {
    method: "POST",
    body: JSON.stringify({ student_id_or_email: studentIdOrEmail }),
  });
}

export function removeStudentFromClassApi(classId: string, studentId: string): Promise<any> {
  return request<any>(`/api/instructor/classes/${classId}/students/${studentId}`, {
    method: "DELETE",
  });
}

export function createClassAssignmentApi(classId: string, payload: { title: string; type: string; target_id: string; due_date?: string }): Promise<any> {
  return request<any>(`/api/instructor/classes/${classId}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchInstructorLearners(): Promise<any[]> {
  return request<any[]>("/api/instructor/learners");
}

export function fetchInstructorLearnerDetail(learnerId: string): Promise<any> {
  return request<any>(`/api/instructor/learners/${learnerId}`);
}

export function fetchInstructorAssessments(): Promise<any[]> {
  return request<any[]>("/api/instructor/assessments");
}

export function createInstructorAssessmentApi(payload: any): Promise<any> {
  return request<any>("/api/instructor/assessments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchInstructorAssessmentById(assessmentId: string): Promise<any> {
  return request<any>(`/api/instructor/assessments/${assessmentId}`);
}

export function updateInstructorAssessmentApi(assessmentId: string, payload: any): Promise<any> {
  return request<any>(`/api/instructor/assessments/${assessmentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteInstructorAssessmentApi(assessmentId: string): Promise<any> {
  return request<any>(`/api/instructor/assessments/${assessmentId}`, {
    method: "DELETE",
  });
}

export function fetchAssessmentSubmissionsApi(assessmentId: string): Promise<any[]> {
  return request<any[]>(`/api/instructor/assessments/${assessmentId}/submissions`);
}

export function gradeAssessmentSubmissionApi(assessmentId: string, submissionId: string, payload: { score: number; feedback?: string }): Promise<any> {
  return request<any>(`/api/instructor/assessments/${assessmentId}/submissions/${submissionId}/grade`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchInstructorLabs(): Promise<any[]> {
  return request<any[]>("/api/instructor/labs");
}

export function createInstructorLabApi(payload: any): Promise<any> {
  return request<any>("/api/instructor/labs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchInstructorLabById(labId: string): Promise<any> {
  return request<any>(`/api/instructor/labs/${labId}`);
}

export function updateInstructorLabApi(labId: string, payload: any): Promise<any> {
  return request<any>(`/api/instructor/labs/${labId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteInstructorLabApi(labId: string): Promise<any> {
  return request<any>(`/api/instructor/labs/${labId}`, {
    method: "DELETE",
  });
}

export function fetchLabSubmissionsApi(labId: string): Promise<any[]> {
  return request<any[]>(`/api/instructor/labs/${labId}/submissions`);
}

export function gradeLabSubmissionApi(labId: string, submissionId: string, payload: { score: number; feedback?: string }): Promise<any> {
  return request<any>(`/api/instructor/labs/${labId}/submissions/${submissionId}/grade`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function generateAIEducatorDraftApi(payload: { action: string; topic: string; level?: string; context?: any }): Promise<any> {
  return request<any>("/api/instructor/ai/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
