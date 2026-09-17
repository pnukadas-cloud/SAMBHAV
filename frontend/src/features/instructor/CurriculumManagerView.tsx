import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  Eye,
  FilePlus,
  Layers,
  Lock,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { deleteInstructorLessonApi, duplicateInstructorLessonApi, publishInstructorLessonApi } from "../../api/client";

interface CurriculumManagerViewProps {
  curriculum: any[];
  onRefreshCurriculum: () => void;
  onOpenCreateLessonForModule: (moduleId: string) => void;
  onEditLesson: (lessonId: string) => void;
  onPreviewLesson: (lesson: any) => void;
}

export function CurriculumManagerView({
  curriculum,
  onRefreshCurriculum,
  onOpenCreateLessonForModule,
  onEditLesson,
  onPreviewLesson,
}: CurriculumManagerViewProps) {
  const { showToast } = useToast();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(["module-0", "module-1", "module-2"])
  );
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const mainCourse = curriculum.find((c) => c.id === "quantum-foundations") || curriculum[0];
  const modules = mainCourse?.modules || [];

  function toggleModule(modId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) {
        next.delete(modId);
      } else {
        next.add(modId);
      }
      return next;
    });
  }

  async function handleDuplicateLesson(lessonId: string) {
    setIsProcessing(lessonId);
    try {
      await duplicateInstructorLessonApi(lessonId);
      showToast("Lesson duplicated as instructor draft copy!", "success");
      onRefreshCurriculum();
    } catch (err: any) {
      showToast(err.message || "Failed to duplicate lesson.", "error");
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleTogglePublish(lessonId: string, currentStatus: string) {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    setIsProcessing(lessonId);
    try {
      await publishInstructorLessonApi(lessonId, nextStatus);
      showToast(`Lesson ${nextStatus === "published" ? "published" : "moved to draft"} successfully!`, "success");
      onRefreshCurriculum();
    } catch (err: any) {
      showToast(err.message || "Failed to update publish status.", "error");
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleDeleteCustomLesson(lessonId: string) {
    if (!window.confirm("Are you sure you want to delete this custom lesson? This action cannot be undone.")) {
      return;
    }
    setIsProcessing(lessonId);
    try {
      await deleteInstructorLessonApi(lessonId);
      showToast("Custom lesson deleted successfully.", "success");
      onRefreshCurriculum();
    } catch (err: any) {
      showToast(err.message || "Failed to delete lesson.", "error");
    } finally {
      setIsProcessing(null);
    }
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="instructor-header-banner">
        <div className="instructor-header-titles">
          <h1>Curriculum & Content Management</h1>
          <p>
            Manage SAMBHAV's unified 10-module quantum curriculum. Canonical system lessons are protected; custom instructor lessons can be drafted, customized, and published.
          </p>
        </div>
        <button
          type="button"
          className="instructor-btn-primary"
          onClick={() => onOpenCreateLessonForModule(modules[0]?.id || "module-0")}
        >
          <Plus size={16} />
          Create Custom Lesson
        </button>
      </div>

      {/* Modules List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {modules.map((mod: any, index: number) => {
          const isExpanded = expandedModules.has(mod.id);
          const lessonsList = Array.isArray(mod.lessons) ? mod.lessons : [];

          return (
            <div
              key={mod.id}
              className="instructor-panel-card"
              style={{ padding: "0", overflow: "hidden", marginBottom: "0" }}
            >
              {/* Module Header Bar */}
              <div
                onClick={() => toggleModule(mod.id)}
                style={{
                  padding: "16px 20px",
                  background: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  borderBottom: isExpanded ? "1px solid #334155" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {isExpanded ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronRight size={18} color="#94a3b8" />}
                  <span
                    style={{
                      background: "rgba(14, 165, 233, 0.15)",
                      color: "#38bdf8",
                      fontWeight: 700,
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    MODULE {index}
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>{mod.title}</span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>({lessonsList.length} lessons)</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="instructor-btn-secondary"
                    onClick={() => onOpenCreateLessonForModule(mod.id)}
                    style={{ fontSize: "11px", padding: "5px 10px" }}
                  >
                    <Plus size={12} /> Add Lesson to Mod {index}
                  </button>
                </div>
              </div>

              {/* Lessons Table when expanded */}
              {isExpanded && (
                <div style={{ padding: "12px 20px" }}>
                  {lessonsList.length === 0 ? (
                    <div className="instructor-empty-state" style={{ padding: "24px" }}>
                      <FilePlus size={24} />
                      <p style={{ fontSize: "13px" }}>No lessons authored for this module yet.</p>
                      <button
                        type="button"
                        className="instructor-btn-primary"
                        onClick={() => onOpenCreateLessonForModule(mod.id)}
                        style={{ fontSize: "12px", padding: "6px 12px" }}
                      >
                        <Plus size={12} /> Author Lesson
                      </button>
                    </div>
                  ) : (
                    <div className="instructor-table-container">
                      <table className="instructor-table">
                        <thead>
                          <tr>
                            <th>Lesson Title</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Difficulty</th>
                            <th>Est. Time</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lessonsList.map((lesson: any) => {
                            const isCanonical = lesson.isCanonical || lesson.is_canonical;
                            const isPublished = lesson.status === "published" || isCanonical;

                            return (
                              <tr key={lesson.id}>
                                <td>
                                  <strong style={{ color: "#f8fafc" }}>{lesson.title}</strong>
                                  {lesson.description && (
                                    <div style={{ fontSize: "11px", color: "#64748b" }}>{lesson.description}</div>
                                  )}
                                </td>
                                <td>
                                  {isCanonical ? (
                                    <span className="instructor-tag canonical" title="Protected Canonical Curriculum Lesson">
                                      <Lock size={10} /> Canonical
                                    </span>
                                  ) : (
                                    <span className="instructor-tag custom">Custom</span>
                                  )}
                                </td>
                                <td>
                                  {isPublished ? (
                                    <span className="instructor-tag published">
                                      <CheckCircle2 size={10} /> Published
                                    </span>
                                  ) : (
                                    <span className="instructor-tag draft">Draft</span>
                                  )}
                                </td>
                                <td>{lesson.difficulty || "Beginner"}</td>
                                <td>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                                    <Clock size={12} color="#94a3b8" />
                                    {lesson.estimated_minutes ? `${lesson.estimated_minutes} mins` : "15 mins"}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                    <button
                                      type="button"
                                      className="instructor-btn-secondary"
                                      onClick={() => onPreviewLesson(lesson)}
                                      title="Preview as student"
                                      style={{ fontSize: "11px", padding: "4px 8px" }}
                                    >
                                      <Eye size={12} /> Preview
                                    </button>

                                    {isCanonical ? (
                                      <button
                                        type="button"
                                        className="instructor-btn-secondary"
                                        onClick={() => handleDuplicateLesson(lesson.id)}
                                        disabled={isProcessing === lesson.id}
                                        title="Duplicate as customizable instructor draft"
                                        style={{ fontSize: "11px", padding: "4px 8px" }}
                                      >
                                        <Copy size={12} /> Customize Copy
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className="instructor-btn-secondary"
                                          onClick={() => onEditLesson(lesson.id)}
                                          style={{ fontSize: "11px", padding: "4px 8px" }}
                                        >
                                          <Edit3 size={12} /> Edit
                                        </button>
                                        <button
                                          type="button"
                                          className="instructor-btn-secondary"
                                          onClick={() => handleTogglePublish(lesson.id, lesson.status)}
                                          disabled={isProcessing === lesson.id}
                                          style={{ fontSize: "11px", padding: "4px 8px" }}
                                        >
                                          {lesson.status === "published" ? "Unpublish" : "Publish"}
                                        </button>
                                        <button
                                          type="button"
                                          className="instructor-btn-danger"
                                          onClick={() => handleDeleteCustomLesson(lesson.id)}
                                          disabled={isProcessing === lesson.id}
                                          style={{ fontSize: "11px", padding: "4px 8px" }}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
