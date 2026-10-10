"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Activity,
  Bell,
  ChevronRight,
  Droplets,
  Home,
  Landmark,
  Map,
  Network,
  Radio,
  Route,
  ShoppingBag,
  Store,
  UserRound,
  Zap,
} from "lucide-react";

const modules = [
  {
    title: "Water & Tanks",
    description: "Check water flow & community tanks",
    href: "/hydromesh",
    icon: Droplets,
    color: "water",
  },
  {
    title: "Power & Load",
    description: "See power status & backup spots",
    href: "/voltshield",
    icon: Zap,
    color: "energy",
  },
  {
    title: "Local Shops",
    description: "Find food & emergency supplies",
    href: "/spazarescue",
    icon: Store,
    color: "food",
  },
  {
    title: "Roads & traffic",
    description: "Check safe routes & road blocks",
    href: "/routepulse",
    icon: Route,
    color: "transport",
  },
  {
    title: "Report issue",
    description: "Report a burst pipe or outage",
    href: "/civic",
    icon: Landmark,
    color: "civic",
  },
  {
    title: "Community",
    description: "Chat with your street or neighborhood",
    href: "/kasi-mesh",
    icon: Network,
    color: "mesh",
  },
];

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Radar", href: "/radar", icon: Radio },
  { label: "Market", href: "/marketplace", icon: ShoppingBag },
  { label: "Features", href: "/features", icon: Network },
  { label: "Profile", href: "/profile", icon: UserRound },
];

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

