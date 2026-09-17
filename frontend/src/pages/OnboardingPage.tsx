import {
  ArrowRight,
  Atom,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Compass,
  Cpu,
  GraduationCap,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { useLocation, useNavigate, validateReturnTo } from "../router/Router";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUserPreferences } = useAuth();
  const { showToast } = useToast();

  const searchParams = new URLSearchParams(location.search || window.location.search);
  const rawReturnTo = searchParams.get("returnTo") || searchParams.get("redirect") || "";
  const returnToDestination = validateReturnTo(rawReturnTo, "");

  const [step, setStep] = useState<1 | 2>(1);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Quantum Fundamentals",
    "Quantum Entanglement",
  ]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleFinish = () => {
    updateUserPreferences({
      experienceLevel: level,
      interests: selectedInterests,
      enrolledCourseId: "quantum-foundations",
      currentLessonId: "qubit-basics",
    });
    showToast("Personalized learning path generated!", "success", "Welcome Aboard");
    navigate(returnToDestination || "/dashboard");
  };

  return (
    <div className="onboarding-page-root">
      <div className="onboarding-card">
        {/* Progress Header */}
        <div className="onboarding-header">
          <div className="onboarding-brand">
            <Atom size={24} className="spin-slow" />
            <span>SAMBHAV</span>
          </div>
          <div className="onboarding-steps-indicator">
            <div className={`step-dot ${step >= 1 ? "active" : ""}`}>1</div>
            <div className="step-connector" />
            <div className={`step-dot ${step >= 2 ? "active" : ""}`}>2</div>
          </div>
        </div>

        {step === 1 && (
          <div className="onboarding-step-content">
            <span className="step-tag">Step 1 of 2</span>
            <h2>What is your experience with Quantum Computing?</h2>
            <p className="step-desc">
              We'll tune the AI tutor and curriculum depth to match your current background.
            </p>

            <div className="experience-options-grid">
              <div
                className={`experience-card ${level === "beginner" ? "selected" : ""}`}
                onClick={() => setLevel("beginner")}
              >
                <div className="exp-icon-box bg-teal-soft">
                  <Zap size={24} className="text-teal" />
                </div>
                <div className="exp-info">
                  <h3>Beginner / Curious Explorer</h3>
                  <p>New to quantum mechanics. Want intuitive visual models and step-by-step guidance.</p>
                </div>
                {level === "beginner" && <CheckCircle2 size={18} className="selected-check text-teal" />}
              </div>

              <div
                className={`experience-card ${level === "intermediate" ? "selected" : ""}`}
                onClick={() => setLevel("intermediate")}
              >
                <div className="exp-icon-box bg-blue-soft">
                  <BookOpen size={24} className="text-blue" />
                </div>
                <div className="exp-info">
                  <h3>Intermediate / Student</h3>
                  <p>Familiar with basic linear algebra, matrices, and Dirac bra-ket notations.</p>
                </div>
                {level === "intermediate" && <CheckCircle2 size={18} className="selected-check text-blue" />}
              </div>

              <div
                className={`experience-card ${level === "advanced" ? "selected" : ""}`}
                onClick={() => setLevel("advanced")}
              >
                <div className="exp-icon-box bg-purple-soft">
                  <Cpu size={24} className="text-purple" />
                </div>
                <div className="exp-info">
                  <h3>Advanced / Developer</h3>
                  <p>Experienced in quantum circuit design, Qiskit/PennyLane, and algorithm optimization.</p>
                </div>
                {level === "advanced" && <CheckCircle2 size={18} className="selected-check text-purple" />}
              </div>
            </div>

            <div className="onboarding-action-row">
              <button className="onboarding-next-btn" onClick={() => setStep(2)}>
                Continue to Goals <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step-content">
            <span className="step-tag">Step 2 of 2</span>
            <h2>What are you most excited to learn?</h2>
            <p className="step-desc">Select one or more topics to tailor your personalized recommendations.</p>

            <div className="interests-grid">
              {[
                { name: "Quantum Fundamentals", desc: "Qubits, Superposition & Measurement", icon: Atom },
                { name: "Quantum Gates & Logic", desc: "Pauli, Hadamard, Phase & Rotations", icon: BrainCircuit },
                { name: "Quantum Entanglement", desc: "Bell States, GHZ & Teleportation", icon: Sparkles },
                { name: "Quantum Algorithms", desc: "Grover, Deutsch-Jozsa & QPE", icon: Trophy },
                { name: "Qiskit Programming", desc: "Exporting & Executing Python Code", icon: Cpu },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedInterests.includes(item.name);
                return (
                  <div
                    key={item.name}
                    className={`interest-card ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleInterest(item.name)}
                  >
                    <Icon size={20} className={isSelected ? "text-teal" : "text-muted"} />
                    <div className="interest-text">
                      <h4>{item.name}</h4>
                      <span>{item.desc}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-teal interest-check" />}
                  </div>
                );
              })}
            </div>

            {/* Generated Path Preview */}
            <div className="generated-path-preview">
              <div className="preview-header">
                <Sparkles size={14} className="text-amber" />
                <span>AI Recommended Starting Path ({level.toUpperCase()}):</span>
              </div>
              <p>
                <strong>Quantum Foundations:</strong> Qubits → Superposition → Measurement → <strong>Building a Bell State (|Φ⁺⟩)</strong>
              </p>
            </div>

            <div className="onboarding-action-row split">
              <button className="onboarding-back-btn" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="onboarding-finish-btn" onClick={handleFinish}>
                Launch My Quantum Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
