import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Copy,
  FilePlus,
  GraduationCap,
  Layers,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import {
  createClassAssignmentApi,
  createInstructorClassApi,
  deleteInstructorClassApi,
  enrollStudentInClassApi,
  fetchInstructorClassById,
  fetchInstructorClasses,
  removeStudentFromClassApi,
} from "../../api/client";

export function ClassManagerView() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassDetail, setSelectedClassDetail] = useState<any | null>(null);

  // Create Class Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Enroll Student Modal / Input
  const [studentInput, setStudentInput] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Assign Item Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignType, setAssignType] = useState<"lesson" | "assessment" | "lab" | "challenge">("lesson");
  const [assignTargetId, setAssignTargetId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  function loadClasses() {
    setIsLoading(true);
    fetchInstructorClasses()
      .then((data) => setClasses(data || []))
      .catch(() => showToast("Failed to load classes.", "error"))
      .finally(() => setIsLoading(false));
  }

  function loadClassDetail(classId: string) {
    fetchInstructorClassById(classId)
      .then((data) => setSelectedClassDetail(data))
      .catch(() => showToast("Failed to load class details.", "error"));
  }

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassDetail(selectedClassId);
    } else {
      setSelectedClassDetail(null);
    }
  }, [selectedClassId]);

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) {
      showToast("Class name is required.", "error");
      return;
    }
    setIsCreating(true);
    try {
      await createInstructorClassApi({
        name: newClassName.trim(),
        description: newClassDesc.trim(),
        enrollment_code: newClassCode.trim() || undefined,
      });
      showToast("Class cohort created successfully!", "success");
      setShowCreateModal(false);
      setNewClassName("");
      setNewClassDesc("");
      setNewClassCode("");
      loadClasses();
    } catch (err: any) {
      showToast(err.message || "Failed to create class.", "error");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteClass(classId: string) {
    if (!window.confirm("Are you sure you want to delete this cohort?")) return;
    try {
      await deleteInstructorClassApi(classId);
      showToast("Class deleted successfully.", "success");
      if (selectedClassId === classId) setSelectedClassId(null);
      loadClasses();
    } catch (err: any) {
      showToast(err.message || "Failed to delete class.", "error");
    }
  }

  async function handleEnrollStudent() {
    if (!studentInput.trim() || !selectedClassId) return;
    setIsEnrolling(true);
    try {
      await enrollStudentInClassApi(selectedClassId, studentInput.trim());
      showToast("Student enrolled successfully!", "success");
      setStudentInput("");
      loadClassDetail(selectedClassId);
      loadClasses();
    } catch (err: any) {
      showToast(err.message || "Failed to enroll student.", "error");
    } finally {
      setIsEnrolling(false);
    }
  }

  async function handleRemoveStudent(studentId: string) {
    if (!selectedClassId) return;
    if (!window.confirm("Remove this student from the cohort?")) return;
    try {
      await removeStudentFromClassApi(selectedClassId, studentId);
      showToast("Student removed from class.", "success");
      loadClassDetail(selectedClassId);
      loadClasses();
    } catch (err: any) {
      showToast(err.message || "Failed to remove student.", "error");
    }
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTitle.trim() || !assignTargetId.trim() || !selectedClassId) {
      showToast("Assignment title and target ID are required.", "error");
      return;
    }
    setIsAssigning(true);
    try {
      await createClassAssignmentApi(selectedClassId, {
        title: assignTitle.trim(),
        type: assignType,
        target_id: assignTargetId.trim(),
        due_date: assignDueDate || undefined,
      });
      showToast("Assignment dispatched to cohort!", "success");
      setShowAssignModal(false);
      setAssignTitle("");
      setAssignTargetId("");
      setAssignDueDate("");
      loadClassDetail(selectedClassId);
      loadClasses();
    } catch (err: any) {
      showToast(err.message || "Failed to create assignment.", "error");
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="instructor-header-banner">
        <div className="instructor-header-titles">
          <h1>Class & Cohort Management</h1>
          <p>Organize learners into classes, generate enrollment codes, dispatch curriculum assignments, and monitor collective progress.</p>
        </div>
        <button type="button" className="instructor-btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Create Cohort
        </button>
      </div>

      {/* If a class is selected, show Class Detail View */}
      {selectedClassId && selectedClassDetail ? (
        <div>
          <button
            type="button"
            className="instructor-btn-secondary"
            onClick={() => setSelectedClassId(null)}
            style={{ marginBottom: "16px", fontSize: "12px", padding: "6px 12px" }}
          >
            <ChevronLeft size={14} /> Back to All Classes
          </button>

          <div className="instructor-panel-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "20px", color: "var(--text-primary)", margin: "0 0 4px 0" }}>{selectedClassDetail.name}</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>{selectedClassDetail.description || "No description provided."}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>CODE:</span>
                  <code style={{ color: "var(--accent-cyan)", fontWeight: 800, fontSize: "13px" }}>{selectedClassDetail.enrollment_code}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedClassDetail.enrollment_code);
                      showToast("Enrollment code copied to clipboard!", "success");
                    }}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                    title="Copy code"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  className="instructor-btn-danger"
                  onClick={() => handleDeleteClass(selectedClassDetail.id)}
                >
                  <Trash2 size={13} /> Delete Class
                </button>
              </div>
            </div>

            {/* Sub-section: Enrolled Learners & Add Student */}
            <div style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>
                  <Users size={16} style={{ color: "var(--accent-cyan)" }} />
                  Enrolled Learners ({selectedClassDetail.students?.length || 0})
                </h3>

                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Enter student email to enroll..."
                    value={studentInput}
                    onChange={(e) => setStudentInput(e.target.value)}
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      color: "var(--text-primary)",
                      fontSize: "12px",
                      width: "240px",
                    }}
                  />
                  <button
                    type="button"
                    className="instructor-btn-primary"
                    onClick={handleEnrollStudent}
                    disabled={isEnrolling || !studentInput.trim()}
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                  >
                    Enroll
                  </button>
                </div>
              </div>

              {(!selectedClassDetail.students || selectedClassDetail.students.length === 0) ? (
                <div className="instructor-empty-state" style={{ padding: "24px" }}>
                  <Users size={28} />
                  <p style={{ fontSize: "13px" }}>No learners enrolled in this class yet. Share the code <strong>{selectedClassDetail.enrollment_code}</strong> or enter their email above.</p>
                </div>
              ) : (
                <div className="instructor-table-container">
                  <table className="instructor-table">
                    <thead>
                      <tr>
                        <th>Learner Name</th>
                        <th>Email</th>
                        <th>Completed Lessons</th>
                        <th>Average Score</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClassDetail.students.map((st: any) => (
                        <tr key={st.id}>
                          <td><strong style={{ color: "var(--text-primary)" }}>{st.name}</strong></td>
                          <td>{st.email}</td>
                          <td>{st.completed_lessons ?? 0} / 31 ({st.progressPercent}%)</td>
                          <td>{st.avgScore > 0 ? `${st.avgScore}%` : "No submissions"}</td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="instructor-btn-danger"
                              onClick={() => handleRemoveStudent(st.id)}
                              style={{ fontSize: "11px", padding: "3px 8px" }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sub-section: Cohort Assignments */}
            <div style={{ marginTop: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>
                  <Layers size={16} style={{ color: "var(--accent-purple)" }} />
                  Class Assignments ({selectedClassDetail.assignments?.length || 0})
                </h3>
                <button
                  type="button"
                  className="instructor-btn-secondary"
                  onClick={() => setShowAssignModal(true)}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  <Plus size={13} /> Assign Content
                </button>
              </div>

              {(!selectedClassDetail.assignments || selectedClassDetail.assignments.length === 0) ? (
                <div className="instructor-empty-state" style={{ padding: "24px" }}>
                  <Layers size={28} />
                  <p style={{ fontSize: "13px" }}>No assignments assigned to this class cohort yet.</p>
                </div>
              ) : (
                <div className="instructor-table-container">
                  <table className="instructor-table">
                    <thead>
                      <tr>
                        <th>Assignment Title</th>
                        <th>Type</th>
                        <th>Target ID</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClassDetail.assignments.map((asg: any) => (
                        <tr key={asg.id}>
                          <td><strong style={{ color: "var(--text-primary)" }}>{asg.title}</strong></td>
                          <td><span className="instructor-tag custom">{asg.type}</span></td>
                          <td><code>{asg.target_id}</code></td>
                          <td>{asg.due_date ? asg.due_date.slice(0, 10) : "Open-ended"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Classes Grid View */
        <div>
          {classes.length === 0 ? (
            <div className="instructor-empty-state">
              <GraduationCap size={40} />
              <h3>No Classes or Cohorts Yet</h3>
              <p>Create your first class cohort to organize students, generate unique enrollment codes, and track collective progress.</p>
              <button type="button" className="instructor-btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={15} /> Create First Cohort
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="instructor-panel-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                  onClick={() => setSelectedClassId(cls.id)}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "17px", color: "var(--text-primary)" }}>{cls.name}</h3>
                      <span
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--accent-cyan)",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {cls.enrollment_code}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px 0", lineHeight: "1.4" }}>
                      {cls.description || "No description provided."}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      <span><strong>{cls.enrolled_count ?? 0}</strong> Students</span>
                      <span><strong>{cls.assignment_count ?? 0}</strong> Assignments</span>
                      <span>Avg: <strong>{cls.averageScore > 0 ? `${cls.averageScore}%` : "N/A"}</strong></span>
                    </div>

                    <div style={{ height: "6px", background: "var(--bg-track)", borderRadius: "3px", overflow: "hidden", marginBottom: "16px" }}>
                      <div style={{ height: "100%", width: `${cls.averageProgress ?? 0}%`, background: "var(--accent-cyan)" }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        type="button"
                        className="instructor-btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClassId(cls.id);
                        }}
                        style={{ fontSize: "11px", padding: "4px 10px" }}
                      >
                        Manage Cohort
                      </button>
                      <button
                        type="button"
                        className="instructor-btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(cls.id);
                        }}
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showCreateModal && (
        <div className="preview-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="preview-modal-box" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)" }}>Create New Class Cohort</h3>
              <button type="button" className="instructor-btn-secondary" onClick={() => setShowCreateModal(false)} style={{ padding: "4px 8px" }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateClass} style={{ padding: "20px" }}>
              <div className="builder-form-group">
                <label>Class Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Quantum Computing — Batch 2026"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
              </div>
              <div className="builder-form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Undergraduate semester 6 quantum computing cohort."
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                />
              </div>
              <div className="builder-form-group">
                <label>Custom Enrollment Code (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty for auto-generated code (e.g. QC7A9F)"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                />
              </div>
              <div className="builder-action-bar">
                <button type="button" className="instructor-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="instructor-btn-primary" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Cohort"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN CONTENT MODAL */}
      {showAssignModal && (
        <div className="preview-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="preview-modal-box" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>Assign Content to Cohort</h3>
              <button type="button" className="instructor-btn-secondary" onClick={() => setShowAssignModal(false)} style={{ padding: "4px 8px" }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateAssignment} style={{ padding: "20px" }}>
              <div className="builder-form-group">
                <label>Assignment Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Module 2: Bell State Synthesis Lab"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  required
                />
              </div>
              <div className="builder-form-group">
                <label>Content Type</label>
                <select value={assignType} onChange={(e) => setAssignType(e.target.value as any)}>
                  <option value="lesson">Curriculum Lesson</option>
                  <option value="lab">Quantum Lab Assignment</option>
                  <option value="assessment">Assessment / Quiz</option>
                  <option value="challenge">Algorithm Challenge</option>
                </select>
              </div>
              <div className="builder-form-group">
                <label>Target Identifier (ID / Slug) *</label>
                <input
                  type="text"
                  placeholder="e.g. bell-state, lab-bell-state, or grover-search"
                  value={assignTargetId}
                  onChange={(e) => setAssignTargetId(e.target.value)}
                  required
                />
              </div>
              <div className="builder-form-group">
                <label>Due Date (Optional)</label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                />
              </div>
              <div className="builder-action-bar">
                <button type="button" className="instructor-btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="instructor-btn-primary" disabled={isAssigning}>
                  {isAssigning ? "Assigning..." : "Assign to Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
