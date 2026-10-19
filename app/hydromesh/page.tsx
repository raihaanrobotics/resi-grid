"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Droplets,
  MapPin,
  Mic,
  Navigation,
  Plus,
  RefreshCw,
  Volume2,
  MessageCircle,
  X,
  Trash2,
  Calculator,
  TrendingDown,
  Lightbulb,
  ShieldCheck,
  Activity,
  Gauge,
  Clock,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGeo } from "@/context/GeoContext";
import { animateRefreshIcon } from "@/lib/location/animateRefreshIcon";
import { supabase } from "@/lib/supabase";

// Native Android Studio / Capacitor Industrial Hardware Interface Type Declaration
declare global {
  interface Window {
    AndroidAudioBridge?: {
      getRawAcousticFrequency?: () => number[];
      getSensorPressureReading?: () => number;
      getFlowVelocityMps?: () => number;
    };
  }
}

interface WaterNode {
  id: string;
  owner: string;
  type: string;
  capacity: string;
  price: string;
  latitude: number;
  longitude: number;
  distance?: string;
  formattedDistance?: string;
  location: string;
  whatsappPhone: string;
  isUserCreated?: boolean;
}

interface WaterReportItem {
  id: string;
  category: "water" | "power" | "roads" | "civic";
  title: string;
  description: string;
  locationAddress: string;
  status: "Auto-Dispatched" | "Pending Review" | "Resolved";
  time: string;
  latitude: number;
  longitude: number;
  formattedDistance?: string;
  ward?: string;
  priority?: "High" | "Medium" | "Low" | "Critical";
}

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

