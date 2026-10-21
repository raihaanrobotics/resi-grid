"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wrench,
  Navigation,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PhoneCall,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Package,
  Plus,
  Trash2,
  User,
  Hash,
  Home,
  MessageCircle,
  X,
  ShieldAlert,
  Send,
  Building2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { dispatchReportScreenNotification } from "@/lib/notifications/globalNotifications";
import { openWhatsApp } from "@/lib/phone";

interface ReportItem {
  id: string;
  category: "water" | "power" | "other";
  title: string;
  description: string;
  locationAddress: string;
  status: "Auto-Dispatched" | "Pending Review" | "On Site" | "In Progress" | "Resolved";
  time: string;
  province?: string;
  municipality?: string;
  ward?: string;
  reporterName?: string;
  reporterPhone?: string;
  accountNumber?: string;
  standNumber?: string;
  assignedDepotUnit?: string;
  estimatedFixTime?: string;
  targetResolutionHours?: number;
  createdTimestamp?: number;
  coords?: { lat: number; lng: number };
}

interface MaterialUsed {
  id: string;
  item: string;
  quantity: number;
}

const DEPOT_UNITS = [
  "ALL UNITS",
  "Msunduzi Water Rapid Response - Unit 1",
  "Msunduzi Electricity & High Voltage - Unit 4",
  "Msunduzi Roads & Stormwater - Unit 2",
  "Edendale Service Center - Unit 3",
  "Northdale Infrastructure Depot - Unit 5",
];

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

// Target SLA Resolution Helper
const getSLAHoursForCategory = (cat: string): number => {
  if (cat === "power") return 2; // 2 hours target for electrical faults
  if (cat === "water") return 4; // 4 hours target for water leaks/bursts
  return 8; // 8 hours target for other civic issues
};

