"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wifi,
  Share2,
  Signal,
  Radio,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Sun,
  Moon,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Zap,
  Globe,
  HardDrive,
  ArrowLeft,
} from "lucide-react";

export default function KasiMeshPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [meshActive, setMeshActive] = useState(true);
  const [connectedNodes, setConnectedNodes] = useState(64);
  const [bandwidthThroughput, setBandwidthThroughput] = useState(482.4);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Live Network Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectedNodes(Math.floor(62 + Math.random() * 5));
      setBandwidthThroughput(+(480 + (Math.random() * 8.5 - 4.25)).toFixed(1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] selection:bg-purple-500/30 selection:text-purple-200">
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
              <div className="feature-icon feature-civic">
                <Wifi className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold tracking-[0.2em] text-white">
                    KASIMESH™
                  </h1>
                  <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[8px] font-medium tracking-[0.15em] text-purple-400">
                    P2P NETWORK ACTIVE
                  </span>
                </div>
                <p className="mt-0.5 text-[9px] tracking-[0.15em] text-muted">
                  DECENTRALIZED TOWNSHIP WI-FI MESH & OFF-GRID TELEMETRY
                </p>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Live System Indicator */}
            <div className="status-pill border-purple-500/20 bg-purple-500/10 text-purple-400">
              <span className="status-dot bg-purple-400 shadow-[0_0_14px_#c084fc]" />
              COMMUNITY MESH ONLINE
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Metric 1: Active Mesh Nodes */}
          <div className="glass-panel p-5 flex flex-col justify-between relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow">ACTIVE MESH NODES</span>
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {connectedNodes}
                </span>
                <span className="text-sm font-medium text-muted">Peers</span>
              </div>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> 100% Interconnected
              </span>
            </div>
            <div className="panel-bottom-glow bg-purple-500 opacity-15" />
          </div>

          {/* Metric 2: Network Throughput */}
          <div className="glass-panel p-5 flex flex-col justify-between relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow">MESH THROUGHPUT</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {bandwidthThroughput}
                </span>
                <span className="text-sm font-medium text-muted">Mbps</span>
              </div>
              <span className="text-xs text-cyan-400 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> High Performance
              </span>
            </div>
            <div className="panel-bottom-glow bg-cyan-500 opacity-15" />
          </div>

          {/* Metric 3: Off-Grid Uptime */}
          <div className="glass-panel p-5 flex flex-col justify-between relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow">GRID INDEPENDENCE</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">99.9%</span>
                <span className="text-sm font-medium text-muted">Battery Backup</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{ width: "99.9%" }}
                />
              </div>
            </div>
            <div className="panel-bottom-glow bg-amber-500 opacity-15" />
          </div>

          {/* Metric 4: Community Data Shared */}
          <div className="glass-panel p-5 flex flex-col justify-between relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow">COMMUNITY DATA</span>
              <Globe className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">2.4</span>
                <span className="text-sm font-medium text-muted">TB Shared</span>
              </div>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3" /> Encrypted & Zero-Cost
              </span>
            </div>
            <div className="panel-bottom-glow bg-emerald-500 opacity-15" />
          </div>

        </div>

        {/* MAIN SECTION: MESH TOPOLOGY & RELAY SWITCH */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Network Topology Visualizer */}
          <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between relative">
            <div className="panel-reflection" />
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-400" /> Peer Node Connectivity & Relays
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Real-time node-to-node signal strength and packet hopping
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-muted">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> Topology Active
                </span>
              </div>
            </div>

            {/* Simulated Topology Radar Display */}
            <div className="relative w-full h-60 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-xs font-mono text-purple-300">
                  Primary Backhaul: Gateway Alpha
                </div>
                <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs font-mono text-purple-400">
                  Avg Latency: 8ms
                </div>
              </div>

              {/* Active Relay Nodes Grid */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 my-auto">
                <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                  <p className="text-[10px] text-muted uppercase">Relay Sector 1</p>
                  <p className="text-sm font-bold text-white mt-0.5">Node #22 (Solar)</p>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                    <Signal className="w-3 h-3" /> -58 dBm (Excellent)
                  </span>
                </div>
                <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                  <p className="text-[10px] text-muted uppercase">Relay Sector 2</p>
                  <p className="text-sm font-bold text-white mt-0.5">Node #41 (Battery)</p>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                    <Signal className="w-3 h-3" /> -62 dBm (Strong)
                  </span>
                </div>
                <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                  <p className="text-[10px] text-muted uppercase">Relay Sector 3</p>
                  <p className="text-sm font-bold text-white mt-0.5">Node #19 (Mesh Bridge)</p>
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
                    <Signal className="w-3 h-3" /> -74 dBm (Fair)
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between text-xs text-muted pt-2 border-t border-white/10">
                <span>Off-Grid Emergency Protocol: <strong className="text-white">ENABLED</strong></span>
                <span className="text-purple-400 font-semibold cursor-pointer hover:underline">
                  View Node Map
                </span>
              </div>
            </div>

            {/* Stats Footer */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/5 text-center">
              <div>
                <span className="text-[10px] uppercase text-muted tracking-wider">Encryption</span>
                <p className="text-sm font-semibold text-white mt-0.5">WPA3-Enterprise</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted tracking-wider">Hop Limit</span>
                <p className="text-sm font-semibold text-purple-400 mt-0.5">Max 6 Hops</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted tracking-wider">Local Storage</span>
                <p className="text-sm font-semibold text-white mt-0.5">Cached Media Hub</p>
              </div>
            </div>
          </div>

          {/* Mesh Bandwidth Sharing Controller */}
          <div className="glass-panel p-6 flex flex-col justify-between relative">
            <div className="panel-reflection" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-400" /> Node Relay Switch
                </h2>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    meshActive
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {meshActive ? "RELAYING" : "OFFLINE"}
                </span>
              </div>

              <p className="text-xs text-muted mb-6 leading-relaxed">
                Toggle your router node to extend local Wi-Fi range for neighboring households during power cuts and grid outages.
              </p>

              <div className="bg-black/20 border border-white/5 rounded-2xl p-5 text-center space-y-4">
                <div className="flex justify-center">
                  <button
                    onClick={() => setMeshActive(!meshActive)}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      meshActive
                        ? "bg-purple-500/10 border-2 border-purple-400/50 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-105"
                        : "bg-red-500/10 border-2 border-red-400/50 text-red-400 shadow-[0_0_30px_rgba(248,113,113,0.25)] hover:scale-105"
                    }`}
                  >
                    <Wifi className="w-8 h-8" />
                  </button>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {meshActive ? "Community Relay Node Active" : "Mesh Relay Suspended"}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    Click to engage peer-to-peer packet routing
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                <span className="text-muted">Shared Bandwidth Cap</span>
                <span className="font-semibold text-white">Unlimited</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-muted">Connected Peers</span>
                <span className="font-semibold text-purple-400">12 Local Devices</span>
              </div>
            </div>
          </div>

        </div>

        {/* BENTO MODULES: KEY MESH SERVICES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Module 1 */}
          <div className="glass-module feature-civic group cursor-pointer p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="feature-icon feature-civic">
                <HardDrive className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs font-mono text-purple-400">OFFLINE</span>
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
              Local Content Caching
            </h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Store educational resources and local news directly on neighborhood mesh nodes.
            </p>
            <div className="module-inner-glow" />
          </div>

          {/* Module 2 */}
          <div className="glass-module feature-energy group cursor-pointer p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="feature-icon feature-energy">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xs font-mono text-amber-400">SOLAR</span>
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
              Solar Powered Micro-Nodes
            </h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Resilient relay hardware powered by standalone solar units during loadshedding.
            </p>
            <div className="module-inner-glow" />
          </div>

          {/* Module 3 */}
          <div className="glass-module feature-water group cursor-pointer p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="feature-icon feature-water">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xs font-mono text-cyan-400">SECURE</span>
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
              Zero-Trust Community Auth
            </h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Decentralized identity verification ensuring safe and fair network access for all residents.
            </p>
            <div className="module-inner-glow" />
          </div>

        </div>

        {/* NETWORK ACTIVITY LOGS */}
        <div className="glass-panel p-6 relative">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Mesh Activity & Peer Routing Stream
            </h2>
            <button className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
              View full log history <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-xs font-medium text-white">Peer Node #48 Connected</p>
                  <p className="text-[10px] text-muted">Extended network coverage to Block C</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted">Today, 14:48</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <div>
                  <p className="text-xs font-medium text-white">Off-Grid Packet Sync Successful</p>
                  <p className="text-[10px] text-muted">14 local emergency messages routed via mesh relay</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted">Today, 13:05</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
