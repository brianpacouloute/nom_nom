// src/pages/Preferences.jsx
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
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState("");

  // top-level tabs: food | roulette | security
  const [activeTab, setActiveTab] = useState("food");

  // food / roulette prefs
  const [cuisines, setCuisines] = useState([]);
  const [dietary, setDietary] = useState([]);
  const [priceTier, setPriceTier] = useState("$$");
  const [radiusKm, setRadiusKm] = useState(5);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [includeVisited, setIncludeVisited] = useState(false);

  // account info
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [lastUsernameChange, setLastUsernameChange] = useState(null);
  const [role, setRole] = useState("user");

  // username change state
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");

  // password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordStep, setPasswordStep] = useState("verify");

  const navigate = useNavigate();

  // Load existing preferences + account info
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData?.user) {
          navigate("/login");
          return;
        }

        const user = userData.user;
        setUserId(user.id);
        setUserEmail(user.email || "");

        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select(
           "display_name, preferred_cuisines, dietary_restrictions, price_tier, radius_km, open_now_only, include_visited, role, daily_spins, last_spin_date"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (profErr) {
          console.error(profErr);
        }

        if (profile) {
          if (profile.role) {
            setRole(profile.role);
          }

          if (profile.display_name) {
            setDisplayName(profile.display_name);
            setNewDisplayName(profile.display_name);
          }

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
          if (profile.radius_km != null) setRadiusKm(profile.radius_km);
          if (typeof profile.open_now_only === "boolean") {
            setOpenNowOnly(profile.open_now_only);
          }
          if (profile.include_visited != null) {
            setIncludeVisited(!!profile.include_visited);
          }
          if (profile.last_username_change) {
            setLastUsernameChange(profile.last_username_change);
          }
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load preferences");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Save food + roulette preferences (not security stuff)
  async function handleSavePreferences(e) {
    e.preventDefault();
    setSavingPrefs(true);
    setError("");

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      setError(userErr?.message || "Not signed in");
      setSavingPrefs(false);
      return;
    }

    const user = userData.user;

    const payload = {
      user_id: user.id,
      preferred_cuisines: cuisines.join(", "),
      dietary_restrictions: dietary.join(", "),
      price_tier: priceTier,
      radius_km: radiusKm,
      open_now_only: openNowOnly,
      include_visited: includeVisited,
    };

    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });

    setSavingPrefs(false);

    if (upsertErr) {
      console.error(upsertErr);
      setError(upsertErr.message);
      return;
    }

    navigate("/profile");
  }

  // Change username (only if available, only once per day)
  async function handleUsernameChange() {
    setUsernameError("");
    setUsernameMessage("");

    const desired = newDisplayName.trim();
    if (!desired) {
      setUsernameError("Username cannot be empty.");
      return;
    }
    if (desired === displayName) {
      setUsernameError("That’s already your current username.");
      return;
    }
    if (!userId) {
      setUsernameError("You must be signed in.");
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDateStr = lastUsernameChange
      ? String(lastUsernameChange).slice(0, 10)
      : null;

    // Only enforce the once-per-day limit if NOT admin
    if (role !== "admin" && lastDateStr === todayStr) {
      setUsernameError("You can only change your username once per day.");
      return;
    }


    setUsernameSaving(true);
    try {
      // Check uniqueness
      const { data: existing, error: checkErr } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("display_name", desired)
        .neq("user_id", userId)
        .maybeSingle();

      if (checkErr) {
        console.error(checkErr);
      }

      if (existing) {
        setUsernameError("That username is already taken.");
        return;
      }

      // Update username + last change date
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          display_name: desired,
          last_username_change: todayStr,
        })
        .eq("user_id", userId);

      if (updateErr) {
        console.error(updateErr);
        setUsernameError(updateErr.message || "Failed to update username.");
        return;
      }

      setDisplayName(desired);
      setLastUsernameChange(todayStr);
      setUsernameMessage("Username updated successfully 🎉");
    } catch (e) {
      console.error(e);
      setUsernameError("Something went wrong while changing username.");
    } finally {
      setUsernameSaving(false);
    }
  }

  // 1) Verify current password first
