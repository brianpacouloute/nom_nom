import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// basic options
const CUISINE_OPTIONS = [
  "Italian",
  "Mexican",
  "Japanese",
  "Indian",
  "Fast Food",
  "Cafe / Brunch",
];

const DIET_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Halal",
  "Kosher",
  "No preference",
];

const PRICE_OPTIONS = ["$", "$$", "$$$"];
const RADIUS_OPTIONS = [3, 5, 10, 15]; // km

// helper to toggle checkboxes
function toggleInList(value, list, setter) {
  if (list.includes(value)) {
    setter(list.filter((v) => v !== value));
  } else {
    setter([...list, value]);
  }
}

export default function Preferences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // form state
  const [cuisines, setCuisines] = useState([]);
  const [dietary, setDietary] = useState([]);
  const [priceTier, setPriceTier] = useState("$$");
  const [radiusKm, setRadiusKm] = useState(5);
  const [openNowOnly, setOpenNowOnly] = useState(false);

  const navigate = useNavigate();

  // Load existing preferences for logged-in user
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        // not logged in – bounce to login
        navigate("/login");
        return;
      }

      const user = userData.user;

      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select(
          "preferred_cuisines, dietary_restrictions, price_tier, radius_km, open_now_only"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (profErr) {
        console.error(profErr);
      }

      if (profile) {
        if (profile.preferred_cuisines) {
          setCuisines(
            profile.preferred_cuisines
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          );
        }

        if (profile.dietary_restrictions) {
          setDietary(
            profile.dietary_restrictions
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          );
        }

        if (profile.price_tier) setPriceTier(profile.price_tier);
        if (profile.radius_km) setRadiusKm(profile.radius_km);
        if (typeof profile.open_now_only === "boolean") {
          setOpenNowOnly(profile.open_now_only);
        }
      }

      setLoading(false);
    })();
  }, [navigate]);

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

    // Store arrays as comma-separated strings
    const payload = {
      user_id: user.id,
      preferred_cuisines: cuisines.join(", "),
      dietary_restrictions: dietary.join(", "),
      price_tier: priceTier,
      radius_km: radiusKm,
      open_now_only: openNowOnly,
    };

    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);

    if (upsertErr) {
      console.error(upsertErr);
      setError(upsertErr.message);
      return;
    }

    navigate("/profile");
  }

  if (loading) {
    return (
      <main className="form-card">
        <h2>Preferences</h2>
        <p style={{ color: "#fff" }}>Loading…</p>
      </main>
    );
  }

  return (
    <main className="form-card">
      <h2>Preferences</h2>
      <form onSubmit={handleSubmit}>
        {/* Cuisines */}
        <div className="field-group">
          <h3>Favorite cuisines</h3>
          <p className="field-hint">
            Pick a few that you’re most likely to choose.
          </p>
          <div className="option-list">
            {CUISINE_OPTIONS.map((c) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={cuisines.includes(c)}
                  onChange={() => toggleInList(c, cuisines, setCuisines)}
                />
                {c}
              </label>
            ))}
          </div>
        </div>

        {/* Dietary restrictions */}
        <div className="field-group">
          <h3>Dietary restrictions</h3>
          <p className="field-hint">We’ll try to avoid options that don’t fit.</p>
          <div className="option-list">
            {DIET_OPTIONS.map((d) => (
              <label key={d}>
                <input
                  type="checkbox"
                  checked={dietary.includes(d)}
                  onChange={() => toggleInList(d, dietary, setDietary)}
                />
                {d}
              </label>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="field-group">
          <h3>Comfortable price range</h3>
          <div className="option-list">
            {PRICE_OPTIONS.map((p) => (
              <label key={p}>
                <input
                  type="radio"
                  name="price"
                  value={p}
                  checked={priceTier === p}
                  onChange={() => setPriceTier(p)}
                />
                {p}
              </label>
            ))}
          </div>
        </div>

        {/* Radius */}
        <div className="field-group">
          <h3>Distance</h3>
          <p className="field-hint">Max distance from your location.</p>
          <select
            className="input"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </div>

        {/* Open now */}
        <div className="field-group">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={openNowOnly}
              onChange={(e) => setOpenNowOnly(e.target.checked)}
            />
            Only show places that are open right now
          </label>
        </div>

        <div className="mt-24">
          <button className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? "Saving..." : "Save preferences"}
          </button>
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
