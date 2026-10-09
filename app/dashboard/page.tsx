"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  SlidersHorizontal,
  FileSpreadsheet,
  AlertOctagon,
  PhoneCall,
  X,
  ExternalLink,
} from "lucide-react";

interface ReportItem {
  id: string;
  category: "water" | "power" | "roads" | "civic";
  title: string;
  description: string;
  locationAddress: string;
  status: "Auto-Dispatched" | "Pending Review" | "Resolved";
  time: string;
  ward?: string;
  priority?: "High" | "Medium" | "Low" | "Critical";
  reporterPhone?: string;
  assignedDepotUnit?: string;
  estimatedFixTime?: string;
  coords?: { lat: number; lng: number };
}

// Initial dataset structured around Msunduzi Municipal Wards
const INITIAL_REPORTS: ReportItem[] = [
  {
    id: "RPT-101",
    category: "water",
    title: "Burst Water Main",
    description: "Severe leak flooding roadway and affecting water pressure.",
    locationAddress: "Chief Albert Luthuli St, Pietermaritzburg",
    ward: "Ward 26 (CBD / Central)",
    priority: "Critical",
    status: "Auto-Dispatched",
    time: "Today, 10:14 SAST",
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
    locationAddress: "Dr Chota Motala Rd, Raisethorpe",
    ward: "Ward 28 (Raisethorpe / Newholme)",
    priority: "High",
    status: "Pending Review",
    time: "Today, 09:48 SAST",
    reporterPhone: "+27 83 987 6543",
    assignedDepotUnit: "Electricity Depot - Unit B",
    estimatedFixTime: "6 Hours",
    coords: { lat: -29.5823, lng: 30.4021 },
  },
  {
    id: "RPT-103",
    category: "roads",
    title: "Deep Stormwater Pothole",
    description: "Hazardous road crater causing vehicle rim damage.",
    locationAddress: "Durban Rd, Scottsville",
    ward: "Ward 33 (Scottsville / University)",
    priority: "Medium",
    status: "Pending Review",
    time: "Today, 09:12 SAST",
    reporterPhone: "+27 81 555 0192",
    assignedDepotUnit: "Roads & Stormwater Unit #12",
    estimatedFixTime: "24 Hours",
    coords: { lat: -29.6152, lng: 30.3951 },
  },
  {
    id: "RPT-104",
    category: "water",
    title: "Low Water Pressure",
    description: "Feed pressure dropped below 1.2 Bar across residential line.",
    locationAddress: "Greytown Rd, Northern Areas",
    ward: "Ward 30 (Northdale / Woodlands)",
    priority: "Low",
    status: "Resolved",
    time: "Today, 08:30 SAST",
    reporterPhone: "+27 84 222 3344",
    assignedDepotUnit: "Water Maintenance Crew #2",
    estimatedFixTime: "Completed",
    coords: { lat: -29.5631, lng: 30.3982 },
  },
];

