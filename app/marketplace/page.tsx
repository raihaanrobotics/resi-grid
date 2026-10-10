"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Zap,
  Tag,
  Search,
  Plus,
  Clock,
  ChevronRight,
  BatteryCharging,
  Droplets,
  Wrench,
  X,
  MessageCircle,
  MapPin,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";

interface ListingItem {
  id: string;
  title: string;
  category: "power" | "water" | "services" | "goods";
  price: string;
  seller: string;
  location: string;
  status: "Available" | "Pending" | "Fulfilled";
  contactPhone?: string;
  isUserCreated?: boolean;
  distanceKm?: number;
}

const INITIAL_MARKETPLACE_LISTINGS: ListingItem[] = [
  {
    id: "MKT-101",
    title: "Surplus Solar Energy Access (5.2 kWh Batch)",
    category: "power",
    price: "R1.20 / kWh",
    seller: "Solar Inverter Hub",
    location: "Sector 4 - Sunset Ridge",
    status: "Available",
    contactPhone: "27821234567",
    distanceKm: 0.4,
  },
  {
    id: "MKT-102",
    title: "Emergency Water Tank Supply (1,000L Reserve)",
    category: "water",
    price: "R150 / Fill",
    seller: "Community Water Depot",
    location: "Ward 12 - Main Reservoir",
    status: "Available",
    contactPhone: "27839876543",
    distanceKm: 1.2,
  },
  {
    id: "MKT-103",
    title: "Portable Lithium Power Station (500W)",
    category: "goods",
    price: "R3,200",
    seller: "Sipho M.",
    location: "4th Avenue",
    status: "Available",
    contactPhone: "27815550192",
    distanceKm: 3.5,
  },
  {
    id: "MKT-104",
    title: "Inverter & Battery Wiring Installation Tech",
    category: "services",
    price: "R450 / hr",
    seller: "Local Electrical Team",
    location: "Zone 3",
    status: "Available",
    contactPhone: "27829990011",
    distanceKm: 6.8,
  },
];

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

