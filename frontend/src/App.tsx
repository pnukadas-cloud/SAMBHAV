import React from "react";
import { RouterProvider, Route } from "./router/Router";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute, InstructorRoute } from "./router/RouteGuards";

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
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { InstructorPage } from "./pages/InstructorPage";

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signin" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<LoginPage />} />
          <Route path="/forgot-password" element={<LoginPage />} />

          {/* Protected Onboarding */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Student Portal Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab"
            element={
              <ProtectedRoute>
                <QuantumLabPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab/:circuitId"
            element={
              <ProtectedRoute>
                <QuantumLabPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quantum-lab"
            element={
              <ProtectedRoute>
                <QuantumLabPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quantum-lab/:circuitId"
            element={
              <ProtectedRoute>
                <QuantumLabPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn"
            element={
              <ProtectedRoute>
                <LearnPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/curriculum"
            element={
              <ProtectedRoute>
                <LearnPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:courseId/:lessonId"
            element={
              <ProtectedRoute>
                <LessonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:lessonId"
            element={
              <ProtectedRoute>
                <LessonPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/algorithms"
            element={
              <ProtectedRoute>
                <AlgorithmsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/algorithms/:algorithmId"
            element={
              <ProtectedRoute>
                <AlgorithmsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/algorithms/:algorithmId"
            element={
              <ProtectedRoute>
                <AlgorithmsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges"
            element={
              <ProtectedRoute>
                <ChallengesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges/:challengeId"
            element={
              <ProtectedRoute>
                <ChallengesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-tutor"
            element={
              <ProtectedRoute>
                <AITutorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Instructor Portal Routes */}
          <Route
            path="/instructor"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/curriculum"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/courses"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/authoring"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/classes"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/learners"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/students"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/assessments"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/challenges"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/labs"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/analytics"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
          <Route
            path="/instructor/ai-copilot"
            element={
              <InstructorRoute>
                <InstructorPage />
              </InstructorRoute>
            }
          />
        </RouterProvider>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
