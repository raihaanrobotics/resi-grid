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
  Crosshair,
  ShieldAlert,
  Activity,
  Navigation,
} from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { filterWithinRadius } from "@/lib/geoUtils";

interface IncidentMarker {
  id: string;
  type: "power" | "water" | "roads" | "other" | "mesh";
  title: string;
  location: string;
  severity: "high" | "medium" | "low";
  time: string;
  latitude: number;
  longitude: number;
  coordinates: { x: number; y: number };
  description: string;
  status: string;
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

// Haversine formula for distance calculation in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  const { location, loading: geoLoading, refreshLocation } = useUserLocation();
  const [selectedIncident, setSelectedIncident] = useState<IncidentMarker | null>(null);
  const [scanning] = useState(true);
  const [liveIncidents, setLiveIncidents] = useState<IncidentMarker[]>([]);

  // Reverse Geocoded Street Address State
  const [userStreetAddress, setUserStreetAddress] = useState<string>("Locating...");
  const [isRefreshingAddress, setIsRefreshingAddress] = useState<boolean>(false);

  // Active Map Filter Layers & Visibility Toggle
  const [layers, setLayers] = useState({
    power: true,
    water: true,
    roads: true,
    other: true,
  });
  const [markersVisible, setMarkersVisible] = useState(true);

  const userLat = location?.latitude || -29.6006;
  const userLng = location?.longitude || 30.3794;

  // Theme Persistence on Mount
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

