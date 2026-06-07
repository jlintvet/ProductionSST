// src/pages/MarketingLanding.jsx
// Standalone marketing + auth page. No AppShell import — avoids circular deps.
// Shows pricing tiers and handles login/signup via Supabase directly.

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

const TEAL = "#0e7490";
const DARK = "#0f172a";

// ── Feature lists ─────────────────────────────────────────────────────────────
const BASE_FEATURES = [
  "Sea Surface Temperature (SST) maps",
  "Departure port planning — heading & distance",
  "NOAA weather integration",
  "Wind map",
  "Chlorophyll & sea color layers",
  "Bathymetry contours",
  "Saved locations",
];

const PRO_FEATURES = [
  "Everything in Base, plus:",
  "Fishing hotspot scoring & map",
  "Isotherm overlay",
  "Color gain control (SST, CHL, sea color)",
  "Wreck locations",
  "Wind overlay on map",
  "Shared locations",
];

// ── Auth form ─────────────────────────────────────────────────────────────────
function AuthForm() {
  const [mode, setMode]         = useState("login");   // "login" | "register" | "reset"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [sent, setSent]         = useState(false);     // register confirm email sent
  const [resetSent, setResetSent] = useState(false);   // reset email "sent"

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inp = {
    width: "100%", padding: "0.65rem 0.9rem", border: "1px solid #cbd5e1",
    borderRadius: 8, fontSize: 15, marginBottom: 12, boxSizing: "border-box",
    outline: "none", fontFamily: "inherit",
  };
  const btn = {
    width: "100%", padding: "0.75rem", background: TEAL, color: "#fff",
    border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
    marginTop: 4, fontFamily: "inherit",
  };
  const lnk = {
    background: "none", border: "none", color: TEAL, cursor: "pointer",
    fontSize: 14, textDecoration: "underline", padding: 0, fontFamily: "inherit",
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault(); setError(null); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
  }

  async function handleRegister(e) {
    e.preventDefault(); setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) setError(err.message); else setSent(true);
  }

  async function handleReset(e) {
    e.preventDefault(); setError(null);
    if (!resetEmail.trim()) { setError("Enter your email address."); return; }
    setLoading(true);
    // Always show success — never reveal whether the email is registered (prevents enumeration)
    await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setResetSent(true);
  }

  // ── Views ─────────────────────────────────────────────────────────────────

  // Register confirmation sent
  if (sent) return (
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
      <h3 style={{ margin: "0 0 8px", color: DARK }}>Check your email</h3>
      <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px" }}>
        We sent a confirmation link to <strong>{email}</strong>.<br/>
        Click it to activate your account and start your 14-day Pro trial.
      </p>
      <button style={{ ...btn, background: "#64748b" }} onClick={() => { setSent(false); setMode("login"); }}>
        Back to sign in
      </button>
    </div>
  );

  // Password reset — success state
  if (resetSent) return (
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
      <h3 style={{ margin: "0 0 8px", color: DARK }}>Check your email</h3>
      <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px" }}>
        If <strong>{resetEmail}</strong> is a registered account, a password reset link has been sent.
      </p>
      <button style={{ ...btn, background: "#64748b" }}
        onClick={() => { setResetSent(false); setMode("login"); setResetEmail(""); }}>
        Back to sign in
      </button>
    </div>
  );

  // Password reset — email input
  if (mode === "reset") return (
    <div>
      <h3 style={{ margin: "0 0 6px", fontSize: 18, color: DARK }}>Reset your password</h3>
      <p style={{ margin: "0 0 18px", fontSize: 14, color: "#64748b" }}>
        Enter the email address for your account and we'll send a reset link.
      </p>
      <form onSubmit={handleReset}>
        <input style={inp} type="email" placeholder="Email address" value={resetEmail}
          onChange={e => setResetEmail(e.target.value)} required autoFocus />
        {error && (
          <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 10px", padding: "8px 12px", background: "#fef2f2", borderRadius: 6 }}>
            {error}
          </p>
        )}
        <button style={btn} type="submit" disabled={loading}>
          {loading ? "…" : "Send reset link"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button type="button" style={lnk} onClick={() => { setMode("login"); setError(null); }}>
          Back to sign in
        </button>
      </div>
    </div>
  );

  // Login / Register
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["login", "register"].map(m => (
          <button key={m} onClick={() => { setMode(m); setError(null); }} style={{
            flex: 1, padding: "0.55rem", borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            background: mode === m ? TEAL : "#f1f5f9",
            color: mode === m ? "#fff" : "#64748b",
            border: mode === m ? `2px solid ${TEAL}` : "2px solid #e2e8f0",
          }}>
            {m === "login" ? "Sign in" : "Start free trial"}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <p style={{ fontSize: 13, color: "#0e7490", background: "#f0f9ff", borderRadius: 8, padding: "8px 12px", margin: "0 0 14px", textAlign: "center" }}>
          🎣 14-day free Pro trial — no credit card required
        </p>
      )}

      <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
        <input style={inp} type="email" placeholder="Email address" value={email}
          onChange={e => setEmail(e.target.value)} required autoFocus />
        <input style={inp} type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} required />
        {mode === "login" && (
          <div style={{ textAlign: "right", marginTop: -8, marginBottom: 10 }}>
            <button type="button" style={lnk} onClick={() => { setMode("reset"); setError(null); }}>
              Forgot password?
            </button>
          </div>
        )}
        {mode === "register" && (
          <input style={inp} type="password" placeholder="Confirm password" value={confirm}
            onChange={e => setConfirm(e.target.value)} required />
        )}
        {error && (
          <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 10px", padding: "8px 12px", background: "#fef2f2", borderRadius: 6 }}>
            {error}
          </p>
        )}
        <button style={btn} type="submit" disabled={loading}>
          {loading ? "…" : mode === "login" ? "Sign in" : "Create account & start trial"}
        </button>
      </form>
    </div>
  );
}

