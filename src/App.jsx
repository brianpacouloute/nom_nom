import React, { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

import Welcome from "./pages/Welcome.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import CreateProfile from "./pages/CreateProfile.jsx";
import Preferences from "./pages/Preferences.jsx";
import Roulette from "./pages/Roulette.jsx";
import MapView from "./pages/Map.jsx";
import SavedRestaurants from "./pages/SavedRestaurants.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setAuthReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!authReady) {
    // simple splash; you can style this if you want
    return null;
  }

  return (
    <>
     <header className="site-header">
      <div className="navbar">
        <div className="brand">🍜 Nom Nom Wheel</div>

        <nav className="nav">
          <Link to="/">Home</Link>

          {user ? (
            <>
              <Link to="/roulette">Roulette</Link>
              <Link to="/map">Map</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/preferences">Preferences</Link>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>


      <Routes>
        <Route path="/" element={<Welcome user={user} />} />

        <Route
          path="/login"
          element={user ? <Navigate to="/profile" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/profile" replace /> : <Signup />}
        />

        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/roulette" element={<Roulette />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/saved" element={<SavedRestaurants />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