export default function HomePage() {
  const [greetingPrefix, setGreetingPrefix] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [waterStatus, setWaterStatus] = useState<string>("Normal");
  const [energyStatus, setEnergyStatus] = useState<string>("Normal");
  const [routesStatus, setRoutesStatus] = useState<string>("Clear");
  const [summaryText, setSummaryText] = useState<string>("Water, power, and roads are looking good in your area today.");

  useEffect(() => {
    // 1. Bulletproof Theme Persistence on Mount & Refresh
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

    // Event listener for real-time updates when modified on profile page
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

    // 2. Greeting & User Name Handler
    const hour = new Date().getHours();
    let timeOfDayGreeting = "Good morning";

    if (hour >= 12 && hour < 18) {
      timeOfDayGreeting = "Good afternoon";
    } else if (hour >= 18 || hour < 5) {
      timeOfDayGreeting = "Good evening";
    }

    let savedName = "Raihaan";
    try {
      const profileData = localStorage.getItem("resigrid_user_profile");
      if (profileData) {
        const parsed = JSON.parse(profileData);
        if (parsed.fullName) {
          savedName = parsed.fullName.split(" ")[0];
        }
      } else {
        savedName = localStorage.getItem("resigrid-user-name") || "Raihaan";
      }
    } catch {
      savedName = "Raihaan";
    }

    setGreetingPrefix(timeOfDayGreeting);
    setUserName(savedName);

    // 3. Real-time Status Sync from localStorage & BroadcastChannel
    const syncStatusFromData = () => {
      try {
        const saved = localStorage.getItem("resigrid_active_reports");
        let hasWaterIssue = false;
        let hasPowerIssue = false;
        let hasRoadIssue = false;

        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach((report: any) => {
              const cat = (report.category || "").toLowerCase();
              if (cat === "water") hasWaterIssue = true;
              if (cat === "power") hasPowerIssue = true;
              if (cat === "roads") hasRoadIssue = true;
            });
          }
        }

        const newWater = hasWaterIssue ? "Issue reported" : "Normal";
        const newEnergy = hasPowerIssue ? "Issue reported" : "Normal";
        const newRoutes = hasRoadIssue ? "Issue reported" : "Clear";

        setWaterStatus(newWater);
        setEnergyStatus(newEnergy);
        setRoutesStatus(newRoutes);

        if (hasWaterIssue || hasPowerIssue || hasRoadIssue) {
          setSummaryText("Some infrastructure issues have been reported nearby.");
        } else {
          setSummaryText("Water, power, and roads are looking good in your area today.");
        }
      } catch (e) {
        console.error("Error reading status data:", e);
      }
    };

    syncStatusFromData();

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");
      broadcastChannel.onmessage = (event) => {
        const { type } = event.data || {};
        if (type === "NEW_REPORT" || type === "STATUS_UPDATE") {
          syncStatusFromData();
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "resigrid_active_reports") {
        syncStatusFromData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("resigrid_theme_change", handleThemeEvent);
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <main className="resigrid-shell min-h-screen w-full overflow-x-hidden text-[var(--text)] selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient environment */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-orb orb-four" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1500px] px-3 pb-28 pt-4 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">
        {/* HEADER */}
        <header className="glass-header mb-6 flex items-center justify-between px-4 py-3 sm:mb-8 sm:px-5 lg:px-6">
          <Link href="/" className="flex items-center gap-3">
            {/* BRAND ICON LOCKED TO RESI TEAL ALWAYS */}
            <div className="brand-icon !text-[#14b8a6] !border-[#14b8a6]/20">
              <Activity className="h-[18px] w-[18px]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-[0.2em] sm:text-sm">
                  RESIGRID
                </span>
              </div>

              <p className="mt-0.5 block text-[9px] tracking-[0.15em] text-muted">
                YOUR LOCAL NEIGHBORHOOD HUB
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="glass-icon-button"
            >
              <Bell className="h-[17px] w-[17px]" />
            </button>
          </div>
        </header>

        {/* GREETING & UPDATE TEXT OUTSIDE CONTAINER */}
        <div className="mb-5 max-w-2xl px-1 sm:mb-7">
          {greetingPrefix && (
            <h2 className="mb-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl lg:text-4xl">
              <span className="text-white">{greetingPrefix}, </span>
              <span className="text-[var(--accent)]">{userName}</span>
            </h2>
          )}

          <p className="mt-2 max-w-xl text-xs leading-5 text-muted sm:text-sm sm:leading-6">
            {summaryText}
          </p>
        </div>

        {/* DASHBOARD */}
        <div className="w-full space-y-5 sm:space-y-6">
          {/* RADAR */}
          <section className="glass-panel radar-panel relative mb-8 overflow-hidden p-4 sm:mb-10 sm:p-6 lg:p-7">
            <div className="panel-reflection" />
            <div className="panel-bottom-glow radar-glow" />

            <div className="relative z-10">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <StatusItem
                  icon={Droplets}
                  label="Water"
                  status={waterStatus}
                  color="water"
                />

                <StatusItem
                  icon={Zap}
                  label="Energy"
                  status={energyStatus}
                  color="energy"
                />

                <StatusItem
                  icon={Route}
                  label="Routes"
                  status={routesStatus}
                  color="transport"
                />
              </div>

              <Link
                href="/radar"
                className="glass-action mt-3 flex items-center justify-between px-4 py-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="h-4 w-4 text-[var(--accent)]" />

                  <span className="text-xs font-medium">
                    Open live radar
                  </span>
                </div>

                <ChevronRight className="h-4 w-4 opacity-40" />
              </Link>
            </div>
          </section>

          {/* SYSTEMS */}
          <section className="w-full">
            <div className="mb-3 flex items-end justify-between px-1">
              <div>
                <p className="eyebrow">RESILIENCE SYSTEMS</p>

                <h2 className="mt-1 text-lg font-medium tracking-[-0.025em] sm:text-xl">
                  Quick access
                </h2>
              </div>

              <span className="text-[10px] text-muted">06 SYSTEMS</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => {
                const Icon = module.icon;

                return (
                  <Link
                    key={module.title}
                    href={module.href}
                    className={`glass-module group feature-${module.color} w-full`}
                  >
                    <div className="module-inner-glow" />

                    <div className="relative z-10">
                      <div className="mb-6 flex items-start justify-between sm:mb-8">
                        <div className="module-icon">
                          <Icon className="h-[18px] w-[18px]" />
                        </div>

                        <ChevronRight className="h-4 w-4 opacity-20 transition group-hover:translate-x-0.5 group-hover:opacity-60" />
                      </div>

                      <h3 className="text-sm font-medium">{module.title}</h3>

                      <p className="mt-1 text-[11px] text-muted">
                        {module.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatusItem({
  icon: Icon,
  label,
  status,
  color,
}: {
  icon: React.ElementType;
  label: string;
  status: string;
  color: string;
}) {
  return (
    <div className={`glass-status status-${color}`}>
      <Icon className="mb-2 h-4 w-4" />

      <p className="text-[10px] text-muted">{label}</p>

      <p className="mt-0.5 text-[11px] font-medium opacity-80">{status}</p>
    </div>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="px-3 text-center first:pl-0 last:pr-0">
      <p className="text-xl font-medium tracking-[-0.04em] sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mini-metric">
      <p className="text-[9px] uppercase tracking-[0.08em] text-muted">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
