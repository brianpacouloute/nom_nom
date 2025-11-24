import { getCache, setCache } from "./cache";

const TTL_MIN = 20; // how long before refreshing cache

export async function fetchRestaurantsNear(coords, radiusMeters = 2000) {
  if (!coords) return [];

  const key = `rest:${coords.lat.toFixed(3)},${coords.lng.toFixed(3)},${radiusMeters}`;
  const cached = getCache(key);
  if (cached) return cached;

  // Overpass Query
  const query = `
    [out:json];
    (
      node["amenity"="restaurant"](around:${radiusMeters},${coords.lat},${coords.lng});
      way["amenity"="restaurant"](around:${radiusMeters},${coords.lat},${coords.lng});
      relation["amenity"="restaurant"](around:${radiusMeters},${coords.lat},${coords.lng});
    );
    out center;
  `;

  const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

  try {
    const res = await fetch(url);
    const json = await res.json();

    const cleaned = json.elements
      .filter(el => el.tags && el.tags.name)
      .map(el => ({
        id: el.id,
        name: el.tags.name,
        cuisine: el.tags.cuisine || "Unknown",
        price: "$$",
        tags: [],
        openNow: true,
        lat: el.lat || el.center?.lat,
        lng: el.lon || el.center?.lon,
      }))
      .filter(r => r.lat && r.lng);

    // save 10-minute cache
    setCache(key, cleaned, TTL_MIN);
    return cleaned;

  } catch (e) {
    console.error("Restaurant API error:", e);
    return [];
  }
}
