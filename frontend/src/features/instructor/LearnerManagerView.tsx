import {
  AlertTriangle,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  GraduationCap,
  Lightbulb,
  Search,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { fetchInstructorLearnerDetail, fetchInstructorLearners } from "../../api/client";

export function LearnerManagerView() {
  const { showToast } = useToast();
  const [learners, setLearners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("all");

  // Selected Learner Detail Modal
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [learnerDetail, setLearnerDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  function loadLearners() {
    setIsLoading(true);
    fetchInstructorLearners()
      .then((data) => setLearners(data || []))
      .catch(() => showToast("Failed to load learners.", "error"))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadLearners();
  }, []);

  useEffect(() => {
    if (selectedLearnerId) {
      setIsLoadingDetail(true);
      fetchInstructorLearnerDetail(selectedLearnerId)
        .then((data) => setLearnerDetail(data))
        .catch(() => showToast("Failed to load learner detail.", "error"))
        .finally(() => setIsLoadingDetail(false));
    } else {
      setLearnerDetail(null);
    }
  }, [selectedLearnerId]);

  const uniqueClasses = Array.from(new Set(learners.map((l) => l.className).filter(Boolean)));

  const filteredLearners = learners.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === "all" || l.className === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div>
      {/* Header Banner */}
      <div className="instructor-header-banner">
        <div className="instructor-header-titles">
          <h1>Authorized Learners Directory</h1>
          <p>Monitor individual student mastery across unified modules, quizzes, challenge attempts, and quantum lab experiments.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="instructor-panel-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "11px", color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search learners by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "6px",
                padding: "8px 12px 8px 36px",
                color: "#f8fafc",
                fontSize: "13px",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Cohort:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "6px",
                padding: "8px 12px",
                color: "#f8fafc",
                fontSize: "13px",
              }}
            >
              <option value="all">All Cohorts</option>
              {uniqueClasses.map((cName) => (
                <option key={cName} value={cName}>{cName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Learners Table */}
      <div className="instructor-panel-card">
        {filteredLearners.length === 0 ? (
          <div className="instructor-empty-state">
            <Users size={32} />
            <p>No learners found matching your criteria. Create a class cohort and enroll students to see their progression.</p>
          </div>
        ) : (
          <div className="instructor-table-container">
            <table className="instructor-table">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Cohort</th>
                  <th>Curriculum Progress</th>
                  <th>Assessment Avg</th>
                  <th>Weak Concept / Focus Area</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLearners.map((learner) => (
                  <tr key={learner.id}>
                    <td>
                      <strong style={{ color: "#f8fafc" }}>{learner.name}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{learner.email}</div>
                    </td>
                    <td>
                      <span className="instructor-tag custom">{learner.className || "General"}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "6px", background: "#0f172a", borderRadius: "3px", overflow: "hidden", minWidth: "60px" }}>
                          <div style={{ height: "100%", width: `${learner.progressPercent}%`, background: "#38bdf8" }} />
                        </div>
                        <span style={{ fontSize: "11px" }}>{learner.completedLessons} / 31</span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: learner.averageScore >= 80 ? "#4ade80" : learner.averageScore < 70 ? "#f87171" : "#facc15" }}>
                        {learner.averageScore > 0 ? `${learner.averageScore}%` : "No scores"}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "#cbd5e1" }}>{learner.weakConcept}</span>
                    </td>
                    <td>
                      <span
                        className={`instructor-tag ${
                          learner.status === "excelling"
                            ? "published"
                            : learner.status === "needs-help"
                            ? "draft"
                            : "canonical"
                        }`}
                      >
                        {learner.status === "excelling" ? "Excelling" : learner.status === "needs-help" ? "Needs Help" : "On Track"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="instructor-btn-secondary"
                        onClick={() => setSelectedLearnerId(learner.id)}
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        <Eye size={12} /> View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INDIVIDUAL LEARNER DETAIL MODAL */}
      {selectedLearnerId && (
        <div className="preview-modal-overlay" onClick={() => setSelectedLearnerId(null)}>
          <div className="preview-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Users size={18} style={{ color: "#38bdf8" }} />
                <h3 style={{ margin: 0, fontSize: "16px", color: "#f8fafc" }}>
                  {learnerDetail?.student?.name || "Learner Profile"} — Detailed Performance
                </h3>
              </div>
              <button
                type="button"
                className="instructor-btn-secondary"
                onClick={() => setSelectedLearnerId(null)}
                style={{ padding: "4px 8px" }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="preview-modal-body">
              {isLoadingDetail || !learnerDetail ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <Clock size={28} className="spin-slow" style={{ margin: "0 auto 8px", color: "#38bdf8" }} />
                  Loading learner metrics...
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Summary Stats Row */}
                  <div className="instructor-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: "0" }}>
                    <div className="instructor-kpi-card" style={{ padding: "14px" }}>
                      <span className="kpi-label">Completed</span>
                      <span className="kpi-value" style={{ fontSize: "22px" }}>{learnerDetail.progress?.completedLessons ?? 0} / 31</span>
                      <span className="kpi-subtext">Lessons finished</span>
                    </div>
                    <div className="instructor-kpi-card" style={{ padding: "14px" }}>
                      <span className="kpi-label">Assessment Avg</span>
                      <span className="kpi-value" style={{ fontSize: "22px" }}>{learnerDetail.progress?.averageScore ?? 0}%</span>
                      <span className="kpi-subtext">Across submissions</span>
                    </div>
                    <div className="instructor-kpi-card" style={{ padding: "14px" }}>
                      <span className="kpi-label">Simulations</span>
                      <span className="kpi-value" style={{ fontSize: "22px" }}>{learnerDetail.progress?.simulationsRun ?? 0}</span>
                      <span className="kpi-subtext">Quantum lab jobs</span>
                    </div>
                    <div className="instructor-kpi-card" style={{ padding: "14px" }}>
                      <span className="kpi-label">Challenges Solved</span>
                      <span className="kpi-value" style={{ fontSize: "22px" }}>{learnerDetail.progress?.challengesSolved ?? 0}</span>
                      <span className="kpi-subtext">Score ≥ 80%</span>
                    </div>
                  </div>

                  {/* Misconceptions & AI Recommendations */}
                  <div style={{ background: "rgba(14, 165, 233, 0.08)", border: "1px solid rgba(14, 165, 233, 0.3)", borderRadius: "8px", padding: "16px" }}>
                    <h4 style={{ color: "#38bdf8", fontSize: "14px", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Lightbulb size={16} /> Automated Misconception Diagnostics & Recommendations
                    </h4>
                    {learnerDetail.progress?.recommendations && learnerDetail.progress.recommendations.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {learnerDetail.progress.recommendations.map((rec: any, idx: number) => (
                          <div key={idx} style={{ fontSize: "13px", color: "#cbd5e1" }}>
                            <strong>• {rec.title}:</strong> {rec.reason}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
                        Learner is progressing smoothly on fundamentals without detected recurring gate or phase errors.
                      </p>
                    )}
                  </div>

                  {/* Submissions History */}
                  <div>
                    <h4 style={{ color: "#f8fafc", fontSize: "15px", marginBottom: "10px" }}>Recent Assessment & Quiz Submissions</h4>
                    {(!learnerDetail.submissions || learnerDetail.submissions.length === 0) ? (
                      <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>No assessment submissions recorded yet.</p>
                    ) : (
                      <div className="instructor-table-container">
                        <table className="instructor-table">
                          <thead>
                            <tr>
                              <th>Assessment</th>
                              <th>Score</th>
                              <th>Feedback</th>
                              <th>Submitted At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {learnerDetail.submissions.map((sub: any) => (
                              <tr key={sub.id}>
                                <td>{sub.assessment_title || sub.assessment_id}</td>
                                <td><strong>{sub.score}%</strong></td>
                                <td>{sub.feedback || "Evaluated by automated test oracle"}</td>
                                <td style={{ fontSize: "11px", color: "#64748b" }}>{sub.submitted_at ? sub.submitted_at.slice(0, 16) : ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Quantum Lab Submissions */}
                  <div>
                    <h4 style={{ color: "#f8fafc", fontSize: "15px", marginBottom: "10px" }}>Quantum Lab Experiment Submissions</h4>
                    {(!learnerDetail.labSubmissions || learnerDetail.labSubmissions.length === 0) ? (
                      <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>No lab submissions recorded yet.</p>
                    ) : (
                      <div className="instructor-table-container">
                        <table className="instructor-table">
                          <thead>
                            <tr>
                              <th>Experiment Title</th>
                              <th>Status</th>
                              <th>Score</th>
                              <th>Instructor Feedback</th>
                            </tr>
                          </thead>
                          <tbody>
                            {learnerDetail.labSubmissions.map((ls: any) => (
                              <tr key={ls.id}>
                                <td>{ls.lab_title}</td>
                                <td><span className={`instructor-tag ${ls.status === "graded" ? "published" : "draft"}`}>{ls.status}</span></td>
                                <td>{ls.score !== null ? `${ls.score} / ${ls.max_marks}` : "Awaiting grading"}</td>
                                <td>{ls.feedback || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
