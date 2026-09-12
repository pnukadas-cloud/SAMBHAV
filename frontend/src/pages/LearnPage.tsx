import {
  ArrowRight,
  Atom,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  GraduationCap,
  Play,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import React from "react";
import { Link, useNavigate } from "../router/Router";
import { AppShell } from "../components/layout/AppShell";

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed?: boolean;
  current?: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  difficulty: string;
  estimatedHours: string;
  progress: number;
  modules: Module[];
}

export const COURSES_DATA: Course[] = [
  {
    id: "quantum-foundations",
    title: "Quantum Foundations",
    subtitle: "From Classical Bits to Quantum Superposition",
    difficulty: "Beginner",
    estimatedHours: "4 Hours",
    progress: 75,
    modules: [
      {
        id: "m1",
        title: "Module 1: Qubits & Superposition",
        lessons: [
          { id: "qubit-basics", title: "1.1 The Qubit & Bloch Sphere", duration: "12 mins", completed: true },
          { id: "superposition", title: "1.2 Creating Superposition with Hadamard (H)", duration: "15 mins", completed: true },
          { id: "measurement", title: "1.3 Measurement Collapse & The Born Rule", duration: "18 mins", completed: true },
        ],
      },
      {
        id: "m2",
        title: "Module 2: Entanglement & Bell States",
        lessons: [
          { id: "bell-state", title: "2.1 Building a Bell State (|Φ⁺⟩)", duration: "20 mins", current: true },
          { id: "ghz-state", title: "2.2 Multi-Qubit GHZ Entanglement", duration: "25 mins" },
        ],
      },
    ],
  },
  {
    id: "quantum-gates-logic",
    title: "Quantum Logic & Unitary Gates",
    subtitle: "Pauli Gates, Phase Shifts, and Rotations",
    difficulty: "Intermediate",
    estimatedHours: "6 Hours",
    progress: 20,
    modules: [
      {
        id: "m3",
        title: "Module 1: Single-Qubit Rotations",
        lessons: [
          { id: "pauli-gates", title: "1.1 Pauli-X, Y, Z Matrix Transformations", duration: "15 mins", completed: true },
          { id: "phase-gates", title: "1.2 Phase Shifts: S and T Gates", duration: "20 mins" },
          { id: "rotations", title: "1.3 Continuous Rotations (Rx, Ry, Rz)", duration: "25 mins" },
        ],
      },
      {
        id: "m4",
        title: "Module 2: Two-Qubit Controlled Gates",
        lessons: [
          { id: "controlled-gates", title: "2.1 CX, CZ and Phase Kickback", duration: "22 mins" },
          { id: "swap-gates", title: "2.2 SWAP Networks and Quantum Routing", duration: "18 mins" },
        ],
      },
    ],
  },
  {
    id: "quantum-algorithms",
    title: "Core Quantum Algorithms",
    subtitle: "Grover's Search, Deutsch-Jozsa, and Phase Estimation",
    difficulty: "Advanced",
    estimatedHours: "8 Hours",
    progress: 0,
    modules: [
      {
        id: "m5",
        title: "Module 1: Quantum Oracles & Interference",
        lessons: [
          { id: "deutsch-jozsa", title: "1.1 Deutsch-Jozsa Algorithm", duration: "30 mins" },
          { id: "grovers-search", title: "1.2 Grover's Amplitude Amplification", duration: "45 mins" },
        ],
      },
      {
        id: "m6",
        title: "Module 2: Protocols & Estimation",
        lessons: [
          { id: "teleportation", title: "2.1 Quantum Teleportation Protocol", duration: "35 mins" },
          { id: "superdense-coding", title: "2.2 Superdense Coding", duration: "25 mins" },
          { id: "qpe", title: "2.3 Quantum Phase Estimation (QPE)", duration: "50 mins" },
        ],
      },
    ],
  },
];

export function LearnPage() {
  const navigate = useNavigate();

  return (
    <AppShell activeTitle="Curriculum" activeCategory="Learning">
      <div className="learn-page-container">
        {/* Header Hero */}
        <div className="learn-header-banner">
          <div className="learn-header-text">
            <span className="learn-eyebrow">STRUCTURED CURRICULUM</span>
            <h2>Interactive Quantum Curriculum</h2>
            <p>
              Master quantum computing through structured modules combining theory, hands-on circuit simulation, and AI guidance.
            </p>
          </div>
          <div className="learn-header-stats">
            <div className="stat-pill">
              <strong>3</strong> Courses
            </div>
            <div className="stat-pill">
              <strong>12</strong> Interactive Lessons
            </div>
            <div className="stat-pill">
              <strong>18</strong> Hours Content
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="courses-list-stack">
          {COURSES_DATA.map((course) => (
            <div key={course.id} className="course-card-expanded">
              {/* Course Header */}
              <div className="course-card-header">
                <div className="course-header-left">
                  <span className={`difficulty-badge ${course.difficulty.toLowerCase()}`}>
                    {course.difficulty}
                  </span>
                  <h3>{course.title}</h3>
                  <p className="course-subtitle">{course.subtitle}</p>
                </div>

                <div className="course-header-right">
                  <div className="course-progress-ring">
                    <span className="prog-val">{course.progress}%</span>
                    <span className="prog-lbl">Completed</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="course-prog-track">
                <div className="track-fill" style={{ width: `${course.progress}%` }} />
              </div>

              {/* Modules & Lessons List */}
              <div className="course-modules-list">
                {course.modules.map((mod) => (
                  <div key={mod.id} className="module-group">
                    <h4 className="module-title">{mod.title}</h4>
                    <div className="lessons-grid">
                      {mod.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`lesson-card-item ${lesson.completed ? "completed" : ""} ${
                            lesson.current ? "current" : ""
                          }`}
                          onClick={() => navigate(`/learn/${course.id}/${lesson.id}`)}
                        >
                          <div className="lesson-item-left">
                            {lesson.completed ? (
                              <CheckCircle2 size={18} className="text-teal" />
                            ) : lesson.current ? (
                              <Play size={18} className="text-amber" />
                            ) : (
                              <BookOpen size={18} className="text-muted" />
                            )}
                            <div className="lesson-item-text">
                              <span className="lesson-item-title">{lesson.title}</span>
                              <span className="lesson-item-dur">
                                <Clock size={12} /> {lesson.duration}
                              </span>
                            </div>
                          </div>

                          <div className="lesson-item-right">
                            {lesson.completed && <span className="status-tag completed">Completed</span>}
                            {lesson.current && <span className="status-tag current">Resume</span>}
                            {!lesson.completed && !lesson.current && (
                              <span className="status-tag start">Start</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