async function handleVerifyCurrentPassword() {
  setPasswordError("");
  setPasswordMessage("");

  const current = currentPassword.trim();

  if (!current) {
    setPasswordError("Please enter your current password.");
    return;
  }
  if (!userEmail) {
    setPasswordError("Missing email for this account.");
    return;
  }

  setPasswordSaving(true);
  try {
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: current,
    });

    if (verifyErr) {
      setPasswordError("Current password is incorrect.");
      return;
    }

    // Current password is valid → move to "new password" step
    setPasswordStep("new");
    setPasswordMessage("Current password verified. Enter a new password.");
  } catch (e) {
    console.error(e);
    setPasswordError("Something went wrong while verifying password.");
  } finally {
    setPasswordSaving(false);
  }
}

  async function handleSetNewPassword() {
    setPasswordError("");
    setPasswordMessage("");

    const next = newPassword.trim();
    const confirm = confirmPassword.trim();

    if (!next || !confirm) {
      setPasswordError("Fill in both new password fields.");
      return;
    }
    if (next !== confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (next.length < 8) {
      setPasswordError("New password should be at least 8 characters.");
      return;
    }

    setPasswordSaving(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: next,
      });

      if (updateErr) {
        console.error(updateErr);
        setPasswordError(updateErr.message || "Failed to update password.");
        return;
      }

      setPasswordMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStep("verify"); // go back to first step
    } catch (e) {
      console.error(e);
      setPasswordError("Something went wrong while updating password.");
    } finally {
      setPasswordSaving(false);
    }
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

      {/* Tabs: Food | Roulette | Security */}
      <div
        style={{
          display: "flex",
          gap: 8,
          margin: "8px 0 16px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.1)",
          padding: 4,
        }}
      >
        <button
          type="button"
          className="btn"
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: 999,
            background:
              activeTab === "food" ? "var(--brand)" : "transparent",
            color: activeTab === "food" ? "#fff" : "#111",
            boxShadow:
              activeTab === "food" ? "var(--shadow-sm)" : "none",
          }}
          onClick={() => setActiveTab("food")}
        >
          Food
        </button>
        <button
          type="button"
          className="btn"
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: 999,
            background:
              activeTab === "roulette" ? "var(--brand)" : "transparent",
            color: activeTab === "roulette" ? "#fff" : "#111",
            boxShadow:
              activeTab === "roulette" ? "var(--shadow-sm)" : "none",
          }}
          onClick={() => setActiveTab("roulette")}
        >
          Roulette
        </button>
        <button
          type="button"
          className="btn"
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: 999,
            background:
              activeTab === "security" ? "var(--brand)" : "transparent",
            color: activeTab === "security" ? "#fff" : "#111",
            boxShadow:
              activeTab === "security" ? "var(--shadow-sm)" : "none",
          }}
          onClick={() => setActiveTab("security")}
        >
          Security
        </button>
      </div>

      <form onSubmit={handleSavePreferences}>
        {/* ========= FOOD TAB ========= */}
        {activeTab === "food" && (
          <>
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
              <p className="field-hint">
                We’ll try to avoid options that don’t fit.
              </p>
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
          </>
        )}

        {/* ========= ROULETTE TAB ========= */}
        {activeTab === "roulette" && (
          <>
            <div className="field-group">
              <h3>Roulette behavior</h3>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={includeVisited}
                  onChange={(e) => setIncludeVisited(e.target.checked)}
                />
                Include restaurants I’ve already spun / visited in Roulette
              </label>
              <p className="field-hint">
                When this is off, saved or previously visited places are hidden
                from the wheel so you get fresher recommendations.
              </p>
            </div>
          </>
        )}

        {/* ========= SECURITY TAB ========= */}
        {activeTab === "security" && (
          <>
            {/* Username */}
            <div className="field-group">
              <h3>Display name</h3>
              <p className="field-hint">
                Shown on your profile. You can change it once per day.
              </p>
              <p style={{ margin: "4px 0", fontSize: 14 }}>
                Current: <strong>{displayName || "Nommer"}</strong>
              </p>
              <input
                className="input"
                type="text"
                value={newDisplayName}
                onChange={(e) => {
                  setNewDisplayName(e.target.value);
                  setUsernameError("");
                  setUsernameMessage("");
                }}
                placeholder="New display name"
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 8 }}
                disabled={usernameSaving}
                onClick={handleUsernameChange}
              >
                {usernameSaving ? "Updating…" : "Update username"}
              </button>
              {usernameError && (
                <p style={{ color: "#fff", marginTop: 6 }}>{usernameError}</p>
              )}
              {usernameMessage && (
                <p style={{ color: "#fff", marginTop: 6 }}>
                  {usernameMessage}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="field-group">
              <h3>Change password</h3>
              <p className="field-hint">
                First confirm your current password, then choose a new one.
              </p>

              {passwordStep === "verify" && (
                <>
                  <label>
                    Current password
                    <input
                      className="input"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordError("");
                        setPasswordMessage("");
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: 8 }}
                    disabled={passwordSaving}
                    onClick={handleVerifyCurrentPassword}
                  >
                    {passwordSaving ? "Checking…" : "Verify current password"}
                  </button>
                </>
              )}

              {passwordStep === "new" && (
                <>
                  <p style={{ marginTop: 8, fontSize: 14 }}>
                    ✅ Current password verified. Enter your new password below.
                  </p>

                  <label>
                    New password
                    <input
                      className="input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                        setPasswordMessage("");
                      }}
                    />
                  </label>

                  <label>
                    Confirm new password
                    <input
                      className="input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                        setPasswordMessage("");
                      }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        // cancel and go back to verify step
                        setPasswordStep("verify");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError("");
                        setPasswordMessage("");
                      }}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={passwordSaving}
                      onClick={handleSetNewPassword}
                    >
                      {passwordSaving ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </>
              )}

              {passwordError && (
                <p style={{ color: "#fff", marginTop: 6 }}>{passwordError}</p>
              )}
              {passwordMessage && (
                <p style={{ color: "#fff", marginTop: 6 }}>{passwordMessage}</p>
              )}
            </div>

          </>
        )}

        <div className="mt-24">
          <button className="btn btn-primary btn-lg" disabled={savingPrefs}>
            {savingPrefs ? "Saving..." : "Save preferences"}
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
