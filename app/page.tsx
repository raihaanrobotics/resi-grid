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
  CloudSun,
  ShoppingBag,
  Store,
  UserRound,
  Zap,
  X,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

// Native Android Hardware & Push Notification Bridge Declaration
declare global {
  interface Window {
    AndroidNotificationBridge?: {
      postSystemNotification?: (title: string, message: string, category: string) => void;
    };
  }
}

export interface ResiGridNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "warning" | "success" | "info" | "error";
  category?: string;
  read?: boolean;
}

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
    title: "Weather & Climate",
    description: "Check storm warnings & climate updates",
    href: "/weather",
    icon: CloudSun,
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
  const [weatherSummary, setWeatherSummary] = useState<string>("Loading weather...");
  const [summaryText, setSummaryText] = useState<string>(
    "Water, power, and climate conditions are looking good in your area today."
  );

  // Notification Feed State & Modal Controls
  const [notifications, setNotifications] = useState<ResiGridNotification[]>([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Function to trigger system-level device notification (Ready for Capacitor & Android Studio)
  const triggerNativeDeviceNotification = (title: string, message: string, category = "general") => {
    // 1. Android Native Java/Kotlin Bridge Hook
    if (window.AndroidNotificationBridge?.postSystemNotification) {
      window.AndroidNotificationBridge.postSystemNotification(title, message, category);
      return;
    }

    // 2. Standard Web Push Notification API Fallback for mobile browser wake-up
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body: message,
          icon: "/favicon.ico",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, {
              body: message,
              icon: "/favicon.ico",
            });
          }
        });
      }
    }
  };

  const loadGlobalNotifications = () => {
    try {
      const savedNotifs = localStorage.getItem("resigrid_global_notifications");
      if (savedNotifs) {
        const parsed: ResiGridNotification[] = JSON.parse(savedNotifs);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n) => !n.read).length);
      } else {
        // Initial welcome broadcast without emojis
        const defaultNotifs: ResiGridNotification[] = [
          {
            id: "notif-init-1",
            title: "Neighborhood Updates Active",
            description: "Live alerts for water, power, and community services are enabled.",
            time: "Just now",
            type: "info",
            category: "system",
            read: false,
          },
        ];
        setNotifications(defaultNotifs);
        setUnreadCount(1);
        localStorage.setItem("resigrid_global_notifications", JSON.stringify(defaultNotifs));
      }
    } catch (err) {
      console.error("Error reading global notifications:", err);
    }
  };

  useEffect(() => {
    // Request Browser Notification permissions on mount for background wake-up
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    loadGlobalNotifications();

    // Fetch live local weather from Open-Meteo
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
            );
            if (res.ok) {
              const data = await res.json();
              const temp = Math.round(data.current?.temperature_2m ?? 22);
              setWeatherSummary(`${temp}°C • Clear / Stable`);
            } else {
              setWeatherSummary("22°C • Clear / Stable");
            }
          } catch {
            setWeatherSummary("22°C • Clear / Stable");
          }
        },
        () => {
          setWeatherSummary("22°C • Clear / Stable");
        },
        { timeout: 5000 }
      );
    } else {
      setWeatherSummary("22°C • Clear / Stable");
    }

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

        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach((report: any) => {
              const cat = (report.category || "").toLowerCase();
              if (cat === "water") hasWaterIssue = true;
              if (cat === "power") hasPowerIssue = true;
            });
          }
        }

        const newWater = hasWaterIssue ? "Issue reported" : "Normal";
        const newEnergy = hasPowerIssue ? "Issue reported" : "Normal";

        setWaterStatus(newWater);
        setEnergyStatus(newEnergy);

        if (hasWaterIssue || hasPowerIssue) {
          setSummaryText("Some infrastructure issues have been reported nearby.");
        } else {
          setSummaryText("Water, power, and climate conditions are looking good in your area today.");
        }

        // Re-sync notifications when data changes
        loadGlobalNotifications();
      } catch (e) {
        console.error("Error reading status data:", e);
      }
    };

    syncStatusFromData();

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");
      broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === "NEW_REPORT" || type === "STATUS_UPDATE") {
          syncStatusFromData();

          if (payload && payload.title) {
            triggerNativeDeviceNotification(
              payload.title,
              payload.description || "New update reported in your area.",
              payload.category || "general"
            );
          }
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "resigrid_active_reports" || e.key === "resigrid_global_notifications") {
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

  const handleOpenNotificationsModal = () => {
    setIsNotifModalOpen(true);
    // Mark all as read when opening
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    localStorage.setItem("resigrid_global_notifications", JSON.stringify(updated));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem("resigrid_global_notifications");
  };

  const handleDismissSingleNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.read).length);
    localStorage.setItem("resigrid_global_notifications", JSON.stringify(updated));
  };

  // Group notifications by category/genre
  const groupedNotifications = notifications.reduce((acc, notif) => {
    const categoryKey = (notif.category || "General").toUpperCase();
    if (!acc[categoryKey]) acc[categoryKey] = [];
    acc[categoryKey].push(notif);
    return acc;
  }, {} as Record<string, ResiGridNotification[]>);

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
              type="button"
              onClick={handleOpenNotificationsModal}
              aria-label="Notifications"
              className="glass-icon-button relative cursor-pointer touch-manipulation"
            >
              <Bell className="h-[17px] w-[17px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-black shadow-sm">
                  {unreadCount}
                </span>
              )}
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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

                <div className="col-span-2 sm:col-span-1">
                  <StatusItem
                    icon={CloudSun}
                    label="Weather"
                    status={weatherSummary}
                    color="transport"
                  />
                </div>
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

      {/* SLEEK, SEPARATE PILLS NOTIFICATION OVERLAY */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 pointer-events-auto transition-all">
          <div className="w-full max-w-lg relative space-y-4 pointer-events-auto max-h-[85vh] sm:max-h-[80vh] flex flex-col justify-between">
            {/* Direct Header Row (No Outer Container Panel & No Close Button Here) */}
            <div className="flex items-center justify-between px-2 pb-1 relative z-20 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold tracking-wider text-white uppercase text-[11px]">
                  Notifications
                </h3>
              </div>
            </div>

            {/* Notification List Feed (Grouped into Floating Rounded Pills) */}
            <div className="overflow-y-auto space-y-4 pr-1 relative z-20 flex-1 my-1 max-h-[65vh]">
              {notifications.length === 0 ? (
                <div className="glass-panel p-8 text-center text-muted text-xs rounded-2xl space-y-2 border border-white/10">
                  <Bell className="h-6 w-6 mx-auto opacity-30 text-[var(--accent)]" />
                  <p>All caught up. No active notifications.</p>
                </div>
              ) : (
                Object.entries(groupedNotifications).map(([genre, notifs]) => (
                  <div key={genre} className="space-y-2">
                    <p className="text-[9px] font-mono font-bold tracking-widest text-[var(--accent)] uppercase px-2">
                      {genre}
                    </p>
                    <div className="space-y-2">
                      {notifs.map((notif) => {
                        let NotifIcon = Info;
                        let iconColorStyle = { color: "var(--accent)" };

                        if (notif.type === "warning") {
                          NotifIcon = AlertTriangle;
                          iconColorStyle = { color: "#f59e0b" };
                        } else if (notif.type === "success") {
                          NotifIcon = CheckCircle2;
                          iconColorStyle = { color: "#10b981" };
                        }

                        return (
                          <div
                            key={notif.id}
                            className="glass-panel p-3.5 rounded-2xl border border-white/10 bg-black/60 relative flex items-start justify-between gap-3 transition-all hover:border-white/20 shadow-lg"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <NotifIcon className="h-4 w-4 shrink-0 mt-0.5" style={iconColorStyle} />
                              <div className="space-y-0.5 min-w-0">
                                <h4 className="text-xs font-semibold text-white leading-snug truncate">
                                  {notif.title}
                                </h4>
                                <p className="text-[11px] text-muted leading-relaxed">
                                  {notif.description}
                                </p>
                                <span className="inline-block text-[9px] font-mono text-muted/70 pt-0.5">
                                  {notif.time}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDismissSingleNotification(notif.id)}
                              className="text-muted hover:text-white transition-colors p-1 shrink-0 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Clear Button (Bin Icon) & Close Button */}
            <div className="pt-2 flex items-center justify-between relative z-20 shrink-0">
              {notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearNotifications}
                  className="text-xs text-muted hover:text-rose-400 transition-colors font-medium flex items-center gap-1.5 cursor-pointer py-2 px-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setIsNotifModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-black transition-all cursor-pointer touch-manipulation hover:opacity-90 shadow-lg"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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

      <p className="mt-0.5 text-[11px] font-medium opacity-85">{status}</p>
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
    <div className="notifications-summary-metric">
      <p className="text-[9px] uppercase tracking-[0.08em] text-muted">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
