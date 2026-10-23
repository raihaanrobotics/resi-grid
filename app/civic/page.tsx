"use client";

import Link from "next/link";
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
  User,
  Phone,
  Building,
  ShieldAlert,
  Hash,
} from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { animateRefreshIcon } from "@/lib/location/animateRefreshIcon";
import { supabase } from "@/lib/supabase";
import { dispatchReportScreenNotification } from "@/lib/notifications/globalNotifications";
import { normalizeSouthAfricanPhone } from "@/lib/phone";
import { findNearbyActiveReport, getReportDisplayId, type NearbyReportCandidate } from "@/lib/reportUtils";
import { useReportUpvotes } from "@/lib/useReportUpvotes";
import ReportImpactButton from "@/components/shared/ReportImpactButton";

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

// Comprehensive South African Provincial, Municipal, and Granular Ward Hierarchy Mapping
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

export default function CivicAIPage() {
  const { location, loading: geoLoading, refreshLocation } = useUserLocation();

  // Location & Address States
  const [streetAddress, setStreetAddress] = useState<string>("Locating street...");
  const [streetNumberInput, setStreetNumberInput] = useState<string>("");
  const [baseGeoAddress, setBaseGeoAddress] = useState<string>("");
  const [isRefreshingGeo, setIsRefreshingGeo] = useState<boolean>(false);

  // Full Municipal Real Logging Form State (Detailed Municipality Requirements)
  const [reportTitle, setReportTitle] = useState("");
  const [category, setCategory] = useState<"water" | "power" | "other">("water");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  
  // Hierarchical Geographic Selection States
  const [selectedProvince, setSelectedProvince] = useState("KwaZulu-Natal");
  const [selectedMunicipality, setSelectedMunicipality] = useState("Pietermaritzburg (Msunduzi)");
  const [selectedWard, setSelectedWard] = useState("Ward 26: Northern Park, Victoria Road areas, and parts of Woodlands");

  const [priority] = useState<"High" | "Medium" | "Low" | "Critical">("High");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nearbyIncident, setNearbyIncident] = useState<NearbyReportCandidate | null>(null);
  const { upvotedReportIds, markUpvoted } = useReportUpvotes(
    nearbyIncident ? [nearbyIncident.report_id] : []
  );

  // Bulletproof Theme Persistence & Profile Auto-Fill on Mount
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

    // Auto-fill profile data & municipal account details from profile storage if available (including resigrid_civic_profile)
    try {
      const loadProfileData = (rawProfile: string | null) => {
        if (!rawProfile) return false;
        const parsed = JSON.parse(rawProfile);
        if (parsed.fullName) setReporterName(parsed.fullName);
        else if (parsed.full_name) setReporterName(parsed.full_name);
        if (parsed.phone) setReporterPhone(parsed.phone);
        if (parsed.accountNumber) setAccountNumber(parsed.accountNumber);
        else if (parsed.account_number) setAccountNumber(parsed.account_number);
        const prov = parsed.selectedProvince || parsed.province;
        if (prov && SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[prov]) {
          setSelectedProvince(prov);
          const cities = SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[prov];
          const city = parsed.selectedCity || parsed.city;
          if (city && cities[city]) {
            setSelectedMunicipality(city);
            const ward = parsed.selectedWard || parsed.ward;
            if (ward && cities[city].includes(ward)) {
              setSelectedWard(ward);
            }
          }
        }
        return true;
      };

      if (!loadProfileData(localStorage.getItem("resigrid_civic_profile"))) {
        loadProfileData(localStorage.getItem("resigrid_user_profile"));
      }
    } catch (e) {
      console.error("Error reading profile auto-fill:", e);
    }

    return () => {
      window.removeEventListener("resigrid_theme_change", handleThemeEvent);
    };
  }, []);

  // Update Municipalities/Cities when Province changes
  const handleProvinceChange = (prov: string) => {
    setSelectedProvince(prov);
    const cities = Object.keys(SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[prov] || {});
    if (cities.length > 0) {
      const firstCity = cities[0];
      setSelectedMunicipality(firstCity);
      const wards = SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[prov][firstCity] || [];
      if (wards.length > 0) {
        setSelectedWard(wards[0]);
      }
    }
  };

  // Update Wards when Municipality/City changes
  const handleMunicipalityChange = (muni: string) => {
    setSelectedMunicipality(muni);
    const wards = SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[selectedProvince]?.[muni] || [];
    if (wards.length > 0) {
      setSelectedWard(wards[0]);
    }
  };

  // Reverse Geocoding Fetch with High Precision
  const fetchAddressOnce = async (lat: number, lng: number) => {
    setIsRefreshingGeo(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data.address) {
        const road = data.address.road || data.address.pedestrian || "";
        const suburb =
          data.address.suburb ||
          data.address.neighbourhood ||
          data.address.city ||
          "";

        const baseFormatted = [road, suburb].filter(Boolean).join(", ");
        setBaseGeoAddress(baseFormatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        
        const currentNum = streetNumberInput.trim();
        setStreetAddress(currentNum ? `${currentNum} ${baseFormatted}` : (baseFormatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`));
      }
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setBaseGeoAddress(fallback);
      setStreetAddress(streetNumberInput.trim() ? `${streetNumberInput.trim()} ${fallback}` : fallback);
    } finally {
      setIsRefreshingGeo(false);
    }
  };

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      fetchAddressOnce(location.latitude, location.longitude);
    }
  }, [location?.latitude, location?.longitude]);

  // Handle Street Number Input Change
  const handleStreetNumberChange = (num: string) => {
    setStreetNumberInput(num);
    const cleanNum = num.trim();
    if (cleanNum) {
      setStreetAddress(`${cleanNum} ${baseGeoAddress}`);
    } else {
      setStreetAddress(baseGeoAddress);
    }
  };

  // Manual GPS Re-sync Handler
  const handleManualRefreshLocation = (e?: React.SyntheticEvent) => {
    if (e) {
      animateRefreshIcon(e.currentTarget);
      e.preventDefault();
      e.stopPropagation();
    }
    refreshLocation();
    if (location?.latitude && location?.longitude) {
      fetchAddressOnce(location.latitude, location.longitude);
    }
  };

  // Category Toggle Action
  const handleCategorySelect = (cat: "water" | "power" | "other", e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCategory(cat);
  };

  // Real Dispatch Webhook & Supabase Submission Handler with Full Municipal Metadata & Personal Info Sanitization for Public/Radar Views
  const handleSubmitReport = async (e?: React.FormEvent, forceNewReport = false) => {
    e?.preventDefault();
    if (!reportTitle.trim() || !description.trim() || !reporterName.trim() || !reporterPhone.trim() || !accountNumber.trim()) {
      setErrorMessage("All form fields are compulsory in order to send.");
      return;
    }

    const normalizedReporterPhone = normalizeSouthAfricanPhone(reporterPhone);
    if (!normalizedReporterPhone) {
      setErrorMessage("Enter a valid South African phone number, such as +27 82 123 4567.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      console.error("Could not verify report ownership:", authError);
      setErrorMessage("Please sign in again before submitting a report.");
      setIsSubmitting(false);
      return;
    }

    const activeAddress = streetAddress !== "Locating street..." && streetAddress.trim()
      ? streetAddress.trim()
      : "Current GPS Position";

    if (!forceNewReport && location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
      const latitudeDelta = 50 / 111_320;
      const longitudeDelta = 50 / (111_320 * Math.cos((location.latitude * Math.PI) / 180));
      try {
        const { data: nearbyReports, error: nearbyReportsError } = await supabase
          .from("reports")
          .select("id, report_id, category, title, description, location_address, status, latitude, longitude, impact_count")
          .eq("category", category)
          .gte("latitude", location.latitude - latitudeDelta)
          .lte("latitude", location.latitude + latitudeDelta)
          .gte("longitude", location.longitude - longitudeDelta)
          .lte("longitude", location.longitude + longitudeDelta)
          .order("created_at", { ascending: false })
          .limit(250);

        if (nearbyReportsError) throw nearbyReportsError;

        const match = findNearbyActiveReport(
          (nearbyReports || []) as NearbyReportCandidate[],
          category,
          location.latitude,
          location.longitude
        );
        if (match) {
          setNearbyIncident(match);
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Could not check for nearby active reports:", error);
        setErrorMessage("Could not check for nearby incidents. Please retry before submitting.");
        setIsSubmitting(false);
        return;
      }
    }

    const timestamp = new Date().toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Full Payload containing every single detail (for Municipal Dashboard & Supabase matching table schema)
    const fullPayload = {
      category,
      title: reportTitle.trim(),
      description: description.trim(),
      location_address: activeAddress,
      province: selectedProvince,
      municipality: selectedMunicipality,
      ward: selectedWard,
      priority,
      status: "Pending Review",
      impact_count: 1,
      separate_incident: forceNewReport,
      time_str: `Today, ${timestamp} SAST`,
      created_at: new Date().toISOString(),
      reporter_name: reporterName.trim(),
      reporter_phone: normalizedReporterPhone,
      account_number: accountNumber.trim(),
      assigned_depot: "Depot Rapid Response Queue",
      estimated_fix_time: "Pending Triage",
      latitude: location ? location.latitude : null,
      longitude: location ? location.longitude : null,
      reporter_user_id: userData.user.id,
    };

    // Client-side representation mapping for local storage / broadcast
    const localReportItem = {
      id: "",
      category: fullPayload.category,
      title: fullPayload.title,
      description: fullPayload.description,
      locationAddress: fullPayload.location_address,
      province: fullPayload.province,
      municipality: fullPayload.municipality,
      ward: fullPayload.ward,
      priority: fullPayload.priority,
      status: fullPayload.status,
      time: fullPayload.time_str,
      reporterName: fullPayload.reporter_name,
      reporterPhone: fullPayload.reporter_phone,
      accountNumber: fullPayload.account_number,
      assignedDepotUnit: fullPayload.assigned_depot,
      estimatedFixTime: fullPayload.estimated_fix_time,
      coords: location ? { lat: location.latitude, lng: location.longitude } : undefined,
      reporterUserId: userData.user.id,
      impactCount: 1,
      separateIncident: forceNewReport,
    };

    // Sanitized Payload for Public/Radar Pages (Personal Information Stripped)
    const publicPayload = {
      id: localReportItem.id,
      category: localReportItem.category,
      title: localReportItem.title,
      description: localReportItem.description,
      locationAddress: localReportItem.locationAddress,
      province: localReportItem.province,
      municipality: localReportItem.municipality,
      ward: localReportItem.ward,
      priority: localReportItem.priority,
      status: localReportItem.status,
      time: localReportItem.time,
      assignedDepotUnit: localReportItem.assignedDepotUnit,
      estimatedFixTime: localReportItem.estimatedFixTime,
      coords: localReportItem.coords,
      reporterUserId: userData.user.id,
      impactCount: 1,
      separateIncident: forceNewReport,
    };

    try {
      // 1. Insert into Supabase table public.reports matching the updated schema columns
      const { data: insertedReport, error: dbError } = await supabase
        .from("reports")
        .insert([fullPayload])
        .select("report_id")
        .single();

      if (dbError) {
        console.error("Supabase storage error:", dbError);
        setErrorMessage(`Supabase Error: ${dbError.message || JSON.stringify(dbError)}`);
        return;
      }
      if (!insertedReport?.report_id) {
        throw new Error("The report was saved without a report number. Apply the latest ResiGrid Supabase migration.");
      }
      const reportId = insertedReport.report_id as string;
      localReportItem.id = reportId;
      publicPayload.id = reportId;
      void dispatchReportScreenNotification(reportId);

      // 2. Save full details to municipal storage so Municipal Dashboard receives every detail
      try {
        const existingMunicipal = localStorage.getItem("resigrid_active_reports");
        const parsedMunicipal = existingMunicipal ? JSON.parse(existingMunicipal) : [];
        const updatedMunicipal = [localReportItem, ...parsedMunicipal];
        localStorage.setItem("resigrid_active_reports", JSON.stringify(updatedMunicipal));
      } catch (err) {
        console.error("Municipal storage write error:", err);
      }

      // 3. Broadcast sanitized payload (without personal info) to radar & public pages
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("resigrid_reports_dispatch");
        bc.postMessage({ type: "NEW_REPORT", payload: publicPayload });
        bc.close();
      }

      setReportTitle("");
      setDescription("");
      setStreetNumberInput("");
      setNearbyIncident(null);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 6000);
    } catch (err: any) {
      console.error("Submission exception:", err);
      setErrorMessage(`Submission failed: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmNearbyIncident = (reportId: string) => {
    markUpvoted(reportId);
    setNearbyIncident(null);
    setReportTitle("");
    setDescription("");
    setStreetNumberInput("");
    setSubmitSuccess(true);
    setErrorMessage(null);
    window.setTimeout(() => setSubmitSuccess(false), 6000);
  };

  const currentCities = SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[selectedProvince] || {};
  const currentWards = currentCities[selectedMunicipality] || [];

  return (
    <main className="resigrid-shell min-h-screen w-full overflow-x-hidden text-[var(--text)] selection:bg-[var(--accent)]/30 selection:text-[var(--accent)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Dynamic Ambient Blur Background Orbs */}
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1920px] space-y-4 px-3 pb-32 pt-4 sm:space-y-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">
        
        {/* UNIFIED TOP COMMAND PANEL CONTAINER */}
        <div 
          className="glass-panel p-3.5 sm:p-5 relative overflow-hidden space-y-3 pointer-events-auto border"
          style={{
            borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--accent) 6%, transparent)",
          }}
        >
          <div className="panel-reflection pointer-events-none" />

          {/* Top Row: Header Branding */}
          <div className="flex items-center justify-between relative z-10">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <div className="feature-icon feature-civic shrink-0" style={{ color: "var(--accent)" }}>
                <FileText className="h-[18px] w-[18px]" style={{ color: "var(--accent)" }} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm truncate">
                  INCIDENT REPORTING
                </h1>
                <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                  DIRECT MUNICIPAL ISSUE LOGGING
                </p>
              </div>
            </Link>
          </div>

          {/* Bottom Row: Location Pill (Full Width) */}
          <div className="flex items-center gap-2 relative z-20 pt-1">
            <div 
              className="glass-panel px-3 py-2 flex items-center justify-between gap-2 flex-1 min-w-0 rounded-xl"
              style={{
                borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Navigation className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                {geoLoading || isRefreshingGeo ? (
                  <span className="text-[10px] sm:text-xs truncate" style={{ color: "var(--accent)" }}>LOCATING STREET...</span>
                ) : (
                  <span className="truncate font-semibold text-white text-[10px] sm:text-xs">
                    {streetAddress}
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
        </div>

        {/* SUCCESS CONFIRMATION MODAL POPUP (CENTERED, WHITE) */}
        {submitSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="glass-panel w-full max-w-md rounded-3xl border border-white/20 bg-black/90 p-6 text-center shadow-2xl space-y-5 animate-fadeIn">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-wide">Dispatched Successfully</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Your incident report has been dispatched and logged into the municipal queue.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/radar"
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-colors shadow-md text-center flex items-center justify-center"
                >
                  View in Radar →
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="flex-1 py-3 rounded-xl border border-white/20 bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {nearbyIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg space-y-4 rounded-2xl border border-amber-500/30 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <div>
                  <h2 className="text-sm font-bold text-white">Active Incident Detected Nearby!</h2>
                  <p className="mt-1 text-xs text-muted">
                    An active {nearbyIncident.category} incident is already logged within 50 metres.
                  </p>
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-xs font-mono font-bold text-teal-300">
                  {nearbyIncident.title} • {getReportDisplayId(nearbyIncident.report_id, nearbyIncident.id)}
                </p>
                <p className="text-xs text-muted">{nearbyIncident.description}</p>
                <p className="text-[11px] text-white/70">{nearbyIncident.location_address}</p>
                <p className="text-[10px] text-amber-200">Same category · within 50 metres</p>
              </div>
              <ReportImpactButton
                reportId={nearbyIncident.report_id}
                impactCount={nearbyIncident.impact_count || 1}
                hasUpvoted={upvotedReportIds.has(nearbyIncident.report_id)}
                onUpvoted={handleConfirmNearbyIncident}
                className="justify-center"
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setNearbyIncident(null)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitReport(undefined, true)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-xs font-semibold text-amber-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Report Different Issue"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ERROR NOTIFICATION TOAST */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2 animate-fadeIn relative z-20 w-full">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" /> {errorMessage}
          </div>
        )}

        {/* STANDALONE INTRO TEXT */}
        <div className="px-1 text-xs sm:text-sm text-muted leading-relaxed relative z-20">
          Complete the form to log official fault reference tickets with your municipal account and stand details.
        </div>

        {/* MAIN FORM CONTAINER */}
        <form onSubmit={handleSubmitReport} className="space-y-4 relative z-20 w-full">

          {/* Category Selection Tile */}
          <div className="glass-panel p-4 sm:p-6 space-y-2.5 w-full">
            <div className="panel-reflection pointer-events-none" />
            <label className="text-[11px] sm:text-xs font-medium text-muted block">Select Incident Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(["water", "power", "other"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={(e) => handleCategorySelect(cat, e)}
                  onTouchEnd={(e) => handleCategorySelect(cat, e)}
                  className={`py-2.5 px-3 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all flex items-center gap-2 justify-center cursor-pointer touch-manipulation active:scale-95 ${
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
                  {cat === "water" && <Droplet className="h-4 w-4 shrink-0 pointer-events-none" />}
                  {cat === "power" && <Zap className="h-4 w-4 shrink-0 pointer-events-none" />}
                  {cat === "other" && <FileText className="h-4 w-4 shrink-0 pointer-events-none" />}
                  <span className="pointer-events-none">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reporter Information & Geographic Hierarchy Tile */}
          <div className="glass-panel p-4 sm:p-6 space-y-4 w-full">
            <div className="panel-reflection pointer-events-none" />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <User className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <Phone className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Contact No. *
                </label>
                <input
                  type="tel"
                  required
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="e.g. +27 82 123 4567"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <Hash className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Municipal Account No. *
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 800459201"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto font-mono"
                />
              </div>
            </div>

            {/* Hierarchical Province -> Municipality -> Ward Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <Building className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Province *
                </label>
                <select
                  required
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors cursor-pointer pointer-events-auto"
                >
                  {Object.keys(SOUTH_AFRICAN_PROVINCES_CITIES_WARDS).map((prov) => (
                    <option key={prov} value={prov} className="bg-neutral-900 text-white">{prov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <Building className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Municipality / City *
                </label>
                <select
                  required
                  value={selectedMunicipality}
                  onChange={(e) => handleMunicipalityChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors cursor-pointer pointer-events-auto"
                >
                  {Object.keys(currentCities).map((muni) => (
                    <option key={muni} value={muni} className="bg-neutral-900 text-white">{muni}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted flex items-center gap-1 mb-1">
                  <Building className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> Municipal Ward *
                </label>
                <select
                  required
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/35 transition-colors cursor-pointer pointer-events-auto"
                >
                  {currentWards.map((ward) => (
                    <option key={ward} value={ward} className="bg-neutral-900 text-white">{ward}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Issue Details Tile */}
          <div className="glass-panel p-4 sm:p-6 space-y-4 w-full">
            <div className="panel-reflection pointer-events-none" />

            <div>
              <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Issue Headline *</label>
              <input
                type="text"
                required
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. Burst Water Pipe, Substation Outage..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto"
              />
            </div>

            <div>
              <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Details &amp; Impact *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional details regarding the incident..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/35 transition-colors resize-none pointer-events-auto"
              />
            </div>
          </div>

          {/* Location Source Tile (Auto GPS + Street Number) */}
          <div className="glass-panel p-4 sm:p-6 space-y-3 w-full">
            <div className="panel-reflection pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-medium text-muted block">Location (Auto GPS) *</label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted block mb-1">Street Number / Unit *</label>
                <input
                  type="text"
                  required
                  value={streetNumberInput}
                  onChange={(e) => handleStreetNumberChange(e.target.value)}
                  placeholder="e.g. 142 or Apt 4B"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/35 transition-colors pointer-events-auto"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-2.5 bg-black/30 border border-white/5 rounded-xl self-end">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
                  <div className="text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="block text-[9px] uppercase font-mono" style={{ color: "color-mix(in srgb, var(--accent) 80%, white)" }}>Full Auto Address:</span>
                    <span className="text-white font-medium">{streetAddress}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualRefreshLocation}
                  onTouchEnd={handleManualRefreshLocation}
                  className="transition-colors shrink-0 cursor-pointer touch-manipulation pointer-events-auto hover:opacity-80 p-1"
                  style={{ color: "var(--accent)" }}
                  title="Re-sync location"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingGeo ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Action Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer touch-manipulation pointer-events-auto hover:opacity-90 shadow-lg"
              style={{
                color: "var(--accent)",
                borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                boxShadow: "0 0 25px color-mix(in srgb, var(--accent) 20%, transparent)"
              }}
            >
              <Send className="h-4 w-4 shrink-0 pointer-events-none" style={{ color: "var(--accent)" }} />
              <span className="pointer-events-none">{isSubmitting ? "Dispatching..." : "Dispatch Report"}</span>
            </button>
          </div>

        </form>

      </div>
    </main>
  );
}
