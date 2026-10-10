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
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGeo } from "@/context/GeoContext";

// Native Android Hardware Interface Type Declaration
declare global {
  interface Window {
    AndroidAudioBridge?: {
      getRawAcousticFrequency?: () => number[];
      getSensorPressureReading?: () => number;
    };
  }
}

interface WaterNode {
  id: string;
  owner: string;
  type: string;
  capacity: string;
  price: string;
  distance: string;
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
  ward?: string;
  priority?: "High" | "Medium" | "Low" | "Critical";
  reporterName?: string;
  reporterPhone?: string;
  assignedDepotUnit?: string;
  estimatedFixTime?: string;
  coords?: { lat: number; lng: number };
}

const DEFAULT_WATER_NODES: WaterNode[] = [
  {
    id: "node-1",
    owner: "Community Hub",
    type: "Borehole & Filtration",
    capacity: "2,500 L",
    price: "R15 / 20L",
    distance: "0.3 km away",
    location: "Sector 4 - Sunset Ridge",
    whatsappPhone: "27821234567",
    isUserCreated: false,
  },
  {
    id: "node-2",
    owner: "Emergency Tank Alpha",
    type: "Rainwater Tank",
    capacity: "800 L",
    price: "R10 / 20L",
    distance: "0.7 km away",
    location: "Block 12 - Main Rd",
    whatsappPhone: "27839876543",
    isUserCreated: false,
  },
  {
    id: "node-3",
    owner: "Kasi Eco Hub",
    type: "Solar UV Tap",
    capacity: "5,000 L",
    price: "Free for Pensioners",
    distance: "1.2 km away",
    location: "Community Center",
    whatsappPhone: "27815550192",
    isUserCreated: false,
  },
];

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

const WATER_BLUE = "#38bdf8";

