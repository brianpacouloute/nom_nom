// src/pages/Roulette.jsx
import React, { useEffect, useState } from "react";

// === Overpass helper kept in this file ===
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function norm(s) {
  return (s || "").trim();
}

async function fetchNearbyPlaces(lat, lng, radiusKm = 5) {
  const radius_m = Math.max(100, Math.min(25000, radiusKm * 1000));

  const query = `
    [out:json][timeout:20];
    (
      node["amenity"~"restaurant|fast_food|cafe|food_court"](around:${radius_m},${lat},${lng});
      way["amenity"~"restaurant|fast_food|cafe|food_court"](around:${radius_m},${lat},${lng});
      relation["amenity"~"restaurant|fast_food|cafe|food_court"](around:${radius_m},${lat},${lng});
    );
    out center 200;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data: query }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Overpass error: ${res.status}`);
  }

  const data = await res.json();
  const out = [];

  for (const el of data.elements || []) {
    const tags = el.tags || {};
    let lat0, lng0;

    if (el.type === "node") {
      lat0 = el.lat;
      lng0 = el.lon;
    } else {
      const center = el.center || {};
      lat0 = center.lat;
      lng0 = center.lon;
    }

    if (lat0 == null || lng0 == null) continue;

    const name = norm(tags.name) || "Unnamed";
    const cuisineRaw = (tags.cuisine || "")
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean);
    const cuisineTags = cuisineRaw.map((c) => c.toLowerCase());
    const primaryCuisine =
      (cuisineRaw[0] &&
        cuisineRaw[0].replace(/\b\w/g, (m) => m.toUpperCase())) ||
      (tags.amenity || "")
        .replace("_", " ")
        .replace(/\b\w/g, (m) => m.toUpperCase());

    const diet = [];
    if (["yes", "only"].includes(tags["diet:vegetarian"])) diet.push("vegetarian");
    if (["yes", "only"].includes(tags["diet:vegan"])) diet.push("vegan");
    if (["yes", "only"].includes(tags["diet:gluten_free"]))
      diet.push("gluten_free");

    out.push({
      id: `osm-${el.type}-${el.id}`,
      name,
      cuisine: primaryCuisine,
      cuisine_tags: cuisineTags,
      price: "",
      rating: null,
      diet,
      lat: lat0,
      lng: lng0,
    });
  }

  const seen = new Set();
  const unique = [];
  for (const r of out) {
    const key = `${r.name.trim().toLowerCase()}-${r.lat.toFixed(5)}-${r.lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(r);
  }

  return unique;
}

// === small distance helper ===
function haversine(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v == null)) return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Roulette() {
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [radiusKm, setRadiusKm] = useState(5);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState("");
  const [currentPick, setCurrentPick] = useState(null);

  // try to auto-get location once
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {},
      { timeout: 3000 }
    );
  }, []);

  async function loadNearby() {
    if (coords.lat == null || coords.lng == null) {
      setError("Location is required. Use the 'Use my location' button.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const items = await fetchNearbyPlaces(coords.lat, coords.lng, radiusKm);
      const withDist = items.map((r) => ({
        ...r,
        distance: haversine(coords.lat, coords.lng, r.lat, r.lng),
      }));
      withDist.sort(
        (a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9)
      );
      setPlaces(withDist);
      setCurrentPick(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load nearby places. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function spin() {
    if (!places.length) return;
    const idx = Math.floor(Math.random() * places.length);
    setCurrentPick(places[idx]);
  }

  function toKm(d) {
    if (d == null) return "—";
    return (Math.round(d * 10) / 10).toFixed(1);
  }

  return (
    <main className="page-wrap">
      <a href="/profile" className="back-link">
        ← Back to profile
      </a>
      <h1 className="page-title">🍜 Play Roulette</h1>

      <section className="card">
        <h2>Location & Radius</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label>Radius (km)</label>
            <input
              className="input"
              type="number"
              min="0.1"
              step="0.1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value) || 1)}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!navigator.geolocation) {
                  setError("Geolocation not supported in this browser.");
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setCoords({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                    });
                    setError("");
                  },
                  () => {
                    setError("Could not get your location.");
                  }
                );
              }}
            >
              Use my location
            </button>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary mt-24"
          onClick={loadNearby}
          disabled={loading}
        >
          {loading ? "Loading…" : "Load nearby restaurants"}
        </button>

        {error && (
          <p style={{ color: "#b91c1c", marginTop: 8 }}>{error}</p>
        )}

        {coords.lat != null && (
          <p style={{ marginTop: 8, fontSize: 14 }}>
            Using: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </p>
        )}
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Spin</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={spin}
          disabled={!places.length}
        >
          Spin the wheel
        </button>

        {currentPick && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              background: "#fce7f3",
            }}
          >
            <h3 style={{ margin: 0 }}>{currentPick.name}</h3>
            <p style={{ margin: "4px 0 0", fontSize: 14 }}>
              {currentPick.cuisine || "Restaurant"} ·{" "}
              {toKm(currentPick.distance)} km away
            </p>
          </div>
        )}

        <h3 style={{ marginTop: 20 }}>Nearby options</h3>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {places.map((p) => (
            <li
              key={p.id}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                marginBottom: 6,
                background: "#fed7aa",
              }}
            >
              <strong>{p.name}</strong>{" "}
              <span style={{ fontSize: 13 }}>
                ({p.cuisine || "Restaurant"} · {toKm(p.distance)} km)
              </span>
            </li>
          ))}
          {!places.length && !loading && (
            <li style={{ fontSize: 14, color: "#4b5563" }}>
              Load nearby places to see options.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
