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
  Clock,
  Truck,
  PhoneCall,
  Tag,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";
import { animateRefreshIcon } from "@/lib/location/animateRefreshIcon";
import { supabase } from "@/lib/supabase";
import { formatReportTimestamp, getReportDisplayId, hasEstimatedFixTime, mergeNearbyActiveReports, normalizeReportStatus } from "@/lib/reportUtils";
import { readOfflineData, writeOfflineData } from "@/lib/offline/dataCache";
import { useReportUpvotes } from "@/lib/useReportUpvotes";
import ReportImpactButton from "@/components/shared/ReportImpactButton";

interface IncidentMarker {
  id: string;
  displayId?: string;
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
  assignedDepotUnit?: string;
  estimatedFixTime?: string;
  distanceKm?: number;
  formattedDistance?: string;
  reporterUserId?: string | null;
  ward?: string;
  impactCount: number;
  coords?: { lat: number; lng: number };
  separateIncident?: boolean;
  createdTimestamp?: number;
}

interface WaterTankerDispatch {
  dispatchId: string;
  tankerUnit: string;
  province: string;
  municipality: string;
  ward: string;
  locationDescription: string;
  capacityLiters: string;
  scheduledTime: string;
  driverContact: string;
  status: "En Route" | "On Station" | "Completed";
  notes: string;
  timestamp: number;
}

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

/**
 * Generates a deterministic visual position around the center dot (50, 50)
 * keeping pins neatly spread out inside the radar rings (12% to 38% radius).
 */
function getDeterministicRadarPosition(id: string): { x: number; y: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Angle between 0 and 2*PI
  const angle = ((positiveHash % 360) * Math.PI) / 180;
  
  // Distance from center between 12% and 38% (keeps it well inside the radar boundary)
  const radiusPercent = 12 + ((positiveHash >> 3) % 26);

  return {
    x: 50 + Math.sin(angle) * radiusPercent,
    y: 50 - Math.cos(angle) * radiusPercent,
  };
}

