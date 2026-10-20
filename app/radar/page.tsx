"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Radar as RadarIcon,
  Zap,
  Droplet,
  FileText,
  MapPin,
  RefreshCw,
  Eye,
  EyeOff,
  Navigation,
  Plus,
  Trash2,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";
import { animateRefreshIcon } from "@/lib/location/animateRefreshIcon";
import { supabase } from "@/lib/supabase";
import { readOfflineData, writeOfflineData } from "@/lib/offline/dataCache";
import { projectToRadar } from "@/lib/radarProjection";

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
  reporterUserId?: string | null;
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
  const { streetAddress, location, filterByRadius, refreshLocation, loading: geoLoading } = useGeo();
  const [selectedIncident, setSelectedIncident] = useState<IncidentMarker | null>(null);
  const [scanning] = useState(true);
  const [liveIncidents, setLiveIncidents] = useState<IncidentMarker[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Theme Accent Persistence
  const [accentColor, setAccentGroup] = useState<string>("#38bdf8");

  // Filter Layers & Marker Visibility Toggle
  const [layers, setLayers] = useState({
    power: true,
    water: true,
    other: true,
  });
  const [markersVisible, setMarkersVisible] = useState(true);

  // Sync Accent Theme State & Global Variables
  useEffect(() => {
    const applySavedTheme = () => {
      try {
        const savedAccent = localStorage.getItem("resigrid_accent_theme");
        if (savedAccent && ACCENT_HEX_MAP[savedAccent]) {
          const hex = ACCENT_HEX_MAP[savedAccent];
          setAccentGroup(hex);
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
        setAccentGroup(hex);
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

  useEffect(() => {
    let active = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setCurrentUserId(session?.user.id ?? null);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Could not identify the signed-in radar user:", error);
      } else if (active) {
        setCurrentUserId(data.session?.user.id ?? null);
      }
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch active reports strictly and exclusively from Supabase database table
  const loadReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Supabase fetch error on Radar:", error);
        const cachedIncidents = readOfflineData<IncidentMarker[]>("resigrid_radar_incidents");
        setLiveIncidents(Array.isArray(cachedIncidents) ? cachedIncidents : []);
        return;
      }

      if (data && data.length > 0) {
        const mapped: IncidentMarker[] = data.map((row: any) => {
          const lat = typeof row.latitude === "number" ? row.latitude : Number.NaN;
          const lng = typeof row.longitude === "number" ? row.longitude : Number.NaN;
          const point = location
            ? projectToRadar(location.latitude, location.longitude, lat, lng, 10)
            : null;
          const x = point?.x ?? 50;
          const y = point?.y ?? 50;
          const distKm = point?.distanceKm ?? Number.NaN;

          const cat = row.category || "other";
          const normalizedType = cat === "power" || cat === "water" ? cat : "other";

          return {
            id: row.report_id || `RPT-${row.id}`,
            type: normalizedType as "power" | "water" | "other",
            category: cat,
            title: row.title || "Community Hazard Report",
            location: row.location_address || streetAddress,
            locationAddress: row.location_address,
            severity: row.priority ? (row.priority.toLowerCase() as any) : "high",
            time: row.time_str || "Recently",
            latitude: lat,
            longitude: lng,
            coordinates: { x, y },
            description: row.description || "No additional hazard details provided.",
            status: row.status || "Active",
            distanceKm: distKm,
            formattedDistance: Number.isFinite(distKm) ? `${distKm.toFixed(2)} km` : undefined,
            reporterUserId: row.reporter_user_id ?? null,
          };
        });

        setLiveIncidents(mapped);
        writeOfflineData("resigrid_radar_incidents", mapped);
        setSelectedIncident((prev) => {
          if (!prev) return mapped[0];
          return mapped.find((m) => m.id === prev.id) || mapped[0];
        });
      } else {
        setLiveIncidents([]);
      }
    } catch (e) {
      console.error("Error reading active reports for radar from Supabase:", e);
      setLiveIncidents([]);
    }
  }, [location, streetAddress]);

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 10000);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("resigrid_reports_dispatch");
      channel.onmessage = (e) => {
        if (e.data?.type === "NEW_REPORT" || e.data?.type === "STATUS_UPDATE") loadReports();
      };
    }

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [loadReports]);

  // Filter Incidents within 10km Radius using Context Engine
  const nearbyIncidents = useMemo(() => {
    return filterByRadius(liveIncidents, 10.0);
  }, [filterByRadius, liveIncidents]);

  const displayIncidents = nearbyIncidents;
  const filteredIncidents = displayIncidents.filter((inc) => layers[inc.type as keyof typeof layers]);

  const handleDeleteReport = async (incident: IncidentMarker) => {
    if (!currentUserId || incident.reporterUserId !== currentUserId) return;
    if (!window.confirm(`Delete your report ${incident.id}? This cannot be undone.`)) return;

    setDeletingReportId(incident.id);
    setDeleteError(null);
    try {
      const { data, error } = await supabase
        .from("reports")
        .delete()
        .eq("report_id", incident.id)
        .eq("reporter_user_id", currentUserId)
        .select("report_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error("Report not deleted. Confirm the latest report ownership migration is applied.");
      }

      const remaining = liveIncidents.filter((report) => report.id !== incident.id);
      setLiveIncidents(remaining);
      writeOfflineData("resigrid_radar_incidents", remaining);
      setSelectedIncident((selected) => selected?.id === incident.id ? null : selected);

      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("resigrid_reports_dispatch");
        channel.postMessage({ type: "REPORT_DELETED", payload: { id: incident.id } });
        channel.close();
      }
    } catch (error) {
      console.error("Could not delete the user's radar report:", error);
      setDeleteError("Could not delete this report. Please retry.");
    } finally {
      setDeletingReportId(null);
    }
  };

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
                10KM AREA RADIUS • SUPABASE LIVE SYNC
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
            <div className="relative w-full aspect-square bg-black/60 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center my-1 sm:my-2">
              
              {/* Dynamic Theme Grid dots */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
                  backgroundSize: "24px 24px"
                }}
              />
              
              {/* Radar Rings (Precise 10km Scale Indicators) */}
              <div className="absolute aspect-square w-[84%] rounded-full border pointer-events-none" style={{ borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)` }} />
              <div className="absolute aspect-square w-[56%] rounded-full border pointer-events-none" style={{ borderColor: `color-mix(in srgb, ${accentColor} 20%, transparent)` }} />
              <div className="absolute aspect-square w-[28%] rounded-full border pointer-events-none" style={{ borderColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }} />
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
                  <div className="w-[84%] aspect-square rounded-full relative animate-spin" style={{ animationDuration: "6s" }}>
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
                  onClick={(event) => {
                    animateRefreshIcon(event.currentTarget);
                    refreshLocation();
                  }}
                  title="Refresh Location"
                  className="p-1 rounded-lg border border-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
                  style={{ color: accentColor }}
                >
                  <RefreshCw className={`h-3 w-3 ${geoLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ALL INCIDENT DETAILS PANEL (SANITIZED: NO URGENCY BADGES) */}
          <div className="glass-panel p-4 sm:p-6 flex flex-col justify-between relative pointer-events-auto">
            <div className="panel-reflection pointer-events-none" />

            <div className="w-full">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h2 className="text-xs font-semibold text-white tracking-wider">ALL INCIDENT DETAILS</h2>
                <span className="text-[10px] font-mono text-muted">{displayIncidents.length} reports · 10 km</span>
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
                          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9px] font-semibold text-white/80">
                            {incident.status}
                          </span>
                          {currentUserId && incident.reporterUserId === currentUserId && (
                            <button
                              type="button"
                              disabled={deletingReportId === incident.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteReport(incident);
                              }}
                              aria-label={`Delete your report ${incident.id}`}
                              title="Delete your report"
                              className="ml-auto rounded-lg p-1.5 text-rose-300 transition-colors hover:bg-rose-500/15 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
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
              {deleteError && <p role="alert" className="mt-3 text-center text-[11px] text-rose-300">{deleteError}</p>}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
