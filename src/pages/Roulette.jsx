// src/pages/Roulette.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import useGeolocation from "../hooks/useGeolocation";
import { fetchRestaurantsNear } from "../lib/fetchRestaurants";
import { getCurrentProfile } from "../lib/getProfile";
import { supabase } from "../lib/supabase";

const MAX_SPINS_PER_DAY = 10;
const MAX_SEGMENTS = 10;

// Build a clip-path polygon that is a clean wedge of the circle
function makeSliceClipPath(index, total) {
  if (total <= 0) return "none";

  const anglePer = (2 * Math.PI) / total;
  const start = anglePer * index - anglePer / 2;
  const end = start + anglePer;

  function polarToPercent(angle) {
    const r = 55;
    const cx = 50;
    const cy = 50;
    const x = cx + r * Math.cos(angle - Math.PI / 2);
    const y = cy + r * Math.sin(angle - Math.PI / 2);
    return `${x}% ${y}%`;
  }

  const p1 = polarToPercent(start);
  const p2 = polarToPercent(end);

  return `polygon(50% 50%, ${p1}, ${p2})`;
}

export default function Roulette() {
  const { coords, error: geoError } = useGeolocation();

  const [pref, setPref] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingFav, setSavingFav] = useState(false);
  const [spinError, setSpinError] = useState("");

  const wheelRef = useRef(null);

  // Load profile + favorites
  useEffect(() => {
    (async () => {
      try {
        const profile = await getCurrentProfile();
        setPref(profile);

        if (profile?.userId) {
          const { data, error } = await supabase
            .from("favorites")
            .select("restaurant_id")
            .eq("user_id", profile.userId);

          if (error) {
            console.error("Load favorites error:", error);
          } else if (data) {
            setSavedIds(new Set(data.map((r) => String(r.restaurant_id))));
          }
        }
      } catch (err) {
        console.error("Failed to load profile/favorites:", err);
      }
    })();
  }, []);

  // Fetch nearby restaurants once we have location
  useEffect(() => {
    if (!coords) return;

    (async () => {
      setLoading(true);
      try {
        const radiusMeters = (pref?.radiusKm || 5) * 1000;
        const nearby = await fetchRestaurantsNear(coords, radiusMeters);
        setRestaurants(nearby);
      } catch (err) {
        console.error("Failed to fetch nearby restaurants:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [coords, pref]);

  // Apply preference filters (cuisine, price, open now)
  useEffect(() => {
    if (!restaurants.length) {
      setPool([]);
      return;
    }

    if (!pref) {
      setPool(restaurants);
      return;
    }

    const filtered = restaurants.filter((r) => {
      if (pref.cuisines?.length && !pref.cuisines.includes(r.cuisine)) {
        return false;
      }
      if (pref.price && r.price && r.price !== pref.price) {
        return false;
      }
      if (pref.openNow && r.openNow === false) {
        return false;
      }
      return true;
    });

    setPool(filtered);
  }, [restaurants, pref]);

  // Build wheel segments:
  // - start from pool (or restaurants if pool is empty)
  // - remove saved restaurants
  // - keep up to 10
  const segments = useMemo(() => {
    const base = pool.length ? pool : restaurants;
    if (!base.length) return [];

    let unsaved = base.filter((r) => !savedIds.has(String(r.id)));

    // if unsaved is empty but we have restaurants, fall back to showing them
    if (!unsaved.length) {
      unsaved = base;
    }

    return unsaved.slice(0, MAX_SEGMENTS);
  }, [pool, restaurants, savedIds]);

  async function toggleFavorite(r) {
    if (!pref) return;
    const id = String(r.id);
    setSavingFav(true);

    try {
      if (savedIds.has(id)) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .match({ user_id: pref.userId, restaurant_id: id });

        if (error) {
          console.error("Delete favorite error:", error);
        } else {
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: pref.userId,
          restaurant_id: id,
          name: r.name,
          cuisine: r.cuisine,
          lat: r.lat,
          lng: r.lng,
          price: r.price || "$$",
        });

        if (error) {
          console.error("Insert favorite error:", error);
        } else {
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          });
        }
      }
    } catch (e) {
      console.error("Favorite toggle failed:", e);
    } finally {
      setSavingFav(false);
    }
  }

  // Spin logic
  async function spin() {
    if (!coords) {
      setSpinError(
        "We need your location to spin. Please allow location access."
      );
      return;
    }
    if (!segments.length || spinning || !pref) return;

    setSpinError("");

    const isAdmin = pref.role === "admin";
    const todayStr = new Date().toISOString().slice(0, 10);
    let spins = pref.dailySpins || 0;

    if (pref.lastSpinDate !== todayStr) {
      spins = 0;
    }

    if (!isAdmin && spins >= MAX_SPINS_PER_DAY) {
      setSpinError(`You’ve used all ${MAX_SPINS_PER_DAY} spins for today.`);
      return;
    }

    const newSpins = spins + 1;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          daily_spins: newSpins,
          last_spin_date: todayStr,
        })
        .eq("user_id", pref.userId);

      if (error) {
        console.error("Failed to update spin count:", error);
      } else {
        setPref((p) =>
          p ? { ...p, dailySpins: newSpins, lastSpinDate: todayStr } : p
        );
      }
    } catch (e) {
      console.error("Failed to update spin count:", e);
    }

    setSpinning(true);
    setResult(null);

    const segCount = segments.length;
    const anglePer = 360 / segCount;
    const winningIndex = Math.floor(Math.random() * segCount);

    // random number of full spins (6–9),
    // plus a small random jitter inside the winning slice
    const baseTurns = 6 + Math.floor(Math.random() * 4); // 6,7,8,9
    const jitter = (Math.random() - 0.5) * (anglePer * 0.5); // stay well inside slice
    const targetAngle = baseTurns * 360 - winningIndex * anglePer + jitter;

    const el = wheelRef.current;
    if (el) {
      // reset so subsequent are same
      el.style.transition = "none";
      el.style.transform = "rotate(0deg)";

      requestAnimationFrame(() => {
        el.style.transition =
          "transform 3.2s cubic-bezier(0.17, 0.67, 0.32, 1.26)";
        el.style.transform = `rotate(${targetAngle}deg)`;
      });
    }

    setTimeout(() => {
      setResult(segments[winningIndex]);
      setSpinning(false);
    }, 3300);
  }

  const hasData = segments.length > 0;

  return (
    <main className="form-card" style={{ maxWidth: 780 }}>
      <h2>Roulette</h2>

      {geoError && (
        <p style={{ color: "#fff" }}>
          Location error: {geoError}. You can still see a sample list.
        </p>
      )}
      {loading && (
        <p style={{ color: "#fff" }}>Loading nearby restaurants…</p>
      )}
      {!loading && !restaurants.length && (
        <p style={{ color: "#fff" }}>
          We couldn&apos;t find any restaurants near you. Try again later or
          increase your radius in Preferences.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
          gap: 20,
          alignItems: "center",
          marginTop: 12,
        }}
      >
        {/* Wheel column */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            <div
              ref={wheelRef}
              style={{
                width: 280,
                height: 280,
                borderRadius: "50%",
                border: "10px solid rgba(0,0,0,.25)",
                overflow: "hidden",
                background:
                  "radial-gradient(circle at 30% 30%, #ffffff 0%, #f5f5f5 45%, #e6e6e6 100%)",
                position: "relative",
                boxShadow: "none",
              }}
            >
              {hasData ? (
                segments.map((item, i) => {
                  const total = segments.length;
                  const anglePer = 360 / total;
                  const midAngleDeg = i * anglePer;
                  const bg =
                    i % 2 === 0
                      ? "rgba(255,255,255,0.98)"
                      : "rgba(255,245,230,0.98)";
                  const clipPath = makeSliceClipPath(i, total);

                  return (
                    <div
                      key={item.id}
                      style={{
                        position: "absolute",
                        inset: 0,
                        clipPath,
                        background: bg,
                      }}
                    >
                      {/* vertical label along the wedge center, pushed toward rim */}
                      <div
                        style={{
                          position: "absolute",
                          left: "50%",
                          top: "50%",
                          transform: `translate(-50%, -50%) rotate(${midAngleDeg}deg)`,
                          height: "95%",
                          display: "flex",
                          alignItems: "flex-end", // push text toward rim
                          justifyContent: "center",
                          pointerEvents: "none",
                          paddingBottom: "66%", // tweak this if you want it closer/further
                        }}
                      >
                        <span
                          style={{
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                            fontSize: 11,
                            lineHeight: 1.15,
                            textAlign: "center",
                            whiteSpace: "normal", // allow multi-line
                            maxHeight: "100%",
                            overflow: "hidden",
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    textAlign: "center",
                    fontSize: 14,
                    color: "var(--muted)",
                  }}
                >
                  No restaurants to show yet.
                </div>
              )}
            </div>

            {/* Pointer */}
            <div
              style={{
                position: "absolute",
                top: -8,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "22px solid var(--brand)",
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,.4))",
              }}
            />
          </div>
        </div>

        {/* Info / actions column */}
        <div className="card">
          <p style={{ marginTop: 0 }}>
            <strong>
              Nearby options: {pool.length || restaurants.length}
            </strong>{" "}
            {pref && (
              <>
                within ~{pref.radiusKm || 5} km, price {pref.price || "$$"}
              </>
            )}
          </p>

          <button
            className="btn btn-primary btn-lg"
            onClick={spin}
            disabled={!hasData || spinning}
          >
            {spinning ? "Spinning…" : "Spin the wheel"}
          </button>

          {result && (
            <div style={{ marginTop: 14 }}>
              <h3 style={{ margin: "4px 0" }}>{result.name}</h3>
              <p style={{ margin: 0, color: "var(--muted)" }}>
                {result.cuisine || "Restaurant"} · {result.price || "$$"}
              </p>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${result.lat},${result.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="link-btn"
                >
                  View in Google Maps
                </a>

                <button
                  type="button"
                  className="btn"
                  style={{ padding: "8px 14px", fontSize: 14 }}
                  disabled={savingFav || !pref}
                  onClick={() => toggleFavorite(result)}
                >
                  {savedIds.has(String(result.id))
                    ? savingFav
                      ? "Removing..."
                      : "Unsave"
                    : savingFav
                    ? "Saving..."
                    : "Save"}
                </button>
              </div>
            </div>
          )}

          {spinError && (
            <p style={{ color: "#fff", marginTop: 8 }}>{spinError}</p>
          )}
        </div>
      </div>
    </main>
  );
}
