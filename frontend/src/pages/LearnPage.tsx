import {
  ArrowRight,
  Atom,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Cpu,
  GraduationCap,
  Layers,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "../router/Router";
import { AppShell } from "../components/layout/AppShell";
import { UNIFIED_CURRICULUM_MODULES, CurriculumModule } from "../data/lessonsData";
import { fetchProgress } from "../api/client";

export function LearnPage() {
  const navigate = useNavigate();
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set(["qubit-basics", "superposition"]));
  const [activeLessonId, setActiveLessonId] = useState<string>("bell-state");
  const [progressData, setProgressData] = useState<any>(null);

  useEffect(() => {
    fetchProgress()
      .then((data) => {
        if (data) {
          setProgressData(data);
          const completedSet = new Set<string>();
          if (data.records && Array.isArray(data.records)) {
            data.records.forEach((r: any) => {
              if (r.status === "completed" && r.lesson_id) {
                completedSet.add(r.lesson_id);
              }
            });
          }
          if (completedSet.size > 0) {
            setCompletedLessonIds(completedSet);
          }
        }
      })
      .catch(() => {});
  }, []);

  const totalModules = UNIFIED_CURRICULUM_MODULES.length; // 10
  const totalLessons = UNIFIED_CURRICULUM_MODULES.reduce((sum, m) => sum + m.lessons.length, 0); // 33
  const completedCount = completedLessonIds.size;
  const overallProgressPct = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  function getModuleProgress(mod: CurriculumModule): number {
    const modTotal = mod.lessons.length;
    if (modTotal === 0) return 0;
    const modCompleted = mod.lessons.filter((l) => completedLessonIds.has(l.id)).length;
    return Math.round((modCompleted / modTotal) * 100);
  }

  return (
    <AppShell activeTitle="SAMBHAV Curriculum" activeCategory="Learning">
      <div className="learn-page-container">
        {/* Header Hero Banner */}
        <div className="learn-header-banner">
          <div className="learn-header-text">
            <span className="learn-eyebrow">UNIFIED QUANTUM JOURNEY</span>
            <h2>SAMBHAV Canonical Quantum Curriculum</h2>
            <p>
              Master quantum computing progressively from mathematical foundations to algorithms, information theory, error correction, real-world hardware and research.
            </p>
          </div>
          <div className="learn-header-stats">
            <div className="stat-pill">
              <strong>{totalModules}</strong> Modules (0–9)
            </div>
            <div className="stat-pill">
              <strong>{totalLessons}</strong> Interactive Lessons
            </div>
            <div className="stat-pill">
              <strong>{completedCount}</strong> Completed ({overallProgressPct}%)
            </div>
          </div>
        </div>

        {/* 10 Modules List Stack */}
        <div className="courses-list-stack">
          {UNIFIED_CURRICULUM_MODULES.map((mod) => {
            const modProgress = getModuleProgress(mod);
            return (
              <div key={mod.id} className="course-card-expanded">
                {/* Module Header */}
                <div className="course-card-header">
                  <div className="course-header-left">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span className="module-index-badge">
                        MODULE {mod.moduleNumber}
                      </span>
                      <span className={`difficulty-badge ${mod.difficulty.toLowerCase()}`}>
                        {mod.difficulty}
                      </span>
                      {mod.hasLab && (
                        <span className="pill-badge-indicator" title="Connected to Quantum Lab IDE">
                          <BrainCircuit size={12} /> Quantum Lab
                        </span>
                      )}
                      {mod.hasAssessment && (
                        <span className="pill-badge-indicator assessment" title="Includes Knowledge Checks & Challenges">
                          <Trophy size={12} /> Assessment
                        </span>
                      )}
                    </div>
                    <h3>{mod.title}</h3>
                    <p className="course-subtitle">{mod.tagline}</p>

                    {/* Prerequisites and info */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "10px", fontSize: "12px", color: "#94a3b8" }}>
                      <span><strong>Prerequisites:</strong> {mod.prerequisites}</span>
                      <span><strong>Est. Time:</strong> {mod.estimatedHours}</span>
                      <span><strong>Lessons:</strong> {mod.lessons.length}</span>
                    </div>
                  </div>

                  <div className="course-header-right">
                    <div className="course-progress-ring">
                      <span className="prog-val">{modProgress}%</span>
                      <span className="prog-lbl">Completed</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="course-prog-track">
                  <div className="track-fill" style={{ width: `${modProgress}%` }} />
                </div>

                {/* Topics Preview Row */}
                <div className="module-topics-preview-row">
                  <span className="topics-label">Core Concepts:</span>
                  <div className="topics-chips-list">
                    {mod.topics.slice(0, 7).map((t, idx) => (
                      <span key={idx} className="topic-chip">{t}</span>
                    ))}
                    {mod.topics.length > 7 && (
                      <span className="topic-chip more">+{mod.topics.length - 7} more</span>
                    )}
                  </div>
                </div>

                {/* Lessons List Grid */}
                <div className="course-modules-list">
                  <div className="module-group">
                    <h4 className="module-title">Interactive Lessons & Labs</h4>
                    <div className="lessons-grid">
                      {mod.lessons.map((lesson) => {
                        const isCompleted = completedLessonIds.has(lesson.id);
                        const isCurrent = activeLessonId === lesson.id && !isCompleted;

                        return (
                          <div
                            key={lesson.id}
                            className={`lesson-card-item ${isCompleted ? "completed" : ""} ${
                              isCurrent ? "current" : ""
                            }`}
                            onClick={() => navigate(`/learn/${mod.id}/${lesson.id}`)}
                          >
                            <div className="lesson-item-left">
                              {isCompleted ? (
                                <CheckCircle2 size={18} className="text-teal" />
                              ) : isCurrent ? (
                                <Play size={18} className="text-amber" />
                              ) : (
                                <BookOpen size={18} className="text-muted" />
                              )}
                              <div className="lesson-item-text">
                                <span className="lesson-item-title">{lesson.title}</span>
                                <span className="lesson-item-dur">
                                  <Clock size={12} /> {lesson.duration} • {lesson.difficulty}
                                </span>
                              </div>
                            </div>

                            <div className="lesson-item-right">
                              {isCompleted && <span className="status-tag completed">Completed</span>}
                              {isCurrent && <span className="status-tag current">Resume</span>}
                              {!isCompleted && !isCurrent && (
                                <span className="status-tag start">Start Lesson</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
