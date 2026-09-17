import React, { useState, useEffect } from "react";
import {
  fetchInstructorAssessments,
  createInstructorAssessmentApi,
  updateInstructorAssessmentApi,
  deleteInstructorAssessmentApi,
  fetchAssessmentSubmissionsApi,
  gradeAssessmentSubmissionApi,
} from "../../api/client";

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
            "|0⟩"
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
      // Refresh submissions
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📝</span> Assessment & Quiz Manager
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Create and manage quantum quizzes, exam modules, and circuit-based evaluations with automated or manual grading.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>➕</span> Create Assessment
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadAssessments} className="text-rose-200 underline text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p>Loading assessment bank...</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-white mb-1">No Assessments Created Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Assessments test student comprehension with MCQs, numerical calculations, and quantum circuit tasks.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium rounded-lg transition-all"
          >
            Create Your First Assessment
          </button>
        </div>
      ) : (
        /* Assessment Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((a) => (
            <div
              key={a.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      a.type === "quiz"
                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        : a.type === "coding_challenge"
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        : "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                    }`}
                  >
                    {a.type.replace("_", " ")}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.published
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {a.published ? "● Published" : "○ Draft"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1 mb-1">
                  {a.title}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                  {a.description || "No description provided."}
                </p>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-center mb-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Duration</span>
                    <span className="text-sm font-semibold text-slate-200">{a.duration_minutes}m</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Passing</span>
                    <span className="text-sm font-semibold text-emerald-400">{a.passing_score}%</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Questions</span>
                    <span className="text-sm font-semibold text-teal-300">{a.questions?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={() => handleOpenSubmissions(a)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>👥</span> Submissions
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(a)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit Assessment"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteAssessment(a.id, a.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Delete Assessment"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT ASSESSMENT MODAL */}
      {editingAssessment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isCreating ? "Create Assessment" : "Edit Assessment"}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Configure assessment parameters and build your question bank.
                </p>
              </div>
              <button
                onClick={() => setEditingAssessment(null)}
                className="text-slate-400 hover:text-white text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAssessment} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Assessment Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAssessment.title || ""}
                    onChange={(e) => setEditingAssessment({ ...editingAssessment, title: e.target.value })}
                    placeholder="e.g., Mid-Term Quantum Mechanics & Superposition Quiz"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Assessment Type
                  </label>
                  <select
                    value={editingAssessment.type || "quiz"}
                    onChange={(e) =>
                      setEditingAssessment({
                        ...editingAssessment,
                        type: e.target.value as "quiz" | "coding_challenge" | "exam",
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="quiz">Concept Quiz (Multiple Choice & Conceptual)</option>
                    <option value="coding_challenge">Quantum Circuit Coding Challenge</option>
                    <option value="exam">Comprehensive Exam (Mixed Formats)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={editingAssessment.description || ""}
                  onChange={(e) => setEditingAssessment({ ...editingAssessment, description: e.target.value })}
                  placeholder="Instructions for students taking this assessment..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 outline-none"
                />
              </div>

              {/* Assessment Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Duration (Minutes)
                  </label>
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
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Passing Score (%)
                  </label>
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
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="assessPublished"
                    checked={editingAssessment.published ?? true}
                    onChange={(e) =>
                      setEditingAssessment({ ...editingAssessment, published: e.target.checked })
                    }
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-900"
                  />
                  <label htmlFor="assessPublished" className="text-sm font-medium text-slate-200 cursor-pointer">
                    Published to Students
                  </label>
                </div>
              </div>

              {/* Question Bank Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>❓</span> Question Bank ({editingAssessment.questions?.length || 0})
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Add:</span>
                    <button
                      type="button"
                      onClick={() => addQuestion("mcq")}
                      className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-medium rounded-lg transition-colors"
                    >
                      + Multiple Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion("numerical")}
                      className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium rounded-lg transition-colors"
                    >
                      + Numerical
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion("circuit")}
                      className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium rounded-lg transition-colors"
                    >
                      + Circuit Task
                    </button>
                  </div>
                </div>

                {(!editingAssessment.questions || editingAssessment.questions.length === 0) ? (
                  <p className="text-xs text-slate-500 text-center py-6 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    No questions added yet. Click one of the buttons above to add questions.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {editingAssessment.questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-teal-400">
                            Q{idx + 1} • <span className="uppercase text-slate-400 font-semibold">{q.type}</span>
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs text-slate-500">Points:</label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={q.points || 10}
                                onChange={(e) =>
                                  updateQuestion(idx, { points: parseInt(e.target.value) || 10 })
                                }
                                className="w-16 bg-slate-900 border border-slate-800 text-xs text-white rounded px-2 py-0.5 outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeQuestion(idx)}
                              className="text-slate-500 hover:text-rose-400 text-xs p-1"
                              title="Delete Question"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Prompt */}
                        <div>
                          <input
                            type="text"
                            value={q.prompt}
                            onChange={(e) => updateQuestion(idx, { prompt: e.target.value })}
                            placeholder="Enter question prompt..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none"
                          />
                        </div>

                        {/* MCQ Options */}
                        {q.type === "mcq" && (
                          <div className="space-y-2 pl-2 border-l-2 border-slate-800">
                            <span className="text-[11px] text-slate-400 block font-medium">
                              Options (Select radio for correct answer):
                            </span>
                            {q.options?.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct_opt_${idx}`}
                                  checked={q.correct_option_index === optIdx}
                                  onChange={() => updateQuestion(idx, { correct_option_index: optIdx })}
                                  className="text-teal-500 bg-slate-900 border-slate-700"
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
                                  className="flex-1 bg-slate-900 border border-slate-800 text-xs text-white rounded px-2.5 py-1 outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Explanation / Solution Key */}
                        <div>
                          <input
                            type="text"
                            value={q.explanation || ""}
                            onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                            placeholder="Pedagogical explanation / Solution key shown after grading..."
                            className="w-full bg-slate-900/50 border border-slate-800/80 rounded-lg px-3 py-1 text-[11px] text-slate-300 placeholder-slate-600 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAssessment(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl my-auto">
            {/* Submissions Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>👥</span> Submissions: {selectedAssessmentForSubs.title}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Review student submissions and assign grades with personalized feedback.
                </p>
              </div>
              <button
                onClick={() => setSelectedAssessmentForSubs(null)}
                className="text-slate-400 hover:text-white text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Submissions Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingSubs ? (
                <div className="p-8 text-center text-slate-400">
                  <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-xs">Loading learner submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  <div className="text-3xl mb-2">📭</div>
                  <h4 className="text-sm font-semibold text-white">No Submissions Yet</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    When students take this assessment, their attempts will appear here for grading and review.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">
                            {sub.student_name || "Learner"}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({sub.student_email || sub.user_id})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>
                            Submitted: {new Date(sub.created_at).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span
                            className={`font-semibold ${
                              sub.status === "graded" ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {sub.status === "graded" ? `Score: ${sub.score}%` : "Needs Review"}
                          </span>
                        </div>
                        {sub.feedback && (
                          <p className="text-xs text-slate-400 mt-2 bg-slate-900/60 p-2 rounded border border-slate-800">
                            <span className="text-slate-500 font-medium">Feedback:</span> {sub.feedback}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenGrading(sub)}
                        className="px-3 py-1.5 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
                      >
                        {sub.status === "graded" ? "Edit Grade" : "Grade Attempt"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedAssessmentForSubs(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRADING SUBMISSION MODAL */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-white">
              Grade Submission: {gradingSubmission.student_name || "Learner"}
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Score (0 - 100%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={gradeScore}
                onChange={(e) => setGradeScore(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Instructor Feedback
              </label>
              <textarea
                rows={3}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Constructive feedback, misconception remediation..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingGrade}
                onClick={handleSaveGrade}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
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
