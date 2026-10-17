"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Radar as RadarIcon,
  Zap,
  Droplet,
  FileText,
  AlertTriangle,
  MapPin,
  RefreshCw,
  ChevronRight,
  Eye,
  EyeOff,
  Navigation,
  Plus,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";

interface IncidentMarker {
  id: string;
  type: "power" | "water" | "roads" | "civic" | "other" | "mesh";
  category?: "power" | "water" | "roads" | "civic";
  title: string;
  location: string;
  locationAddress?: string;
  severity: "high" | "medium" | "low" | "critical";
  time: string;
  latitude: number;
  longitude: number;
  coordinates: { x: number; y: number };
  description: string;
  status: string;
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

// Precise Haversine distance formula in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RadarPage() {
  const { streetAddress, location, filterByRadius, refreshLocation, loading: geoLoading } = useGeo();
  const [selectedIncident, setSelectedIncident] = useState<IncidentMarker | null>(null);
  const [scanning] = useState(true);
  const [liveIncidents, setLiveIncidents] = useState<IncidentMarker[]>([]);

  // Theme Accent Persistence
  const [accentColor, setAccentColor] = useState<string>("#38bdf8");

  // Filter Layers & Marker Visibility Toggle
  const [layers, setLayers] = useState({
    power: true,
    water: true,
    other: true,
  });
  const [markersVisible, setMarkersVisible] = useState(true);

  const userLat = location?.latitude ?? -29.6006;
  const userLng = location?.longitude ?? 30.3794;

  // Sync Accent Theme State & Global Variables
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

