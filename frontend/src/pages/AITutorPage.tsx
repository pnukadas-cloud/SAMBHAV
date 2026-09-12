import {
  Atom,
  Bot,
  BrainCircuit,
  Cpu,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { CircuitBuilder, PRESET_CIRCUITS } from "../features/circuit-builder/CircuitBuilder";
import { explainCircuitWithAI, runSimulation } from "../api/client";
import { useToast } from "../context/ToastContext";
import type { AITutorResponse, CircuitIR, SimulationResult } from "../types";

type ChatMessage = {
  id: string;
  sender: "user" | "ai";
  text: string;
  source?: "llm" | "fallback";
  concepts?: string[];
  suggestions?: string[];
  timestamp: string;
};

const defaultTutorCircuit: CircuitIR = {
  qubits: 2,
  classicalBits: 2,
  operations: [
    { gate: "h", targets: [0] },
    { gate: "cx", controls: [0], targets: [1] },
    { gate: "measure", targets: [0, 1], classicalTargets: [0, 1] },
  ],
};

export function AITutorPage() {
  const { showToast } = useToast();
  const [circuit, setCircuit] = useState<CircuitIR>(defaultTutorCircuit);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "ai",
      text: "Hello! I am your AI Quantum Physics Tutor. I analyze your quantum circuits, Dirac notations, and measurement probabilities to provide step-by-step physical derivations. Ask me anything or select a prompt below!",
      source: "fallback",
      concepts: ["Superposition", "Entanglement", "Measurement Collapse"],
      suggestions: [
        "Why did this circuit create entanglement?",
        "What does the Hadamard gate physically do?",
        "How do relative phases affect measurement?",
      ],
      timestamp: "Just now",
    },
  ]);

  async function handleSend(queryText?: string) {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      let currentResult = result;
      if (!currentResult) {
        try {
          currentResult = await runSimulation(circuit);
          setResult(currentResult);
        } catch {}
      }

      const response = await explainCircuitWithAI({
        circuit,
        simulation_result: currentResult,
        question: textToSend,
        lesson_context: {
          title: "Dedicated AI Tutor Session",
          objective: "Deep conceptual and physical understanding of quantum logic.",
        },
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: response.explanation,
        source: response.source,
        concepts: response.key_concepts,
        suggestions: response.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      showToast("Tutor request failed. Please check connection.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLoadPreset(index: number) {
    const p = PRESET_CIRCUITS[index];
    if (p) {
      setCircuit(p.getCircuit(p.name.includes("GHZ") ? 3 : 2));
      setResult(null);
      showToast(`Context updated with ${p.name}`, "info");
    }
  }

  return (
    <AppShell activeTitle="AI Quantum Tutor" activeCategory="Intelligence">
      <div className="ai-tutor-page-container">
        {/* Top Split: Left Chat Conversation, Right Circuit Context */}
        <div className="tutor-full-split-layout">
          {/* Left Chat Window */}
          <div className="tutor-chat-pane">
            <div className="chat-pane-header">
              <div className="tutor-avatar-box">
                <Bot size={22} className="text-teal" />
              </div>
              <div className="tutor-header-info">
                <h3>SAMBHAV Quantum Tutor</h3>
                <span className="tutor-status-text">
                  <span className="online-dot" /> Connected to Quantum Engine
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="chat-messages-scroll">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                  <div className="message-bubble">
                    <div className="message-header-meta">
                      <span className="sender-name">{msg.sender === "ai" ? "AI Quantum Tutor" : "You"}</span>
                      {msg.source && (
                        <span className={`source-pill ${msg.source === "llm" ? "pill-llm" : "pill-fallback"}`}>
                          {msg.source === "llm" ? "LLM Powered" : "Physics Engine"}
                        </span>
                      )}
                      <span className="message-time">{msg.timestamp}</span>
                    </div>

                    <p className="message-body-text">{msg.text}</p>

                    {/* Concept Tags */}
                    {msg.concepts && msg.concepts.length > 0 && (
                      <div className="message-concepts-row">
                        <span className="concepts-label">Concepts:</span>
                        {msg.concepts.map((c) => (
                          <span key={c} className="concept-pill-tag">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="message-suggestions-box">
                        <span className="sugg-title">
                          <Lightbulb size={13} className="text-amber" /> Explore Further:
                        </span>
                        <div className="sugg-buttons">
                          {msg.suggestions.map((sugg) => (
                            <button
                              key={sugg}
                              className="sugg-prompt-btn"
                              onClick={() => handleSend(sugg)}
                              disabled={isLoading}
                            >
                              {sugg}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="chat-message-row ai">
                  <div className="message-bubble loading-bubble">
                    <span className="loading-dots">
                      <span>•</span>
                      <span>•</span>
                      <span>•</span>
                    </span>
                    <span>AI Tutor is analyzing quantum state amplitudes...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts Bar */}
            <div className="chat-quick-prompts-bar">
              <button
                className="quick-chip-btn"
                onClick={() => handleSend("Why did this circuit create entanglement?")}
                disabled={isLoading}
              >
                Why Entanglement?
              </button>
              <button
                className="quick-chip-btn"
                onClick={() => handleSend("Explain the measurement probabilities")}
                disabled={isLoading}
              >
                Explain Probabilities
              </button>
              <button
                className="quick-chip-btn"
                onClick={() => handleSend("How does the Hadamard gate work?")}
                disabled={isLoading}
              >
                Role of H Gate
              </button>
            </div>

            {/* Query Input Bar */}
            <form
              className="chat-input-container"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                className="chat-input-field"
                placeholder="Ask any quantum computing question (e.g. Why is the state non-separable?)..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={isLoading || !inputQuery.trim()}
                title="Send question"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Right Circuit Context Pane */}
          <div className="tutor-context-pane">
            <div className="context-pane-header">
              <BrainCircuit size={18} className="text-teal" />
              <h4>Active Circuit Context</h4>
            </div>

            <div className="context-preset-selector">
              <span>Change Circuit Context:</span>
              <div className="context-preset-chips">
                {PRESET_CIRCUITS.map((item, idx) => (
                  <button
                    key={item.name}
                    className="preset-chip-btn"
                    onClick={() => handleLoadPreset(idx)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="context-canvas-box">
              <CircuitBuilder circuit={circuit} onChange={setCircuit} />
            </div>

            {/* Dirac notation banner */}
            <div className="context-dirac-box">
              <span className="dirac-heading">Statevector (Dirac Notation):</span>
              <code>{result?.dirac || "|ψ⟩ = 0.707|00⟩ + 0.707|11⟩"}</code>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
