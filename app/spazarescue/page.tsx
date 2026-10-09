"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  ShieldCheck,
  AlertTriangle,
  Truck,
  Activity,
  PackageCheck,
  Store,
  DollarSign,
  Clock,
  ChevronRight,
  Sun,
  Moon,
  TrendingUp,
  MapPin,
  CheckCircle2,
  PhoneCall,
  Search,
  Filter,
} from "lucide-react";

export default function SpazaRescuePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [dispatchActive, setDispatchActive] = useState(false);
  const [activeOrders, setActiveOrders] = useState(14);
  const [stockLevel, setStockLevel] = useState(88.5);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Live Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setStockLevel(+(88 + (Math.random() * 1.2 - 0.6)).toFixed(1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="resigrid-shell min-h-screen text-[var(--text)] pb-32 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 selection:bg-rose-500/30 selection:text-rose-200">
      
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
          <div className="feature-icon feature-food">
            <Store className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                SpazaRescue™
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Supply Mesh Active
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Micro-retail resilience, stock stabilization & emergency restocking network
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Live System Indicator */}
          <div className="status-pill hidden sm:flex">
            <span className="status-dot" />
            <span>48 HUB NODES ONLINE</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        {/* Metric 1: Verified Stores */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">ACTIVE SPAZA STORES</span>
            <Store className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">342</span>
              <span className="text-sm font-medium text-secondary">Registered</span>
            </div>
            <span className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> +12 Added This Month
            </span>
          </div>
          <div className="panel-bottom-glow text-rose-400" />
        </div>

        {/* Metric 2: Stock Availability index */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">ESSENTIAL STOCK INDEX</span>
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {stockLevel}%
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stockLevel}%` }}
              />
            </div>
          </div>
          <div className="panel-bottom-glow text-emerald-400" />
        </div>

        {/* Metric 3: Active Restock Shipments */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">DISPATCH RUNS</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {activeOrders}
              </span>
              <span className="text-sm font-medium text-secondary">En Route</span>
            </div>
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3" /> Average Delivery: 38 mins
            </span>
          </div>
          <div className="panel-bottom-glow text-amber-400" />
        </div>

        {/* Metric 4: Micro-Credit Volume */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">STABILIZATION POOL</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">R84.5k</span>
              <span className="text-sm font-medium text-secondary">Disbursed</span>
            </div>
            <span className="text-xs text-cyan-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Zero-Interest Emergency Credit
            </span>
          </div>
          <div className="panel-bottom-glow text-cyan-400" />
        </div>

      </div>

      {/* MAIN SECTION: SUPPLY MAP & EMERGENCY DISPATCH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Rapid Restock Hub Monitor */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between">
          <div className="panel-reflection" />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" /> Local Hub Distribution Grid
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Real-time stock monitoring & bulk-buying distribution nodes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-secondary">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" /> Live Tracking
              </span>
            </div>
          </div>

          {/* Simulated Grid Area Map Display */}
          <div className="relative w-full h-60 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-xs font-mono text-rose-300">
                  Sector 4: Township Central
                </div>
              </div>
              <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-mono text-rose-400">
                8 Critical Depots Active
              </div>
            </div>

            {/* Radar Nodes */}
            <div className="relative z-10 grid grid-cols-3 gap-3 my-auto">
              <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-[10px] text-muted uppercase">Primary Bulk Hub</p>
                <p className="text-sm font-bold text-white mt-0.5">Depot Alpha</p>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 94% Stocked
                </span>
              </div>
              <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-[10px] text-muted uppercase">Cold Chain Hub</p>
                <p className="text-sm font-bold text-white mt-0.5">Depot Bravo</p>
                <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Low Milk Stocks
                </span>
              </div>
              <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-[10px] text-muted uppercase">Grains & Staples</p>
                <p className="text-sm font-bold text-white mt-0.5">Depot Charlie</p>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 100% Stocked
                </span>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs text-secondary pt-2 border-t border-white/10">
              <span>Next Group Bulk Purchase Cycle: <strong>04h 12m</strong></span>
              <span className="text-rose-400 font-semibold cursor-pointer hover:underline">
                View Detailed Map
              </span>
            </div>
          </div>

          {/* Stats Footer */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/5 text-center">
            <div>
              <span className="text-[10px] uppercase text-muted tracking-wider">Avg Savings</span>
              <p className="text-sm font-semibold text-white mt-0.5">18.4% Below Retail</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted tracking-wider">Dispatch Fleet</span>
              <p className="text-sm font-semibold text-rose-400 mt-0.5">12 Electric Trikes</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted tracking-wider">Safety Rating</span>
              <p className="text-sm font-semibold text-white mt-0.5">99.8% Verified</p>
            </div>
          </div>
        </div>

        {/* Emergency Supply Trigger */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="panel-reflection" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Emergency Restock
              </h2>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  dispatchActive
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                    : "bg-white/5 text-muted border border-white/10"
                }`}
              >
                {dispatchActive ? "DISPATCH READY" : "STANDBY"}
              </span>
            </div>

            <p className="text-xs text-secondary mb-6 leading-relaxed">
              Trigger priority emergency stock delivery for critical local shortages (Bread, Maize Meal, Milk, Gas).
            </p>

            <div className="bg-black/20 border border-white/5 rounded-2xl p-5 text-center space-y-4">
              <div className="flex justify-center">
                <button
                  onClick={() => setDispatchActive(!dispatchActive)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    dispatchActive
                      ? "bg-rose-500/10 border-2 border-rose-400/50 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:scale-105"
                      : "bg-white/5 border-2 border-white/20 text-muted hover:text-white hover:scale-105"
                  }`}
                >
                  <Truck className="w-8 h-8" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {dispatchActive ? "Emergency Rapid Dispatch Active" : "Press to Request Priority Stock"}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  Connects to the nearest local distribution van
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
              <span className="text-secondary">Express Delivery Time</span>
              <span className="font-semibold text-white">&lt; 30 Minutes</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-secondary">Community Subsidy</span>
              <span className="font-semibold text-rose-400">100% Covered</span>
            </div>
          </div>
        </div>

      </div>

      {/* BENTO MODULES: ESSENTIAL SERVICES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        
        {/* Module 1 */}
        <div className="glass-module feature-food group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="module-icon">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-rose-400">BULK-BUY</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-rose-300 transition-colors">
            Group Purchasing Pool
          </h3>
          <p className="text-xs text-secondary mt-1">
            Aggregate orders across 15+ stores to unlock wholesale pricing on staple foods.
          </p>
          <div className="module-inner-glow" />
        </div>

        {/* Module 2 */}
        <div className="glass-module feature-civic group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="module-icon">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-purple-400">VERIFIED</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-pink-300 transition-colors">
            Food Safety & Assurance
          </h3>
          <p className="text-xs text-secondary mt-1">
            QR verification system tracking supplier freshness and stock compliance.
          </p>
          <div className="module-inner-glow" />
        </div>

        {/* Module 3 */}
        <div className="glass-module feature-energy group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="module-icon">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-amber-400">INSTANT</span>
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
            Micro-Restock Credit
          </h3>
          <p className="text-xs text-secondary mt-1">
            Flexi-pay inventory credit to ensure shop shelves never run empty during crisis.
          </p>
          <div className="module-inner-glow" />
        </div>

      </div>

      {/* LOG & RECENT DISPATCHES */}
      <div className="glass-panel p-6 relative z-10">
        <div className="panel-reflection" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-400" /> Recent Supply Dispatches
          </h2>
          <button className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1">
            View full log history <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div>
                <p className="text-xs font-medium text-white">Bulk Maize & Bread Delivery Complete</p>
                <p className="text-[10px] text-muted">Delivered to Sipho's Spaza (Zone 2) — 24 Units</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-secondary">Today, 11:20</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <div>
                <p className="text-xs font-medium text-white">Emergency LPG Gas Cylinders Dispatched</p>
                <p className="text-[10px] text-muted">En route to Mam' Rose Store — Express Trike #4</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-secondary">Today, 10:45</span>
          </div>
        </div>
      </div>

    </div>
  );
}
