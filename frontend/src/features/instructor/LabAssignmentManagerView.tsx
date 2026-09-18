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
import {
  Plus,
  FlaskConical,
  Users,
  Edit3,
  Trash2,
  Cpu,
  AlertCircle,
  X,
  RefreshCw,
  Award,
  Layers,
} from "lucide-react";

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
        "Add a CNOT gate with qubit 0 as control and qubit 1 as target.",
      ],
      instructions: "1. Place H gate on Q0.\n2. Place CNOT with control Q0 and target Q1.\n3. Run simulation with 1024 shots.",
    });
  };

  const handleOpenEdit = (lab: LabAssignment) => {
    setIsCreating(false);
    setEditingLab({ ...lab });
  };

  const handleSaveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLab?.title) {
      alert("Lab title is required.");
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
    if (!window.confirm(`Are you sure you want to delete lab experiment "${title}"?`)) return;
    try {
      await deleteInstructorLabApi(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete lab assignment.");
    }
  };

  // Submissions modal handlers
  const handleOpenSubmissions = async (lab: LabAssignment) => {
    setSelectedLabForSubs(lab);
    setLoadingSubs(true);
    try {
      const subs = await fetchLabSubmissionsApi(lab.id);
      setSubmissions(subs || []);
    } catch (err: any) {
      alert(err.message || "Failed to load lab submissions.");
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
    <div className="instructor-content-area">
      {/* Header */}
      <div className="instructor-header-banner">
        <div className="instructor-header-titles">
          <h1>🔬 Quantum Lab Assignments</h1>
          <p>Author and assign hands-on quantum circuit experiments integrated directly with SAMBHAV's Quantum Lab simulator.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className="instructor-btn-secondary" onClick={loadData}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button type="button" className="instructor-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Lab Assignment
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="instructor-error-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={18} color="#e11d48" />
            <span className="instructor-error-banner-text">{error}</span>
          </div>
          <button type="button" onClick={loadData} className="instructor-btn-secondary" style={{ padding: "5px 12px", fontSize: "12px" }}>
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="instructor-loading-box">
          <div className="instructor-spinner"></div>
          <span>Loading lab assignments...</span>
        </div>
      ) : labs.length === 0 ? (
        <div className="instructor-panel-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚡</div>
          <h3 style={{ justifyContent: "center", marginBottom: "8px" }}>No Quantum Lab Assignments Yet</h3>
          <p style={{ color: "#64748b", fontSize: "13px", maxWidth: "480px", margin: "0 auto 20px" }}>
            Create circuit-building experiments for your students to design, simulate, and verify quantum algorithms.
          </p>
          <button type="button" className="instructor-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Your First Lab
          </button>
        </div>
      ) : (
        /* Lab Cards Grid */
        <div className="instructor-card-grid">
          {labs.map((lab) => (
            <div key={lab.id} className="instructor-item-card">
              <div>
                <div className="instructor-item-card-header">
                  <span
                    className={`badge-pill ${
                      lab.difficulty === "Beginner"
                        ? "badge-pill-teal"
                        : lab.difficulty === "Intermediate"
                        ? "badge-pill-amber"
                        : "badge-pill-rose"
                    }`}
                  >
                    {lab.difficulty}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    {lab.qubits} Qubits • {lab.marks} Pts
                  </span>
                </div>

                <h3 className="instructor-item-card-title">{lab.title}</h3>
                <p className="instructor-item-card-desc">{lab.description}</p>

                {/* Required Gates Tags */}
                {lab.required_gates && lab.required_gates.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Required:</span>
                    {lab.required_gates.map((g, i) => (
                      <span
                        key={i}
                        style={{
                          background: "rgba(13, 148, 136, 0.1)",
                          color: "#0284c7",
                          border: "1px solid rgba(13, 148, 136, 0.25)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8", padding: "8px 0", borderTop: "1px solid #f1f5f9", marginBottom: "12px" }}>
                  <span>{lab.class_name ? `Class: ${lab.class_name}` : "All Cohorts"}</span>
                  {lab.deadline && <span>Due: {new Date(lab.deadline).toLocaleDateString()}</span>}
                </div>

                <div className="instructor-item-card-actions">
                  <button
                    type="button"
                    onClick={() => handleOpenSubmissions(lab)}
                    className="instructor-btn-secondary"
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                  >
                    <FlaskConical size={14} /> Submissions
                  </button>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(lab)}
                      className="instructor-btn-secondary"
                      style={{ padding: "6px 10px" }}
                      title="Edit Lab Assignment"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLab(lab.id, lab.title)}
                      className="instructor-btn-danger"
                      title="Delete Lab Assignment"
                    >
                      <Trash2 size={14} />
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
        <div className="instructor-modal-overlay">
          <div className="instructor-modal-box">
            <div className="instructor-modal-header">
              <div>
                <h3>{isCreating ? "Create Quantum Lab Assignment" : "Edit Lab Assignment"}</h3>
                <p>Define quantum circuit requirements, simulation objectives, and learner guidelines.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingLab(null)}
                className="instructor-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLab} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="instructor-modal-body">
                <div className="instructor-form-row">
                  <div className="instructor-form-group">
                    <label className="instructor-form-label">Experiment Title *</label>
                    <input
                      type="text"
                      required
                      value={editingLab.title || ""}
                      onChange={(e) => setEditingLab({ ...editingLab, title: e.target.value })}
                      placeholder="e.g., Lab 2: Entanglement & Bell State Generation"
                      className="instructor-form-input"
                    />
                  </div>
                  <div className="instructor-form-group">
                    <label className="instructor-form-label">Assign to Class Cohort</label>
                    <select
                      value={editingLab.class_id || ""}
                      onChange={(e) => setEditingLab({ ...editingLab, class_id: e.target.value || undefined })}
                      className="instructor-form-select"
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

                <div className="instructor-form-group">
                  <label className="instructor-form-label">Description & Scientific Motivation *</label>
                  <textarea
                    rows={2}
                    required
                    value={editingLab.description || ""}
                    onChange={(e) => setEditingLab({ ...editingLab, description: e.target.value })}
                    placeholder="Explain the physical principle and significance of this quantum circuit experiment..."
                    className="instructor-form-textarea"
                  />
                </div>

                {/* Parameters */}
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                  <div className="instructor-form-row" style={{ margin: 0 }}>
                    <div className="instructor-form-group" style={{ margin: 0 }}>
                      <label className="instructor-form-label">Number of Qubits</label>
                      <input
                        type="number"
                        min={1}
                        max={16}
                        value={editingLab.qubits || 2}
                        onChange={(e) =>
                          setEditingLab({ ...editingLab, qubits: parseInt(e.target.value) || 2 })
                        }
                        className="instructor-form-input"
                      />
                    </div>
                    <div className="instructor-form-group" style={{ margin: 0 }}>
                      <label className="instructor-form-label">Difficulty Level</label>
                      <select
                        value={editingLab.difficulty || "Beginner"}
                        onChange={(e) =>
                          setEditingLab({
                            ...editingLab,
                            difficulty: e.target.value as "Beginner" | "Intermediate" | "Advanced",
                          })
                        }
                        className="instructor-form-select"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="instructor-form-group" style={{ margin: 0 }}>
                      <label className="instructor-form-label">Total Marks</label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={editingLab.marks || 100}
                        onChange={(e) =>
                          setEditingLab({ ...editingLab, marks: parseInt(e.target.value) || 100 })
                        }
                        className="instructor-form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Required Gates */}
                <div className="instructor-form-group">
                  <label className="instructor-form-label">Required Quantum Gates</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {editingLab.required_gates?.map((gate) => (
                      <span
                        key={gate}
                        style={{
                          background: "rgba(13, 148, 136, 0.12)",
                          color: "#0284c7",
                          border: "1px solid rgba(13, 148, 136, 0.25)",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {gate}
                        <button
                          type="button"
                          onClick={() => removeRequiredGate(gate)}
                          style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer", fontSize: "12px", padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Quick add:</span>
                    {["H", "X", "Y", "Z", "CX", "CZ", "SWAP", "Rz", "Rx", "Measure"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => addRequiredGate(g)}
                        className="instructor-btn-secondary"
                        style={{ fontSize: "11px", padding: "2px 8px" }}
                      >
                        +{g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expected Result & Step-by-Step Instructions */}
                <div className="instructor-form-group">
                  <label className="instructor-form-label">Expected Experimental Outcome / Target State</label>
                  <input
                    type="text"
                    value={editingLab.expected_result || ""}
                    onChange={(e) => setEditingLab({ ...editingLab, expected_result: e.target.value })}
                    placeholder="e.g., Entangled state (|00⟩ + |11⟩)/√2 with zero probability for |01⟩ and |10⟩"
                    className="instructor-form-input"
                  />
                </div>

                <div className="instructor-form-group">
                  <label className="instructor-form-label">Step-by-Step Experiment Instructions</label>
                  <textarea
                    rows={3}
                    value={editingLab.instructions || ""}
                    onChange={(e) => setEditingLab({ ...editingLab, instructions: e.target.value })}
                    placeholder="1. Set up initial state&#10;2. Apply transformation gates...&#10;3. Record measurement counts..."
                    className="instructor-form-textarea"
                    style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}
                  />
                </div>

                {/* Hints */}
                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <label className="instructor-form-label" style={{ margin: 0 }}>
                      Progressive Hints ({editingLab.hints?.length || 0})
                    </label>
                    <button
                      type="button"
                      onClick={addHint}
                      className="instructor-btn-secondary"
                      style={{ fontSize: "11px", padding: "3px 8px" }}
                    >
                      + Add Hint
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {editingLab.hints?.map((hint, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#64748b", width: "24px" }}>#{idx + 1}</span>
                        <input
                          type="text"
                          value={hint}
                          onChange={(e) => updateHint(idx, e.target.value)}
                          placeholder={`Hint ${idx + 1}...`}
                          className="instructor-form-input"
                          style={{ fontSize: "12px", padding: "6px 10px" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeHint(idx)}
                          className="instructor-btn-danger"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="instructor-modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingLab(null)}
                  className="instructor-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="instructor-btn-primary"
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
        <div className="instructor-modal-overlay">
          <div className="instructor-modal-box">
            <div className="instructor-modal-header">
              <div>
                <h3>🔬 Submissions: {selectedLabForSubs.title}</h3>
                <p>Review student circuit simulations and award marks with constructive feedback.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLabForSubs(null)}
                className="instructor-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="instructor-modal-body">
              {loadingSubs ? (
                <div className="instructor-loading-box">
                  <div className="instructor-spinner"></div>
                  <span>Loading lab submissions...</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="instructor-empty-state">
                  <div style={{ fontSize: "28px" }}>🔭</div>
                  <h4>No Lab Submissions Yet</h4>
                  <p>When students submit circuits for this lab experiment, they will appear here for verification and grading.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                            {sub.student_name || "Learner"}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "6px" }}>
                            ({sub.student_email || sub.user_id})
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "13px", color: sub.status === "graded" ? "#16a34a" : "#d97706" }}>
                          {sub.status === "graded" ? `Score: ${sub.score} / ${selectedLabForSubs.marks}` : "Needs Review"}
                        </span>
                      </div>

                      {/* Submitted Circuit Preview */}
                      {sub.circuit && (
                        <div style={{ background: "#0f172a", color: "#38bdf8", padding: "10px 12px", borderRadius: "6px", fontSize: "11px", fontFamily: "JetBrains Mono, monospace", overflowX: "auto" }}>
                          <span style={{ color: "#94a3b8" }}>Circuit IR: </span>
                          {JSON.stringify(sub.circuit)}
                        </div>
                      )}

                      {sub.feedback && (
                        <p style={{ margin: 0, fontSize: "12px", color: "#475569", background: "#ffffff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                          <strong>Feedback:</strong> {sub.feedback}
                        </p>
                      )}

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenGrading(sub)}
                          className="instructor-btn-primary"
                          style={{ fontSize: "12px", padding: "6px 12px" }}
                        >
                          {sub.status === "graded" ? "Edit Grade" : "Grade Submission"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="instructor-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedLabForSubs(null)}
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
                <h3>Grade Lab Submission</h3>
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
                <label className="instructor-form-label">
                  Score (0 - {selectedLabForSubs?.marks || 100})
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedLabForSubs?.marks || 100}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(parseFloat(e.target.value) || 0)}
                  className="instructor-form-input"
                />
              </div>

              <div className="instructor-form-group">
                <label className="instructor-form-label">Instructor Feedback</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Circuit correctness notes, gate efficiency tips..."
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
