import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <div>
      <nav style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
        <Link to="/">Home</Link>{" | "}
        <Link to="/signup">Signup</Link>{" | "}
        <Link to="/login">Login</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </div>
  );
}
