import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAuthToken,
  getMeApi,
  loginRequestOtpApi,
  logoutApi,
  OtpInitiatedResponse,
  registerRequestOtpApi,
  resendOtpApi,
  setAuthToken,
  verifyOtpApi,
} from "../api/client";

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
  initiateLogin: (email: string, password: string) => Promise<OtpInitiatedResponse>;
  verifyOtp: (sessionToken: string, otpCode: string) => Promise<User>;
  resendOtp: (sessionToken: string) => Promise<OtpInitiatedResponse>;
  initiateSignup: (name: string, email: string, password: string, role?: UserRole) => Promise<OtpInitiatedResponse>;
  logout: () => void;
  updateUserPreferences: (prefs: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  initiateLogin: async () => { throw new Error("AuthProvider not mounted"); },
  verifyOtp: async () => { throw new Error("AuthProvider not mounted"); },
  resendOtp: async () => { throw new Error("AuthProvider not mounted"); },
  initiateSignup: async () => { throw new Error("AuthProvider not mounted"); },
  logout: () => {},
  updateUserPreferences: () => {},
});

const STORAGE_KEY = "sambhav_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Unauthenticated by default; never fake an auto-logged-in session
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const token = getAuthToken();
      if (saved && token) {
        return JSON.parse(saved);
      }
      return null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize localStorage with authentic session
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (e) {
        console.error("Failed to persist session", e);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // Validate active JWT session against server on startup
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      getMeApi()
        .then((profile) => {
          if (profile && profile.id) {
            setUser((prev) => ({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              xp: profile.xp ?? prev?.xp ?? 0,
              streakDays: profile.streakDays ?? prev?.streakDays ?? 0,
              level: profile.level ?? prev?.level ?? 1,
              experienceLevel: prev?.experienceLevel ?? (profile.role === "instructor" ? "advanced" : "beginner"),
              interests: prev?.interests ?? [],
            }));
          } else {
            // Invalid session
            setAuthToken(null);
            setUser(null);
          }
        })
        .catch(() => {
          // Token expired or invalid
          setAuthToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const initiateLogin = async (email: string, password: string): Promise<OtpInitiatedResponse> => {
    return loginRequestOtpApi(email, password);
  };

  const initiateSignup = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = "student"
  ): Promise<OtpInitiatedResponse> => {
    return registerRequestOtpApi(name, email, password, role);
  };

  const verifyOtp = async (sessionToken: string, otpCode: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await verifyOtpApi(sessionToken, otpCode);
      const authenticatedUser: User = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        xp: 0,
        streakDays: 0,
        level: 1,
        experienceLevel: res.user.role === "instructor" ? "advanced" : "beginner",
        interests: [],
      };
      setUser(authenticatedUser);
      setIsLoading(false);
      return authenticatedUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const resendOtp = async (sessionToken: string): Promise<OtpInitiatedResponse> => {
    return resendOtpApi(sessionToken);
  };

  const logout = () => {
    logoutApi().catch(() => {});
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/";
  };

  const updateUserPreferences = (prefs: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...prefs } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        initiateLogin,
        verifyOtp,
        resendOtp,
        initiateSignup,
        logout,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
