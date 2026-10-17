"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Store,
  Zap,
  Droplets,
  PackageCheck,
  Search,
  Plus,
  MapPin,
  Navigation,
  RefreshCw,
  MessageCircle,
  X,
  ShieldCheck,
  Flame,
  AlertTriangle,
  BatteryCharging,
  Truck,
  Megaphone,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";

interface SpazaRescueShop {
  id: string;
  shopName: string;
  owner: string;
  location: string;
  ward: string;
  isOperating: boolean;
  hasDryStock: boolean;
  hasGasOrParaffin: boolean;
  hasEmergencyCharging: boolean;
  perishableClearanceAlert?: string;
  essentialStock: string[];
  contactPhone: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  formattedDistance?: string;
}

interface EmergencyReliefRequest {
  id: string;
  title: string;
  type: "bulk-need" | "tanker-alert";
  location: string;
  postedBy: string;
  urgency: "Critical" | "Moderate";
  description: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
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

const DEFAULT_CRISIS_SHOPS: SpazaRescueShop[] = [
  {
    id: "SPAZA-101",
    shopName: "Mam' Rose Spaza & Dry Goods",
    owner: "Rose Dlamini",
    location: "144 Victoria Road",
    ward: "Ward 26",
    isOperating: true,
    hasDryStock: true,
    hasGasOrParaffin: true,
    hasEmergencyCharging: false,
    perishableClearanceAlert: "Fresh Milk & Bread 50% off - Buy before 2 PM power loss!",
    essentialStock: ["Maize Meal (10kg)", "LPG Gas 9kg", "Candles", "Canned Beans"],
    contactPhone: "27821234567",
    latitude: -29.6006,
    longitude: 30.3794,
  },
  {
    id: "SPAZA-102",
    shopName: "Sipho's Corner Shop",
    owner: "Sipho Khumalo",
    location: "Block C, Section 4",
    ward: "Ward 22",
    isOperating: true,
    hasDryStock: true,
    hasGasOrParaffin: false,
    hasEmergencyCharging: true,
    essentialStock: ["10-Min Phone Charging (12V)", "Dry Biscuits", "Matches", "Paraffin"],
    contactPhone: "27839876543",
    latitude: -29.6100,
    longitude: 30.3850,
  },
  {
    id: "SPAZA-103",
    shopName: "Edendale Community Supply & Paraffin",
    owner: "David Naidoo",
    location: "Main Road, Edendale",
    ward: "Ward 8",
    isOperating: true,
    hasDryStock: true,
    hasGasOrParaffin: true,
    hasEmergencyCharging: false,
    essentialStock: ["Paraffin (per Litre)", "25L Water Drums", "Candles", "Batteries"],
    contactPhone: "27815550192",
    latitude: -29.5900,
    longitude: 30.3600,
  },
];

const DEFAULT_RELIEF_REQUESTS: EmergencyReliefRequest[] = [
  {
    id: "RELIEF-501",
    title: "Ward 22 Spaza Bulk Restock Needed",
    type: "bulk-need",
    location: "Block C Community Centre",
    postedBy: "Sipho Khumalo (Spaza Owner)",
    urgency: "Critical",
    description: "Running completely out of maize meal and paraffin. Looking for wholesale distributor with transport heading to Section 4.",
    contactPhone: "27839876543",
    latitude: -29.6100,
    longitude: 30.3850,
  },
  {
    id: "RELIEF-502",
    title: "Roving Municipal Water Tanker Parked",
    type: "tanker-alert",
    location: "Main Road & Victoria Intersection",
    postedBy: "Community Wardens",
    urgency: "Moderate",
    description: "Municipal water tanker is stationed here for the next 2 hours filling 25L drums for residents and shops.",
    contactPhone: "27821234567",
    latitude: -29.6006,
    longitude: 30.3794,
  },
];

export default function SpazaRescuePage() {
  const { streetAddress, location, filterByRadius, refreshLocation, loading: geoLoading } = useGeo();

  // Navigation Tabs: 'shops' | 'relief'
  const [activeTab, setActiveTab] = useState<"shops" | "relief">("shops");

  // Theme Accent Persistence
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

  const [shops, setShops] = useState<SpazaRescueShop[]>(DEFAULT_CRISIS_SHOPS);
  const [reliefRequests, setReliefRequests] = useState<EmergencyReliefRequest[]>(DEFAULT_RELIEF_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [gasParaffinFilter, setGasParaffinFilter] = useState(false);
  const [clearanceFilter, setClearanceFilter] = useState(false);

  // Modal State for Shops
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [shopName, setShopName] = useState("");
  const [owner, setOwner] = useState("");
  const [hasDry, setHasDry] = useState(true);
  const [hasGasPara, setHasGasPara] = useState(true);
  const [hasCharging, setHasCharging] = useState(false);
  const [clearanceText, setClearanceText] = useState("");
  const [stockInput, setStockInput] = useState("");
  const [shopPhone, setShopPhone] = useState("");

  // Modal State for Relief / Tanker Requests
  const [isReliefModalOpen, setIsReliefModalOpen] = useState(false);
  const [reliefTitle, setReliefTitle] = useState("");
  const [reliefType, setReliefType] = useState<"bulk-need" | "tanker-alert">("bulk-need");
  const [reliefDesc, setReliefDesc] = useState("");
  const [reliefPhone, setReliefPhone] = useState("");

  // Storage sync
  useEffect(() => {
    try {
      const savedShops = localStorage.getItem("resigrid_spaza_crisis_shops");
      if (savedShops) {
        const parsed = JSON.parse(savedShops);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setShops(
            parsed.map((item: any) => ({
              ...item,
              latitude: typeof item.latitude === "number" ? item.latitude : -29.6006,
              longitude: typeof item.longitude === "number" ? item.longitude : 30.3794,
            }))
          );
        }
      }
      const savedRelief = localStorage.getItem("resigrid_spaza_relief_requests");
      if (savedRelief) {
        const parsed = JSON.parse(savedRelief);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReliefRequests(
            parsed.map((item: any) => ({
              ...item,
              latitude: typeof item.latitude === "number" ? item.latitude : -29.6006,
              longitude: typeof item.longitude === "number" ? item.longitude : 30.3794,
            }))
          );
        }
      }
    } catch (e) {
      console.error("Error loading local storage:", e);
    }
  }, []);

