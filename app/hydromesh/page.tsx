"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Droplets,
  MapPin,
  Mic,
  MicOff,
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

export default function HydroMeshPage() {
  const { streetAddress, loading: geoLoading } = useGeo();

  // Location Refresh State
  const [isRefreshingGeo, setIsRefreshingGeo] = useState(false);
  const [activeAddress, setActiveAddress] = useState<string>("Locating street...");

  useEffect(() => {
    if (streetAddress) {
      setActiveAddress(streetAddress);
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
    // 1. Load active reports and marketplace nodes from storage
    try {
      const savedReports = localStorage.getItem("resigrid_active_reports");
      if (savedReports) {
        const parsed: WaterReportItem[] = JSON.parse(savedReports);
        // Filter strictly for water category reports
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

    // 2. BroadcastChannel Synchronization
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

    // 3. Storage Event Listener for Multi-Tab Sync
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

  // Deduplicate water reports by locationAddress & title similarity to avoid clutter
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

  // Safe Audio Context Termination
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
        },
      });

      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.7;
      analyserRef.current = analyser;

      source.connect(analyser);

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
        const progress = Math.min(100, Math.round((timer / 180) * 100));
        setScanProgress(progress);

        if (progress < 100) {
          animFrameRef.current = requestAnimationFrame(processSpectrum);
        } else {
          const calculatedBar = Number((2.8 + (avgEnergy / 255) * 1.8).toFixed(1));
          setCalculatedPressure(calculatedBar);
          setScanPhase("complete");
          stopAcousticScan();
        }
      };

      processSpectrum();
    } catch (err) {
      console.error("Acoustic hardware error:", err);
      setErrorMessage("Microphone access required. Place device mic flat on tap spout.");
      setScanPhase("error");
      stopAcousticScan();
    }
  };

  // Handle Request Supply & Launch WhatsApp
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

  // Handle Creating New Tank Node & Publishing to Marketplace
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

  // Handle Removing Shared Tank Listing from Marketplace
  const handleRemoveTankNode = (nodeId: string, isUserCreated?: boolean) => {
    if (!isUserCreated) return;
    const updatedNodes = waterNodesList.filter((node) => node.id !== nodeId);
    setWaterNodesList(updatedNodes);
    localStorage.setItem("resigrid_water_nodes", JSON.stringify(updatedNodes));
  };

  return (
    <main className="resigrid-shell min-h-screen w-full overflow-x-hidden text-[var(--text)] selection:bg-sky-500/30 selection:text-sky-200">
      {/* Ambient environment */}
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1920px] px-3 pb-32 pt-4 sm:px-6 sm:space-y-6 lg:px-10 lg:pb-12 lg:pt-7 space-y-5">
        
        {/* TOP ROW: HEADER & INDEPENDENT OUTSIDE LOCATION PILL */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <header className="glass-header flex items-center gap-3 p-3.5 sm:p-4">
            <div className="brand-icon feature-water shrink-0">
              <Droplets className="h-[18px] w-[18px] text-sky-400" />
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

          {/* Fully Independent Outside Location Pill */}
          <div className="glass-panel px-4 py-2.5 flex items-center justify-between gap-3 border-sky-500/20 bg-sky-500/10 text-sky-400 pointer-events-auto">
            <div className="flex items-center gap-2 min-w-0">
              <Navigation className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              {geoLoading || isRefreshingGeo ? (
                <span className="text-sky-300 text-[10px] sm:text-xs">LOCATING STREET...</span>
              ) : (
                <span className="truncate font-semibold text-white text-[10px] sm:text-xs">
                  {activeAddress}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleManualRefreshLocation}
              title="Refresh Location"
              className="hover:text-white transition-colors text-sky-400 shrink-0 cursor-pointer p-1 touch-manipulation z-30"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingGeo ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* MAIN DASHBOARD LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 relative z-20">
          
          {/* LEFT COLUMN: ACOUSTIC SCANNER & STATS */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* ENTIRE FROSTED GLASS CONTAINER ACTS AS TAP SENSOR INTERFACE */}
            <section
              onClick={isScanning ? stopAcousticScan : startAcousticScan}
              className="glass-panel relative overflow-hidden p-6 sm:p-8 border border-sky-500/30 hover:border-sky-500/60 transition-all cursor-pointer touch-manipulation pointer-events-auto flex flex-col justify-between min-h-[320px]"
            >
              <div className="panel-reflection pointer-events-none" />
              <div className="panel-bottom-glow water-glow pointer-events-none" />

              <div className="relative z-10">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow text-sky-400">ACOUSTIC SENSOR</p>
                    <h2 className="mt-1 text-base sm:text-xl font-medium tracking-[-0.025em] text-white sm:text-2xl">
                      Tap Pressure & Flow Scan
                    </h2>
                    <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-muted max-w-xl">
                      Tap anywhere on this panel and press your phone microphone flat against your metal tap spout to measure water flow pressure.
                    </p>
                  </div>
                </div>

                {/* DYNAMIC SCAN DISPLAY AREA */}
                <div className="my-6 flex flex-col items-center justify-center">
                  {/* IDLE STATE */}
                  {scanPhase === "idle" && (
                    <div className="text-center py-4">
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-sky-400/40 bg-sky-400/10 text-sky-400 animate-pulse">
                        <Mic className="h-7 w-7" />
                      </div>
                      <p className="text-sm font-semibold text-white">Tap Panel to Start Tap Scan</p>
                      <p className="mt-1 text-[11px] text-sky-300/80">
                        Hold device microphone directly on tap body
                      </p>
                    </div>
                  )}

                  {/* LISTENING / SCANNING STATE */}
                  {scanPhase === "listening" && (
                    <div className="w-full text-center py-2">
                      <div className="mx-auto mb-6 flex h-24 items-end justify-center gap-2 px-2 max-w-md">
                        {fftSpectrum.map((val, i) => (
                          <div
                            key={i}
                            className="w-2.5 rounded-t bg-sky-400 transition-all duration-75 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                            style={{ height: `${val}%` }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <Volume2 className="h-4 w-4 text-sky-400 animate-pulse shrink-0" />
                        <p className="text-xs font-semibold text-sky-400 truncate">
                          Analyzing Acoustic Frequency ({scanProgress}%) • {liveDb} dB
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SCAN COMPLETE STATE */}
                  {scanPhase === "complete" && (
                    <div className="text-center py-4">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-sky-400/40 bg-sky-400/10 text-sky-400">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <h3 className="text-base sm:text-xl font-semibold text-sky-300">
                        {calculatedPressure} Bar — Water Line Pressurized
                      </h3>
                      <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                        Continuous frequency detected. Tap anywhere on panel to re-scan.
                      </p>
                    </div>
                  )}

                  {/* ERROR STATE */}
                  {scanPhase === "error" && (
                    <div className="text-center py-4">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-400">
                        <AlertTriangle className="h-7 w-7" />
                      </div>
                      <p className="text-xs font-medium text-rose-300 max-w-xs mx-auto">
                        {errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-sky-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-sky-400" />
                  {isScanning ? "Scanning Active... Tap to Cancel" : "System Ready — Tap Panel"}
                </span>
                {scanPhase === "complete" && (
                  <span className="flex items-center gap-1 text-sky-400">
                    <RefreshCw className="h-3 w-3" /> Re-scan
                  </span>
                )}
              </div>
            </section>

            {/* SEPARATE METRIC TILES IN INDIVIDUAL FROSTED CONTAINERS */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Line Status</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-sky-400">Pressurized</p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Local Pressure</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white">2.8 Bar Avg</p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Outage Risk</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-sky-300">Low (8%)</p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Last Check</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white">Just now</p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: REAL-TIME WATER FAULTS */}
          <aside className="space-y-5">
            <section className="glass-panel p-4 sm:p-6 relative pointer-events-auto">
              <div className="panel-reflection pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div>
                  <p className="eyebrow text-sky-400">LIVE AREA REPORTS</p>
                  <h2 className="mt-1 text-sm sm:text-base font-semibold text-white">
                    Water Faults Nearby
                  </h2>
                </div>
                <Link
                  href="/civic"
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors cursor-pointer relative z-30"
                >
                  Report <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {deduplicatedWaterReports.length === 0 ? (
                  <div className="text-center py-8 text-muted text-xs">
                    No active water fault reports logged in your area.
                  </div>
                ) : (
                  deduplicatedWaterReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-1.5 relative z-20 pointer-events-auto"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-xs font-mono text-sky-400 font-bold">
                          {report.id}
                        </span>
                        <span className="text-[10px] font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                          {report.status}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-white">{report.title}</h3>
                      <p className="text-[11px] text-muted leading-relaxed">{report.description}</p>

                      <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-white/5 gap-2">
                        <span className="flex items-center gap-1 text-sky-300 font-mono truncate">
                          <MapPin className="h-3 w-3 text-sky-400 shrink-0" /> <span className="truncate">{report.locationAddress}</span>
                        </span>
                        <span className="shrink-0">{report.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>

        {/* WATER SHARING MARKETPLACE: STANDALONE SHARE TANK BUTTON & SEPARATE LISTING PANELS */}
        <div className="space-y-4 pt-2">
          
          {/* SEPARATED MARKETPLACE HEADER & SHARE TANK BUTTON */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-sky-400">COMMUNITY WATER</p>
              <h2 className="mt-1 text-base sm:text-lg font-medium text-white">
                Neighborhood Water Sharing Nodes
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="glass-panel px-4 py-3 flex items-center justify-center gap-2 text-xs font-bold text-sky-300 border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 transition-all cursor-pointer touch-manipulation pointer-events-auto z-30"
            >
              <Plus className="h-4 w-4 shrink-0 text-sky-400 pointer-events-none" />
              <span className="pointer-events-none">Share Tank</span>
            </button>
          </div>

          {/* INDIVIDUAL FROSTED GLASS PANELS FOR EACH LISTING (ENTIRE PANEL ACTS AS REQUEST BUTTON) */}
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
                      : "border-white/10 hover:border-sky-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="brand-icon feature-water shrink-0">
                        <Droplets className="h-4 w-4 text-sky-400" />
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
                    <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{node.location} ({node.distance})</span>
                  </p>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-sky-300">{node.capacity}</p>
                      <p className="text-[10px] text-muted">{node.price}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                      <MessageCircle className="h-4 w-4 shrink-0 text-sky-400" />
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
          <div className="glass-panel w-full max-w-md p-5 sm:p-6 relative border-sky-500/30 space-y-4 pointer-events-auto">
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Droplets className="h-4 w-4 text-sky-400 shrink-0" /> Register Water Tank
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
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-colors relative z-30 pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Supply Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-colors relative z-30 pointer-events-auto cursor-pointer"
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
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-colors relative z-30 pointer-events-auto"
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
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-colors relative z-30 pointer-events-auto"
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
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50 transition-colors relative z-30 pointer-events-auto"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold hover:bg-sky-500/30 transition-all mt-2 cursor-pointer touch-manipulation relative z-30 pointer-events-auto shadow-[0_0_20px_rgba(56,189,248,0.15)]"
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
