import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function CreateProfile() {
  const [displayName, setDisplayName] = useState("");
  const [cuisines, setCuisines] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Prefill with existing profile (if one exists)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        setError(userErr?.message || "Not signed in");
        setLoading(false);
        return;
      }

      const user = userData.user;
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profErr) console.error(profErr);

      if (profile) {
        setDisplayName(profile.display_name || "");
        setCuisines(profile.cuisines || "");
        setBudget(profile.budget || "");
      }

      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      setError(userErr?.message || "Not signed in");
      setSaving(false);
      return;
    }

    const user = userData.user;

    // 👇 Upsert avoids duplicate key errors (insert or update on user_id)
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          display_name: displayName,
          cuisines,
          budget,
        },
        { onConflict: "user_id" }
      )
      .select();

    setSaving(false);

    if (upsertErr) {
      setError(upsertErr.message);
      return;
    }

    navigate("/profile");
  }

  if (loading) {
    return (
      <main className="form-card">
        <h2>Create Profile</h2>
        <p style={{ color: "#fff" }}>Loading…</p>
      </main>
    );
  }

  return (
    <main className="form-card">
      <h2>Create Profile</h2>
      <form onSubmit={handleSubmit}>
        <label>Display Name</label>
        <input
          className="input"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

        <label>Favorite Cuisines</label>
        <input
          className="input"
          type="text"
          value={cuisines}
          onChange={(e) => setCuisines(e.target.value)}
          placeholder="e.g. Italian, Mexican, Sushi"
        />

        <label>Budget</label>
        <input
          className="input"
          type="text"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="$ / $$ / $$$"
        />

        <div className="mt-24">
          <button className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {error && <p style={{ color: "#fff", marginTop: 10 }}>{error}</p>}
      </form>
    </main>
  );
}
