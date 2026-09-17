import React, { useState } from "react";
import { generateAIEducatorDraftApi } from "../../api/client";
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  FlaskConical,
  Zap,
  Clock,
  BrainCircuit,
  Target,
  BarChart3,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface AIEducatorCopilotViewProps {
  onImportToLessonBuilder?: (content: string, topic: string) => void;
}

export const AIEducatorCopilotView: React.FC<AIEducatorCopilotViewProps> = ({
  onImportToLessonBuilder,
}) => {
  const [action, setAction] = useState<string>("generate_lesson");
  const [topic, setTopic] = useState<string>("Quantum Superposition & Hadamard Transformation");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [customPromptContext, setCustomPromptContext] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert("Please enter a quantum topic or concept.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setGeneratedResult(null);
      const res = await generateAIEducatorDraftApi({
        action,
        topic: topic.trim(),
        level,
        context: customPromptContext ? { details: customPromptContext } : undefined,
      });
      setGeneratedResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI draft.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult?.content) return;
    navigator.clipboard.writeText(generatedResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    if (onImportToLessonBuilder && generatedResult?.content) {
      onImportToLessonBuilder(generatedResult.content, topic);
    }
  };

  const quickTopics = [
    "Qubit State Representation & Dirac Ket Notation",
    "Hadamard Gate & Superposition Principle",
    "Pauli-X, Y, Z Gates & Bloch Sphere Rotations",
    "Quantum Entanglement & Bell State Generation",
    "CNOT & Multi-Qubit Controlled Operations",
    "No-Cloning Theorem & Quantum Information",
    "Quantum Teleportation Protocol",
    "Deutsch-Jozsa Algorithm & Phase Kickback",
    "Grover's Quantum Search Algorithm",
    "Shor's Period-Finding Algorithm",
  ];

  const tasks = [
    { id: "generate_lesson", icon: <BookOpen size={16} color="#0d9488" />, label: "Lesson Draft", desc: "Structured 5-section lesson" },
    { id: "generate_quiz", icon: <HelpCircle size={16} color="#7c3aed" />, label: "Quiz Bank", desc: "5 MCQs with explanations" },
    { id: "generate_lab", icon: <FlaskConical size={16} color="#2563eb" />, label: "Lab Experiment", desc: "Circuit task & instructions" },
    { id: "generate_challenge", icon: <Zap size={16} color="#d97706" />, label: "Circuit Challenge", desc: "Problem statement & hints" },
    { id: "teaching_plan", icon: <Clock size={16} color="#059669" />, label: "60-Min Plan", desc: "Classroom agenda & timings" },
    { id: "explain_weakness", icon: <BrainCircuit size={16} color="#ea580c" />, label: "Misconception Fix", desc: "Diagnose student error" },
    { id: "remediation_plan", icon: <Target size={16} color="#e11d48" />, label: "Remediation Plan", desc: "Targeted support roadmap" },
    { id: "class_summary", icon: <BarChart3 size={16} color="#4361ee" />, label: "Cohort Briefing", desc: "Pedagogical summary" },
  ];

  return (
    <div className="instructor-content-area">
      {/* Header */}
      <div className="instructor-header-banner">
        <div className="instructor-header-titles">
          <h1>🤖 AI Educator Copilot</h1>
          <p>Generate pedagogically structured lesson drafts, quizzes, Quantum Lab experiments, and teaching plans powered by server-side Gemini.</p>
        </div>
      </div>

      {/* Generator Form Card */}
      <div className="instructor-panel-card">
        <form onSubmit={handleGenerate}>
          {/* Action Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label className="instructor-form-label" style={{ marginBottom: "10px", display: "block" }}>
              Select Copilot Task
            </label>
            <div className="copilot-task-grid">
              {tasks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAction(item.id)}
                  className={`copilot-task-btn ${action === item.id ? "active" : ""}`}
                >
                  <span className="copilot-task-title">
                    {item.icon} {item.label}
                  </span>
                  <span className="copilot-task-desc">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic & Target Level */}
          <div className="instructor-form-row">
            <div className="instructor-form-group" style={{ gridColumn: "span 2" }}>
              <label className="instructor-form-label">Quantum Topic / Concept *</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Quantum Teleportation and Entanglement Swapping"
                className="instructor-form-input"
              />
            </div>
            <div className="instructor-form-group">
              <label className="instructor-form-label">Target Difficulty</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as "Beginner" | "Intermediate" | "Advanced")}
                className="instructor-form-select"
              >
                <option value="Beginner">Beginner (Undergraduate / Intro)</option>
                <option value="Intermediate">Intermediate (Core Quantum Mechanics)</option>
                <option value="Advanced">Advanced (Algorithms & Hardware)</option>
              </select>
            </div>
          </div>

          {/* Quick Topic Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginBottom: "18px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Quick suggestions:</span>
            {quickTopics.slice(0, 5).map((qt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTopic(qt)}
                className="copilot-chip"
              >
                {qt}
              </button>
            ))}
          </div>

          {/* Optional context */}
          <div className="instructor-form-group">
            <label className="instructor-form-label">Optional Context / Specific Requirements</label>
            <textarea
              rows={2}
              value={customPromptContext}
              onChange={(e) => setCustomPromptContext(e.target.value)}
              placeholder="e.g., Include specific emphasis on complex amplitudes; focus on IBM Q hardware constraints..."
              className="instructor-form-textarea"
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={14} color="#94a3b8" /> Server-side Gemini • All drafts require educator review
            </span>
            <button
              type="submit"
              disabled={loading}
              className="instructor-btn-primary"
              style={{ padding: "10px 20px", fontSize: "14px" }}
            >
              {loading ? (
                <>
                  <div className="instructor-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", borderTopColor: "#ffffff" }}></div>
                  <span>Generating Draft...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate AI Draft</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="instructor-error-banner">
          <span className="instructor-error-banner-text">{error}</span>
        </div>
      )}

      {/* Generated Result Output */}
      {generatedResult && (
        <div className="instructor-panel-card" style={{ marginTop: "24px", border: "1.5px solid #0d9488" }}>
          {/* Result Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "14px", borderBottom: "1px solid #e2e8f0", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="badge-pill badge-pill-amber">
                DRAFT PROPOSAL
              </span>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                {generatedResult.topic} ({generatedResult.level})
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={handleCopy}
                className="instructor-btn-secondary"
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              {onImportToLessonBuilder && (
                <button
                  type="button"
                  onClick={handleImport}
                  className="instructor-btn-primary"
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  <Download size={14} /> Import to Lesson Builder
                </button>
              )}
            </div>
          </div>

          {/* Draft Watermark Banner */}
          <div style={{ padding: "10px 14px", background: "rgba(217, 119, 6, 0.08)", borderRadius: "8px", border: "1px solid rgba(217, 119, 6, 0.2)", fontSize: "12px", color: "#92400e", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <AlertTriangle size={16} color="#d97706" />
            <span>{generatedResult.disclaimer}</span>
          </div>

          {/* Draft Content */}
          <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0", color: "#1e293b", fontSize: "14px", lineHeight: 1.65, whiteSpace: "pre-wrap", maxHeight: "550px", overflowY: "auto" }}>
            {generatedResult.content}
          </div>
        </div>
      )}
    </div>
  );
};
