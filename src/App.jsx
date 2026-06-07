// src/App.jsx
// Uses getUser() (server-validated) instead of getSession() (localStorage cache).
// getSession() can return stale tokens; getUser() confirms with Supabase server.

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import SSTLive from "@/pages/SSTLive";
import LandingPage from "@/pages/LandingPage";
import SharedLocationLanding from "@/pages/SharedLocationLanding";
import WreckReviewAdmin from "@/pages/WreckReviewAdmin";

function AppRoot() {
  // undefined = still checking, false = not authed, true = authed
  const [authed, setAuthed] = useState(undefined);

  useEffect(() => {
    // getUser() validates server-side — no stale localStorage tokens
    supabase.auth.getUser()
      .then(({ data, error }) => {
        const ok = !error && !!data?.user?.email;
        console.log("[APP:AUTH] getUser →", { email: data?.user?.email ?? null, error: error?.message ?? null, ok });
        setAuthed(ok);
      })
      .catch(err => {
        console.log("[APP:AUTH] getUser threw →", err?.message);
        setAuthed(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const ok = !!session?.user?.email;
      console.log("[APP:AUTH] change →", session?.user?.email ?? null, ok);
      setAuthed(ok);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authed === undefined) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#f0f9ff",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid #e0f2fe",
          borderTopColor: "#0e7490",
          animation: "spin 0.7s linear infinite",
        }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!authed) {
    return <LandingPage onAuthSuccess={() => {}} />;
  }

  return (
    <Router>
      <Routes>
<Route path="/share" element={<SharedLocationLanding />} />
        <Route path="/wreck-review" element={<WreckReviewAdmin />} />
        <Route path="/*" element={<SSTLive />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return <AppRoot />;
}
