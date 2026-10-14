"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  ChevronRight,
  Droplets,
  Landmark,
  Radio,
  CloudSun,
  Store,
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
  timestamp: number; // Required for reliable relative timestamp calculations
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
    "No reports. Water, power, and climate conditions are looking good in your area today."
  );

  // Notification Feed State & Modal Controls
  const [notifications, setNotifications] = useState<ResiGridNotification[]>([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Lock body scroll and handle mobile viewport when notification modal is active
  useEffect(() => {
    if (isNotifModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isNotifModalOpen]);

  // Robust helper to calculate accurate real-time relative timestamps from epoch milliseconds
  const getRelativeTimeString = (timestamp?: number) => {
    if (!timestamp || isNaN(timestamp)) return "Just now";
    const diffMs = Date.now() - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 45) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Function to trigger system-level device notification
  const triggerNativeDeviceNotification = (title: string, message: string, category = "general") => {
    if (window.AndroidNotificationBridge?.postSystemNotification) {
      window.AndroidNotificationBridge.postSystemNotification(title, message, category);
      return;
    }

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
      const now = Date.now();
      if (savedNotifs) {
        const parsed: ResiGridNotification[] = JSON.parse(savedNotifs);
        const updatedTimes = parsed.map((n) => ({
          ...n,
          timestamp: n.timestamp || now, // fallback if legacy item lacked timestamp
          time: getRelativeTimeString(n.timestamp || now),
        }));
        setNotifications(updatedTimes);
        setUnreadCount(updatedTimes.filter((n) => !n.read).length);
      } else {
        const defaultNotifs: ResiGridNotification[] = [
          {
            id: "notif-init-1",
            title: "Neighborhood Updates Active",
            description: "Live alerts for water, power, and community services are enabled.",
            time: "Just now",
            type: "info",
            category: "system",
            read: false,
            timestamp: now,
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
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    loadGlobalNotifications();

    // Live relative timestamp updater ticker every 5 seconds for instant updates
    const tickerInterval = setInterval(() => {
      syncStatusFromData();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          time: getRelativeTimeString(n.timestamp),
        }))
      );
    }, 5000);

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

    // Theme Persistence
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

    // Greeting & User Name Handler
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

    // Real-time Status Sync from localStorage
    const syncStatusFromData = () => {
      try {
        const saved = localStorage.getItem("resigrid_active_reports");
        let hasWaterIssue = false;
        let hasPowerIssue = false;

        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((report: any) => {
              const cat = (report.category || "").toLowerCase();
              if (cat === "water" || cat.includes("water")) hasWaterIssue = true;
              if (cat === "power" || cat.includes("power") || cat.includes("electricity")) hasPowerIssue = true;
            });
            if (!hasWaterIssue && !hasPowerIssue && parsed.length > 0) {
              hasWaterIssue = true;
            }
          }
        }

        const newWater = hasWaterIssue ? "Issue reported" : "Normal";
        const newEnergy = hasPowerIssue ? "Issue reported" : "Normal";

        setWaterStatus(newWater);
        setEnergyStatus(newEnergy);

        if (hasWaterIssue || hasPowerIssue || (saved && JSON.parse(saved).length > 0)) {
          setSummaryText("Issues have been reported in your area.");
        } else {
          setSummaryText("No issues reported in your area today.");
        }

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
    window.addEventListener("focus", syncStatusFromData);

    return () => {
      window.removeEventListener("resigrid_theme_change", handleThemeEvent);
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", syncStatusFromData);
      clearInterval(tickerInterval);
    };
  }, []);

  const handleOpenNotificationsModal = () => {
    setIsNotifModalOpen(true);
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

  const groupedNotifications = notifications.reduce((acc, notif) => {
    const categoryKey = (notif.category || "General").toUpperCase();
    if (!acc[categoryKey]) acc[categoryKey] = [];
    acc[categoryKey].push(notif);
    return acc;
  }, {} as Record<string, ResiGridNotification[]>);

  return (
    <main className="resigrid-shell min-h-screen w-full overflow-x-hidden text-[var(--text)] selection:bg-cyan-500/30 selection:text-cyan-200 relative">
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
                YOUR NEIGHBORHOOD HUB
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

              <span className="text-[10px] text-muted">05 SYSTEMS</span>
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

                    <div className="relative z-15">
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

      {/* FULL-SCREEN IMMERSIVE MOBILE-RESPONSIVE NOTIFICATION MODAL OVERLAY */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-[99999] flex flex-col bg-black/98 backdrop-blur-2xl pointer-events-auto transition-all overflow-hidden h-[100dvh] w-[100vw]">
          <div className="w-full h-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between relative z-20 overflow-hidden">
            
            {/* Header with Title and X Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0 pt-2 sm:pt-0">
              <div className="flex items-center gap-2.5">
                <Bell className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="text-xs sm:text-base font-bold tracking-wider text-white uppercase">
                  Notifications &amp; Advisories
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsNotifModalOpen(false)}
                aria-label="Close notifications"
                className="text-muted hover:text-white transition-colors p-2.5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer touch-manipulation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Notification Feed with Hidden Scrollbar */}
            <div className="overflow-y-auto space-y-6 py-4 flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-0">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted text-xs space-y-3">
                  <Bell className="h-10 w-10 opacity-30 text-[var(--accent)]" />
                  <p>All caught up. No active notifications.</p>
                </div>
              ) : (
                Object.entries(groupedNotifications).map(([genre, notifs]) => (
                  <div key={genre} className="space-y-3">
                    <p className="text-[10px] font-mono font-bold tracking-widest text-[var(--accent)] uppercase px-1">
                      {genre}
                    </p>
                    <div className="space-y-3">
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
                            className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-black/60 relative flex items-start justify-between gap-4 transition-all hover:border-white/20 shadow-lg"
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <NotifIcon className="h-5 w-5 shrink-0 mt-0.5" style={iconColorStyle} />
                              <div className="space-y-1 min-w-0">
                                <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug">
                                  {notif.title}
                                </h4>
                                <p className="text-xs text-muted leading-relaxed">
                                  {notif.description}
                                </p>
                                <span className="inline-block text-[10px] font-mono text-muted/70 pt-0.5">
                                  {notif.time}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDismissSingleNotification(notif.id)}
                              aria-label="Dismiss notification"
                              className="text-muted hover:text-white transition-colors p-2 shrink-0 cursor-pointer rounded-xl bg-white/5 border border-white/10 touch-manipulation"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Clear All Button */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end shrink-0 pb-safe">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearNotifications}
                  className="text-xs text-muted hover:text-rose-400 transition-colors font-medium flex items-center gap-1.5 cursor-pointer py-3 px-5 rounded-2xl bg-white/5 border border-white/10 touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" /> Clear All Notifications
                </button>
              )}
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
