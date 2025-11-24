import { useEffect, useState } from "react";

const STORAGE_KEY = "nomnom_last_coords";

export default function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try cached coords first
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (
          typeof parsed.lat === "number" &&
          typeof parsed.lng === "number"
        ) {
          setCoords({ lat: parsed.lat, lng: parsed.lng });
        }
      } catch {
        // ignore bad cache
      }
    }

    // Ask browser for current position
    if (!navigator.geolocation) {
      setError("Geolocation not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      (err) => {
        setError(err.message || "Failed to get location.");
      }
    );
  }, []);

  return { coords, error };
}
