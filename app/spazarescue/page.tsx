"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Store,
  Utensils,
  Search,
  Plus,
  MapPin,
  Navigation,
  RefreshCw,
  MessageCircle,
  X,
  AlertTriangle,
  HeartHandshake,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";

interface SpazaFoodStore {
  id: string;
  shopName: string;
  ownerName: string;
  location: string;
  isOperating: boolean;
  hasDryStock: boolean;
  spoilageClearanceAlert?: string;
  foodEssentials: string[];
  contactPhone: string;
  latitude: number;
  longitude: number;
}

interface CommunityFoodAid {
  id: string;
  title: string;
  aidType: string;
  location: string;
  coordinator: string;
  description: string;
  operatingHours: string;
  contactPhone: string;
  spoilageClearanceAlert?: string;
  foodEssentials?: string[];
  latitude: number;
  longitude: number;
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
    location: "144 Victoria Road, PMB",
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
    location: "Block C, Section 4, Edendale",
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
    location: "Main Road, Edendale",
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
    aidType: "Soup Kitchen",
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
    aidType: "Community Pantry",
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
  const { streetAddress, location, refreshLocation, loading: geoLoading } = useGeo();

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
  const [activeCategory, setActiveCategory] = useState<"all" | "stores" | "aid">("all");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Modal State for Registering Spaza Store (Business Information)
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [storeAddress, setStoreAddress] = useState(streetAddress || "");
  const [shopPhone, setShopPhone] = useState("");

  // Modal State for Posting Food Aid / Soup Kitchen (Food Listings)
  const [isAidModalOpen, setIsAidModalOpen] = useState(false);
  const [aidListingChoice, setAidListingChoice] = useState<"relief" | "spaza">("relief");
  const [aidTitle, setAidTitle] = useState("");
  const [aidTypeOption, setAidTypeOption] = useState<string>("Soup Kitchen");
  const [customAidType, setCustomAidType] = useState<string>("");
  const [aidCoordinator, setAidCoordinator] = useState("");
  const [aidAddress, setAidAddress] = useState(streetAddress || "");
  const [aidHours, setAidHours] = useState("");
  const [aidDesc, setAidDesc] = useState("");
  const [aidPhone, setAidPhone] = useState("");
  const [spoilageAlert, setSpoilageAlert] = useState("");
  const [essentialsInput, setEssentialsInput] = useState("");

  useEffect(() => {
    if (streetAddress && !storeAddress) setStoreAddress(streetAddress);
    if (streetAddress && !aidAddress) setAidAddress(streetAddress);
  }, [streetAddress, storeAddress, aidAddress]);

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
    if (!shopName || !ownerName || !storeAddress) return;

    const newStore: SpazaFoodStore = {
      id: `SPAZA-${Math.floor(Math.random() * 8999 + 1000)}`,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      location: storeAddress.trim(),
      isOperating: true,
      hasDryStock: true,
      foodEssentials: ["Maize Meal", "Canned Goods", "Bread"],
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
    setStoreAddress(streetAddress || "");
    setShopPhone("");
  };

