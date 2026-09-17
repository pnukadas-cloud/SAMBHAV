import React, { useState } from "react";
import { generateAIEducatorDraftApi } from "../../api/client";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🤖</span> AI Educator Copilot
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Generate pedagogically structured lesson drafts, quizzes, Quantum Lab experiments, and teaching plans powered by server-side Gemini.
        </p>
      </div>

      {/* Generator Form Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Action Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Copilot Task
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "generate_lesson", label: "📖 Lesson Draft", desc: "Structured 5-section lesson" },
                { id: "generate_quiz", label: "❓ Quiz Bank", desc: "5 MCQs with explanations" },
                { id: "generate_lab", label: "🔬 Lab Experiment", desc: "Circuit task & instructions" },
                { id: "generate_challenge", label: "⚡ Circuit Challenge", desc: "Problem statement & hints" },
                { id: "teaching_plan", label: "⏱️ 60-Min Plan", desc: "Classroom agenda & timings" },
                { id: "explain_weakness", label: "🧠 Misconception Fix", desc: "Diagnose student error" },
                { id: "remediation_plan", label: "🎯 Remediation Plan", desc: "Targeted support roadmap" },
                { id: "class_summary", label: "📊 Cohort Briefing", desc: "Pedagogical summary" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAction(item.id)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    action === item.id
                      ? "bg-teal-500/10 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <span className="text-xs font-bold block text-white">{item.label}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic & Target Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Quantum Topic / Concept *
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Quantum Teleportation and Entanglement Swapping"
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Difficulty
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as "Beginner" | "Intermediate" | "Advanced")}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              >
                <option value="Beginner">Beginner (Undergraduate / Intro)</option>
                <option value="Intermediate">Intermediate (Core Quantum Mechanics)</option>
                <option value="Advanced">Advanced (Algorithms & Hardware)</option>
              </select>
            </div>
          </div>

          {/* Quick Topic Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500">Quick suggestions:</span>
            {quickTopics.slice(0, 5).map((qt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTopic(qt)}
                className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg border border-slate-700 transition-colors"
              >
                {qt}
              </button>
            ))}
          </div>

          {/* Optional context */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Optional Context / Specific Requirements
            </label>
            <textarea
              rows={2}
              value={customPromptContext}
              onChange={(e) => setCustomPromptContext(e.target.value)}
              placeholder="e.g., Include specific emphasis on complex amplitudes; focus on IBM Q hardware constraints..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-600 outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>🔒</span> Server-side Gemini • All drafts require educator review
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Draft...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Generate AI Draft</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Generated Result Output */}
      {generatedResult && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl relative">
          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg text-xs font-bold tracking-wider uppercase">
                DRAFT PROPOSAL
              </span>
              <span className="text-sm font-bold text-white">
                {generatedResult.topic} ({generatedResult.level})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{copied ? "✓ Copied" : "📋 Copy"}</span>
              </button>
              {onImportToLessonBuilder && (
                <button
                  type="button"
                  onClick={handleImport}
                  className="px-3.5 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold rounded-lg border border-teal-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📥</span> Import to Lesson Builder
                </button>
              )}
            </div>
          </div>

          {/* Draft Watermark Banner */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-dashed border-amber-500/30 text-[11px] text-amber-200/80 flex items-center gap-2">
            <span>⚠️</span>
            <span>{generatedResult.disclaimer}</span>
          </div>

          {/* Draft Content */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans overflow-x-auto max-h-[500px]">
            {generatedResult.content}
          </div>
        </div>
      )}
    </div>
  );
};
