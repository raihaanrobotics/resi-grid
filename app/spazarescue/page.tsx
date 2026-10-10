"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Store,
  ShoppingBag,
  ShieldCheck,
  AlertTriangle,
  Truck,
  Activity,
  PackageCheck,
  DollarSign,
  Clock,
  ChevronRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Plus,
  MessageCircle,
  X,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";

interface SpazaListingItem {
  id: string;
  title: string;
  category: "goods" | "power" | "water" | "services";
  price: string;
  seller: string;
  location: string;
  status: "Available" | "Pending" | "Fulfilled";
  contactPhone?: string;
  distanceKm?: number;
}

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

export default function SpazaRescuePage() {
  const { streetAddress } = useGeo();

  // Location State: Automatically loads on mount once, locks in
  const [isRefreshingGeo, setIsRefreshingGeo] = useState(false);
  const [activeAddress, setActiveAddress] = useState<string>("Locating street...");
  const hasInitializedGeo = useRef(false);

  useEffect(() => {
    if (streetAddress && !hasInitializedGeo.current) {
      setActiveAddress(streetAddress);
      hasInitializedGeo.current = true;
    }
  }, [streetAddress]);

  const handleManualRefreshLocation = () => {
    setIsRefreshingGeo(true);
    setTimeout(() => {
      if (streetAddress) {
        setActiveAddress(streetAddress);
      }
      setIsRefreshingGeo(false);
    }, 600);
  };

  // Bulletproof Theme Persistence on Mount
  useEffect(() => {
    const applySavedTheme = () => {
      try {
        const savedAccent = localStorage.getItem("resigrid_accent_theme");
        if (savedAccent && ACCENT_HEX_MAP[savedAccent]) {
          const hex = ACCENT_HEX_MAP[savedAccent];
          document.documentElement.style.setProperty("--feature-accent", hex);
          document.documentElement.style.setProperty("--accent", hex);
        }
      } catch (e) {
        console.error("Error reading theme setting:", e);
      }
    };

    applySavedTheme();

    const handleThemeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ hex?: string }>;
      if (customEvent.detail?.hex) {
        document.documentElement.style.setProperty("--feature-accent", customEvent.detail.hex);
        document.documentElement.style.setProperty("--accent", customEvent.detail.hex);
      } else {
        applySavedTheme();
      }
    };

    window.addEventListener("resigrid_theme_change", handleThemeEvent);
    return () => {
      window.removeEventListener("resigrid_theme_change", handleThemeEvent);
    };
  }, []);

  const [dispatchActive, setDispatchActive] = useState(false);
  const [stockLevel, setStockLevel] = useState(88.5);

  // Modal State for Restock / Listing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");

  // Live Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setStockLevel(+(88 + (Math.random() * 1.2 - 0.6)).toFixed(1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Publish to ResiMarket Local Storage
  const handlePublishListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle || !itemPrice || !storeName) return;

    const newListing: SpazaListingItem = {
      id: `SPAZA-${Math.floor(Math.random() * 8999 + 1000)}`,
      title: itemTitle.trim(),
      category: "goods",
      price: itemPrice.trim(),
      seller: storeName.trim(),
      location: activeAddress !== "Locating street..." ? activeAddress : "Local Sector",
      status: "Available",
      contactPhone: phoneNum.replace(/[^0-9]/g, "") || "27821234567",
      distanceKm: 0.2,
    };

    try {
      const existing = localStorage.getItem("resigrid_marketplace_listings");
      let list = existing ? JSON.parse(existing) : [];
      list = [newListing, ...list];
      localStorage.setItem("resigrid_marketplace_listings", JSON.stringify(list));
    } catch (err) {
      console.error("Storage error:", err);
    }

    setIsModalOpen(false);
    setItemTitle("");
    setItemPrice("");
    setStoreName("");
    setPhoneNum("");
  };

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] pb-32 pt-5 px-4 sm:px-6 lg:px-8 max-w-[1500px] mx-auto space-y-6 selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      
      {/* Ambient background */}
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      {/* TOP NAVIGATION & INDEPENDENT OUTSIDE LOCATION PILL */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
        <header className="glass-header p-4 sm:p-5 flex items-center gap-3">
          <div className="feature-icon feature-food shrink-0" style={{ color: "var(--accent)" }}>
            <Store className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-[0.18em] text-white sm:text-base">
                SPAZARESCUE™
              </h1>
              <span 
                className="rounded-full border px-2 py-0.5 text-[8px] font-medium tracking-[0.15em]"
                style={{
                  color: "var(--accent)",
                  borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                }}
              >
                SUPPLY MESH ACTIVE
              </span>
            </div>
            <p className="mt-0.5 text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
              MICRO-RETAIL STABILIZATION & EMERGENCY RESTOCKING
            </p>
          </div>
        </header>

        {/* Fully Independent Outside Location Pill */}
        <div 
          className="glass-panel px-4 py-2.5 flex items-center justify-between gap-3 pointer-events-auto"
          style={{
            borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Navigation className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
            <span className="truncate font-semibold text-white text-[10px] sm:text-xs">
              {activeAddress}
            </span>
          </div>
          <button
            type="button"
            onClick={handleManualRefreshLocation}
            title="Refresh Location"
            className="transition-colors shrink-0 cursor-pointer p-1 touch-manipulation z-30 hover:text-white"
            style={{ color: "var(--accent)" }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingGeo ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* STATS TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        {/* Metric 1 */}
        <div className="glass-panel p-5 flex flex-col justify-between pointer-events-auto">
          <div className="panel-reflection pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">ACTIVE SPAZA STORES</span>
            <Store className="w-4 h-4" style={{ color: "var(--accent)" }} />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">342</span>
              <span className="text-sm font-medium text-muted">Registered</span>
            </div>
            <span className="text-xs font-medium flex items-center gap-1 mt-1" style={{ color: "var(--accent)" }}>
              <CheckCircle2 className="w-3 h-3" /> +12 Added This Month
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-5 flex flex-col justify-between pointer-events-auto">
          <div className="panel-reflection pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">ESSENTIAL STOCK INDEX</span>
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">
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
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-5 flex flex-col justify-between pointer-events-auto">
          <div className="panel-reflection pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">DISPATCH RUNS</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">14</span>
              <span className="text-sm font-medium text-muted">En Route</span>
            </div>
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3" /> Average Delivery: 38 mins
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-5 flex flex-col justify-between pointer-events-auto">
          <div className="panel-reflection pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="eyebrow">STABILIZATION POOL</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white">R84.5k</span>
              <span className="text-sm font-medium text-muted">Disbursed</span>
            </div>
            <span className="text-xs text-cyan-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Zero-Interest Credit
            </span>
          </div>
        </div>

      </div>

      {/* MAIN SECTION: SUPPLY HUB MONITOR & EMERGENCY TRIGGER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Hub Distribution Grid */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between pointer-events-auto">
          <div className="panel-reflection pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: "var(--accent)" }} /> Local Hub Distribution Grid
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Real-time stock monitoring & bulk-buying distribution nodes
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95"
              style={{
                color: "var(--accent)",
                borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
              }}
            >
              <Plus className="w-4 h-4" /> List Stock to Market
            </button>
          </div>

          <div className="relative w-full h-60 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(var(--accent)_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-xs font-mono text-white">
                Sector 4: Township Central
              </div>
              <div 
                className="px-3 py-1 rounded-lg text-xs font-mono border"
                style={{
                  color: "var(--accent)",
                  borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
                }}
              >
                8 Critical Depots Active
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3 my-auto">
              <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-[10px] text-muted uppercase">Primary Hub</p>
                <p className="text-sm font-bold text-white mt-0.5">Depot Alpha</p>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 94% Stocked
                </span>
              </div>
              <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-[10px] text-muted uppercase">Cold Chain</p>
                <p className="text-sm font-bold text-white mt-0.5">Depot Bravo</p>
                <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Low Stock
                </span>
              </div>
              <div className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-[10px] text-muted uppercase">Staples</p>
                <p className="text-sm font-bold text-white mt-0.5">Depot Charlie</p>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 100% Stocked
                </span>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs text-muted pt-2 border-t border-white/10">
              <span>Next Bulk Purchase Cycle: <strong>04h 12m</strong></span>
              <span className="font-semibold cursor-pointer hover:underline" style={{ color: "var(--accent)" }}>
                View Full Map
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Dispatch Trigger */}
        <div className="glass-panel p-6 flex flex-col justify-between pointer-events-auto">
          <div className="panel-reflection pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: "var(--accent)" }} /> Emergency Restock
              </h2>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  dispatchActive
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                    : "bg-white/5 text-muted border-white/10"
                }`}
              >
                {dispatchActive ? "DISPATCH READY" : "STANDBY"}
              </span>
            </div>

            <p className="text-xs text-muted mb-6 leading-relaxed">
              Trigger priority emergency stock delivery for critical local shortages (Bread, Maize Meal, Milk).
            </p>

            <div className="bg-black/20 border border-white/5 rounded-2xl p-5 text-center space-y-4">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setDispatchActive(!dispatchActive)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
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
              <span className="text-muted">Express Delivery Time</span>
              <span className="font-semibold text-white">&lt; 30 Minutes</span>
            </div>
            <div className="flex items-center justify-between text-xs py-2">
              <span className="text-muted">Community Subsidy</span>
              <span className="font-semibold" style={{ color: "var(--accent)" }}>100% Covered</span>
            </div>
          </div>
        </div>

      </div>

      {/* RECENT DISPATCHES LOG */}
      <div className="glass-panel p-6 relative z-10 pointer-events-auto">
        <div className="panel-reflection pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} /> Recent Supply Dispatches
          </h2>
          <Link
            href="/marketplace"
            className="text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-colors"
            style={{ color: "var(--accent)" }}
          >
            View marketplace <ChevronRight className="w-3.5 h-3.5" />
          </Link>
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
            <span className="text-[10px] font-mono text-muted">Today, 11:20</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div>
                <p className="text-xs font-medium text-white">Emergency Restock Dispatched</p>
                <p className="text-[10px] text-muted">En route to Mam' Rose Store — Express Trike #4</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted">Today, 10:45</span>
          </div>
        </div>
      </div>

      {/* PUBLISH TO MARKETPLACE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
          <div
            className="glass-panel w-full max-w-md p-5 sm:p-6 relative space-y-4 pointer-events-auto"
            style={{ borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)" }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Store className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} /> Publish Spaza Stock to ResiMarket
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-white cursor-pointer relative z-30 p-1"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handlePublishListing} className="space-y-3 relative z-20">
              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Stock Item / Bundle Title</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="e.g. Bulk Maize Meal (10kg Bags) - 20 Units"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Wholesale Price</label>
                  <input
                    type="text"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="e.g. R950 / Batch"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Store / Hub Name</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Depot Alpha"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">WhatsApp Order Number</label>
                <input
                  type="text"
                  required
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  placeholder="e.g. 27821234567"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl border text-xs font-semibold transition-all mt-2 cursor-pointer hover:opacity-90"
                style={{
                  color: "var(--accent)",
                  borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                }}
              >
                Publish to ResiMarket
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
