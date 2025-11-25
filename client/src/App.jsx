import { Routes, Route } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";

import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import ResumeHistory from "./pages/ResumeHistory";

import JDAnalyzer from "./pages/JDAnalyzer";
import JDHistory from "./pages/JDHistory";

import MockInterview from "./pages/MockInterview";
import InterviewHistory from "./pages/InterviewHistory";

import MatchEngine from "./pages/MatchEngine";
import MatchHistory from "./pages/MatchHistory";

import TailoredResume from "./pages/TailoredResume";
import TailoredHistory from "./pages/TailoredHistory";


function App() {
  return (
    <>
      <Navbar />

      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Resume */}
        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <ResumeAnalyzer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <ResumeHistory />
            </ProtectedRoute>
          }
        />

        {/* Job Description */}
        <Route
          path="/jd"
          element={
            <ProtectedRoute>
              <JDAnalyzer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jd-history"
          element={
            <ProtectedRoute>
              <JDHistory />
            </ProtectedRoute>
          }
        />

        {/* Mock Interview */}
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <MockInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-history"
          element={
            <ProtectedRoute>
              <InterviewHistory />
            </ProtectedRoute>
          }
        />

        {/* Match Engine */}
        <Route
          path="/match-engine"
          element={
            <ProtectedRoute>
              <MatchEngine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/match-history"
          element={
            <ProtectedRoute>
              <MatchHistory />
            </ProtectedRoute>
          }
        />

        {/* Tailored Resume */}
        <Route
          path="/tailored-resume"
          element={
            <ProtectedRoute>
              <TailoredResume />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tailored-history"
          element={
            <ProtectedRoute>
              <TailoredHistory />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
