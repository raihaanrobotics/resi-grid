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
  PhoneCall,
  X,
  User,
  Hash,
  Home,
  Wrench,
  MessageCircle,
  Send,
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
  coords?: { lat: number; lng: number };
}

const DEPOT_UNITS = [
  "Msunduzi Water Rapid Response - Unit 1",
  "Msunduzi Electricity & High Voltage - Unit 4",
  "Msunduzi Roads & Stormwater - Unit 2",
  "Edendale Service Center - Unit 3",
  "Northdale Infrastructure Depot - Unit 5",
];

// South African Provinces, Cities, and Wards Hierarchy Dataset
const SOUTH_AFRICAN_PROVINCES_CITIES_WARDS: Record<string, Record<string, string[]>> = {
  "KwaZulu-Natal": {
    "Pietermaritzburg (Msunduzi)": [
      "Ward 1: Phayiphini, Laduma, Komkhulu, Mbutshane, Ntokozweni, Kwamafindo, Mbuncwane, and Mpumuza",
      "Ward 2: KwaMbanjwa, Mkangala, Zayeka, Nadi, and Sweetwaters/Mbubu",
      "Ward 3: Gezubuso, Inadi, and parts of Sweetwaters",
      "Ward 4: KwaNxamalala, Mbubu, Taylor’s Halt, and surrounding rural communities",
      "Ward 5: Smero, Henley-on-Klip, and parts of Edendale",
      "Ward 6: Caluza, Mpumuza, and surrounding sectors of Edendale",
      "Ward 7: Willowfontein East, Khanya Village, and surrounding hillsides",
      "Ward 8: Machibisa, Dambuza, and central Edendale zones",
      "Ward 9: Harewood, Willowfontein West, and parts of the greater Edendale area",
      "Ward 10: Azalea, Imbali Unit 1, and Imbali Unit 2",
      "Ward 11: Imbali Unit 13, Unit 14, and Unit 15",
      "Ward 12: Imbali Stage 2, Unit 3, and Unit 4",
      "Ward 13: Imbali Unit BB, Unit CC, and parts of Unit J",
      "Ward 14: Imbali Unit 18, Unit 19, and Tindi Village",
      "Ward 15: Imbali Unit 14, Slangspruit, and surrounding informal settlements",
      "Ward 16: Ashdown, Buffer, and parts of Edendale",
      "Ward 17: France township, Ridge Park, and Unit H (Imbali)",
      "Ward 18: Grange, Westgate, Ridge Park, and Bisley Heights",
      "Ward 19: Pelham, Scottsville (West), Oribi, and the University of KwaZulu-Natal (UKZN) campus",
      "Ward 20: Camperdown side boundaries, Ashburton, Lynnfield Park, and Cleland",
      "Ward 21: Epworth, Hayfields, Lincoln Meade, and Bellevue",
      "Ward 22: Pietermaritzburg Central Business District (CBD Central), and central loops",
      "Ward 23: Signal Hill, Richmond Crest, and parts of the western CBD",
      "Ward 24: Napierville, Prestbury, Clarendon, and Wembley",
      "Ward 25: Montrose, Chase Valley, Woodlands, Oak Park, and Town Bush Valley",
      "Ward 26: Northern Park, Victoria Road areas, and parts of Woodlands",
      "Ward 27: Allandale, Raisethorpe, and Newholme",
      "Ward 28: Northdale (Sections including Bombay Heights, Springfields)",
      "Ward 29: Copesville, Swapo, and Jadeite sections",
      "Ward 30: Haniville, Claridge rural margins, and portions of upper Copesville",
      "Ward 31: Northdale (Lower blocks), Truro, and Dunveria",
      "Ward 32: Woodlands (Main extension), Glenwood, and mountain rises",
      "Ward 33: Manor, Sobantu (West), and the KwaJika Joe informal settlement",
      "Ward 34: Mountain Rise Industrial Area, Willowton, and parts of the inner city fringes",
      "Ward 35: Sobantu Township (Central and East), and adjacent community zones",
      "Ward 36: Imbali Unit 14 (Upper limits) and parts of greater Dambuza",
      "Ward 37: Greater Edendale Hospital areas and Georgetown",
      "Ward 38: Esigodini and upper regions of the Edendale valley corridor",
      "Ward 39: Plessisslaer, Imbali Unit AA, and lower Westgate buffers",
      "Ward 40: Whispers, Thembalihle, and newly expanded settlement nodes near the outer city boundary",
      "Ward 41: Khobonina, Vulindlela fringes, and deep traditional authorities flanking the western municipality rim",
    ],
    "Durban (eThekwini)": [
      "Ward 26 (Durban CBD / South Beach / North Beach)",
      "Ward 31 (Morningside / Glenwood / Musgrave)",
      "Ward 33 (Umhlanga / Durban North)",
      "Ward 73 (Phoenix / Verulam)",
      "Ward 75 (Chatsworth / Umlazi)",
    ],
    "Richards Bay (uMhlathuze)": [
      "Ward 1 (Arboretum / Meerensee)",
      "Ward 2 (CBD / Veldenvlei)",
      "Ward 4 (Brackenham)",
      "Ward 23 (Esikhaleni)",
    ],
  },
  "Gauteng": {
    "Johannesburg (City of Joburg)": [
      "Ward 23 (Auckland Park / Melville / Westdene)",
      "Ward 64 (Braamfontein / Newtown / Marshalltown)",
      "Ward 90 (Sandton / Rosebank / Hyde Park)",
      "Ward 117 (Randburg / Ferndale / Blairgowrie)",
      "Ward 126 (Roodepoort / Constantia Kloof)",
      "Ward 54 (Soweto / Diepkloof)",
      "Ward 29 (Soweto / Orlando West)",
    ],
    "Pretoria (Tshwane)": [
      "Ward 59 (Pretoria CBD / Arcadia / Sunnyside)",
      "Ward 57 (Hatfield / Brooklyn / Lynnwood)",
      "Ward 44 (Centurion / Lyttelton)",
      "Ward 16 (Pretoria North / Akasia)",
    ],
    "Ekurhuleni (East Rand)": [
      "Ward 20 (Kempton Park Central)",
      "Ward 32 (Benoni CBD)",
      "Ward 73 (Boksburg West)",
      "Ward 37 (Germiston Central)",
    ],
  },
  "Western Cape": {
    "Cape Town (City of Cape Town)": [
      "Ward 54 (Cape Town CBD / Green Point / Waterfront)",
      "Ward 115 (Sea Point / Camps Bay / Hout Bay)",
      "Ward 59 (Claremont / Rondebosch / Newlands)",
      "Ward 71 (Mitchells Plain / Strandfontein)",
      "Ward 108 (Khayelitsha / Harare)",
      "Ward 16 (Bellville / Durbanville)",
    ],
    "Stellenbosch": [
      "Ward 1 (Stellenbosch Central / Idas Valley)",
      "Ward 2 (Kayamandi)",
      "Ward 4 (Franschhoek)",
    ],
    "George": [
      "Ward 14 (George Central / Pacaltsdorp)",
      "Ward 16 (Heatherlands / Blanco)",
    ],
  },
  "Eastern Cape": {
    "Gqeberha (Nelson Mandela Bay)": [
      "Ward 5 (Central / Richmond Hill / Humewood)",
      "Ward 6 (Walmer / Springfield)",
      "Ward 8 (Summerstrand / Humewood)",
      "Ward 31 (Motherwell / New Brighton)",
    ],
    "East London (Buffalo City)": [
      "Ward 1 (Quigney / CBD)",
      "Ward 2 (Berea / Vincent)",
      "Ward 4 (Mdantsane)",
    ],
  },
  "Free State": {
    "Bloemfontein (Mangaung)": [
      "Ward 21 (Bloemfontein CBD / Westdene)",
      "Ward 15 (Universitas / Brandwag)",
      "Ward 48 (Botshabelo)",
      "Ward 40 (Thaba Nchu)",
    ],
  },
  "Mpumalanga": {
    "Nelspruit (Mbombela)": [
      "Ward 14 (Nelspruit CBD / West Acres)",
      "Ward 16 (Sonpark / Nelspruit Ext)",
      "Ward 30 (White River)",
    ],
    "Witbank (Emalahleni)": [
      "Ward 21 (Witbank Central / Tasbet Park)",
      "Ward 23 (Klarinet)",
    ],
  },
  "Limpopo": {
    "Polokwane": [
      "Ward 20 (Polokwane Central / Annadale)",
      "Ward 21 (Bendor / Fauna Park)",
      "Ward 10 (Seshego)",
    ],
  },
  "North West": {
    "Rustenburg": [
      "Ward 18 (Rustenburg CBD / Cashan)",
      "Ward 19 (Tlhabane)",
    ],
    "Mahikeng": [
      "Ward 12 (Mahikeng Central / Mmabatho)",
    ],
  },
  "Northern Cape": {
    "Kimberley (Sol Plaatje)": [
      "Ward 1 (Kimberley CBD / Belgravia)",
      "Ward 15 (Ritchie / Galeshewe)",
    ],
  },
};