export default function FieldCrewPortalPage() {
  const [accentColor, setAccentColor] = useState<string>("#14b8a6");
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>("ALL UNITS");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<ReportItem | null>(null);
  const [reportSyncError, setReportSyncError] = useState("");

  // Material & Work Log Modal State
  const [materials, setMaterials] = useState<MaterialUsed[]>([]);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialQty, setNewMaterialQty] = useState(1);
  const [completionNotes, setCompletionNotes] = useState("");
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Theme Accent Sync
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

  // Fetch Assigned Field Jobs from Supabase
  const fetchCrewJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching crew jobs from Supabase:", error);
        setReportSyncError(error.message);
        return;
      }

      if (data) {
        const formatted: ReportItem[] = data.map((row: any) => {
          const category = (row.category || "water") as "water" | "power" | "other";
          const targetHours = getSLAHoursForCategory(category);
          const createdAt = row.created_at ? new Date(row.created_at).getTime() : Date.now();

          return {
            id: row.report_id || `RPT-${row.id}`,
            category: category,
            title: row.title || "Untitled Incident",
            description: row.description || "",
            locationAddress: row.location_address || "Unknown Location",
            status: row.status || "Auto-Dispatched",
            time: row.time_str || "Today",
            province: row.province || "KwaZulu-Natal",
            municipality: row.municipality || "Pietermaritzburg (Msunduzi)",
            ward: row.ward || "Ward 26",
            reporterName: row.reporter_name || "Resident",
            reporterPhone: row.reporter_phone || "N/A",
            accountNumber: row.account_number || "N/A",
            standNumber: row.stand_number || "N/A",
            assignedDepotUnit: row.assigned_depot || "Msunduzi Water Rapid Response - Unit 1",
            estimatedFixTime: row.estimated_fix_time || `${targetHours} Hours Target`,
            targetResolutionHours: targetHours,
            createdTimestamp: createdAt,
            coords: row.latitude && row.longitude ? { lat: row.latitude, lng: row.longitude } : undefined,
          };
        });

        setReports(formatted);
        setReportSyncError("");
      }
    } catch (err) {
      console.error("Supabase crew sync error:", err);
      setReportSyncError(err instanceof Error ? err.message : "Unknown report sync error.");
    }
  };

  useEffect(() => {
    fetchCrewJobs();
    const refreshInterval = window.setInterval(fetchCrewJobs, 20000);

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");

      broadcastChannel.onmessage = (event) => {
        const { type } = event.data || {};
        if (type === "NEW_REPORT" || type === "STATUS_UPDATE" || type === "CREW_ASSIGNED") {
          fetchCrewJobs();
        }
      };
    }

    const reportChannel = supabase
      .channel("crew-report-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        void fetchCrewJobs();
      })
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Crew live report sync unavailable:", error ?? status);
        }
      });

    return () => {
      window.clearInterval(refreshInterval);
      if (broadcastChannel) broadcastChannel.close();
      void supabase.removeChannel(reportChannel);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchCrewJobs();
    setIsRefreshing(false);
  };

  // Update Status in Supabase & Dispatch Sync
  const updateJobStatus = async (
    reportId: string,
    newStatus: ReportItem["status"],
    description?: string
  ): Promise<boolean> => {
    const update: { status: ReportItem["status"]; description?: string } = { status: newStatus };
    if (description !== undefined) update.description = description;
    try {
      const { data, error } = await supabase
        .from("reports")
        .update(update)
        .eq("report_id", reportId)
        .select("report_id")
        .maybeSingle();

      if (error) {
        console.error("Failed to update status in Supabase:", error);
        window.alert("Could not update this report. Please retry.");
        return false;
      }
      if (!data) {
        window.alert("The report could not be found or you are not allowed to update it.");
        return false;
      }
      setReports((prev) => prev.map((report) =>
        report.id === reportId
          ? { ...report, status: newStatus, ...(description !== undefined ? { description } : {}) }
          : report
      ));
      setActiveJob((current) => current?.id === reportId
        ? { ...current, status: newStatus, ...(description !== undefined ? { description } : {}) }
        : current
      );
      void dispatchReportScreenNotification(reportId);
    } catch (err) {
      console.error("Status update error:", err);
      window.alert("Could not update this report. Please retry.");
      return false;
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("resigrid_reports_dispatch");
      bc.postMessage({
        type: "STATUS_UPDATE",
        payload: { id: reportId, status: newStatus },
      });
      bc.close();
    }
    return true;
  };

  // WhatsApp Citizen Dispatch Link
  const handleNotifyCitizenWhatsApp = (job: ReportItem, customText?: string) => {
    const text = customText || `Hello ${job.reporterName}, this is the Municipal Operations Field Crew regarding your report (${job.id}: ${job.title}). Current status: *${job.status}*. Address: ${job.locationAddress}.`;
    openWhatsApp(job.reporterPhone || "", text);
  };

  // Add Spares / Material Item
  const handleAddMaterial = () => {
    if (!newMaterialName.trim()) return;
    setMaterials([
      ...materials,
      {
        id: `MAT-${Date.now()}`,
        item: newMaterialName.trim(),
        quantity: Math.max(1, newMaterialQty),
      },
    ]);
    setNewMaterialName("");
    setNewMaterialQty(1);
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  // Finalize Job & Close Work Order
  const handleCompleteWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob) return;

    setIsSubmittingLog(true);

    const materialsSummary = materials.length > 0
      ? materials.map((m) => `${m.quantity}x ${m.item}`).join(", ")
      : "None recorded";

    const updatedDescription = `${activeJob.description}\n\n[FIELD REPAIR LOG]: ${completionNotes || "Repair completed on-site."} | Requisitioned Spares: ${materialsSummary}`;

    try {
      const updated = await updateJobStatus(activeJob.id, "Resolved", updatedDescription);
      if (!updated) return;

      // Notify citizen via WhatsApp automatically
      const whatsappMsg = `Hello ${activeJob.reporterName}, Municipal Field Crew ${activeJob.assignedDepotUnit} has marked your ticket (${activeJob.id}) as RESOLVED at ${activeJob.locationAddress}.\n\nWork Done: ${completionNotes || "Site repairs completed successfully."}`;
      handleNotifyCitizenWhatsApp(activeJob, whatsappMsg);

      setActiveJob(null);
      setMaterials([]);
      setCompletionNotes("");
    } catch (err) {
      console.error("Failed to submit work log:", err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Filter Jobs
  const filteredJobs = reports.filter((job) => {
    const matchesDepot = selectedDepot === "ALL UNITS" || job.assignedDepotUnit === selectedDepot;
    
    let matchesStatus = true;
    if (statusFilter === "ACTIVE") {
      matchesStatus = job.status !== "Resolved";
    } else if (statusFilter === "RESOLVED") {
      matchesStatus = job.status === "Resolved";
    }

    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.locationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.reporterName && job.reporterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.accountNumber && job.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDepot && matchesStatus && matchesSearch;
  });

  const activeCount = reports.filter((r) => r.status !== "Resolved").length;
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] pb-28 sm:pb-32 pt-3 sm:pt-5 px-3 sm:px-6 lg:px-10 max-w-[1920px] mx-auto space-y-4 sm:space-y-6 selection:bg-teal-500/30 selection:text-teal-200">
      {/* Ambient background matching Dashboard */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      {/* HEADER MATCHING DASHBOARD STYLE */}
      <header className="glass-header flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="feature-icon feature-civic shrink-0">
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-teal-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-semibold tracking-[0.15em] sm:tracking-[0.2em] text-white truncate">
                FIELD CREW OPERATIONS
              </h1>
            </div>
            <p className="mt-0.5 text-[8px] sm:text-[9px] tracking-[0.12em] sm:tracking-[0.15em] text-muted truncate">
              ARTISAN WORK ORDER &amp; REQUISITION PORTAL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleManualRefresh}
            title="Refresh Feed"
            className="glass-action px-2.5 sm:px-3 py-1.5 text-xs text-teal-400 border-teal-500/30 hover:bg-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Sync System</span>
          </button>
        </div>
      </header>

      {reportSyncError && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          Report feed unavailable: {reportSyncError}
        </p>
      )}

      {/* DEPOT UNIT SELECTOR PANEL */}
      <div className="glass-panel p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
        <label className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold block">
          Active Municipal Crew Unit
        </label>
        <select
          value={selectedDepot}
          onChange={(e) => setSelectedDepot(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/50 cursor-pointer"
        >
          {DEPOT_UNITS.map((unit) => (
            <option key={unit} value={unit} className="bg-neutral-900 text-white">
              {unit}
            </option>
          ))}
        </select>
      </div>

      {/* METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        <div className="glass-panel p-4 sm:p-5 relative">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow text-amber-400">ACTIVE ASSIGNMENTS</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{activeCount}</span>
            <span className="text-[11px] sm:text-xs text-muted block mt-0.5">Awaiting On-Site Fix</span>
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-5 relative">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow text-teal-400">RESOLVED TODAY</span>
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{resolvedCount}</span>
            <span className="text-[11px] sm:text-xs text-muted block mt-0.5">Completed Work Orders</span>
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-5 relative">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow text-cyan-400">TOTAL WORK ORDERS</span>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{reports.length}</span>
            <span className="text-[11px] sm:text-xs text-muted block mt-0.5">Assigned to Unit</span>
          </div>
        </div>
      </div>

      {/* SEARCH & STATUS TABS */}
      <div className="glass-panel p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-teal-400 shrink-0" />
            <input
              type="text"
              placeholder="Search work order #, stand, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent w-full text-xs text-white focus:outline-none placeholder:text-muted"
            />
          </div>

          <div className="flex items-center justify-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "ACTIVE"
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                  : "text-muted hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("RESOLVED")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "RESOLVED"
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                  : "text-muted hover:text-white"
              }`}
            >
              Closed
            </button>
          </div>
        </div>
      </div>

      {/* WORK ORDER QUEUE LIST */}
      <div className="glass-panel p-4 sm:p-6 relative">
        <div className="panel-reflection" />

        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 gap-2">
          <h2 className="text-xs sm:text-base font-semibold text-white flex items-center gap-2 truncate">
            <ShieldAlert className="h-4 w-4 text-teal-400 shrink-0" /> <span className="truncate">Artisan Queue &amp; SLA Tracker</span>
          </h2>
          <span className="text-[11px] sm:text-xs font-mono text-teal-400 shrink-0">
            {filteredJobs.length} Jobs
          </span>
        </div>

        <div className="space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-10 text-muted text-xs">
              No work orders assigned to this unit matching your filters.
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 sm:p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-teal-400">{job.id}</span>
                    
                    {/* Category Badge */}
                    <span
                      className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                        job.category === "water"
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          : job.category === "power"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      }`}
                    >
                      {job.category}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                        job.status === "Resolved"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : job.status === "In Progress" || job.status === "On Site"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {job.status}
                    </span>

                    {/* Target Resolution SLA Badge */}
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-amber-300 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> SLA: {job.targetResolutionHours || 4}h
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white">{job.title}</h3>
                  <p className="text-[11px] sm:text-xs text-muted leading-relaxed line-clamp-2">{job.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-muted pt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-teal-300 font-mono truncate max-w-full">
                      <MapPin className="h-3 w-3 text-teal-400 shrink-0" /> {job.locationAddress}
                    </span>
                    {job.reporterName && (
                      <span className="flex items-center gap-1 text-white truncate">
                        <User className="h-3 w-3 text-teal-400 shrink-0" /> {job.reporterName}
                      </span>
                    )}
                  </div>
                </div>

                {/* STATUS UPDATE & ACTION CONTROLS */}
                <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveJob(job)}
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Inspect &amp; Spares</span>
                    <ChevronRight className="h-3.5 w-3.5 text-teal-400" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {job.status !== "Resolved" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateJobStatus(job.id, "On Site")}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            job.status === "On Site"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-white/5 text-muted hover:text-white border border-white/10"
                          }`}
                        >
                          On Site
                        </button>

                        <button
                          type="button"
                          onClick={() => updateJobStatus(job.id, "In Progress")}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            job.status === "In Progress"
                              ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                              : "bg-white/5 text-muted hover:text-white border border-white/10"
                          }`}
                        >
                          Progress
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleNotifyCitizenWhatsApp(job)}
                      title="WhatsApp Citizen"
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FIELD WORK ORDER & SPARES REQUISITION MODAL */}
      {activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-xl p-4 sm:p-6 relative border-teal-500/30 space-y-4 max-h-[92vh] overflow-y-auto my-auto rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="min-w-0">
                <span className="text-xs font-mono text-teal-400 font-bold">
                  {activeJob.id}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">{activeJob.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveJob(null)}
                className="text-muted hover:text-white cursor-pointer p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Incident Summary Fields */}
            <div className="space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-black/40 p-3.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Resident Contact</span>
                  <p className="text-white font-medium mt-0.5 flex items-center gap-1 truncate">
                    <User className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    {activeJob.reporterName} • {activeJob.reporterPhone}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleNotifyCitizenWhatsApp(activeJob)}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Message Citizen
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-3.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Municipal Account Number</span>
                  <p className="text-teal-300 font-mono font-medium mt-0.5 flex items-center gap-1 truncate">
                    <Hash className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    {activeJob.accountNumber || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Stand / Erf Number</span>
                  <p className="text-white font-medium mt-0.5 flex items-center gap-1 truncate">
                    <Home className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    {activeJob.standNumber || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">Full Address</span>
                <p className="text-white font-medium mt-0.5 flex items-center gap-1.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  <span className="truncate">{activeJob.locationAddress}</span>
                </p>
              </div>

              {/* Status Transition Buttons */}
              <div className="space-y-1 pt-1">
                <span className="text-muted block text-[10px] uppercase tracking-wider">Update Job Status</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateJobStatus(activeJob.id, "On Site")}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                      activeJob.status === "On Site"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-black/40 border-white/10 text-muted hover:text-white"
                    }`}
                  >
                    On Site
                  </button>
                  <button
                    type="button"
                    onClick={() => updateJobStatus(activeJob.id, "In Progress")}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                      activeJob.status === "In Progress"
                        ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                        : "bg-black/40 border-white/10 text-muted hover:text-white"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => updateJobStatus(activeJob.id, "Resolved")}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                      activeJob.status === "Resolved"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-black/40 border-white/10 text-muted hover:text-white"
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>

              {/* Log Spares & Materials Form */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Log Requisitioned Materials &amp; Spares
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 110mm PVC Coupling / Circuit Breaker"
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    value={newMaterialQty}
                    onChange={(e) => setNewMaterialQty(parseInt(e.target.value) || 1)}
                    className="w-14 bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs text-white text-center focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold hover:bg-teal-500/30 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {materials.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {materials.map((m) => (
                      <span
                        key={m.id}
                        className="text-[11px] bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white flex items-center gap-1.5"
                      >
                        {m.quantity}x {m.item}
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(m.id)}
                          className="text-muted hover:text-rose-400 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Log Form */}
              <form onSubmit={handleCompleteWorkOrder} className="pt-2 space-y-3">
                <div>
                  <label className="text-[10px] text-muted block mb-1">Artisan Repair &amp; Closeout Notes</label>
                  <textarea
                    rows={2}
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Provide details on the fix executed on-site..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveJob(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-muted text-xs hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingLog}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-xs hover:bg-teal-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{isSubmittingLog ? "Closing..." : "Finalize & Sign Off"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
