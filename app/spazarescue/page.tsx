"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Store,
  Utensils,
  PackageCheck,
  Search,
  Plus,
  MapPin,
  Navigation,
  RefreshCw,
  MessageCircle,
  X,
  ShieldCheck,
  AlertTriangle,
  HeartHandshake,
  Tag,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";

interface SpazaFoodStore {
  id: string;
  shopName: string;
  ownerName: string;
  tradingPermitId: string;
  location: string;
  ward: string;
  isOperating: boolean;
  hasDryStock: boolean;
  spoilageClearanceAlert?: string;
  foodEssentials: string[];
  contactPhone: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  formattedDistance?: string;
}

interface CommunityFoodAid {
  id: string;
  title: string;
  aidType: "soup-kitchen" | "community-pantry" | "bulk-food-drop";
  location: string;
  coordinator: string;
  description: string;
  operatingHours: string;
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

const DEFAULT_FOOD_STORES: SpazaFoodStore[] = [
  {
    id: "SPAZA-FOOD-1",
    shopName: "Mam' Rose Dry Goods & Maize Depot",
    ownerName: "Rose Dlamini",
    tradingPermitId: "TRD-2026-MS221",
    location: "144 Victoria Road, PMB",
    ward: "Ward 26",
    isOperating: true,
    hasDryStock: true,
    spoilageClearanceAlert: "Fresh bread & milk 50% off before 3 PM power outage window!",
    foodEssentials: ["Maize Meal (10kg/25kg)", "Samp & Beans", "Canned Pilchards", "Long-life Milk", "Fresh Bread"],
    contactPhone: "27821234567",
    latitude: -29.6006,
    longitude: 30.3794,
  },
  {
    id: "SPAZA-FOOD-2",
    shopName: "Sipho's Community Groceries",
    ownerName: "Sipho Khumalo",
    tradingPermitId: "TRD-2025-SK984",
    location: "Block C, Section 4, Edendale",
    ward: "Ward 22",
    isOperating: true,
    hasDryStock: true,
    foodEssentials: ["Rice (5kg)", "Cooking Oil 2L", "Sugar & Tea", "Canned Baked Beans", "Soup Mix"],
    contactPhone: "27839876543",
    latitude: -29.6100,
    longitude: 30.3850,
  },
  {
    id: "SPAZA-FOOD-3",
    shopName: "Edendale Essential Pantry",
    ownerName: "David Naidoo",
    tradingPermitId: "TRD-2026-EN412",
    location: "Main Road, Edendale",
    ward: "Ward 8",
    isOperating: true,
    hasDryStock: true,
    spoilageClearanceAlert: "Surplus fresh vegetables discounted for immediate household use.",
    foodEssentials: ["Mealie Meal", "Dry Lentils", "Porridge", "Salt & Spices", "Fresh Tomatoes"],
    contactPhone: "27815550192",
    latitude: -29.5900,
    longitude: 30.3600,
  },
];

const DEFAULT_FOOD_AID: CommunityFoodAid[] = [
  {
    id: "AID-801",
    title: "Sunset Ridge Community Soup Kitchen",
    aidType: "soup-kitchen",
    location: "Sector 4 Community Hall",
    coordinator: "Pastor Thabo Mokoena",
    description: "Providing warm nutritious meals daily from 12 PM to 2 PM for families affected by utility disruptions.",
    operatingHours: "Daily: 12:00 PM - 2:00 PM",
    contactPhone: "27821234567",
    latitude: -29.6006,
    longitude: 30.3794,
  },
  {
    id: "AID-802",
    title: "Edendale Emergency Food Pantry",
    aidType: "community-pantry",
    location: "Main Road Resource Centre",
    coordinator: "Zinhle Dube",
    description: "Emergency dry food parcels (maize, beans, cooking oil) available for vulnerable households.",
    operatingHours: "Mon-Fri: 9:00 AM - 4:00 PM",
    contactPhone: "27839876543",
    latitude: -29.5950,
    longitude: 30.3700,
  },
];

export default function SpazaRescuePage() {
  const { streetAddress, location, filterByRadius, refreshLocation, loading: geoLoading } = useGeo();

  // Navigation Tabs: 'stores' | 'aid'
  const [activeTab, setActiveTab] = useState<"stores" | "aid">("stores");

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

  const [stores, setStores] = useState<SpazaFoodStore[]>(DEFAULT_FOOD_STORES);
  const [foodAidList, setFoodAidList] = useState<CommunityFoodAid[]>(DEFAULT_FOOD_AID);
  const [searchQuery, setSearchQuery] = useState("");
  const [clearanceFilter, setClearanceFilter] = useState(false);

  // Modal State for Registering Spaza Store
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [tradingPermitId, setTradingPermitId] = useState("");
  const [ward, setWard] = useState("Ward 26");
  const [spoilageAlert, setSpoilageAlert] = useState("");
  const [essentialsInput, setEssentialsInput] = useState("");
  const [shopPhone, setShopPhone] = useState("");

  // Modal State for Posting Food Aid / Soup Kitchen
  const [isAidModalOpen, setIsAidModalOpen] = useState(false);
  const [aidTitle, setAidTitle] = useState("");
  const [aidType, setAidType] = useState<"soup-kitchen" | "community-pantry" | "bulk-food-drop">("soup-kitchen");
  const [aidCoordinator, setAidCoordinator] = useState("");
  const [aidHours, setAidHours] = useState("");
  const [aidDesc, setAidDesc] = useState("");
  const [aidPhone, setAidPhone] = useState("");

  // Storage sync
  useEffect(() => {
    try {
      const savedStores = localStorage.getItem("resigrid_spaza_food_stores");
      if (savedStores) {
        const parsed = JSON.parse(savedStores);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStores(
            parsed.map((item: any) => ({
              ...item,
              latitude: typeof item.latitude === "number" ? item.latitude : -29.6006,
              longitude: typeof item.longitude === "number" ? item.longitude : 30.3794,
            }))
          );
        }
      }
      const savedAid = localStorage.getItem("resigrid_community_food_aid");
      if (savedAid) {
        const parsed = JSON.parse(savedAid);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFoodAidList(
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

  const handleRegisterStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !ownerName || !tradingPermitId) return;

    const newStore: SpazaFoodStore = {
      id: `SPAZA-${Math.floor(Math.random() * 8999 + 1000)}`,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      tradingPermitId: tradingPermitId.trim(),
      location: streetAddress,
      ward: ward.trim() || "Ward 26",
      isOperating: true,
      hasDryStock: true,
      spoilageClearanceAlert: spoilageAlert.trim() || undefined,
      foodEssentials: essentialsInput ? essentialsInput.split(",").map((s) => s.trim()) : ["Maize Meal", "Canned Goods", "Bread"],
      contactPhone: shopPhone.replace(/[^0-9]/g, "") || "27821234567",
      latitude: location?.latitude ?? -29.6000,
      longitude: location?.longitude ?? 30.3800,
    };

    const updated = [newStore, ...stores];
    setStores(updated);
    localStorage.setItem("resigrid_spaza_food_stores", JSON.stringify(updated));

    setIsStoreModalOpen(false);
    setShopName("");
    setOwnerName("");
    setTradingPermitId("");
    setSpoilageAlert("");
    setEssentialsInput("");
    setShopPhone("");
  };

  const handlePostAid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aidTitle || !aidCoordinator || !aidDesc) return;

    const newAid: CommunityFoodAid = {
      id: `AID-${Math.floor(Math.random() * 8999 + 1000)}`,
      title: aidTitle.trim(),
      aidType,
      location: streetAddress,
      coordinator: aidCoordinator.trim(),
      description: aidDesc.trim(),
      operatingHours: aidHours.trim() || "Daily: 9:00 AM - 3:00 PM",
      contactPhone: aidPhone.replace(/[^0-9]/g, "") || "27821234567",
      latitude: location?.latitude ?? -29.6000,
      longitude: location?.longitude ?? 30.3800,
    };

    const updated = [newAid, ...foodAidList];
    setFoodAidList(updated);
    localStorage.setItem("resigrid_community_food_aid", JSON.stringify(updated));

    setIsAidModalOpen(false);
    setAidTitle("");
    setAidCoordinator("");
    setAidHours("");
    setAidDesc("");
    setAidPhone("");
  };

  const handleContactWhatsApp = (targetPhone: string, storeName: string) => {
    const cleanNum = targetPhone || "27821234567";
    const msg = encodeURIComponent(`Hello, I am contacting via SpazaRescue regarding food stock & clearance at "${storeName}". Is this available?`);
    window.open(`https://wa.me/${cleanNum}?text=${msg}`, "_blank");
  };

  // Filter within 10km radius using GeoContext
  const nearbyStores = useMemo(() => {
    return filterByRadius(stores, 10.0);
  }, [filterByRadius, stores]);

  const nearbyAid = useMemo(() => {
    return filterByRadius(foodAidList, 10.0);
  }, [filterByRadius, foodAidList]);

  const displayStores = nearbyStores.length > 0 ? nearbyStores : stores;
  const displayAid = nearbyAid.length > 0 ? nearbyAid : foodAidList;

  const filteredStores = displayStores.filter((s) => {
    const matchesSearch =
      s.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.foodEssentials.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ward.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClearance = !clearanceFilter || !!s.spoilageClearanceAlert;
    return matchesSearch && matchesClearance;
  });

  const filteredAid = displayAid.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.coordinator.toLowerCase().includes(searchQuery.toLowerCase())
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
                FOOD SECURITY, DRY-STOCK SPASAS, SPOILAGE CLEARANCE & COMMUNITY SOUP KITCHENS
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
            onClick={() => setActiveTab("stores")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "stores"
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/5 border border-white/10 text-muted hover:text-white"
            }`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" /> Spaza Food Stores & Clearance
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("aid")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "aid"
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/5 border border-white/10 text-muted hover:text-white"
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 shrink-0" /> Soup Kitchens & Food Aid
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === "stores") setIsStoreModalOpen(true);
            else setIsAidModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 active:scale-95 w-full sm:w-auto shrink-0 shadow-lg"
          style={{
            color: accentColor,
            borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
          }}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>{activeTab === "stores" ? "Register Spaza Store" : "Post Food Aid / Kitchen"}</span>
        </button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative pointer-events-auto z-10">
        <div className="panel-reflection pointer-events-none" />

        <div className="relative flex-1 w-full sm:min-w-[240px]">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === "stores" ? "Search maize meal, bread, tinned goods, ward..." : "Search soup kitchens, community pantries..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-muted focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {activeTab === "stores" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setClearanceFilter(!clearanceFilter)}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                clearanceFilter
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-white/5 border-white/10 text-muted hover:text-white"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{clearanceFilter ? "Showing Clearance Deals" : "Spoilage Clearance Only"}</span>
            </button>
          </div>
        )}
      </div>

      {/* CONTENT LISTINGS */}
      {activeTab === "stores" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 relative z-10">
          {filteredStores.length === 0 ? (
            <div className="col-span-full glass-panel p-8 text-center text-muted text-xs">
              No registered spaza food stores found within 10km matching your search.
            </div>
          ) : (
            filteredStores.map((store) => (
              <div
                key={store.id}
                className="glass-panel p-4 sm:p-5 flex flex-col justify-between group hover:border-white/30 transition-all relative pointer-events-auto rounded-2xl"
              >
                <div className="panel-reflection pointer-events-none" />

                <div>
                  <div className="flex items-start sm:items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {store.shopName}
                    </h3>
                    <span className="text-[11px] sm:text-xs font-mono shrink-0" style={{ color: accentColor }}>
                      {store.formattedDistance ? `${store.formattedDistance} away` : "Nearby"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted mb-3 flex-wrap">
                    <span>Owner: <strong className="text-white">{store.ownerName}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/90">
                      Permit: {store.tradingPermitId}
                    </span>
                    <span>•</span>
                    <span className="text-white/90">{store.ward}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted mb-4 truncate">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: accentColor }} /> 
                    <span className="truncate">{store.location}</span>
                  </div>

                  {/* Spoilage Clearance Banner */}
                  {store.spoilageClearanceAlert && (
                    <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white text-[11px] uppercase tracking-wider mb-0.5">
                          Daily Spoilage Clearance Deal
                        </strong>
                        <span>{store.spoilageClearanceAlert}</span>
                      </div>
                    </div>
                  )}

                  {/* Food Essentials Badges */}
                  <div>
                    <span className="text-[10px] uppercase text-muted tracking-wider block mb-1.5">
                      Available Food Essentials &amp; Dry-Stock:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {store.foodEssentials.map((item, idx) => (
                        <span key={idx} className="text-[10px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white font-medium">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <span className="text-xs text-muted flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Verified Retailer
                  </span>

                  <button
                    type="button"
                    onClick={() => handleContactWhatsApp(store.contactPhone, store.shopName)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} /> <span>WhatsApp Store</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* SOUP KITCHENS & FOOD AID TAB */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 relative z-10">
          {filteredAid.length === 0 ? (
            <div className="col-span-full glass-panel p-8 text-center text-muted text-xs">
              No soup kitchens or food aid centres registered within 10km.
            </div>
          ) : (
            filteredAid.map((aid) => (
              <div
                key={aid.id}
                className="glass-panel p-4 sm:p-5 flex flex-col justify-between group hover:border-white/30 transition-all relative pointer-events-auto rounded-2xl"
              >
                <div className="panel-reflection pointer-events-none" />

                <div>
                  <div className="flex items-start sm:items-center justify-between gap-2 mb-3 flex-wrap">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5">
                      <Utensils className="w-3 h-3 shrink-0" />
                      <span>{aid.aidType === "soup-kitchen" ? "Community Soup Kitchen" : "Community Food Pantry"}</span>
                    </span>

                    <span className="text-[11px] sm:text-xs font-mono shrink-0" style={{ color: accentColor }}>
                      {aid.formattedDistance ? `${aid.formattedDistance} away` : "Nearby"}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {aid.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted mb-2 flex-wrap">
                    <span>Coordinator: <strong className="text-white">{aid.coordinator}</strong></span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted mb-3 truncate">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: accentColor }} /> 
                    <span className="truncate">{aid.location}</span>
                  </div>

                  <p className="text-xs text-white/80 bg-black/30 p-3 rounded-xl border border-white/5 leading-relaxed mb-3">
                    {aid.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono">
                    <Clock className="w-3.5 h-3.5 shrink-0" /> {aid.operatingHours}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <span className="text-xs text-muted flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Active Relief Point
                  </span>

                  <button
                    type="button"
                    onClick={() => handleContactWhatsApp(aid.contactPhone, aid.title)}
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

      {/* REGISTER SPAZA STORE MODAL */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto overflow-y-auto">
          <div
            className="glass-panel w-full max-w-md p-5 sm:p-6 relative space-y-4 pointer-events-auto my-auto max-h-[90vh] overflow-y-auto rounded-3xl"
            style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Store className="h-4 w-4 shrink-0" style={{ color: accentColor }} /> Register Spaza Food Store
              </h3>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="text-muted hover:text-white cursor-pointer relative z-30 p-1"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handleRegisterStore} className="space-y-3 relative z-20">
              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Spaza / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Mam' Rose Groceries"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Owner / Manager Full Name *</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Rose Dlamini"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Trading Permit / Reg ID *</label>
                  <input
                    type="text"
                    required
                    value={tradingPermitId}
                    onChange={(e) => setTradingPermitId(e.target.value)}
                    placeholder="e.g. TRD-2026-MS221"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Municipal Ward *</label>
                  <input
                    type="text"
                    required
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="e.g. Ward 26"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Daily Spoilage Clearance Deal (Optional)</label>
                <input
                  type="text"
                  value={spoilageAlert}
                  onChange={(e) => setSpoilageAlert(e.target.value)}
                  placeholder="e.g. Fresh milk & bread 50% off before grid failure"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Available Food Essentials (comma-separated) *</label>
                <input
                  type="text"
                  required
                  value={essentialsInput}
                  onChange={(e) => setEssentialsInput(e.target.value)}
                  placeholder="Maize Meal, Canned Pilchards, Long-life Milk, Bread"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">WhatsApp Contact Phone *</label>
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
                className="w-full py-3 rounded-full border text-xs font-semibold transition-all mt-3 cursor-pointer hover:opacity-95 shadow-lg"
                style={{
                  color: accentColor,
                  borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                }}
              >
                Publish Store Listing
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POST FOOD AID / KITCHEN MODAL */}
      {isAidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto overflow-y-auto">
          <div
            className="glass-panel w-full max-w-md p-5 sm:p-6 relative space-y-4 pointer-events-auto my-auto max-h-[90vh] overflow-y-auto rounded-3xl"
            style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 shrink-0" style={{ color: accentColor }} /> Post Food Aid or Soup Kitchen
              </h3>
              <button
                type="button"
                onClick={() => setIsAidModalOpen(false)}
                className="text-muted hover:text-white cursor-pointer relative z-30 p-1"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handlePostAid} className="space-y-3 relative z-20">
              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Title / Organisation Name *</label>
                <input
                  type="text"
                  required
                  value={aidTitle}
                  onChange={(e) => setAidTitle(e.target.value)}
                  placeholder="e.g. Sunset Ridge Soup Kitchen"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Aid Type *</label>
                <select
                  value={aidType}
                  onChange={(e) => setAidType(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                >
                  <option value="soup-kitchen" className="bg-neutral-900 text-white">🍲 Community Soup Kitchen (Prepared Meals)</option>
                  <option value="community-pantry" className="bg-neutral-900 text-white">📦 Community Food Pantry / Dry Parcels</option>
                  <option value="bulk-food-drop" className="bg-neutral-900 text-white">🚚 Bulk Food Distribution Drop</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Coordinator / Contact Person *</label>
                <input
                  type="text"
                  required
                  value={aidCoordinator}
                  onChange={(e) => setAidCoordinator(e.target.value)}
                  placeholder="e.g. Pastor Thabo Mokoena"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Operating Hours / Schedule *</label>
                <input
                  type="text"
                  required
                  value={aidHours}
                  onChange={(e) => setAidHours(e.target.value)}
                  placeholder="e.g. Daily: 12:00 PM - 2:00 PM"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Description &amp; Requirements *</label>
                <textarea
                  required
                  rows={3}
                  value={aidDesc}
                  onChange={(e) => setAidDesc(e.target.value)}
                  placeholder="Describe meals served, who is eligible, or volunteer/donation needs..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">WhatsApp Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={aidPhone}
                  onChange={(e) => setAidPhone(e.target.value)}
                  placeholder="e.g. 27821234567"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
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
                Publish Food Aid Point
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