  // Fetch Street Address using Nominatim
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    setIsRefreshingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data.address) {
        const road = data.address.road || data.address.pedestrian || data.address.suburb || "";
        const city = data.address.city || data.address.town || data.address.municipality || "Pietermaritzburg";
        setUserStreetAddress([road, city].filter(Boolean).join(", ") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } else {
        setUserStreetAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch {
      setUserStreetAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsRefreshingAddress(false);
    }
  }, []);

  useEffect(() => {
    if (userLat && userLng) {
      fetchAddress(userLat, userLng);
    }
  }, [userLat, userLng, fetchAddress]);

  // Load Reports from LocalStorage
  const loadReports = useCallback(() => {
    try {
      const saved = localStorage.getItem("resigrid_active_reports");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: IncidentMarker[] = parsed.map((item: any, idx: number) => {
            const lat = item.coords?.lat ?? (userLat + (idx * 0.003 - 0.001));
            const lng = item.coords?.lng ?? (userLng + (idx * 0.003 - 0.001));
            
            const distanceKm = calculateDistance(userLat, userLng, lat, lng);
            const latDiffKm = (lat - userLat) * 111;
            const lngDiffKm = (lng - userLng) * 111 * Math.cos((userLat * Math.PI) / 180);

            const x = Math.min(88, Math.max(12, 50 + (lngDiffKm / 10) * 38));
            const y = Math.min(88, Math.max(12, 50 - (latDiffKm / 10) * 38));

            return {
              id: item.id || `INC-${100 + idx}`,
              type: item.category || "other",
              title: item.title || "Hazard Report",
              location: item.locationAddress || "Local Area",
              severity: item.priority ? item.priority.toLowerCase() : "high",
              time: item.time || "Recently",
              latitude: lat,
              longitude: lng,
              coordinates: { x, y },
              description: item.description || "No description provided.",
              status: item.status || "Active",
              distanceKm,
            };
          });

          setLiveIncidents(mapped);
          setSelectedIncident((prev) => {
            if (!prev) return mapped[0];
            return mapped.find((m) => m.id === prev.id) || mapped[0];
          });
        }
      }
    } catch (e) {
      console.error("Error loading reports:", e);
    }
  }, [userLat, userLng]);

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 30000);

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

  const handleRefreshLocation = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    refreshLocation();
    if (userLat && userLng) fetchAddress(userLat, userLng);
  };

  const nearbyIncidents = useMemo(() => {
    return filterWithinRadius(userLat, userLng, liveIncidents, 10.0);
  }, [userLat, userLng, liveIncidents]);

  const displayIncidents = nearbyIncidents.length > 0 ? nearbyIncidents : liveIncidents;
  const filteredIncidents = displayIncidents.filter((inc) => layers[inc.type as keyof typeof layers]);

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      
      {/* Ambient Background */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">

        {/* HEADER */}
        <header className="glass-header flex items-center justify-between p-4 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="feature-icon" style={{ color: "var(--accent)" }}>
              <RadarIcon className="w-5 h-5 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white">
                COMMUNITY RADAR
              </h1>
              <p className="text-[10px] tracking-wider text-muted mt-0.5">
                10KM AREA HAZARD FEED
              </p>
            </div>
          </div>
        </header>

        {/* MAIN RADAR & DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          
          {/* RADAR MAP VIEW */}
          <div className="lg:col-span-2 glass-panel p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="panel-reflection" />

            {/* Map Header / Filters */}
            <div className="flex items-center justify-between mb-3 z-20 flex-wrap gap-2">
              <div />

              {/* Layer Filters with Eye Toggle on Left */}
              <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
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
                    onClick={() => toggleLayer("power")}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      layers.power ? "bg-amber-500/20 text-amber-300" : "text-muted hover:text-white"
                    }`}
                    title="Power"
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleLayer("water")}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      layers.water ? "bg-cyan-500/20 text-cyan-300" : "text-muted hover:text-white"
                    }`}
                    title="Water"
                  >
                    <Droplet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleLayer("roads")}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      layers.roads ? "bg-purple-500/20 text-purple-300" : "text-muted hover:text-white"
                    }`}
                    title="Roads"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleLayer("other")}
                    className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      layers.other ? "bg-teal-500/20 text-teal-300" : "text-muted hover:text-white"
                    }`}
                    title="Other"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* RADAR CANVAS */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center my-2">
              
              {/* Dynamic Theme Grid dots */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(var(--accent) 1px, transparent 1px)`,
                  backgroundSize: "24px 24px"
                }}
              />
              
              {/* Theme Radar Rings */}
              <div className="absolute w-[320px] h-[320px] rounded-full border pointer-events-none" style={{ borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }} />
              <div className="absolute w-[200px] h-[200px] rounded-full border pointer-events-none" style={{ borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }} />
              <div className="absolute w-[80px] h-[80px] rounded-full border pointer-events-none" style={{ borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }} />
              <div className="absolute w-full h-[1px] pointer-events-none" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }} />
              <div className="absolute h-full w-[1px] pointer-events-none" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }} />

              {/* Center User Pin */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center">
                <span className="absolute w-8 h-8 rounded-full animate-ping opacity-40" style={{ backgroundColor: "var(--accent)" }} />
                <div className="w-3 h-3 rounded-full bg-white ring-2 ring-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
              </div>

              {/* Theme Rotating Sweep */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[320px] h-[320px] rounded-full relative animate-spin" style={{ animationDuration: "5s" }}>
                    <div 
                      className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left rounded-tr-full"
                      style={{
                        background: `linear-gradient(to bottom left, color-mix(in srgb, var(--accent) 30%, transparent), transparent)`
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
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    style={{ top: `${incident.coordinates.y}%`, left: `${incident.coordinates.x}%` }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all z-30 group cursor-pointer"
                    title={incident.title}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        incident.type === "water" ? "bg-cyan-400 text-cyan-950" :
                        incident.type === "roads" ? "bg-purple-400 text-purple-950" :
                        "bg-amber-400 text-amber-950"
                      } ${isSelected ? "scale-125 ring-2 ring-white shadow-lg" : "hover:scale-110"}`}>
                        {incident.type === "power" && <Zap className="w-3 h-3" />}
                        {incident.type === "water" && <Droplet className="w-3 h-3" />}
                        {incident.type === "roads" && <AlertTriangle className="w-3 h-3" />}
                        {incident.type === "other" && <FileText className="w-3 h-3" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Map Footer GPS */}
            <div className="flex items-center justify-between text-xs text-muted mt-2">
              <span className="flex items-center gap-1.5 truncate">
                <Navigation className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} />
                <span className="font-mono text-[11px] text-white truncate">
                  {geoLoading || isRefreshingAddress ? "Locating..." : userStreetAddress}
                </span>
              </span>
              <button
                type="button"
                onClick={handleRefreshLocation}
                title="Refresh Location"
                className="p-1 rounded-lg border border-white/10 hover:text-white transition-colors cursor-pointer"
                style={{ color: "var(--accent)" }}
              >
                <RefreshCw className={`h-3 w-3 ${geoLoading || isRefreshingAddress ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* ALL INCIDENT DETAILS PANEL WITH INNER SCROLL & FULL CARDS */}
          <div className="glass-panel p-5 sm:p-6 flex flex-col justify-between relative">
            <div className="panel-reflection" />

            <div>
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h2 className="text-xs font-semibold text-white tracking-wider">ALL INCIDENT DETAILS</h2>
                <span className="text-[10px] font-mono text-muted">{displayIncidents.length} Active</span>
              </div>

              {/* Inner scroll container without visible scrollbars */}
              <div 
                className="space-y-3 max-h-[460px] overflow-y-auto pr-1"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>

                {displayIncidents.length === 0 ? (
                  <p className="text-xs text-muted py-8 text-center">No active incidents found nearby.</p>
                ) : (
                  displayIncidents.map((incident) => {
                    const isSelected = selectedIncident?.id === incident.id;
                    return (
                      <div
                        key={incident.id}
                        onClick={() => setSelectedIncident(incident)}
                        className={`p-3.5 bg-white/5 border rounded-xl space-y-2.5 transition-all cursor-pointer ${
                          isSelected ? "border-[var(--accent)] bg-white/[0.08]" : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                            {incident.type} • {incident.id}
                          </span>
                          <span className="text-[10px] font-mono uppercase text-amber-400">
                            {incident.severity} priority
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-white">{incident.title}</h3>
                          <p className="text-xs text-muted mt-1 leading-relaxed">{incident.description}</p>
                          <p className="text-xs text-muted flex items-center gap-1 mt-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} /> {incident.location}
                          </p>
                        </div>

                        {incident.distanceKm !== undefined && (
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                            <span className="text-muted">Distance:</span>
                            <span className="font-bold" style={{ color: "var(--accent)" }}>
                              {incident.distanceKm.toFixed(2)} km away
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Link 
              href="/civic" 
              className="w-full mt-4 py-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 shrink-0"
              style={{
                color: "var(--accent)",
                borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)"
              }}
            >
              Report New Hazard <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}
