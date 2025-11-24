// src/pages/SavedRestaurants.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getCurrentProfile } from "../lib/getProfile";

export default function SavedRestaurants() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const profile = await getCurrentProfile();
        if (!profile?.userId) {
          setError("Not signed in.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("favorites")
          .select("user_id, restaurant_id, name, cuisine, price, lat, lng")
          .eq("user_id", profile.userId)
          .order("name", { ascending: true });

        if (error) {
          console.error(error);
          setError("Failed to load saved restaurants.");
        } else {
          setItems(data || []);
        }
      } catch (e) {
        console.error(e);
        setError("Not signed in.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleUnsave(row) {
    try {
      await supabase
        .from("favorites")
        .delete()
        .match({
          user_id: row.user_id,
          restaurant_id: row.restaurant_id,
        });

      setItems((prev) =>
        prev.filter(
          (r) =>
            !(
              r.user_id === row.user_id &&
              r.restaurant_id === row.restaurant_id
            )
        )
      );
    } catch (e) {
      console.error("Failed to unsave:", e);
    }
  }

  return (
    <main className="form-card" style={{ maxWidth: 840 }}>
      <h2>Saved Restaurants</h2>

      {loading && <p style={{ color: "#fff" }}>Loading…</p>}
      {error && <p style={{ color: "#fff" }}>{error}</p>}

      {!loading && !items.length && !error && (
        <p style={{ color: "#fff" }}>
          You haven&apos;t saved any restaurants yet. Spin the wheel and save a
          few!
        </p>
      )}

      {!!items.length && (
        <div className="card" style={{ marginTop: 10 }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {items.map((r) => (
              <li
                key={`${r.user_id}-${r.restaurant_id}`}
                style={{ marginBottom: 10 }}
              >
                <div>
                  <strong>{r.name}</strong>{" "}
                  <span style={{ color: "var(--muted)" }}>
                    — {r.cuisine || "Restaurant"} {r.price || "$$"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="link-btn"
                  >
                    View in Google Maps
                  </a>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: "6px 10px", fontSize: 13 }}
                    onClick={() => handleUnsave(r)}
                  >
                    Unsave
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
