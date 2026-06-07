// src/components/auth/UserMenu.jsx
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useRegionAccess } from "@/hooks/useRegionAccess";

export default function UserMenu({ onUpgrade }) {
  const { user } = useAuth();
  const { tier, daysLeft, permittedRegions } = useRegionAccess();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const initials = (user.email ?? "?")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  // Build tier label from subscription_status values stored in user_profiles
  function getTierLabel() {
    if (tier === "active")     return "Active subscription";
    if (tier === "cancelled")  return "Cancelled";
    if (tier === "free_trial") {
      if (daysLeft === null)   return "Free trial";
      if (daysLeft === 0)      return "Trial expired";
      if (daysLeft === 1)      return "Free trial · 1 day left";
      return `Free trial · ${daysLeft} days left`;
    }
    return "—";
  }

  const tierColor = {
    free_trial: daysLeft === 0 ? "text-red-500" : "text-amber-600",
    active:     "text-green-600",
    cancelled:  "text-slate-400",
  }[tier] ?? "text-slate-500";

  const showUpgrade = (tier === "free_trial" || tier === "cancelled") && onUpgrade;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 transition-colors"
      >
        <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-[10px] font-bold flex items-center justify-center select-none">
          {initials}
        </span>
        <span className="text-[11px] text-slate-600 hidden sm:block max-w-[120px] truncate">
          {user.email}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 text-xs">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-slate-800 font-medium truncate">{user.email}</p>
            <p className={`mt-0.5 font-semibold ${tierColor}`}>{getTierLabel()}</p>
            {permittedRegions.length > 0 && (
              <p className="text-slate-400 mt-0.5">
                Region: {permittedRegions.join(", ")}
              </p>
            )}
          </div>

          {showUpgrade && (
            <button
              onClick={() => { setOpen(false); onUpgrade(); }}
              className="w-full text-left px-3 py-2 text-cyan-600 font-semibold hover:bg-cyan-50 transition-colors"
            >
              Upgrade subscription →
            </button>
          )}

          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full text-left px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
