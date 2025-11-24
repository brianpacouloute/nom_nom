// src/pages/MapView.jsx
import React, { useEffect, useMemo, useState } from "react";
import useGeolocation from "../hooks/useGeolocation";
import { fetchRestaurantsNear } from "../lib/fetchRestaurants";
import { getCurrentProfile } from "../lib/getProfile";
import { haversineKm } from "../lib/geo"; // optional, for distance display

export default function MapView() {
  const { coords, error: geoError } = useGeolocation();

  const [pref, setPref] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load preferences once
  useEffect(() => {
    (async () => {
      try {
        const profile = await getCurrentProfile();
        setPref(profile);
      } catch (err) {
        console.error("Failed to load profile for Map:", err);
      }
    })();
  }, []);

  // Fetch real restaurants near user
  useEffect(() => {
    if (!coords) return;
    (async () => {
      setLoading(true);
      try {
        const radiusMeters = (pref?.radiusKm || 5) * 1000;
        const nearby = await fetchRestaurantsNear(coords, radiusMeters);
        setRestaurants(nearby);
      } catch (err) {
        console.error("Failed to fetch nearby restaurants for map:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [coords, pref]);

  const filtered = useMemo(() => {
    if (!restaurants.length) return [];
    if (!pref) return restaurants;

    return restaurants.map((r) => {
      // Add distance (km) for display
      const distanceKm = coords
        ? haversineKm(coords, { lat: r.lat, lng: r.lng })
        : null;

      // Basic filters (same logic as Roulette)
      const matchesCuisine =
        !pref.cuisines?.length || pref.cuisines.includes(r.cuisine);
      const matchesPrice = !pref.price || !r.price || r.price === pref.price;
      const matchesOpen = !pref.openNow || r.openNow !== false;

      return {
        ...r,
        distanceKm,
        _matches: matchesCuisine && matchesPrice && matchesOpen,
      };
    })
    .filter((r) => r._matches);
  }, [restaurants, pref, coords]);

  return (
    <main className="form-card" style={{ maxWidth: 840 }}>
      <h2>Map</h2>

      {geoError && (
        <p style={{ color: "#fff" }}>
          Location error: {geoError}. Results are approximate.
        </p>
      )}

      {loading && (
        <p style={{ color: "#fff" }}>Loading nearby restaurants…</p>
      )}

      {!loading && !restaurants.length && (
        <p style={{ color: "#fff" }}>
          No restaurants found near you. Try increasing your radius in
          Preferences.
        </p>
      )}

      <div className="card" style={{ marginTop: 10 }}>
        <p style={{ marginTop: 0 }}>
          Showing <strong>{filtered.length}</strong> restaurant
          {filtered.length === 1 ? "" : "s"} near you.
        </p>

        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {filtered.map((r) => (
            <li key={r.id} style={{ marginBottom: 6 }}>
              <div>
                <strong>{r.name}</strong>{" "}
                <span style={{ color: "var(--muted)" }}>
                  — {r.cuisine || "Restaurant"} {r.price || "$$"}
                  {r.distanceKm != null &&
                    ` · ${r.distanceKm.toFixed(1)} km`}
                  {r.openNow === false ? " · Closed" : " · Open-ish"}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Directions
              </a>
            </li>
          ))}

          {!filtered.length && !!restaurants.length && (
            <li style={{ color: "var(--muted)" }}>
              We found places nearby, but none matched your current
              preferences. Try relaxing your filters.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}
