import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) console.error(error);
      setProfile(data || { user_id: user.id, display_name: "Nommer", avatar_url: null });
      setLoading(false);
    })();
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  function pickFile() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // basic checks (optional)
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert("Please choose an image under 2MB.");
      return;
    }

    setUploading(true);

    // get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    // file path in bucket
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;

    // upload (upsert true so re-uploads overwrite)
    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      console.error(uploadErr);
      alert(uploadErr.message);
      setUploading(false);
      return;
    }

    // get a public URL for display
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    // save URL to profile
    const { error: updateErr } = await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, avatar_url: publicUrl },
        { onConflict: "user_id" }
      );

    if (updateErr) {
      console.error(updateErr);
      alert(updateErr.message);
      setUploading(false);
      return;
    }

    setProfile((p) => ({ ...p, avatar_url: publicUrl }));
    setUploading(false);
    // reset input so the same file can be picked again later if desired
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) return (
    <main className="form-card">
      <h2>Profile</h2>
      <p style={{ color:"#fff" }}>Loading…</p>
    </main>
  );

  return (
    <section className="profile-wrap">
      <div className="profile-top">
        <div className="avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="avatar-img" />
          ) : (
            <span className="avatar-placeholder">+</span>
          )}

          {/* Small floating upload button on the avatar */}
          <button className="avatar-upload" onClick={pickFile} disabled={uploading}>
            {uploading ? "…" : "📷"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
        </div>

        <div className="greeting">
          Hello <strong>{profile?.display_name || "Nommer"}</strong>!
        </div>
      </div>

      <div className="menu-list">
        <button className="pill-btn">Play Roulette</button>
        <button className="pill-btn">Saved Restaurants</button>
        <button className="pill-btn">Map</button>
        <button className="pill-btn">Events</button>
        <button
          className="pill-btn"
          type="button"
          onClick={() => navigate("/preferences")}
        >
          Preferences
        </button>

        <button className="pill-btn">Settings</button>
      </div>

      <div className="profile-footer">
        <button className="link-btn" onClick={signOut}>Sign out</button>
      </div>
    </section>
  );
}