// ── Pricing card ──────────────────────────────────────────────────────────────
function PricingCard({ name, price, features, highlight, badge }) {
  return (
    <div style={{
      background: highlight ? TEAL : "#fff",
      color: highlight ? "#fff" : DARK,
      borderRadius: 16,
      padding: "2rem 1.75rem",
      flex: 1,
      minWidth: 240,
      maxWidth: 320,
      boxShadow: highlight ? "0 8px 32px rgba(14,116,144,0.25)" : "0 2px 12px rgba(0,0,0,0.08)",
      border: highlight ? "none" : "1px solid #e2e8f0",
      position: "relative",
    }}>
      {badge && (
        <div style={{
          position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
          background: "#f59e0b", color: "#fff", borderRadius: 20, padding: "4px 14px",
          fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
        }}>
          {badge}
        </div>
      )}
      <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>{name}</h3>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 38, fontWeight: 800 }}>${price}</span>
        <span style={{ fontSize: 14, opacity: 0.7 }}>/year</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {features.map((f, i) => (
          <li key={i} style={{
            padding: "6px 0", fontSize: 14,
            color: highlight ? "rgba(255,255,255,0.9)" : "#475569",
            fontWeight: i === 0 && f.includes("Everything") ? 600 : 400,
          }}>
            {!f.includes("Everything") && (
              <span style={{ marginRight: 8, color: highlight ? "#7dd3fc" : TEAL }}>✓</span>
            )}
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MarketingLanding({ onAuthSuccess }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f0f9ff", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #0c4a6e 60%, #0e7490 100%)`,
        padding: "4rem 2rem 3rem",
        textAlign: "center",
        color: "#fff",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: 2, color: "#7dd3fc", marginBottom: 12, textTransform: "uppercase" }}>
          🎣 OceanPulse SST
        </div>
        <h1 style={{ margin: "0 0 16px", fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.15 }}>
          Find Fish.<br/>Not Guesswork.
        </h1>
        <p style={{ margin: "0 auto", maxWidth: 560, fontSize: 18, color: "#bae6fd", lineHeight: 1.6 }}>
          Real-time sea surface temperature, chlorophyll, bathymetry, and wind data —
          built for offshore anglers who need to know where the bite is before they leave the dock.
        </p>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem",
        display: "flex", flexWrap: "wrap", gap: "3rem", alignItems: "flex-start",
      }}>

        {/* Auth box */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "2rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          minWidth: 300, flex: "1 1 300px", maxWidth: 400,
        }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, color: DARK }}>Get started</h2>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b" }}>
            New accounts get a 14-day free Pro trial.
          </p>
          <AuthForm />
        </div>

        {/* Pricing */}
        <div style={{ flex: "2 1 500px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 24, color: DARK, fontWeight: 700 }}>Pricing</h2>
          <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 15 }}>
            Simple annual pricing. Cancel anytime.
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <PricingCard name="Base" price={29} features={BASE_FEATURES} />
            <PricingCard name="Pro" price={69} features={PRO_FEATURES} highlight badge="Most Popular" />
          </div>
          <p style={{ margin: "20px 0 0", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
            All plans include a 14-day free Pro trial · No credit card required to start
          </p>
        </div>
      </div>

      {/* Feature strip */}
      <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "center" }}>
          {[
            { icon: "🌊", label: "Live SST data updated daily" },
            { icon: "🐟", label: "Fishing hotspots (Pro)" },
            { icon: "🗺️", label: "Chlorophyll, bathy & sea color" },
            { icon: "💨", label: "Wind & NOAA weather" },
            { icon: "📍", label: "Save & share locations" },
            { icon: "🎯", label: "Departure port planning" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ textAlign: "center", minWidth: 140 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
