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

// ── Eye icon ──────────────────────────────────────────────────────────────────
function EyeIcon({ visible }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PasswordInput({ placeholder, value, onChange, required, autoFocus, style }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoFocus={autoFocus}
        style={{ ...style, marginBottom: 0, paddingRight: "2.5rem" }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "#94a3b8", padding: 2, display: "flex", alignItems: "center",
        }}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        <EyeIcon visible={show} />
      </button>
    </div>
  );
}

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
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) markReady();
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
    borderRadius: 8, fontSize: 15, boxSizing: "border-box",
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
        <h2 style={{ margin: "0 0 8px", color: DARK }}>Passw