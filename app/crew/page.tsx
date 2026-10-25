"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Camera,
  FileText,
  Download,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { dispatchReportScreenNotification } from "@/lib/notifications/globalNotifications";
import { openWhatsApp } from "@/lib/phone";
import { formatReportTimestamp, getReportDisplayId, hasEstimatedFixTime, isCrewAssigned, mergeNearbyActiveReports, normalizeReportStatus, type ReportStatus } from "@/lib/reportUtils";

interface ReportItem {
  id: string;
  category: "water" | "power" | "other";
  title: string;
  description: string;
  locationAddress: string;
  status: ReportStatus;
  time: string;
  displayId: string;
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
  repairNotes?: string;
  impactCount: number;
  separateIncident?: boolean;
  photoUrls?: string[];
}

interface MaterialUsed {
  id: string;
  item: string;
  quantity: number;
}

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

// Comprehensive list of municipal units available for seamless switching without auth
const MUNICIPAL_UNITS = [
  "ALL UNITS",
  "Msunduzi Electricity & High Voltage - Unit 4",
  "Msunduzi Water Rapid Response - Unit 1",
  "Msunduzi Roads & Stormwater - Unit 2",
  "Unit Alpha - Rapid Infrastructure Response",
  "Unit Beta - Electrical Grid & Substation Repair",
  "Unit Gamma - Water Pipelines & Valve Maintenance",
  "Unit Delta - Roadways, Potholes & Stormwater",
  "Unit Omega - Emergency HAZMAT & Special Operations",
];

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
  const [activePanel, setActivePanel] = useState<"inspect" | "spares">("inspect");
  const [statusUpdateJob, setStatusUpdateJob] = useState<ReportItem | null>(null);
  const [pendingJobStatus, setPendingJobStatus] = useState<"On Site" | "In Progress" | "Resolved">("On Site");
  const [statusNotes, setStatusNotes] = useState("");
  const [resolvedJobModal, setResolvedJobModal] = useState<ReportItem | null>(null);
  const [reportSyncError, setReportSyncError] = useState("");

  // Material & Work Log Modal State
  const [materials, setMaterials] = useState<MaterialUsed[]>([]);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialQty, setNewMaterialQty] = useState(1);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [isSavingEstimatedFixTime, setIsSavingEstimatedFixTime] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetPhotoJobId, setTargetPhotoJobId] = useState<string | null>(null);

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

  // Fetch Assigned Field Jobs directly from Supabase (strictly filtering for dispatched reports assigned to crews)
  const fetchCrewJobs = async () => {
    try {
      let query = supabase
        .from("reports")
        .select("*")
        .not("assigned_depot", "is", null)
        .neq("assigned_depot", "")
        .neq("assigned_depot", "Unassigned Unit")
        .order("created_at", { ascending: false });

      // If a specific depot unit is selected (and not ALL UNITS), filter by it
      if (selectedDepot && selectedDepot !== "ALL UNITS") {
        query = query.eq("assigned_depot", selectedDepot);
      }

      const { data, error } = await query;

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

          let parsedPhotoUrls: string[] = [];
          try {
            if (row.photo_urls) {
              parsedPhotoUrls = typeof row.photo_urls === "string" ? JSON.parse(row.photo_urls) : row.photo_urls;
            }
          } catch (e) {
            parsedPhotoUrls = [];
          }

          return {
            id: row.report_id || `RPT-${row.id}`,
            displayId: getReportDisplayId(row.report_id, row.id),
            category: category,
            title: row.title || "Untitled Incident",
            description: row.description || "",
            locationAddress: row.location_address || "Unknown Location",
            status: normalizeReportStatus(row.status, row.assigned_depot),
            time: formatReportTimestamp(row.created_at) || row.time_str || "Today",
            province: row.province || "KwaZulu-Natal",
            municipality: row.municipality || "Pietermaritzburg (Msunduzi)",
            ward: row.ward || "Ward 26",
            reporterName: row.reporter_name || "Resident",
            reporterPhone: row.reporter_phone || "N/A",
            accountNumber: row.account_number || "N/A",
            standNumber: row.stand_number || "N/A",
            assignedDepotUnit: row.assigned_depot || "Unassigned Unit",
            estimatedFixTime: row.estimated_fix_time || "",
            targetResolutionHours: targetHours,
            createdTimestamp: createdAt,
            coords: Number.isFinite(row.latitude) && Number.isFinite(row.longitude)
              ? { lat: row.latitude, lng: row.longitude }
              : undefined,
            repairNotes: row.repair_notes || "",
            impactCount: row.impact_count || 1,
            separateIncident: row.separate_incident || false,
            photoUrls: parsedPhotoUrls,
          };
        });

        // Additional filter ensuring only genuinely dispatched reports are displayed
        const dispatchedOnly = formatted.filter((job) => isCrewAssigned(job.assignedDepotUnit));

        setReports(mergeNearbyActiveReports(dispatchedOnly));
        setReportSyncError("");
      }
    } catch (err) {
      console.error("Crew sync error:", err);
      setReportSyncError(err instanceof Error ? err.message : "Unknown report sync error.");
    }
  };

  useEffect(() => {
    void fetchCrewJobs();
    const refreshInterval = window.setInterval(() => {
      void fetchCrewJobs();
    }, 20000);

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");

      broadcastChannel.onmessage = (event) => {
        const { type } = event.data || {};
        if (type === "NEW_REPORT" || type === "STATUS_UPDATE" || type === "CREW_ASSIGNED") {
          void fetchCrewJobs();
        }
      };
    }

    return () => {
      window.clearInterval(refreshInterval);
      if (broadcastChannel) broadcastChannel.close();
    };
  }, [selectedDepot]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchCrewJobs();
    setIsRefreshing(false);
  };

  // Update Status directly in Supabase and Dispatch Sync
  const updateJobStatus = async (
    reportId: string,
    newStatus: ReportItem["status"],
    repairNotes?: string,
    photoUrls?: string[]
  ): Promise<boolean> => {
    const updatePayload: { status: ReportItem["status"]; repair_notes?: string; photo_urls?: string } = { status: newStatus };
    if (repairNotes !== undefined) {
      updatePayload.repair_notes = repairNotes;
    }
    if (photoUrls !== undefined) {
      updatePayload.photo_urls = JSON.stringify(photoUrls);
    }

    try {
      const { error } = await supabase
        .from("reports")
        .update(updatePayload)
        .eq("report_id", reportId);

      if (error) {
        console.error("Failed to update status in Supabase:", error);
        window.alert("Could not update this report in Supabase. Please retry.");
        return false;
      }

      setReports((prev) => prev.map((report) =>
        report.id === reportId ? { 
          ...report, 
          status: newStatus, 
          ...(repairNotes !== undefined ? { repairNotes } : {}),
          ...(photoUrls !== undefined ? { photoUrls } : {})
        } : report
      ));
      setActiveJob((current) => current?.id === reportId ? { 
        ...current, 
        status: newStatus, 
        ...(repairNotes !== undefined ? { repairNotes } : {}),
        ...(photoUrls !== undefined ? { photoUrls } : {})
      } : current);
      setResolvedJobModal((current) => current?.id === reportId ? { 
        ...current, 
        status: newStatus, 
        ...(repairNotes !== undefined ? { repairNotes } : {}),
        ...(photoUrls !== undefined ? { photoUrls } : {})
      } : current);
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

  const handlePhotoCaptureTrigger = (jobId: string) => {
    setTargetPhotoJobId(jobId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !targetPhotoJobId) return;
    const file = files[0];

    // Trigger local device download / save copy
    try {
      const localUrl = URL.createObjectURL(file);
      const downloadLink = document.createElement("a");
      downloadLink.href = localUrl;
      downloadLink.download = `work-order-${targetPhotoJobId}-${Date.now()}.jpg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (downloadErr) {
      console.error("Local device save error:", downloadErr);
    }

    setIsUploadingPhoto(targetPhotoJobId);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `crew-${targetPhotoJobId}-${Date.now()}.${fileExt}`;
      const filePath = `work-orders/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('reports-media')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        // Fallback to data URL if storage bucket isn't configured yet
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const targetJob = reports.find(r => r.id === targetPhotoJobId);
          const currentPhotos = targetJob?.photoUrls || [];
          const updatedPhotos = [...currentPhotos, base64data];
          await updateJobStatus(targetPhotoJobId, targetJob?.status || "In Progress", undefined, updatedPhotos);
          setIsUploadingPhoto(null);
          setTargetPhotoJobId(null);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('reports-media')
        .getPublicUrl(filePath);

      const targetJob = reports.find(r => r.id === targetPhotoJobId);
      const currentPhotos = targetJob?.photoUrls || [];
      const updatedPhotos = [...currentPhotos, publicUrl];
      await updateJobStatus(targetPhotoJobId, targetJob?.status || "In Progress", undefined, updatedPhotos);
    } catch (err) {
      console.error("Photo upload exception:", err);
      window.alert("Failed to upload photo attachment.");
    } finally {
      setIsUploadingPhoto(null);
      setTargetPhotoJobId(null);
      if (e.target) e.target.value = '';
    }
  };

  const saveEstimatedFixTime = async () => {
    const estimatedFixTime = activeJob?.estimatedFixTime?.trim();
    if (!activeJob || !estimatedFixTime) {
      window.alert("Enter an estimated fix time before saving.");
      return;
    }
    setIsSavingEstimatedFixTime(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({ estimated_fix_time: estimatedFixTime })
        .eq("report_id", activeJob.id);

      if (error) throw error;

      setReports((prev) => prev.map((report) =>
        report.id === activeJob.id ? { ...report, estimatedFixTime } : report
      ));
      setActiveJob((current) => current?.id === activeJob.id
        ? { ...current, estimatedFixTime }
        : current
      );
    } catch (err) {
      console.error("Estimated fix time update error:", err);
      window.alert("Could not save the estimated fix time in Supabase. Please retry.");
    } finally {
      setIsSavingEstimatedFixTime(false);
    }
  };

  // WhatsApp Citizen Dispatch Link
  const handleNotifyCitizenWhatsApp = (job: ReportItem, customText?: string) => {
    const text = customText || (job.status === "Resolved"
      ? `Hello ${job.reporterName}, this is the Municipal Operations Field Crew. Your report (${job.displayId}: ${job.title}) has been fixed at ${job.locationAddress}.`
      : `Hello ${job.reporterName}, this is the Municipal Operations Field Crew regarding your report (${job.displayId}: ${job.title}). Current status: *${job.status}*. Address: ${job.locationAddress}.`);
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

  const beginStatusUpdate = (job: ReportItem, status: "On Site" | "In Progress" | "Resolved") => {
    setStatusUpdateJob(job);
    setPendingJobStatus(status);
    setStatusNotes("");
  };

  const handleSubmitStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateJob) return;
    if (!statusNotes.trim()) {
      window.alert(pendingJobStatus === "Resolved" ? "Enter closeout notes before signing off." : "Enter repair notes before sending this update.");
      return;
    }

    setIsSubmittingLog(true);
    try {
      const noteLabel = pendingJobStatus === "Resolved" ? "Closeout notes" : `${pendingJobStatus} repair notes`;
      const repairNotes = [statusUpdateJob.repairNotes, `${noteLabel}: ${statusNotes.trim()}`]
        .filter(Boolean)
        .join("\n\n");
      const updated = await updateJobStatus(statusUpdateJob.id, pendingJobStatus, repairNotes);
      if (!updated) return;

      const message = pendingJobStatus === "Resolved"
        ? `Hello ${statusUpdateJob.reporterName}, Municipal Field Crew ${statusUpdateJob.assignedDepotUnit} has fixed your ticket (${statusUpdateJob.displayId}) at ${statusUpdateJob.locationAddress}.\n\nCloseout notes: ${statusNotes.trim()}`
        : `Hello ${statusUpdateJob.reporterName}, Municipal Field Crew updated your report (${statusUpdateJob.displayId}) to *${pendingJobStatus}* at ${statusUpdateJob.locationAddress}.\n\nRepair notes: ${statusNotes.trim()}`;
      handleNotifyCitizenWhatsApp(statusUpdateJob, message);
      setStatusUpdateJob(null);
      setStatusNotes("");
    } catch (err) {
      console.error("Failed to submit crew status and notes:", err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleSaveSpares = async () => {
    if (!activeJob) return;
    const materialsSummary = materials.length > 0
      ? `Materials used:\n${materials.map((material) => `- ${material.quantity}x ${material.item}`).join("\n")}`
      : "No spares required.";
    const repairNotes = [activeJob.repairNotes, materialsSummary].filter(Boolean).join("\n\n");
    setIsSubmittingLog(true);
    try {
      if (await updateJobStatus(activeJob.id, activeJob.status, repairNotes)) {
        setActiveJob(null);
        setMaterials([]);
      }
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
      {/* Hidden file input for native camera / image capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUploadChange}
      />

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
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-teal-400" style={{ color: accentColor }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-semibold tracking-[0.15em] sm:tracking-[0.2em] text-white truncate">
                FIELD CREW OPERATIONS
              </h1>
            </div>
            <p className="mt-0.5 text-[8px] sm:text-[9px] tracking-[0.12em] sm:tracking-[0.15em] text-muted truncate">
              WORK ORDERS &amp; FLEET DISPATCH
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleManualRefresh}
            title="Refresh Feed"
            className="glass-action px-2.5 sm:px-3 py-1.5 text-xs text-teal-400 border-teal-500/30 hover:bg-teal-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} style={{ color: accentColor }} />
            <span className="hidden sm:inline">Sync System</span>
          </button>
        </div>
      </header>

      {reportSyncError && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          Report feed unavailable: {reportSyncError}
        </p>
      )}

      {/* Unit Selector - No authentication required, view and switch any unit seamlessly */}
      <div className="glass-panel p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
        <label className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold block" style={{ color: accentColor }}>
          Crew Unit
        </label>
        <select
          value={selectedDepot}
          onChange={(e) => setSelectedDepot(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
        >
          {MUNICIPAL_UNITS.map((unit) => (
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
            <span className="eyebrow text-teal-400" style={{ color: accentColor }}>ACTIVE ASSIGNMENTS</span>
            <Clock className="h-4 w-4 text-teal-400" style={{ color: accentColor }} />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{activeCount}</span>
            <span className="text-[11px] sm:text-xs text-muted block mt-0.5">Awaiting On-Site Fix</span>
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-5 relative">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow text-teal-400" style={{ color: accentColor }}>RESOLVED TODAY</span>
            <CheckCircle2 className="h-4 w-4 text-teal-400" style={{ color: accentColor }} />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{resolvedCount}</span>
            <span className="text-[11px] sm:text-xs text-muted block mt-0.5">Completed Work Orders</span>
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-5 relative">
          <div className="panel-reflection" />
          <div className="flex items-center justify-between">
            <span className="eyebrow text-teal-400" style={{ color: accentColor }}>TOTAL WORK ORDERS</span>
            <Building2 className="h-4 w-4 text-teal-400" style={{ color: accentColor }} />
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{reports.length}</span>
            <span className="text-[11px] sm:text-xs text-muted block mt-0.5">Supabase Database Queue</span>
          </div>
        </div>
      </div>

      {/* SEARCH & STATUS TABS */}
      <div className="glass-panel p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-teal-400 shrink-0" style={{ color: accentColor }} />
            <input
              type="text"
              placeholder="Search work order, stand, address..."
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
            <ShieldAlert className="h-4 w-4 text-teal-400 shrink-0" style={{ color: accentColor }} /> <span className="truncate">Dispatched Incident Queue</span>
          </h2>
          <span className="text-[11px] sm:text-xs font-mono text-teal-400 shrink-0" style={{ color: accentColor }}>
            {filteredJobs.length} Jobs
          </span>
        </div>

        <div className="space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-10 text-muted text-xs">
              No dispatched work orders found in Supabase matching your filters.
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 sm:p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-teal-400" style={{ color: accentColor }}>{job.displayId}</span>
                    
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
                    {hasEstimatedFixTime(job.estimatedFixTime) && (
                      <span className="text-[10px] bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded text-teal-300 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" style={{ color: accentColor }} /> Fix: {job.estimatedFixTime}
                      </span>
                    )}
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/80 font-medium">
                      {job.impactCount} {job.impactCount === 1 ? "Resident Affected" : "Residents Affected"}
                    </span>
                    {job.photoUrls && job.photoUrls.length > 0 && (
                      <span className="text-[10px] bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded text-teal-300 font-medium flex items-center gap-1">
                        <Camera className="w-3 h-3" style={{ color: accentColor }} /> {job.photoUrls.length} {job.photoUrls.length === 1 ? "Photo" : "Photos"}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white">{job.title}</h3>
                  <p className="text-[11px] sm:text-xs text-muted leading-relaxed line-clamp-2">{job.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-muted pt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-teal-300 font-mono truncate max-w-full" style={{ color: accentColor }}>
                      <MapPin className="h-3 w-3 text-teal-400 shrink-0" style={{ color: accentColor }} /> {job.locationAddress}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" /> Logged {job.time}
                    </span>
                    {job.reporterName && (
                      <span className="flex items-center gap-1 text-white truncate">
                        <User className="h-3 w-3 text-teal-400 shrink-0" style={{ color: accentColor }} /> {job.reporterName}
                      </span>
                    )}
                  </div>
                </div>

                {/* STATUS UPDATE & ACTION CONTROLS */}
                <div className="flex flex-col items-start gap-2 border-t border-white/10 pt-3">
                  {job.status === "Resolved" ? (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => setResolvedJobModal(job)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>View Completed Work Order</span>
                        <ChevronRight className="h-3.5 w-3.5 text-teal-400" style={{ color: accentColor }} />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveJob(job);
                          setActivePanel("inspect");
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="h-3.5 w-3.5" style={{ color: accentColor }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveJob(job);
                          setActivePanel("spares");
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Spares</span>
                        <Package className="h-3.5 w-3.5" style={{ color: accentColor }} />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 w-full sm:flex sm:flex-wrap">
                    {(["On Site", "In Progress", "Resolved"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => beginStatusUpdate(job, status)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-center ${
                          job.status === status
                            ? status === "Resolved"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                            : "bg-white/5 text-muted hover:text-white border border-white/10"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                    {job.status !== "Resolved" && (
                      <button
                        type="button"
                        onClick={() => handlePhotoCaptureTrigger(job.id)}
                        disabled={isUploadingPhoto === job.id}
                        title="Take / Attach Photo"
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white/5 text-muted hover:text-white border border-white/10 transition-all cursor-pointer text-center flex items-center justify-center gap-1 shrink-0 disabled:opacity-50"
                      >
                        <Camera className="h-3.5 w-3.5 text-teal-400" style={{ color: accentColor }} />
                        <span>{isUploadingPhoto === job.id ? "Saving..." : "Snap Photo"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ACTIVE FIELD WORK ORDER & SPARES REQUISITION MODAL */}
      {activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-sm p-4 relative border-teal-500/30 space-y-2.5 max-h-[90vh] overflow-y-auto my-auto rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="min-w-0 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-teal-400" style={{ color: accentColor }} />
                <h3 className="text-xs font-bold text-white">{activePanel === "inspect" ? "Inspect Work Order" : "Requisition Spares"}</h3>
              </div>
            </div>

            {/* Incident Summary Fields */}
            <div className="space-y-2 text-xs">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                <span className="text-muted text-[9px] uppercase">Work Order ID</span>
                <p className="text-teal-400 font-bold font-mono" style={{ color: accentColor }}>{activeJob.displayId}</p>
                <p className="text-white text-xs font-medium mt-1">{activeJob.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-muted block text-[9px] uppercase tracking-wider">Resident Contact</span>
                  <p className="text-white font-medium mt-0.5 truncate">{activeJob.reporterName}</p>
                  <p className="text-[10px] text-teal-400" style={{ color: accentColor }}>{activeJob.reporterPhone}</p>
                </div>
                <div>
                  <span className="text-muted block text-[9px] uppercase tracking-wider">Account / Stand</span>
                  <p className="text-white font-medium mt-0.5">{activeJob.accountNumber || "N/A"}</p>
                  <p className="text-[10px] text-muted">Stand: {activeJob.standNumber || "N/A"}</p>
                </div>
              </div>

              <div>
                <span className="text-muted block text-[9px] uppercase tracking-wider">Exact Location / Address</span>
                <p className="text-white font-medium mt-0.5 flex items-center gap-1 bg-black/30 p-2 rounded-xl border border-white/5 truncate">
                  <MapPin className="h-3 w-3 text-teal-400 shrink-0" style={{ color: accentColor }} />
                  <span className="truncate">{activeJob.locationAddress}</span>
                </p>
              </div>

              {activePanel === "inspect" && <div className="space-y-1">
                <span className="text-muted block text-[9px] uppercase tracking-wider">Estimated Fix Time</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activeJob.estimatedFixTime || ""}
                    onChange={(event) => setActiveJob({ ...activeJob, estimatedFixTime: event.target.value })}
                    placeholder="e.g. 2 hours"
                    className="min-w-0 flex-1 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={saveEstimatedFixTime}
                    disabled={isSavingEstimatedFixTime}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-xs disabled:opacity-50"
                  >
                    {isSavingEstimatedFixTime ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>}

              {/* Log Spares & Materials Form */}
              {activePanel === "spares" && <div className="space-y-1.5 pt-1 border-t border-white/10">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                  <Package className="h-3 w-3 text-teal-400" style={{ color: accentColor }} /> Requisition Materials &amp; Spares
                </span>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. 110mm PVC Coupling"
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    value={newMaterialQty}
                    onChange={(e) => setNewMaterialQty(parseInt(e.target.value) || 1)}
                    className="w-12 bg-black/40 border border-white/10 rounded-xl py-1.5 text-xs text-white text-center focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold hover:bg-teal-500/30 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {materials.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {materials.map((m) => (
                      <span
                        key={m.id}
                        className="text-[10px] bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white flex items-center gap-1"
                      >
                        {m.quantity}x {m.item}
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(m.id)}
                          className="text-muted hover:text-rose-400 cursor-pointer"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>}

              <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveJob(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-muted text-xs hover:text-white transition-all cursor-pointer"
                >
                  Close
                </button>
                {activePanel === "inspect" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const accepted = await updateJobStatus(activeJob.id, "On Site");
                      if (accepted) setActiveJob(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-xs hover:bg-teal-500/30 transition-all cursor-pointer shadow-lg flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>Accept Job</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSaveSpares()}
                    disabled={isSubmittingLog}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-xs hover:bg-teal-500/30 transition-all cursor-pointer shadow-lg flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>{isSubmittingLog ? "Saving..." : "Save"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {statusUpdateJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
          <form onSubmit={handleSubmitStatusUpdate} className="glass-panel w-full max-w-sm p-4 space-y-3 rounded-2xl border border-teal-500/30">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <Wrench className="h-4 w-4" style={{ color: accentColor }} />
              <h3 className="text-sm font-bold text-white">
                {pendingJobStatus === "Resolved" ? "Closeout Notes & Sign Off" : `${pendingJobStatus} Repair Notes`}
              </h3>
            </div>
            <p className="text-xs text-muted">{statusUpdateJob.displayId} · {statusUpdateJob.title}</p>
            <textarea
              rows={5}
              required
              value={statusNotes}
              onChange={(event) => setStatusNotes(event.target.value)}
              placeholder={pendingJobStatus === "Resolved" ? "Describe the completed fix and closeout..." : "Describe the repair work or site update..."}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setStatusUpdateJob(null)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted hover:text-white">
                Cancel
              </button>
              <button type="submit" disabled={isSubmittingLog} className="rounded-xl border border-teal-500/30 bg-teal-500/20 px-3 py-2 text-xs font-semibold text-teal-300 disabled:opacity-50">
                {isSubmittingLog ? "Saving..." : pendingJobStatus === "Resolved" ? "Sign Off & WhatsApp" : "Send Update & WhatsApp"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESOLVED / CLOSED WORK ORDER HISTORY MODAL */}
      {resolvedJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-sm p-4 relative border-teal-500/30 space-y-2.5 max-h-[90vh] overflow-y-auto my-auto rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="min-w-0 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white">Completed Work Order History</h3>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                <span className="text-muted text-[9px] uppercase">Work Order ID</span>
                <p className="text-teal-400 font-bold font-mono" style={{ color: accentColor }}>{resolvedJobModal.displayId}</p>
                <p className="text-white text-xs font-medium mt-1">{resolvedJobModal.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-muted block text-[9px] uppercase tracking-wider">Resident Contact</span>
                  <p className="text-white font-medium mt-0.5 truncate">{resolvedJobModal.reporterName}</p>
                  <p className="text-[10px] text-teal-400" style={{ color: accentColor }}>{resolvedJobModal.reporterPhone}</p>
                </div>
                <div>
                  <span className="text-muted block text-[9px] uppercase tracking-wider">Account / Stand</span>
                  <p className="text-white font-medium mt-0.5">{resolvedJobModal.accountNumber || "N/A"}</p>
                  <p className="text-[10px] text-muted">Stand: {resolvedJobModal.standNumber || "N/A"}</p>
                </div>
              </div>

              <div>
                <span className="text-muted block text-[9px] uppercase tracking-wider">Exact Location / Address</span>
                <p className="text-white font-medium mt-0.5 flex items-center gap-1 bg-black/30 p-2 rounded-xl border border-white/5 truncate">
                  <MapPin className="h-3 w-3 text-teal-400 shrink-0" style={{ color: accentColor }} />
                  <span className="truncate">{resolvedJobModal.locationAddress}</span>
                </p>
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-muted block text-[9px] uppercase tracking-wider font-bold">Repair &amp; Closeout Notes</span>
                <p className="text-white text-xs leading-relaxed whitespace-pre-line">{resolvedJobModal.repairNotes || "No repair notes recorded."}</p>
              </div>

              {/* Attached Photos Section */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <span className="text-muted block text-[9px] uppercase tracking-wider font-bold">Attached Site Photos ({resolvedJobModal.photoUrls?.length || 0})</span>
                {(!resolvedJobModal.photoUrls || resolvedJobModal.photoUrls.length === 0) ? (
                  <p className="text-[11px] text-muted italic">No photos attached to this completed work order.</p>
                ) : (
                  <div className="max-h-44 overflow-y-auto pr-1 space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {resolvedJobModal.photoUrls.map((url, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square bg-black/60">
                          <img src={url} alt={`Site photo ${index + 1}`} className="w-full h-full object-cover" />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={`work-order-${resolvedJobModal.displayId}-photo-${index + 1}.jpg`}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[10px] text-white font-semibold"
                          >
                            <Download className="w-3.5 h-3.5" /> View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolvedJobModal(null)}
                className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-muted text-xs hover:text-white transition-all cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