export default function MunicipalDashboardPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("KwaZulu-Natal");
  const [selectedCity, setSelectedCity] = useState<string>("Pietermaritzburg (Msunduzi)");
  const [selectedWard, setSelectedWard] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeReportDetail, setActiveReportDetail] = useState<ReportItem | null>(null);

  // Crew Assignment Modal State
  const [assigningJob, setAssigningJob] = useState<ReportItem | null>(null);
  const [selectedCrewUnit, setSelectedCrewUnit] = useState<string>(DEPOT_UNITS[0]);

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    const citiesInProv = SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[province] || {};
    const firstCity = Object.keys(citiesInProv)[0] || "";
    setSelectedCity(firstCity);
    setSelectedWard("ALL");
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedWard("ALL");
  };

  const fetchSupabaseReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching reports from Supabase:", error);
        return;
      }

      if (data) {
        const formattedReports: ReportItem[] = data.map((row: any) => ({
          id: row.report_id || `RPT-${row.id}`,
          category: row.category || "water",
          title: row.title || "Untitled Incident",
          description: row.description || "",
          locationAddress: row.location_address || "Unknown Location",
          status: row.status || "Auto-Dispatched",
          time: row.time_str || "Today",
          province: row.province || "KwaZulu-Natal",
          municipality: row.municipality || "Pietermaritzburg (Msunduzi)",
          ward: row.ward || "Ward 26 (CBD / Central)",
          reporterName: row.reporter_name || "Anonymous",
          reporterPhone: row.reporter_phone || "N/A",
          accountNumber: row.account_number || "N/A",
          standNumber: row.stand_number || "N/A",
          assignedDepotUnit: row.assigned_depot || DEPOT_UNITS[0],
          estimatedFixTime: row.estimated_fix_time || "4 Hours Target",
          coords: row.latitude && row.longitude ? { lat: row.latitude, lng: row.longitude } : undefined,
        }));

        setReports(formattedReports);
      }
    } catch (err) {
      console.error("Supabase connection exception:", err);
    }
  };

  useEffect(() => {
    fetchSupabaseReports();

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");

      broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === "NEW_REPORT" || type === "STATUS_UPDATE" || type === "CREW_ASSIGNED") {
          fetchSupabaseReports();
        }
      };
    }

    return () => {
      if (broadcastChannel) broadcastChannel.close();
    };
  }, []);

  // Update Status & Sync with Supabase & BroadcastChannel
  const updateReportStatus = async (reportId: string, newStatus: ReportItem["status"]) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );

    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("report_id", reportId);

      if (error) {
        console.error("Failed to update status in Supabase:", error);
        return;
      }
      void dispatchReportScreenNotification(reportId);
    } catch (err) {
      console.error("Failed to update status in Supabase:", err);
      return;
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("resigrid_reports_dispatch");
      bc.postMessage({
        type: "STATUS_UPDATE",
        payload: { id: reportId, status: newStatus },
      });
      bc.close();
    }
  };

  // Assign Specific Crew Unit and Sync to Supabase & /crew portal
  const handleConfirmCrewAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningJob) return;

    try {
      const { error } = await supabase
        .from("reports")
        .update({
          assigned_depot: selectedCrewUnit,
          status: "Auto-Dispatched",
        })
        .eq("report_id", assigningJob.id);

      if (error) {
        console.error("Failed to assign crew in Supabase:", error);
        return;
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === assigningJob.id ? { ...r, assignedDepotUnit: selectedCrewUnit, status: "Auto-Dispatched" } : r
        )
      );

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("resigrid_reports_dispatch");
        bc.postMessage({
          type: "CREW_ASSIGNED",
          payload: { id: assigningJob.id, unit: selectedCrewUnit },
        });
        bc.close();
      }

      setAssigningJob(null);
    } catch (err) {
      console.error("Crew assignment exception:", err);
    }
  };

  // WhatsApp Dispatch Helper
  const handleWhatsAppNotify = (job: ReportItem) => {
    const text = `Hello ${job.reporterName}, Municipal Dispatch has assigned *${job.assignedDepotUnit}* to your report (${job.id}: ${job.title}) at ${job.locationAddress}. Status: *${job.status}*.`;
    openWhatsApp(job.reporterPhone || "", text);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchSupabaseReports();
    setIsRefreshing(false);
  };

  const currentCities = SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[selectedProvince] || {};
  const currentWards = currentCities[selectedCity] || [];

  const filteredReports = reports.filter((item) => {
    const matchesProvince = !item.province || item.province === selectedProvince;
    const matchesMunicipality = !item.municipality || item.municipality === selectedCity;
    const matchesWard = selectedWard === "ALL" || (item.ward && item.ward.includes(selectedWard.split(":")[0]));
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reporterName && item.reporterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.accountNumber && item.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesProvince && matchesMunicipality && matchesWard && matchesCategory && matchesSearch;
  });

  return (
    <main className="resigrid-shell min-h-screen w-full overflow-x-hidden text-[var(--text)] pb-28 pt-4 px-3 sm:px-6 lg:px-10 max-w-[1920px] mx-auto space-y-5 selection:bg-teal-500/30 selection:text-teal-200">
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 space-y-6">
        
        {/* HEADER */}
        <header className="glass-header flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="feature-icon feature-civic">
              <Building2 className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white">
                  MUNICIPAL DISPATCH CONTROL
                </h1>
              </div>
              <p className="mt-0.5 text-[8px] sm:text-[9px] tracking-[0.15em] text-muted">
                REAL-TIME WARD TRIAGE &amp; CREW DEPLOYMENT DASHBOARD
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              title="Refresh Feed"
              className="glass-action px-3 py-1.5 text-xs text-teal-400 border-teal-500/30 hover:bg-teal-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync System</span>
            </button>
          </div>
        </header>

        {/* METRICS & WARD OVERVIEW */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel p-4 sm:p-5 relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow text-teal-400">TOTAL DISPATCHES</span>
              <Building2 className="h-4 w-4 text-teal-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{reports.length}</span>
              <span className="text-xs text-muted block mt-0.5">Across All Municipal Wards</span>
            </div>
          </div>

          <div className="glass-panel p-4 sm:p-5 relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow text-amber-400">PENDING CREW REVIEW</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {reports.filter((r) => r.status === "Pending Review").length}
              </span>
              <span className="text-xs text-muted block mt-0.5">Awaiting Triage Confirmation</span>
            </div>
          </div>

          <div className="glass-panel p-4 sm:p-5 relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow text-teal-400">DISPATCHED CREWS</span>
              <UserCheck className="h-4 w-4 text-teal-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {reports.filter((r) => r.status === "Auto-Dispatched").length}
              </span>
              <span className="text-xs text-muted block mt-0.5">Active Depot Work Orders</span>
            </div>
          </div>

          <div className="glass-panel p-4 sm:p-5 relative">
            <div className="panel-reflection" />
            <div className="flex items-center justify-between">
              <span className="eyebrow text-cyan-400">RESOLVED TODAY</span>
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {reports.filter((r) => r.status === "Resolved").length}
              </span>
              <span className="text-xs text-muted block mt-0.5">Confirmed Repairs</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md bg-black/40 border border-white/10 rounded-xl px-3.5 py-2">
              <Search className="h-4 w-4 text-teal-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, name, account number, or street..."
                className="bg-transparent w-full text-xs text-white focus:outline-none placeholder:text-muted"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                <SlidersHorizontal className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span className="text-xs text-muted">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50 w-full md:w-auto cursor-pointer"
                >
                  <option value="ALL" className="bg-neutral-900 text-white">All Categories</option>
                  <option value="water" className="bg-neutral-900 text-white">Water & Sanitation</option>
                  <option value="power" className="bg-neutral-900 text-white">Electricity & Power</option>
                  <option value="other" className="bg-neutral-900 text-white">Other Infrastructure</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted shrink-0">Province:</span>
              <select
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50 w-full cursor-pointer"
              >
                {Object.keys(SOUTH_AFRICAN_PROVINCES_CITIES_WARDS).map((prov) => (
                  <option key={prov} value={prov} className="bg-neutral-900 text-white">
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted shrink-0">Municipality:</span>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50 w-full cursor-pointer"
              >
                {Object.keys(currentCities).map((city) => (
                  <option key={city} value={city} className="bg-neutral-900 text-white">
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span className="text-xs text-muted shrink-0">Ward:</span>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500/50 w-full cursor-pointer"
              >
                <option value="ALL" className="bg-neutral-900 text-white">All Municipal Wards</option>
                {currentWards.map((ward) => (
                  <option key={ward} value={ward} className="bg-neutral-900 text-white">
                    {ward}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* INCIDENT TABLE AND WARD MANAGEMENT */}
        <div className="glass-panel p-4 sm:p-6 relative">
          <div className="panel-reflection" />

          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 gap-2">
            <h2 className="text-xs sm:text-base font-semibold text-white flex items-center gap-2 truncate">
              <ShieldAlert className="h-4 w-4 text-teal-400 shrink-0" /> <span className="truncate">Municipal Ward Incident Queue</span>
            </h2>
            <span className="text-xs font-mono text-teal-400 shrink-0">
              {filteredReports.length} Reports
            </span>
          </div>

          <div className="space-y-3">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12 text-muted text-xs">
                No incident reports matched the selected province, municipality, ward, or category filters.
              </div>
            ) : (
              filteredReports.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-teal-400">{item.id}</span>
                      <span
                        className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                          item.category === "water"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            : item.category === "power"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        }`}
                      >
                        {item.category}
                      </span>
                      <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white font-medium">
                        {item.ward || "Ward 26"}
                      </span>
                      <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded text-teal-300 font-medium">
                        Crew: {item.assignedDepotUnit?.split(" - ")[0]}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-muted leading-relaxed line-clamp-2">{item.description}</p>

                    <div className="flex items-center gap-3 text-[11px] text-muted pt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-teal-300 font-mono truncate max-w-full">
                        <MapPin className="h-3 w-3 text-teal-400 shrink-0" /> {item.locationAddress}
                      </span>
                      {item.reporterName && (
                        <span className="flex items-center gap-1 text-white truncate">
                          <User className="h-3 w-3 text-teal-400 shrink-0" /> {item.reporterName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* STATUS UPDATE & ASSIGNMENT CONTROLS */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 border-white/10 pt-3 md:pt-0 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setAssigningJob(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Wrench className="h-3.5 w-3.5" /> Assign Crew
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveReportDetail(item)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-teal-400" /> Inspect
                    </button>

                    <button
                      type="button"
                      onClick={() => updateReportStatus(item.id, "Resolved")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        item.status === "Resolved"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-white/5 text-muted hover:text-white border border-white/10"
                      }`}
                    >
                      Resolve
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWhatsAppNotify(item)}
                      title="WhatsApp Resident"
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ASSIGN CREW MODAL */}
      {assigningJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-md p-5 relative border-teal-500/30 space-y-4 rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-mono text-teal-400 font-bold">{assigningJob.id}</span>
                <h3 className="text-sm font-bold text-white">Assign Field Crew Unit</h3>
              </div>
              <button onClick={() => setAssigningJob(null)} className="text-muted hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCrewAssignment} className="space-y-4 text-xs">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-muted text-[10px] uppercase">Incident</span>
                <p className="text-white font-medium">{assigningJob.title}</p>
                <p className="text-teal-300 font-mono text-[11px]">{assigningJob.locationAddress}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold block">
                  Select Specialized Depot Unit
                </label>
                <select
                  value={selectedCrewUnit}
                  onChange={(e) => setSelectedCrewUnit(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/50 cursor-pointer"
                >
                  {DEPOT_UNITS.map((unit) => (
                    <option key={unit} value={unit} className="bg-neutral-900 text-white">
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningJob(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-muted hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-xs hover:bg-teal-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Dispatch to Crew
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED INSPECTION MODAL */}
      {activeReportDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-xl p-6 relative border-teal-500/30 space-y-4 max-h-[90vh] overflow-y-auto rounded-2xl">
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
                className="text-muted hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-3.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Reporter Full Name</span>
                  <p className="text-white font-medium mt-0.5 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-teal-400" />
                    {activeReportDetail.reporterName || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Contact Phone Number</span>
                  <p className="text-white font-medium mt-0.5 flex items-center gap-1">
                    <PhoneCall className="h-3.5 w-3.5 text-teal-400" />
                    {activeReportDetail.reporterPhone || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-3.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Municipal Account Number</span>
                  <p className="text-teal-300 font-mono font-medium mt-0.5 flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5 text-teal-400" />
                    {activeReportDetail.accountNumber || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Stand / Erf Number</span>
                  <p className="text-white font-medium mt-0.5 flex items-center gap-1">
                    <Home className="h-3.5 w-3.5 text-teal-400" />
                    {activeReportDetail.standNumber || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">Full Street Address / Location</span>
                <p className="text-white font-medium mt-0.5 flex items-center gap-1 bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                  {activeReportDetail.locationAddress}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Assigned Depot Unit</span>
                  <p className="text-teal-300 font-medium mt-0.5">{activeReportDetail.assignedDepotUnit}</p>
                </div>

                <div>
                  <span className="text-muted block text-[10px] uppercase tracking-wider">Estimated Fix Time</span>
                  <p className="text-white font-medium mt-0.5">{activeReportDetail.estimatedFixTime}</p>
                </div>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider">Issue Description & Impact</span>
                <p className="text-muted leading-relaxed mt-0.5 bg-black/40 p-3 rounded-xl border border-white/5">
                  {activeReportDetail.description}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-end">
              <button
                onClick={() => setActiveReportDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-xs hover:bg-teal-500/30 transition-all cursor-pointer"
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
