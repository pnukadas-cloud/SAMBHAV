import {
  Atom,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { runSimulation } from "../../api/client";
import { CircuitBuilder } from "../circuit-builder/CircuitBuilder";
import { ResultsPanel } from "../visualization/ResultsPanel";
import type { CircuitIR, SimulationResult } from "../../types";

interface StudentPreviewModalProps {
  lesson: any;
  onClose: () => void;
}

export function StudentPreviewModal({ lesson, onClose }: StudentPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"theory" | "math" | "sandbox" | "quiz">("sandbox");
  const defaultCircuit: CircuitIR = lesson.quantum_config?.starterCircuit || {
    qubits: lesson.quantum_config?.qubits || 2,
    classicalBits: lesson.quantum_config?.qubits || 2,
    operations: [{ gate: "h", targets: [0] }],
  };

  const [circuit, setCircuit] = useState<CircuitIR>(defaultCircuit);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Quiz preview state (strictly read-only test, does not save progress)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  const sections = lesson.structured_sections || {};
  const quiz = lesson.assessment?.quiz;

  async function handleSimulate() {
    setIsSimulating(true);
    try {
      const res = await runSimulation(circuit);
      setSimResult(res);
    } catch {
      // preview error
    } finally {
      setIsSimulating(false);
    }
  }

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="preview-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                background: "rgba(245, 158, 11, 0.2)",
                color: "#f59e0b",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Preview Mode (Read-Only)
            </span>
            <strong style={{ fontSize: "16px", color: "#f8fafc" }}>{lesson.title || "Lesson Preview"}</strong>
          </div>
          <button
            type="button"
            className="instructor-btn-secondary"
            onClick={onClose}
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            <X size={14} /> Exit Preview
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div style={{ display: "flex", gap: "8px", padding: "12px 24px", background: "#1e293b", borderBottom: "1px solid #334155" }}>
          <button
            type="button"
            className={`builder-tab-btn ${activeTab === "sandbox" ? "active" : ""}`}
            onClick={() => setActiveTab("sandbox")}
          >
            <BrainCircuit size={14} /> Quantum Sandbox
          </button>
          <button
            type="button"
            className={`builder-tab-btn ${activeTab === "theory" ? "active" : ""}`}
            onClick={() => setActiveTab("theory")}
          >
            <BookOpen size={14} /> Concept & Intuition
          </button>
          <button
            type="button"
            className={`builder-tab-btn ${activeTab === "math" ? "active" : ""}`}
            onClick={() => setActiveTab("math")}
          >
            <Atom size={14} /> Mathematical Formulation
          </button>
          {quiz && (
            <button
              type="button"
              className={`builder-tab-btn ${activeTab === "quiz" ? "active" : ""}`}
              onClick={() => setActiveTab("quiz")}
            >
              <HelpCircle size={14} /> Knowledge Check
            </button>
          )}
        </div>

        {/* Body */}
        <div className="preview-modal-body">
          {/* SANDBOX TAB */}
          {activeTab === "sandbox" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <h4 style={{ fontSize: "15px", margin: "0 0 4px 0", color: "#f8fafc" }}>Interactive Quantum Circuit</h4>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Learners manipulate gates on this canvas and execute local statevector simulations.
                  </span>
                </div>
                <button
                  type="button"
                  className="instructor-btn-primary"
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  style={{ fontSize: "12px", padding: "6px 14px" }}
                >
                  <Play size={13} /> {isSimulating ? "Simulating..." : "Run Simulation"}
                </button>
              </div>

              <div style={{ border: "1px solid #334155", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
                <CircuitBuilder circuit={circuit} onChange={setCircuit} />
              </div>

              {simResult && (
                <div style={{ marginTop: "16px" }}>
                  <h4 style={{ fontSize: "14px", color: "#38bdf8", marginBottom: "8px" }}>Live Simulation Statevector & Probabilities</h4>
                  <ResultsPanel result={simResult} />
                </div>
              )}
            </div>
          )}

          {/* THEORY TAB */}
          {activeTab === "theory" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {sections.concept && (
                <div>
                  <h4 style={{ color: "#38bdf8", fontSize: "15px", marginBottom: "6px" }}>Concept Overview</h4>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }}>{sections.concept}</p>
                </div>
              )}

              {sections.intuition && (
                <div>
                  <h4 style={{ color: "#38bdf8", fontSize: "15px", marginBottom: "6px" }}>Physical & Geometric Intuition</h4>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }}>{sections.intuition}</p>
                </div>
              )}

              {sections.example && (
                <div>
                  <h4 style={{ color: "#38bdf8", fontSize: "15px", marginBottom: "6px" }}>Concrete Example</h4>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }}>{sections.example}</p>
                </div>
              )}

              {sections.keyTakeaways && (
                <div>
                  <h4 style={{ color: "#38bdf8", fontSize: "15px", marginBottom: "6px" }}>Key Takeaways</h4>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }}>{sections.keyTakeaways}</p>
                </div>
              )}

              {lesson.content_markdown && !sections.concept && (
                <div style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }}>
                  {lesson.content_markdown}
                </div>
              )}
            </div>
          )}

          {/* MATH TAB */}
          {activeTab === "math" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {sections.mathFormulation && (
                <div>
                  <h4 style={{ color: "#38bdf8", fontSize: "15px", marginBottom: "6px" }}>Mathematical Formalism</h4>
                  <div style={{ background: "#090d16", padding: "16px", borderRadius: "8px", border: "1px solid #1e293b", fontFamily: "monospace", color: "#38bdf8" }}>
                    {sections.mathFormulation}
                  </div>
                </div>
              )}

              {sections.mathDerivation && (
                <div>
                  <h4 style={{ color: "#38bdf8", fontSize: "15px", marginBottom: "6px" }}>Step-by-Step Derivation</h4>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }}>{sections.mathDerivation}</p>
                </div>
              )}
            </div>
          )}

          {/* QUIZ TAB */}
          {activeTab === "quiz" && quiz && (
            <div>
              <h4 style={{ fontSize: "16px", color: "#f8fafc", marginBottom: "16px" }}>{quiz.prompt}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {Array.isArray(quiz.options) &&
                  quiz.options.map((opt: string, idx: number) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = isQuizSubmitted && idx === quiz.correctIndex;
                    const isWrong = isQuizSubmitted && isSelected && idx !== quiz.correctIndex;

                    return (
                      <div
                        key={idx}
                        onClick={() => !isQuizSubmitted && setSelectedAnswer(idx)}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: `1px solid ${isCorrect ? "#22c55e" : isWrong ? "#ef4444" : isSelected ? "#38bdf8" : "#334155"}`,
                          background: isCorrect
                            ? "rgba(34, 197, 94, 0.12)"
                            : isWrong
                            ? "rgba(239, 68, 68, 0.12)"
                            : isSelected
                            ? "rgba(56, 189, 248, 0.12)"
                            : "#0f172a",
                          cursor: isQuizSubmitted ? "default" : "pointer",
                          color: "#f8fafc",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span style={{ fontWeight: 700, color: "#94a3b8" }}>{String.fromCharCode(65 + idx)}.</span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
              </div>

              {!isQuizSubmitted ? (
                <button
                  type="button"
                  className="instructor-btn-primary"
                  onClick={() => setIsQuizSubmitted(true)}
                  disabled={selectedAnswer === null}
                >
                  Submit Answer (Preview)
                </button>
              ) : (
                <div
                  style={{
                    padding: "14px",
                    background: "rgba(14, 165, 233, 0.1)",
                    border: "1px solid rgba(14, 165, 233, 0.3)",
                    borderRadius: "8px",
                  }}
                >
                  <strong style={{ color: "#38bdf8", display: "block", marginBottom: "4px" }}>
                    {selectedAnswer === quiz.correctIndex ? "✓ Correct!" : "✗ Review Explanation:"}
                  </strong>
                  <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
                    {quiz.explanation || "No explanation provided for this question."}
                  </p>
                  <button
                    type="button"
                    className="instructor-btn-secondary"
                    onClick={() => {
                      setIsQuizSubmitted(false);
                      setSelectedAnswer(null);
                    }}
                    style={{ marginTop: "10px", fontSize: "11px", padding: "4px 8px" }}
                  >
                    <RotateCcw size={12} /> Reset Quiz Preview
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