export default function HydroMeshPage() {
  const { streetAddress, location, filterByRadius, refreshLocation, loading: geoLoading } = useGeo();

  // Bulletproof Theme Persistence on Mount & Sync Feature Accent
  const [accentColor, setAccentColor] = useState<string>("#38bdf8");

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

  // Water Reports & P2P Nodes State
  const [waterReports, setWaterReports] = useState<WaterReportItem[]>([]);
  const [waterNodesList, setWaterNodesList] = useState<WaterNode[]>([]);

  // Share Tank Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [newType, setNewType] = useState("Borehole & Filtration");
  const [customSupplyType, setCustomSupplyType] = useState("");
  const [isOtherType, setIsOtherType] = useState(false);
  const [newCapacity, setNewCapacity] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // In-app WhatsApp Dispatch State
  const [activeDispatchNode, setActiveDispatchNode] = useState<WaterNode | null>(null);

  // Calculator Mode & Input States
  const [isSingleCycleMode, setIsSingleCycleMode] = useState<boolean>(false);
  const [monthlyUsageLiters, setMonthlyUsageLiters] = useState<number>(15000);
  const [singleUsageLiters, setSingleUsageLiters] = useState<number>(50);

  // Exact Municipal Stepped Tariff Calculations
  const usageKl = monthlyUsageLiters / 1000;
  const tier1Kl = Math.min(usageKl, 6);
  const tier2Kl = Math.max(0, Math.min(usageKl - 6, 14));
  const tier3Kl = Math.max(0, Math.min(usageKl - 20, 10));
  const tier4Kl = Math.max(0, usageKl - 30);

  const rateTier1 = 0.00;
  const rateTier2 = 24.80;
  const rateTier3 = 42.50;
  const rateTier4 = 61.20;

  const costTier1 = tier1Kl * rateTier1;
  const costTier2 = tier2Kl * rateTier2;
  const costTier3 = tier3Kl * rateTier3;
  const costTier4 = tier4Kl * rateTier4;

  const basicWaterCharge = 145.00;
  const sanitationSewerage = 195.00;
  const vatRate = 0.15;

  const subtotal = costTier1 + costTier2 + costTier3 + costTier4 + basicWaterCharge + sanitationSewerage;
  const estimatedMunicipalBill = Math.round(subtotal * (1 + vatRate));

  const baselineComparisonBill = Math.round((Math.min(usageKl, 20) * 24.80 + basicWaterCharge + sanitationSewerage) * 1.15);
  const estimatedSavingsFromLastMonth = usageKl > 20 ? Math.round(estimatedMunicipalBill - baselineComparisonBill) : Math.round(estimatedMunicipalBill * 0.12);

  const currentMarginalRate = usageKl > 30 ? rateTier4 : usageKl > 20 ? rateTier3 : usageKl > 6 ? rateTier2 : rateTier1;
  const singleApplianceCost = Math.round((singleUsageLiters / 1000) * currentMarginalRate * (1 + vatRate) * 100) / 100;

  let usageTip = "Your usage is within a healthy efficiency range. Keep up standard conservation habits.";
  if (usageKl > 30) {
    usageTip = "Critical: You are in Tier 4 excess surcharge. Check for hidden toilet leaks or pipe bursts immediately.";
  } else if (usageKl > 20) {
    usageTip = "Warning: High consumption has pushed you into Tier 3 penalty blocks. Consider shifting outdoor usage to shared rainwater tanks.";
  } else if (usageKl <= 6) {
    usageTip = "Excellent: Your household is operating entirely within the subsidized free basic lifeline tier!";
  }

  // Web Audio & Experimental DSP Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState<"idle" | "listening" | "complete" | "error">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fftSpectrum, setFftSpectrum] = useState<number[]>(new Array(16).fill(5));
  const [liveDb, setLiveDb] = useState<number>(0);
  const [scanResultStatus, setScanResultStatus] = useState<"normal" | "low_pressure" | null>(null);
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState<string>("Not tested yet");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Filter nearby nodes and reports within 10km radius
  const nearbyNodes = filterByRadius(waterNodesList, 10.0);
  const nearbyReports = filterByRadius(waterReports, 10.0);

  const deduplicatedWaterReports = nearbyReports.reduce((acc: typeof nearbyReports, current) => {
    const isDuplicate = acc.some(
      (item) =>
        item.locationAddress.trim().toLowerCase() === current.locationAddress.trim().toLowerCase() &&
        item.title.trim().toLowerCase() === current.title.trim().toLowerCase()
    );
    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, []);

  // Broadcast out verified telemetry ONLY when genuine low pressure state is detected
  const broadcastTelemetryToGlobal = useCallback((status: "normal" | "low_pressure") => {
    try {
      if (status !== "low_pressure") return; // Discard normal readings completely

      const existingNotifs = JSON.parse(localStorage.getItem("resigrid_global_notifications") || "[]");
      const alertId = `water-pressure-${Math.floor(Date.now() / 3600000)}`; // Hourly deduplication key
      const alreadyLogged = existingNotifs.some((n: any) => n.id === alertId);

      if (!alreadyLogged) {
        const newNotif = {
          id: alertId,
          title: "Water pressure drop detected",
          description: `A pressure drop was recorded near you at ${streetAddress}. Tap your line to test your flow as well.`,
          time: "Just now",
          type: "warning",
          category: "water"
        };
        localStorage.setItem("resigrid_global_notifications", JSON.stringify([newNotif, ...existingNotifs]));
      }
    } catch (err) {
      console.error("Failed to broadcast telemetry notification:", err);
    }
  }, [streetAddress]);

  // Check nearby reports within 10km to trigger proactive test prompt if an outage is confirmed nearby
  useEffect(() => {
    if (deduplicatedWaterReports.length > 0) {
      const hasNearbyOutage = deduplicatedWaterReports.some(
        (r) => r.category === "water" && (r.status === "Pending Review" || r.status === "Auto-Dispatched")
      );

      if (hasNearbyOutage) {
        try {
          const existingNotifs = JSON.parse(localStorage.getItem("resigrid_global_notifications") || "[]");
          const alreadyNotified = existingNotifs.some((n: any) => n.id === "outage-prompt-nearby-water");

          if (!alreadyNotified) {
            const promptNotif = {
              id: "outage-prompt-nearby-water",
              title: "Water issue reported nearby",
              description: "A water issue was reported within 10km of your location. Test your tap pressure now as you could be affected next.",
              time: "Just now",
              type: "warning",
              category: "water"
            };
            localStorage.setItem("resigrid_global_notifications", JSON.stringify([promptNotif, ...existingNotifs]));
          }
        } catch (e) {
          console.error("Error setting nearby outage prompt notification:", e);
        }
      }
    }
  }, [deduplicatedWaterReports]);

  // Automated 15-Minute Industrial Water Telemetry Background Check Loop (Silent Nominal Poll)
  useEffect(() => {
    const executeWaterTelemetryPoll = () => {
      try {
        const bridgePressure = window.AndroidAudioBridge?.getSensorPressureReading?.();
        const measuredStatus: "normal" | "low_pressure" = bridgePressure !== undefined && bridgePressure < 2.0 ? "low_pressure" : "normal";

        setScanResultStatus(measuredStatus);
        setLastCheckTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        broadcastTelemetryToGlobal(measuredStatus);
      } catch (err) {
        console.error("Automated water telemetry poll error:", err);
      }
    };

    const initialTimer = setTimeout(executeWaterTelemetryPoll, 3000);
    const intervalId = setInterval(executeWaterTelemetryPoll, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [broadcastTelemetryToGlobal]);

  // Fetch reports and water nodes directly from Supabase with localStorage fallback and BroadcastChannel sync
  const loadSupabaseData = useCallback(async () => {
    try {
      // Fetch water reports from Supabase
      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select("*")
        .order("id", { ascending: false });

      if (reportsError) {
        console.error("Error fetching reports from Supabase on HydroMesh:", reportsError);
      }

      if (reportsData) {
        const formattedReports: WaterReportItem[] = reportsData.map((row: any) => ({
          id: row.report_id || `RPT-${row.id}`,
          category: row.category || "water",
          title: row.title || "Untitled Incident",
          description: row.description || "",
          locationAddress: row.location_address || "Unknown Location",
          status: row.status || "Auto-Dispatched",
          time: row.time_str || "Today",
          latitude: row.latitude || -29.6006,
          longitude: row.longitude || 30.3794,
          ward: row.ward || "Ward 26",
          priority: row.priority || "High",
        }));
        setWaterReports(formattedReports.filter((r) => r.category === "water"));
      }

      // Fetch shared water nodes from Supabase if table exists, fallback to localStorage/defaults
      const { data: nodesData, error: nodesError } = await supabase
        .from("water_nodes")
        .select("*")
        .order("id", { ascending: false });

      if (nodesError) {
        // Table might not exist yet, fallback to localStorage
        const savedNodes = localStorage.getItem("resigrid_water_nodes");
        if (savedNodes) {
          const parsed = JSON.parse(savedNodes);
          if (Array.isArray(parsed)) setWaterNodesList(parsed);
        }
      } else if (nodesData && nodesData.length > 0) {
        const mappedNodes: WaterNode[] = nodesData.map((row: any) => ({
          id: row.node_id || `node-${row.id}`,
          owner: row.owner || "Community Hub",
          type: row.type || "Borehole & Filtration",
          capacity: row.capacity || "1,000 L",
          price: row.price || "Free",
          latitude: row.latitude || -29.6006,
          longitude: row.longitude || 30.3794,
          location: row.location || "Sector 4",
          whatsappPhone: row.whatsapp_phone || "27821234567",
          isUserCreated: row.is_user_created ?? true,
        }));
        setWaterNodesList(mappedNodes);
        localStorage.setItem("resigrid_water_nodes", JSON.stringify(mappedNodes));
      } else {
        const savedNodes = localStorage.getItem("resigrid_water_nodes");
        if (savedNodes) {
          setWaterNodesList(JSON.parse(savedNodes));
        }
      }
    } catch (err) {
      console.error("Supabase exception on HydroMesh fetch:", err);
    }
  }, []);

  useEffect(() => {
    loadSupabaseData();
    const interval = setInterval(loadSupabaseData, 10000);

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");

      broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};

        if (type === "NEW_REPORT" || type === "STATUS_UPDATE") {
          loadSupabaseData();
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "resigrid_active_reports" || e.key === "resigrid_water_nodes") {
        loadSupabaseData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadSupabaseData]);

  const stopAcousticScan = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    setIsScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopAcousticScan();
    };
  }, [stopAcousticScan]);

  const startAcousticScan = async () => {
    setErrorMessage(null);
    setScanProgress(0);
    setScanPhase("listening");
    setIsScanning(true);

    try {
      if (window.AndroidAudioBridge?.getRawAcousticFrequency) {
        const rawFft = window.AndroidAudioBridge.getRawAcousticFrequency();
        setFftSpectrum(rawFft.slice(0, 16));
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: { ideal: 44100 },
        },
      });

      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 44100 });
      audioCtxRef.current = audioCtx;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      const biquadFilter = audioCtx.createBiquadFilter();
      biquadFilter.type = "bandpass";
      biquadFilter.frequency.setValueAtTime(350, audioCtx.currentTime);
      biquadFilter.Q.setValueAtTime(1.5, audioCtx.currentTime);

      source.connect(biquadFilter);
      biquadFilter.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let timer = 0;

      const processSpectrum = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        const scaledSpectrum: number[] = [];
        let totalEnergy = 0;

        for (let i = 0; i < 16; i++) {
          const val = (dataArray[i * 2] + dataArray[i * 2 + 1]) / 2;
          scaledSpectrum.push(Math.max(8, Math.round((val / 255) * 100)));
          totalEnergy += val;
        }

        setFftSpectrum(scaledSpectrum);

        const avgEnergy = totalEnergy / 32;
        const dbEstimate = Math.round(20 * Math.log10(avgEnergy || 1));
        setLiveDb(dbEstimate);

        timer += 1;
        const progress = Math.min(100, Math.round((timer / 150) * 100));
        setScanProgress(progress);

        if (progress < 100) {
          animFrameRef.current = requestAnimationFrame(processSpectrum);
        } else {
          const bridgePressure = window.AndroidAudioBridge?.getSensorPressureReading?.();
          const determinedStatus: "normal" | "low_pressure" = bridgePressure !== undefined && bridgePressure < 2.0 ? "low_pressure" : "normal";
          
          setScanResultStatus(determinedStatus);
          setLastCheckTimestamp("Just tested");
          setScanPhase("complete");
          broadcastTelemetryToGlobal(determinedStatus);
          stopAcousticScan();
        }
      };

      processSpectrum();
    } catch (err) {
      console.error("Acoustic microphone hardware error:", err);
      setErrorMessage("Microphone access required for testing tap pressure. Please allow microphone permission.");
      setScanPhase("error");
      stopAcousticScan();
    }
  };

  const handleRequestSupply = (node: WaterNode) => {
    setActiveDispatchNode(node);
    executeWhatsAppDispatch(node);
  };

  const executeWhatsAppDispatch = (node: WaterNode) => {
    const pickupCode = `HYD-${Math.floor(1000 + Math.random() * 9000)}`;

    const message = encodeURIComponent(
      `Hello ${node.owner}, I would like to request water supply from your ${node.type} listed on ResiGrid HydroMesh.\n\n` +
      `Pickup Code: ${pickupCode}\n` +
      `My Location: ${streetAddress}\n` +
      `Rate: ${node.price}\n\n` +
      `Please confirm pickup availability.`
    );

    const whatsappUrl = `https://wa.me/${node.whatsappPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleAddTank = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedType = isOtherType ? (customSupplyType.trim() || "Custom Tank") : newType;
    if (!newOwner || !resolvedType || !newCapacity || !newPrice || !newPhone) return;

    const newNode: WaterNode = {
      id: `node-${Date.now()}`,
      owner: newOwner.trim(),
      type: resolvedType,
      capacity: newCapacity.trim(),
      price: newPrice.trim(),
      latitude: location?.latitude || -29.6000,
      longitude: location?.longitude || 30.3800,
      location: streetAddress,
      whatsappPhone: newPhone.replace(/[^0-9]/g, ""),
      isUserCreated: true,
    };

    const updatedNodes = [newNode, ...waterNodesList];
    setWaterNodesList(updatedNodes);
    localStorage.setItem("resigrid_water_nodes", JSON.stringify(updatedNodes));

    try {
      await supabase.from("water_nodes").insert([
        {
          node_id: newNode.id,
          owner: newNode.owner,
          type: newNode.type,
          capacity: newNode.capacity,
          price: newNode.price,
          latitude: newNode.latitude,
          longitude: newNode.longitude,
          location: newNode.location,
          whatsapp_phone: newNode.whatsappPhone,
          is_user_created: true,
        },
      ]);
    } catch (err) {
      console.error("Failed to insert water node into Supabase:", err);
    }

    setIsShareModalOpen(false);
    setNewOwner("");
    setNewType("Borehole & Filtration");
    setCustomSupplyType("");
    setIsOtherType(false);
    setNewCapacity("");
    setNewPrice("");
    setNewPhone("");
  };

  const handleRemoveTankNode = async (nodeId: string, isUserCreated?: boolean) => {
    if (!isUserCreated) return;
    const updatedNodes = waterNodesList.filter((node) => node.id !== nodeId);
    setWaterNodesList(updatedNodes);
    localStorage.setItem("resigrid_water_nodes", JSON.stringify(updatedNodes));

    try {
      await supabase.from("water_nodes").delete().eq("node_id", nodeId);
    } catch (err) {
      console.error("Failed to delete water node from Supabase:", err);
    }
  };

  return (
    <main className="resigrid-shell min-h-screen w-full overflow-x-hidden text-[var(--text)] selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      {/* Ambient environment */}
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1920px] px-3 pb-32 pt-4 sm:px-6 sm:space-y-6 lg:px-10 lg:pb-12 lg:pt-7 space-y-5">
        
        {/* UNIFIED TOP COMMAND PANEL CONTAINER */}
        <div 
          className="glass-panel p-3.5 sm:p-5 relative overflow-hidden space-y-3 pointer-events-auto border"
          style={{
            borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${accentColor} 6%, transparent)`,
          }}
        >
          <div className="panel-reflection pointer-events-none" />

          {/* Top Row: Header Branding */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="feature-icon feature-water shrink-0" style={{ color: accentColor }}>
                <Droplets className="h-[18px] w-[18px]" style={{ color: accentColor }} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm truncate">
                  HYDROMESH™
                </h1>
                <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                  WATER FLOW & TAP PRESSURE
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Row: Location Pill & Report Button Side-by-Side (Full Width on Mobile) */}
          <div className="flex items-center gap-2 relative z-20 pt-1">
            {/* Location Pill */}
            <div 
              className="glass-panel px-3 py-2 flex items-center justify-between gap-2 flex-1 min-w-0 rounded-xl"
              style={{
                borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Navigation className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />
                <span className="truncate font-semibold text-white text-[10px] sm:text-xs">
                  {streetAddress}
                </span>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  animateRefreshIcon(event.currentTarget);
                  refreshLocation();
                }}
                title="Refresh Location"
                className="transition-colors shrink-0 cursor-pointer p-1 touch-manipulation z-30 hover:text-white"
                style={{ color: accentColor }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${geoLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Report Button Pill */}
            <Link
              href="/civic"
              className="glass-panel px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-white transition-all cursor-pointer touch-manipulation z-30 hover:opacity-90 shrink-0 rounded-xl"
              style={{
                borderColor: `color-mix(in srgb, ${accentColor} 45%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
              }}
            >
              <Plus className="h-3.5 w-3.5" style={{ color: accentColor }} />
              <span className="inline">Report</span>
            </Link>
          </div>
        </div>

        {/* BREATHING ROOM DIVIDER LINE */}
        <div className="w-full h-px bg-white/15 my-2" />

        {/* MAIN DASHBOARD LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 relative z-20">
          
          {/* LEFT COLUMN: ACOUSTIC SCANNER & STATS */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* ACOUSTIC SCANNER INTERFACE */}
            <section
              id="acoustic-scanner-section"
              onClick={isScanning ? stopAcousticScan : startAcousticScan}
              className="relative overflow-y-hidden p-4 sm:p-6 transition-all cursor-pointer touch-manipulation pointer-events-auto flex flex-col justify-between mt-3 sm:mt-5"
            >
              <div className="relative z-10">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="eyebrow text-[10px]" style={{ color: accentColor }}>TAP PRESSURE</p>
                    </div>
                    <h2 className="mt-1 text-lg sm:text-2xl font-medium tracking-[-0.025em] text-white">
                      Test Your Tap Flow
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted max-w-xl">
                      Hold your phone microphone on your tap spout to test water line pressure.
                    </p>
                  </div>
                </div>

                {/* DYNAMIC SCAN DISPLAY AREA */}
                <div className="my-5 flex flex-col items-center justify-center">
                  {/* IDLE STATE */}
                  {scanPhase === "idle" && (
                    <div className="text-center py-3">
                      <div 
                        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border animate-pulse"
                        style={{
                          borderColor: `color-mix(in srgb, ${accentColor} 50%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                          color: accentColor,
                        }}
                      >
                        <Mic className="h-6 w-6" />
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-white">Tap here to start test</p>
                      <p className="mt-1 text-[11px]" style={{ color: `color-mix(in srgb, ${accentColor} 80%, white)` }}>
                        Hold phone near your running tap
                      </p>
                    </div>
                  )}

                  {/* LISTENING / SCANNING STATE */}
                  {scanPhase === "listening" && (
                    <div className="w-full text-center py-2">
                      <div className="mx-auto mb-5 flex h-20 items-end justify-center gap-1.5 sm:gap-2 px-2 max-w-md overflow-hidden">
                        {fftSpectrum.map((val, i) => (
                          <div
                            key={i}
                            className="w-1.5 sm:w-2 rounded-t transition-all duration-75"
                            style={{ 
                              height: `${val}%`, 
                              backgroundColor: accentColor,
                              boxShadow: `0 0 12px ${accentColor}`
                            }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <Volume2 className="h-4 w-4 animate-pulse shrink-0" style={{ color: accentColor }} />
                        <p className="text-xs font-semibold truncate" style={{ color: accentColor }}>
                          Testing water flow ({scanProgress}%)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SCAN COMPLETE STATE */}
                  {scanPhase === "complete" && (
                    <div className="text-center py-3">
                      <div 
                        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border"
                        style={{
                          borderColor: `color-mix(in srgb, ${accentColor} 50%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                          color: accentColor,
                        }}
                      >
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm sm:text-lg font-semibold" style={{ color: accentColor }}>
                        {scanResultStatus === "low_pressure" ? "Low Pressure Detected" : "Tap Flow Normal"}
                      </h3>
                      <p className="mt-1 text-[11px] text-muted max-w-sm mx-auto">
                        Acoustic signature recorded successfully. Tap again to test anytime.
                      </p>
                    </div>
                  )}

                  {/* ERROR STATE */}
                  {scanPhase === "error" && (
                    <div className="text-center py-3">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-400">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-medium text-rose-300 max-w-xs mx-auto">
                        {errorMessage}
                      </p>
                    </div>
                  )}
                </div>

                {/* OUTAGE PRE-WARNING BANNER */}
                {scanPhase === "complete" && (
                  <div className="mt-4 p-3.5 bg-black/60 border border-white/15 rounded-xl text-xs text-white flex items-start gap-3 animate-fadeIn">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentColor }} />
                    <div className="space-y-1">
                      <strong className="block text-[11px] uppercase tracking-wider" style={{ color: accentColor }}>
                        Status Check Summary
                      </strong>
                      <p className="text-muted leading-relaxed">
                        {scanResultStatus === "low_pressure"
                          ? "Low water pressure detected! Neighbors nearby have been notified. Consider storing water in containers."
                          : "Water line pressure is stable and normal in your home."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* SEPARATE POPULATED METRIC TILES */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6 sm:mb-8">
              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-muted">
                  <Activity className="w-3 h-3" style={{ color: accentColor }} /> Line Status
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {scanResultStatus === "low_pressure" ? "Low Pressure" : "Normal"}
                </p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-muted">
                  <Gauge className="w-3 h-3" style={{ color: accentColor }} /> Flow Response
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {scanPhase === "complete" ? "Verified" : "Standby"}
                </p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-muted">
                  <AlertTriangle className="w-3 h-3" style={{ color: accentColor }} /> Outage Risk
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {scanResultStatus === "low_pressure" ? "High" : "Low"}
                </p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em] text-muted">
                  <Clock className="w-3 h-3" style={{ color: accentColor }} /> Last Check
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {lastCheckTimestamp}
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LIVE MUNICIPAL TARIFF BILL & CALCULATOR */}
          <aside className="space-y-5 pt-2 sm:pt-4">
            <div className="w-full h-px bg-white/25 my-8 sm:my-10" />
            <section 
              className="glass-panel p-4 sm:p-6 relative pointer-events-auto border space-y-4"
              style={{
                borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${accentColor} 5%, transparent)`,
              }}
            >
              <div className="panel-reflection pointer-events-none" />
              
              <div className="flex flex-col gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" style={{ color: accentColor }} />
                    <p className="eyebrow text-[10px]" style={{ color: accentColor }}>TARIFF CALCULATOR</p>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    Municipal Bill &amp; Savings Calculator
                  </h2>
                </div>

                {/* SUBTLE SWITCH & RESPONSIVE INPUT FIELD */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                  <div className="flex items-center justify-between sm:justify-start gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/10">
                    <span className="text-xs text-muted font-medium">Single Use</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isSingleCycleMode}
                      onClick={() => setIsSingleCycleMode(!isSingleCycleMode)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isSingleCycleMode ? "bg-[var(--accent)]" : "bg-neutral-800"
                      }`}
                      style={{ backgroundColor: isSingleCycleMode ? accentColor : undefined }}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isSingleCycleMode ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {!isSingleCycleMode ? (
                    <div className="flex items-center justify-between sm:justify-start gap-3 bg-black/50 p-2.5 rounded-xl border border-white/15 flex-1">
                      <label htmlFor="water-usage-liters" className="text-xs text-muted font-medium whitespace-nowrap">
                        Monthly Usage:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id="water-usage-liters"
                          type="number"
                          min="0"
                          max="100000"
                          value={monthlyUsageLiters || ""}
                          onChange={(e) => setMonthlyUsageLiters(Math.max(0, Number(e.target.value)))}
                          placeholder="e.g. 15000"
                          className="w-28 bg-black/80 border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none text-right"
                          style={{
                            borderColor: `color-mix(in srgb, ${accentColor} 50%, transparent)`,
                          }}
                        />
                        <span className="text-xs font-mono text-muted">L</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between sm:justify-start gap-3 bg-black/50 p-2.5 rounded-xl border border-white/15 flex-1">
                      <label htmlFor="single-usage-liters" className="text-xs text-muted font-medium whitespace-nowrap">
                        Single Use Liters:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id="single-usage-liters"
                          type="number"
                          min="0"
                          max="10000"
                          value={singleUsageLiters || ""}
                          onChange={(e) => setSingleUsageLiters(Math.max(0, Number(e.target.value)))}
                          placeholder="e.g. 50"
                          className="w-28 bg-black/80 border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none text-right"
                          style={{
                            borderColor: `color-mix(in srgb, ${accentColor} 50%, transparent)`,
                          }}
                        />
                        <span className="text-xs font-mono text-muted">L</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isSingleCycleMode ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-1">
                    <p className="text-[10px] text-muted uppercase font-mono">Estimated Municipal Bill</p>
                    <p className="text-2xl font-bold font-mono text-white mt-1">R{estimatedMunicipalBill}</p>
                    <p className="text-[10px] text-muted">Based on your current {usageKl.toFixed(1)} kl monthly consumption</p>
                  </div>

                  <div 
                    className="p-4 border rounded-xl space-y-1"
                    style={{
                      borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                    }}
                  >
                    <p className="text-[10px] uppercase font-mono font-semibold flex items-center gap-1" style={{ color: accentColor }}>
                      <TrendingDown className="w-3.5 h-3.5" /> Savings From Last Month
                    </p>
                    <p className="text-2xl font-bold font-mono mt-1" style={{ color: accentColor }}>
                      R{estimatedSavingsFromLastMonth}
                    </p>
                    <p className="text-[10px] text-muted">Calculated variance based on your usage efficiency</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-1">
                    <p className="text-[10px] text-muted uppercase font-mono">Single Cycle Cost ({singleUsageLiters}L)</p>
                    <p className="text-2xl font-bold font-mono text-white mt-1">R{singleApplianceCost.toFixed(2)}</p>
                    <p className="text-[10px] text-muted">Calculated using your current marginal tariff tier</p>
                  </div>
                </div>
              )}

              {!isSingleCycleMode && (
                <div className="p-3.5 bg-black/60 border border-white/10 rounded-xl flex items-start gap-2.5 text-xs text-white">
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <div>
                    <strong className="block text-[11px] uppercase tracking-wider mb-0.5" style={{ color: accentColor }}>
                      Conservation Tip
                    </strong>
                    <span className="text-muted">{usageTip}</span>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>

        {/* WATER FAULTS & REAL-TIME INCIDENT REPORTS SECTION (WITH 10KM RADIUS FILTER) */}
        <div className="space-y-6 pt-4">
          <div className="w-full h-px bg-white/25 my-8 sm:my-10" />

          <div className="mb-4">
            <p className="eyebrow" style={{ color: accentColor }}>AREA REPORTS</p>
            <h2 className="mt-1 text-sm sm:text-base font-semibold text-white">
              Water Faults Nearby
            </h2>
          </div>
          
          <section className="glass-panel p-4 sm:p-6 relative pointer-events-auto">
            <div className="panel-reflection pointer-events-none" />

            <div className="space-y-3">
              {deduplicatedWaterReports.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs">
                  No active water fault reports logged within 10km of your location.
                </div>
              ) : (
                deduplicatedWaterReports.map((report) => {
                  const isResolved = report.status === "Resolved" || report.status === "Auto-Dispatched";
                  const statusColor = isResolved ? "#10b981" : "#f59e0b";

                  return (
                    <div
                      key={report.id}
                      className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-1.5 relative z-20 pointer-events-auto"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-xs font-mono font-bold" style={{ color: accentColor }}>
                          {report.id} {report.formattedDistance ? `• ${report.formattedDistance}` : ""}
                        </span>
                        <span 
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            color: statusColor,
                            backgroundColor: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                            borderColor: `color-mix(in srgb, ${statusColor} 25%, transparent)`,
                          }}
                        >
                          {report.status}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-white">{report.title}</h3>
                      <p className="text-[11px] text-muted leading-relaxed">{report.description}</p>

                      <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-white/5 gap-2">
                        <span className="flex items-center gap-1 font-mono truncate" style={{ color: `color-mix(in srgb, ${accentColor} 85%, white)` }}>
                          <MapPin className="h-3 w-3 shrink-0" style={{ color: accentColor }} /> <span className="truncate">{report.locationAddress}</span>
                        </span>
                        <span className="shrink-0">{report.time}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* WATER SHARING MARKETPLACE (WITH 10KM RADIUS FILTER) */}
        <div className="space-y-6 pt-4">
          <div className="w-full h-px bg-white/25 my-8 sm:my-10" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left mb-6 sm:mb-8">
            <div className="mx-auto sm:mx-0">
              <h2 className="mt-1 text-base sm:text-lg font-medium text-white text-center sm:text-left">
                Neighborhood Water Sharing
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="glass-panel px-3 py-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer touch-manipulation pointer-events-auto z-30 hover:opacity-90 active:scale-95 w-full sm:w-auto"
              style={{
                color: accentColor,
                borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
              }}
            >
              <Plus className="h-3.5 w-3.5 shrink-0 pointer-events-none" style={{ color: accentColor }} />
              <span className="pointer-events-none">Share Tank</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyNodes.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted text-xs">
                No water sharing nodes found within 10km. Be the first to share a tank!
              </div>
            ) : (
              nearbyNodes.map((node) => {
                const isSelected = activeDispatchNode?.id === node.id;
                
                const estimatedVolumeSavedKl = 4;
                const potentialCostWithoutNode = Math.round((monthlyUsageLiters / 1000 + estimatedVolumeSavedKl) * 28 + 340);
                const estimatedRandSavedByUsingNode = Math.max(25, potentialCostWithoutNode - estimatedMunicipalBill);
                const estimatedPercentSavedByUsingNode = Math.min(35, Math.max(8, Math.round((estimatedRandSavedByUsingNode / estimatedMunicipalBill) * 100)));
                
                const currentBadgeText = `Using this node saves ~R${estimatedRandSavedByUsingNode} (${estimatedPercentSavedByUsingNode}%) vs municipal pricing`;

                return (
                  <div
                    key={node.id}
                    onClick={() => handleRequestSupply(node)}
                    className={`glass-panel p-4.5 flex flex-col justify-between gap-4 transition-all cursor-pointer touch-manipulation relative overflow-hidden pointer-events-auto border z-20 ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-500/15 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="brand-icon feature-water shrink-0" style={{ color: accentColor, borderColor: `color-mix(in srgb, ${accentColor} 20%, transparent)` }}>
                          <Droplets className="h-4 w-4" style={{ color: accentColor }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-white truncate">{node.owner}</h3>
                          <p className="text-[10px] text-muted truncate">{node.type}</p>
                        </div>
                      </div>

                      {node.isUserCreated && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTankNode(node.id, node.isUserCreated);
                          }}
                          title="Remove Listing"
                          className="text-muted hover:text-rose-400 transition-colors p-1 cursor-pointer touch-manipulation relative z-30 shrink-0 pointer-events-auto"
                        >
                          <Trash2 className="h-4 w-4 pointer-events-none" />
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-muted flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />
                      <span className="truncate">{node.location} ({node.formattedDistance})</span>
                    </p>

                    <div className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 rounded-lg text-[10px] text-sky-300 font-medium">
                      {currentBadgeText}
                    </div>

                    <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold" style={{ color: accentColor }}>{node.capacity}</p>
                        <p className="text-[10px] text-muted">{node.price}</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        <MessageCircle className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
                        <span>Request via WhatsApp</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* SHARE TANK MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
          <div 
            className="glass-panel w-full max-w-md p-5 sm:p-6 relative space-y-4 pointer-events-auto"
            style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)` }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Droplets className="h-4 w-4 shrink-0" style={{ color: accentColor }} /> Register Water Tank
              </h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-muted hover:text-white cursor-pointer touch-manipulation relative z-30 p-1 pointer-events-auto"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handleAddTank} className="space-y-3 relative z-20">
              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Owner / Hub Name</label>
                <input
                  type="text"
                  required
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="e.g. Community Tank Hub"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Supply Type</label>
                <select
                  value={isOtherType ? "Other" : newType}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setIsOtherType(true);
                    } else {
                      setIsOtherType(false);
                      setNewType(val);
                    }
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto cursor-pointer"
                >
                  <option value="Borehole & Filtration" className="bg-neutral-900 text-white">Borehole & Filtration</option>
                  <option value="Rainwater Tank" className="bg-neutral-900 text-white">Rainwater Tank</option>
                  <option value="Solar UV Tap" className="bg-neutral-900 text-white">Solar UV Tap</option>
                  <option value="Municipal Storage Tank" className="bg-neutral-900 text-white">Municipal Storage Tank</option>
                  <option value="Other" className="bg-neutral-900 text-white">Other (Custom)</option>
                </select>
              </div>

              {isOtherType && (
                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Custom Supply Type</label>
                  <input
                    type="text"
                    required={isOtherType}
                    value={customSupplyType}
                    onChange={(e) => setCustomSupplyType(e.target.value)}
                    placeholder="e.g. Solar Borehole Reserve"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Capacity</label>
                  <input
                    type="text"
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    placeholder="e.g. 2,500 L"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Price / Terms / Rate</label>
                  <input
                    type="text"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. R15 / 20L or Free"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted field-label block mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 27821234567"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full border text-xs font-semibold transition-all mt-2 cursor-pointer touch-manipulation relative z-30 pointer-events-auto hover:opacity-95"
                style={{
                  color: accentColor,
                  borderColor: `color-mix(in srgb, ${accentColor} 40%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                  boxShadow: `0 0 20px color-mix(in srgb, ${accentColor} 15%, transparent)`
                }}
              >
                Publish Water Node cards
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
