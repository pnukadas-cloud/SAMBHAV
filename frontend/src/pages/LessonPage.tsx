import {
  ArrowLeft,
  ArrowRight,
  Atom,
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "../router/Router";
import { AppShell } from "../components/layout/AppShell";
import { CircuitBuilder } from "../features/circuit-builder/CircuitBuilder";
import { ResultsPanel } from "../features/visualization/ResultsPanel";
import { TutorPanel } from "../features/ai-tutor/TutorPanel";
import { explainCircuitWithAI, runSimulation } from "../api/client";
import { useToast } from "../context/ToastContext";
import type { AITutorResponse, CircuitIR, SimulationResult } from "../types";

const defaultLessonCircuit: CircuitIR = {
  qubits: 2,
  classicalBits: 2,
  operations: [
    { gate: "h", targets: [0] },
    { gate: "cx", controls: [0], targets: [1] },
    { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
  ],
};

export function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [circuit, setCircuit] = useState<CircuitIR>(defaultLessonCircuit);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [tutorResponse, setTutorResponse] = useState<AITutorResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isTutorLoading, setIsTutorLoading] = useState(false);

  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);

  const quizQuestion = {
    prompt: "Why does the Bell circuit produce only |00⟩ and |11⟩ outcomes with 50% probability each?",
    options: [
      "Because the CX gate destroys the |01⟩ and |10⟩ states through wave collapse.",
      "Because the H gate creates superposition on q0, and CX conditionally flips q1 only when q0 is |1⟩.",
      "Because quantum computers can only output states with equal bit values.",
      "Because measurement always forces all qubits to match the first qubit.",
    ],
    correctIndex: 1,
    explanation:
      "Correct! The Hadamard gate puts q0 into (|0⟩+|1⟩)/√2. The CX gate maps |0⟩⊗|0⟩ → |00⟩ and |1⟩⊗|0⟩ → |11⟩, producing the entangled state (|00⟩+|11⟩)/√2.",
  };

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
          title: "Building a Bell State (|Φ⁺⟩)",
          objective: "Understand how Hadamard and CX gates create non-separable quantum correlation.",
        },
      });
      setTutorResponse(resp);
    } catch {
      showToast("AI explanation request failed.", "error");
    } finally {
      setIsTutorLoading(false);
    }
  }

  function handleCompleteLesson() {
    setIsLessonCompleted(true);
    showToast("🎉 Lesson Completed! +50 XP Earned", "success", "Achievement");
  }

  return (
    <AppShell activeTitle="Lesson 2.1: Building a Bell State" activeCategory="Curriculum">
      <div className="lesson-page-container">
        {/* Top Breadcrumb Nav */}
        <div className="lesson-nav-bar">
          <Link to="/learn" className="lesson-back-link">
            <ArrowLeft size={16} /> Back to Curriculum
          </Link>
          <div className="lesson-nav-actions">
            <button
              className={`lesson-complete-btn ${isLessonCompleted ? "completed" : ""}`}
              onClick={handleCompleteLesson}
            >
              <CheckCircle2 size={16} />
              <span>{isLessonCompleted ? "Lesson Completed (+50 XP)" : "Mark Lesson Complete"}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: Theory Left, Interactive Lab & AI Right */}
        <div className="lesson-split-grid">
          {/* Left Theory Column */}
          <div className="lesson-theory-pane">
            <div className="theory-header">
              <span className="lesson-tag">Module 2 • Lesson 1</span>
              <h2>Building a Bell State (|Φ⁺⟩)</h2>
              <div className="objective-box">
                <strong>🎯 Learning Objective:</strong> Understand how applying a Hadamard (H) gate followed by a Controlled-NOT (CX) gate generates maximal 2-qubit entanglement.
              </div>
            </div>

            {/* Theory Body */}
            <div className="theory-body-content">
              <h3>1. The Concept of Entanglement</h3>
              <p>
                In classical computing, the state of two bits is always separable: bit 1 is either 0 or 1, and bit 2 is independently 0 or 1.
              </p>
              <p>
                In quantum computing, <strong>quantum entanglement</strong> is a physical phenomenon where the quantum states of two or more particles become intertwined such that one particle's state cannot be described independently of the others.
              </p>

              <h3>2. Mathematical Transformation Step-by-Step</h3>
              <div className="math-step-card">
                <span className="step-num">Step 1: Initialization</span>
                <p>The 2-qubit register begins in the standard ground state:</p>
                <code>|ψ₀⟩ = |00⟩ = |0⟩ ⊗ |0⟩</code>
              </div>

              <div className="math-step-card">
                <span className="step-num">Step 2: Hadamard on Qubit 0</span>
                <p>Applying the Hadamard (H) gate puts qubit 0 into equal superposition:</p>
                <code>{"|ψ₁⟩ = (H ⊗ I)|00⟩ = (|0⟩ + |1⟩)/√2 ⊗ |0⟩ = (|00⟩ + |10⟩)/√2"}</code>
              </div>

              <div className="math-step-card">
                <span className="step-num">Step 3: Controlled-NOT (CX)</span>
                <p>The CX gate flips qubit 1 (target) if and only if qubit 0 (control) is in state |1⟩:</p>
                <code>{"|ψ₂⟩ = CX|ψ₁⟩ = (|00⟩ + |11⟩)/√2 = |Φ⁺⟩"}</code>
              </div>

              <p>
                Notice that the states <code>|01⟩</code> and <code>|10⟩</code> have <strong>0 amplitude</strong>. When measured, the outcomes are 100% correlated: both 0 or both 1.
              </p>

              {/* Interactive Knowledge Check Quiz */}
              <div className="knowledge-check-card">
                <div className="quiz-header">
                  <HelpCircle size={18} className="text-teal" />
                  <h4>Knowledge Check Quiz</h4>
                </div>
                <p className="quiz-prompt">{quizQuestion.prompt}</p>

                <div className="quiz-options-list">
                  {quizQuestion.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`quiz-option-item ${selectedAnswer === idx ? "selected" : ""} ${
                        quizSubmitted && idx === quizQuestion.correctIndex ? "correct" : ""
                      } ${quizSubmitted && selectedAnswer === idx && idx !== quizQuestion.correctIndex ? "incorrect" : ""}`}
                      onClick={() => !quizSubmitted && setSelectedAnswer(idx)}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                      <span className="option-text">{opt}</span>
                    </div>
                  ))}
                </div>

                {!quizSubmitted ? (
                  <button
                    className="quiz-submit-btn"
                    disabled={selectedAnswer === null}
                    onClick={() => setQuizSubmitted(true)}
                  >
                    Check My Answer
                  </button>
                ) : (
                  <div className="quiz-feedback-box">
                    <p>{quizQuestion.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Interactive Mini-Lab & AI Column */}
          <div className="lesson-interactive-pane">
            <div className="pane-section-header">
              <BrainCircuit size={18} className="text-teal" />
              <h3>Interactive Circuit Canvas</h3>
              <button className="simulate-btn-compact" onClick={handleSimulate} disabled={isSimulating}>
                <Play size={14} /> {isSimulating ? "Simulating..." : "Simulate Live"}
              </button>
            </div>

            {/* Embedded Discrete Circuit Builder */}
            <div className="lesson-builder-wrapper">
              <CircuitBuilder circuit={circuit} onChange={setCircuit} />
            </div>

            {/* Live Results Panel */}
            <div className="lesson-results-wrapper">
              <ResultsPanel result={result} />
            </div>

            {/* AI Lesson Assistant */}
            <div className="lesson-ai-wrapper">
              <TutorPanel
                response={tutorResponse}
                isLoading={isTutorLoading}
                onAskQuestion={handleAskTutor}
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
