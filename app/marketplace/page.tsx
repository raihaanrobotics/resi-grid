"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Zap,
  Tag,
  Search,
  Filter,
  Plus,
  TrendingUp,
  ShieldCheck,
  Clock,
  ChevronRight,
  Sun,
  Moon,
  ArrowUpRight,
  Sparkles,
  DollarSign,
  Briefcase,
  BatteryCharging,
  ArrowLeft,
} from "lucide-react";

interface ListingItem {
  id: string;
  title: string;
  category: "energy" | "services" | "goods";
  price: string;
  seller: string;
  location: string;
  status: "Available" | "Pending" | "Sold";
  rating: number;
}

const mockListings: ListingItem[] = [
  {
    id: "MKT-101",
    title: "Surplus Solar Energy (5.2 kWh Batch)",
    category: "energy",
    price: "R1.20 / kWh",
    seller: "Khumalo Micro-Grid Node #4",
    location: "Block A - Sector 2",
    status: "Available",
    rating: 4.9,
  },
  {
    id: "MKT-102",
    title: "Portable Lithium Power Station (500W)",
    category: "goods",
    price: "R3,200",
    seller: "Sipho M.",
    location: "4th Avenue",
    status: "Available",
    rating: 5.0,
  },
  {
    id: "MKT-103",
    title: "Inverter & Battery Wiring Installation",
    category: "services",
    price: "R450 / hr",
    seller: "Pietermaritzburg Electrical Techs",
    location: "Zone 3 Local",
    status: "Available",
    rating: 4.8,
  },
  {
    id: "MKT-104",
    title: "Community Solar Battery Sharing Slot",
    category: "energy",
    price: "R0.95 / kWh",
    seller: "ResiGrid Shared Storage B",
    location: "Central Hub",
    status: "Pending",
    rating: 4.9,
  },
];

export default function MarketplacePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeCategory, setActiveCategory] = useState<"all" | "energy" | "services" | "goods">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTradeVolume, setActiveTradeVolume] = useState(14.8);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Live Trade Volume Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTradeVolume(+(14.8 + (Math.random() * 0.6 - 0.3)).toFixed(1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredListings = mockListings.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.seller.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] selection:bg-amber-500/30 selection:text-amber-200">
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
              <div className="feature-icon feature-energy">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold tracking-[0.2em] text-white">
                    RESIMARKET™
                  </h1>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[8px] font-medium tracking-[0.15em] text-amber-400">
                    P2P ENERGY & SERVICES
                  </span>
                </div>
                <p className="mt-0.5 text-[9px] tracking-[0.15em] text-muted">
                  PEER-TO-PEER POWER TRADING & NEIGHBORHOOD MARKETPLACE
                </p>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Live Market Indicator */}
            <div className="status-pill border-amber-500/20 bg-amber-500/10 text-amber-400">
              <span className="status-dot bg-amber-400 shadow-[0_0_14px_#fbbf24]" />
              P2P GRID TRADING LIVE
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
          
          {/* Metric 1: Energy Trade Volume */}
          <div className="glass-panel p-5 flex flex-col justify-between relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow">DAILY TRADED POWER</span>
              <BatteryCharging className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {activeTradeVolume}
                </span>
                <span className="text-sm font-medium text-muted">MWh</span>
              </div>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +12.4% vs Yesterday
              </span>
            </div>
            <div className="panel-bottom-glow bg-amber-500 opacity-15" />
          </div>

          {/* Metric 2: Average Power Tariff */}
          <div className="glass-panel p-5 flex flex-col justify-between relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow">AVG P2P POWER RATE</span>
              <Zap className="w-4 h-4 text-teal-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  R1.12
                </span>
                <span className="text-sm font-medium text-muted">/ kWh</span>
              </div>
              <span className="text-xs text-teal-400 font-medium flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3" /> 28% Cheaper than Grid
              </span>
            </div>
            <div className="panel-bottom-glow bg-teal-500 opacity-15" />
          </div>

          {/* Metric 3: Active Listings */}
          <div className="glass-panel p-5 flex flex-col justify-between relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow">ACTIVE OFFERS</span>
              <Tag className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">42</span>
                <span className="text-sm font-medium text-muted">Local Sellers</span>
              </div>
              <span className="text-xs text-cyan-400 font-medium flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> Instant Settlement
              </span>
            </div>
            <div className="panel-bottom-glow bg-cyan-500 opacity-15" />
          </div>

          {/* Metric 4: Verified Escrow */}
          <div className="glass-panel p-5 flex flex-col justify-between relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow">ESCROW PROTECTION</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">100%</span>
              </div>
              <span className="text-xs text-purple-400 font-medium flex items-center gap-1 mt-1">
                <Sparkles className="w-3 h-3" /> Smart Contract Backed
              </span>
            </div>
            <div className="panel-bottom-glow bg-purple-500 opacity-15" />
          </div>

        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 relative">
          <div className="panel-reflection" />
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search solar energy, hardware, or neighborhood services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-muted focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "energy", "goods", "services"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  activeCategory === cat
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-white/5 border border-white/10 text-muted hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Post New Listing Button */}
          <button className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 font-semibold text-xs transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Post Listing
          </button>
        </div>

        {/* LISTING CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredListings.map((item) => (
            <div key={item.id} className="glass-panel p-5 flex flex-col justify-between group hover:border-amber-500/40 transition-all relative">
              <div className="panel-reflection" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-md border ${
                    item.category === "energy" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    item.category === "goods" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" :
                    "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  }`}>
                    {item.category.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-muted">{item.id}</span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>
                
                <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                  <span>By <strong className="text-white">{item.seller}</strong></span>
                  <span>•</span>
                  <span>{item.location}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-muted tracking-wider block">Asking Price</span>
                  <span className="text-lg font-extrabold text-amber-400">{item.price}</span>
                </div>

                <button className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-amber-500/20 hover:border-amber-500/30 text-white hover:text-amber-300 text-xs font-semibold transition-all flex items-center gap-1.5">
                  Buy / Trade <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RECENT TRANSACTION STREAM */}
        <div className="glass-panel p-6 relative">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Live Settlement Stream
            </h2>
            <button className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
              View full ledger <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-xs font-medium text-white">Power Transfer: 12 kWh to Block B Household</p>
                  <p className="text-[10px] text-muted">Settled via Smart Escrow • R13.44</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted">Today, 15:12</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div>
                  <p className="text-xs font-medium text-white">Inverter Maintenance Service Booked</p>
                  <p className="text-[10px] text-muted">Deposit held in escrow • R220.00</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted">Today, 14:02</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
