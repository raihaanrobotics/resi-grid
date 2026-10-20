"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle2,
  ArrowRight,
  Shield,
  KeyRound,
} from "lucide-react";

export default function EmailConfirmedPage() {
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate initial load and check local preferences / theme
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 300);

    try {
      const savedAccent = localStorage.getItem("resigrid_accent_theme");
      if (savedAccent) {
        // Apply saved theme color if available
      }
    } catch (e) {
      console.error("Error reading saved preferences:", e);
    }

    return () => clearTimeout(timer);
  }, []);

  if (authLoading) {
    return (
      <main className="resigrid-shell min-h-screen flex items-center justify-center text-white bg-black">
        <div className="animate-pulse text-xs tracking-[0.2em] text-teal-300 font-mono">LOADING VERIFICATION...</div>
      </main>
    );
  }

  return (
    <main className="resigrid-shell min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 text-[var(--text)] bg-black selection:bg-teal-500/30 selection:text-teal-200 relative overflow-x-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-[140px] pointer-events-none bg-teal-500/20" />
      <div className="absolute top-1/2 -right-32 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-[140px] pointer-events-none bg-purple-500/20" />
      <div className="absolute -bottom-32 left-1/3 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-[140px] pointer-events-none bg-amber-500/20" />

      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="glass-panel p-5 sm:p-8 w-full max-w-md relative z-20 space-y-5 sm:space-y-6 shadow-2xl border-white/20 my-auto text-center mx-3 sm:mx-auto">
        <div className="panel-reflection pointer-events-none" />

        <div className="space-y-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto text-teal-300 shadow-lg">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-base sm:text-xl font-bold tracking-wider text-white">
            EMAIL VERIFIED SUCCESSFULLY
          </h1>
          <p className="text-xs text-muted leading-relaxed px-1">
            Your account has been securely authenticated and registered on the ResiGrid network.
          </p>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 text-left shadow-inner">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
            <Shield className="w-4 h-4 shrink-0" />
            <span>Next Steps</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Please <strong className="text-white">return to the ResiGrid app</strong> and log in using your registered email address and password details to access your portal.
          </p>
        </div>

        <div className="pt-2">
          <a
            href="/"
            className="w-full py-3 rounded-xl border border-teal-500/50 bg-teal-600/20 hover:bg-teal-600/30 text-teal-200 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer touch-manipulation"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="text-[10px] text-muted pt-2">
          ResiGrid Infrastructure &amp; Municipal Service Management Network
        </div>
      </div>
    </main>
  );
}
