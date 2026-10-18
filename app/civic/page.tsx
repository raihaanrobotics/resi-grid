"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Droplet,
  FileText,
  MapPin,
  Navigation,
  RefreshCw,
  Send,
  Zap,
  Edit3,
  User,
  Phone,
  Building,
  ShieldAlert,
  Hash,
  Home,
} from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

export default function CivicAIPage() {
  const { location, loading: geoLoading, refreshLocation } = useUserLocation();

  // Location & Address States
  const [streetAddress, setStreetAddress] = useState<string>("Locating street...");
  const [useCustomAddress, setUseCustomAddress] = useState<boolean>(false);
  const [customAddress, setCustomAddress] = useState<string>("");
  const [isRefreshingGeo, setIsRefreshingGeo] = useState<boolean>(false);

  // Full Municipal Real Logging Form State (Detailed Municipality Requirements)
  const [reportTitle, setReportTitle] = useState("");
  const [category, setCategory] = useState<"water" | "power" | "other">("water");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [standNumber, setStandNumber] = useState("");
  const [selectedWard, setSelectedWard] = useState("Ward 26 (CBD / Central)");
  const [priority] = useState<"High" | "Medium" | "Low" | "Critical">("High");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Bulletproof Theme Persistence & Profile Auto-Fill on Mount
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

    // Auto-fill profile data & municipal account details if available
    try {
      const savedProfile = localStorage.getItem("resigrid_user_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.fullName) setReporterName(parsed.fullName);
        if (parsed.phone) setReporterPhone(parsed.phone);
        if (parsed.selectedWard) setSelectedWard(parsed.selectedWard);
        if (parsed.accountNumber) setAccountNumber(parsed.accountNumber);
        if (parsed.standNumber) setStandNumber(parsed.standNumber);
        if (parsed.streetAddress) {
          setCustomAddress(parsed.streetAddress);
        }
      }
    } catch (e) {
      console.error("Error reading profile auto-fill:", e);
    }

    return () => {
      window.removeEventListener("resigrid_theme_change", handleThemeEvent);
    };
  }, []);

  // Reverse Geocoding Fetch with High Precision
  const fetchAddressOnce = async (lat: number, lng: number) => {
    setIsRefreshingGeo(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data.address) {
        const num =
          data.address.house_number ||
          data.address.building ||
          data.address.house_name ||
          "";
        const road = data.address.road || data.address.pedestrian || "";
        const suburb =
          data.address.suburb ||
          data.address.neighbourhood ||
          data.address.city ||
          "";

        const streetLine = [num, road].filter(Boolean).join(" ");
        const formatted = [streetLine, suburb].filter(Boolean).join(", ");

        setStreetAddress(formatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      setStreetAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsRefreshingGeo(false);
    }
  };

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      fetchAddressOnce(location.latitude, location.longitude);
    }
  }, [location?.latitude, location?.longitude]);

  // Manual GPS Re-sync Handler
  const handleManualRefreshLocation = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    refreshLocation();
    if (location?.latitude && location?.longitude) {
      fetchAddressOnce(location.latitude, location.longitude);
    }
  };

  // Category Toggle Action
  const handleCategorySelect = (cat: "water" | "power" | "other", e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCategory(cat);
  };

  // Address Source Toggle Action
  const handleToggleAddressSource = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUseCustomAddress((prev) => !prev);
  };

  // Real Dispatch Webhook Submission Handler with Full Municipal Metadata
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !description.trim() || !reporterName.trim() || !reporterPhone.trim()) return;

    setIsSubmitting(true);

    const activeAddress = useCustomAddress && customAddress.trim()
      ? customAddress.trim()
      : streetAddress !== "Locating street..."
      ? streetAddress
      : "Current GPS Position";

    const timestamp = new Date().toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const payload = {
      id: `RPT-${Math.floor(100 + Math.random() * 900)}`,
      category,
      title: reportTitle.trim(),
      description: description.trim(),
      locationAddress: activeAddress,
      ward: selectedWard,
      priority,
      status: "Auto-Dispatched",
      time: `Today, ${timestamp} SAST`,
      reporterName: reporterName.trim(),
      reporterPhone: reporterPhone.trim(),
      accountNumber: accountNumber.trim(),
      standNumber: standNumber.trim(),
      assignedDepotUnit: "Depot Rapid Response Queue",
      estimatedFixTime: "Pending Triage",
      coords: location ? { lat: location.latitude, lng: location.longitude } : undefined,
    };

    try {
      await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      // Save to active reports storage so radar and other modules sync
      try {
        const existing = localStorage.getItem("resigrid_active_reports");
        const parsed = existing ? JSON.parse(existing) : [];
        const updated = [payload, ...parsed];
        localStorage.setItem("resigrid_active_reports", JSON.stringify(updated));
      } catch (err) {
        console.error("Storage write error:", err);
      }

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("resigrid_reports_dispatch");
        bc.postMessage({ type: "NEW_REPORT", payload });
        bc.close();
      }

      setReportTitle("");
      setDescription("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="resigrid-shell min-h-screen w-full overflow-x-hidden text-[var(--text)] selection:bg-[var(--accent)]/30 selection:text-[var(--accent)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Dynamic Ambient Blur Background Orbs */}
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1920px] space-y-4 px-3 pb-32 pt-4 sm:space-y-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">
        
        {/* UNIFIED TOP COMMAND PANEL CONTAINER */}
        <div 
          className="glass-panel p-3.5 sm:p-5 relative overflow-hidden space-y-3 pointer-events-auto border"
          style={{
            borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--accent) 6%, transparent)",
          }}
        >
          <div className="panel-reflection pointer-events-none" />

          {/* Top Row: Header Branding */}
          <div className="flex items-center justify-between relative z-10">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <div className="feature-icon feature-civic shrink-0" style={{ color: "var(--accent)" }}>
                <FileText className="h-[18px] w-[18px]" style={{ color: "var(--accent)" }} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm truncate">
                  INCIDENT REPORTING
                </h1>
                <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                  DIRECT MUNICIPAL ISSUE LOGGING
                </p>
              </div>
            </Link>
          </div>

          {/* Bottom Row: Location Pill (Full Width) */}
          <div className="flex items-center gap-2 relative z-20 pt-1">
            <div 
              className="glass-panel px-3 py-2 flex items-center justify-between gap-2 flex-1 min-w-0 rounded-xl"
              style={{
                borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Navigation className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                {geoLoading || isRefreshingGeo ? (
                  <span className="text-[10px] sm:text-xs truncate" style={{ color: "var(--accent)" }}>LOCATING STREET...</span>
                ) : (
                  <span className="truncate font-semibold text-white text-[10px] sm:text-xs">
                    {useCustomAddress && customAddress.trim() ? customAddress : streetAddress}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleManualRefreshLocation}
                onTouchEnd={handleManualRefreshLocation}
                title="Refresh Location"
                className="transition-colors shrink-0 cursor-pointer p-1 touch-manipulation z-30 hover:text-white"
                style={{ color: "var(--accent)" }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingGeo ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* SUCCESS NOTIFICATION TOAST */}
        {submitSuccess && (
          <div className="p-3 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-medium flex items-center gap-2 animate-fadeIn relative z-20 w-full">
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} /> Report successfully dispatched to municipal rapid response queue.
          </div>
        )}

        {/* STANDALONE INTRO TEXT */}
        <div className="px-1 text-xs sm:text-sm text-muted leading-relaxed relative z-20">
          Complete the form to log official fault reference tickets with your municipal account and stand details.
        </div>

        {/* MAIN FORM CONTAINER */}
        <form onSubmit={handleSubmitReport} className="space-y-4 relative z-20 w-full">

          {/* Category Selection Tile */}
          <div className="glass-panel p-4 sm:p-6 space-y-2.5 w-full">
            <div className="panel-reflection pointer-events-none" />
            <label className="text-[11px] sm:text-xs font-medium text-muted block">Select Incident Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(["water", "power", "other"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={(e) => handleCategorySelect(cat, e)}
                  onTouchEnd={(e) => handleCategorySelect(cat, e)}
                  className={`py-2.5 px-3 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all flex items-center gap-2 justify-center cursor-pointer touch-manipulation active:scale-95 ${
                    category === cat
                      ? "shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_25%,transparent)]"
                      : "bg-white/5 border-white/10 text-muted hover:text-white"
                  }`}
                  style={
                    category === cat
                      ? {
                          backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                          color: "var(--accent)",
                          borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                        }
                      : {}
                  }
                >
                  {cat === "water" && <Droplet className="h-4 w-4 shrink-0 pointer-events-none" />}
                  {cat === "power" && <Zap className="h-4 w-4 shrink-0 pointer-events-none" />}
                  {cat === "other" && <FileText className="h-4 w-4 shrink-0 pointer-events-none" />}
                  <span className="pointer-events-none">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reporter Information & Ward Tile */}
          <div className="glass-panel p-4 sm:p-6 space-y-4 w-full">
            <div className="panel-reflection pointer-events-none" />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <User className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <Phone className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Contact No.
                </label>
                <input
                  type="tel"
                  required
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="e.g. +27 82 123 4567"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <Building className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Municipal Ward
                </label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors cursor-pointer pointer-events-auto"
                >
                  <option value="Ward 26 (CBD / Central)" className="bg-neutral-900 text-white">Ward 26 (CBD / Central)</option>
                  <option value="Ward 28 (Raisethorpe / Newholme)" className="bg-neutral-900 text-white">Ward 28 (Raisethorpe / Newholme)</option>
                  <option value="Ward 30 (Northdale / Woodlands)" className="bg-neutral-900 text-white">Ward 30 (Northdale / Woodlands)</option>
                  <option value="Ward 33 (Scottsville / University)" className="bg-neutral-900 text-white">Ward 33 (Scottsville / University)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Official Municipal Account & Property Details Tile */}
          <div className="glass-panel p-4 sm:p-6 space-y-4 w-full">
            <div className="panel-reflection pointer-events-none" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <Hash className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Municipal Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 800459201"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <Home className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Stand / Erf Number
                </label>
                <input
                  type="text"
                  value={standNumber}
                  onChange={(e) => setStandNumber(e.target.value)}
                  placeholder="e.g. Erf 1452 Scottsville"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto"
                />
              </div>
            </div>
          </div>

          {/* Issue Details Tile */}
          <div className="glass-panel p-4 sm:p-6 space-y-4 w-full">
            <div className="panel-reflection pointer-events-none" />

            <div>
              <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Issue Headline</label>
              <input
                type="text"
                required
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. Burst Water Pipe, Substation Outage..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto"
              />
            </div>

            <div>
              <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Details & Impact</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional details regarding the incident..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/35 transition-colors resize-none pointer-events-auto"
              />
            </div>
          </div>

          {/* Location Source Tile */}
          <div className="glass-panel p-4 sm:p-6 space-y-2.5 w-full">
            <div className="panel-reflection pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-medium text-muted block">Precise Location Source</label>
              <button
                type="button"
                onClick={handleToggleAddressSource}
                onTouchEnd={handleToggleAddressSource}
                className="text-[9px] sm:text-[10px] hover:opacity-80 flex items-center gap-1 font-medium transition-colors cursor-pointer touch-manipulation pointer-events-auto"
                style={{ color: "var(--accent)" }}
              >
                {useCustomAddress ? <MapPin className="h-3 w-3 shrink-0 pointer-events-none" /> : <Edit3 className="h-3 w-3 shrink-0 pointer-events-none" />}
                <span className="pointer-events-none">{useCustomAddress ? "Use Auto GPS" : "Enter exact address"}</span>
              </button>
            </div>

            {useCustomAddress ? (
              <input
                type="text"
                required
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="e.g. 142 Chief Albert Luthuli St, Scottsville..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto"
              />
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-black/30 border border-white/5 rounded-xl">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
                  <div className="text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="block text-[9px] uppercase font-mono" style={{ color: "color-mix(in srgb, var(--accent) 80%, white)" }}>Auto GPS Address:</span>
                    <span className="text-white font-medium">{streetAddress}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualRefreshLocation}
                  onTouchEnd={handleManualRefreshLocation}
                  className="transition-colors shrink-0 cursor-pointer touch-manipulation pointer-events-auto hover:opacity-80 p-1"
                  style={{ color: "var(--accent)" }}
                  title="Re-sync location"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingGeo ? "animate-spin" : ""}`} />
                </button>
              </div>
            )}
          </div>

          {/* Action Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer touch-manipulation pointer-events-auto hover:opacity-90 shadow-lg"
              style={{
                color: "var(--accent)",
                borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                boxShadow: "0 0 25px color-mix(in srgb, var(--accent) 20%, transparent)"
              }}
            >
              <Send className="h-4 w-4 shrink-0 pointer-events-none" style={{ color: "var(--accent)" }} />
              <span className="pointer-events-none">{isSubmitting ? "Dispatching..." : "Dispatch Automated Report"}</span>
            </button>
          </div>

        </form>

      </div>
    </main>
  );
}
