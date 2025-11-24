import { supabase } from "./supabase";

export async function getCurrentProfile() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    throw userErr || new Error("Not signed in");
  }

  const user = userData.user;

  // Load profile row from DB
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "display_name, preferred_cuisines, dietary_restrictions, price_tier, radius_km, open_now_only, include_visited, role, daily_spins, last_spin_date"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = data || {};

  const cuisines =
    row.preferred_cuisines
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) || [];

  const dietary =
    row.dietary_restrictions
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) || [];

  return {
    // identity
    userId: user.id,
    email: user.email || "",
    displayName: row.display_name || "Nommer",

    // food prefs
    cuisines,
    dietary,
    price: row.price_tier || "$$",
    radiusKm: row.radius_km ?? 5,
    openNow: !!row.open_now_only,
    includeVisited: !!row.include_visited,

    // roulette / admin
    role: row.role || "user",
    dailySpins: row.daily_spins ?? 0,
    lastSpinDate: row.last_spin_date || null,
  };
}
