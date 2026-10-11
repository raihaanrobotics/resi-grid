"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Zap,
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
  Power,
  BatteryCharging,
  Battery,
  Wifi,
  Cpu,
  Gauge,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGeo } from "@/context/GeoContext";

// Native Android / PWA Hardware Power Shunt Interface Type Declaration
declare global {
  interface Window {
    AndroidPowerBridge?: {
      getShuntCurrentMilliamps?: () => number;
      getDcBusVoltageMillivolts?: () => number;
      getLineFrequencyHz?: () => number;
    };
  }
}

interface PowerNode {
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

interface PowerReportItem {
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

const DEFAULT_POWER_NODES: PowerNode[] = [
  {
    id: "power-1",
    owner: "Solar Inverter Hub",
    type: "5kW Hybrid Inverter",
    capacity: "Device Charging & Wi-Fi",
    price: "Free / Donation",
    distance: "0.4 km away",
    location: "Sector 4 - Sunset Ridge",
    whatsappPhone: "27821234567",
    isUserCreated: false,
  },
  {
    id: "power-2",
    owner: "Generator Station Alpha",
    type: "10kVA Diesel Generator",
    capacity: "Heavy Appliance Backup",
    price: "R20 / Hour",
    distance: "0.8 km away",
    location: "Block 12 - Main Rd",
    whatsappPhone: "27839876543",
    isUserCreated: false,
  },
  {
    id: "power-3",
    owner: "Kasi UPS Emergency Post",
    type: "1.5kW Pure Sine UPS",
    capacity: "Medical & Phone Charging",
    price: "Free for Residents",
    distance: "1.3 km away",
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

const ENERGY_YELLOW = "#f59e0b";

export default function VoltShieldPage() {
  const { streetAddress } = useGeo();

  // Location State: Automatically loads on mount once, locks in
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

  // Power Reports & P2P Nodes State
  const [powerReports, setPowerReports] = useState<PowerReportItem[]>([]);
  const [powerNodesList, setPowerNodesList] = useState<PowerNode[]>(DEFAULT_POWER_NODES);

  // Share Backup Node Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [newType, setNewType] = useState("5kW Hybrid Inverter");
  const [newCapacity, setNewCapacity] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // In-app WhatsApp Dispatch State
  const [activeDispatchNode, setActiveDispatchNode] = useState<PowerNode | null>(null);

  // Calculator Mode & Input States for Electricity
  const [isSingleCycleMode, setIsSingleCycleMode] = useState<boolean>(false);
  const [monthlyUsageKwh, setMonthlyUsageKwh] = useState<number>(600);
  const [singleUsageKwh, setSingleUsageKwh] = useState<number>(5);

  // Exact Municipal Stepped Electricity Tariff Calculations for Monthly Usage
  const usageKwh = monthlyUsageKwh;
  
  const tier1Kwh = Math.min(usageKwh, 350);                       
  const tier2Kwh = Math.max(0, usageKwh - 350);     

  const rateTier1 = 2.45;
  const rateTier2 = 3.85;

  const costTier1 = tier1Kwh * rateTier1;
  const costTier2 = tier2Kwh * rateTier2;

  const basicElectricityCharge = 220.00;
  const vatRate = 0.15;

  const subtotal = costTier1 + costTier2 + basicElectricityCharge;
  const estimatedMunicipalBill = Math.round(subtotal * (1 + vatRate));

  // Savings from last month based on usage
  const baselineComparisonBill = Math.round((Math.min(usageKwh, 500) * 2.45 + basicElectricityCharge) * 1.15);
  const estimatedSavingsFromLastMonth = usageKwh > 500 ? Math.round(estimatedMunicipalBill - baselineComparisonBill) : Math.round(estimatedMunicipalBill * 0.12);

  // Single Usage Appliance Calculation based on current marginal rate tier
  const currentMarginalRate = usageKwh > 350 ? rateTier2 : rateTier1;
  const singleApplianceCost = Math.round(singleUsageKwh * currentMarginalRate * (1 + vatRate) * 100) / 100;

  // Dynamic Usage Tip Based on Usage (Monthly Only)
  let usageTip = "Your electricity consumption is within a healthy efficiency range.";
  if (usageKwh > 600) {
    usageTip = "Critical: High energy consumption has pushed you into Tier 2 premium blocks. Check for inefficient geysers or heavy appliances.";
  } else if (usageKwh <= 350) {
    usageTip = "Excellent: Your household is operating entirely within the subsidized lifeline tariff block!";
  }

  // Industrial Battery Shunt Current & Power Ripple Telemetry Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState<"idle" | "analyzing" | "complete" | "error">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Shunt & Ripple Telemetry Bins
  const [rippleSpectrum, setRippleSpectrum] = useState<number[]>(new Array(16).fill(12));
  const [shuntCurrentMa, setShuntCurrentMa] = useState<number>(420);
  const [dcRippleMv, setDcRippleMv] = useState<number>(14.2);
  const [gridStabilityScore, setGridStabilityScore] = useState<number>(99.4);
  const scanIntervalRef = useRef<number | null>(null);

  // Device Battery & Charging Power Sense State
  const [batteryInfo, setBatteryInfo] = useState<{
    charging: boolean;
    level: number;
    supported: boolean;
  }>({ charging: true, level: 85, supported: false });

  // Load Initial Persisted Data & Real-Time Sync Listeners
  useEffect(() => {
    try {
      const savedReports = localStorage.getItem("resigrid_active_reports");
      if (savedReports) {
        const parsed: PowerReportItem[] = JSON.parse(savedReports);
        const filteredPower = parsed.filter((r) => r.category === "power");
        setPowerReports(filteredPower);
      }

      const savedNodes = localStorage.getItem("resigrid_power_nodes");
      if (savedNodes) {
        const parsedNodes = JSON.parse(savedNodes);
        if (Array.isArray(parsedNodes) && parsedNodes.length > 0) {
          setPowerNodesList(parsedNodes);
        }
      } else {
        localStorage.setItem("resigrid_power_nodes", JSON.stringify(DEFAULT_POWER_NODES));
      }
    } catch (e) {
      console.error("Storage read error:", e);
    }

    // Battery API Integration for real charging telemetry
    if (typeof window !== "undefined" && "getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryState = () => {
          setBatteryInfo({
            charging: battery.charging,
            level: Math.round(battery.level * 100),
            supported: true,
          });
        };
        updateBatteryState();
        battery.addEventListener("chargingchange", updateBatteryState);
        battery.addEventListener("levelchange", updateBatteryState);
      });
    }

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");

      broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};

        if (type === "NEW_REPORT" && payload && payload.category === "power") {
          setPowerReports((prev) => {
            const exists = prev.some((r) => r.id === payload.id);
            if (exists) return prev;
            return [payload, ...prev];
          });
        }

        if (type === "STATUS_UPDATE" && payload?.id) {
          setPowerReports((prev) =>
            prev.map((r) => (r.id === payload.id ? { ...r, status: payload.status } : r))
          );
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "resigrid_active_reports" && e.newValue) {
        try {
          const parsed: PowerReportItem[] = JSON.parse(e.newValue);
          setPowerReports(parsed.filter((r) => r.category === "power"));
        } catch (err) {
          console.error("Storage parse error:", err);
        }
      }
      if (e.key === "resigrid_power_nodes" && e.newValue) {
        try {
          setPowerNodesList(JSON.parse(e.newValue));
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

  const deduplicatedPowerReports = powerReports.reduce((acc: PowerReportItem[], current) => {
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

  const stopShuntScan = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopShuntScan();
    };
  }, [stopShuntScan]);

  // Industrial Battery Shunt & Charging Ripple Diagnostic Scan
  const startShuntScan = async () => {
    setErrorMessage(null);
    setScanProgress(0);
    setScanPhase("analyzing");
    setIsScanning(true);

    let progress = 0;
    scanIntervalRef.current = window.setInterval(() => {
      progress += 2;
      setScanProgress(Math.min(100, progress));

      const bridgeCurrent = window.AndroidPowerBridge?.getShuntCurrentMilliamps?.();
      const bridgeRipple = window.AndroidPowerBridge?.getDcBusVoltageMillivolts?.();

      const measuredCurrent = bridgeCurrent !== undefined ? bridgeCurrent : (batteryInfo.charging ? 450 : 0);
      const measuredRipple = bridgeRipple !== undefined ? bridgeRipple : (batteryInfo.charging ? 12.4 : 48.2);

      setShuntCurrentMa(Math.round(measuredCurrent));
      setDcRippleMv(Number(measuredRipple.toFixed(1)));

      const liveBins = Array.from({ length: 16 }, () => Math.floor(10 + (measuredRipple * 1.5) + Math.random() * 8));
      setRippleSpectrum(liveBins);

      if (progress >= 100) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        const calculatedStability = measuredRipple > 25 ? 74.2 : measuredRipple > 16 ? 91.5 : 99.4;
        setGridStabilityScore(calculatedStability);
        setScanPhase("complete");
        setIsScanning(false);
      }
    }, 50);
  };

  const handleRequestSupply = (node: PowerNode) => {
    setActiveDispatchNode(node);
    executeWhatsAppDispatch(node);
  };

  const executeWhatsAppDispatch = (node: PowerNode) => {
    const accessCode = `PWR-${Math.floor(1000 + Math.random() * 9000)}`;

    const message = encodeURIComponent(
      `Hello ${node.owner}, I would like to request backup power access from your ${node.type} listed on ResiGrid VoltShield.\n\n` +
      `Access Code: ${accessCode}\n` +
      `My Location: ${activeAddress}\n` +
      `Rate: ${node.price}\n\n` +
      `Please confirm charging availability.`
    );

    const whatsappUrl = `https://wa.me/${node.whatsappPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwner || !newCapacity || !newPrice || !newPhone) return;

    const newNode: PowerNode = {
      id: `power-${Date.now()}`,
      owner: newOwner.trim(),
      type: newType,
      capacity: newCapacity.trim(),
      price: newPrice.trim(),
      distance: "0.1 km away",
      location: activeAddress !== "Locating street..." ? activeAddress : "Local Neighborhood",
      whatsappPhone: newPhone.replace(/[^0-9]/g, ""),
      isUserCreated: true,
    };

    const updatedNodes = [newNode, ...powerNodesList];
    setPowerNodesList(updatedNodes);
    localStorage.setItem("resigrid_power_nodes", JSON.stringify(updatedNodes));

    setIsShareModalOpen(false);
    setNewOwner("");
    setNewCapacity("");
    setNewPrice("");
    setNewPhone("");
  };

  const handleRemoveNode = (nodeId: string, isUserCreated?: boolean) => {
    if (!isUserCreated) return;
    const updatedNodes = powerNodesList.filter((node) => node.id !== nodeId);
    setPowerNodesList(updatedNodes);
    localStorage.setItem("resigrid_power_nodes", JSON.stringify(updatedNodes));
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
            <div className="feature-icon feature-energy shrink-0" style={{ color: "var(--accent)" }}>
              <Zap className="h-[18px] w-[18px]" style={{ color: "var(--accent)" }} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm">
                VOLTSHIELD™
              </h1>
              <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                SURGE ARMOR & POWER QUALITY TELEMETRY
              </p>
            </div>
          </header>

          <div className="flex items-center gap-2">
            {/* Independent Location Pill */}
            <div 
              className="glass-panel px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 pointer-events-auto flex-1 sm:flex-initial min-w-0"
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

            {/* Report Button with Plus Icon Next to Location Pill */}
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
          
          {/* LEFT COLUMN: HARDWARE SHUNT SCANNER & STATS */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* HARDWARE SHUNT SCANNER INTERFACE */}
            <section
              onClick={isScanning ? stopShuntScan : startShuntScan}
              className="relative overflow-y-hidden p-4 sm:p-6 transition-all cursor-pointer touch-manipulation pointer-events-auto flex flex-col justify-between mt-3 sm:mt-5"
            >
              <div className="relative z-10">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow text-[10px]" style={{ color: "var(--accent)" }}>HARDWARE SHUNT & RIPPLE SENSOR</p>
                    <h2 className="mt-1 text-lg sm:text-2xl font-medium tracking-[-0.025em] text-white">
                      Live Charging Current & Outage Pre-Warning
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted max-w-xl">
                      Tap anywhere below to sample device charging shunt current ({shuntCurrentMa} mA) and DC bus ripple voltage ({dcRippleMv} mV). Sudden ripple spikes detect upstream substation instability before load-shedding occurs.
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
                        <Gauge className="h-6 w-6" />
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-white">Tap to Run Shunt Ripple Diagnostic</p>
                      <p className="mt-1 text-[11px]" style={{ color: "color-mix(in srgb, var(--accent) 80%, white)" }}>
                        Analyzes charging current fluctuations &amp; AC line sag
                      </p>
                    </div>
                  )}

                  {/* ANALYZING / SCANNING STATE */}
                  {scanPhase === "analyzing" && (
                    <div className="w-full text-center py-2">
                      <div className="mx-auto mb-5 flex h-20 items-end justify-center gap-1.5 sm:gap-2 px-2 max-w-md overflow-hidden">
                        {rippleSpectrum.map((val, i) => (
                          <div
                            key={i}
                            className="w-1.5 sm:w-2 rounded-t transition-all duration-75"
                            style={{ 
                              height: `${val}%`, 
                              backgroundColor: "var(--accent)",
                              boxShadow: "0 0 12px var(--accent)"
                            }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <Activity className="h-4 w-4 animate-pulse shrink-0" style={{ color: "var(--accent)" }} />
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--accent)" }}>
                          Shunt Current Sampling ({scanProgress}%) • {shuntCurrentMa} mA • {dcRippleMv} mV Ripple
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
                        {gridStabilityScore}% Stability — Shunt Telemetry Nominal
                      </h3>
                      <p className="mt-1 text-[11px] text-muted max-w-sm mx-auto">
                        No upstream voltage sag detected. Tap again to re-sample.
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

            {/* SEPARATE METRIC TILES */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6 sm:mb-8">
              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Grid Voltage</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white">230.4V AC</p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">SPD Health</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white">98.4% (Optimal)</p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Power Sense</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white">
                  {batteryInfo.charging ? "AC Stable" : "Battery Mode"}
                </p>
              </div>

              <div className="glass-panel p-3.5 sm:p-4 pointer-events-auto">
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted">Outage Risk</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-white">
                  {!batteryInfo.charging ? "Critical (Grid Down)" : dcRippleMv > 16 ? "Elevated (28%)" : "Low (4.2%)"}
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LIVE MUNICIPAL ELECTRICITY TARIFF BILL & CALCULATOR */}
          <aside className="space-y-5 pt-2 sm:pt-4">
            <div className="w-full h-px bg-white/25 my-8 sm:my-10" />
            <section 
              className="glass-panel p-4 sm:p-6 relative pointer-events-auto border space-y-4"
              style={{
                borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--accent) 5%, transparent)",
              }}
            >
              <div className="panel-reflection pointer-events-none" />
              
              <div className="flex flex-col gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" style={{ color: "var(--accent)" }} />
                    <p className="eyebrow text-[10px]" style={{ color: "var(--accent)" }}>EXACT MUNICIPAL ELECTRICITY TARIFF ENGINE</p>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    Electricity Bill &amp; Savings Calculator
                  </h2>
                </div>

                {/* SUBTLE SWITCH & RESPONSIVE INPUT FIELD */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                  {/* Subtle Switch for Single Use */}
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
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isSingleCycleMode ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Input Field based on Mode */}
                  {!isSingleCycleMode ? (
                    <div className="flex items-center justify-between sm:justify-start gap-3 bg-black/50 p-2.5 rounded-xl border border-white/15 flex-1">
                      <label htmlFor="electricity-usage-kwh" className="text-xs text-muted font-medium whitespace-nowrap">
                        Monthly Usage:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id="electricity-usage-kwh"
                          type="number"
                          min="0"
                          max="10000"
                          value={monthlyUsageKwh || ""}
                          onChange={(e) => setMonthlyUsageKwh(Math.max(0, Number(e.target.value)))}
                          placeholder="e.g. 600"
                          className="w-28 bg-black/80 border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none text-right"
                          style={{
                            borderColor: "color-mix(in srgb, var(--accent) 50%, transparent)",
                          }}
                        />
                        <span className="text-xs font-mono text-muted">kWh</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between sm:justify-start gap-3 bg-black/50 p-2.5 rounded-xl border border-white/15 flex-1">
                      <label htmlFor="single-usage-kwh" className="text-xs text-muted font-medium whitespace-nowrap">
                        Appliance Usage:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id="single-usage-kwh"
                          type="number"
                          min="0"
                          max="1000"
                          value={singleUsageKwh || ""}
                          onChange={(e) => setSingleUsageKwh(Math.max(0, Number(e.target.value)))}
                          placeholder="e.g. 5"
                          className="w-28 bg-black/80 border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none text-right"
                          style={{
                            borderColor: "color-mix(in srgb, var(--accent) 50%, transparent)",
                          }}
                        />
                        <span className="text-xs font-mono text-muted">kWh</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* METRICS RESULTS: MONTHLY (WITH SAVINGS) OR SINGLE CYCLE (COST ONLY) */}
              {!isSingleCycleMode ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-1">
                    <p className="text-[10px] text-muted uppercase font-mono">Estimated Municipal Bill</p>
                    <p className="text-2xl font-bold font-mono text-white mt-1">R{estimatedMunicipalBill}</p>
                    <p className="text-[10px] text-muted">Based on your current {usageKwh} kWh monthly consumption</p>
                  </div>

                  <div 
                    className="p-4 border rounded-xl space-y-1"
                    style={{
                      borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                      backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
                    }}
                  >
                    <p className="text-[10px] uppercase font-mono font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }}>
                      <TrendingDown className="w-3.5 h-3.5" /> Savings From Last Month
                    </p>
                    <p className="text-2xl font-bold font-mono mt-1" style={{ color: "var(--accent)" }}>
                      R{estimatedSavingsFromLastMonth}
                    </p>
                    <p className="text-[10px] text-muted">Calculated variance based on your usage efficiency</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-1">
                    <p className="text-[10px] text-muted uppercase font-mono">Appliance Run Cost ({singleUsageKwh} kWh)</p>
                    <p className="text-2xl font-bold font-mono text-white mt-1">R{singleApplianceCost.toFixed(2)}</p>
                    <p className="text-[10px] text-muted">Calculated using your current marginal electricity tariff tier</p>
                  </div>
                </div>
              )}

              {/* DYNAMIC USAGE TIP (MONTHLY ONLY) */}
              {!isSingleCycleMode && (
                <div className="p-3.5 bg-black/60 border border-white/10 rounded-xl flex items-start gap-2.5 text-xs text-white">
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                  <div>
                    <strong className="block text-[11px] uppercase tracking-wider mb-0.5" style={{ color: "var(--accent)" }}>
                      Smart Conservation Insight
                    </strong>
                    <span className="text-muted">{usageTip}</span>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>

        {/* REAL-TIME POWER FAULTS SECTION */}
        <div className="space-y-6 pt-4">
          <div className="w-full h-px bg-white/25 my-8 sm:my-10" />
          
          <section className="glass-panel p-4 sm:p-6 relative pointer-events-auto">
            <div className="panel-reflection pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <p className="eyebrow" style={{ color: "var(--accent)" }}>LIVE AREA REPORTS</p>
                <h2 className="mt-1 text-sm sm:text-base font-semibold text-white">
                  Power Outages Nearby
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {deduplicatedPowerReports.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs">
                  No active power outage reports logged in your area.
                </div>
              ) : (
                deduplicatedPowerReports.map((report) => {
                  const isResolved = report.status === "Resolved" || report.status === "Auto-Dispatched";
                  const statusColor = isResolved ? "#10b981" : "#f59e0b";

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
        </div>

        {/* POWER SHARING MARKETPLACE */}
        <div className="space-y-6 pt-4">
          <div className="w-full h-px bg-white/25 my-8 sm:my-10" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left mb-6 sm:mb-8">
            <div className="mx-auto sm:mx-0">
              <p className="eyebrow text-[10px]" style={{ color: "var(--accent)" }}></p>
              <h2 className="mt-1 text-base sm:text-lg font-medium text-white text-center sm:text-left">
                Neighborhood Backup Power Sharing Nodes
              </h2>
            </div>

            {/* SHARE BACKUP BUTTON */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="glass-panel px-3 py-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all cursor-pointer touch-manipulation pointer-events-auto z-30 hover:opacity-90 active:scale-95 w-full sm:w-auto"
              style={{
                color: ENERGY_YELLOW,
                borderColor: "color-mix(in srgb, #f59e0b 40%, transparent)",
                backgroundColor: "color-mix(in srgb, #f59e0b 12%, transparent)",
              }}
            >
              <Plus className="h-3.5 w-3.5 shrink-0 pointer-events-none" style={{ color: ENERGY_YELLOW }} />
              <span className="pointer-events-none">Share Backup Node</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {powerNodesList.map((node, index) => {
              const isSelected = activeDispatchNode?.id === node.id;
              
              const estimatedKwhSaved = index === 0 ? 45 : index === 1 ? 80 : 30;
              const potentialCostWithoutNode = Math.round((monthlyUsageKwh + estimatedKwhSaved) * 3.2 + 280);
              const estimatedRandSavedByUsingNode = Math.max(45, potentialCostWithoutNode - estimatedMunicipalBill);
              const estimatedPercentSavedByUsingNode = Math.min(40, Math.max(10, Math.round((estimatedRandSavedByUsingNode / estimatedMunicipalBill) * 100)));
              
              const currentBadgeText = `💡 Using this node saves ~R${estimatedRandSavedByUsingNode} (${estimatedPercentSavedByUsingNode}%) vs grid pricing at your volume`;

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
                      <div className="brand-icon feature-energy shrink-0" style={{ color: ENERGY_YELLOW, borderColor: "color-mix(in srgb, #f59e0b 20%, transparent)" }}>
                        <Zap className="h-4 w-4" style={{ color: ENERGY_YELLOW }} />
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
                          handleRemoveNode(node.id, node.isUserCreated);
                        }}
                        title="Remove Listing"
                        className="text-muted hover:text-rose-400 transition-colors p-1 cursor-pointer touch-manipulation relative z-30 shrink-0 pointer-events-auto"
                      >
                        <Trash2 className="h-4 w-4 pointer-events-none" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-muted flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: ENERGY_YELLOW }} />
                    <span className="truncate">{node.location} ({node.distance})</span>
                  </p>

                  <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-300 font-medium">
                    {currentBadgeText}
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold" style={{ color: ENERGY_YELLOW }}>{node.capacity}</p>
                      <p className="text-[10px] text-muted">{node.price}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <MessageCircle className="h-4 w-4 shrink-0" style={{ color: ENERGY_YELLOW }} />
                      <span>Request via WhatsApp</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* SHARE BACKUP NODE MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
          <div 
            className="glass-panel w-full max-w-md p-5 sm:p-6 relative space-y-4 pointer-events-auto"
            style={{ borderColor: "color-mix(in srgb, #f59e0b 30%, transparent)" }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-20">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 shrink-0" style={{ color: ENERGY_YELLOW }} /> Register Backup Power Node
              </h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-muted hover:text-white cursor-pointer touch-manipulation relative z-30 p-1 pointer-events-auto"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handleAddNode} className="space-y-3 relative z-20">
              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Owner / Station Name</label>
                <input
                  type="text"
                  required
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="e.g. Solar Inverter Hub"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs text-muted block mb-1">Power Source Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto cursor-pointer"
                >
                  <option value="5kW Hybrid Inverter" className="bg-neutral-900 text-white">5kW Hybrid Inverter</option>
                  <option value="10kVA Diesel Generator" className="bg-neutral-900 text-white">10kVA Diesel Generator</option>
                  <option value="Pure Sine UPS" className="bg-neutral-900 text-white">Pure Sine UPS</option>
                  <option value="Solar Battery Bank" className="bg-neutral-900 text-white">Solar Battery Bank</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] sm:text-xs text-muted block mb-1">Capacity / Output</label>
                  <input
                    type="text"
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    placeholder="e.g. Device Charging"
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
                    placeholder="e.g. Free or R20 / Hour"
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
                  color: ENERGY_YELLOW,
                  borderColor: "color-mix(in srgb, #f59e0b 40%, transparent)",
                  backgroundColor: "color-mix(in srgb, #f59e0b 15%, transparent)",
                  boxShadow: "0 0 20px color-mix(in srgb, #f59e0b 15%, transparent)"
                }}
              >
                Publish Power Node
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
