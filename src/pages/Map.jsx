// src/pages/Map.jsx
import React, { useEffect, useState } from "react";
import useGeolocation from "../hooks/useGeolocation";
import { supabase } from "../lib/supabase";
import { getCurrentProfile } from "../lib/getProfile";
import { useSearchParams } from "react-router-dom";

import BackLink from "../lib/BackLink";

export default function MapPage() {
  // shared cached location 
  const { coords, error: geoError } = useGeolocation();
  const loadingGeo = !coords && !geoError;

  // saved restaurants
  const [restaurants, setRestaurants] = useState([]); 
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [restError, setRestError] = useState("");
  const [searchParams] = useSearchParams();

  const incomingName = searchParams.get("name");
  const incomingLat = searchParams.get("lat");
  const incomingLng = searchParams.get("lng");

  const [selectedId, setSelectedId] = useState(""); // restaurant_id
  const [customAddress, setCustomAddress] = useState("");

  const [mapUrl, setMapUrl] = useState("");
  useEffect(() => {
    const name = searchParams.get("name");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (name && lat && lng) {
      const embed = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
      setMapUrl(embed);

      setSelectedId(""); 
      setCustomAddress(name);
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      setLoadingRestaurants(true);
      setRestError("");

      try {
        const profile = await getCurrentProfile();
        if (!profile?.userId) {
          setRestError("You must be signed in to see saved restaurants.");
          setLoadingRestaurants(false);
          return;
        }

        const { data, error } = await supabase
          .from("favorites")
          .select("user_id, restaurant_id, name, cuisine, lat, lng, price")
          .eq("user_id", profile.userId)
          .order("name", { ascending: true });

        if (error) {
          console.error("[Map] error loading favorites:", error);
          setRestError("Failed to load saved restaurants.");
        } else {
          setRestaurants(data || []);
        }
      } catch (e) {
        console.error("[Map] unexpected error:", e);
        setRestError("Something went wrong loading your saved restaurants.");
      } finally {
        setLoadingRestaurants(false);
      }
    })();
  }, []);

  function getSelectedRestaurant() {
    if (!selectedId) return null;
    return (
      restaurants.find(
        (r) => String(r.restaurant_id) === String(selectedId)
      ) || null
    );
  }

  function handleShowOnMap() {
    const destRestaurant = getSelectedRestaurant();
    const destText = customAddress.trim();

    if (!destRestaurant && !destText) {
      alert("Pick a saved restaurant or type a destination address.");
      return;
    }

    // Prefer precise coordinates if we have them
    let destination = "";
    if (destRestaurant) {
      if (destRestaurant.lat != null && destRestaurant.lng != null) {
        destination = `${destRestaurant.lat},${destRestaurant.lng}`;
      } else {
        destination = destRestaurant.name;
      }
    } else {
      destination = destText;
    }

    if (!destination) {
      alert("The selected restaurant doesn’t have enough location info yet.");
      return;
    }

    // Embedded Google Map — no API key, just a search/marker view
    const embed = `https://www.google.com/maps?q=${encodeURIComponent(
      destination
    )}&output=embed`;

    setMapUrl(embed);
  }

  return (
    <main className="page-wrap">
      <BackLink to="/profile" />
      <h2 className="page-title">Map</h2>

      {/* location card */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h3>Your location</h3>

        {loadingGeo && <p>Trying to get your current location…</p>}

        {!loadingGeo && coords && (
          <p>
            We’ll start from your current area:
            <br />
            <small>
              (lat: {coords.lat.toFixed(4)}, lng: {coords.lng.toFixed(4)})
            </small>
          </p>
        )}

        {!loadingGeo && geoError && (
          <p style={{ color: "#7b1111" }}>{geoError}</p>
        )}

        <p style={{ fontSize: 13, marginTop: 8, color: "#444" }}>
          The embedded map will show the destination restaurant. You can still
          get full turn-by-turn directions inside Google Maps if you need to.
        </p>
      </section>

      {/* destination section */}
      <section className="card">
        <h3>Choose where you’re going</h3>

        {/* Saved restaurants dropdown */}
        <div className="field-group">
          <h4>Saved restaurants</h4>

          {loadingRestaurants && <p>Loading your saved places…</p>}

          {!loadingRestaurants && restError && (
            <p style={{ color: "#7b1111" }}>{restError}</p>
          )}

          {!loadingRestaurants &&
            !restError &&
            restaurants.length === 0 && (
              <p>You don’t have any saved restaurants yet.</p>
            )}

          {!loadingRestaurants && !restError && restaurants.length > 0 && (
            <select
              className="input"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">— Choose from your saved list —</option>
              {restaurants.map((r) => (
                <option key={r.restaurant_id} value={r.restaurant_id}>
                  {r.name}
                  {r.price ? ` • ${r.price}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* custom address field */}
        <div className="field-group" style={{ marginTop: 16 }}>
          <h4>Or type a destination</h4>
          <input
            className="input"
            placeholder="e.g. Jim Bob’s Fantastic Foods, Waterloo"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
          />
        </div>

        <div className="mt-24">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleShowOnMap}
          >
            Show on map
          </button>
        </div>
      </section>

      {/* embedded map */}
      {mapUrl && (
        <section className="card" style={{ marginTop: 24 }}>
          <h3>Map preview</h3>
          <div
            style={{
              position: "relative",
              paddingBottom: "60%",
              height: 0,
              overflow: "hidden",
              borderRadius: 16,
              boxShadow: "var(--shadow)",
            }}
          >
            <iframe
              title="Restaurant map"
              src={mapUrl}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
              loading="lazy"
              allowFullScreen
            />
          </div>
        </section>
      )}
    </main>
  );
}