  const handleRegisterShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !owner) return;

    const newShop: SpazaRescueShop = {
      id: `SPAZA-${Math.floor(Math.random() * 8999 + 1000)}`,
      shopName: shopName.trim(),
      owner: owner.trim(),
      location: streetAddress,
      ward: "Ward 26",
      isOperating: true,
      hasDryStock: hasDry,
      hasGasOrParaffin: hasGasPara,
      hasEmergencyCharging: hasCharging,
      perishableClearanceAlert: clearanceText.trim() || undefined,
      essentialStock: stockInput ? stockInput.split(",").map((s) => s.trim()) : ["Maize", "Candles"],
      contactPhone: shopPhone.replace(/[^0-9]/g, "") || "27821234567",
      latitude: location?.latitude ?? -29.6000,
      longitude: location?.longitude ?? 30.3800,
    };

    const updated = [newShop, ...shops];
    setShops(updated);
    localStorage.setItem("resigrid_spaza_crisis_shops", JSON.stringify(updated));

    setIsShopModalOpen(false);
    setShopName("");
    setOwner("");
    setStockInput("");
    setClearanceText("");
    setShopPhone("");
  };

  const handlePostRelief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reliefTitle || !reliefDesc) return;

    const newRelief: EmergencyReliefRequest = {
      id: `RELIEF-${Math.floor(Math.random() * 8999 + 1000)}`,
      title: reliefTitle.trim(),
      type: reliefType,
      location: streetAddress,
      postedBy: "Community Member / Spaza",
      urgency: "Critical",
      description: reliefDesc.trim(),
      contactPhone: reliefPhone.replace(/[^0-9]/g, "") || "27821234567",
      latitude: location?.latitude ?? -29.6000,
      longitude: location?.longitude ?? 30.3800,
    };

    const updated = [newRelief, ...reliefRequests];
    setReliefRequests(updated);
    localStorage.setItem("resigrid_spaza_relief_requests", JSON.stringify(updated));

    setIsReliefModalOpen(false);
    setReliefTitle("");
    setReliefDesc("");
    setReliefPhone("");
  };

  const handleContactWhatsApp = (targetPhone: string, msgText: string) => {
    const cleanNum = targetPhone || "27821234567";
    const msg = encodeURIComponent(`Hello, contacting via SpazaRescue regarding: "${msgText}". Is this available/active?`);
    window.open(`https://wa.me/${cleanNum}?text=${msg}`, "_blank");
  };

  // Filter 10km radius using GeoContext
  const nearbyShops = useMemo(() => {
    return filterByRadius(shops, 10.0);
  }, [filterByRadius, shops]);

  const nearbyRelief = useMemo(() => {
    return filterByRadius(reliefRequests, 10.0);
  }, [filterByRadius, reliefRequests]);

  const displayShops = nearbyShops.length > 0 ? nearbyShops : shops;
  const displayRelief = nearbyRelief.length > 0 ? nearbyRelief : reliefRequests;

  const filteredShops = displayShops.filter((s) => {
    const matchesSearch =
      s.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.essentialStock.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGasPara = !gasParaffinFilter || s.hasGasOrParaffin;
    const matchesClearance = !clearanceFilter || !!s.perishableClearanceAlert;
    return matchesSearch && matchesGasPara && matchesClearance;
  });

  const filteredRelief = displayRelief.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] pb-32 pt-4 px-3 sm:px-6 lg:px-10 max-w-[1920px] mx-auto space-y-5 selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      
      {/* Ambient background */}
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      {/* UNIFIED TOP COMMAND PANEL CONTAINER */}
      <div 
        className="glass-panel p-3.5 sm:p-5 relative overflow-hidden space-y-3 pointer-events-auto border"
        style={{
          borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${accentColor} 6%, transparent)`,
        }}
      >
        <div className="panel-reflection pointer-events-none" />

        {/* Top Row: Header Branding */}
        <div className="flex items-center justify-between relative z-10">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="feature-icon feature-food shrink-0" style={{ color: accentColor }}>
              <Store className="w-[18px] h-[18px]" style={{ color: accentColor }} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm truncate">
                SPAZARESCUE™
              </h1>
              <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                DRY-STOCK SHOPS, SPOILAGE CLEARANCE, MICRO-CHARGING & ROVING TANKER ALERTS
              </p>
            </div>
          </Link>
        </div>

        {/* Bottom Row: Location Pill (Full Width) */}
        <div className="flex items-center gap-2 relative z-20 pt-1">
          <div 
            className="glass-panel px-3 py-2 flex items-center justify-between gap-2 flex-1 min-w-0 rounded-xl"
            style={{
              borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Navigation className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />
              <span className="truncate font-semibold text-white text-[10px] sm:text-xs">
                {streetAddress}
              </span>
            </div>
            <button
              type="button"
              onClick={refreshLocation}
              title="Refresh Location"
              className="transition-colors shrink-0 cursor-pointer p-1 touch-manipulation z-30 hover:text-white"
              style={{ color: accentColor }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${geoLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* TABS & ACTION BAR */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative pointer-events-auto z-10">
        <div className="panel-reflection pointer-events-none" />

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("shops")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "shops"
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/5 border border-white/10 text-muted hover:text-white"
            }`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" /> Off-Grid Spazas & Clearance
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("relief")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "relief"
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/5 border border-white/10 text-muted hover:text-white"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 shrink-0" /> Emergency Relief & Tankers
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === "shops") setIsShopModalOpen(true);
            else setIsReliefModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-95 w-full sm:w-auto shrink-0"
          style={{
            color: accentColor,
            borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
          }}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>{activeTab === "shops" ? "Register Shop Status" : "Post Relief / Tanker Alert"}</span>
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative pointer-events-auto z-10">
        <div className="panel-reflection pointer-events-none" />

        <div className="relative flex-1 w-full sm:min-w-[240px]">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === "shops" ? "Search maize, paraffin, gas, micro-charging..." : "Search bulk needs, municipal tankers..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-muted focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {activeTab === "shops" && (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setGasParaffinFilter(!gasParaffinFilter)}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                gasParaffinFilter
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-white/5 border-white/10 text-muted hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>{gasParaffinFilter ? "Gas / Paraffin Only" : "Filter Fuel"}</span>
            </button>

            <button
              type="button"
              onClick={() => setClearanceFilter(!clearanceFilter)}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                clearanceFilter
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-white/5 border-white/10 text-muted hover:text-white"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{clearanceFilter ? "Spoilage Clearance Only" : "Food Clearance Deals"}</span>
            </button>
          </div>
        )}
      </div>

      {/* CONTENT GRID */}
      {activeTab === "shops" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 relative z-10">
          {filteredShops.length === 0 ? (
            <div className="col-span-full glass-panel p-8 text-center text-muted text-xs">
              No off-grid spaza shops registered within 10km matching these criteria.
            </div>
          ) : (
            filteredShops.map((shop) => (
              <div
                key={shop.id}
                className="glass-panel p-4 sm:p-5 flex flex-col justify-between group hover:border-white/30 transition-all relative pointer-events-auto"
              >
                <div className="panel-reflection pointer-events-none" />

                <div>
                  <div className="flex items-start sm:items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {shop.shopName}
                    </h3>
                    <span className="text-[11px] sm:text-xs font-mono shrink-0" style={{ color: accentColor }}>
                      {shop.formattedDistance ? `${shop.formattedDistance} away` : "Nearby"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted mb-3 flex-wrap">
                    <span>Owner: <strong className="text-white">{shop.owner}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate max-w-full">
                      <MapPin className="w-3 h-3 shrink-0" style={{ color: accentColor }} /> <span className="truncate">{shop.location}</span>
                    </span>
                  </div>

                  {/* Spoilage Clearance Banner */}
                  {shop.perishableClearanceAlert && (
                    <div className="mb-4 p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white text-[11px] uppercase tracking-wider">
                          Daily Fresh Spoilage Clearance
                        </strong>
                        <span>{shop.perishableClearanceAlert}</span>
                      </div>
                    </div>
                  )}

                  {/* Low-Tech Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {shop.hasDryStock && (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                        🕯️ Dry-Stock Active Only
                      </span>
                    )}

                    {shop.hasGasOrParaffin && (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1">
                        <Flame className="w-3 h-3 shrink-0" /> Gas / Paraffin
                      </span>
                    )}

                    {shop.hasEmergencyCharging && (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border bg-cyan-500/10 text-cyan-400 border-cyan-500/30 flex items-center gap-1">
                        <BatteryCharging className="w-3 h-3 shrink-0" /> 12V Micro-Charging
                      </span>
                    )}
                  </div>

                  {/* Stock Tags */}
                  <div>
                    <span className="text-[10px] uppercase text-muted tracking-wider block mb-1">
                      Available Outage Staples:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {shop.essentialStock.map((item, idx) => (
                        <span key={idx} className="text-[10px] bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <span className="text-xs text-muted flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Community Verified
                  </span>

                  <button
                    type="button"
                    onClick={() => handleContactWhatsApp(shop.contactPhone, shop.shopName)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} /> <span>WhatsApp Shop</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* RELIEF & TANKER ALERTS TAB */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 relative z-10">
          {filteredRelief.length === 0 ? (
            <div className="col-span-full glass-panel p-8 text-center text-muted text-xs">
              No active emergency relief or tanker alerts found within 10km.
            </div>
          ) : (
            filteredRelief.map((req) => (
              <div
                key={req.id}
                className="glass-panel p-4 sm:p-5 flex flex-col justify-between group hover:border-white/30 transition-all relative pointer-events-auto"
              >
                <div className="panel-reflection pointer-events-none" />

                <div>
                  <div className="flex items-start sm:items-center justify-between gap-2 mb-3 flex-wrap">
                    <span
                      className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${
                        req.type === "bulk-need"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                      }`}
                    >
                      {req.type === "bulk-need" ? <Megaphone className="w-3 h-3 shrink-0" /> : <Droplets className="w-3 h-3 shrink-0" />}
                      <span>{req.type === "bulk-need" ? "Spaza Emergency Bulk Need" : "Roving Municipal Tanker"}</span>
                    </span>

                    <span className="text-[11px] sm:text-xs font-mono shrink-0" style={{ color: accentColor }}>
                      {req.formattedDistance ? `${req.formattedDistance} away` : "Nearby"}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {req.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted mb-3 flex-wrap">
                    <span>By: <strong className="text-white">{req.postedBy}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate max-w-full">
                      <MapPin className="w-3 h-3 shrink-0" style={{ color: accentColor }} /> <span className="truncate">{req.location}</span>
                    </span>
                  </div>

                  <p className="text-xs text-white/80 bg-black/30 p-3 rounded-xl border border-white/5 leading-relaxed">
                    {req.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <span className="text-xs text-rose-400 font-mono font-semibold flex items-center gap-1">
                    Urgency: {req.urgency}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleContactWhatsApp(req.contactPhone, req.title)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} /> <span>Coordinate via WhatsApp</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* REGISTER SHOP MODAL */}
      {isShopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto overflow-y-auto">
          <div
            className="glass-panel w-full max-w-md p-5 sm:p-6 relative space-y-4 pointer-events-auto my-auto max-h-[90vh] overflow-y-auto"
            style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Store className="h-4 w-4 shrink-0" style={{ color: accentColor }} /> Register Off-Grid Spaza Status
              </h3>
              <button
                type="button"
                onClick={() => setIsShopModalOpen(false)}
                className="text-muted hover:text-white cursor-pointer relative z-30 p-1"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handleRegisterShop} className="space-y-3 relative z-20">
              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Spaza / Shop Name</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Mam' Rose Spaza"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Owner Name</label>
                <input
                  type="text"
                  required
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. Rose Dlamini"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Low-Tech Status Toggles */}
              <div className="space-y-2 py-1">
                <label className="text-[11px] sm:text-xs text-muted block">Low-Tech & Outage Capabilities:</label>

                <div className="flex items-center justify-between p-2.5 bg-black/30 border border-white/5 rounded-xl gap-2">
                  <span className="text-xs text-white flex items-center gap-1.5">
                    🕯️ Dry-Stock Active Only (Maize, Rice, Canned, Candles)
                  </span>
                  <input
                    type="checkbox"
                    checked={hasDry}
                    onChange={(e) => setHasDry(e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-[var(--accent)] shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-black/30 border border-white/5 rounded-xl gap-2">
                  <span className="text-xs text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Gas Refills & Paraffin Available
                  </span>
                  <input
                    type="checkbox"
                    checked={hasGasPara}
                    onChange={(e) => setHasGasPara(e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-[var(--accent)] shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-black/30 border border-white/5 rounded-xl gap-2">
                  <span className="text-xs text-white flex items-center gap-1.5">
                    <BatteryCharging className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> 12V Car Battery Micro-Charging
                  </span>
                  <input
                    type="checkbox"
                    checked={hasCharging}
                    onChange={(e) => setHasCharging(e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-[var(--accent)] shrink-0"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Daily Fresh Spoilage Clearance (Optional)</label>
                <input
                  type="text"
                  value={clearanceText}
                  onChange={(e) => setClearanceText(e.target.value)}
                  placeholder="e.g. Meat & Milk 50% off before power loss"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Available Essentials (comma-separated)</label>
                <input
                  type="text"
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  placeholder="Maize Meal, Candles, Matches, Paraffin"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  required
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  placeholder="e.g. 27821234567"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl border text-xs font-semibold transition-all mt-2 cursor-pointer hover:opacity-90"
                style={{
                  color: accentColor,
                  borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                }}
              >
                Post Status to Community Grid
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POST RELIEF / TANKER ALERT MODAL */}
      {isReliefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto overflow-y-auto">
          <div
            className="glass-panel w-full max-w-md p-5 sm:p-6 relative space-y-4 pointer-events-auto my-auto max-h-[90vh] overflow-y-auto"
            style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Megaphone className="h-4 w-4 shrink-0" style={{ color: accentColor }} /> Post Emergency Relief or Tanker Alert
              </h3>
              <button
                type="button"
                onClick={() => setIsReliefModalOpen(false)}
                className="text-muted hover:text-white cursor-pointer relative z-30 p-1"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handlePostRelief} className="space-y-3 relative z-20">
              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={reliefTitle}
                  onChange={(e) => setReliefTitle(e.target.value)}
                  placeholder="e.g. Spaza Bulk Restock Needed or Tanker at Corner"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Alert Type</label>
                <select
                  value={reliefType}
                  onChange={(e) => setReliefType(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                >
                  <option value="bulk-need" className="bg-neutral-900 text-white">📢 Spaza Emergency Bulk Need (Restock / Distributor)</option>
                  <option value="tanker-alert" className="bg-neutral-900 text-white">🚰 Roving Municipal Water Tanker / Generator Alert</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Description & Location Details</label>
                <textarea
                  required
                  rows={3}
                  value={reliefDesc}
                  onChange={(e) => setReliefDesc(e.target.value)}
                  placeholder="Describe what is needed or where the tanker/generator is parked..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">WhatsApp Contact Phone</label>
                <input
                  type="text"
                  required
                  value={reliefPhone}
                  onChange={(e) => setReliefPhone(e.target.value)}
                  placeholder="e.g. 27821234567"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl border text-xs font-semibold transition-all mt-2 cursor-pointer hover:opacity-90"
                style={{
                  color: accentColor,
                  borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                }}
              >
                Broadcast Alert to Community
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
