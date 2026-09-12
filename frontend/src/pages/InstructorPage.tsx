import {
  AlertTriangle,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { useToast } from "../context/ToastContext";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  course: string;
  progress: number;
  challengesSolved: number;
  avgScore: number;
  lastActive: string;
  weakConcept: string;
  status: "on-track" | "needs-help" | "excelling";
};

const SEEDED_STUDENTS: StudentRow[] = [
  {
    id: "s1",
    name: "Aarav Sharma",
    email: "aarav.s@iitb.ac.in",
    course: "Quantum Foundations",
    progress: 75,
    challengesSolved: 5,
    avgScore: 92,
    lastActive: "10 mins ago",
    weakConcept: "None (Excelling)",
    status: "excelling",
  },
  {
    id: "s2",
    name: "Meera Patel",
    email: "meera.p@iitd.ac.in",
    course: "Quantum Foundations",
    progress: 42,
    challengesSolved: 3,
    avgScore: 78,
    lastActive: "1 hour ago",
    weakConcept: "Controlled-Z Phase Kickback",
    status: "on-track",
  },
  {
    id: "s3",
    name: "Ishaan Verma",
    email: "ishaan.v@bits.ac.in",
    course: "Quantum Foundations",
    progress: 25,
    challengesSolved: 1,
    avgScore: 58,
    lastActive: "2 days ago",
    weakConcept: "Entanglement & Bell Pairs",
    status: "needs-help",
  },
  {
    id: "s4",
    name: "Ananya Iyer",
    email: "ananya.i@iitm.ac.in",
    course: "Quantum Logic & Gates",
    progress: 88,
    challengesSolved: 6,
    avgScore: 96,
    lastActive: "30 mins ago",
    weakConcept: "None (Excelling)",
    status: "excelling",
  },
  {
    id: "s5",
    name: "Rohan Gupta",
    email: "rohan.g@nitk.ac.in",
    course: "Quantum Foundations",
    progress: 30,
    challengesSolved: 2,
    avgScore: 62,
    lastActive: "Yesterday",
    weakConcept: "Inverted CX Target Wires",
    status: "needs-help",
  },
];

