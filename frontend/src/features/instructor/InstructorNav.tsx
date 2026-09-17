import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  FilePlus,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import React from "react";

export type InstructorTab =
  | "dashboard"
  | "curriculum"
  | "authoring"
  | "classes"
  | "learners"
  | "assessments"
  | "labs"
  | "analytics"
  | "copilot";

interface InstructorNavProps {
  activeTab: InstructorTab;
  onSelectTab: (tab: InstructorTab) => void;
  pendingSubmissionsCount?: number;
}

export function InstructorNav({ activeTab, onSelectTab, pendingSubmissionsCount = 0 }: InstructorNavProps) {
  const navItems: { id: InstructorTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "curriculum", label: "Curriculum", icon: <Layers size={18} /> },
    { id: "authoring", label: "Lesson Builder", icon: <FilePlus size={18} /> },
    { id: "classes", label: "Classes & Cohorts", icon: <GraduationCap size={18} /> },
    { id: "learners", label: "Learners", icon: <Users size={18} /> },
    { id: "assessments", label: "Assessments", icon: <Trophy size={18} /> },
    {
      id: "labs",
      label: "Lab Assignments",
      icon: <BrainCircuit size={18} />,
      badge: pendingSubmissionsCount > 0 ? pendingSubmissionsCount : undefined,
    },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
    { id: "copilot", label: "AI Copilot", icon: <Sparkles size={18} /> },
  ];

  return (
    <nav className="instructor-sidebar-nav" aria-label="Instructor Navigation">
      <div className="instructor-nav-heading">Educator Workspace</div>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`instructor-nav-link ${isActive ? "active" : ""}`}
            onClick={() => onSelectTab(item.id)}
            style={{
              background: isActive ? "rgba(14, 165, 233, 0.12)" : "transparent",
              border: "none",
              borderLeft: isActive ? "3px solid #38bdf8" : "3px solid transparent",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              justifyContent: "space-between",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {item.icon}
              <span>{item.label}</span>
            </span>
            {item.badge !== undefined && (
              <span
                style={{
                  background: "#e11d48",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "10px",
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
