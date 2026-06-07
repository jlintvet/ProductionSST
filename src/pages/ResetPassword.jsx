// src/pages/ResetPassword.jsx
// Handles the Supabase password-reset callback.
//
// Flow:
//   1. User clicks reset link → lands at /reset-password#access_token=...&type=recovery
//   2. Supabase client processes the hash immediately on initialization (before React mounts)
//   3. We check both the URL hash AND onAuthStateChange to cover the race condition
//      where PASSWORD_RECOVERY fires before our listener is registered.

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const TEAL = "#0e7490";
const DARK = "#0f172a";

export default function ResetPassword() {
  // "waiting" | "ready" | "expired"
  const [status, setStatus]     = useState("waiting");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    let cancelled = false;

    function markReady() {
      if (!cancelled) setStatus("ready");
    }

    // ── Strategy A: event-based ──────────────────────────────────────────────
    // Catches the case where the hash is processed AFTER this component mounts.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") markReady();
    });

    // ── Strategy B: check immediately ────────────────────────────────────────
    // The Supabase client may have already processed the hash (and fired the
    // event) before React mounted this component. In that case the event is
    // missed above — so we also check the hash + current session right now.
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    if (hashParams.get("type") === "recovery") {
      // Hash says recovery — confirm a session exists (token was accepted)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) markReady();
        // If no session yet, strategy A will catch the event when it fires
      });
    }

    // ── Fallback timeout ─────────────────────────────────────────────────────
    const timeout = setTimeout(() => {
      if (!cancelled) setStatus(s => s === "waiting" ? "expired" : s);
    }, 6000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    await supabase.auth.signOut();
    setDone(true);
  }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const wrap = {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#f0f9ff",
    fontFamily: "'Inter', system-ui, sans-serif",
  };
  const card = {
    background: "#fff", borderRadius: 16, padding: "2rem",
    maxWidth: 380, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  };
  const inp = {
    width: "100%", padding: "0.65rem 0.9rem", border: "1px solid #cbd5e1",
    borderRadius: 8, fontSize: 15, marginBottom: 12, boxSizing: "border-box",
    outline: "none", fontFamily: "inherit",
  };
  const btn = {
    width: "100%", padding: "0.75rem", background: TEAL, color: "#fff",
    border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
    fontFamily: "inherit",
  };

  // ── Done ───────────────────────────────────────────────────────────────────
  if (done) return (
    <div style={wrap}>
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <h2 style={{ margin: "0 0 8px", color: DARK }}>Password updated</h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
          Your password has been changed. Sign in with your new password.
        </p>
        <button style={btn} onClick={() => window.location.href = "/"}>
          Go to sign in
        </button>
      </div>
    </div>
  );

  // ── Waiting for recovery event ─────────────────────────────────────────────
  if (status === "waiting") return (
    <div style={wrap}>
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid #e0f2fe", borderTopColor: TEAL,
          animation: "spin 0.7s linear infinite",
          margin: "0 auto 16px",
        }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#64748b", fontSize: 14 }}>Verifying reset link…</p>
      </div>
    </div>
  );

  // ── Expired / invalid link ────────────────────────────────────────────────
  if (status === "expired") return (
    <div style={wrap}>
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ margin: "0 0 8px", color: DARK }}>Link expired or invalid</h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
          This password reset link has expired or is no longer valid.
          Please request a new one from the sign-in page.
        </p>
        <button style={btn} onClick={() => window.location.href = "/"