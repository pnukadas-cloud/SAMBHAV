import React, { useState, useEffect } from "react";
import {
  fetchInstructorAssessments,
  createInstructorAssessmentApi,
  updateInstructorAssessmentApi,
  deleteInstructorAssessmentApi,
  fetchAssessmentSubmissionsApi,
  gradeAssessmentSubmissionApi,
} from "../../api/client";
import {
  Plus,
  FileText,
  Users,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  X,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

interface Question {
  id?: string;
  type: "mcq" | "conceptual" | "numerical" | "circuit";
  prompt: string;
  options?: string[];
  correct_option_index?: number;
  explanation?: string;
  points: number;
}

interface Assessment {
  id: string;
  instructor_id: string;
  course_id: string;
  module_id?: string;
  title: string;
  description: string;
  type: "quiz" | "coding_challenge" | "exam";
  duration_minutes: number;
  passing_score: number;
  questions: Question[];
  published: boolean;
  created_at?: string;
}

interface Submission {
  id: string;
  assessment_id: string;
  user_id: string;
  student_name?: string;
  student_email?: string;
  score: number;
  max_score: number;
  answers: any;
  feedback?: string;
  status: "submitted" | "graded";
  created_at: string;
}

export const AssessmentManagerView: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Editor state
  const [editingAssessment, setEditingAssessment] = useState<Partial<Assessment> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Submissions Modal state
  const [selectedAssessmentForSubs, setSelectedAssessmentForSubs] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInstructorAssessments();
      setAssessments(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleOpenCreate = () => {
    setIsCreating(true);
    setEditingAssessment({
      course_id: "quantum-foundations",
      module_id: "module-0",
      title: "",
      description: "",
      type: "quiz",
      duration_minutes: 30,
      passing_score: 70,
      questions: [
        {
          type: "mcq",
          prompt: "What is the result of applying a Hadamard (H) gate to the ground state |0⟩?",
          options: [
            "|1⟩",
            "(|0⟩ + |1⟩) / √2",
            "(|0⟩ - |1⟩) / √2",
            "|0⟩",
          ],
          correct_option_index: 1,
          explanation: "The Hadamard gate creates an equal superposition (|0⟩ + |1⟩)/√2 when applied to |0⟩.",
          points: 10,
        },
      ],
      published: true,
    });
  };

  const handleOpenEdit = (assessment: Assessment) => {
    setIsCreating(false);
    setEditingAssessment({ ...assessment });
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssessment?.title) {
      alert("Assessment title is required.");
      return;
    }

    try {
      setSaving(true);
      if (isCreating) {
        await createInstructorAssessmentApi(editingAssessment);
      } else if (editingAssessment.id) {
        await updateInstructorAssessmentApi(editingAssessment.id, editingAssessment);
      }
      setEditingAssessment(null);
      await loadAssessments();
    } catch (err: any) {
      alert(err.message || "Failed to save assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssessment = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete assessment "${title}"?`)) return;
    try {
      await deleteInstructorAssessmentApi(id);
      await loadAssessments();
    } catch (err: any) {
      alert(err.message || "Failed to delete assessment.");
    }
  };

  // Submissions Modal handlers
  const handleOpenSubmissions = async (assessment: Assessment) => {
    setSelectedAssessmentForSubs(assessment);
    setLoadingSubs(true);
    try {
      const subs = await fetchAssessmentSubmissionsApi(assessment.id);
      setSubmissions(subs || []);
    } catch (err: any) {
      alert(err.message || "Failed to fetch submissions.");
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleOpenGrading = (sub: Submission) => {
    setGradingSubmission(sub);
    setGradeScore(sub.score || 100);
    setGradeFeedback(sub.feedback || "");
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmission || !selectedAssessmentForSubs) return;
    try {
      setSavingGrade(true);
      await gradeAssessmentSubmissionApi(selectedAssessmentForSubs.id, gradingSubmission.id, {
        score: gradeScore,
        feedback: gradeFeedback,
      });
      const subs = await fetchAssessmentSubmissionsApi(selectedAssessmentForSubs.id);
      setSubmissions(subs || []);
      setGradingSubmission(null);
    } catch (err: any) {
      alert(err.message || "Failed to save grade.");
    } finally {
      setSavingGrade(false);
    }
  };

  // Question editing helper methods
  const addQuestion = (type: "mcq" | "conceptual" | "numerical" | "circuit") => {
    if (!editingAssessment) return;
    const currentQuestions = editingAssessment.questions || [];
    let newQ: Question;
    if (type === "mcq") {
      newQ = {
        type: "mcq",
        prompt: "",
        options: ["", "", "", ""],
        correct_option_index: 0,
        explanation: "",
        points: 10,
      };
    } else if (type === "numerical") {
      newQ = {
        type: "numerical",
        prompt: "Calculate the probability of measuring |0⟩ for state 0.6|0⟩ + 0.8|1⟩:",
        explanation: "Probability = |0.6|^2 = 0.36",
        points: 10,
      };
    } else if (type === "circuit") {
      newQ = {
        type: "circuit",
        prompt: "Construct a 2-qubit Bell State |Φ+⟩ using Hadamard and CNOT gates.",
        explanation: "H on Q0 puts it in superposition, followed by CX(0,1) to entangle Q0 and Q1.",
        points: 20,
      };
    } else {
      newQ = {
        type: "conceptual",
        prompt: "Explain why quantum states cannot be cloned according to the No-Cloning Theorem.",
        explanation: "Unitary evolution is linear, which prevents universal cloning operators.",
        points: 15,
      };
    }
    setEditingAssessment({
      ...editingAssessment,
      questions: [...currentQuestions, newQ],
    });
  };

  const updateQuestion = (index: number, updated: Partial<Question>) => {
    if (!editingAssessment || !editingAssessment.questions) return;
    const updatedQs = [...editingAssessment.questions];
    updatedQs[index] = { ...updatedQs[index], ...updated };
    setEditingAssessment({ ...editingAssessment, questions: updatedQs });
  };

  const removeQuestion = (index: number) => {
    if (!editingAssessment || !editingAssessment.questions) return;
    const updatedQs = editingAssessment.questions.filter((_, i) => i !== index);
    setEditingAssessment({ ...editingAssessment, questions: updatedQs });
  };

  return (
    <div className="instructor-content-area">
      {/* Header Banner */}
      <div className="instructor-header-banner">
        <div className="instructor-header-titles">
          <h1>📝 Assessment & Quiz Manager</h1>
          <p>Create and manage quantum quizzes, exam modules, and circuit-based evaluations with automated or manual grading.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className="instructor-btn-secondary" onClick={loadAssessments}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button type="button" className="instructor-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Assessment
          </button>
        </div>
      </div>

      {/* Error state with Styled Banner */}
      {error && (
        <div className="instructor-error-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={18} color="#e11d48" />
            <span className="instructor-error-banner-text">{error}</span>
          </div>
          <button type="button" onClick={loadAssessments} className="instructor-btn-secondary" style={{ padding: "5px 12px", fontSize: "12px" }}>
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="instructor-loading-box">
          <div className="instructor-spinner"></div>
          <span>Loading assessment bank...</span>
        </div>
      ) : assessments.length === 0 ? (
        <div className="instructor-panel-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
          <h3 style={{ justifyContent: "center", marginBottom: "8px" }}>No Assessments Created Yet</h3>
          <p style={{ color: "#64748b", fontSize: "13px", maxWidth: "480px", margin: "0 auto 20px" }}>
            Assessments test student comprehension with MCQs, numerical calculations, and quantum circuit tasks.
          </p>
          <button type="button" className="instructor-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Your First Assessment
          </button>
        </div>
      ) : (
        /* Assessment Cards Grid */
        <div className="instructor-card-grid">
          {assessments.map((a) => (
            <div key={a.id} className="instructor-item-card">
              <div>
                <div className="instructor-item-card-header">
                  <span
                    className={`badge-pill ${
                      a.type === "quiz"
                        ? "badge-pill-purple"
                        : a.type === "coding_challenge"
                        ? "badge-pill-amber"
                        : "badge-pill-teal"
                    }`}
                  >
                    {a.type.replace("_", " ")}
                  </span>
                  <span
                    className={`badge-pill ${a.published ? "badge-pill-green" : "badge-pill-amber"}`}
                  >
                    {a.published ? "● Published" : "○ Draft"}
                  </span>
                </div>

                <h3 className="instructor-item-card-title">{a.title}</h3>
                <p className="instructor-item-card-desc">
                  {a.description || "No description provided."}
                </p>

                <div className="instructor-item-card-meta">
                  <div className="instructor-meta-item">
                    <span className="meta-label">Duration</span>
                    <span className="meta-value">{a.duration_minutes}m</span>
                  </div>
                  <div className="instructor-meta-item">
                    <span className="meta-label">Passing</span>
                    <span className="meta-value" style={{ color: "#16a34a" }}>{a.passing_score}%</span>
                  </div>
                  <div className="instructor-meta-item">
                    <span className="meta-label">Questions</span>
                    <span className="meta-value" style={{ color: "#0284c7" }}>{a.questions?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="instructor-item-card-actions">
                <button
                  type="button"
                  onClick={() => handleOpenSubmissions(a)}
                  className="instructor-btn-secondary"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  <Users size={14} /> Submissions
                </button>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(a)}
                    className="instructor-btn-secondary"
                    style={{ padding: "6px 10px" }}
                    title="Edit Assessment"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAssessment(a.id, a.title)}
                    className="instructor-btn-danger"
                    title="Delete Assessment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ASSESSMENT MODAL */}
      {editingAssessment && (
        <div className="instructor-modal-overlay">
          <div className="instructor-modal-box">
            <div className="instructor-modal-header">
              <div>
                <h3>{isCreating ? "Create Assessment" : "Edit Assessment"}</h3>
                <p>Configure assessment parameters and build your question bank.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAssessment(null)}
                className="instructor-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="instructor-modal-body">
                {/* Basic Details */}
                <div className="instructor-form-row">
                  <div className="instructor-form-group">
                    <label className="instructor-form-label">Assessment Title *</label>
                    <input
                      type="text"
                      required
                      value={editingAssessment.title || ""}
                      onChange={(e) => setEditingAssessment({ ...editingAssessment, title: e.target.value })}
                      placeholder="e.g., Mid-Term Quantum Mechanics & Superposition Quiz"
                      className="instructor-form-input"
                    />
                  </div>
                  <div className="instructor-form-group">
                    <label className="instructor-form-label">Assessment Type</label>
                    <select
                      value={editingAssessment.type || "quiz"}
                      onChange={(e) =>
                        setEditingAssessment({
                          ...editingAssessment,
                          type: e.target.value as "quiz" | "coding_challenge" | "exam",
                        })
                      }
                      className="instructor-form-select"
                    >
                      <option value="quiz">Concept Quiz (Multiple Choice & Conceptual)</option>
                      <option value="coding_challenge">Quantum Circuit Coding Challenge</option>
                      <option value="exam">Comprehensive Exam (Mixed Formats)</option>
                    </select>
                  </div>
                </div>

                <div className="instructor-form-group">
                  <label className="instructor-form-label">Description / Instructions</label>
                  <textarea
                    rows={2}
                    value={editingAssessment.description || ""}
                    onChange={(e) => setEditingAssessment({ ...editingAssessment, description: e.target.value })}
                    placeholder="Instructions for students taking this assessment..."
                    className="instructor-form-textarea"
                  />
                </div>

                {/* Parameters */}
                <div style={{ background: "var(--bg-subtle)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-subtle)", marginBottom: "20px" }}>
                  <div className="instructor-form-row" style={{ margin: 0 }}>
                    <div className="instructor-form-group" style={{ margin: 0 }}>
                      <label className="instructor-form-label">Duration (Minutes)</label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={editingAssessment.duration_minutes || 30}
                        onChange={(e) =>
                          setEditingAssessment({
                            ...editingAssessment,
                            duration_minutes: parseInt(e.target.value) || 30,
                          })
                        }
                        className="instructor-form-input"
                      />
                    </div>
                    <div className="instructor-form-group" style={{ margin: 0 }}>
                      <label className="instructor-form-label">Passing Score (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editingAssessment.passing_score || 70}
                        onChange={(e) =>
                          setEditingAssessment({
                            ...editingAssessment,
                            passing_score: parseFloat(e.target.value) || 70,
                          })
                        }
                        className="instructor-form-input"
                      />
                    </div>
                    <div className="instructor-form-group" style={{ margin: 0, justifyContent: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", marginTop: "16px" }}>
                        <input
                          type="checkbox"
                          checked={editingAssessment.published ?? true}
                          onChange={(e) =>
                            setEditingAssessment({ ...editingAssessment, published: e.target.checked })
                          }
                          style={{ width: "16px", height: "16px", accentColor: "var(--accent-cyan)" }}
                        />
                        Published to Students
                      </label>
                    </div>
                  </div>
                </div>

                {/* Question Bank Builder */}
                <div style={{ marginTop: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "14px" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <HelpCircle size={16} color="var(--accent-cyan)" /> Question Bank ({editingAssessment.questions?.length || 0})
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => addQuestion("mcq")}
                        className="instructor-btn-secondary"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        + Multiple Choice
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuestion("numerical")}
                        className="instructor-btn-secondary"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        + Numerical
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuestion("circuit")}
                        className="instructor-btn-secondary"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        + Circuit Task
                      </button>
                    </div>
                  </div>

                  {(!editingAssessment.questions || editingAssessment.questions.length === 0) ? (
                    <div className="instructor-empty-state">
                      <p>No questions added yet. Click one of the buttons above to add questions.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {editingAssessment.questions.map((q, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "var(--bg-subtle)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "10px",
                            padding: "14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-cyan)" }}>
                              Q{idx + 1} • <span style={{ textTransform: "uppercase", color: "var(--text-muted)" }}>{q.type}</span>
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Points:</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={q.points || 10}
                                  onChange={(e) =>
                                    updateQuestion(idx, { points: parseInt(e.target.value) || 10 })
                                  }
                                  style={{ width: "60px", padding: "3px 6px", fontSize: "12px", borderRadius: "4px", border: "1px solid var(--border-subtle)", background: "var(--bg-input)", color: "var(--text-primary)" }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeQuestion(idx)}
                                className="instructor-btn-danger"
                                title="Delete Question"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={q.prompt}
                            onChange={(e) => updateQuestion(idx, { prompt: e.target.value })}
                            placeholder="Enter question prompt..."
                            className="instructor-form-input"
                            style={{ fontSize: "13px", padding: "7px 10px" }}
                          />

                          {/* MCQ Options */}
                          {q.type === "mcq" && (
                            <div style={{ paddingLeft: "10px", borderLeft: "2px solid var(--border-strong)", display: "flex", flexDirection: "column", gap: "6px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>
                                Options (Select radio for correct answer):
                              </span>
                              {q.options?.map((opt, optIdx) => (
                                <div key={optIdx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <input
                                    type="radio"
                                    name={`correct_opt_${idx}`}
                                    checked={q.correct_option_index === optIdx}
                                    onChange={() => updateQuestion(idx, { correct_option_index: optIdx })}
                                    style={{ accentColor: "var(--accent-cyan)" }}
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...(q.options || [])];
                                      newOpts[optIdx] = e.target.value;
                                      updateQuestion(idx, { options: newOpts });
                                    }}
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                    className="instructor-form-input"
                                    style={{ fontSize: "12px", padding: "5px 8px" }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <input
                            type="text"
                            value={q.explanation || ""}
                            onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                            placeholder="Pedagogical explanation / Solution key shown after grading..."
                            className="instructor-form-input"
                            style={{ fontSize: "11px", padding: "5px 8px", background: "var(--bg-input)" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="instructor-modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingAssessment(null)}
                  className="instructor-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="instructor-btn-primary"
                >
                  {saving ? "Saving..." : isCreating ? "Create Assessment" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSIONS LIST MODAL */}
      {selectedAssessmentForSubs && (
        <div className="instructor-modal-overlay">
          <div className="instructor-modal-box">
            <div className="instructor-modal-header">
              <div>
                <h3>👥 Submissions: {selectedAssessmentForSubs.title}</h3>
                <p>Review student submissions and assign grades with personalized feedback.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssessmentForSubs(null)}
                className="instructor-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="instructor-modal-body">
              {loadingSubs ? (
                <div className="instructor-loading-box">
                  <div className="instructor-spinner"></div>
                  <span>Loading learner submissions...</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="instructor-empty-state">
                  <div style={{ fontSize: "28px" }}>📭</div>
                  <h4>No Submissions Yet</h4>
                  <p>When students take this assessment, their attempts will appear here for grading and review.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "10px",
                        padding: "14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>
                          {sub.student_name || "Learner"}
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 400, marginLeft: "6px" }}>
                            ({sub.student_email || sub.user_id})
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                          Submitted: {new Date(sub.created_at).toLocaleDateString()} •{" "}
                          <span style={{ fontWeight: 700, color: sub.status === "graded" ? "#16a34a" : "#d97706" }}>
                            {sub.status === "graded" ? `Score: ${sub.score}%` : "Needs Review"}
                          </span>
                        </div>
                        {sub.feedback && (
                          <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--text-secondary)", background: "var(--bg-card)", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                            <strong>Feedback:</strong> {sub.feedback}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenGrading(sub)}
                        className="instructor-btn-primary"
                        style={{ fontSize: "12px", padding: "6px 12px" }}
                      >
                        {sub.status === "graded" ? "Edit Grade" : "Grade Attempt"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="instructor-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedAssessmentForSubs(null)}
                className="instructor-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRADING SUBMISSION MODAL */}
      {gradingSubmission && (
        <div className="instructor-modal-overlay">
          <div className="instructor-modal-box" style={{ maxWidth: "480px" }}>
            <div className="instructor-modal-header">
              <div>
                <h3>Grade Submission</h3>
                <p>{gradingSubmission.student_name || "Learner"}</p>
              </div>
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="instructor-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="instructor-modal-body">
              <div className="instructor-form-group">
                <label className="instructor-form-label">Score (0 - 100%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="instructor-form-input"
                />
              </div>

              <div className="instructor-form-group">
                <label className="instructor-form-label">Instructor Feedback</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Constructive feedback, misconception remediation..."
                  className="instructor-form-textarea"
                />
              </div>
            </div>

            <div className="instructor-modal-footer">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="instructor-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingGrade}
                onClick={handleSaveGrade}
                className="instructor-btn-primary"
              >
                {savingGrade ? "Saving..." : "Submit Grade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
