"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Zap,
  Tag,
  Search,
  Plus,
  BatteryCharging,
  Droplets,
  Wrench,
  X,
  MessageCircle,
  MapPin,
  Navigation,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";
import { animateRefreshIcon } from "@/lib/location/animateRefreshIcon";
import { supabase } from "@/lib/supabase";
import { readOfflineData, writeOfflineData } from "@/lib/offline/dataCache";
import { normalizeSouthAfricanPhone, openWhatsApp } from "@/lib/phone";

interface ListingItem {
  id: string;
  title: string;
  category: "power" | "water" | "services" | "goods";
  price: string;
  seller: string;
  location: string;
  status: "Available" | "Pending" | "Fulfilled";
  latitude: number;
  longitude: number;
  contactPhone?: string;
  isUserCreated?: boolean;
  distanceKm?: number;
  formattedDistance?: string;
}

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

export default function MarketplacePage() {
  const { streetAddress, location, filterByRadius, refreshLocation, loading: geoLoading } = useGeo();

  // Bulletproof Theme Persistence on Mount & Sync Feature Accent
  const [accentColor, setAccentColor] = useState<string>("#38bdf8");

  useEffect(() => {
    const applySavedTheme = () => {
      try {
        const savedAccent = localStorage.getItem("resigrid_accent_theme");
        if (savedAccent && ACCENT_HEX_MAP[savedAccent]) {
          const hex = ACCENT_HEX_MAP[savedAccent];
          setAccentColor(hex);
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
        const hex = customEvent.detail.hex;
        setAccentColor(hex);
        document.documentElement.style.setProperty("--feature-accent", hex);
        document.documentElement.style.setProperty("--accent", hex);
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
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Modal State for New Listing Creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"power" | "water" | "services" | "goods">("power");
  const [newPrice, setNewPrice] = useState("");
  const [newSeller, setNewSeller] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Fetch live marketplace, water, and power nodes from Supabase and sync across HydroMesh & VoltShield
  useEffect(() => {
    async function fetchSupabaseListings() {
      try {
        const [waterRes, powerRes, reportsRes] = await Promise.all([
          supabase.from("water_nodes").select("*"),
          supabase.from("power_nodes").select("*"),
          supabase.from("reports").select("*").eq("category", "goods")
        ]);

        if (waterRes.error || powerRes.error || reportsRes.error) {
          if (waterRes.error) console.error("Could not fetch marketplace water listings:", waterRes.error);
          if (powerRes.error) console.error("Could not fetch marketplace power listings:", powerRes.error);
          if (reportsRes.error) console.error("Could not fetch marketplace goods listings:", reportsRes.error);
          const cachedListings = readOfflineData<ListingItem[]>("resigrid_marketplace_listings");
          if (Array.isArray(cachedListings)) setListings(cachedListings);
          return;
        }

        const combinedListings: ListingItem[] = [];

        if (waterRes.data) {
          waterRes.data.forEach((node: any) => {
            combinedListings.push({
              id: node.node_id || `WAT-${node.id}`,
              title: `${node.owner} (${node.type})`,
              category: "water",
              price: node.price || "R150 / Fill",
              seller: node.owner || "Community Water Depot",
              location: node.location || "Neighborhood",
              status: "Available",
              contactPhone: node.whatsapp_phone || "",
              latitude: typeof node.latitude === "number" ? node.latitude : Number.NaN,
              longitude: typeof node.longitude === "number" ? node.longitude : Number.NaN,
              isUserCreated: node.is_user_created,
            });
          });
        }

        if (powerRes.data) {
          powerRes.data.forEach((node: any) => {
            combinedListings.push({
              id: node.node_id || `PWR-${node.id}`,
              title: `${node.owner} (${node.type})`,
              category: "power",
              price: node.price || "R1.20 / kWh",
              seller: node.owner || "Community Backup Node",
              location: node.location || "Neighborhood",
              status: "Available",
              contactPhone: node.whatsapp_phone || "",
              latitude: typeof node.latitude === "number" ? node.latitude : Number.NaN,
              longitude: typeof node.longitude === "number" ? node.longitude : Number.NaN,
              isUserCreated: node.is_user_created,
            });
          });
        }

        if (reportsRes.data) {
          reportsRes.data.forEach((rep: any) => {
            combinedListings.push({
              id: rep.report_id || `REP-${rep.id}`,
              title: rep.title,
              category: "goods",
              price: rep.estimated_fix_time || "R0",
              seller: rep.reporter_name || "Resident",
              location: rep.location_address || "Ward",
              status: "Available",
              contactPhone: rep.reporter_phone || "",
              latitude: typeof rep.latitude === "number" ? rep.latitude : Number.NaN,
              longitude: typeof rep.longitude === "number" ? rep.longitude : Number.NaN,
              isUserCreated: true,
            });
          });
        }

        setListings(combinedListings);
        writeOfflineData("resigrid_marketplace_listings", combinedListings);
      } catch (err) {
        console.error("Failed to load Supabase marketplace data:", err);
        const cachedListings = readOfflineData<ListingItem[]>("resigrid_marketplace_listings");
        if (Array.isArray(cachedListings)) setListings(cachedListings);
      }
    }

    fetchSupabaseListings();
  }, []);

  const handlePostListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice || !newSeller || !newLocation) return;
    const normalizedPhone = normalizeSouthAfricanPhone(newPhone);
    if (!normalizedPhone) {
      window.alert("Enter a valid South African WhatsApp number, such as +27 82 123 4567.");
      return;
    }

    const uniqueId = `MKT-${Math.floor(Math.random() * 8999 + 1000)}`;
    const newListingItem: ListingItem = {
      id: uniqueId,
      title: newTitle.trim(),
      category: newCategory,
      price: newPrice.trim(),
      seller: newSeller.trim(),
      location: newLocation.trim(),
      status: "Available",
      contactPhone: normalizedPhone,
      isUserCreated: true,
      latitude: location?.latitude ?? Number.NaN,
      longitude: location?.longitude ?? Number.NaN,
    };

    // Push to Supabase tables depending on category so HydroMesh and VoltShield stay fully connected & synchronized
    try {
      if (newCategory === "water") {
        await supabase.from("water_nodes").insert([
          {
            node_id: uniqueId,
            owner: newSeller.trim(),
            type: newTitle.trim(),
            capacity: "1000L",
            price: newPrice.trim(),
            location: newLocation.trim(),
            whatsapp_phone: newListingItem.contactPhone,
            is_user_created: true,
            latitude: Number.isFinite(newListingItem.latitude) ? newListingItem.latitude : null,
            longitude: Number.isFinite(newListingItem.longitude) ? newListingItem.longitude : null,
          }
        ]);
      } else if (newCategory === "power") {
        await supabase.from("power_nodes").insert([
          {
            node_id: uniqueId,
            owner: newSeller.trim(),
            type: newTitle.trim(),
            capacity: "5.2 kWh",
            price: newPrice.trim(),
            location: newLocation.trim(),
            whatsapp_phone: newListingItem.contactPhone,
            is_user_created: true,
            latitude: Number.isFinite(newListingItem.latitude) ? newListingItem.latitude : null,
            longitude: Number.isFinite(newListingItem.longitude) ? newListingItem.longitude : null,
          }
        ]);
      } else {
        await supabase.from("reports").insert([
          {
            report_id: uniqueId,
            category: "goods",
            title: newTitle.trim(),
            description: `Marketplace offering listed by ${newSeller.trim()}.`,
            location_address: newLocation.trim(),
            province: "KwaZulu-Natal",
            municipality: "Msunduzi",
            ward: "Ward 26",
            priority: "Low",
            status: "Available",
            time_str: "Just now",
            reporter_name: newSeller.trim(),
            reporter_phone: newListingItem.contactPhone,
            estimated_fix_time: newPrice.trim(),
            latitude: Number.isFinite(newListingItem.latitude) ? newListingItem.latitude : null,
            longitude: Number.isFinite(newListingItem.longitude) ? newListingItem.longitude : null,
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to sync new listing to Supabase:", err);
    }

    const updatedListings = [newListingItem, ...listings];
    setListings(updatedListings);
    writeOfflineData("resigrid_marketplace_listings", updatedListings);

    // Reset Form & Close Modal
    setIsModalOpen(false);
    setNewTitle("");
    setNewPrice("");
    setNewSeller("");
    setNewLocation("");
    setNewPhone("");
  };

  const handleTradeContact = (item: ListingItem) => {
    const message = `Hello ${item.seller}, I am inquiring about your ResiMarket listing: "${item.title}" priced at ${item.price}.\nIs this still available?`;
    openWhatsApp(item.contactPhone || "", message);
  };

  // Filter listings within 10km radius using GeoContext filterByRadius engine
  const nearbyListings = useMemo(() => {
    return filterByRadius(listings, 10.0);
  }, [filterByRadius, listings]);

  const displayListings = nearbyListings;

  const filteredListings = displayListings.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] pb-28 sm:pb-32 pt-3 sm:pt-4 px-2.5 sm:px-6 lg:px-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6 selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      {/* Ambient environment */}
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      {/* UNIFIED TOP COMMAND PANEL CONTAINER */}
      <div 
        className="glass-panel p-3 sm:p-5 relative overflow-hidden space-y-2.5 sm:space-y-3 pointer-events-auto border rounded-2xl"
        style={{
          borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${accentColor} 6%, transparent)`,
        }}
      >
        <div className="panel-reflection pointer-events-none" />

        {/* Top Row: Header Branding */}
        <div className="flex items-center justify-between relative z-10 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="feature-icon feature-energy shrink-0" style={{ color: accentColor }}>
              <ShoppingBag className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: accentColor }} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xs font-semibold tracking-[0.15em] sm:tracking-[0.18em] text-white sm:text-sm truncate">
                RESIMARKET
              </h1>
              <p className="mt-0.5 truncate text-[8px] sm:text-[10px] tracking-[0.1em] text-muted">
                POWER, WATER & SERVICE TRADING
              </p>
            </div>
          </Link>
        </div>

        {/* Bottom Row: Location Pill & Register Button Side-by-Side */}
        <div className="flex items-center gap-2 relative z-20 pt-1">
          {/* Location Pill */}
          <div 
            className="glass-panel px-3 py-2 flex items-center justify-between gap-2 flex-1 min-w-0 rounded-xl"
            style={{
              borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Navigation className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate font-semibold text-white text-[11px] sm:text-xs">
                {streetAddress}
              </span>
            </div>
            <button
              type="button"
              onClick={(event) => {
                animateRefreshIcon(event.currentTarget);
                refreshLocation();
              }}
              title="Refresh Location"
              className="transition-colors shrink-0 cursor-pointer p-1 touch-manipulation z-30 hover:text-white"
              style={{ color: accentColor }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${geoLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Register / Post Listing Button Pill */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="glass-panel px-3.5 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-white transition-all cursor-pointer touch-manipulation z-30 hover:opacity-90 shrink-0 rounded-xl whitespace-nowrap"
            style={{
              borderColor: `color-mix(in srgb, ${accentColor} 45%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
            }}
          >
            <Plus className="h-3.5 w-3.5" style={{ color: accentColor }} />
            <span className="inline">Post</span>
          </button>
        </div>
      </div>

      {/* WHITE DIVIDER LINE & BREATHING ROOM */}
      <div className="pt-2 pb-2">
        <hr className="border-t border-white/20 w-full" />
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="glass-panel p-3 sm:p-4 flex items-center gap-2 relative pointer-events-auto rounded-2xl">
        <div className="panel-reflection pointer-events-none" />

        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search power, water reserves, equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-muted focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Filter Modal Trigger Button */}
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className="p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer hover:opacity-90 shrink-0"
          style={{
            color: accentColor,
            borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
          }}
          title="Filter"
        >
          <SlidersHorizontal className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* LISTINGS GRID (WITHIN 10KM RADIUS) */}
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 relative z-10">
          {filteredListings.length === 0 ? (
            <div className="col-span-full glass-panel p-6 sm:p-8 text-center text-muted text-xs rounded-2xl">
              No listings found within 10km matching your criteria.
            </div>
          ) : (
            filteredListings.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-4 sm:p-5 flex flex-col justify-between group hover:border-white/30 transition-all relative pointer-events-auto rounded-2xl focus:outline-none"
              >
                <div className="panel-reflection pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
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
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-white transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted flex-wrap">
                    <span>
                      By <strong className="text-white">{item.seller}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted mt-1.5 mb-3 truncate">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: accentColor }} /> 
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase text-muted tracking-wider block">
                      Asking Rate
                    </span>
                    <span className="text-base sm:text-lg font-extrabold font-mono" style={{ color: accentColor }}>
                      {item.price}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTradeContact(item)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} /> <span>Contact Seller</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FILTER SELECTION POPUP MODAL */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 pointer-events-auto">
          <div
            className="glass-panel w-full max-w-sm p-4 sm:p-6 relative space-y-3.5 pointer-events-auto rounded-2xl"
            style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 shrink-0" style={{ color: accentColor }} /> Filter Listings By Category
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="text-muted hover:text-white cursor-pointer relative z-30 p-1"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </button>
            </div>

            <div className="space-y-2 relative z-25 py-2">
              {(["all", "power", "water", "goods"] as const).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setIsFilterModalOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer border ${
                    activeCategory === cat
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-black/40 border-white/10 text-muted hover:text-white hover:bg-white/10"
                  }`}
                >
                  {cat === "all" ? "All Categories" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW LISTING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 pointer-events-auto overflow-y-auto">
          <div
            className="glass-panel w-full max-w-md p-4 sm:p-6 relative space-y-3.5 pointer-events-auto my-auto max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 shrink-0" style={{ color: accentColor }} /> Post Marketplace Offer
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
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Listing Title / Item Name *</label>
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
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Category *</label>
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
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Price / Rate *</label>
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
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Seller / Business Name *</label>
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
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Location / Zone *</label>
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
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">WhatsApp Contact *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. +27 82 123 4567"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full border text-xs font-semibold transition-all mt-3 cursor-pointer hover:opacity-95 shadow-lg"
                style={{
                  color: accentColor,
                  borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
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