  // Simple Notification Dispatcher for Nearby Hazards
  const dispatchSimpleHazardNotifications = useCallback((incidents: IncidentMarker[]) => {
    try {
      const existingNotifs = JSON.parse(localStorage.getItem("resigrid_global_notifications") || "[]");
      let updated = [...existingNotifs];
      let hasChanges = false;

      incidents.forEach((item) => {
        const notifId = `radar-alert-${item.id}`;
        const alreadyExists = updated.some((n: any) => n.id === notifId);

        if (!alreadyExists) {
          let catTitle = "Community hazard reported nearby";
          if (item.type === "power") catTitle = "Power fault reported nearby";
          if (item.type === "water") catTitle = "Water issue reported nearby";

          const newNotif = {
            id: notifId,
            title: catTitle,
            description: `${item.title} at ${item.location}. Check radar feed for details.`,
            time: "Just now",
            type: "warning",
            category: item.type === "power" || item.type === "water" ? item.type : "civic",
          };

          updated = [newNotif, ...updated];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem("resigrid_global_notifications", JSON.stringify(updated));
      }
    } catch (e) {
      console.error("Error dispatching hazard notification:", e);
    }
  }, []);

  // Load Active Incident Reports with Industrial-Grade Radar Coordinate Mapping (10km Max Radius Scope)
  const loadReports = useCallback(() => {
    try {
      const saved = localStorage.getItem("resigrid_active_reports");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: IncidentMarker[] = parsed.map((item: any, idx: number) => {
            const lat = item.latitude ?? item.coords?.lat ?? (userLat + (idx * 0.003 - 0.0015));
            const lng = item.longitude ?? item.coords?.lng ?? (userLng + (idx * 0.003 - 0.0015));
            
            const distKm = calculateDistanceKm(userLat, userLng, lat, lng);
            
            // Industrial Precision Mapping: 10km radius maps exactly across a normalized ±0.095 degree delta
            // dx and dy calculate proportional offset from center (user location) scaled to fit the 100% grid view (0% to 100%)
            const latDiffKm = (lat - userLat) * 111; // ~111km per degree latitude
            const lngDiffKm = (lng - userLng) * 111 * Math.cos((userLat * Math.PI) / 180);

            // Scale factor: 10km radius boundary corresponds to 40% offset from center (50%)
            const maxRadiusKm = 10.0;
            const x = Math.min(92, Math.max(8, 50 + (lngDiffKm / maxRadiusKm) * 40));
            const y = Math.min(92, Math.max(8, 50 - (latDiffKm / maxRadiusKm) * 40));

            const cat = item.category || item.type || "other";
            const normalizedType = cat === "power" || cat === "water" ? cat : "other";

            return {
              id: item.id || `INC-${100 + idx}`,
              type: normalizedType as "power" | "water" | "other",
              category: cat,
              title: item.title || "Community Hazard Report",
              location: item.locationAddress || item.location || streetAddress,
              locationAddress: item.locationAddress || item.location,
              severity: item.priority ? (item.priority.toLowerCase() as any) : "high",
              time: item.time || "Recently",
              latitude: lat,
              longitude: lng,
              coordinates: { x, y },
              description: item.description || "No additional hazard details provided.",
              status: item.status || "Active",
              distanceKm: distKm,
              formattedDistance: item.formattedDistance || `${distKm.toFixed(1)} km`,
            };
          });

          setLiveIncidents(mapped);
          setSelectedIncident((prev) => {
            if (!prev) return mapped[0];
            return mapped.find((m) => m.id === prev.id) || mapped[0];
          });
        } else {
          setLiveIncidents([]);
        }
      } else {
        setLiveIncidents([]);
      }
    } catch (e) {
      console.error("Error reading active reports:", e);
    }
  }, [userLat, userLng, streetAddress]);

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 15000);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("resigrid_reports_dispatch");
      channel.onmessage = (e) => {
        if (e.data?.type === "NEW_REPORT" || e.data?.type === "STATUS_UPDATE") loadReports();
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "resigrid_active_reports") loadReports();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadReports]);

  // Filter Incidents within 10km Radius using Context Engine
  const nearbyIncidents = useMemo(() => {
    return filterByRadius(liveIncidents, 10.0);
  }, [filterByRadius, liveIncidents]);

  const displayIncidents = nearbyIncidents.length > 0 ? nearbyIncidents : liveIncidents;
  const filteredIncidents = displayIncidents.filter((inc) => layers[inc.type as keyof typeof layers]);

  // Dispatch Simple Notifications whenever Nearby Incidents update
  useEffect(() => {
    if (displayIncidents.length > 0) {
      dispatchSimpleHazardNotifications(displayIncidents);
    }
  }, [displayIncidents, dispatchSimpleHazardNotifications]);

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      
      {/* Ambient Environment */}
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1920px] px-3 pb-32 pt-4 sm:px-6 sm:space-y-6 lg:px-10 lg:pb-12 lg:pt-7 space-y-5">

        {/* HEADER */}
        <header className="glass-header flex items-center justify-between p-3.5 sm:p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="feature-icon shrink-0" style={{ color: accentColor }}>
              <RadarIcon className="w-5 h-5 animate-spin" style={{ animationDuration: "12s", color: accentColor }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white truncate">
                RADAR
              </h1>
              <p className="text-[9px] sm:text-[10px] tracking-wider text-muted mt-0.5 truncate">
                10KM AREA RADIUS
              </p>
            </div>
          </div>
        </header>

        {/* MAIN RADAR & DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 relative z-20">
          
          {/* RADAR MAP VIEW */}
          <div className="lg:col-span-2 glass-panel p-3.5 sm:p-6 flex flex-col justify-between relative overflow-hidden pointer-events-auto">
            <div className="panel-reflection pointer-events-none" />

            {/* Map Header / Filters */}
            <div className="flex items-center justify-between mb-2 sm:mb-3 z-20 flex-wrap gap-2">
              {/* Report Button Pill with Plus Icon */}
              <Link
                href="/civic"
                className="glass-panel px-3 py-2 flex items-center gap-1.5 text-xs font-semibold text-white transition-all cursor-pointer touch-manipulation pointer-events-auto z-30 hover:opacity-90 shrink-0"
                style={{
                  borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                }}
              >
                <Plus className="h-3.5 w-3.5" style={{ color: accentColor }} />
                <span className="inline">Report</span>
              </Link>

              {/* Layer Filters Toolbar */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setMarkersVisible((prev) => !prev)}
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    markersVisible ? "text-white bg-white/10" : "text-muted hover:text-white"
                  }`}
                  title={markersVisible ? "Hide Markers" : "Show Markers"}
                >
                  {markersVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <div className="w-px h-4 bg-white/10" />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleLayer("power")}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      layers.power ? "bg-amber-500/20 text-amber-300" : "text-muted hover:text-white"
                    }`}
                    title="Power Faults"
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleLayer("water")}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      layers.water ? "bg-cyan-500/20 text-cyan-300" : "text-muted hover:text-white"
                    }`}
                    title="Water Issues"
                  >
                    <Droplet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleLayer("other")}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      layers.other ? "bg-teal-500/20 text-teal-300" : "text-muted hover:text-white"
                    }`}
                    title="Civic & General Hazards"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* RADAR CANVAS */}
            <div className="relative w-full aspect-square sm:aspect-[16/10] bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center my-1 sm:my-2">
              
              {/* Dynamic Theme Grid dots */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
                  backgroundSize: "24px 24px"
                }}
              />
              
              {/* Radar Rings (Precise 10km Scale Indicators) */}
              <div className="absolute w-[360px] h-[360px] rounded-full border pointer-events-none" style={{ borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)` }} />
              <div className="absolute w-[240px] h-[240px] rounded-full border pointer-events-none" style={{ borderColor: `color-mix(in srgb, ${accentColor} 20%, transparent)` }} />
              <div className="absolute w-[120px] h-[120px] rounded-full border pointer-events-none" style={{ borderColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }} />
              <div className="absolute w-full h-[1px] pointer-events-none" style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }} />
              <div className="absolute h-full w-[1px] pointer-events-none" style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }} />

              {/* Center User Pin (Exact Current Location Core) */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center">
                <span className="absolute w-10 h-10 rounded-full animate-ping opacity-35" style={{ backgroundColor: accentColor }} />
                <div className="w-3.5 h-3.5 rounded-full bg-white ring-2 shadow-xl" style={{ borderColor: accentColor }} />
              </div>

              {/* Theme Rotating Sweep */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[360px] h-[360px] rounded-full relative animate-spin" style={{ animationDuration: "6s" }}>
                    <div 
                      className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left rounded-tr-full"
                      style={{
                        background: `linear-gradient(to bottom left, color-mix(in srgb, ${accentColor} 35%, transparent), transparent)`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Incident Markers */}
              {markersVisible && filteredIncidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                return (
                  <button
                    type="button"
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    style={{ top: `${incident.coordinates.y}%`, left: `${incident.coordinates.x}%` }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all z-30 group cursor-pointer"
                    title={incident.title}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-transform ${
                        incident.type === "water" ? "bg-cyan-400 text-cyan-950" :
                        incident.type === "power" ? "bg-amber-400 text-amber-950" :
                        "bg-teal-400 text-teal-950"
                      } ${isSelected ? "scale-125 ring-2 ring-white shadow-xl" : "hover:scale-110"}`}>
                        {incident.type === "power" && <Zap className="w-3.5 h-3.5" />}
                        {incident.type === "water" && <Droplet className="w-3.5 h-3.5" />}
                        {incident.type === "other" && <FileText className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* MAP FOOTER LOCATION & REFRESH ICON */}
            <div className="flex items-center justify-between text-xs text-muted mt-1 sm:mt-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Navigation className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />
                <span className="font-mono text-[10px] sm:text-[11px] text-white truncate">
                  {geoLoading ? "Locating..." : streetAddress}
                </span>
                <button
                  type="button"
                  onClick={() => refreshLocation()}
                  title="Refresh Location"
                  className="p-1 rounded-lg border border-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
                  style={{ color: accentColor }}
                >
                  <RefreshCw className={`h-3 w-3 ${geoLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ALL INCIDENT DETAILS PANEL */}
          <div className="glass-panel p-4 sm:p-6 flex flex-col justify-between relative pointer-events-auto">
            <div className="panel-reflection pointer-events-none" />

            <div className="w-full">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h2 className="text-xs font-semibold text-white tracking-wider">ALL INCIDENT DETAILS</h2>
                <span className="text-[10px] font-mono text-muted">{displayIncidents.length} Active (10km)</span>
              </div>

              {/* Inner Scroll Area */}
              <div 
                className="space-y-3 max-h-[380px] sm:max-h-[460px] overflow-y-auto pr-1"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {displayIncidents.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">No active hazards found within 10km.</p>
                ) : (
                  displayIncidents.map((incident) => {
                    const isSelected = selectedIncident?.id === incident.id;
                    return (
                      <div
                        key={incident.id}
                        onClick={() => setSelectedIncident(incident)}
                        className={`p-3 sm:p-3.5 bg-white/5 border rounded-xl space-y-2 transition-all cursor-pointer ${
                          isSelected ? "border-white/40 bg-white/[0.08]" : "border-white/10 hover:border-white/30"
                        }`}
                        style={{
                          borderColor: isSelected ? accentColor : undefined
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider truncate" style={{ color: accentColor }}>
                            {incident.category || incident.type} • {incident.id}
                          </span>
                          <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold shrink-0">
                            {incident.severity} priority
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-white">{incident.title}</h3>
                          <p className="text-[11px] sm:text-xs text-muted mt-1 leading-relaxed">{incident.description}</p>
                          <p className="text-[11px] sm:text-xs text-muted flex items-center gap-1 mt-2 truncate">
                            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                            <span className="truncate">{incident.location}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
