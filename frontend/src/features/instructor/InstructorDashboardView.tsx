import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  FilePlus,
  GraduationCap,
  Layers,
  Lightbulb,
  Plus,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import React from "react";
import type { InstructorTab } from "./InstructorNav";

interface InstructorDashboardViewProps {
  metrics: any;
  onNavigateTab: (tab: InstructorTab) => void;
  onOpenCreateLesson: () => void;
  onOpenCreateClass: () => void;
  onOpenCreateLab: () => void;
  onOpenCreateAssessment: () => void;
}

export function InstructorDashboardView({
  metrics,
  onNavigateTab,
  onOpenCreateLesson,
  onOpenCreateClass,
  onOpenCreateLab,
  onOpenCreateAssessment,
}: InstructorDashboardViewProps) {
  const totalLearners = metrics?.totalLearners ?? 0;
  const activeLearners = metrics?.activeLearners ?? 0;
  const classesCount = metrics?.classesCount ?? 0;
  const publishedContent = metrics?.publishedContent ?? 0;
  const pendingSubmissions = metrics?.pendingSubmissions ?? 0;
  const averageProgress = metrics?.averageProgress ?? 0;
  const averageScore = metrics?.averageScore ?? 0;
  const recentActivity = Array.isArray(metrics?.recentActivity) ? metrics.recentActivity : [];
  const teachingInsights = Array.isArray(metrics?.teachingInsights) ? metrics.teachingInsights : [];
  const classes = Array.isArray(metrics?.classes) ? metrics.classes : [];

  return (
    <div>
      {/* Header Banner */}
      <div className="instructor-header-banner">
        <div className="instructor-header-titles">
          <h1>Educator Dashboard</h1>
          <p>Real-time overview of your quantum cohorts, learner mastery, and curriculum authoring.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" className="instructor-btn-secondary" onClick={() => onNavigateTab("copilot")}>
            <Sparkles size={16} style={{ color: "#38bdf8" }} />
            AI Copilot
          </button>
          <button type="button" className="instructor-btn-primary" onClick={onOpenCreateLesson}>
            <Plus size={16} />
            Create Lesson
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="instructor-kpi-grid">
        <div className="instructor-kpi-card">
          <span className="kpi-label">
            <Users size={14} style={{ color: "#38bdf8" }} /> Total Learners
          </span>
          <span className="kpi-value">{totalLearners}</span>
          <span className="kpi-subtext">{activeLearners} active in simulations/quizzes</span>
        </div>

        <div className="instructor-kpi-card">
          <span className="kpi-label">
            <GraduationCap size={14} style={{ color: "#a855f7" }} /> Classes / Cohorts
          </span>
          <span className="kpi-value">{classesCount}</span>
          <span className="kpi-subtext">{classesCount > 0 ? "Active student cohorts" : "No cohorts created yet"}</span>
        </div>

        <div className="instructor-kpi-card">
          <span className="kpi-label">
            <Layers size={14} style={{ color: "#22c55e" }} /> Published Lessons
          </span>
          <span className="kpi-value">{publishedContent}</span>
          <span className="kpi-subtext">Unified 10-module curriculum</span>
        </div>

        <div className="instructor-kpi-card">
          <span className="kpi-label">
            <TrendingUp size={14} style={{ color: "#f59e0b" }} /> Average Progress
          </span>
          <span className="kpi-value">{averageProgress}%</span>
          <span className="kpi-subtext">Across enrolled learners</span>
        </div>

        <div className="instructor-kpi-card">
          <span className="kpi-label">
            <Trophy size={14} style={{ color: "#ec4899" }} /> Assessment Average
          </span>
          <span className="kpi-value">{averageScore > 0 ? `${averageScore}%` : "No data yet"}</span>
          <span className="kpi-subtext">{pendingSubmissions} pending grading</span>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="instructor-panel-card" style={{ padding: "16px 24px", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Quick Actions:
          </span>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="button" className="instructor-btn-secondary" onClick={onOpenCreateClass} style={{ fontSize: "12px", padding: "7px 12px" }}>
              <GraduationCap size={14} /> Create Cohort
            </button>
            <button type="button" className="instructor-btn-secondary" onClick={onOpenCreateLab} style={{ fontSize: "12px", padding: "7px 12px" }}>
              <BrainCircuit size={14} /> New Lab Assignment
            </button>
            <button type="button" className="instructor-btn-secondary" onClick={onOpenCreateAssessment} style={{ fontSize: "12px", padding: "7px 12px" }}>
              <Trophy size={14} /> Create Assessment
            </button>
            <button type="button" className="instructor-btn-secondary" onClick={() => onNavigateTab("learners")} style={{ fontSize: "12px", padding: "7px 12px" }}>
              <Users size={14} /> View Learners
            </button>
            <button type="button" className="instructor-btn-secondary" onClick={() => onNavigateTab("analytics")} style={{ fontSize: "12px", padding: "7px 12px" }}>
              <BarChart3 size={14} /> View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Activity & Teaching Insights */}
      <div className="instructor-grid-two-col">
        {/* Left Column: Recent Activity */}
        <div className="instructor-panel-card">
          <h3>
            <Clock size={18} style={{ color: "var(--accent-cyan)" }} />
            Recent Learner Activity
          </h3>
          {recentActivity.length === 0 ? (
            <div className="instructor-empty-state">
              <Clock size={32} />
              <p>No learner activity recorded yet. When learners complete lessons, quizzes, or lab simulations, events will appear here in real time.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recentActivity.map((act: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "var(--accent-cyan-glow)",
                        color: "var(--accent-cyan)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "12px",
                      }}
                    >
                      {act.student?.charAt(0) || "L"}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{act.student}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{act.action}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{act.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Teaching Insights */}
        <div className="instructor-panel-card">
          <h3>
            <Lightbulb size={18} style={{ color: "var(--accent-amber)" }} />
            Teaching Insights
          </h3>
          {teachingInsights.length === 0 ? (
            <div className="instructor-empty-state">
              <CheckCircle2 size={32} style={{ color: "#22c55e" }} />
              <p>No common error patterns detected yet. As students submit assessments, areas requiring review will be automatically highlighted.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {teachingInsights.map((insight: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: "14px",
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#fbbf24" }}>{insight.concept}</span>
                    <span style={{ fontSize: "11px", color: "#f87171", fontWeight: 600 }}>{insight.frequency}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>{insight.tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cohorts Overview Table */}
      <div className="instructor-panel-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0 }}>
            <GraduationCap size={18} style={{ color: "var(--accent-purple)" }} />
            Active Cohorts & Classes
          </h3>
          <button type="button" className="instructor-btn-secondary" onClick={() => onNavigateTab("classes")} style={{ fontSize: "12px", padding: "6px 12px" }}>
            Manage All Cohorts
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="instructor-empty-state">
            <GraduationCap size={32} />
            <p>You haven't created any classes or cohorts yet.</p>
            <button type="button" className="instructor-btn-primary" onClick={onOpenCreateClass} style={{ marginTop: "8px" }}>
              <Plus size={14} /> Create First Cohort
            </button>
          </div>
        ) : (
          <div className="instructor-table-container">
            <table className="instructor-table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Enrollment Code</th>
                  <th>Enrolled Learners</th>
                  <th>Assignments</th>
                  <th>Avg Progress</th>
                  <th>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls: any) => (
                  <tr key={cls.id}>
                    <td>
                      <strong style={{ color: "var(--text-primary)" }}>{cls.name}</strong>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{cls.description || "No description"}</div>
                    </td>
                    <td>
                      <code style={{ background: "var(--bg-subtle)", padding: "3px 6px", borderRadius: "4px", color: "var(--accent-cyan)", border: "1px solid var(--border-subtle)" }}>
                        {cls.enrollment_code}
                      </code>
                    </td>
                    <td>{cls.enrolled_count ?? 0} students</td>
                    <td>{cls.assignment_count ?? 0} active</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "6px", background: "var(--bg-track)", borderRadius: "3px", overflow: "hidden", minWidth: "60px" }}>
                          <div style={{ height: "100%", width: `${cls.averageProgress ?? 0}%`, background: "var(--accent-cyan)" }} />
                        </div>
                        <span style={{ fontSize: "11px" }}>{cls.averageProgress ?? 0}%</span>
                      </div>
                    </td>
                    <td>{cls.averageScore > 0 ? `${cls.averageScore}%` : "No submissions"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
