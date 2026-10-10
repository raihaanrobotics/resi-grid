"use client";

import React, { useState, useEffect, useCallback } from "react";
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
}

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

export default function RadarPage() {
  const { location, refreshLocation } = useUserLocation();
  const [selectedIncident, setSelectedIncident] = useState<IncidentMarker | null>(null);
  const [scanning] = useState(true);
  const [liveIncidents, setLiveIncidents] = useState<IncidentMarker[]>([]);

  // Active Map Filter Layers
  const [layers, setLayers] = useState({
    power: true,
    water: true,
    roads: true,
    other: true,
  });

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

  // Load Real Reports from Local Storage & BroadcastChannel Sync stably without wiping
  const loadReports = useCallback(() => {
    try {
      const saved = localStorage.getItem("resigrid_active_reports");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: IncidentMarker[] = parsed.map((item: any, idx: number) => {
            const lat = item.coords?.lat || -29.6006 + (idx * 0.005);
            const lng = item.coords?.lng || 30.3794 + (idx * 0.005);
            
            const x = Math.min(85, Math.max(15, 50 + (lng - 30.3794) * 1200));
            const y = Math.min(85, Math.max(15, 50 - (lat - (-29.6006)) * 1200));

            return {
              id: item.id || `INC-${100 + idx}`,
              type: item.category || "other",
              title: item.title || "Infrastructure Hazard",
              location: item.locationAddress || "Local Area",
              severity: item.priority ? item.priority.toLowerCase() : "high",
              time: item.time || "Recently",
              latitude: lat,
              longitude: lng,
              coordinates: { x, y },
            };
          });
          setLiveIncidents(mapped);
          setSelectedIncident((prev) => {
            if (!prev) return mapped[0];
            const stillExists = mapped.find((m) => m.id === prev.id);
            return stillExists || mapped[0];
          });
        }
      }
    } catch (e) {
      console.error("Error loading saved reports for radar:", e);
    }
  }, []);

  useEffect(() => {
    loadReports();

    // Auto-refresh reports data every minute without updating location
    const dataInterval = setInterval(() => {
      loadReports();
    }, 60000);

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");
      broadcastChannel.onmessage = (event) => {
        const { type } = event.data || {};
        if (type === "NEW_REPORT" || type === "STATUS_UPDATE") {
          loadReports();
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "resigrid_active_reports") {
        loadReports();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(dataInterval);
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadReports]);

  // Filter incidents within 5km radius if user location is available, otherwise show all
  const userLat = location?.latitude || -29.6006;
  const userLng = location?.longitude || 30.3794;

  const nearbyIncidents = filterWithinRadius(userLat, userLng, liveIncidents, 5.0);
  const displayIncidents = nearbyIncidents.length > 0 ? nearbyIncidents : liveIncidents;

  const filteredIncidents = displayIncidents.filter((inc) => layers[inc.type as keyof typeof layers]);

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      
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
          <div className="flex items-center gap-3">
            <div className="feature-icon feature-energy" style={{ color: "var(--accent)" }}>
              <RadarIcon className="w-5 h-5 animate-spin" style={{ animationDuration: "12s", color: "var(--accent)" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white">
                  COMMUNITY RADAR™
                </h1>
              </div>
              <p className="mt-0.5 text-[9px] tracking-[0.15em] text-muted">
                REAL-TIME GEOSPATIAL INTELLIGENCE & INFRASTRUCTURE TELEMETRY
              </p>
            </div>
          </div>
        </header>

        {/* GEOSPATIAL RADAR CANVAS & SIDEBAR CONTROL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* RADAR INTERACTIVE MAP DISPLAY */}
          <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between relative overflow-hidden min-h-[460px]">
            <div className="panel-reflection" />

            {/* Map Header Overlay Controls */}
            <div className="flex items-center justify-between mb-4 z-20 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <span className="text-xs font-mono text-white font-semibold">SECTOR GRID: PMB-5KM RADIUS</span>
              </div>

              {/* Quick Layer Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => toggleLayer("power")}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                    layers.power ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-muted hover:text-white"
                  }`}
                  title="Toggle Power Outages Layer"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleLayer("water")}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                    layers.water ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-muted hover:text-white"
                  }`}
                  title="Toggle Water Faults Layer"
                >
                  <Droplet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleLayer("roads")}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                    layers.roads ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-muted hover:text-white"
                  }`}
                  title="Toggle Roads Layer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleLayer("other")}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                    layers.other ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "text-muted hover:text-white"
                  }`}
                  title="Toggle Other Incidents Layer"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* SIMULATED RADAR SCOPE DISPLAY */}
            <div className="relative w-full flex-1 bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center my-2 min-h-[300px]">
              
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
              
              {/* Radar Circular Concentric Sweep Rings */}
              <div className="absolute w-[360px] h-[360px] border border-emerald-500/20 rounded-full pointer-events-none" />
              <div className="absolute w-[240px] h-[240px] border border-emerald-500/20 rounded-full pointer-events-none" />
              <div className="absolute w-[120px] h-[120px] border border-emerald-500/20 rounded-full pointer-events-none" />
              <div className="absolute w-full h-[1px] bg-emerald-500/10 pointer-events-none" />
              <div className="absolute h-full w-[1px] bg-emerald-500/10 pointer-events-none" />

              {/* Rotating Radar Sweep Line */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[360px] h-[360px] rounded-full relative animate-spin" style={{ animationDuration: "6s" }}>
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-emerald-500/25 to-transparent origin-bottom-left rounded-tr-full" />
                  </div>
                </div>
              )}

              {/* Dynamic Incident Markers on Canvas */}
              {filteredIncidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                
                let markerBg = "bg-amber-500 text-amber-950";
                let markerGlow = "shadow-[0_0_15px_rgba(245,158,11,0.6)]";
                
                if (incident.type === "water") {
                  markerBg = "bg-cyan-400 text-cyan-950";
                  markerGlow = "shadow-[0_0_15px_rgba(34,211,238,0.6)]";
                } else if (incident.type === "roads") {
                  markerBg = "bg-purple-400 text-purple-950";
                  markerGlow = "shadow-[0_0_15px_rgba(192,132,252,0.6)]";
                } else if (incident.type === "other") {
                  markerBg = "bg-teal-400 text-teal-950";
                  markerGlow = "shadow-[0_0_15px_rgba(45,212,191,0.6)]";
                }

                return (
                  <button
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    style={{ top: `${incident.coordinates.y}%`, left: `${incident.coordinates.x}%` }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group z-30`}
                  >
                    <div className="relative flex items-center justify-center">
                      {incident.severity === "high" && (
                        <span className={`absolute w-6 h-6 rounded-full animate-ping opacity-75 ${
                          incident.type === "water" ? "bg-cyan-400" : "bg-amber-400"
                        }`} />
                      )}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${markerBg} ${markerGlow} ${
                        isSelected ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                      }`}>
                        {incident.type === "power" && <Zap className="w-3.5 h-3.5" />}
                        {incident.type === "water" && <Droplet className="w-3.5 h-3.5" />}
                        {incident.type === "roads" && <AlertTriangle className="w-3.5 h-3.5" />}
                        {incident.type === "other" && <FileText className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Map Footer Telemetry with Separate Location Refresh Button */}
            <div className="flex items-center justify-between text-xs text-muted mt-3 z-20 flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent)" }} />
                Showing <strong className="text-white">{filteredIncidents.length}</strong> active hazards in radius
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted">LAT: {userLat.toFixed(4)}, LON: {userLng.toFixed(4)}</span>
                <button
                  type="button"
                  onClick={refreshLocation}
                  title="Refresh GPS Location"
                  className="p-1 rounded-lg border border-white/10 hover:text-white transition-colors cursor-pointer touch-manipulation"
                  style={{ color: "var(--accent)", backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* INCIDENT DETAILS & FILTER CONTROL PANEL */}
          <div className="glass-panel p-6 flex flex-col justify-between relative">
            <div className="panel-reflection" />

            <div>
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" style={{ color: "var(--accent)" }} /> Hazard Telemetry
                </h2>
                <span className="text-[10px] font-mono text-muted">ID: {selectedIncident?.id || "N/A"}</span>
              </div>

              {selectedIncident ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-md border"
                        style={{
                          color: "var(--accent)",
                          backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                          borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
                        }}
                      >
                        {selectedIncident.type.toUpperCase()} INCIDENT
                      </span>
                      <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {selectedIncident.severity.toUpperCase()} PRIORITY
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{selectedIncident.title}</h3>
                      <p className="text-xs text-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} /> {selectedIncident.location}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-muted">
                      <span>Logged: {selectedIncident.time}</span>
                      <span className="font-medium" style={{ color: "var(--accent)" }}>Dispatched</span>
                    </div>
                  </div>

                  {/* Layer Visibility Selectors */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono tracking-wider text-muted uppercase">ACTIVE RADAR LAYERS</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => toggleLayer("power")}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          layers.power
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : "bg-black/20 border-white/5 text-muted hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Power</span>
                        {layers.power ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => toggleLayer("water")}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          layers.water
                            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                            : "bg-black/20 border-white/5 text-muted hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5" /> Water</span>
                        {layers.water ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => toggleLayer("roads")}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          layers.roads
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                            : "bg-black/20 border-white/5 text-muted hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Roads</span>
                        {layers.roads ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => toggleLayer("other")}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          layers.other
                            ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                            : "bg-black/20 border-white/5 text-muted hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Other</span>
                        {layers.other ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted py-8 text-center">Select an incident marker on the radar map to view telemetry.</p>
              )}
            </div>

            <a 
              href="/civic" 
              className="w-full mt-6 py-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation hover:opacity-90"
              style={{
                color: "var(--accent)",
                borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                boxShadow: "0 0 20px color-mix(in srgb, var(--accent) 15%, transparent)"
              }}
            >
              Report New Hazard <ChevronRight className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* RECENT RADAR FEED LIST */}
        <div className="glass-panel p-6 relative">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} /> Real-time Hazard Feed ({displayIncidents.length})
            </h2>
            <span className="text-xs text-muted font-mono">Live Synced</span>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {displayIncidents.length === 0 ? (
              <div className="text-center py-8 text-muted text-xs">
                No active hazard reports found in your 5km radius.
              </div>
            ) : (
              displayIncidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedIncident?.id === incident.id
                      ? "bg-white/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      incident.type === "power" ? "bg-amber-500/20 text-amber-400" :
                      incident.type === "water" ? "bg-cyan-500/20 text-cyan-400" :
                      incident.type === "roads" ? "bg-purple-500/20 text-purple-400" :
                      "bg-teal-500/20 text-teal-400"
                    }`}>
                      {incident.type === "power" && <Zap className="w-4 h-4" />}
                      {incident.type === "water" && <Droplet className="w-4 h-4" />}
                      {incident.type === "roads" && <AlertTriangle className="w-4 h-4" />}
                      {incident.type === "other" && <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{incident.title}</p>
                      <p className="text-[11px] text-muted mt-0.5 truncate">{incident.location}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span className="text-[10px] font-mono text-muted block">{incident.time}</span>
                    <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--accent)" }}>{incident.severity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