export function InstructorPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"students" | "analytics" | "curriculum">("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);

  const filteredStudents = SEEDED_STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.weakConcept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell activeTitle="Instructor Analytics & Classroom" activeCategory="Teaching">
      <div className="instructor-page-container">
        {/* Top 4 Metrics */}
        <div className="instructor-metrics-grid">
          <div className="inst-metric-card">
            <div className="metric-header">
              <span>Active Students</span>
              <Users size={18} className="text-teal" />
            </div>
            <div className="metric-val">28</div>
            <span className="metric-sub">Across 3 Active Courses</span>
          </div>

          <div className="inst-metric-card">
            <div className="metric-header">
              <span>Class Average Progress</span>
              <TrendingUp size={18} className="text-blue" />
            </div>
            <div className="metric-val">54%</div>
            <span className="metric-sub">+8% this week</span>
          </div>

          <div className="inst-metric-card">
            <div className="metric-header">
              <span>Average Assessment Score</span>
              <Award size={18} className="text-amber" />
            </div>
            <div className="metric-val">78%</div>
            <span className="metric-sub">Across 86 Submissions</span>
          </div>

          <div className="inst-metric-card alert">
            <div className="metric-header">
              <span>Students Needing Support</span>
              <AlertTriangle size={18} className="text-coral" />
            </div>
            <div className="metric-val text-coral">4</div>
            <span className="metric-sub">Struggling with Entanglement</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="instructor-tabs-bar">
          <button
            className={`inst-tab-btn ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            <Users size={16} /> Student Roster & Performance
          </button>
          <button
            className={`inst-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <TrendingUp size={16} /> Concept Difficulty & Error Analytics
          </button>
        </div>

        {/* Tab 1: Student Roster Table */}
        {activeTab === "students" && (
          <div className="student-roster-section">
            <div className="table-controls-row">
              <div className="table-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter by student name, email, or weak concept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                className="btn-create-challenge"
                onClick={() => showToast("Custom challenge creator opened", "info")}
              >
                <Plus size={15} /> Create Class Challenge
              </button>
            </div>

            <div className="students-table-card">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Enrolled Course</th>
                    <th>Progress</th>
                    <th>Challenges</th>
                    <th>Avg Score</th>
                    <th>Diagnostic Note / Weak Concept</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} onClick={() => setSelectedStudent(s)} className="student-table-row">
                      <td>
                        <div className="student-profile-cell">
                          <div className="student-avatar-small">{s.name.charAt(0)}</div>
                          <div>
                            <strong>{s.name}</strong>
                            <span className="student-email">{s.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{s.course}</td>
                      <td>
                        <div className="table-progress-cell">
                          <span>{s.progress}%</span>
                          <div className="table-progress-track">
                            <div className="track-fill" style={{ width: `${s.progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>{s.challengesSolved} Solved</td>
                      <td>
                        <strong>{s.avgScore}%</strong>
                      </td>
                      <td>
                        <span className={`diagnostic-pill ${s.status}`}>{s.weakConcept}</span>
                      </td>
                      <td>
                        <span className={`status-badge-pill ${s.status}`}>
                          {s.status === "excelling" && "🌟 Excelling"}
                          {s.status === "on-track" && "✓ On Track"}
                          {s.status === "needs-help" && "⚠️ Needs Help"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Concept Difficulty & Error Analytics */}
        {activeTab === "analytics" && (
          <div className="instructor-analytics-grid">
            {/* Topic Difficulty Ranking */}
            <div className="analytics-card">
              <div className="card-header">
                <BrainCircuit size={18} className="text-purple" />
                <h4>Curriculum Difficulty Heatmap</h4>
              </div>
              <div className="topic-difficulty-list">
                {[
                  { topic: "Quantum Entanglement (Bell States)", failRate: "46%", difficulty: "High", avgScore: 62 },
                  { topic: "Controlled-Z Phase Kickback", failRate: "38%", difficulty: "High", avgScore: 68 },
                  { topic: "Bloch Sphere Continuous Rotations", failRate: "24%", difficulty: "Medium", avgScore: 76 },
                  { topic: "Pauli-X, Y, Z Matrix Actions", failRate: "12%", difficulty: "Low", avgScore: 89 },
                  { topic: "Hadamard Superposition Basics", failRate: "6%", difficulty: "Low", avgScore: 94 },
                ].map((item) => (
                  <div key={item.topic} className="difficulty-item">
                    <div className="diff-item-top">
                      <span className="topic-name">{item.topic}</span>
                      <span className="topic-rate">Fail/Retry Rate: {item.failRate}</span>
                    </div>
                    <div className="diff-bar-track">
                      <div
                        className={`diff-bar-fill ${
                          item.difficulty === "High" ? "bg-coral" : item.difficulty === "Medium" ? "bg-amber" : "bg-teal"
                        }`}
                        style={{ width: `${100 - item.avgScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Misconceptions */}
            <div className="analytics-card">
              <div className="card-header">
                <AlertTriangle size={18} className="text-coral" />
                <h4>Top 3 Automated Circuit Misconceptions Detected</h4>
              </div>
              <div className="misconceptions-list">
                <div className="misconception-item">
                  <span className="miscon-num">1</span>
                  <div className="miscon-text">
                    <h5>Inverting CX Control & Target Wires</h5>
                    <p>
                      Students frequently place the control dot on qubit 1 instead of qubit 0 when trying to create |Φ⁺⟩, producing (|00⟩+|10⟩)/√2 instead of the entangled state.
                    </p>
                  </div>
                </div>

                <div className="misconception-item">
                  <span className="miscon-num">2</span>
                  <div className="miscon-text">
                    <h5>Missing Measurement Gates</h5>
                    <p>
                      Simulating without measurement yields pure statevectors, but students expect discrete shot samples in hardware mode.
                    </p>
                  </div>
                </div>

                <div className="misconception-item">
                  <span className="miscon-num">3</span>
                  <div className="miscon-text">
                    <h5>Confusing Phase Shifts with Probabilities</h5>
                    <p>
                      Applying a Z or S gate alone leaves measurement probabilities identical (50/50) until surrounded by Hadamard interference.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
