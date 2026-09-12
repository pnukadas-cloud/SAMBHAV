import { BrainCircuit, Cpu, HelpCircle, Lightbulb, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import type { AITutorResponse } from "../../types";

type Props = {
  response: AITutorResponse | null;
  isLoading: boolean;
  onAskQuestion: (question: string) => void;
};

export function TutorPanel({ response, isLoading, onAskQuestion }: Props) {
  const [inputQuestion, setInputQuestion] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;
    onAskQuestion(inputQuestion.trim());
    setInputQuestion("");
  }

  function handleQuickPrompt(promptText: string) {
    if (isLoading) return;
    onAskQuestion(promptText);
  }

  const defaultExplanation =
    "Run your quantum circuit and click 'Explain Circuit' or ask a question below. The AI tutor provides step-by-step physical insights into superposition, entanglement, and measurement probabilities.";

  const explanationText = response?.explanation || defaultExplanation;
  const isLLM = response?.source === "gemini" || response?.source === "llm";

  return (
    <section className="panel tutor-panel">
      <div className="tutor-header">
        <div className="tutor-title-group">
          <BrainCircuit size={20} className="text-teal" />
          <h2>AI Quantum Tutor</h2>
        </div>
        {response && (
          <span className={`tutor-source-pill ${isLLM ? "pill-llm" : "pill-fallback"}`}>
            {isLLM ? <Sparkles size={12} /> : <Cpu size={12} />}
            {isLLM ? "Gemini AI" : "Physics Engine"}
          </span>
        )}
      </div>

      {/* Main explanation content */}
      <div className="tutor-content-card">
        <p className="tutor-text">{explanationText}</p>

        {/* Key Concepts Tags */}
        {response?.key_concepts && response.key_concepts.length > 0 && (
          <div className="tutor-concepts-container">
            <span className="concepts-title">Key Concepts:</span>
            <div className="tutor-concept-tags">
              {response.key_concepts.map((concept) => (
                <span key={concept} className="concept-tag">
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested Follow-up Questions */}
      {response?.suggestions && response.suggestions.length > 0 && (
        <div className="tutor-suggestions-box">
          <div className="suggestions-header">
            <Lightbulb size={14} className="text-amber" />
            <span>Suggested Experiments:</span>
          </div>
          <div className="suggestions-list">
            {response.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                className="suggestion-pill-btn"
                onClick={() => handleQuickPrompt(`How does this work: ${suggestion}`)}
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="quick-prompts-row">
        <button
          type="button"
          className="quick-prompt-btn"
          onClick={() => handleQuickPrompt("Why did this circuit create entanglement?")}
          disabled={isLoading}
        >
          <HelpCircle size={13} /> Why entanglement?
        </button>
        <button
          type="button"
          className="quick-prompt-btn"
          onClick={() => handleQuickPrompt("What does the Hadamard gate do?")}
          disabled={isLoading}
        >
          <HelpCircle size={13} /> Role of H gate?
        </button>
      </div>

      {/* Free-text Question Form */}
      <form className="tutor-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="tutor-input-field"
          placeholder="Ask tutor (e.g. Why did this circuit create entanglement?)..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="tutor-submit-btn"
          disabled={isLoading || !inputQuestion.trim()}
          title="Submit question to AI tutor"
        >
          {isLoading ? (
            <span className="tutor-loading-spinner" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </form>
    </section>
  );
}