export default function MarketplacePage() {
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

  const [activeCategory, setActiveCategory] = useState<"all" | "power" | "water" | "goods" | "services">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<ListingItem[]>(INITIAL_MARKETPLACE_LISTINGS);

  // Modal State for New Listing Creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"power" | "water" | "services" | "goods">("power");
  const [newPrice, setNewPrice] = useState("");
  const [newSeller, setNewSeller] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Aggregated Feature Load: Pull items from Power & Civic storage modules into Marketplace
  useEffect(() => {
    try {
      const savedMarketListings = localStorage.getItem("resigrid_marketplace_listings");
      let baseListings = INITIAL_MARKETPLACE_LISTINGS;

      if (savedMarketListings) {
        const parsed = JSON.parse(savedMarketListings);
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseListings = parsed;
        }
      }

      // Merge active power backup nodes from VoltShield
      const savedPowerNodes = localStorage.getItem("resigrid_power_nodes");
      let aggregatedNodes: ListingItem[] = [];

      if (savedPowerNodes) {
        const parsedNodes = JSON.parse(savedPowerNodes);
        if (Array.isArray(parsedNodes)) {
          aggregatedNodes = parsedNodes.map((node: any, index: number) => ({
            id: node.id || `PWR-${Math.floor(Math.random() * 8999 + 1000)}`,
            title: `${node.owner} (${node.type})`,
            category: "power" as const,
            price: node.price || "Free / Donation",
            seller: node.owner || "Community Backup Node",
            location: node.location || "Neighborhood",
            status: "Available" as const,
            contactPhone: node.whatsappPhone || "27821234567",
            distanceKm: Number((0.2 + index * 0.4).toFixed(1)),
          }));
        }
      }

      // Merge combined list without duplicate IDs
      const combined = [...baseListings];
      aggregatedNodes.forEach((nodeItem) => {
        if (!combined.some((item) => item.id === nodeItem.id)) {
          combined.push(nodeItem);
        }
      });

      setListings(combined);
      localStorage.setItem("resigrid_marketplace_listings", JSON.stringify(combined));
    } catch (e) {
      console.error("Error loading combined marketplace listings:", e);
    }
  }, []);

  // Sync state changes back to LocalStorage
  const updateListingsState = (newListings: ListingItem[]) => {
    setListings(newListings);
    try {
      localStorage.setItem("resigrid_marketplace_listings", JSON.stringify(newListings));
    } catch (e) {
      console.error("Storage save error:", e);
    }
  };

  const handlePostListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice || !newSeller || !newLocation) return;

    const newListingItem: ListingItem = {
      id: `MKT-${Math.floor(Math.random() * 8999 + 1000)}`,
      title: newTitle.trim(),
      category: newCategory,
      price: newPrice.trim(),
      seller: newSeller.trim(),
      location: newLocation.trim(),
      status: "Available",
      contactPhone: newPhone.replace(/[^0-9]/g, "") || "27821234567",
      isUserCreated: true,
      distanceKm: 0.1,
    };

    const updated = [newListingItem, ...listings];
    updateListingsState(updated);

    // Reset Form & Close Modal
    setIsModalOpen(false);
    setNewTitle("");
    setNewPrice("");
    setNewSeller("");
    setNewLocation("");
    setNewPhone("");
  };

  const handleTradeContact = (item: ListingItem) => {
    const phone = item.contactPhone || "27821234567";
    const message = encodeURIComponent(
      `Hello ${item.seller}, I am inquiring about your ResiMarket listing: "${item.title}" priced at ${item.price}.\nIs this still available?`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  // Filter listings by category, search query, and within 10km radius
  const filteredListings = listings.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const within10Km = (item.distanceKm ?? 5) <= 10;
    return matchesCategory && matchesSearch && within10Km;
  });

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      {/* Ambient environment */}
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">
        
        {/* TOP NAVIGATION & LOCATION PILL ROW */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <header className="glass-header flex items-center gap-3 p-3.5 sm:p-4">
            <div className="feature-icon feature-energy shrink-0" style={{ color: "var(--accent)" }}>
              <ShoppingBag className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm">
                RESIMARKET™
              </h1>
              <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                NEIGHBORHOOD POWER, WATER & SERVICE TRADING
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
                {activeAddress} (Showing within 10km)
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

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 relative pointer-events-auto">
          <div className="panel-reflection pointer-events-none" />

          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search power, water reserves, equipment, or local services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-muted focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "power", "water", "goods", "services"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-white/15 text-white border border-white/30"
                    : "bg-white/5 border border-white/10 text-muted hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Post New Listing Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer hover:opacity-90 active:scale-95"
            style={{
              color: "var(--accent)",
              borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
            }}
          >
            <Plus className="w-4 h-4" /> Post Listing
          </button>
        </div>

        {/* LISTINGS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredListings.length === 0 ? (
            <div className="col-span-full glass-panel p-8 text-center text-muted text-xs">
              No listings found within 10km matching your criteria.
            </div>
          ) : (
            filteredListings.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-5 flex flex-col justify-between group hover:border-white/30 transition-all relative pointer-events-auto"
              >
                <div className="panel-reflection pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${
                        item.category === "power"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : item.category === "water"
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          : item.category === "goods"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      }`}
                    >
                      {item.category === "power" && <Zap className="w-3 h-3" />}
                      {item.category === "water" && <Droplets className="w-3 h-3" />}
                      {item.category === "services" && <Wrench className="w-3 h-3" />}
                      {item.category === "goods" && <Tag className="w-3 h-3" />}
                      {item.category.toUpperCase()}
                    </span>

                    <span className="text-xs font-mono text-muted">
                      {item.distanceKm !== undefined ? `${item.distanceKm} km away` : item.id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                    <span>
                      By <strong className="text-white">{item.seller}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {item.location}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-muted tracking-wider block">
                      Asking Rate
                    </span>
                    <span className="text-lg font-extrabold" style={{ color: "var(--accent)" }}>
                      {item.price}
                    </span>
                  </div>

                  <button
                    onClick={() => handleTradeContact(item)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Contact Seller
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* LIVE SETTLEMENT STREAM */}
        <div className="glass-panel p-6 relative pointer-events-auto">
          <div className="panel-reflection pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} /> Neighborhood Activity Stream
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-xs font-medium text-white">Solar Power Transfer: 12 kWh Shared</p>
                  <p className="text-[10px] text-muted">Direct Peer Dispatch • Settled</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted">Today, 15:12</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <div>
                  <p className="text-xs font-medium text-white">Emergency Water Reserve Fill Requested</p>
                  <p className="text-[10px] text-muted">Water Depot Station #2</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted">Today, 14:02</span>
            </div>
          </div>
        </div>

      </div>

      {/* CREATE NEW LISTING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
          <div
            className="glass-panel w-full max-w-md p-5 sm:p-6 relative space-y-4 pointer-events-auto"
            style={{ borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)" }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} /> Post Marketplace Offer
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-white cursor-pointer relative z-30 p-1"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handlePostListing} className="space-y-3 relative z-20">
              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Listing Title / Item Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 5kW Inverter Backup / 500L Water Tank"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                >
                  <option value="power" className="bg-neutral-900 text-white">Power / Energy</option>
                  <option value="water" className="bg-neutral-900 text-white">Water Reserves</option>
                  <option value="services" className="bg-neutral-900 text-white">Services / Technical</option>
                  <option value="goods" className="bg-neutral-900 text-white">Goods & Hardware</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Price / Rate</label>
                  <input
                    type="text"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. R1.20 / kWh or R500"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Seller / Business Name</label>
                  <input
                    type="text"
                    required
                    value={newSeller}
                    onChange={(e) => setNewSeller(e.target.value)}
                    placeholder="e.g. Sipho M."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Location / Zone</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Sector 4"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">WhatsApp Contact</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. 27821234567"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
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
                Publish Offer to ResiMarket
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