  const handlePostAid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aidTitle || !aidCoordinator || !aidAddress) return;
    if (aidListingChoice === "relief" && !aidDesc) return;

    const finalAidType = aidListingChoice === "spaza" 
      ? "Spaza Store" 
      : (aidTypeOption === "Other" ? (customAidType.trim() || "Community Aid") : aidTypeOption);

    const newAid: CommunityFoodAid = {
      id: `AID-${Math.floor(Math.random() * 8999 + 1000)}`,
      title: aidTitle.trim(),
      aidType: finalAidType,
      location: aidAddress.trim(),
      coordinator: aidCoordinator.trim(),
      description: aidListingChoice === "relief" ? aidDesc.trim() : `Spaza shop managed by ${aidCoordinator}`,
      operatingHours: aidListingChoice === "relief" ? (aidHours.trim() || "Daily: 9:00 AM - 3:00 PM") : "Open Daily",
      contactPhone: aidPhone.replace(/[^0-9]/g, "") || "27821234567",
      spoilageClearanceAlert: spoilageAlert.trim() || undefined,
      foodEssentials: essentialsInput ? essentialsInput.split(",").map((s) => s.trim()) : (aidListingChoice === "spaza" ? ["Maize Meal", "Canned Goods"] : undefined),
      latitude: location?.latitude ?? -29.6000,
      longitude: location?.longitude ?? 30.3800,
    };

    const updated = [newAid, ...foodAidList];
    setFoodAidList(updated);
    localStorage.setItem("resigrid_community_food_aid", JSON.stringify(updated));

    setIsAidModalOpen(false);
    setAidTitle("");
    setAidCoordinator("");
    setAidAddress(streetAddress || "");
    setAidHours("");
    setAidDesc("");
    setAidPhone("");
    setSpoilageAlert("");
    setEssentialsInput("");
    setCustomAidType("");
  };

  const handleContactWhatsApp = (targetPhone: string, storeName: string) => {
    const cleanNum = targetPhone || "27821234567";
    const msg = encodeURIComponent(`Hello, I am contacting via SpazaRescue regarding food stock & clearance at "${storeName}". Is this available?`);
    window.open(`https://wa.me/${cleanNum}?text=${msg}`, "_blank");
  };

  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      s.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.foodEssentials.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredAid = foodAidList.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.coordinator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showStores = activeCategory === "all" || activeCategory === "stores";
  const showAid = activeCategory === "all" || activeCategory === "aid";

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] pb-28 sm:pb-32 pt-3 sm:pt-4 px-2.5 sm:px-6 lg:px-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6 selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      
      {/* Ambient background */}
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
            <div className="feature-icon feature-food shrink-0" style={{ color: accentColor }}>
              <Store className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: accentColor }} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xs font-semibold tracking-[0.15em] sm:tracking-[0.18em] text-white sm:text-sm truncate">
                SPAZARESCUE™
              </h1>
              <p className="mt-0.5 truncate text-[8px] sm:text-[10px] tracking-[0.1em] text-muted">
                FOOD SECURITY, DRY-STOCK SPASAS, SPOILAGE CLEARANCE & COMMUNITY SOUP KITCHENS
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
              onClick={refreshLocation}
              title="Refresh Location"
              className="transition-colors shrink-0 cursor-pointer p-1 touch-manipulation z-30 hover:text-white"
              style={{ color: accentColor }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${geoLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Register Button Pill (Business Info Registration) */}
          <button
            type="button"
            onClick={() => setIsStoreModalOpen(true)}
            className="glass-panel px-3.5 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-white transition-all cursor-pointer touch-manipulation z-30 hover:opacity-90 shrink-0 rounded-xl whitespace-nowrap"
            style={{
              borderColor: `color-mix(in srgb, ${accentColor} 45%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
            }}
          >
            <Plus className="h-3.5 w-3.5" style={{ color: accentColor }} />
            <span className="inline">Register</span>
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="glass-panel p-3 sm:p-4 flex items-center gap-2 relative pointer-events-auto rounded-2xl">
        <div className="panel-reflection pointer-events-none" />

        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search maize meal, bread, soup kitchens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-muted focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Filter Modal Trigger Button */}
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className="px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90 shrink-0"
          style={{
            color: accentColor,
            borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
          }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span className="capitalize">{activeCategory === "all" ? "Filter" : activeCategory}</span>
        </button>

        {/* Post Aid / Listing Button */}
        <button
          type="button"
          onClick={() => setIsAidModalOpen(true)}
          className="px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95 shrink-0 whitespace-nowrap"
          style={{
            color: accentColor,
            borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
          }}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>

      {/* UNIFIED FOOD SECURITY & RELIEF FEED */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-base font-bold text-white flex items-center gap-2">
            <Store className="w-4 h-4 shrink-0" style={{ color: accentColor }} /> Community Food Security &amp; Relief Feed
          </h2>
          <span className="text-[11px] sm:text-xs text-muted font-mono">
            {(showStores ? filteredStores.length : 0) + (showAid ? filteredAid.length : 0)} active listings
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 relative z-10">
          {(!showStores || filteredStores.length === 0) && (!showAid || filteredAid.length === 0) ? (
            <div className="col-span-full glass-panel p-6 sm:p-8 text-center text-muted text-xs rounded-2xl">
              No food stores or community aid points found matching your criteria.
            </div>
          ) : (
            <>
              {/* Spaza Food Stores */}
              {showStores &&
                filteredStores.map((store) => (
                  <div
                    key={store.id}
                    className="glass-panel p-4 sm:p-5 flex flex-col justify-between group hover:border-white/30 transition-all relative pointer-events-auto rounded-2xl focus:outline-none"
                  >
                    <div className="panel-reflection pointer-events-none" />

                    <div>
                      <div className="flex items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3">
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-white transition-colors leading-snug">
                          {store.shopName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted mb-2 sm:mb-3 flex-wrap">
                        <span>Owner: <strong className="text-white">{store.ownerName}</strong></span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted mb-3 sm:mb-4 truncate">
                        <MapPin className="w-3 h-3 shrink-0" style={{ color: accentColor }} /> 
                        <span className="truncate">{store.location}</span>
                      </div>

                      {/* Spoilage Clearance Banner */}
                      {store.spoilageClearanceAlert && (
                        <div className="mb-3 sm:mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
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

                    <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-white/5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleContactWhatsApp(store.contactPhone, store.shopName)}
                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} /> <span>WhatsApp Store</span>
                      </button>
                    </div>
                  </div>
                ))}

              {/* Soup Kitchens & Food Aid / Spaza Feed Entries */}
              {showAid &&
                filteredAid.map((aid) => (
                  <div
                    key={aid.id}
                    className="glass-panel p-4 sm:p-5 flex flex-col justify-between group hover:border-white/30 transition-all relative pointer-events-auto rounded-2xl focus:outline-none"
                  >
                    <div className="panel-reflection pointer-events-none" />

                    <div>
                      <div className="flex items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-white transition-colors leading-snug">
                          {aid.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-xs text-muted mb-2 flex-wrap">
                        <span>{aid.aidType === "Spaza Store" ? "Owner" : "Coordinator"}: <strong className="text-white">{aid.coordinator}</strong></span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted mb-3 truncate">
                        <MapPin className="w-3 h-3 shrink-0" style={{ color: accentColor }} /> 
                        <span className="truncate">{aid.location}</span>
                      </div>

                      {aid.spoilageClearanceAlert && (
                        <div className="mb-3 sm:mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-white text-[11px] uppercase tracking-wider mb-0.5">
                              Daily Spoilage Clearance Deal
                            </strong>
                            <span>{aid.spoilageClearanceAlert}</span>
                          </div>
                        </div>
                      )}

                      {aid.aidType !== "Spaza Store" && (
                        <p className="text-xs text-white/80 bg-black/30 p-3 rounded-xl border border-white/5 leading-relaxed mb-3">
                          {aid.description}
                        </p>
                      )}

                      {aid.foodEssentials && aid.foodEssentials.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] uppercase text-muted tracking-wider block mb-1.5">
                            Available Food Essentials &amp; Dry-Stock:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {aid.foodEssentials.map((item, idx) => (
                              <span key={idx} className="text-[10px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white font-medium">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {aid.aidType !== "Spaza Store" && (
                        <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                          <Clock className="w-3.5 h-3.5 shrink-0" /> {aid.operatingHours}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-white/5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleContactWhatsApp(aid.contactPhone, aid.title)}
                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} /> <span>Coordinate via WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))}
            </>
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
                <SlidersHorizontal className="h-4 w-4 shrink-0" style={{ color: accentColor }} /> Filter Feed By Type
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
              {[
                { key: "all", label: "All Listings" },
                { key: "stores", label: "Spaza Food Stores" },
                { key: "aid", label: "Soup Kitchens & Food Aid" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => {
                    setActiveCategory(item.key as any);
                    setIsFilterModalOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer border ${
                    activeCategory === item.key
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-black/40 border-white/10 text-muted hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REGISTER SPAZA STORE MODAL (BUSINESS INFORMATION) */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 pointer-events-auto overflow-y-auto">
          <div
            className="glass-panel w-full max-w-md p-4 sm:p-6 relative space-y-3.5 pointer-events-auto my-auto max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Store className="h-4 w-4 shrink-0" style={{ color: accentColor }} /> Register Business Information
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

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Physical Location Address *</label>
                <input
                  type="text"
                  required
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="e.g. 144 Victoria Road, PMB"
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
                Publish Business Information
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POST FOOD AID / KITCHEN MODAL (FOOD LISTINGS) - COMPACT & MINIMAL */}
      {isAidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 pointer-events-auto overflow-y-auto">
          <div
            className="glass-panel w-full max-w-sm p-4 sm:p-5 relative space-y-3 pointer-events-auto my-auto max-h-[85vh] overflow-y-auto rounded-2xl"
            style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 relative z-20">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} /> Post Food Aid or Spaza Listing
              </h3>
              <button
                type="button"
                onClick={() => setIsAidModalOpen(false)}
                className="text-muted hover:text-white cursor-pointer relative z-30 p-1"
              >
                <X className="h-3.5 w-3.5 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handlePostAid} className="space-y-2 relative z-25 text-xs">
              <div>
                <label className="text-[10px] sm:text-[11px] text-muted block mb-1">Select Type of Listing *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAidListingChoice("relief")}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      aidListingChoice === "relief"
                        ? "text-white"
                        : "bg-black/40 border-white/10 text-muted hover:text-white"
                    }`}
                    style={
                      aidListingChoice === "relief"
                        ? {
                            borderColor: `color-mix(in srgb, ${accentColor} 50%, transparent)`,
                            backgroundColor: `color-mix(in srgb, ${accentColor} 25%, transparent)`,
                            color: accentColor,
                          }
                        : undefined
                    }
                  >
                    <Utensils className="w-3 h-3 shrink-0" /> Soup Kitchen / Pantry
                  </button>

                  <button
                    type="button"
                    onClick={() => setAidListingChoice("spaza")}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      aidListingChoice === "spaza"
                        ? "text-white"
                        : "bg-black/40 border-white/10 text-muted hover:text-white"
                    }`}
                    style={
                      aidListingChoice === "spaza"
                        ? {
                            borderColor: `color-mix(in srgb, ${accentColor} 50%, transparent)`,
                            backgroundColor: `color-mix(in srgb, ${accentColor} 25%, transparent)`,
                            color: accentColor,
                          }
                        : undefined
                    }
                  >
                    <Store className="w-3 h-3 shrink-0" /> Spaza Food Store
                  </button>
                </div>
              </div>

              {aidListingChoice === "relief" ? (
                <>
                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Title / Organisation Name *</label>
                    <input
                      type="text"
                      required
                      value={aidTitle}
                      onChange={(e) => setAidTitle(e.target.value)}
                      placeholder="e.g. Sunset Ridge Soup Kitchen"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Aid Type *</label>
                    <select
                      value={aidTypeOption}
                      onChange={(e) => setAidTypeOption(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer mb-1.5"
                    >
                      <option value="Soup Kitchen" className="bg-neutral-900 text-white">Soup Kitchen</option>
                      <option value="Community Pantry" className="bg-neutral-900 text-white">Community Pantry</option>
                      <option value="Bulk Food Drop" className="bg-neutral-900 text-white">Bulk Food Drop</option>
                      <option value="Other" className="bg-neutral-900 text-white">Other (Custom)</option>
                    </select>

                    {aidTypeOption === "Other" && (
                      <input
                        type="text"
                        required
                        value={customAidType}
                        onChange={(e) => setCustomAidType(e.target.value)}
                        placeholder="Enter custom aid type..."
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Coordinator / Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={aidCoordinator}
                      onChange={(e) => setAidCoordinator(e.target.value)}
                      placeholder="e.g. Pastor Thabo Mokoena"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Physical Location Address *</label>
                    <input
                      type="text"
                      required
                      value={aidAddress}
                      onChange={(e) => setAidAddress(e.target.value)}
                      placeholder="e.g. Sector 4 Community Hall"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Operating Hours / Schedule *</label>
                    <input
                      type="text"
                      required
                      value={aidHours}
                      onChange={(e) => setAidHours(e.target.value)}
                      placeholder="e.g. Daily: 12:00 PM - 2:00 PM"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Description &amp; Requirements *</label>
                    <textarea
                      required
                      rows={2}
                      value={aidDesc}
                      onChange={(e) => setAidDesc(e.target.value)}
                      placeholder="Describe meals served or requirements..."
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Spaza / Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={aidTitle}
                      onChange={(e) => setAidTitle(e.target.value)}
                      placeholder="e.g. Mam' Rose Groceries"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Owner / Manager Full Name *</label>
                    <input
                      type="text"
                      required
                      value={aidCoordinator}
                      onChange={(e) => setAidCoordinator(e.target.value)}
                      placeholder="e.g. Rose Dlamini"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Physical Location Address *</label>
                    <input
                      type="text"
                      required
                      value={aidAddress}
                      onChange={(e) => setAidAddress(e.target.value)}
                      placeholder="e.g. 144 Victoria Road, PMB"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Daily Spoilage Clearance Deal (Optional)</label>
                    <input
                      type="text"
                      value={spoilageAlert}
                      onChange={(e) => setSpoilageAlert(e.target.value)}
                      placeholder="e.g. Fresh milk & bread 50% off"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-0.5">Available Food Essentials (comma-separated) *</label>
                    <input
                      type="text"
                      required
                      value={essentialsInput}
                      onChange={(e) => setEssentialsInput(e.target.value)}
                      placeholder="Maize Meal, Canned Pilchards, Bread"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] text-muted block mb-0.5">WhatsApp Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={aidPhone}
                  onChange={(e) => setAidPhone(e.target.value)}
                  placeholder="e.g. 27821234567"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-full border text-xs font-semibold transition-all mt-2 cursor-pointer hover:opacity-95 shadow-md"
                style={{
                  color: accentColor,
                  borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                }}
              >
                Publish Listing
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
