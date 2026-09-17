import {
  AlertCircle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Eye,
  FileCode,
  HelpCircle,
  Layers,
  Lightbulb,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { createInstructorLessonApi, fetchInstructorLessonById, updateInstructorLessonApi } from "../../api/client";

interface LessonBuilderViewProps {
  editingLessonId: string | null;
  defaultModuleId?: string;
  onSaved: () => void;
  onCancel: () => void;
  onLaunchPreview: (lesson: any) => void;
}

type BuilderTab = "content" | "objectives" | "quantum_lab" | "assessment" | "ai_context";

export function LessonBuilderView({
  editingLessonId,
  defaultModuleId = "module-0",
  onSaved,
  onCancel,
  onLaunchPreview,
}: LessonBuilderViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<BuilderTab>("content");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [moduleId, setModuleId] = useState(defaultModuleId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [prerequisites, setPrerequisites] = useState("");

  // Structured Sections
  const [concept, setConcept] = useState("");
  const [intuition, setIntuition] = useState("");
  const [mathFormulation, setMathFormulation] = useState("");
  const [mathDerivation, setMathDerivation] = useState("");
  const [example, setExample] = useState("");
  const [visualApplication, setVisualApplication] = useState("");
  const [keyTakeaways, setKeyTakeaways] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");

  // Learning Objectives
  const [objectives, setObjectives] = useState<string[]>([
    "Understand the core physical principles and mathematical representation.",
    "Simulate the quantum state transformation using interactive gates.",
  ]);
  const [newObjectiveText, setNewObjectiveText] = useState("");

  // Quantum Lab Configuration
  const [qubits, setQubits] = useState(2);
  const [starterCircuitJson, setStarterCircuitJson] = useState('{\n  "qubits": 2,\n  "classicalBits": 2,\n  "operations": [\n    {"gate": "h", "targets": [0]}\n  ]\n}');
  const [requiredGates, setRequiredGates] = useState("h, cx, measure");
  const [expectedResult, setExpectedResult] = useState("Equal measurement probabilities on basis states |00⟩ and |11⟩.");

  // Assessment
  const [quizPrompt, setQuizPrompt] = useState("");
  const [quizOptions, setQuizOptions] = useState<string[]>([
    "Option A: State transformation",
    "Option B: Basis superposition",
    "Option C: Measurement collapse",
    "Option D: Phase shift",
  ]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [quizExplanation, setQuizExplanation] = useState("");
  const [miniChallengeTitle, setMiniChallengeTitle] = useState("");
  const [miniChallengeGoal, setMiniChallengeGoal] = useState("");

  // AI Context
  const [aiConcepts, setAiConcepts] = useState("Superposition, Hadamard, Bloch Sphere");
  const [aiTutorGuidance, setAiTutorGuidance] = useState("Emphasize the difference between complex probability amplitudes and classical probabilities.");

  // Load existing lesson if editing
  useEffect(() => {
    if (editingLessonId) {
      setIsLoading(true);
      fetchInstructorLessonById(editingLessonId)
        .then((lesson) => {
          if (lesson) {
            setModuleId(lesson.module_id || "module-0");
            setTitle(lesson.title || "");
            setDescription(lesson.description || "");
            setDifficulty(lesson.difficulty || "Beginner");
            setEstimatedMinutes(lesson.estimated_minutes || 15);
            setPrerequisites(lesson.prerequisites || "");
            setContentMarkdown(lesson.content_markdown || "");

            const sections = lesson.structured_sections || {};
            setConcept(sections.concept || "");
            setIntuition(sections.intuition || "");
            setMathFormulation(sections.mathFormulation || "");
            setMathDerivation(sections.mathDerivation || "");
            setExample(sections.example || "");
            setVisualApplication(sections.visualApplication || "");
            setKeyTakeaways(sections.keyTakeaways || "");

            if (Array.isArray(lesson.learning_objectives)) {
              setObjectives(lesson.learning_objectives);
            }

            const qConfig = lesson.quantum_config || {};
            setQubits(qConfig.qubits || 2);
            if (qConfig.starterCircuit) {
              setStarterCircuitJson(JSON.stringify(qConfig.starterCircuit, null, 2));
            }
            if (Array.isArray(qConfig.requiredGates)) {
              setRequiredGates(qConfig.requiredGates.join(", "));
            }
            setExpectedResult(qConfig.expectedResult || "");

            const assess = lesson.assessment || {};
            if (assess.quiz) {
              setQuizPrompt(assess.quiz.prompt || "");
              if (Array.isArray(assess.quiz.options)) setQuizOptions(assess.quiz.options);
              setCorrectOptionIndex(assess.quiz.correctIndex ?? 0);
              setQuizExplanation(assess.quiz.explanation || "");
            }
            if (assess.miniChallenge) {
              setMiniChallengeTitle(assess.miniChallenge.title || "");
              setMiniChallengeGoal(assess.miniChallenge.expectedGoal || "");
            }

            const aiCtx = lesson.ai_context || {};
            setAiConcepts(aiCtx.concepts || "");
            setAiTutorGuidance(aiCtx.guidance || "");
          }
        })
        .catch(() => {
          showToast("Failed to load lesson for editing.", "error");
        })
        .finally(() => setIsLoading(false));
    }
  }, [editingLessonId]);

  function handleAddObjective() {
    if (newObjectiveText.trim()) {
      setObjectives([...objectives, newObjectiveText.trim()]);
      setNewObjectiveText("");
    }
  }

  function handleRemoveObjective(index: number) {
    setObjectives(objectives.filter((_, i) => i !== index));
  }

  function handleOptionChange(index: number, val: string) {
    const updated = [...quizOptions];
    updated[index] = val;
    setQuizOptions(updated);
  }

  function buildPayload(status: "draft" | "published") {
    let parsedStarterCircuit: any = null;
    try {
      if (starterCircuitJson.trim()) {
        parsedStarterCircuit = JSON.parse(starterCircuitJson);
      }
    } catch {
      parsedStarterCircuit = { qubits, classicalBits: qubits, operations: [] };
    }

    const structuredSections = {
      concept,
      intuition,
      mathFormulation,
      mathDerivation,
      example,
      visualApplication,
      keyTakeaways,
    };

    const quantumConfig = {
      qubits,
      starterCircuit: parsedStarterCircuit,
      requiredGates: requiredGates.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean),
      expectedResult,
    };

    const assessmentConfig = {
      quiz: quizPrompt.trim()
        ? {
            prompt: quizPrompt.trim(),
            options: quizOptions,
            correctIndex: correctOptionIndex,
            explanation: quizExplanation,
          }
        : null,
      miniChallenge: miniChallengeTitle.trim()
        ? {
            title: miniChallengeTitle.trim(),
            expectedGoal: miniChallengeGoal.trim(),
          }
        : null,
    };

    const aiContextConfig = {
      concepts: aiConcepts,
      guidance: aiTutorGuidance,
    };

    const markdownCompiled =
      contentMarkdown.trim() ||
      `# ${title}\n\n${description}\n\n## Concept Overview\n${concept}\n\n## Intuition\n${intuition}\n\n## Mathematical Formulation\n${mathFormulation}\n\n## Key Takeaways\n${keyTakeaways}`;

    return {
      module_id: moduleId,
      title: title.trim(),
      description: description.trim(),
      difficulty,
      estimated_minutes: Number(estimatedMinutes),
      prerequisites: prerequisites.trim(),
      content_markdown: markdownCompiled,
      learning_objectives: objectives,
      structured_sections: structuredSections,
      quantum_config: quantumConfig,
      assessment: assessmentConfig,
      ai_context: aiContextConfig,
      status,
    };
  }

  async function handleSave(status: "draft" | "published") {
    if (!title.trim()) {
      showToast("Lesson title is required.", "error");
      setActiveTab("content");
      return;
    }

    setIsSubmitting(true);
    const payload = buildPayload(status);

    try {
      if (editingLessonId) {
        await updateInstructorLessonApi(editingLessonId, payload);
        showToast(`Lesson updated and saved as ${status}!`, "success");
      } else {
        await createInstructorLessonApi(payload);
        showToast(`New lesson created and saved as ${status}!`, "success");
      }
      onSaved();
    } catch (err: any) {
      showToast(err.message || "Failed to save lesson.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePreview() {
    if (!title.trim()) {
      showToast("Please provide at least a lesson title to preview.", "error");
      return;
    }
    const payload = buildPayload("draft");
    onLaunchPreview(payload);
  }

  if (isLoading) {
    return (
      <div className="instructor-panel-card" style={{ textAlign: "center", padding: "48px" }}>
        <Clock size={32} className="spin-slow" style={{ color: "#38bdf8", margin: "0 auto 12px" }} />
        <p>Loading lesson for authoring...</p>
      </div>
    );
  }

  return (
    <div className="instructor-panel-card">
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "20px", margin: "0 0 4px 0", color: "#f8fafc" }}>
            {editingLessonId ? "Edit Custom Lesson" : "Author New Quantum Lesson"}
          </h2>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            Structured fields for concept intuition, mathematical derivations, live circuits, quizzes, and AI tutor context.
          </span>
        </div>
        <button type="button" className="instructor-btn-secondary" onClick={onCancel} style={{ fontSize: "12px" }}>
          <X size={14} /> Close Builder
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="builder-tab-nav">
        <button
          type="button"
          className={`builder-tab-btn ${activeTab === "content" ? "active" : ""}`}
          onClick={() => setActiveTab("content")}
        >
          <BookOpen size={15} /> Content & Theory
        </button>
        <button
          type="button"
          className={`builder-tab-btn ${activeTab === "objectives" ? "active" : ""}`}
          onClick={() => setActiveTab("objectives")}
        >
          <CheckCircle2 size={15} /> Objectives ({objectives.length})
        </button>
        <button
          type="button"
          className={`builder-tab-btn ${activeTab === "quantum_lab" ? "active" : ""}`}
          onClick={() => setActiveTab("quantum_lab")}
        >
          <BrainCircuit size={15} /> Quantum Lab Circuit
        </button>
        <button
          type="button"
          className={`builder-tab-btn ${activeTab === "assessment" ? "active" : ""}`}
          onClick={() => setActiveTab("assessment")}
        >
          <HelpCircle size={15} /> Quiz & Challenge
        </button>
        <button
          type="button"
          className={`builder-tab-btn ${activeTab === "ai_context" ? "active" : ""}`}
          onClick={() => setActiveTab("ai_context")}
        >
          <Sparkles size={15} /> AI Tutor Context
        </button>
      </div>

      {/* TAB 1: CONTENT & THEORY */}
      {activeTab === "content" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="builder-form-group">
              <label>Lesson Title *</label>
              <input
                type="text"
                placeholder="e.g. Continuous Bloch Rotations & Universality"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="builder-form-group">
              <label>Target Module</label>
              <select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
                <option value="module-0">Module 0: Mathematical & Computational Foundations</option>
                <option value="module-1">Module 1: Quantum Foundations</option>
                <option value="module-2">Module 2: Multi-Qubit Systems & Quantum Circuits</option>
                <option value="module-3">Module 3: Quantum Programming & Simulation Lab</option>
                <option value="module-4">Module 4: Fundamental Quantum Algorithms</option>
                <option value="module-5">Module 5: Quantum Information & Communication</option>
                <option value="module-6">Module 6: Quantum Noise & Error Correction</option>
                <option value="module-7">Module 7: Quantum Computing Applications</option>
                <option value="module-8">Module 8: Quantum Hardware & Real-World Systems</option>
                <option value="module-9">Module 9: Research & Advanced Quantum Computing</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div className="builder-form-group">
              <label>Difficulty Level</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="builder-form-group">
              <label>Estimated Duration (Minutes)</label>
              <input
                type="number"
                min={5}
                max={180}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              />
            </div>
            <div className="builder-form-group">
              <label>Prerequisites</label>
              <input
                type="text"
                placeholder="e.g. Linear Algebra, Pauli Matrices"
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
              />
            </div>
          </div>

          <div className="builder-form-group">
            <label>Short Description</label>
            <input
              type="text"
              placeholder="Brief summary of what this lesson covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <h4 style={{ fontSize: "15px", color: "#38bdf8", margin: "24px 0 12px 0" }}>Structured Pedagogical Sections</h4>

          <div className="builder-form-group">
            <label>1. Concept Overview</label>
            <textarea
              rows={3}
              placeholder="Core concept definition and scientific motivation..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            />
          </div>

          <div className="builder-form-group">
            <label>2. Physical & Geometric Intuition</label>
            <textarea
              rows={3}
              placeholder="Intuitive visual analogy (e.g. Bloch sphere trajectories, wave interference)..."
              value={intuition}
              onChange={(e) => setIntuition(e.target.value)}
            />
          </div>

          <div className="builder-form-group">
            <label>3. Mathematical Formulation (LaTeX / Dirac statevectors)</label>
            <textarea
              rows={4}
              placeholder="Use LaTeX syntax ($ for inline math like $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$, $$ for matrices)..."
              value={mathFormulation}
              onChange={(e) => setMathFormulation(e.target.value)}
            />
          </div>

          <div className="builder-form-group">
            <label>4. Mathematical Derivation</label>
            <textarea
              rows={3}
              placeholder="Step-by-step algebraic proof or matrix multiplication..."
              value={mathDerivation}
              onChange={(e) => setMathDerivation(e.target.value)}
            />
          </div>

          <div className="builder-form-group">
            <label>5. Concrete Example</label>
            <textarea
              rows={3}
              placeholder="Walkthrough example with specific angle or numerical values..."
              value={example}
              onChange={(e) => setExample(e.target.value)}
            />
          </div>

          <div className="builder-form-group">
            <label>6. Practical Quantum Applications</label>
            <textarea
              rows={3}
              placeholder="Real-world quantum hardware relevance (e.g. NISQ compilation, VQE ansatz)..."
              value={visualApplication}
              onChange={(e) => setVisualApplication(e.target.value)}
            />
          </div>

          <div className="builder-form-group">
            <label>7. Key Takeaways</label>
            <textarea
              rows={3}
              placeholder="Summary bullet points for the learner..."
              value={keyTakeaways}
              onChange={(e) => setKeyTakeaways(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* TAB 2: OBJECTIVES */}
      {activeTab === "objectives" && (
        <div>
          <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "16px" }}>
            Add specific, measurable learning objectives. "After completing this lesson, learners should be able to..."
          </p>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="e.g. Construct a 2-qubit Bell state circuit using Hadamard and CNOT gates"
              value={newObjectiveText}
              onChange={(e) => setNewObjectiveText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddObjective())}
              style={{
                flex: 1,
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "6px",
                padding: "10px 14px",
                color: "#f8fafc",
              }}
            />
            <button type="button" className="instructor-btn-primary" onClick={handleAddObjective}>
              <Plus size={16} /> Add Objective
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {objectives.map((obj, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(56, 189, 248, 0.15)",
                      color: "#38bdf8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: "14px", color: "#f8fafc" }}>{obj}</span>
                </div>
                <button
                  type="button"
                  className="instructor-btn-danger"
                  onClick={() => handleRemoveObjective(idx)}
                  style={{ padding: "4px 8px" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUANTUM LAB */}
      {activeTab === "quantum_lab" && (
        <div>
          <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "16px" }}>
            Configure the embedded Quantum Lab circuit simulation for this lesson.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="builder-form-group">
              <label>Number of Qubits</label>
              <input
                type="number"
                min={1}
                max={16}
                value={qubits}
                onChange={(e) => setQubits(Number(e.target.value))}
              />
            </div>
            <div className="builder-form-group">
              <label>Required / Recommended Gates</label>
              <input
                type="text"
                placeholder="e.g. h, cx, rz, measure"
                value={requiredGates}
                onChange={(e) => setRequiredGates(e.target.value)}
              />
            </div>
          </div>

          <div className="builder-form-group">
            <label>Initial Starter Circuit (JSON)</label>
            <textarea
              rows={8}
              style={{ fontFamily: "monospace", fontSize: "12px" }}
              value={starterCircuitJson}
              onChange={(e) => setStarterCircuitJson(e.target.value)}
            />
          </div>

          <div className="builder-form-group">
            <label>Expected Simulation Result / Probability Distribution</label>
            <textarea
              rows={2}
              placeholder="e.g. Equal 50/50 measurement distribution on |00⟩ and |11⟩."
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* TAB 4: ASSESSMENT */}
      {activeTab === "assessment" && (
        <div>
          <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "16px" }}>
            Define an interactive knowledge check quiz and mini-challenge for this lesson.
          </p>

          <div className="builder-form-group">
            <label>Knowledge Check Question Prompt</label>
            <input
              type="text"
              placeholder="e.g. What is the effect of applying an X gate followed by a Z gate on |0⟩?"
              value={quizPrompt}
              onChange={(e) => setQuizPrompt(e.target.value)}
            />
          </div>

          <div style={{ margin: "16px 0" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "8px" }}>
              Answer Options (select the radio button for the correct answer):
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {quizOptions.map((opt, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctOptionIndex === idx}
                    onChange={() => setCorrectOptionIndex(idx)}
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    style={{
                      flex: 1,
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      color: "#f8fafc",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="builder-form-group">
            <label>Explanation for the Correct Answer</label>
            <textarea
              rows={2}
              placeholder="Explain why the chosen option is correct and why other options are distractors..."
              value={quizExplanation}
              onChange={(e) => setQuizExplanation(e.target.value)}
            />
          </div>

          <h4 style={{ fontSize: "15px", color: "#38bdf8", margin: "24px 0 12px 0" }}>Interactive Mini-Challenge</h4>

          <div className="builder-form-group">
            <label>Challenge Title</label>
            <input
              type="text"
              placeholder="e.g. Construct the |Ψ⁺⟩ Bell State"
              value={miniChallengeTitle}
              onChange={(e) => setMiniChallengeTitle(e.target.value)}
            />
          </div>

          <div className="builder-form-group">
            <label>Expected Goal & Instructions</label>
            <textarea
              rows={2}
              placeholder="Apply X on Qubit 0, then H on Qubit 0, then CX(0,1) to synthesize |Ψ⁺⟩."
              value={miniChallengeGoal}
              onChange={(e) => setMiniChallengeGoal(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* TAB 5: AI TUTOR CONTEXT */}
      {activeTab === "ai_context" && (
        <div>
          <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "16px" }}>
            Provide contextual guidance to the SAMBHAV server-side AI Tutor when learners ask questions during this lesson.
          </p>

          <div className="builder-form-group">
            <label>Core Concept Keywords</label>
            <input
              type="text"
              placeholder="e.g. Entanglement, Bell States, Non-locality, CNOT Gate"
              value={aiConcepts}
              onChange={(e) => setAiConcepts(e.target.value)}
            />
          </div>

          <div className="builder-form-group">
            <label>Pedagogical Guidance & Misconception Hints for AI</label>
            <textarea
              rows={4}
              placeholder="Guide the AI on common errors (e.g. remind learners that CNOT control does not flip, only target flips)."
              value={aiTutorGuidance}
              onChange={(e) => setAiTutorGuidance(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="builder-action-bar">
        <button type="button" className="instructor-btn-secondary" onClick={handlePreview}>
          <Eye size={15} /> Preview as Student
        </button>
        <button
          type="button"
          className="instructor-btn-secondary"
          onClick={() => handleSave("draft")}
          disabled={isSubmitting}
        >
          <Save size={15} /> Save Draft
        </button>
        <button
          type="button"
          className="instructor-btn-primary"
          onClick={() => handleSave("published")}
          disabled={isSubmitting}
        >
          <Send size={15} /> Publish Lesson
        </button>
      </div>
    </div>
  );
}
