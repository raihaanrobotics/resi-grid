"use client";

import React, { useState, useEffect } from "react";
import {
  Navigation,
  Compass,
  MapPin,
  Clock,
  Activity,
  AlertTriangle,
  Radio,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon,
  Bus,
  Layers,
  Zap,
} from "lucide-react";

export default function RoutePulsePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [rerouteActive, setRerouteActive] = useState(false);
  const [avgTravelTime, setAvgTravelTime] = useState(24.2);
  const [transitEfficiency, setTransitEfficiency] = useState(91.8);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Live Transit Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAvgTravelTime(+(24 + (Math.random() * 1.8 - 0.9)).toFixed(1));
      setTransitEfficiency(+(91.5 + (Math.random() * 1.2 - 0.6)).toFixed(1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="resigrid-shell min-h-screen w-full text-[var(--text)] pb-32 pt-6 px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto space-y-6 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Dynamic Ambient Blur Background Orbs */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      {/* TOP NAVIGATION & CONTROLS */}
      <header className="glass-header p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 relative z-10 w-full">
        <div className="flex items-center gap-3">
          <div className="feature-icon feature-civic">
            <Navigation className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                RoutePulse™
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Transit Mesh Active
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Adaptive community transport routing, congestion mitigation & fleet tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Live System Indicator */}
          <div className="status-pill hidden sm:flex">
            <span className="status-dot" />
            <span>128 TRANSIT VEHICLES LIVE</span>
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

      {/* MAIN GRID: METRICS & MONITORING HERO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 w-full">
        
        {/* Metric 1: Average Commute Time */}
        <div className="glass-panel p-5 flex flex-col justify-between w-full">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">AVG COMMUTE TIME</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {avgTravelTime}
              </span>
              <span className="text-sm font-medium text-secondary">mins</span>
            </div>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> 14% Faster Than Peak Avg
            </span>
          </div>
          <div className="panel-bottom-glow text-indigo-400" />
        </div>

        {/* Metric 2: Network Efficiency */}
        <div className="glass-panel p-5 flex flex-col justify-between w-full">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">ROUTE EFFICIENCY</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {transitEfficiency}%
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${transitEfficiency}%` }}
              />
            </div>
          </div>
          <div className="panel-bottom-glow text-emerald-400" />
        </div>

        {/* Metric 3: Active Congestion Incidents */}
        <div className="glass-panel p-5 flex flex-col justify-between w-full">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">ACTIVE BOTTLENECKS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">3</span>
              <span className="text-sm font-medium text-secondary">Corridors</span>
            </div>
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3" /> Auto-Dynamic Rerouting On
            </span>
          </div>
          <div className="panel-bottom-glow text-amber-400" />
        </div>

        {/* Metric 4: Commuter Throughput */}
        <div className="glass-panel p-5 flex flex-col justify-between w-full">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">DAILY PASSENGERS</span>
            <Bus className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">14.2k</span>
              <span className="text-sm font-medium text-secondary">Commuters</span>
            </div>
            <span className="text-xs text-cyan-400 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Peak Flow Handled
            </span>
          </div>
          <div className="panel-bottom-glow text-cyan-400" />
        </div>

      </div>

      {/* MAIN SECTION: CORRIDOR MONITOR & DYNAMIC REROUTING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 w-full">
        
        {/* Transit Corridor Flow Grid */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between w-full">
          <div className="panel-reflection" />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" /> Main Transit Arterials
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Real-time congestion density & minibus taxi queue tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-secondary">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> Live Telemetry
              </span>
            </div>
          </div>

          {/* Simulated Transit Map Interface */}
          <div className="relative w-full h-60 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f10a_1px,transparent_1px),linear-gradient(to_bottom,#6366f10a_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-xs font-mono text-indigo-300">
                Arterial Corridor 1: CBD to Township North
              </div>
              <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-mono text-indigo-400">
                Optimal Speed: 48 km/h
              </div>
            </div>

            {/* Active Corridor Progress */}
            <div className="relative z-10 my-auto space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Main Taxi Rank Interchange
                  </span>
                  <span className="text-emerald-400 font-mono">0 mins delay</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full w-full rounded-full" />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Eastern Bypass Bottleneck
                  </span>
                  <span className="text-amber-400 font-mono">+6 mins delay</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-400 h-full w-[65%] rounded-full" />
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs text-secondary pt-2 border-t border-white/10">
              <span>Alternative By-pass Available: <strong>Route 4B</strong></span>
              <span className="text-indigo-400 font-semibold cursor-pointer hover:underline">
                View Dynamic Heatmap
              </span>
            </div>
          </div>

          {/* Stats Footer */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/5 text-center">
            <div>
              <span className="text-[10px] uppercase text-muted tracking-wider">Queue Time</span>
              <p className="text-sm font-semibold text-white mt-0.5">&lt; 4 Minutes</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted tracking-wider">Fleet Coverage</span>
              <p className="text-sm font-semibold text-indigo-400 mt-0.5">94% Connected</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted tracking-wider">Safety Index</span>
              <p className="text-sm font-semibold text-white mt-0.5">99.1% Secure</p>
            </div>
          </div>
        </div>

        {/* Dynamic Traffic Bypass Controller */}
        <div className="glass-panel p-6 flex flex-col justify-between w-full">
          <div className="panel-reflection" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" /> Dynamic Dispatch
              </h2>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  rerouteActive
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse"
                    : "bg-white/5 text-muted border border-white/10"
                }`}
              >
                {rerouteActive ? "AUTO-REROUTING" : "STANDARD FLOW"}
              </span>
            </div>

            <p className="text-xs text-secondary mb-6 leading-relaxed">
              Broadcast optimal detour routes directly to connected taxi associations and micro-transit operators to relieve bottleneck congestion.
            </p>

            <div className="bg-black/20 border border-white/5 rounded-2xl p-5 text-center space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={() => setRerouteActive(!rerouteActive)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    rerouteActive
                      ? "bg-indigo-500/10 border-2 border-indigo-400/50 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:scale-105"
                      : "bg-white/5 border-2 border-white/20 text-muted hover:text-white hover:scale-105"
                  }`}
                >
                  <Navigation className="w-8 h-8" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {rerouteActive ? "Smart Detour Broadcast Active" : "Trigger Dynamic Corridor Reroute"}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  Sends automated notifications to active drivers
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
              <span className="text-secondary">Corridor Load Clearance</span>
              <span className="font-semibold text-white">~12 Mins Saved</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-secondary">Broadcast Reach</span>
              <span className="font-semibold text-indigo-400">84 Active Fleet Units</span>
            </div>
          </div>
        </div>

      </div>

      {/* BENTO MODULES: KEY TRANSIT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10 w-full">
        
        {/* Module 1 */}
        <div className="glass-module feature-civic group cursor-pointer w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="module-icon">
              <Bus className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-indigo-400">CONNECT</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
            Taxi Association Mesh
          </h3>
          <p className="text-xs text-secondary mt-1">
            Real-time seat availability & departure sync between township ranks and city terminals.
          </p>
          <div className="module-inner-glow" />
        </div>

        {/* Module 2 */}
        <div className="glass-module feature-energy group cursor-pointer w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="module-icon">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-amber-400">OPTIMIZED</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
            First & Last Mile Shuttles
          </h3>
          <p className="text-xs text-secondary mt-1">
            Feeder route optimization targeting underserved residential clusters and industrial hubs.
          </p>
          <div className="module-inner-glow" />
        </div>

        {/* Module 3 */}
        <div className="glass-module feature-water group cursor-pointer w-full sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div className="module-icon">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-cyan-400">MONITORED</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
            Commuter Incident Shield
          </h3>
          <p className="text-xs text-secondary mt-1">
            Community-driven alert network reporting road hazards, flooding, and severe delays.
          </p>
          <div className="module-inner-glow" />
        </div>

      </div>

      {/* EVENT LOG & ROUTE DISRUPTIONS */}
      <div className="glass-panel p-6 relative z-10 w-full">
        <div className="panel-reflection" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Corridor Activity & Incident Feed
          </h2>
          <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
            View full log history <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div>
                <p className="text-xs font-medium text-white">Northern Arterial Flow Normalized</p>
                <p className="text-[10px] text-muted">Traffic bottleneck cleared near Interchange 3</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-secondary">Today, 14:10</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <p className="text-xs font-medium text-white">Minor Delay Dispatched — Route 7</p>
                <p className="text-[10px] text-muted">Roadworks on Main Road causing 5-minute buildup</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-secondary">Today, 12:45</span>
          </div>
        </div>
      </div>

    </div>
  );
}
