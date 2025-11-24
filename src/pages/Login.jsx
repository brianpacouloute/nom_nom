// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        navigate("/profile");
      }
    })();
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    const user = data.user;
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pErr) {
      console.error(pErr);
    }

    navigate(profile ? "/profile" : "/create-profile");
  }

  return (
    <main className="form-card">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="mt-24">
          <button className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <span style={{ marginLeft: 12 }}>
            <Link to="/signup">Need an account?</Link>
          </span>
        </div>

        {error && (
          <p style={{ color: "#fff", marginTop: 10 }}>
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
