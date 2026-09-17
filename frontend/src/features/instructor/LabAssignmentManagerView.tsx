import React, { useState, useEffect } from "react";
import {
  fetchInstructorLabs,
  createInstructorLabApi,
  updateInstructorLabApi,
  deleteInstructorLabApi,
  fetchLabSubmissionsApi,
  gradeLabSubmissionApi,
  fetchInstructorClasses,
} from "../../api/client";

interface LabAssignment {
  id: string;
  instructor_id: string;
  class_id?: string;
  class_name?: string;
  title: string;
  description: string;
  learning_objective?: string;
  qubits: number;
  starter_circuit?: any;
  required_gates: string[];
  expected_result?: string;
  hints: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  deadline?: string;
  marks: number;
  instructions?: string;
  created_at?: string;
}

interface LabSubmission {
  id: string;
  lab_id: string;
  user_id: string;
  student_name?: string;
  student_email?: string;
  circuit: any;
  simulation_result?: any;
  score: number;
  feedback?: string;
  status: "submitted" | "graded";
  submitted_at: string;
}

export const LabAssignmentManagerView: React.FC = () => {
  const [labs, setLabs] = useState<LabAssignment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor Modal State
  const [editingLab, setEditingLab] = useState<Partial<LabAssignment> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Submissions Modal State
  const [selectedLabForSubs, setSelectedLabForSubs] = useState<LabAssignment | null>(null);
  const [submissions, setSubmissions] = useState<LabSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<LabSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [labsData, classesData] = await Promise.all([
        fetchInstructorLabs(),
        fetchInstructorClasses(),
      ]);
      setLabs(labsData || []);
      setClasses(classesData || []);
    } catch (err: any) {
      setError(err.message || "Failed to load lab assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setIsCreating(true);
    setEditingLab({
      title: "",
      description: "",
      class_id: classes[0]?.id || undefined,
      learning_objective: "Construct and measure a two-qubit entangled Bell pair.",
      qubits: 2,
      difficulty: "Beginner",
      marks: 100,
      required_gates: ["H", "CX"],
      expected_result: "Equal probability measurement distribution between |00⟩ (50%) and |11⟩ (50%).",
      hints: [
        "Apply a Hadamard gate to qubit 0 to create a superposition.",
        "Use qubit 0 as the control and qubit 1 as target in a CNOT gate."
      ],
      instructions: "1. Open the Quantum Lab circuit editor.\n2. Place an H gate on wire 0.\n3. Place a CNOT gate with control on wire 0 and target on wire 1.\n4. Attach measurement gates to both qubits.\n5. Run simulation and verify the output statevector.",
    });
  };

  const handleOpenEdit = (lab: LabAssignment) => {
    setIsCreating(false);
    setEditingLab({ ...lab });
  };

  const handleSaveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLab?.title || !editingLab?.description) {
      alert("Title and Description are required.");
      return;
    }

    try {
      setSaving(true);
      if (isCreating) {
        await createInstructorLabApi(editingLab);
      } else if (editingLab.id) {
        await updateInstructorLabApi(editingLab.id, editingLab);
      }
      setEditingLab(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save lab assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLab = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete lab assignment "${title}"?`)) return;
    try {
      await deleteInstructorLabApi(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete lab assignment.");
    }
  };

  // Submissions Handling
  const handleOpenSubmissions = async (lab: LabAssignment) => {
    setSelectedLabForSubs(lab);
    setLoadingSubs(true);
    try {
      const subs = await fetchLabSubmissionsApi(lab.id);
      setSubmissions(subs || []);
    } catch (err: any) {
      alert(err.message || "Failed to load submissions.");
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleOpenGrading = (sub: LabSubmission) => {
    setGradingSubmission(sub);
    setGradeScore(sub.score || 100);
    setGradeFeedback(sub.feedback || "");
  };

  const handleSaveGrade = async () => {
    if (!gradingSubmission || !selectedLabForSubs) return;
    try {
      setSavingGrade(true);
      await gradeLabSubmissionApi(selectedLabForSubs.id, gradingSubmission.id, {
        score: gradeScore,
        feedback: gradeFeedback,
      });
      const subs = await fetchLabSubmissionsApi(selectedLabForSubs.id);
      setSubmissions(subs || []);
      setGradingSubmission(null);
    } catch (err: any) {
      alert(err.message || "Failed to save grade.");
    } finally {
      setSavingGrade(false);
    }
  };

  // Gate Tag Helpers
  const addRequiredGate = (gate: string) => {
    if (!editingLab || !gate.trim()) return;
    const current = editingLab.required_gates || [];
    if (!current.includes(gate.trim().toUpperCase())) {
      setEditingLab({ ...editingLab, required_gates: [...current, gate.trim().toUpperCase()] });
    }
  };

  const removeRequiredGate = (gate: string) => {
    if (!editingLab || !editingLab.required_gates) return;
    setEditingLab({
      ...editingLab,
      required_gates: editingLab.required_gates.filter((g) => g !== gate),
    });
  };

  // Hint Helpers
  const addHint = () => {
    if (!editingLab) return;
    const current = editingLab.hints || [];
    setEditingLab({ ...editingLab, hints: [...current, ""] });
  };

  const updateHint = (index: number, val: string) => {
    if (!editingLab || !editingLab.hints) return;
    const current = [...editingLab.hints];
    current[index] = val;
    setEditingLab({ ...editingLab, hints: current });
  };

  const removeHint = (index: number) => {
    if (!editingLab || !editingLab.hints) return;
    setEditingLab({
      ...editingLab,
      hints: editingLab.hints.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🔬</span> Quantum Lab Assignments
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Author and assign hands-on quantum circuit experiments integrated directly with SAMBHAV's Quantum Lab simulator.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>➕</span> Create Lab Assignment
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="text-rose-200 underline text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="inline-block w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p>Loading lab assignments...</p>
        </div>
      ) : labs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="text-lg font-semibold text-white mb-1">No Quantum Lab Assignments Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Create circuit-building experiments for your students to design, simulate, and verify quantum algorithms.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium rounded-lg transition-all"
          >
            Create Your First Lab
          </button>
        </div>
      ) : (
        /* Lab Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => (
            <div
              key={lab.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      lab.difficulty === "Beginner"
                        ? "bg-teal-500/10 text-teal-300 border border-teal-500/20"
                        : lab.difficulty === "Intermediate"
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                    }`}
                  >
                    {lab.difficulty}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {lab.qubits} Qubits • {lab.marks} Pts
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1 mb-1">
                  {lab.title}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-3">
                  {lab.description}
                </p>

                {/* Required Gates Tags */}
                {lab.required_gates && lab.required_gates.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="text-[11px] text-slate-500">Required:</span>
                    {lab.required_gates.map((g, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-slate-800 text-teal-300 text-[10px] font-mono font-bold rounded border border-slate-700"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-t border-slate-800/80 mb-3">
                  <span>{lab.class_name ? `Class: ${lab.class_name}` : "All Cohorts"}</span>
                  {lab.deadline && <span>Due: {new Date(lab.deadline).toLocaleDateString()}</span>}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenSubmissions(lab)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>📊</span> Submissions
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(lab)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Lab Assignment"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteLab(lab.id, lab.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete Lab Assignment"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT LAB MODAL */}
      {editingLab && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isCreating ? "Create Quantum Lab Assignment" : "Edit Lab Assignment"}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Define quantum circuit requirements, simulation objectives, and learner guidelines.
                </p>
              </div>
              <button
                onClick={() => setEditingLab(null)}
                className="text-slate-400 hover:text-white text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveLab} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Experiment Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLab.title || ""}
                    onChange={(e) => setEditingLab({ ...editingLab, title: e.target.value })}
                    placeholder="e.g., Lab 2: Entanglement & Bell State Generation"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Assign to Class Cohort
                  </label>
                  <select
                    value={editingLab.class_id || ""}
                    onChange={(e) => setEditingLab({ ...editingLab, class_id: e.target.value || undefined })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="">-- Available to All My Classes --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description & Scientific Motivation *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingLab.description || ""}
                  onChange={(e) => setEditingLab({ ...editingLab, description: e.target.value })}
                  placeholder="Explain the physical principle and significance of this quantum circuit experiment..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 outline-none"
                />
              </div>

              {/* Lab Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Number of Qubits
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={editingLab.qubits || 2}
                    onChange={(e) =>
                      setEditingLab({ ...editingLab, qubits: parseInt(e.target.value) || 2 })
                    }
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={editingLab.difficulty || "Beginner"}
                    onChange={(e) =>
                      setEditingLab({
                        ...editingLab,
                        difficulty: e.target.value as "Beginner" | "Intermediate" | "Advanced",
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={editingLab.marks || 100}
                    onChange={(e) =>
                      setEditingLab({ ...editingLab, marks: parseInt(e.target.value) || 100 })
                    }
                    className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              {/* Required Gates */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Required Quantum Gates
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {editingLab.required_gates?.map((gate) => (
                    <span
                      key={gate}
                      className="px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5"
                    >
                      {gate}
                      <button
                        type="button"
                        onClick={() => removeRequiredGate(gate)}
                        className="text-teal-400 hover:text-rose-300 text-xs"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Quick add:</span>
                  {["H", "X", "Y", "Z", "CX", "CZ", "SWAP", "Rz", "Rx", "Measure"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => addRequiredGate(g)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors"
                    >
                      +{g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected Result & Step-by-Step Instructions */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Expected Experimental Outcome / Target State
                </label>
                <input
                  type="text"
                  value={editingLab.expected_result || ""}
                  onChange={(e) => setEditingLab({ ...editingLab, expected_result: e.target.value })}
                  placeholder="e.g., Entangled state (|00⟩ + |11⟩)/√2 with zero probability for |01⟩ and |10⟩"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Step-by-Step Experiment Instructions
                </label>
                <textarea
                  rows={3}
                  value={editingLab.instructions || ""}
                  onChange={(e) => setEditingLab({ ...editingLab, instructions: e.target.value })}
                  placeholder="1. Set up initial state&#10;2. Apply transformation gates...&#10;3. Record measurement counts..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 font-mono outline-none"
                />
              </div>

              {/* Hints */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    Progressive Hints ({editingLab.hints?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={addHint}
                    className="text-xs text-teal-400 hover:text-teal-300 font-medium"
                  >
                    + Add Hint
                  </button>
                </div>
                {editingLab.hints?.map((hint, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">#{idx + 1}</span>
                    <input
                      type="text"
                      value={hint}
                      onChange={(e) => updateHint(idx, e.target.value)}
                      placeholder={`Hint ${idx + 1}...`}
                      className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-1.5 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeHint(idx)}
                      className="text-slate-500 hover:text-rose-400 text-xs p-1"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLab(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : isCreating ? "Create Lab Assignment" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LAB SUBMISSIONS MODAL */}
      {selectedLabForSubs && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl my-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🔬</span> Submissions: {selectedLabForSubs.title}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Review student circuit simulations and award marks with constructive feedback.
                </p>
              </div>
              <button
                onClick={() => setSelectedLabForSubs(null)}
                className="text-slate-400 hover:text-white text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingSubs ? (
                <div className="p-8 text-center text-slate-400">
                  <div className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-xs">Loading lab submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  <div className="text-3xl mb-2">🔭</div>
                  <h4 className="text-sm font-semibold text-white">No Lab Submissions Yet</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    When students submit circuits for this lab experiment, they will appear here for verification and grading.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-bold text-white">
                            {sub.student_name || "Learner"}
                          </span>
                          <span className="text-xs text-slate-500 ml-2">
                            ({sub.student_email || sub.user_id})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              sub.status === "graded"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {sub.status === "graded" ? `Graded: ${sub.score} / ${selectedLabForSubs.marks}` : "Needs Review"}
                          </span>
                          <button
                            onClick={() => handleOpenGrading(sub)}
                            className="px-3 py-1 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            {sub.status === "graded" ? "Edit Grade" : "Grade Lab"}
                          </button>
                        </div>
                      </div>

                      {/* Submitted Circuit Summary */}
                      {sub.circuit && (
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                          <span className="text-xs text-slate-400 font-medium block mb-1">
                            Submitted Circuit: {sub.circuit.num_qubits || selectedLabForSubs.qubits} Qubits • {sub.circuit.gates?.length || 0} Gates
                          </span>
                          {sub.circuit.gates && sub.circuit.gates.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {sub.circuit.gates.map((g: any, gi: number) => (
                                <span
                                  key={gi}
                                  className="px-1.5 py-0.5 bg-slate-800 text-teal-300 text-[10px] font-mono rounded border border-slate-700"
                                >
                                  {g.gate || g.type}(Q{g.targets?.join(",") ?? g.target})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {sub.feedback && (
                        <p className="text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded border border-slate-800">
                          <span className="text-slate-500 font-medium">Instructor Feedback:</span> {sub.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedLabForSubs(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAB GRADING MODAL */}
      {gradingSubmission && selectedLabForSubs && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-white">
              Grade Lab: {gradingSubmission.student_name || "Learner"}
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Score (0 to {selectedLabForSubs.marks})
              </label>
              <input
                type="number"
                min={0}
                max={selectedLabForSubs.marks}
                value={gradeScore}
                onChange={(e) =>
                  setGradeScore(
                    Math.min(selectedLabForSubs.marks, Math.max(0, parseFloat(e.target.value) || 0))
                  )
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Laboratory Feedback & Analysis
              </label>
              <textarea
                rows={3}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Remarks on circuit correctness, statevector fidelity, gate optimization..."
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
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingGrade ? "Saving..." : "Submit Lab Grade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
