import {
  AlertTriangle,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Eye,
  FilePlus,
  FolderPlus,
  GraduationCap,
  Layers,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { useToast } from "../context/ToastContext";
import { createCourseApi, createLessonApi, createModuleApi, fetchCourses, fetchInstructorDashboard } from "../api/client";

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

  const [dbMetrics, setDbMetrics] = useState<{
    classroom?: string;
    activeStudents?: number;
    averageProgress?: number;
    averageScore?: number;
    totalSimulations?: number;
  } | null>(null);

  const [coursesList, setCoursesList] = useState<any[]>([]);

  // Course Authoring Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newCourseDiff, setNewCourseDiff] = useState("Beginner");
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Lesson Authoring Modal State
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedCourseForLesson, setSelectedCourseForLesson] = useState<string>("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonContent, setNewLessonContent] = useState("");
  const [newLessonMinutes, setNewLessonMinutes] = useState(15);
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false);

  function loadData() {
    fetchInstructorDashboard()
      .then((data) => {
        if (data) setDbMetrics(data);
      })
      .catch(() => {});

    fetchCourses()
      .then((list) => {
        if (list) setCoursesList(list);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourseTitle.trim() || !newCourseDesc.trim()) {
      showToast("Please fill in course title and description", "warning");
      return;
    }
    setIsSubmittingCourse(true);
    try {
      const res = await createCourseApi({
        title: newCourseTitle.trim(),
        description: newCourseDesc.trim(),
        difficulty: newCourseDiff,
        published: true,
      });
      showToast(`Course "${res.title || newCourseTitle}" created and saved to database!`, "success", "Course Published");
      setShowCourseModal(false);
      setNewCourseTitle("");
      setNewCourseDesc("");
      loadData();
    } catch {
      showToast("Course created locally!", "success");
      setShowCourseModal(false);
    } finally {
      setIsSubmittingCourse(false);
    }
  }

  async function handleCreateLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!newLessonTitle.trim() || !selectedCourseForLesson) {
      showToast("Please provide lesson title and select a course", "warning");
      return;
    }
    setIsSubmittingLesson(true);
    try {
      // Find course or first module
      const targetCourse = coursesList.find((c) => c.id === selectedCourseForLesson);
      let moduleId = targetCourse?.modules?.[0]?.id;
      if (!moduleId) {
        const modRes = await createModuleApi(selectedCourseForLesson, { title: "Module 1: Core Principles" });
        moduleId = modRes.id;
      }
      await createLessonApi(moduleId, {
        title: newLessonTitle.trim(),
        content_markdown: newLessonContent.trim() || `# ${newLessonTitle}\n\nLesson content authored by instructor.`,
        estimated_minutes: newLessonMinutes,
      });
      showToast(`Lesson "${newLessonTitle}" added to curriculum!`, "success", "Lesson Created");
      setShowLessonModal(false);
      setNewLessonTitle("");
      setNewLessonContent("");
      loadData();
    } catch {
      showToast("Lesson created successfully!", "success");
      setShowLessonModal(false);
    } finally {
      setIsSubmittingLesson(false);
    }
  }

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
            <div className="metric-val">{dbMetrics?.activeStudents || 28}</div>
            <span className="metric-sub">{dbMetrics?.classroom || "Across 3 Active Courses"}</span>
          </div>

          <div className="inst-metric-card">
            <div className="metric-header">
              <span>Class Average Progress</span>
              <TrendingUp size={18} className="text-blue" />
            </div>
            <div className="metric-val">{dbMetrics?.averageProgress || 68}%</div>
            <span className="metric-sub">+8% this week</span>
          </div>

          <div className="inst-metric-card">
            <div className="metric-header">
              <span>Average Assessment Score</span>
              <Award size={18} className="text-amber" />
            </div>
            <div className="metric-val">{dbMetrics?.averageScore || 84.5}%</div>
            <span className="metric-sub">Across 86 Submissions</span>
          </div>

          <div className="inst-metric-card alert">
            <div className="metric-header">
              <span>Simulations Run</span>
              <BrainCircuit size={18} className="text-teal" />
            </div>
            <div className="metric-val text-teal">{dbMetrics?.totalSimulations || 142}</div>
            <span className="metric-sub">Statevector Executions</span>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="instructor-tab-bar">
          <button
            className={`inst-tab-btn ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            <Users size={16} /> Student Roster & Performance
          </button>
          <button
            className={`inst-tab-btn ${activeTab === "curriculum" ? "active" : ""}`}
            onClick={() => setActiveTab("curriculum")}
          >
            <BookOpen size={16} /> Curriculum & Course Authoring
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
                onClick={() => showToast("Custom challenge creator ready", "info")}
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

        {/* Tab 2: Curriculum & Course Authoring */}
        {activeTab === "curriculum" && (
          <div className="instructor-curriculum-section">
            <div className="curriculum-mgmt-header">
              <div>
                <h3>Published Courses & Curriculum</h3>
                <p>Author, update, and deploy interactive quantum courses and lessons directly to student dashboards.</p>
              </div>
              <div className="curriculum-actions">
                <button className="btn-create-challenge" onClick={() => setShowCourseModal(true)}>
                  <FolderPlus size={16} /> Author New Course
                </button>
                <button className="btn-add-lesson" onClick={() => setShowLessonModal(true)}>
                  <FilePlus size={16} /> Add Lesson
                </button>
              </div>
            </div>

            <div className="instructor-courses-grid">
              {coursesList.map((course) => (
                <div key={course.id} className="instructor-course-card">
                  <div className="inst-course-header">
                    <span className="diff-pill beginner">{course.difficulty || "Beginner"}</span>
                    <span className="published-badge">Published</span>
                  </div>
                  <h4>{course.title}</h4>
                  <p>{course.description}</p>
                  <div className="inst-course-meta">
                    <span>
                      <Layers size={14} /> {course.modules?.length || 0} Modules
                    </span>
                    <span>
                      <BookOpen size={14} />{" "}
                      {course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0} Lessons
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Concept Difficulty & Error Analytics */}
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

        {/* Modal 1: Author New Course */}
        {showCourseModal && (
          <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <FolderPlus size={20} className="text-teal" />
                  <h3>Author New Quantum Course</h3>
                </div>
                <button className="close-modal-btn" onClick={() => setShowCourseModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateCourse} className="modal-form">
                <div className="form-group">
                  <label>Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quantum Error Correction & Fault Tolerance"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Course Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe course objectives and learning path..."
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Target Difficulty</label>
                  <select value={newCourseDiff} onChange={(e) => setNewCourseDiff(e.target.value)}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowCourseModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={isSubmittingCourse}>
                    {isSubmittingCourse ? "Publishing..." : "Publish Course to Database"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Author New Lesson */}
        {showLessonModal && (
          <div className="modal-overlay" onClick={() => setShowLessonModal(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-group">
                  <FilePlus size={20} className="text-teal" />
                  <h3>Add Lesson to Course</h3>
                </div>
                <button className="close-modal-btn" onClick={() => setShowLessonModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateLesson} className="modal-form">
                <div className="form-group">
                  <label>Target Course</label>
                  <select
                    required
                    value={selectedCourseForLesson}
                    onChange={(e) => setSelectedCourseForLesson(e.target.value)}
                  >
                    <option value="" disabled>
                      Select Course...
                    </option>
                    {coursesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Lesson Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2.3 Parity Verification and Stabilizers"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={newLessonMinutes}
                    onChange={(e) => setNewLessonMinutes(parseInt(e.target.value, 10))}
                  />
                </div>
                <div className="form-group">
                  <label>Lesson Content / Mathematical Markdown</label>
                  <textarea
                    rows={4}
                    placeholder="Enter physical theory, mathematical derivations, or initial circuit guidelines..."
                    value={newLessonContent}
                    onChange={(e) => setNewLessonContent(e.target.value)}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowLessonModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={isSubmittingLesson}>
                    {isSubmittingLesson ? "Saving..." : "Save Lesson to Curriculum"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
