import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import BackLink from "../lib/BackLink";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // dummy toggle (doesn’t persist yet)
  const [isPublic, setIsPublic] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // load profile
      const { data: prof, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) console.error(error);

      setProfile(prof);
      setDisplayName(prof?.display_name || "");
      setEmail(user.email || "");
      setLoading(false);
    })();
  }, [navigate]);

  async function updateDisplayName(e) {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSavingName(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingName(false); return; }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, display_name: displayName.trim() },
        { onConflict: "user_id" }
      );

    setSavingName(false);
    if (error) return alert(error.message);
    setProfile(p => ({ ...(p || {}), display_name: displayName.trim() }));
    alert("Display name updated!");
  }

  async function updateEmail(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setSavingEmail(false);

    if (error) return alert(error.message);

    // Depending on your Supabase “Confirm email” setting, this may send a confirmation link.
    alert("Email update requested. Check your inbox if confirmation is required.");
  }

  async function updatePassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) return alert("Password must be at least 6 characters.");

    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPass(false);

    if (error) return alert(error.message);
    setNewPassword("");
    alert("Password updated!");
  }

  if (loading) {
    return (
      <main className="form-card">
        <BackLink />
        <h2>Settings</h2>
        <p style={{ color: "#fff" }}>Loading…</p>
      </main>
    );
  }

  return (
    <main className="form-card">
      <BackLink />
      <h2>Settings</h2>

      {/* Change Username (display name) */}
      <form onSubmit={updateDisplayName} style={{ marginTop: 16 }}>
        <label>Display Name</label>
        <input
          className="input"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          required
        />
        <button className="btn" disabled={savingName}>
          {savingName ? "Saving…" : "Save name"}
        </button>
      </form>

      {/* Change Email */}
      <form onSubmit={updateEmail} style={{ marginTop: 24 }}>
        <label>Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <button className="btn" disabled={savingEmail}>
          {savingEmail ? "Saving…" : "Save email"}
        </button>
        <p className="hint">
          Note: Depending on your project settings, changing email may require confirmation.
        </p>
      </form>

      {/* Change Password */}
      <form onSubmit={updatePassword} style={{ marginTop: 24 }}>
        <label>New Password</label>
        <input
          className="input"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••"
          required
        />
        <button className="btn" disabled={savingPass}>
          {savingPass ? "Saving…" : "Save password"}
        </button>
      </form>

      {/* Dummy Public/Private Toggle (UI only for now) */}
      <div style={{ marginTop: 28 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Profile Visibility</label>
        <div className="toggle-row">
          <button
            type="button"
            className={`btn ${isPublic ? "btn-active" : ""}`}
            onClick={() => setIsPublic(true)}
          >
            Public
          </button>
          <button
            type="button"
            className={`btn ${!isPublic ? "btn-active" : ""}`}
            onClick={() => setIsPublic(false)}
            style={{ marginLeft: 8 }}
          >
            Private
          </button>
        </div>
        <p className="hint" style={{ marginTop: 8 }}>
          (This toggle is for show right now and doesn’t change anything in the database yet.)
        </p>
      </div>
    </main>
  );
}
