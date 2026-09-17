import {
  ArrowLeft,
  ArrowRight,
  Atom,
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "../router/Router";
import { AppShell } from "../components/layout/AppShell";
import { CircuitBuilder } from "../features/circuit-builder/CircuitBuilder";
import { ResultsPanel } from "../features/visualization/ResultsPanel";
import { TutorPanel } from "../features/ai-tutor/TutorPanel";
import { explainCircuitWithAI, getCompletedLessonsCache, recordLessonProgress, runSimulation } from "../api/client";
import { useToast } from "../context/ToastContext";
import { LESSONS_DATABASE, UNIFIED_CURRICULUM_MODULES, type LessonData } from "../data/lessonsData";
import type { AITutorResponse, CircuitIR, SimulationResult } from "../types";

export function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const lessonKey = lessonId || "complex-vectors";
  const lessonData: LessonData = LESSONS_DATABASE[lessonKey] || LESSONS_DATABASE["complex-vectors"] || LESSONS_DATABASE["qubit-basics"];

  // Compute canonical linear curriculum index
  const allLessons = UNIFIED_CURRICULUM_MODULES.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title }))
  );
  const currentIndex = allLessons.findIndex((l) => l.id === lessonData.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const [circuit, setCircuit] = useState<CircuitIR>(lessonData.initialCircuit);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [tutorResponse, setTutorResponse] = useState<AITutorResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isTutorLoading, setIsTutorLoading] = useState(false);

  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(() => getCompletedLessonsCache().has(lessonData.id));
  const [activeTab, setActiveTab] = useState<"theory" | "math" | "sandbox" | "quiz">("sandbox");

  // Sync initial circuit and state whenever lesson changes
  useEffect(() => {
    setCircuit(lessonData.initialCircuit);
    setResult(null);
    setTutorResponse(null);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setIsLessonCompleted(getCompletedLessonsCache().has(lessonData.id));
  }, [lessonId, lessonData.id]);

  async function handleSimulate() {
    setIsSimulating(true);
    try {
      const sim = await runSimulation(circuit);
      setResult(sim);
      showToast("Simulation updated with live quantum state!", "success");
    } catch {
      showToast("Simulation failed.", "error");
    } finally {
      setIsSimulating(false);
    }
  }

  async function handleAskTutor(question?: string) {
    setIsTutorLoading(true);
    try {
      let currentResult = result;
      if (!currentResult) {
        currentResult = await runSimulation(circuit);
        setResult(currentResult);
      }
      const resp = await explainCircuitWithAI({
        circuit,
        simulation_result: currentResult,
        question: question || null,
        lesson_context: {
          title: lessonData.title,
          objective: lessonData.objective,
        },
      });
      setTutorResponse(resp);
    } catch {
      showToast("AI explanation request failed.", "error");
    } finally {
      setIsTutorLoading(false);
    }
  }

  async function handleCompleteLesson() {
    setIsLessonCompleted(true);
    try {
      await recordLessonProgress(courseId || lessonData.moduleId || "quantum-foundations", lessonData.id, 100.0, 180);
      showToast(`Lesson Completed! +100 XP Earned!`, "success", "Achievement Unlocked");
    } catch {
      showToast(`Lesson Completed! +100 XP Earned!`, "success", "Achievement");
    }
  }

  const isQuizCorrect = selectedAnswer === lessonData.quiz.correctIndex;

  return (
    <AppShell activeTitle={lessonData.title} activeCategory={lessonData.moduleTitle}>
      <div className="lesson-page-container">
        {/* Top Breadcrumb Navigation */}
        <div className="lesson-nav-header">
          <div className="lesson-nav-left">
            <Link to="/learn" className="back-link">
              <ArrowLeft size={16} /> <span>Curriculum</span>
            </Link>
            <span className="nav-separator">/</span>
            <span className="course-breadcrumb">{lessonData.moduleTitle}</span>
            <span className="nav-separator">/</span>
            <span className="lesson-breadcrumb-title">{lessonData.title}</span>
          </div>

          <div className="lesson-nav-actions">
            {isLessonCompleted ? (
              <span className="badge-completed">
                <CheckCircle2 size={16} /> Completed
              </span>
            ) : (
              <button
                className="complete-lesson-btn"
                onClick={handleCompleteLesson}
                disabled={!quizSubmitted}
                title={!quizSubmitted ? "Complete the Knowledge Check first" : "Mark lesson as complete"}
              >
                <Award size={16} />
                <span>Complete Lesson (+100 XP)</span>
              </button>
            )}
          </div>
        </div>

        {/* Lesson Objective Banner */}
        <div className="lesson-objective-card">
          <div className="objective-icon-badge">
            <Sparkles size={20} className="text-teal" />
          </div>
          <div className="objective-text">
            <span className="objective-label">LEARNING OBJECTIVE</span>
            <p className="objective-content">{lessonData.objective}</p>
          </div>
        </div>

        {/* 2-Column Split: Left Interactive Content & Quiz, Right Circuit Sandbox & AI */}
        <div className="lesson-workspace-grid">
          {/* Left Column: Theory, Step-by-Step Math & Knowledge Check */}
          <div className="lesson-theory-pane">
            <div className="theory-tabs-bar">
              <button
                className={`theory-tab ${activeTab === "theory" ? "active" : ""}`}
                onClick={() => setActiveTab("theory")}
              >
                <BookOpen size={15} /> <span>Theory & Concepts</span>
              </button>
              <button
                className={`theory-tab ${activeTab === "math" ? "active" : ""}`}
                onClick={() => setActiveTab("math")}
              >
                <Atom size={15} /> <span>Math Derivations</span>
              </button>
              <button
                className={`theory-tab ${activeTab === "quiz" ? "active" : ""}`}
                onClick={() => setActiveTab("quiz")}
              >
                <HelpCircle size={15} /> <span>Knowledge Check</span>
              </button>
            </div>

            <div className="theory-body-content">
              {/* Theory Tab */}
              {(activeTab === "theory" || activeTab === "sandbox") && (
                <section className="theory-section">
                  <h3>1. Physical Concept</h3>
                  <p>{lessonData.theory.intro}</p>

                  <div className="key-takeaways-box">
                    <h4>Key Quantum Principles:</h4>
                    <ul>
                      {lessonData.theory.keyPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Math Derivations Tab */}
              {(activeTab === "math" || activeTab === "sandbox") && (
                <section className="math-section">
                  <h3>2. Mathematical Transformation Step-by-Step</h3>
                  {lessonData.theory.mathSteps.map((step) => (
                    <div key={step.step} className="math-step-card">
                      <span className="step-num">{step.step}: {step.label}</span>
                      <p>{step.explanation}</p>
                      <code>{step.math}</code>
                    </div>
                  ))}
                </section>
              )}

              {/* Knowledge Check Quiz Tab */}
              <section className="quiz-section">
                <div className="knowledge-check-card">
                  <div className="quiz-header">
                    <HelpCircle size={18} className="text-teal" />
                    <h4>Knowledge Check Quiz</h4>
                  </div>
                  <p className="quiz-prompt">{lessonData.quiz.prompt}</p>

                  <div className="quiz-options-list">
                    {lessonData.quiz.options.map((opt, idx) => (
                      <button
                        key={idx}
                        className={`quiz-option-item ${
                          selectedAnswer === idx ? "selected" : ""
                        } ${
                          quizSubmitted && idx === lessonData.quiz.correctIndex
                            ? "correct"
                            : ""
                        } ${
                          quizSubmitted &&
                          selectedAnswer === idx &&
                          idx !== lessonData.quiz.correctIndex
                            ? "incorrect"
                            : ""
                        }`}
                        onClick={() => !quizSubmitted && setSelectedAnswer(idx)}
                      >
                        <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                        <span className="option-text">{opt}</span>
                      </button>
                    ))}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      className="quiz-submit-btn"
                      onClick={() => selectedAnswer !== null && setQuizSubmitted(true)}
                      disabled={selectedAnswer === null}
                    >
                      Check Answer
                    </button>
                  ) : (
                    <div
                      className={`quiz-feedback-box ${
                        isQuizCorrect ? "correct" : "incorrect"
                      }`}
                    >
                      <strong>
                        {isQuizCorrect ? "✓ Correct!" : "✗ Review the concept:"}
                      </strong>
                      <p>{lessonData.quiz.explanation}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Mini-Challenge Card */}
              <section className="mini-challenge-section">
                <div className="mini-challenge-card">
                  <div className="challenge-header">
                    <Trophy size={18} className="text-amber" />
                    <h4>Hands-On Mini Challenge: {lessonData.miniChallenge.title}</h4>
                  </div>
                  <p className="challenge-desc">{lessonData.miniChallenge.instructions}</p>
                  <div className="challenge-goal">
                    <strong>Goal:</strong> {lessonData.miniChallenge.expectedGoal}
                  </div>
                </div>
              </section>

              {/* Linear Lesson Navigation Footer */}
              <div className="lesson-footer-nav" style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #d6e0d9" }}>
                {prevLesson ? (
                  <Link
                    to={`/learn/${prevLesson.moduleId}/${prevLesson.id}`}
                    className="lesson-nav-btn prev-btn"
                    style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#14342f", fontWeight: 600, fontSize: "0.88rem", padding: "10px 14px", background: "#ffffff", border: "1px solid #d6e0d9", borderRadius: "8px" }}
                  >
                    <ArrowLeft size={16} className="text-teal" />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Previous Lesson</div>
                      <div>{prevLesson.title}</div>
                    </div>
                  </Link>
                ) : <div />}

                {nextLesson ? (
                  <Link
                    to={`/learn/${nextLesson.moduleId}/${nextLesson.id}`}
                    className="lesson-nav-btn next-btn"
                    style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#ffffff", fontWeight: 600, fontSize: "0.88rem", padding: "10px 16px", background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)", borderRadius: "8px", marginLeft: "auto" }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>Next Lesson</div>
                      <div>{nextLesson.title}</div>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <Link
                    to="/progress"
                    className="lesson-nav-btn next-btn"
                    style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#ffffff", fontWeight: 600, fontSize: "0.88rem", padding: "10px 16px", background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)", borderRadius: "8px", marginLeft: "auto" }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>Curriculum Mastered!</div>
                      <div>View Progress & Badges</div>
                    </div>
                    <Trophy size={16} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Circuit Sandbox & AI Tutor */}
          <div className="lesson-sandbox-pane">
            <div className="sandbox-header">
              <div className="sandbox-title-group">
                <BrainCircuit size={18} className="text-teal" />
                <h4>Interactive Circuit Sandbox</h4>
              </div>
              <div className="sandbox-actions">
                <button
                  className="reset-btn"
                  onClick={() => {
                    setCircuit(lessonData.initialCircuit);
                    setResult(null);
                  }}
                  title="Reset to lesson starter circuit"
                >
                  <RotateCcw size={15} /> <span>Reset</span>
                </button>
                <button
                  className="run-btn"
                  onClick={handleSimulate}
                  disabled={isSimulating}
                >
                  <Play size={15} />
                  <span>{isSimulating ? "Simulating..." : "Run Simulation"}</span>
                </button>
              </div>
            </div>

            {/* Circuit Canvas */}
            <div className="sandbox-canvas-wrapper">
              <CircuitBuilder circuit={circuit} onChange={setCircuit} />
            </div>

            {/* Results Panel */}
            <div className="sandbox-results-wrapper">
              <ResultsPanel result={result} />
            </div>

            {/* AI Tutor Assistant Panel */}
            <div className="sandbox-tutor-wrapper">
              <TutorPanel
                response={tutorResponse}
                isLoading={isTutorLoading}
                onAskQuestion={(q) => handleAskTutor(q)}
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
