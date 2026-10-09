"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  Zap,
  MapPin,
  Cpu,
  Key,
  Bell,
  Sun,
  Moon,
  Save,
  CheckCircle2,
  HardDrive,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Smartphone,
  LogOut,
  ArrowLeft,
} from "lucide-react";

export default function ProfilePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("Raihaan Mahomed");
  const [email, setEmail] = useState("raihaan@rdesigns.co.za");
  const [location, setLocation] = useState("Pietermaritzburg, South Africa");
  const [nodeId, setNodeId] = useState("PMB-GRID-NODE-04");
  const [autoSellSurplus, setAutoSellSurplus] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Ambient Blur Background Orbs */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">
        
        {/* TOP NAVIGATION & CONTROLS */}
        <header className="glass-header flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="glass-icon-button"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </Link>

            <div className="flex items-center gap-3">
              <div className="feature-icon feature-water">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold tracking-[0.2em] text-white">
                    ACCOUNT & GRID SETTINGS
                  </h1>
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[8px] font-medium tracking-[0.15em] text-cyan-400">
                    VERIFIED RESIDENT
                  </span>
                </div>
                <p className="mt-0.5 text-[9px] tracking-[0.15em] text-muted">
                  MANAGE PERSONAL CREDENTIALS, NODE CONNECTIVITY & TRADING PARAMETERS
                </p>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Status Badge */}
            <div className="status-pill border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <span className="status-dot bg-cyan-400 shadow-[0_0_14px_#22d3ee]" />
              NODE SYNCHRONIZED
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="glass-icon-button"
              title="Toggle theme"
              aria-label="Toggle visual theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* PROFILE HEADER HERO CARD */}
        <div className="glass-panel p-6 relative flex flex-wrap items-center justify-between gap-6">
          <div className="panel-reflection" />

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center text-xl font-black text-white shadow-[0_0_25px_rgba(6,182,212,0.25)]">
              RM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{fullName}</h2>
                <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400" title="Verified Citizen">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">{email}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" /> {location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-cyan-300">
                  <Cpu className="w-3 h-3 text-cyan-400" /> Node: {nodeId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>

        {/* SUCCESS NOTIFICATION TOAST */}
        {savedSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn relative z-10">
            <CheckCircle2 className="w-4 h-4" /> Profile parameters and node configuration saved successfully.
          </div>
        )}

        {/* MAIN SETTINGS FORM & CONFIGURATION PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Personal Details & Location Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 space-y-4 relative">
              <div className="panel-reflection" />
              
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" /> Personal & Grid Identity
                </h2>
                <p className="text-xs text-muted mt-0.5">Update your contact information and municipal location tag</p>
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">Location Sector</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted block mb-1.5">Assigned Grid Node ID</label>
                  <input
                    type="text"
                    value={nodeId}
                    onChange={(e) => setNodeId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </form>
            </div>

            {/* P2P Trading Automation Preferences */}
            <div className="glass-panel p-6 space-y-4 relative">
              <div className="panel-reflection" />

              <div className="border-b border-white/10 pb-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Automated Energy & Mesh Policies
                </h2>
                <p className="text-xs text-muted mt-0.5">Control how your household interacts with the community grid</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3.5 bg-black/20 border border-white/5 rounded-2xl">
                  <div>
                    <p className="text-xs font-semibold text-white">Auto-Sell Solar Surplus</p>
                    <p className="text-[11px] text-muted">Automatically dump battery overflow to ResiMarket when rates peak</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoSellSurplus(!autoSellSurplus)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      autoSellSurplus ? "bg-amber-500" : "bg-white/10"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      autoSellSurplus ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-black/20 border border-white/5 rounded-2xl">
                  <div>
                    <p className="text-xs font-semibold text-white">High Priority Emergency Dispatch</p>
                    <p className="text-[11px] text-muted">Allow Civic AI to send instant push alerts for localized power/water outages</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmergencyAlerts(!emergencyAlerts)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      emergencyAlerts ? "bg-cyan-500" : "bg-white/10"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      emergencyAlerts ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECURITY, HARDWARE & ACTIVE SESSIONS SIDEBAR */}
          <div className="space-y-6">
            
            {/* Linked Hardware Telemetry */}
            <div className="glass-panel p-6 space-y-4 relative">
              <div className="panel-reflection" />

              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" /> Linked Hardware
                </h2>
                <span className="text-[10px] font-mono text-emerald-400">2 Connected</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">Sunsynk 8kW Inverter</p>
                    <p className="text-[10px] text-muted">Telemetry: Online • Modbus Active</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">KasiMesh Wi-Fi Router Node</p>
                    <p className="text-[10px] text-muted">Relaying • 12 Active Peers</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              <button className="w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-muted hover:text-white transition-colors flex items-center justify-center gap-1.5">
                Pair New Hardware <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Active Sessions & Security */}
            <div className="glass-panel p-6 space-y-4 relative">
              <div className="panel-reflection" />

              <div className="border-b border-white/10 pb-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Active Session & Auth
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">ASUS Vivobook / Web Session</p>
                    <p className="text-[10px] text-muted">Current Device • Pietermaritzburg</p>
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out All Devices
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
