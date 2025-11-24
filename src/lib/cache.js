// src/lib/cache.js
const TTL_MS = 1000 * 60 * 5; // 5 minutes

export function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    if (Date.now() - t > TTL_MS) return null;
    return v;
  } catch {
    return null;
  }
}

export function setCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value }));
  } catch {}
}
