"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  ShieldCheck,
  Activity,
  AlertTriangle,
  RefreshCw,
  Power,
  Layers,
  BarChart3,
  Sliders,
  Cpu,
  Clock,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  Radio,
  CheckCircle2,
  XCircle,
  Wifi,
  Bell,
  SlidersHorizontal,
} from "lucide-react";

export default function VoltShieldPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [breakerActive, setBreakerActive] = useState(true);
  const [liveVoltage, setLiveVoltage] = useState(230.4);
  const [liveLoad, setLiveLoad] = useState(3.42);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Real-time Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVoltage(+(230 + (Math.random() * 2.8 - 1.4)).toFixed(1));
      setLiveLoad(+(3.4 + (Math.random() * 0.16 - 0.08)).toFixed(2));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="resigrid-shell min-h-screen text-[var(--text)] pb-32 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Dynamic Ambient Blur Background Orbs */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      {/* TOP NAVIGATION & CONTROLS */}
      <header className="glass-header p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="feature-icon feature-energy">
            <Zap className="w-5 h-5 text-amber-400"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                VoltShield™
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Surge Armor Active
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              High-frequency transient protection & power quality telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Live System Indicator */}
          <div className="status-pill hidden sm:flex">
            <span className="status-dot" />
            <span>99.98% GRID STABILITY</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="glass-icon-button"
            title="Toggle theme"
            aria-label="Toggle visual theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4"/>
            ) : (
              <Moon className="w-4 h-4"/>
            )}
          </button>
        </div>
      </header>

      {/* MAIN GRID: METRICS & MONITORING HERO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        {/* Metric 1: Grid Voltage */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">GRID VOLTAGE</span>
            <Activity className="w-4 h-4 text-emerald-400"/>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {liveVoltage}
              </span>
              <span className="text-sm font-medium text-secondary">V AC</span>
            </div>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3"/> Nominal (230V ±2.5%)
            </span>
          </div>
          <div className="panel-bottom-glow text-emerald-400" />
        </div>

        {/* Metric 2: Active Power Draw */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">ACTIVE LOAD</span>
            <Zap className="w-4 h-4 text-amber-400"/>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {liveLoad}
              </span>
              <span className="text-sm font-medium text-secondary">kW</span>
            </div>
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3"/> 42% Peak Capacity
            </span>
          </div>
          <div className="panel-bottom-glow text-amber-400" />
        </div>

        {/* Metric 3: Surge Varistor Wear */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">SPD HEALTH</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400"/>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">98.4</span>
              <span className="text-sm font-medium text-secondary">%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full"
                style={{ width: "98.4%" }}
              />
            </div>
          </div>
          <div className="panel-bottom-glow text-cyan-400" />
        </div>

        {/* Metric 4: Frequency */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">GRID FREQUENCY</span>
            <Radio className="w-4 h-4 text-purple-400"/>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">50.02</span>
              <span className="text-sm font-medium text-secondary">Hz</span>
            </div>
            <span className="text-xs text-purple-400 font-medium flex items-center gap-1 mt-1">
              <Wifi className="w-3 h-3"/> Synced to Local Phase
            </span>
          </div>
          <div className="panel-bottom-glow text-purple-400" />
        </div>

      </div>

      {/* MAIN SECTION: WAVEFORM & NODE PROTECTION CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Real-time Oscilloscope Telemetry Panel */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between">
          <div className="panel-reflection" />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400"/> Transient Spike Oscilloscope
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Real-time harmonic distortion and transient surge tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-secondary">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
              </span>
            </div>
          </div>

          {/* Simulated Oscilloscope Waveform Display */}
          <div className="relative w-full h-56 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]" />
            
            <svg
              className="w-full h-full relative z-10 stroke-emerald-400/80 fill-none"
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 75 Q 31.25 15, 62.5 75 T 125 75 T 187.5 75 T 250 75 T 312.5 75 T 375 75 T 437.5 75 T 500 75"
                strokeWidth="2.5"
                className="transition-all duration-300"
              />
              <path
                d="M 0 75 Q 31.25 10, 62.5 75 T 125 75 T 187.5 75 T 250 75 T 312.5 75 T 375 75 T 437.5 75 T 500 75"
                strokeWidth="1"
                stroke="rgba(52, 211, 153, 0.25)"
              />
            </svg>

            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-mono text-emerald-300">
              THD: 1.2% | Vpeak: 325.8V
            </div>
          </div>

          {/* Waveform Stats Footer */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/5 text-center">
            <div>
              <span className="text-[10px] uppercase text-muted tracking-wider">Clamp Threshold</span>
              <p className="text-sm font-semibold text-white mt-0.5">275V AC</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted tracking-wider">Response Time</span>
              <p className="text-sm font-semibold text-emerald-400 mt-0.5">&lt; 15 Nanoseconds</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted tracking-wider">Energy Rating</span>
              <p className="text-sm font-semibold text-white mt-0.5">4,500 Joules</p>
            </div>
          </div>
        </div>

        {/* Protection & Hardware Breaker Panel */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="panel-reflection" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Power className="w-4 h-4 text-amber-400"/> Breaker Control
              </h2>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  breakerActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {breakerActive ? "ARMED" : "ISOLATED"}
              </span>
            </div>

            <p className="text-xs text-secondary mb-6 leading-relaxed">
              Solid-state surge isolation breaker. Disconnects main circuitry automatically upon sensing transient spikes &gt; 300V.
            </p>

            <div className="bg-black/20 border border-white/5 rounded-2xl p-5 text-center space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={() => setBreakerActive(!breakerActive)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    breakerActive
                      ? "bg-emerald-500/10 border-2 border-emerald-400/50 text-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.25)] hover:scale-105"
                      : "bg-red-500/10 border-2 border-red-400/50 text-red-400 shadow-[0_0_30px_rgba(248,113,113,0.25)] hover:scale-105"
                  }`}
                >
                  <Power className="w-8 h-8"/>
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {breakerActive ? "Main Circuit Protection Armed" : "Protection Breaker Disengaged"}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  Click to toggle physical relay isolation
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
              <span className="text-secondary">Automatic Trip Sensitivity</span>
              <span className="font-semibold text-white">Ultra-Fast (15ms)</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-secondary">Earth Leakage Relay</span>
              <span className="font-semibold text-emerald-400">Normal (0mA)</span>
            </div>
          </div>
        </div>

      </div>

      {/* BENTO MODULES: HARDWARE NODES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        
        {/* Node 1 */}
        <div className="glass-module feature-energy group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="module-icon">
              <Zap className="w-5 h-5"/>
            </div>
            <span className="text-xs font-mono text-emerald-400">230V OK</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
            Main Distribution Board
          </h3>
          <p className="text-xs text-secondary mt-1">
            Primary MOV array online. Zero surge suppressions logged in last 24h.
          </p>
          <div className="module-inner-glow" />
        </div>

        {/* Node 2 */}
        <div className="glass-module feature-water group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="module-icon">
              <Cpu className="w-5 h-5"/>
            </div>
            <span className="text-xs font-mono text-cyan-400">SYNCED</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
            Solar & Inverter Bypass
          </h3>
          <p className="text-xs text-secondary mt-1">
            Pure sine wave clean-up active. Dual isolator functioning normally.
          </p>
          <div className="module-inner-glow" />
        </div>

        {/* Node 3 */}
        <div className="glass-module feature-civic group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="module-icon">
              <ShieldCheck className="w-5 h-5"/>
            </div>
            <span className="text-xs font-mono text-purple-400">PROTECTED</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-pink-300 transition-colors">
            Sensitive Electronics Bus
          </h3>
          <p className="text-xs text-secondary mt-1">
            Secondary EMI/RFI filter active. Ultra-low noise threshold enabled.
          </p>
          <div className="module-inner-glow" />
        </div>

      </div>

      {/* EVENT LOG & ALERTS */}
      <div className="glass-panel p-6 relative z-10">
        <div className="panel-reflection" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400"/> Telemetry & Transient Logs
          </h2>
          <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
            View full log history <ChevronRight className="w-3.5 h-3.5"/>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div>
                <p className="text-xs font-medium text-white">System Auto-Diagnostics Completed</p>
                <p className="text-[10px] text-muted">All MOV varistors operational. Ground resistance 0.2 Ohms.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-secondary">Today, 14:32</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <p className="text-xs font-medium text-white">Minor Voltage Sag Suppressed</p>
                <p className="text-[10px] text-muted">Grid dipped to 212V for 40ms. Clamped seamlessly.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-secondary">Yesterday, 09:14</span>
          </div>
        </div>
      </div>

    </div>
  );
}
