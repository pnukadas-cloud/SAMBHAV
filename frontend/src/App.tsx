import React from "react";
import { RouterProvider, Route } from "./router/Router";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { QuantumLabPage } from "./pages/QuantumLabPage";
import { LearnPage } from "./pages/LearnPage";
import { LessonPage } from "./pages/LessonPage";
import { AlgorithmsPage } from "./pages/AlgorithmsPage";
import { ChallengesPage } from "./pages/ChallengesPage";
import { AITutorPage } from "./pages/AITutorPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SettingsPage } from "./pages/SettingsPage";
import { InstructorPage } from "./pages/InstructorPage";

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider>
          {/* Public & Authentication Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Student Portal Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/lab" element={<QuantumLabPage />} />
          <Route path="/lab/:circuitId" element={<QuantumLabPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:courseId/:lessonId" element={<LessonPage />} />
          <Route path="/algorithms" element={<AlgorithmsPage />} />
          <Route path="/algorithms/:algorithmId" element={<AlgorithmsPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/challenges/:challengeId" element={<ChallengesPage />} />
          <Route path="/ai-tutor" element={<AITutorPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Instructor Portal Routes */}
          <Route path="/instructor" element={<InstructorPage />} />
          <Route path="/instructor/students" element={<InstructorPage />} />
          <Route path="/instructor/courses" element={<InstructorPage />} />
          <Route path="/instructor/analytics" element={<InstructorPage />} />
          <Route path="/instructor/challenges" element={<InstructorPage />} />
        </RouterProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
