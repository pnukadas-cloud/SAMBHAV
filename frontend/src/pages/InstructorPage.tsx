import React, { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { useToast } from "../context/ToastContext";
import { useLocation, useNavigate } from "../router/Router";
import { fetchInstructorCurriculum, fetchInstructorDashboard } from "../api/client";
import { InstructorDashboardView } from "../features/instructor/InstructorDashboardView";
import { CurriculumManagerView } from "../features/instructor/CurriculumManagerView";
import { LessonBuilderView } from "../features/instructor/LessonBuilderView";
import { ClassManagerView } from "../features/instructor/ClassManagerView";
import { LearnerManagerView } from "../features/instructor/LearnerManagerView";
import { AssessmentManagerView } from "../features/instructor/AssessmentManagerView";
import { LabAssignmentManagerView } from "../features/instructor/LabAssignmentManagerView";
import { InstructorAnalyticsView } from "../features/instructor/InstructorAnalyticsView";
import { AIEducatorCopilotView } from "../features/instructor/AIEducatorCopilotView";
import { StudentPreviewModal } from "../features/instructor/StudentPreviewModal";

export type InstructorViewKey =
  | "dashboard"
  | "curriculum"
  | "authoring"
  | "classes"
  | "learners"
  | "assessments"
  | "labs"
  | "analytics"
  | "copilot";

interface InstructorPageProps {
  activeTab?: InstructorViewKey;
}

export function InstructorPage({ activeTab }: InstructorPageProps) {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Lesson Authoring & Preview State
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [defaultModuleId, setDefaultModuleId] = useState<string>("module-0");
  const [previewLesson, setPreviewLesson] = useState<any | null>(null);

  // Derive current view from prop or URL pathname
  function getViewFromPath(pathname: string): InstructorViewKey {
    if (activeTab) return activeTab;
    if (pathname.includes("/instructor/curriculum") || pathname.includes("/instructor/courses")) return "curriculum";
    if (pathname.includes("/instructor/authoring")) return "authoring";
    if (pathname.includes("/instructor/classes")) return "classes";
    if (pathname.includes("/instructor/learners") || pathname.includes("/instructor/students")) return "learners";
    if (pathname.includes("/instructor/assessments") || pathname.includes("/instructor/challenges")) return "assessments";
    if (pathname.includes("/instructor/labs")) return "labs";
    if (pathname.includes("/instructor/analytics")) return "analytics";
    if (pathname.includes("/instructor/ai-copilot")) return "copilot";
    return "dashboard";
  }

  const currentView = getViewFromPath(location.pathname);

  function loadDashboardAndCurriculum() {
    setIsLoading(true);
    setFetchError(null);
    Promise.all([fetchInstructorDashboard(), fetchInstructorCurriculum()])
      .then(([dashData, currData]) => {
        if (dashData) setMetrics(dashData);
        if (currData) setCurriculum(currData);
      })
      .catch((err) => {
        const msg = err?.message || "Unable to load educator data. Please ensure backend is running.";
        setFetchError(msg);
        showToast(msg, "error", "Connection Error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    loadDashboardAndCurriculum();
  }, []);

  // Handlers for switching to Lesson Builder
  const handleOpenCreateLesson = (moduleId = "module-0") => {
    setDefaultModuleId(moduleId);
    setEditingLessonId(null);
    navigate("/instructor/authoring");
  };

  const handleEditLesson = (lessonId: string) => {
    setEditingLessonId(lessonId);
    navigate("/instructor/authoring");
  };

  const handleLessonSaved = () => {
    loadDashboardAndCurriculum();
    navigate("/instructor/curriculum");
    showToast("Lesson saved successfully!", "success");
  };

  const handleImportAIToBuilder = (_content: string, topic: string) => {
    setEditingLessonId(null);
    setDefaultModuleId("module-0");
    navigate("/instructor/authoring");
    showToast(`Imported AI draft on "${topic}" to Lesson Builder. Review and edit before publishing!`, "info");
  };

  // Get Page Title for Breadcrumbs
  const pageTitles: Record<InstructorViewKey, string> = {
    dashboard: "Educator Dashboard",
    curriculum: "Curriculum Manager",
    authoring: "Lesson Builder",
    classes: "Classes & Cohorts",
    learners: "Learners Directory",
    assessments: "Assessments & Quizzes",
    labs: "Quantum Lab Experiments",
    analytics: "Cohort Analytics",
    copilot: "AI Educator Copilot",
  };

  return (
    <AppShell
      activeTitle={pageTitles[currentView] || "Educator Workspace"}
      activeCategory="Teaching"
    >
      <div className="instructor-content-area" style={{ width: "100%", maxWidth: "1400px", margin: "0 auto", padding: "0" }}>
        {/* Error State with Single Retry Button */}
        {fetchError && !metrics && (
          <div
            style={{
              padding: "24px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: "12px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div>
              <h4 style={{ margin: "0 0 4px 0", color: "#e11d48", fontSize: "15px", fontWeight: 700 }}>
                Unable to load educator data
              </h4>
              <p style={{ margin: 0, color: "#881337", fontSize: "13px" }}>
                {fetchError}
              </p>
            </div>
            <button
              onClick={loadDashboardAndCurriculum}
              style={{
                padding: "8px 18px",
                background: "#e11d48",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* View Router */}
        {currentView === "dashboard" && (
          <InstructorDashboardView
            metrics={metrics}
            onNavigateTab={(tab) => {
              if (tab === "authoring") handleOpenCreateLesson();
              else if (tab === "curriculum") navigate("/instructor/curriculum");
              else if (tab === "classes") navigate("/instructor/classes");
              else if (tab === "learners") navigate("/instructor/learners");
              else if (tab === "assessments") navigate("/instructor/assessments");
              else if (tab === "labs") navigate("/instructor/labs");
              else if (tab === "analytics") navigate("/instructor/analytics");
              else if (tab === "copilot") navigate("/instructor/ai-copilot");
            }}
            onOpenCreateLesson={() => handleOpenCreateLesson("module-0")}
            onOpenCreateClass={() => navigate("/instructor/classes")}
            onOpenCreateLab={() => navigate("/instructor/labs")}
            onOpenCreateAssessment={() => navigate("/instructor/assessments")}
          />
        )}

        {currentView === "curriculum" && (
          <CurriculumManagerView
            curriculum={curriculum}
            onRefreshCurriculum={loadDashboardAndCurriculum}
            onOpenCreateLessonForModule={(modId) => handleOpenCreateLesson(modId)}
            onEditLesson={handleEditLesson}
            onPreviewLesson={(lesson) => setPreviewLesson(lesson)}
          />
        )}

        {currentView === "authoring" && (
          <LessonBuilderView
            editingLessonId={editingLessonId}
            defaultModuleId={defaultModuleId}
            onSaved={handleLessonSaved}
            onCancel={() => navigate("/instructor/curriculum")}
            onLaunchPreview={(lesson) => setPreviewLesson(lesson)}
          />
        )}

        {currentView === "classes" && <ClassManagerView />}

        {currentView === "learners" && <LearnerManagerView />}

        {currentView === "assessments" && <AssessmentManagerView />}

        {currentView === "labs" && <LabAssignmentManagerView />}

        {currentView === "analytics" && <InstructorAnalyticsView />}

        {currentView === "copilot" && (
          <AIEducatorCopilotView onImportToLessonBuilder={handleImportAIToBuilder} />
        )}
      </div>

      {/* Interactive Read-Only Student Preview Modal */}
      {previewLesson && (
        <StudentPreviewModal
          lesson={previewLesson}
          onClose={() => setPreviewLesson(null)}
        />
      )}
    </AppShell>
  );
}