export default function RadarPage() {
  const { streetAddress, location, filterByRadius, refreshLocation, loading: geoLoading } = useGeo();
  const [selectedIncident, setSelectedIncident] = useState<IncidentMarker | null>(null);
  const [scanning] = useState(true);
  const [liveIncidents, setLiveIncidents] = useState<IncidentMarker[]>([]);
  const { upvotedReportIds, markUpvoted } = useReportUpvotes(
    liveIncidents.map((incident) => incident.id)
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Water Tanker State
  const [activeTankers, setActiveTankers] = useState<WaterTankerDispatch[]>([]);
  const [selectedTankerModal, setSelectedTankerModal] = useState<WaterTankerDispatch | null>(null);

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
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase fetch error on Radar:", error);
        const cachedIncidents = readOfflineData<IncidentMarker[]>("resigrid_radar_incidents");
        setLiveIncidents(Array.isArray(cachedIncidents)
          ? cachedIncidents.map((incident) => ({
              ...incident,
              displayId: incident.displayId || getReportDisplayId(incident.id),
              impactCount: incident.impactCount || 1,
            }))
          : []);
        return;
      }

      if (data && data.length > 0) {
        const mapped: IncidentMarker[] = data.map((row: any) => {
          const idStr = row.report_id || `RPT-${row.id}`;
          
          // Generate deterministic visual coordinates around center dot (50, 50)
          const coords = getDeterministicRadarPosition(idStr);

          const cat = row.category || "other";
          const normalizedType = cat === "power" || cat === "water" ? cat : "other";

          return {
            id: idStr,
            displayId: getReportDisplayId(row.report_id, row.id),
            type: normalizedType as "power" | "water" | "other",
            category: cat,
            title: row.title || "Community Hazard Report",
            location: row.location_address || streetAddress,
            locationAddress: row.location_address,
            severity: row.priority ? (row.priority.toLowerCase() as any) : "high",
            time: formatReportTimestamp(row.created_at) || row.time_str || "Today",
            latitude: typeof row.latitude === "number" ? row.latitude : -29.6,
            longitude: typeof row.longitude === "number" ? row.longitude : 30.3,
            coords: typeof row.latitude === "number" && typeof row.longitude === "number"
              ? { lat: row.latitude, lng: row.longitude }
              : undefined,
            coordinates: coords,
            description: row.description || "No additional hazard details provided.",
            status: normalizeReportStatus(row.status, row.assigned_depot),
            assignedDepotUnit: row.assigned_depot || undefined,
            estimatedFixTime: row.estimated_fix_time || undefined,
            distanceKm: 0.5,
            formattedDistance: "Nearby",
            reporterUserId: row.reporter_user_id ?? null,
            ward: row.ward || "Ward 26",
            impactCount: row.impact_count || 1,
            separateIncident: row.separate_incident || false,
            createdTimestamp: row.created_at ? new Date(row.created_at).getTime() : undefined,
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
  }, [streetAddress]);

  const loadTankers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("water_tankers")
        .select("*")
        .order("timestamp", { ascending: false });

      if (!error && data) {
        const mappedTankers: WaterTankerDispatch[] = data.map((row: any) => ({
          dispatchId: row.dispatch_id || `TNK-${row.id}`,
          tankerUnit: row.tanker_unit,
          province: row.province,
          municipality: row.municipality,
          ward: row.ward,
          locationDescription: row.location_description,
          capacityLiters: row.capacity_liters,
          scheduledTime: row.scheduled_time,
          driverContact: row.driver_contact,
          status: row.status || "En Route",
          notes: row.notes,
          timestamp: row.timestamp ? new Date(row.timestamp).getTime() : Date.now(),
        }));
        setActiveTankers(mappedTankers);
        localStorage.setItem("resigrid_active_tankers", JSON.stringify(mappedTankers));
      }
    } catch (err) {
      console.error("Error fetching water tankers from Supabase:", err);
      try {
        const savedTankers = localStorage.getItem("resigrid_active_tankers");
        if (savedTankers) setActiveTankers(JSON.parse(savedTankers));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    loadReports();
    loadTankers();
    const interval = setInterval(() => {
      loadReports();
      loadTankers();
    }, 10000);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("resigrid_reports_dispatch");
      channel.onmessage = (e) => {
        if (e.data?.type === "NEW_REPORT" || e.data?.type === "STATUS_UPDATE") loadReports();
        if (e.data?.type === "TANKER_DISPATCH") {
          loadTankers();
        }
      };
    }

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [loadReports, loadTankers]);

  // Filter Incidents within 10km Radius with fallback around the center dot if anything fails
  const displayIncidents = useMemo(() => {
    try {
      const filtered = filterByRadius(liveIncidents, 10.0);
      if (Array.isArray(filtered) && filtered.length > 0) {
        return mergeNearbyActiveReports(filtered);
      }
    } catch (e) {
      console.error("Radius filtering error, using fallback around center dot:", e);
    }
    return mergeNearbyActiveReports(liveIncidents);
  }, [filterByRadius, liveIncidents]);

  const filteredIncidents = displayIncidents.filter((inc) => layers[inc.type as keyof typeof layers]);

  const handleIncidentUpvoted = (reportId: string, impactCount: number) => {
    markUpvoted(reportId);
    setLiveIncidents((previous) => previous.map((incident) =>
      incident.id === reportId ? { ...incident, impactCount } : incident
    ));
    setSelectedIncident((previous) => previous?.id === reportId
      ? { ...previous, impactCount }
      : previous
    );
  };

  const handleDeleteReport = async (incident: IncidentMarker) => {
    if (!currentUserId || incident.reporterUserId !== currentUserId) return;
    if (!window.confirm(`Delete your report ${incident.displayId || incident.id}? This cannot be undone.`)) return;

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
        <header className="glass-header flex items-center justify-between p-3.5 sm:p-4 rounded-[var(--radius)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="feature-icon shrink-0 rounded-[10px]" style={{ color: accentColor }}>
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
          <div className="lg:col-span-2 glass-panel p-3.5 sm:p-6 flex flex-col justify-between relative overflow-hidden pointer-events-auto rounded-[var(--radius)]">
            <div className="panel-reflection pointer-events-none" />

            {/* Map Header / Filters */}
            <div className="flex items-center justify-between mb-2 sm:mb-3 z-20 flex-wrap gap-2">
              {/* Report Button Pill with Plus Icon */}
              <Link
                href="/civic"
                className="glass-panel px-3.5 py-2 flex items-center gap-1.5 text-xs font-semibold text-white transition-all cursor-pointer touch-manipulation pointer-events-auto z-30 hover:opacity-90 shrink-0 rounded-full"
                style={{
                  borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                }}
              >
                <Plus className="h-3.5 w-3.5" style={{ color: accentColor }} />
                <span className="inline">Report</span>
              </Link>

              {/* Layer Filters Toolbar */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-black/40 p-1 rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => setMarkersVisible((prev) => !prev)}
                  className={`p-1.5 rounded-full text-xs transition-all cursor-pointer ${
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
                    className={`p-1.5 rounded-full text-xs transition-all cursor-pointer ${
                      layers.power ? "bg-amber-500/20 text-amber-300" : "text-muted hover:text-white"
                    }`}
                    title="Power Faults"
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleLayer("water")}
                    className={`p-1.5 rounded-full text-xs transition-all cursor-pointer ${
                      layers.water ? "bg-cyan-500/20 text-cyan-300" : "text-muted hover:text-white"
                    }`}
                    title="Water Issues"
                  >
                    <Droplet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleLayer("other")}
                    className={`p-1.5 rounded-full text-xs transition-all cursor-pointer ${
                      layers.other ? "bg-purple-500/20 text-purple-300" : "text-muted hover:text-white"
                    }`}
                    title="Civic & General Hazards"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* RADAR CANVAS */}
            <div className="relative w-full aspect-square bg-black/60 border border-white/10 rounded-full overflow-visible my-1 sm:my-2 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
              
              {/* Dynamic Theme Grid dots */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none rounded-full overflow-hidden"
                style={{
                  backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
                  backgroundSize: "24px 24px"
                }}
              />
              
              {/* Radar Rings (Precise Scale Indicators) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square w-[84%] rounded-full border pointer-events-none" style={{ borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)` }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square w-[56%] rounded-full border pointer-events-none" style={{ borderColor: `color-mix(in srgb, ${accentColor} 20%, transparent)` }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square w-[28%] rounded-full border pointer-events-none" style={{ borderColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }} />
              <div className="absolute top-1/2 left-0 w-full h-[1px] pointer-events-none" style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }} />
              <div className="absolute top-0 left-1/2 h-full w-[1px] pointer-events-none" style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }} />

              {/* Center User Pin (Smaller Core with Smaller Pulsing Animation) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center">
                <div className="relative flex items-center justify-center w-3 h-3">
                  <span 
                    className="absolute inset-0 rounded-full animate-ping opacity-50 pointer-events-none" 
                    style={{ 
                      backgroundColor: accentColor, 
                      animationDuration: "2s",
                      transform: "scale(2)" 
                    }} 
                  />
                  <div className="w-3 h-3 rounded-full bg-white shadow-lg ring-2 ring-white/30 relative z-10" />
                </div>
              </div>

              {/* Theme Rotating Sweep */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-full overflow-hidden">
                  <div className="w-full aspect-square rounded-full relative animate-spin" style={{ animationDuration: "6s" }}>
                    <div 
                      className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left rounded-tr-full"
                      style={{
                        background: `linear-gradient(to bottom left, color-mix(in srgb, ${accentColor} 35%, transparent), transparent)`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Incident Markers (Strictly Round Circles, Enlarged on Selection/Tap) */}
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
                      <span className="absolute w-12 h-12 rounded-full border-2 border-white animate-ping opacity-60 pointer-events-none" style={{ animationDuration: "2s" }} />
                      <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs shadow-md transition-transform ${
                        incident.type === "water" ? "bg-cyan-400 text-cyan-950" :
                        incident.type === "power" ? "bg-amber-400 text-amber-950" :
                        "bg-purple-400 text-purple-950"
                      } ${isSelected ? "scale-125 shadow-xl" : "hover:scale-110"}`}
                      style={{ borderRadius: "50%" }}>
                        {incident.type === "power" && <Zap className="w-4 h-4" />}
                        {incident.type === "water" && <Droplet className="w-4 h-4" />}
                        {incident.type === "other" && <FileText className="w-4 h-4" />}
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
                  className="p-1 rounded-full border border-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
                  style={{ color: accentColor }}
                >
                  <RefreshCw className={`h-3 w-3 ${geoLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* ALL INCIDENT DETAILS PANEL */}
          <div className="glass-panel p-4 sm:p-6 flex flex-col justify-between relative pointer-events-auto rounded-[var(--radius)]">
            <div className="panel-reflection pointer-events-none" />

            <div className="w-full">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h2 className="text-xs font-semibold text-white tracking-wider">ALL INCIDENTS</h2>
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
                    const normalizedStatus = normalizeReportStatus(incident.status, incident.assignedDepotUnit);
                    const statusLower = normalizedStatus.toLowerCase();
                    const statusBadgeClass =
                      statusLower.includes("resolved") || statusLower.includes("fixed")
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : statusLower.includes("dispatched") || statusLower.includes("crew") || statusLower.includes("progress")
                        ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                        : "border-sky-500/30 bg-sky-500/15 text-sky-300";

                    // Check if there is an active water tanker dispatch matching this incident's ward/location
                    const matchingTanker = incident.type === "water"
                      ? activeTankers.find((t) => 
                          (incident.ward && t.ward.toLowerCase().includes(incident.ward.toLowerCase().split(":")[0])) ||
                          (incident.location && t.locationDescription.toLowerCase().includes(incident.location.toLowerCase().substring(0, 8))))
                      : null;

                    return (
                      <div
                        key={incident.id}
                        onClick={() => setSelectedIncident(incident)}
                        className={`p-3.5 sm:p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col gap-3 cursor-pointer ${
                          isSelected ? "border-white/40 bg-white/[0.08]" : ""
                        }`}
                        style={{
                          borderColor: isSelected ? accentColor : undefined
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${
                              incident.type === "power"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : incident.type === "water"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            }`}
                          >
                            {incident.type === "power" && <Zap className="w-3 h-3" />}
                            {incident.type === "water" && <Droplet className="w-3 h-3" />}
                            {incident.type === "other" && <FileText className="w-3 h-3" />}
                            {(incident.category || incident.type).toUpperCase()} • {incident.displayId || incident.id}
                          </span>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-semibold ${statusBadgeClass}`}>
                            {normalizedStatus}
                          </span>
                          {currentUserId && incident.reporterUserId === currentUserId && (
                            <button
                              type="button"
                              disabled={deletingReportId === incident.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteReport(incident);
                              }}
                              aria-label={`Delete your report ${incident.displayId || incident.id}`}
                              title="Delete your report"
                              className="ml-auto rounded-lg p-1.5 text-rose-300 transition-colors hover:bg-rose-500/15 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" style={{ color: accentColor }} />
                            {incident.time}
                          </span>
                          {hasEstimatedFixTime(incident.estimatedFixTime) && (
                            <span className="text-teal-300">Fix: {incident.estimatedFixTime}</span>
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

                        <div className="pt-1">
                          <ReportImpactButton
                            reportId={incident.id}
                            impactCount={incident.impactCount}
                            hasUpvoted={upvotedReportIds.has(incident.id)}
                            onUpvoted={handleIncidentUpvoted}
                          />
                        </div>

                        {matchingTanker && (
                          <div className="pt-2 border-t border-white/10 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTankerModal(matchingTanker);
                              }}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Water Tanker | View Details</span>
                            </button>
                          </div>
                        )}
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

      {/* WATER TANKER DETAILS MODAL */}
      {selectedTankerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-sm p-4 relative border-[var(--accent)]/30 space-y-2.5 rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" style={{ color: accentColor }} />
                <h3 className="text-xs font-bold text-white">Emergency Water Tanker Deployment</h3>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                <span className="text-muted text-[9px] uppercase">Assigned Unit</span>
                <p className="text-white font-bold">{selectedTankerModal.tankerUnit}</p>
                <p className="font-mono text-[10px]" style={{ color: accentColor }}>Capacity: {selectedTankerModal.capacityLiters}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-muted block text-[9px] uppercase tracking-wider">Target Ward</span>
                  <p className="text-white font-medium mt-0.5">{selectedTankerModal.ward}</p>
                </div>
                <div>
                  <span className="text-muted block text-[9px] uppercase tracking-wider">Schedule Time</span>
                  <p className="font-semibold mt-0.5" style={{ color: accentColor }}>{selectedTankerModal.scheduledTime}</p>
                </div>
              </div>

              <div>
                <span className="text-muted block text-[9px] uppercase tracking-wider">Exact Location / Landmark</span>
                <p className="text-white font-medium mt-0.5 flex items-center gap-1 bg-black/30 p-2 rounded-xl border border-white/5">
                  <MapPin className="h-3 w-3 shrink-0" style={{ color: accentColor }} />
                  {selectedTankerModal.locationDescription}
                </p>
              </div>

              <div>
                <span className="text-muted block text-[9px] uppercase tracking-wider">Driver Contact</span>
                <p className="text-white font-medium mt-0.5 flex items-center gap-1">
                  <PhoneCall className="h-3 w-3" style={{ color: accentColor }} />
                  {selectedTankerModal.driverContact}
                </p>
              </div>

              <div>
                <span className="text-muted block text-[9px] uppercase tracking-wider">Instructions &amp; Notes</span>
                <p className="text-muted leading-relaxed mt-0.5 bg-black/40 p-2 rounded-xl border border-white/5 text-[11px]">
                  {selectedTankerModal.notes}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-end">
              <button
                onClick={() => setSelectedTankerModal(null)}
                className="px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-lg"
                style={{
                  backgroundColor: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
                  borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                  color: accentColor,
                }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