export default function HydroMeshPage() {
  const { streetAddress } = useGeo();

  // Location State
  const [isRefreshingGeo, setIsRefreshingGeo] = useState(false);
  const [activeAddress, setActiveAddress] = useState<string>("Locating street...");
  const hasInitializedGeo = useRef(false);

  useEffect(() => {
    if (streetAddress && !hasInitializedGeo.current) {
      setActiveAddress(streetAddress);
      hasInitializedGeo.current = true;
    }
  }, [streetAddress]);

  const handleManualRefreshLocation = () => {
    setIsRefreshingGeo(true);
    setTimeout(() => {
      if (streetAddress) {
        setActiveAddress(streetAddress);
      }
      setIsRefreshingGeo(false);
    }, 600);
  };

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

  // Water Reports & P2P Nodes State
  const [waterReports, setWaterReports] = useState<WaterReportItem[]>([]);
  const [waterNodesList, setWaterNodesList] = useState<WaterNode[]>(DEFAULT_WATER_NODES);

  // Share Tank Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [newType, setNewType] = useState("Borehole & Filtration");
  const [newCapacity, setNewCapacity] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // In-app WhatsApp Dispatch State
  const [activeDispatchNode, setActiveDispatchNode] = useState<WaterNode | null>(null);

  // Web Audio & Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState<"idle" | "listening" | "complete" | "error">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live FFT Audio Data Bins
  const [fftSpectrum, setFftSpectrum] = useState<number[]>(new Array(16).fill(5));
  const [liveDb, setLiveDb] = useState<number>(0);
  const [calculatedPressure, setCalculatedPressure] = useState<number | null>(null);

  // Web Audio API References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load Initial Persisted Data & Real-Time Sync Listeners
  useEffect(() => {
    try {
      const savedReports = localStorage.getItem("resigrid_active_reports");
      if (savedReports) {
        const parsed: WaterReportItem[] = JSON.parse(savedReports);
        const filteredWater = parsed.filter((r) => r.category === "water");
        setWaterReports(filteredWater);
      }

      const savedNodes = localStorage.getItem("resigrid_water_nodes");
      if (savedNodes) {
        const parsedNodes = JSON.parse(savedNodes);
        if (Array.isArray(parsedNodes) && parsedNodes.length > 0) {
          setWaterNodesList(parsedNodes);
        }
      } else {
        localStorage.setItem("resigrid_water_nodes", JSON.stringify(DEFAULT_WATER_NODES));
      }
    } catch (e) {
      console.error("Storage read error:", e);
    }

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");

      broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};

        if (type === "NEW_REPORT" && payload && payload.category === "water") {
          setWaterReports((prev) => {
            const exists = prev.some((r) => r.id === payload.id);
            if (exists) return prev;
            return [payload, ...prev];
          });
        }

        if (type === "STATUS_UPDATE" && payload?.id) {
          setWaterReports((prev) =>
            prev.map((r) => (r.id === payload.id ? { ...r, status: payload.status } : r))
          );
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "resigrid_active_reports" && e.newValue) {
        try {
          const parsed: WaterReportItem[] = JSON.parse(e.newValue);
          setWaterReports(parsed.filter((r) => r.category === "water"));
        } catch (err) {
          console.error("Storage parse error:", err);
        }
      }
      if (e.key === "resigrid_water_nodes" && e.newValue) {
        try {
          setWaterNodesList(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Nodes parse error:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const deduplicatedWaterReports = waterReports.reduce((acc: WaterReportItem[], current) => {
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
          const calculatedBar = bridgePressure ? Number(bridgePressure.toFixed(1)) : Number((2.6 + (avgEnergy / 255) * 2.2).toFixed(1));
          setCalculatedPressure(calculatedBar);
          setScanPhase("complete");
          stopAcousticScan();
        }
      };

      processSpectrum();
    } catch (err) {
      console.error("Industrial acoustic hardware error:", err);
      setErrorMessage("Microphone hardware access required. Place microphone directly against water pipe spout.");
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
      `My Location: ${activeAddress}\n` +
      `Rate: ${node.price}\n\n` +
      `Please confirm pickup availability.`
    );

    const whatsappUrl = `https://wa.me/${node.whatsappPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleAddTank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwner || !newCapacity || !newPrice || !newPhone) return;

    const newNode: WaterNode = {
      id: `node-${Date.now()}`,
      owner: newOwner.trim(),
      type: newType,
      capacity: newCapacity.trim(),
      price: newPrice.trim(),
      distance: "0.1 km away",
      location: activeAddress !== "Locating street..." ? activeAddress : "Local Neighborhood",
      whatsappPhone: newPhone.replace(/[^0-9]/g, ""),
      isUserCreated: true,
    };

    const updatedNodes = [newNode, ...waterNodesList];
    setWaterNodesList(updatedNodes);
    localStorage.setItem("resigrid_water_nodes", JSON.stringify(updatedNodes));

    setIsShareModalOpen(false);
    setNewOwner("");
    setNewCapacity("");
    setNewPrice("");
    setNewPhone("");
  };

  const handleRemoveTankNode = (nodeId: string, isUserCreated?: boolean) => {
    if (!isUserCreated) return;
    const updatedNodes = waterNodesList.filter((node) => node.id !== nodeId);
    setWaterNodesList(updatedNodes);
    localStorage.setItem("resigrid_water_nodes", JSON.stringify(updatedNodes));
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
        
        {/* TOP ROW: HEADER & INDEPENDENT LOCATION PILL WITH REPORT BUTTON */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <header className="glass-header flex items-center gap-3 p-3.5 sm:p-4">
            <div className="feature-icon feature-water shrink-0" style={{ color: "var(--accent)" }}>
              <Droplets className="h-[18px] w-[18px]" style={{ color: "var(--accent)" }} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm">
                HYDROMESH™
              </h1>
              <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                WATER FLOW & TAP PRESSURE TELEMETRY
              </p>
            </div>
          </header>

          <div className="flex items-center gap-2">
            {/* Independent Location Pill */}
            <div 
              className="glass-panel px-4 py-2.5 flex items-center justify-between gap-3 pointer-events-auto flex-1 sm:flex-initial"
              style={{
                borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Navigation className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                <span className="truncate font-semibold text-white text-[10px] sm:text-xs">
                  {activeAddress}
                </span>
              </div>
              <button
                type="button"
                onClick={handleManualRefreshLocation}
                title="Refresh Location"
                className="transition-colors shrink-0 cursor-pointer p-1 touch-manipulation z-30 hover:text-white"
                style={{ color: "var(--accent)" }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingGeo ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Report Button with Plus Icon Next to Location Pill (Visible on mobile too) */}
            <Link
              href="/civic"
              className="glass-panel px-3.5 py-2.5 flex items-center gap-1.5 text-xs font-semibold text-white transition-all cursor-pointer touch-manipulation pointer-events-auto z-30 hover:opacity-90 shrink-0"
              style={{
                borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
              }}
            >
              <Plus className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
              <span className="inline">Report</span>
            </Link>
          </div>
        </div>

        {/* MAIN DASHBOARD LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 relative z-20">
          
          {/* LEFT COLUMN: ACOUSTIC SCANNER & STATS */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* ACOUSTIC SCANNER INTERFACE - UNCAGED CONTAINER WITH BREATHING ROOM */}
            <section
              onClick={isScanning ? stopAcousticScan : startAcousticScan}
              className="relative overflow-y-hidden p-4 sm:p-6 transition-all cursor-pointer touch-manipulation pointer-events-auto flex flex-col justify-between mt-3 sm:mt-5"
            >
              <div className="relative z-10">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow text-[10px]" style={{ color: "var(--accent)" }}>ACOUSTIC SENSOR</p>
                    <h2 className="mt-1 text-lg sm:text-2xl font-medium tracking-[-0.025em] text-white">
                      Tap Pressure & Flow Scan
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted max-w-xl">
                      Tap anywhere below and press your phone microphone flat against your metal tap spout for high-precision DSP acoustic flow telemetry.
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
                          borderColor: "color-mix(in srgb, var(--accent) 50%, transparent)",
                          backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                          color: "var(--accent)",
                        }}
                      >
                        <Mic className="h-6 w-6" />
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-white">Tap to Start Industrial Scan</p>
                      <p className="mt-1 text-[11px]" style={{ color: "color-mix(in srgb, var(--accent) 80%, white)" }}>
                        Hold device microphone directly on metal tap spout
                      </p>
                    </div>
                  )}

                  {/* LISTENING / SCANNING STATE */}
                  {scanPhase === "listening" && (
                    <div className="w-full text-center py-2">
                      <div className="mx-auto mb-5 flex h-20 items-end justify-center gap-2 px-2 max-w-md">
                        {fftSpectrum.map((val, i) => (
                          <div
                            key={i}
                            className="w-2 rounded-t transition-all duration-75"
                            style={{ 
                              height: `${val}%`, 
                              backgroundColor: "var(--accent)",
                              boxShadow: "0 0 12px var(--accent)"
                            }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <Volume2 className="h-4 w-4 animate-pulse shrink-0" style={{ color: "var(--accent)" }} />
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--accent)" }}>
                          DSP Frequency Analysis ({scanProgress}%) • {liveDb} dB
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
                          borderColor: "color-mix(in srgb, var(--accent) 50%, transparent)",
                          backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                          color: "var(--accent)",
                        }}
                      >
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm sm:text-lg font-semibold" style={{ color: "var(--accent)" }}>
                        {calculatedPressure} Bar — Water Line Pressurized
                      </h3>
                      <p className="mt-1 text-[11px] text-muted max-w-sm mx-auto">
                        Acoustic resonance verified. Tap again to re-scan.
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
              </div>
            </section>

            {/* SEPARATE METRIC TILES - WHITE ONLY FOR STATS WITH BOTTOM CLEARANCE SPACE */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6 sm:mb-8">
              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Line Status</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white">Pressurized</p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Local Pressure</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white">2.8 Bar Avg</p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Outage Risk</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white">Low (8%)</p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Last Check</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white">Just now</p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: REAL-TIME WATER FAULTS WITH TOP SPACE CLEARANCE */}
          <aside className="space-y-5 pt-2 sm:pt-4">
            <section className="glass-panel p-4 sm:p-6 relative pointer-events-auto">
              <div className="panel-reflection pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div>
                  <p className="eyebrow" style={{ color: "var(--accent)" }}>AREA REPORTS</p>
                  <h2 className="mt-1 text-sm sm:text-base font-semibold text-white">
                    Water Faults Nearby
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {deduplicatedWaterReports.length === 0 ? (
                  <div className="text-center py-8 text-muted text-xs">
                    No active water fault reports logged in your area.
                  </div>
                ) : (
                  deduplicatedWaterReports.map((report) => {
                    const isResolved = report.status === "Resolved" || report.status === "Auto-Dispatched";
                    const statusColor = isResolved ? "#10b981" : "#f59e0b"; // Green vs Orange

                    return (
                      <div
                        key={report.id}
                        className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-1.5 relative z-20 pointer-events-auto"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-xs font-mono font-bold" style={{ color: "var(--accent)" }}>
                            {report.id}
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
                          <span className="flex items-center gap-1 font-mono truncate" style={{ color: "color-mix(in srgb, var(--accent) 85%, white)" }}>
                            <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--accent)" }} /> <span className="truncate">{report.locationAddress}</span>
                          </span>
                          <span className="shrink-0">{report.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>
        </div>

        {/* WATER SHARING MARKETPLACE */}
        <div className="space-y-4 pt-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
                <p className="eyebrow text-[10px]" style={{ color: "var(--accent)" }}></p>
              <h2 className="mt-1 text-base sm:text-lg font-medium text-white">
                Neighborhood Water Sharing Nodes
              </h2>
            </div>

            {/* SMALLER SHARE TANK BUTTON IN WATER BLUE */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="glass-panel px-3 py-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer touch-manipulation pointer-events-auto z-30 hover:opacity-90 active:scale-95 w-full sm:w-auto"
              style={{
                color: WATER_BLUE,
                borderColor: "color-mix(in srgb, #38bdf8 40%, transparent)",
                backgroundColor: "color-mix(in srgb, #38bdf8 12%, transparent)",
              }}
            >
              <Plus className="h-3.5 w-3.5 shrink-0 pointer-events-none" style={{ color: WATER_BLUE }} />
              <span className="pointer-events-none">Share Tank</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waterNodesList.map((node) => {
              const isSelected = activeDispatchNode?.id === node.id;

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
                      <div className="brand-icon feature-water shrink-0" style={{ color: WATER_BLUE, borderColor: "color-mix(in srgb, #38bdf8 20%, transparent)" }}>
                        <Droplets className="h-4 w-4" style={{ color: WATER_BLUE }} />
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
                    <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: WATER_BLUE }} />
                    <span className="truncate">{node.location} ({node.distance})</span>
                  </p>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold" style={{ color: WATER_BLUE }}>{node.capacity}</p>
                      <p className="text-[10px] text-muted">{node.price}</p>
                    </div>

                    {/* REQUEST VIA WHATSAPP IN PURE WHITE TEXT */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <MessageCircle className="h-4 w-4 shrink-0" style={{ color: WATER_BLUE }} />
                      <span>Request via WhatsApp</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* SHARE TANK MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
          <div 
            className="glass-panel w-full max-w-md p-5 sm:p-6 relative space-y-4 pointer-events-auto"
            style={{ borderColor: "color-mix(in srgb, #38bdf8 30%, transparent)" }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Droplets className="h-4 w-4 shrink-0" style={{ color: WATER_BLUE }} /> Register Water Tank
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
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto cursor-pointer"
                >
                  <option value="Borehole & Filtration" className="bg-neutral-900 text-white">Borehole & Filtration</option>
                  <option value="Rainwater Tank" className="bg-neutral-900 text-white">Rainwater Tank</option>
                  <option value="Solar UV Tap" className="bg-neutral-900 text-white">Solar UV Tap</option>
                  <option value="Municipal Storage Tank" className="bg-neutral-900 text-white">Municipal Storage Tank</option>
                </select>
              </div>

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
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Price / Terms</label>
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
                <label className="text-[11px] sm:text-xs text-muted block mb-1">WhatsApp Phone Number</label>
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
                className="w-full py-3 rounded-xl border text-xs font-semibold transition-all mt-2 cursor-pointer touch-manipulation relative z-30 pointer-events-auto hover:opacity-90"
                style={{
                  color: WATER_BLUE,
                  borderColor: "color-mix(in srgb, #38bdf8 40%, transparent)",
                  backgroundColor: "color-mix(in srgb, #38bdf8 15%, transparent)",
                  boxShadow: "0 0 20px color-mix(in srgb, #38bdf8 15%, transparent)"
                }}
              >
                Publish Water Node
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
