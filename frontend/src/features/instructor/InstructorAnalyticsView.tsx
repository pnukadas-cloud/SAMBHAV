import React, { useState, useEffect } from "react";
import { fetchInstructorAnalytics } from "../../api/client";
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Award,
  BookOpen,
  AlertTriangle,
  Users,
  Target,
  BrainCircuit,
  AlertCircle,
} from "lucide-react";

interface ModuleCompletion {
  title: string;
  order_index: number;
  completions: number;
}

interface ConceptStat {
  concept: string;
  attempts: number;
  averageScore: number;
}

interface LearnerBehind {
  id: string;
  name: string;
  email: string;
  completedLessons: number;
  averageScore: number;
  reason: string;
}

interface AnalyticsData {
  hasData: boolean;
  totalSubmissions: number;
  averageScore: number;
  moduleCompletions: ModuleCompletion[];
  scoreDistribution: {
    "90-100": number;
    "75-89": number;
    "60-74": number;
    "<60": number;
  };
  conceptStats: ConceptStat[];
  learnersBehind: LearnerBehind[];
}

export const InstructorAnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInstructorAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to fetch instructor analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="instructor-content-area">
        <div className="instructor-loading-box">
          <div className="instructor-spinner"></div>
          <span>Calculating cohort metrics from database...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="instructor-content-area">
        <div className="instructor-error-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={18} color="#e11d48" />
            <span className="instructor-error-banner-text">{error}</span>
          </div>
          <button
            type="button"
            onClick={loadAnalytics}
            className="instructor-btn-secondary"
            style={{ padding: "5px 12px", fontSize: "12px" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasAnyData = data && (data.hasData || data.totalSubmissions > 0 || (data.learnersBehind && data.learnersBehind.length > 0));
  const maxCompletions = Math.max(1, ...(data?.moduleCompletions?.map((m) => m.completions) || [1]));
  const totalScores =
    (data?.scoreDistribution?.["90-100"] || 0) +
    (data?.scoreDistribution?.["75-89"] || 0) +
    (data?.scoreDistribution?.["60-74"] || 0) +
    (data?.scoreDistribution?.["<60"] || 0);

  return (
    <div className="instructor-content-area">
      {/* Header */}
      <div className="instructor-header-banner">
        <div className="instructor-header-titles">
          <h1>📈 Real-Time Cohort Analytics</h1>
          <p>Calculated directly from real database progress records, simulation logs, and assessment scores.</p>
        </div>
        <button
          type="button"
          onClick={loadAnalytics}
          className="instructor-btn-secondary"
        >
          <RefreshCw size={15} /> Refresh Data
        </button>
      </div>

      {!hasAnyData ? (
        <div className="instructor-panel-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📊</div>
          <h3 style={{ justifyContent: "center", marginBottom: "8px" }}>No Learner Activity Yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", maxWidth: "480px", margin: "0 auto" }}>
            Once your enrolled learners start completing modules, running quantum circuits, or submitting quizzes, real performance distributions and insights will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="instructor-kpi-grid">
            <div className="instructor-kpi-card">
              <span className="kpi-label">
                <Target size={14} color="var(--accent-cyan)" /> Total Submissions
              </span>
              <span className="kpi-value">{data?.totalSubmissions ?? 0}</span>
              <span className="kpi-subtext">Quizzes & evaluations</span>
            </div>

            <div className="instructor-kpi-card">
              <span className="kpi-label">
                <Award size={14} color="#16a34a" /> Average Score
              </span>
              <span className="kpi-value" style={{ color: "#16a34a" }}>
                {data?.averageScore ?? 0}%
              </span>
              <span className="kpi-subtext">Across all completed attempts</span>
            </div>

            <div className="instructor-kpi-card">
              <span className="kpi-label">
                <BookOpen size={14} color="#4361ee" /> Active Modules
              </span>
              <span className="kpi-value">
                {data?.moduleCompletions?.filter((m) => m.completions > 0).length ?? 0}
                <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-muted)" }}> / 10</span>
              </span>
              <span className="kpi-subtext">Modules with completed lessons</span>
            </div>

            <div className="instructor-kpi-card">
              <span className="kpi-label">
                <AlertTriangle size={14} color="#d97706" /> Attention Needed
              </span>
              <span className="kpi-value" style={{ color: "#d97706" }}>
                {data?.learnersBehind?.length ?? 0}
              </span>
              <span className="kpi-subtext">Pacing or score below threshold</span>
            </div>
          </div>

          {/* Analytics Grids */}
          <div className="instructor-grid-two-col">
            {/* Module Completion Distribution */}
            <div className="instructor-panel-card">
              <h3>
                <BookOpen size={18} color="var(--accent-cyan)" /> Module Progression Funnel
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 18px 0" }}>
                Total student lesson completions across the 10-module quantum curriculum.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data?.moduleCompletions?.map((mod, idx) => {
                  const pct = Math.round((mod.completions / maxCompletions) * 100);
                  return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {mod.title}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontFamily: "monospace", fontWeight: 700 }}>
                          {mod.completions} {mod.completions === 1 ? "completion" : "completions"}
                        </span>
                      </div>
                      <div className="analytics-prog-track">
                        <div
                          className="analytics-prog-fill"
                          style={{
                            width: `${Math.max(mod.completions > 0 ? 5 : 0, pct)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score Distribution & Concept Performance */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Score Distribution */}
              <div className="instructor-panel-card" style={{ margin: 0 }}>
                <h3>
                  <Target size={18} color="#7c3aed" /> Grade & Score Distribution
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 16px 0" }}>
                  Assessment grade spread for verified submissions.
                </p>

                {totalScores === 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
                    No graded submissions recorded yet.
                  </p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", textAlign: "center" }}>
                    <div className="analytics-score-card score-tier-green">
                      <span className="score-tier-label">90 - 100%</span>
                      <span className="score-tier-val">
                        {data?.scoreDistribution?.["90-100"] || 0}
                      </span>
                      <span className="score-tier-pct">
                        {Math.round(((data?.scoreDistribution?.["90-100"] || 0) / totalScores) * 100)}%
                      </span>
                    </div>

                    <div className="analytics-score-card score-tier-cyan">
                      <span className="score-tier-label">75 - 89%</span>
                      <span className="score-tier-val">
                        {data?.scoreDistribution?.["75-89"] || 0}
                      </span>
                      <span className="score-tier-pct">
                        {Math.round(((data?.scoreDistribution?.["75-89"] || 0) / totalScores) * 100)}%
                      </span>
                    </div>

                    <div className="analytics-score-card score-tier-amber">
                      <span className="score-tier-label">60 - 74%</span>
                      <span className="score-tier-val">
                        {data?.scoreDistribution?.["60-74"] || 0}
                      </span>
                      <span className="score-tier-pct">
                        {Math.round(((data?.scoreDistribution?.["60-74"] || 0) / totalScores) * 100)}%
                      </span>
                    </div>

                    <div className="analytics-score-card score-tier-rose">
                      <span className="score-tier-label">&lt; 60%</span>
                      <span className="score-tier-val">
                        {data?.scoreDistribution?.["<60"] || 0}
                      </span>
                      <span className="score-tier-pct">
                        {Math.round(((data?.scoreDistribution?.["<60"] || 0) / totalScores) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Concept Performance */}
              <div className="instructor-panel-card" style={{ margin: 0 }}>
                <h3>
                  <BrainCircuit size={18} color="#ea580c" /> Concept Difficulty Breakdown
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 14px 0" }}>
                  Assessment areas ordered by student attempt volume and average accuracy.
                </p>

                {(!data?.conceptStats || data.conceptStats.length === 0) ? (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "14px 0" }}>
                    No concept assessments completed yet.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {data.conceptStats.map((cs, idx) => (
                      <div
                        key={idx}
                        className="analytics-concept-item"
                      >
                        <div>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                            {cs.concept}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {cs.attempts} {cs.attempts === 1 ? "attempt" : "attempts"}
                          </span>
                        </div>
                        <span
                          className={`badge-pill ${
                            cs.averageScore >= 80
                              ? "badge-pill-green"
                              : cs.averageScore >= 65
                              ? "badge-pill-amber"
                              : "badge-pill-rose"
                          }`}
                        >
                          {cs.averageScore}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Learners Identified for Remediation / Attention */}
          <div className="instructor-panel-card">
            <h3>
              <AlertTriangle size={18} color="#e11d48" /> Learners Identified for Support & Remediation
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 16px 0" }}>
              Students identified by pedagogical algorithm based on slow pacing or scores below passing threshold.
            </p>

            {(!data?.learnersBehind || data.learnersBehind.length === 0) ? (
              <div className="instructor-empty-state" style={{ padding: "20px" }}>
                <p>All learners are progressing within expected performance thresholds.</p>
              </div>
            ) : (
              <div className="instructor-table-container">
                <table className="instructor-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Completed Lessons</th>
                      <th>Average Score</th>
                      <th>Diagnostic Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.learnersBehind.map((lb) => (
                      <tr key={lb.id}>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{lb.name}</td>
                        <td style={{ color: "var(--text-muted)" }}>{lb.email}</td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {lb.completedLessons} / 31
                        </td>
                        <td style={{ fontWeight: 700, color: lb.averageScore >= 60 ? "#d97706" : "#e11d48" }}>
                          {lb.averageScore > 0 ? `${lb.averageScore}%` : "No attempts"}
                        </td>
                        <td style={{ color: "#e11d48", fontWeight: 500 }}>{lb.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
