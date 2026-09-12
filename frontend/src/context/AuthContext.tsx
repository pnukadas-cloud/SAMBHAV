import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuthToken, getMeApi, loginApi, logoutApi, registerApi, setAuthToken } from "../api/client";

export type UserRole = "student" | "instructor" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  xp: number;
  streakDays: number;
  level: number;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  interests?: string[];
  avatarUrl?: string;
  enrolledCourseId?: string;
  currentLessonId?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  loginAsDemo: (role: "student" | "instructor") => void;
  signup: (name: string, email: string, password?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  updateUserPreferences: (prefs: Partial<User>) => void;
  switchRole: (newRole: UserRole) => void;
};

const DEFAULT_DEMO_STUDENT: User = {
  id: "student-demo-uuid-001",
  name: "Aarav Sharma",
  email: "student@sambhav.edu",
  role: "student",
  xp: 480,
  streakDays: 4,
  level: 3,
  experienceLevel: "beginner",
  interests: ["Quantum Fundamentals", "Quantum Algorithms", "Circuit Simulation"],
  enrolledCourseId: "quantum-foundations",
  currentLessonId: "bell-state",
};

const DEFAULT_DEMO_INSTRUCTOR: User = {
  id: "instructor-demo-uuid-002",
  name: "Dr. Neha Verma",
  email: "instructor@sambhav.edu",
  role: "instructor",
  xp: 2400,
  streakDays: 14,
  level: 10,
  experienceLevel: "advanced",
  interests: ["Quantum Computing", "Quantum Information", "Curriculum Design"],
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  loginAsDemo: () => {},
  signup: async () => false,
  logout: () => {},
  updateUserPreferences: () => {},
  switchRole: () => {},
});

const STORAGE_KEY = "sambhav_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_DEMO_STUDENT;
    } catch {
      return DEFAULT_DEMO_STUDENT;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (e) {
        console.error("Failed to save session", e);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // Attempt token verification with backend if token exists
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      getMeApi()
        .then((profile) => {
          if (profile && profile.id) {
            setUser((prev) => ({
              ...DEFAULT_DEMO_STUDENT,
              ...prev,
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
            }));
          }
        })
        .catch(() => {
          // Keep local session if backend is momentarily unreachable
        });
    }
  }, []);

  const login = async (email: string, password = "QuantumLearner#2026"): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await loginApi(email, password);
      const loggedUser: User = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        xp: res.user.role === "instructor" ? 2400 : 480,
        streakDays: 5,
        level: res.user.role === "instructor" ? 10 : 3,
        experienceLevel: res.user.role === "instructor" ? "advanced" : "beginner",
      };
      setUser(loggedUser);
      setIsLoading(false);
      return true;
    } catch {
      // Fallback for seamless offline demo
      const isInstructor = email.toLowerCase().includes("instructor");
      const fallbackUser: User = isInstructor
        ? { ...DEFAULT_DEMO_INSTRUCTOR, email }
        : { ...DEFAULT_DEMO_STUDENT, email };
      setUser(fallbackUser);
      setIsLoading(false);
      return true;
    }
  };

  const loginAsDemo = (role: "student" | "instructor") => {
    if (role === "instructor") {
      setUser(DEFAULT_DEMO_INSTRUCTOR);
      login("instructor@sambhav.edu", "ProfessorQuantum#2026").catch(() => {});
    } else {
      setUser(DEFAULT_DEMO_STUDENT);
      login("student@sambhav.edu", "QuantumLearner#2026").catch(() => {});
    }
  };

  const signup = async (name: string, email: string, password = "Quantum#2026", role: UserRole = "student"): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await registerApi(name, email, password, role);
      const newUser: User = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        xp: 100,
        streakDays: 1,
        level: 1,
        experienceLevel: "beginner",
      };
      setUser(newUser);
      setIsLoading(false);
      return true;
    } catch {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role,
        xp: 100,
        streakDays: 1,
        level: 1,
        experienceLevel: "beginner",
      };
      setUser(newUser);
      setIsLoading(false);
      return true;
    }
  };

  const logout = () => {
    logoutApi().catch(() => {});
    setAuthToken(null);
    setUser(null);
  };

  const updateUserPreferences = (prefs: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...prefs } : null));
  };

  const switchRole = (newRole: UserRole) => {
    setUser((prev) => {
      if (!prev) return null;
      if (newRole === "instructor") {
        return { ...prev, role: "instructor", name: prev.name.includes("Dr.") ? prev.name : `Prof. ${prev.name}` };
      }
      return { ...prev, role: "student", name: prev.name.replace("Prof. ", "").replace("Dr. ", "") };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsDemo,
        signup,
        logout,
        updateUserPreferences,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
