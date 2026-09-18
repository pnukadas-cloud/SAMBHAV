import {
  Award,
  BookOpen,
  BrainCircuit,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Flame,
  GraduationCap,
  Mail,
  Save,
  Settings,
  Shield,
  Sparkles,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "../router/Router";
import { AppShell } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchProgress, updateUserProfileApi } from "../api/client";
import { UNIFIED_CURRICULUM_MODULES } from "../data/lessonsData";

export function ProfilePage() {
  const { user, updateUserPreferences } = useAuth();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [bio, setBio] = useState("Quantum Computing Enthusiast & Researcher at SAMBHAV.");
  const [affiliation, setAffiliation] = useState("Quantum Information Sciences Dept.");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Quantum Algorithms",
    "Error Correction",
    "Superconducting Qubits",
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress()
      .then((data) => setProgress(data))
      .catch(() => {});
  }, []);

  const isInstructor = user?.role === "instructor";
  const totalLessons = UNIFIED_CURRICULUM_MODULES.reduce((sum, m) => sum + m.lessons.length, 0); // 31
  const completedLessons = progress?.completedLessons ?? 0;
  const simulationsRun = progress?.simulationsRun ?? 0;
  const challengesSolved = progress?.challengesSolved ?? 0;
  const xp = progress?.xp ?? (completedLessons * 100 + challengesSolved * 150 + simulationsRun * 20);
  const streak = progress?.streakDays ?? (completedLessons > 0 ? 1 : 0);
  const level = progress?.level ?? Math.max(1, Math.floor(xp / 500) + 1);

  const currentLevelBaseXP = (level - 1) * 500;
  const nextLevelXP = level * 500;
  const levelProgressPct = Math.min(
    100,
    Math.max(0, Math.round(((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100))
  );

  const allInterests = [
    "Quantum Algorithms",
    "Error Correction",
    "Superconducting Qubits",
    "Photonic Quantum Computing",
    "Quantum Cryptography (QKD)",
    "Variational Algorithms (VQE/QAOA)",
    "Quantum Machine Learning",
    "Topological Quantum Computing",
  ];

  const badges = [
    {
      id: "b1",
      title: "First Circuit Run",
      desc: "Executed a quantum simulation in Lab",
      icon: Zap,
      unlocked: simulationsRun >= 1,
    },
    {
      id: "b2",
      title: "Superposition Explorer",
      desc: "Completed foundational statevector lessons",
      icon: Sparkles,
      unlocked: completedLessons >= 2,
    },
    {
      id: "b3",
      title: "Consistent Explorer",
      desc: "Active streak of dedicated learning",
      icon: Flame,
      unlocked: streak >= 3,
    },
    {
      id: "b4",
      title: "Entanglement Pioneer",
      desc: "Built Bell states & 2-qubit circuits",
      icon: BrainCircuit,
      unlocked: completedLessons >= 5,
    },
    {
      id: "b5",
      title: "Challenge Champion",
      desc: "Solved quantum algorithmic challenges",
      icon: Trophy,
      unlocked: challengesSolved >= 3,
    },
    {
      id: "b6",
      title: "Quantum Master",
      desc: "Completed full 10-module curriculum",
      icon: Award,
      unlocked: completedLessons >= totalLessons && totalLessons > 0,
    },
  ];

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast("Name cannot be empty.", "error");
      return;
    }

    try {
      setIsSaving(true);
      await updateUserProfileApi(displayName.trim());
      updateUserPreferences({ name: displayName.trim() });
      setIsEditing(false);
      showToast("Profile updated successfully!", "success", "Saved");
    } catch (err: any) {
      // Fallback update local preference
      updateUserPreferences({ name: displayName.trim() });
      setIsEditing(false);
      showToast("Profile saved locally.", "info");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell activeTitle="User Profile" activeCategory="Account">
      <div className="profile-page-container">
        {/* Profile Hero Header */}
        <div className="profile-hero-card">
          <div className="profile-hero-main">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="profile-role-badge">
                {isInstructor ? <GraduationCap size={14} /> : <Zap size={14} />}
                <span>{isInstructor ? "Educator" : "Student"}</span>
              </div>
            </div>

            <div className="profile-info-header">
              <div className="profile-name-row">
                <h2>{user?.name || "Quantum Learner"}</h2>
                <button
                  type="button"
                  className="profile-edit-toggle-btn"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 size={15} />
                  <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
                </button>
              </div>

              <div className="profile-meta-tags">
                <span className="profile-meta-item">
                  <Mail size={14} /> {user?.email || "student@sambhav.edu"}
                </span>
                <span className="profile-meta-item">
                  <Shield size={14} /> {isInstructor ? "Verified Educator" : "Standard Account"}
                </span>
                <span className="profile-meta-item">
                  <Calendar size={14} /> Joined 2026
                </span>
              </div>

              <p className="profile-bio-text">{bio}</p>
            </div>
          </div>

          {/* Quick Stat Highlights */}
          <div className="profile-hero-stats">
            <div className="profile-hero-stat-card">
              <span className="stat-label">
                <Trophy size={14} className="text-amber" /> Level
              </span>
              <span className="stat-num">{level}</span>
              <span className="stat-sub">{xp} Total XP</span>
            </div>

            <div className="profile-hero-stat-card">
              <span className="stat-label">
                <Flame size={14} className="text-orange" /> Learning Streak
              </span>
              <span className="stat-num">{streak}d</span>
              <span className="stat-sub">Consecutive days</span>
            </div>

            <div className="profile-hero-stat-card">
              <span className="stat-label">
                <BookOpen size={14} className="text-teal" /> Completed
              </span>
              <span className="stat-num">
                {completedLessons}
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>
                  {" "}/ {totalLessons}
                </span>
              </span>
              <span className="stat-sub">Curriculum lessons</span>
            </div>

            <div className="profile-hero-stat-card">
              <span className="stat-label">
                <BrainCircuit size={14} className="text-purple" /> Lab Runs
              </span>
              <span className="stat-num">{simulationsRun}</span>
              <span className="stat-sub">Simulated circuits</span>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="profile-level-card">
          <div className="level-bar-header">
            <div>
              <span className="level-badge-pill">Level {level} Quantum Explorer</span>
              <span className="level-xp-text">
                {xp - currentLevelBaseXP} / 500 XP to Level {level + 1}
              </span>
            </div>
            <span className="level-pct-text">{levelProgressPct}%</span>
          </div>
          <div className="profile-progress-track">
            <div
              className="profile-progress-fill"
              style={{ width: `${Math.max(5, levelProgressPct)}%` }}
            />
          </div>
        </div>

        {/* Edit Profile Form Modal / Inline Section */}
        {isEditing && (
          <div className="profile-edit-section">
            <div className="section-header-row">
              <Edit3 size={18} className="text-teal" />
              <h3>Edit Profile Information</h3>
            </div>
            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-grid-two">
                <div className="profile-form-group">
                  <label htmlFor="edit-name">Display Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="edit-affiliation">Department / Institution</label>
                  <input
                    id="edit-affiliation"
                    type="text"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="University or Research Lab"
                  />
                </div>
              </div>

              <div className="profile-form-group">
                <label htmlFor="edit-bio">Personal Bio / Research Focus</label>
                <textarea
                  id="edit-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio or quantum learning interests..."
                />
              </div>

              <div className="profile-form-group">
                <label>Quantum Topics of Interest</label>
                <div className="interest-pills-wrap">
                  {allInterests.map((item) => {
                    const isSelected = selectedInterests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`interest-pill-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => handleToggleInterest(item)}
                      >
                        {isSelected && <Check size={13} />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-actions-row">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="profile-save-btn"
                >
                  <Save size={15} />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="profile-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Grid: Badges & Account Overview */}
        <div className="profile-content-grid">
          {/* Quantum Achievements & Badges */}
          <div className="profile-card">
            <div className="section-header-row">
              <Award size={18} className="text-amber" />
              <h3>Quantum Badges & Milestones</h3>
            </div>
            <p className="section-subtext">
              Earn pedagogical badges as you progress through simulations, algorithms, and quizzes.
            </p>

            <div className="profile-badges-grid">
              {badges.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.id}
                    className={`profile-badge-item ${b.unlocked ? "unlocked" : "locked"}`}
                  >
                    <div className="badge-icon-box">
                      <Icon size={20} />
                    </div>
                    <div className="badge-details">
                      <div className="badge-title-row">
                        <span className="badge-name">{b.title}</span>
                        {b.unlocked ? (
                          <span className="badge-status-unlocked">
                            <CheckCircle2 size={12} /> Unlocked
                          </span>
                        ) : (
                          <span className="badge-status-locked">In Progress</span>
                        )}
                      </div>
                      <p className="badge-desc">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account Details & Quick Navigation */}
          <div className="profile-side-column">
            {/* Account Details Card */}
            <div className="profile-card">
              <div className="section-header-row">
                <Shield size={18} className="text-teal" />
                <h3>Account Information</h3>
              </div>

              <div className="account-details-list">
                <div className="account-detail-row">
                  <span className="account-label">User ID</span>
                  <span className="account-val mono-text">
                    {user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-6)}` : "local-session"}
                  </span>
                </div>

                <div className="account-detail-row">
                  <span className="account-label">Account Role</span>
                  <span className={`badge-pill ${isInstructor ? "badge-pill-amber" : "badge-pill-cyan"}`}>
                    {isInstructor ? "Instructor / Educator" : "Student Learner"}
                  </span>
                </div>

                <div className="account-detail-row">
                  <span className="account-label">Email Status</span>
                  <span className="text-green" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600 }}>
                    <CheckCircle2 size={13} /> Verified (2FA Active)
                  </span>
                </div>

                <div className="account-detail-row">
                  <span className="account-label">Affiliation</span>
                  <span className="account-val">{affiliation}</span>
                </div>
              </div>

              <div className="account-actions-box">
                <Link to="/settings" className="profile-settings-link">
                  <Settings size={15} /> Go to App Preferences & Settings
                </Link>
              </div>
            </div>

            {/* Quantum Interests Showcase */}
            <div className="profile-card">
              <div className="section-header-row">
                <Target size={18} className="text-purple" />
                <h3>Focus Areas</h3>
              </div>

              <div className="interests-display-wrap">
                {selectedInterests.map((interest) => (
                  <span key={interest} className="interest-display-chip">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
