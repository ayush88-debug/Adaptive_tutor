import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import SubjectDashboard from "./pages/SubjectDashboard";
import ModulePage from "./pages/ModulePage";
import TeacherDashboard from "./pages/TeacherDashboard";
import AttemptHistory from "./pages/AttemptHistory";
import StudentDetailPage from "./pages/StudentDetailPage"; // Import the new page
import { useAuth } from "./context/AuthProvider";

export default function App() {
  const { user, doLogout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to={user ? "/dashboard" : "/"} className="text-xl font-bold text-slate-800">
            Adaptive Tutor
          </Link>
          <div className="flex items-center gap-4">
            {user?.role === 'teacher' && (
              <Link to="/teacher/dashboard" className="text-blue-600 hover:underline font-medium text-sm">
                Teacher View
              </Link>
            )}
            {user && user.role === 'student' && (
              <Link to="/history" className="text-blue-600 hover:underline font-medium text-sm">
                My History
              </Link>
            )}
            {user ? (
              <button onClick={doLogout} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-md hover:bg-slate-300 text-sm font-semibold">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-blue-600 mr-4 font-medium">Login</Link>
                <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-semibold">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto p-4 mt-4">
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route 
            path="/teacher/dashboard" 
            element={
              <ProtectedRoute>
                {user?.role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/dashboard" />}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/student/:studentId" 
            element={
              <ProtectedRoute>
                {user?.role === 'teacher' ? <StudentDetailPage /> : <Navigate to="/dashboard" />}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <SubjectDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/module/:moduleId" 
            element={
              <ProtectedRoute>
                <ModulePage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AttemptHistory />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}