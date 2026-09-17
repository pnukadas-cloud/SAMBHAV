import React, { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { useToast } from "../context/ToastContext";
import { fetchInstructorCurriculum, fetchInstructorDashboard } from "../api/client";
import { InstructorNav, type InstructorTab } from "../features/instructor/InstructorNav";
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

export function InstructorPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<InstructorTab>("dashboard");
  const [metrics, setMetrics] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lesson Authoring & Preview State
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [defaultModuleId, setDefaultModuleId] = useState<string>("module-0");
  const [previewLesson, setPreviewLesson] = useState<any | null>(null);

  function loadDashboardAndCurriculum() {
    setIsLoading(true);
    Promise.all([fetchInstructorDashboard(), fetchInstructorCurriculum()])
      .then(([dashData, currData]) => {
        if (dashData) setMetrics(dashData);
        if (currData) setCurriculum(currData);
      })
      .catch((err) => {
        console.error("Error loading instructor workspace:", err);
        showToast("Error loading educator data. Check backend connection.", "error");
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
    setActiveTab("authoring");
  };

  const handleEditLesson = (lessonId: string) => {
    setEditingLessonId(lessonId);
    setActiveTab("authoring");
  };

  const handleLessonSaved = () => {
    loadDashboardAndCurriculum();
    setActiveTab("curriculum");
    showToast("Lesson saved successfully!", "success");
  };

  const handleImportAIToBuilder = (content: string, topic: string) => {
    setEditingLessonId(null);
    setDefaultModuleId("module-0");
    setActiveTab("authoring");
    showToast(`Imported AI draft on "${topic}" to Lesson Builder. Review and edit before publishing!`, "info");
  };

  return (
    <AppShell activeTitle="Instructor & Educator Platform" activeCategory="Teaching">
      <div className="instructor-layout-container">
        {/* Left Navigation Sidebar */}
        <aside className="instructor-sidebar-wrapper">
          <InstructorNav
            activeTab={activeTab}
            onSelectTab={(tab) => {
              if (tab !== "authoring" && activeTab === "authoring") {
                setEditingLessonId(null);
              }
              setActiveTab(tab);
            }}
            pendingSubmissionsCount={metrics?.pendingSubmissions || 0}
          />
        </aside>

        {/* Main Workspace Area */}
        <main className="instructor-main-content">
          {isLoading && !metrics ? (
            <div className="instructor-loading-state">
              <div className="inline-block w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p>Loading SAMBHAV Educator Workspace...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Dashboard */}
              {activeTab === "dashboard" && (
                <InstructorDashboardView
                  metrics={metrics}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onOpenCreateLesson={() => handleOpenCreateLesson("module-0")}
                  onOpenCreateClass={() => setActiveTab("classes")}
                  onOpenCreateLab={() => setActiveTab("labs")}
                  onOpenCreateAssessment={() => setActiveTab("assessments")}
                />
              )}

              {/* Tab 2: Curriculum Management */}
              {activeTab === "curriculum" && (
                <CurriculumManagerView
                  curriculum={curriculum}
                  onRefreshCurriculum={loadDashboardAndCurriculum}
                  onOpenCreateLessonForModule={(modId) => handleOpenCreateLesson(modId)}
                  onEditLesson={handleEditLesson}
                  onPreviewLesson={(lesson) => setPreviewLesson(lesson)}
                />
              )}

              {/* Tab 3: Lesson Builder */}
              {activeTab === "authoring" && (
                <LessonBuilderView
                  editingLessonId={editingLessonId}
                  defaultModuleId={defaultModuleId}
                  onSaved={handleLessonSaved}
                  onCancel={() => setActiveTab("curriculum")}
                  onLaunchPreview={(lesson) => setPreviewLesson(lesson)}
                />
              )}

              {/* Tab 4: Classes & Cohorts */}
              {activeTab === "classes" && <ClassManagerView />}

              {/* Tab 5: Learners Directory */}
              {activeTab === "learners" && <LearnerManagerView />}

              {/* Tab 6: Assessments */}
              {activeTab === "assessments" && <AssessmentManagerView />}

              {/* Tab 7: Lab Assignments */}
              {activeTab === "labs" && <LabAssignmentManagerView />}

              {/* Tab 8: Real Analytics */}
              {activeTab === "analytics" && <InstructorAnalyticsView />}

              {/* Tab 9: AI Educator Copilot */}
              {activeTab === "copilot" && (
                <AIEducatorCopilotView onImportToLessonBuilder={handleImportAIToBuilder} />
              )}
            </>
          )}
        </main>
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
