import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import CreateProfile from "./pages/CreateProfile.jsx";

export default function App() {
  return (
    <>
      <header style={{ borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 16px",
                      display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ fontWeight: 700 }}>🍜 Nom Nom Wheel</div>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign up</Link>
            <Link to="/profile">Profile</Link>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
