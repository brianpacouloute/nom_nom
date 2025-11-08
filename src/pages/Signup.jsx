import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    console.log("SIGNUP attempt:", { cleanEmail, cleanPasswordLength: cleanPassword.length });

    const { error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
    });

    setLoading(false);

    if (signUpError) {
      console.error("Signup error:", signUpError);
      setError(signUpError.message || "Something went wrong");
      return;
    }

    navigate("/login");
  }

  return (
    <main className="form-card">
      <h2>Sign Up</h2>
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>
          <span style={{ marginLeft: 12 }}>
            <Link to="/login">Already have an account?</Link>
          </span>
        </div>

        {error && <p style={{ color: "#fff", marginTop: 10 }}>{error}</p>}
      </form>
    </main>
  );
}