export default function MunicipalDashboardPage() {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [selectedWard, setSelectedWard] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeReportDetail, setActiveReportDetail] = useState<ReportItem | null>(null);

  // Sync state from LocalStorage & BroadcastChannel
  useEffect(() => {
    try {
      const saved = localStorage.getItem("resigrid_active_reports");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReports(parsed);
        }
      } else {
        localStorage.setItem("resigrid_active_reports", JSON.stringify(INITIAL_REPORTS));
      }
    } catch (err) {
      console.error("Failed to load initial storage:", err);
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
            
            const timestamp = new Date().toLocaleTimeString("en-ZA", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const updatedReport: ReportItem = {
              ...payload,
              ward: payload.ward || "Ward 26 (CBD / Central)",
              priority: payload.priority || "High",
              reporterPhone: payload.reporterPhone || "Citizen Portal Log",
              assignedDepotUnit: payload.assignedDepotUnit || "Depot Triage Assigned",
              estimatedFixTime: payload.estimatedFixTime || "TBD",
              time: payload.time || `Today, ${timestamp} SAST`,
            };

            const updated = [updatedReport, ...prev];
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
          console.error("Error parsing sync storage:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Update Status & Broadcast Back to Resident App Pages
  const updateReportStatus = (reportId: string, newStatus: "Auto-Dispatched" | "Pending Review" | "Resolved") => {
    const updatedReports = reports.map((item) =>
      item.id === reportId ? { ...item, status: newStatus } : item
    );

    setReports(updatedReports);
    localStorage.setItem("resigrid_active_reports", JSON.stringify(updatedReports));

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("resigrid_reports_dispatch");
      bc.postMessage({
        type: "STATUS_UPDATE",
        payload: { id: reportId, status: newStatus },
      });
      bc.close();
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      try {
        const saved = localStorage.getItem("resigrid_active_reports");
        if (saved) setReports(JSON.parse(saved));
      } catch (err) {
        console.error("Refresh error:", err);
      }
      setIsRefreshing(false);
    }, 500);
  };

  // Filtered dataset calculation
  const filteredReports = reports.filter((item) => {
    const matchesWard = selectedWard === "ALL" || (item.ward && item.ward.includes(selectedWard));
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesPriority = selectedPriority === "ALL" || item.priority === selectedPriority;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesWard && matchesCategory && matchesPriority && matchesSearch;
  });

  return (
    <main className="resigrid-shell min-h-screen w-full overflow-x-hidden text-[var(--text)] selection:bg-teal-500/30 selection:text-teal-200">
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1920px] space-y-6 px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">
        
        {/* HEADER */}
        <header className="glass-header flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="feature-icon feature-civic">
              <Building2 className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-[0.2em] text-white">
                  MUNICIPAL DISPATCH CONTROL
                </h1>
                <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[8px] font-medium tracking-[0.15em] text-teal-400">
                  MSUNDUZI DISTRICT MESH
                </span>
              </div>
              <p className="mt-0.5 text-[9px] tracking-[0.15em] text-muted">
                REAL-TIME WARD TRIAGE & CREW DEPLOYMENT DASHBOARD
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              title="Refresh Feed"
              className="glass-action px-3 py-1.5 text-xs text-teal-400 border-teal-500/30 hover:bg-teal-500/20 transition-all flex items-center gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Sync System</span>
            </button>
          </div>
        </header>

        {/* METRICS & WARD OVERVIEW */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel p-5 relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow text-teal-400">TOTAL DISPATCHES</span>
              <Building2 className="h-4 w-4 text-teal-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-white">{reports.length}</span>
              <span className="text-xs text-muted block mt-0.5">Across All Municipal Wards</span>
            </div>
          </div>

          <div className="glass-panel p-5 relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow text-amber-400">PENDING CREW REVIEW</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-white">
                {reports.filter((r) => r.status === "Pending Review").length}
              </span>
              <span className="text-xs text-muted block mt-0.5">Awaiting Triage Confirmation</span>
            </div>
          </div>

          <div className="glass-panel p-5 relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow text-teal-400">DISPATCHED CREWS</span>
              <UserCheck className="h-4 w-4 text-teal-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-white">
                {reports.filter((r) => r.status === "Auto-Dispatched").length}
              </span>
              <span className="text-xs text-muted block mt-0.5">Active Depot Work Orders</span>
            </div>
          </div>

          <div className="glass-panel p-5 relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow text-cyan-400">RESOLVED TODAY</span>
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="my-2">
              <span className="text-3xl font-extrabold text-white">
                {reports.filter((r) => r.status === "Resolved").length}
              </span>
              <span className="text-xs text-muted block mt-0.5">Confirmed Repairs</span>
            </div>
          </div>
        </div>

        {/* SEARCH & WARD FILTER CONTROLS */}
        <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md bg-black/40 border border-white/10 rounded-xl px-3.5 py-2">
            <Search className="h-4 w-4 text-teal-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, street address, or issue..."
              className="bg-transparent w-full text-xs text-white focus:outline-none placeholder:text-muted"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-xs text-muted">Ward:</span>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50"
              >
                <option value="ALL">All Municipal Wards</option>
                <option value="Ward 26">Ward 26 (CBD / Central)</option>
                <option value="Ward 28">Ward 28 (Raisethorpe)</option>
                <option value="Ward 30">Ward 30 (Northdale)</option>
                <option value="Ward 33">Ward 33 (Scottsville)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <AlertOctagon className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-xs text-muted">Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50"
              >
                <option value="ALL">All Urgency Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-xs text-muted">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50"
              >
                <option value="ALL">All Categories</option>
                <option value="water">Water & Sanitation</option>
                <option value="power">Electricity & Power</option>
                <option value="roads">Roads & Stormwater</option>
                <option value="civic">Civic / Infrastructure</option>
              </select>
            </div>
          </div>
        </div>

        {/* INCIDENT TABLE AND WARD MANAGEMENT */}
        <div className="glass-panel p-6 relative">
          <div className="panel-reflection" />

          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-teal-400" /> Municipal Ward Incident Queue
            </h2>
            <span className="text-xs font-mono text-teal-400">
              {filteredReports.length} Reports Listed
            </span>
          </div>

          <div className="space-y-3">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12 text-muted text-xs">
                No incident reports matched the selected ward or category filters.
              </div>
            ) : (
              filteredReports.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-teal-400">{item.id}</span>
                      <span
                        className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                          item.category === "water"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            : item.category === "power"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : item.category === "roads"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                        }`}
                      >
                        {item.category}
                      </span>
                      <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white font-medium">
                        {item.ward || "Ward 26 (CBD / Central)"}
                      </span>
                      {item.priority && (
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            item.priority === "Critical"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : item.priority === "High"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                          }`}
                        >
                          {item.priority} Urgency
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{item.description}</p>

                    <div className="flex items-center gap-4 text-[11px] text-muted pt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-teal-300 font-mono">
                        <MapPin className="h-3 w-3 text-teal-400" /> {item.locationAddress}
                      </span>
                      <span>• {item.time}</span>
                      {item.assignedDepotUnit && (
                        <span className="text-muted font-mono text-[10px]">
                          [Unit: {item.assignedDepotUnit}]
                        </span>
                      )}
                    </div>
                  </div>

                  {/* STATUS UPDATE & INSPECT CONTROLS */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 border-white/10 pt-3 md:pt-0 shrink-0 flex-wrap">
                    <button
                      onClick={() => setActiveReportDetail(item)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-teal-400" /> Inspect
                    </button>

                    <button
                      onClick={() => updateReportStatus(item.id, "Pending Review")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        item.status === "Pending Review"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-white/5 text-muted hover:text-white border border-white/10"
                      }`}
                    >
                      Pending
                    </button>

                    <button
                      onClick={() => updateReportStatus(item.id, "Auto-Dispatched")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        item.status === "Auto-Dispatched"
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                          : "bg-white/5 text-muted hover:text-white border border-white/10"
                      }`}
                    >
                      Dispatched
                    </button>

                    <button
                      onClick={() => updateReportStatus(item.id, "Resolved")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        item.status === "Resolved"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-white/5 text-muted hover:text-white border border-white/10"
                      }`}
                    >
                      Resolved
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* DETAILED MUNICIPAL INSPECTION MODAL */}
      {activeReportDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-lg p-6 relative border-teal-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-mono text-teal-400 font-bold">
                  {activeReportDetail.id}
                </span>
                <h3 className="text-sm font-bold text-white">
                  {activeReportDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveReportDetail(null)}
                className="text-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">
                  Full Location / Street Address
                </span>
                <p className="text-white font-medium mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-teal-400" />
                  {activeReportDetail.locationAddress}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">
                    Municipal Ward
                  </span>
                  <p className="text-white font-medium mt-0.5">
                    {activeReportDetail.ward || "Ward 26 (CBD / Central)"}
                  </p>
                </div>

                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">
                    Log Timestamp
                  </span>
                  <p className="text-white font-medium mt-0.5">
                    {activeReportDetail.time}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">
                    Assigned Depot Crew
                  </span>
                  <p className="text-teal-300 font-medium mt-0.5">
                    {activeReportDetail.assignedDepotUnit || "Depot Triage Unit"}
                  </p>
                </div>

                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">
                    Citizen Contact
                  </span>
                  <p className="text-white font-medium mt-0.5 flex items-center gap-1">
                    <PhoneCall className="h-3 w-3 text-teal-400" />
                    {activeReportDetail.reporterPhone || "Direct Log"}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">
                  Incident Description
                </span>
                <p className="text-muted leading-relaxed mt-0.5 bg-black/40 p-3 rounded-xl border border-white/5">
                  {activeReportDetail.description}
                </p>
              </div>

              {activeReportDetail.coords && (
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">
                    GPS Coordinates
                  </span>
                  <p className="text-xs font-mono text-teal-300 mt-0.5">
                    {activeReportDetail.coords.lat}, {activeReportDetail.coords.lng}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-end">
              <button
                onClick={() => setActiveReportDetail(null)}
                className="px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-xs hover:bg-teal-500/30 transition-all"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
