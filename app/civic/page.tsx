"use client";

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
} from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";

interface ReportItem {
  id: string;
  category: "water" | "power" | "roads" | "other";
  title: string;
  description: string;
  locationAddress: string;
  status: "Auto-Dispatched" | "Pending Review" | "Resolved";
  time: string;
  ward?: string;
  priority?: "High" | "Medium" | "Low" | "Critical";
  reporterName?: string;
  reporterPhone?: string;
  assignedDepotUnit?: string;
  estimatedFixTime?: string;
  coords?: { lat: number; lng: number };
}

const DEFAULT_REPORTS: ReportItem[] = [
  {
    id: "RPT-101",
    category: "water",
    title: "Burst Water Main",
    description: "Severe leak flooding roadway and affecting water pressure.",
    locationAddress: "142 Chief Albert Luthuli St, Pietermaritzburg",
    ward: "Ward 26 (CBD / Central)",
    priority: "Critical",
    status: "Auto-Dispatched",
    time: "Today, 10:14 SAST",
    reporterName: "Raihaan Mahomed",
    reporterPhone: "+27 82 123 4567",
    assignedDepotUnit: "Water Rapid Response Crew #4",
    estimatedFixTime: "4 Hours",
    coords: { lat: -29.6006, lng: 30.3794 },
  },
  {
    id: "RPT-102",
    category: "power",
    title: "Substation Transformer Trip",
    description: "Total power blackout across Sector 3 grid block.",
    locationAddress: "88 Dr Chota Motala Rd, Raisethorpe",
    ward: "Ward 28 (Raisethorpe / Newholme)",
    priority: "High",
    status: "Pending Review",
    time: "Today, 09:48 SAST",
    reporterName: "Sipho Dlamini",
    reporterPhone: "+27 83 987 6543",
    assignedDepotUnit: "Electricity Depot - Unit B",
    estimatedFixTime: "6 Hours",
    coords: { lat: -29.5823, lng: 30.4021 },
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

export default function CivicAIPage() {
  const { location, loading: geoLoading, refreshLocation } = useUserLocation();

  // Location & Address States
  const [streetAddress, setStreetAddress] = useState<string>("Locating street...");
  const [useCustomAddress, setUseCustomAddress] = useState<boolean>(false);
  const [customAddress, setCustomAddress] = useState<string>("");
  const [isRefreshingGeo, setIsRefreshingGeo] = useState<boolean>(false);

  // Full Municipal Fields Form State
  const [reportTitle, setReportTitle] = useState("");
  const [category, setCategory] = useState<"water" | "power" | "roads" | "other">("water");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [selectedWard, setSelectedWard] = useState("Ward 26 (CBD / Central)");
  const [priority] = useState<"High" | "Medium" | "Low" | "Critical">("High");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Area Reports Feed State
  const [reports, setReports] = useState<ReportItem[]>(DEFAULT_REPORTS);

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

  // Load Initial Persisted Reports & Set Up App-Wide Synchronized Listeners
  useEffect(() => {
    try {
      const saved = localStorage.getItem("resigrid_active_reports");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReports(parsed);
        }
      } else {
        localStorage.setItem("resigrid_active_reports", JSON.stringify(DEFAULT_REPORTS));
      }
    } catch (e) {
      console.error("Storage read error:", e);
    }

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");

      broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};

        if (type === "NEW_REPORT" && payload) {
          setReports((prev) => {
            const exists = prev.some((r) => r.id === payload.id);
            if (exists) return prev;
            const updated = [payload, ...prev];
            localStorage.setItem("resigrid_active_reports", JSON.stringify(updated));
            return updated;
          });
        }

        if (type === "STATUS_UPDATE" && payload?.id) {
          setReports((prev) => {
            const updated = prev.map((r) =>
              r.id === payload.id ? { ...r, status: payload.status } : r
            );
            localStorage.setItem("resigrid_active_reports", JSON.stringify(updated));
            return updated;
          });
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "resigrid_active_reports" && e.newValue) {
        try {
          setReports(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Storage sync parse error:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener("storage", handleStorageChange);
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
  const handleCategorySelect = (cat: "water" | "power" | "roads" | "other", e: React.SyntheticEvent) => {
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

    const payload: ReportItem = {
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

      setReports((prev) => {
        const updated = [payload, ...prev];
        localStorage.setItem("resigrid_active_reports", JSON.stringify(updated));
        return updated;
      });

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("resigrid_reports_dispatch");
        bc.postMessage({ type: "NEW_REPORT", payload });
        bc.close();
      }

      setReportTitle("");
      setDescription("");
      setReporterName("");
      setReporterPhone("");
      if (useCustomAddress) setCustomAddress("");
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

      <div className="relative z-10 mx-auto w-full max-w-[1920px] space-y-4 px-3 pb-24 pt-4 sm:space-y-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">
        
        {/* TOP HEADER & INDEPENDENT OUTSIDE LOCATION PILL */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <header className="glass-panel p-3.5 sm:p-4 flex items-center gap-3">
            <div className="feature-icon feature-civic shrink-0" style={{ color: "var(--accent)" }}>
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "var(--accent)" }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm">
                INCIDENT REPORTING
              </h1>
              <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                DIRECT MUNICIPAL & NEIGHBORHOOD FAULT BROADCAST
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
              {geoLoading || isRefreshingGeo ? (
                <span className="text-[10px] sm:text-xs" style={{ color: "var(--accent)" }}>LOCATING STREET...</span>
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

        {/* MAIN LAYOUT GRID */}
        <form onSubmit={handleSubmitReport} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative z-20">
          
          {/* LEFT COLUMN: INDIVIDUAL FROSTED FORM TILES */}
          <div className="lg:col-span-1 space-y-3.5">

            {/* Category Selection Tile */}
            <div className="glass-panel p-4 space-y-2">
              <label className="text-[11px] sm:text-xs font-medium text-muted block">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {(["water", "power", "roads", "other"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={(e) => handleCategorySelect(cat, e)}
                    onTouchEnd={(e) => handleCategorySelect(cat, e)}
                    className={`py-2 px-2.5 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider border transition-all flex items-center gap-1.5 justify-center cursor-pointer touch-manipulation active:scale-95 ${
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
                    {cat === "water" && <Droplet className="h-3.5 w-3.5 shrink-0 pointer-events-none" />}
                    {cat === "power" && <Zap className="h-3.5 w-3.5 shrink-0 pointer-events-none" />}
                    {cat === "roads" && <AlertTriangle className="h-3.5 w-3.5 shrink-0 pointer-events-none" />}
                    {cat === "other" && <FileText className="h-3.5 w-3.5 shrink-0 pointer-events-none" />}
                    <span className="pointer-events-none">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reporter Information Tile */}
            <div className="glass-panel p-4 space-y-3">
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors pointer-events-auto"
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors pointer-events-auto"
                />
              </div>
            </div>

            {/* Municipal Ward Tile */}
            <div className="glass-panel p-4">
              <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                <Building className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Municipal Ward
              </label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors cursor-pointer pointer-events-auto"
              >
                <option value="Ward 26 (CBD / Central)" className="bg-neutral-900 text-white">Ward 26 (CBD / Central)</option>
                <option value="Ward 28 (Raisethorpe / Newholme)" className="bg-neutral-900 text-white">Ward 28 (Raisethorpe / Newholme)</option>
                <option value="Ward 30 (Northdale / Woodlands)" className="bg-neutral-900 text-white">Ward 30 (Northdale / Woodlands)</option>
                <option value="Ward 33 (Scottsville / University)" className="bg-neutral-900 text-white">Ward 33 (Scottsville / University)</option>
              </select>
            </div>

            {/* Issue Details Tile */}
            <div className="glass-panel p-4 space-y-3">
              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Issue Headline</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Burst Water Pipe, Substation Outage..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Details & Impact</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide additional details regarding the incident..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors resize-none pointer-events-auto"
                />
              </div>
            </div>

            {/* Location Source Tile */}
            <div className="glass-panel p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] sm:text-[11px] font-medium text-muted block">Precise Location Source</label>
                <button
                  type="button"
                  onClick={handleToggleAddressSource}
                  onTouchEnd={handleToggleAddressSource}
                  className="text-[8px] sm:text-[9px] hover:opacity-80 flex items-center gap-1 font-medium transition-colors cursor-pointer touch-manipulation pointer-events-auto"
                  style={{ color: "var(--accent)" }}
                >
                  {useCustomAddress ? <MapPin className="h-2 w-2 shrink-0 pointer-events-none" /> : <Edit3 className="h-2 w-2 shrink-0 pointer-events-none" />}
                  <span className="pointer-events-none">{useCustomAddress ? "Use Auto GPS" : "Enter Exact Address"}</span>
                </button>
              </div>

              {useCustomAddress ? (
                <input
                  type="text"
                  required
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="e.g. 142 Chief Albert Luthuli St, Scottsville..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors pointer-events-auto"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
                    <div className="text-[11px] overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="block text-[9px] uppercase font-mono" style={{ color: "color-mix(in srgb, var(--accent) 80%, white)" }}>Auto GPS Address:</span>
                      <span className="text-white font-medium">{streetAddress}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleManualRefreshLocation}
                    onTouchEnd={handleManualRefreshLocation}
                    className="transition-colors shrink-0 cursor-pointer touch-manipulation pointer-events-auto hover:opacity-80"
                    style={{ color: "var(--accent)" }}
                    title="Re-sync location"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingGeo ? "animate-spin" : ""}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Action Submit Tile */}
            <div className="glass-panel p-2 mb-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer touch-manipulation pointer-events-auto hover:opacity-90"
                style={{
                  color: "var(--accent)",
                  borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                  boxShadow: "0 0 20px color-mix(in srgb, var(--accent) 15%, transparent)"
                }}
              >
                <Send className="h-4 w-4 shrink-0 pointer-events-none" style={{ color: "var(--accent)" }} />
                <span className="pointer-events-none">{isSubmitting ? "Dispatching..." : "Dispatch Automated Report"}</span>
              </button>
            </div>

            {/* Divider Line Between Dispatch Button & Active Area Reports */}
            <div className="my-5 border-t border-white/10 w-full" />

          </div>

          {/* RIGHT COLUMN: ACTIVE REPORTS STREAM IN INDIVIDUAL FROSTED PANELS */}
          <div className="lg:col-span-2 space-y-3.5 pt-2 lg:pt-0">
            
            {/* Reports Stream Title (Clock Icon Removed) */}
            <div className="flex items-center gap-2 px-1 pb-1">
              <h2 className="text-sm sm:text-base font-semibold text-white">
                Active Area Reports & Dispatches
              </h2>
            </div>

            {/* Individual Report Item Tiles */}
            <div className="space-y-3">
              {reports.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel p-4 space-y-2.5 transition-all pointer-events-auto"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <span 
                        className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border"
                        style={{
                          color: "var(--accent)",
                          backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                          borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
                        }}
                      >
                        {item.category}
                      </span>
                      <span className="text-xs font-mono text-muted">{item.id}</span>
                      {item.ward && (
                        <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white font-medium">
                          {item.ward}
                        </span>
                      )}
                    </div>

                    <span 
                      className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full border"
                      style={{
                        color: "var(--accent)",
                        backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> {item.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">{item.title}</h3>
                    <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-muted gap-1.5 sm:gap-2">
                    <span className="flex items-center gap-1 font-mono min-w-0 truncate" style={{ color: "color-mix(in srgb, var(--accent) 85%, white)" }}>
                      <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} />
                      <span className="truncate">{item.locationAddress}</span>
                    </span>
                    <span className="shrink-0 font-mono">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </form>

      </div>
    </main>
  );
}

