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
import { supabase } from "@/lib/supabase";
import { useGeo } from "@/context/GeoContext";
import { readOfflineData, writeOfflineData } from "@/lib/offline/dataCache";
import {
  getGlobalNotifications,
  saveGlobalNotifications,
  syncReportNotifications,
} from "@/lib/notifications/globalNotifications";
import type { ResiGridNotification } from "@/lib/notifications/globalNotifications";
import { filterWithinRadius } from "@/lib/geoUtils";

interface HomeReport {
  report_id: string | null;
  category: string | null;
  title: string | null;
  description: string | null;
  location_address: string | null;
  province: string | null;
  municipality: string | null;
  ward: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
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
  const { location } = useGeo();
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
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled" | "denied" | "unsupported" | "unconfigured">("checking");
  const [pushMessage, setPushMessage] = useState("");

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

  const loadGlobalNotifications = () => {
    const visibleNotifications = getGlobalNotifications()
      .filter((notification) => {
        if (notification.dismissed) return false;
        if (!notification.dedupeKey?.startsWith("report:")) return true;
        if (
          !location ||
          typeof notification.latitude !== "number" ||
          typeof notification.longitude !== "number" ||
          !Number.isFinite(notification.latitude) ||
          !Number.isFinite(notification.longitude)
        ) {
          return false;
        }
        return filterWithinRadius(
          location.latitude,
          location.longitude,
          [{ latitude: notification.latitude, longitude: notification.longitude }],
          10
        ).length > 0;
      })
      .map((notification) => ({
        ...notification,
        time: getRelativeTimeString(notification.timestamp),
      }));
    setNotifications(visibleNotifications);
    setUnreadCount(visibleNotifications.filter((notification) => !notification.read).length);
  };

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        console.error("Could not enable offline app support:", error);
      });
    }
    loadGlobalNotifications();
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPushStatus("unsupported");
    } else if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setPushStatus("unconfigured");
    } else if (Notification.permission === "denied") {
      setPushStatus("denied");
    } else {
      void navigator.serviceWorker.getRegistration("/").then(async (registration) => {
        const subscription = await registration?.pushManager.getSubscription();
        setPushStatus(subscription ? "enabled" : "disabled");
      }).catch((error: unknown) => {
        console.error("Could not check screen notification status:", error);
        setPushStatus("disabled");
      });
    }

    // Refresh issue statuses while keeping relative timestamps current.
    const tickerInterval = setInterval(() => {
      syncStatusFromSupabase();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          time: getRelativeTimeString(n.timestamp),
        }))
      );
    }, 30000);

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

    // Real-time Status Sync directly from Supabase reports table
    const syncStatusFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("report_id, category, title, description, location_address, province, municipality, ward, status, latitude, longitude")
          .order("id", { ascending: false });

        if (error) {
          console.error("Error fetching reports from Supabase for home summary:", error);
        }

        const cachedReports = readOfflineData<HomeReport[]>("resigrid_home_reports");
        const reports: HomeReport[] = data
          ? data as HomeReport[]
          : Array.isArray(cachedReports) ? cachedReports : [];
        if (data) writeOfflineData("resigrid_home_reports", data);

        const reportsWithCoordinates = reports.filter(
          (report): report is HomeReport & { latitude: number; longitude: number } =>
            typeof report.latitude === "number" &&
            typeof report.longitude === "number" &&
            Number.isFinite(report.latitude) &&
            Number.isFinite(report.longitude)
        );
        const nearbyReports = location
          ? filterWithinRadius(location.latitude, location.longitude, reportsWithCoordinates, 10)
          : [];
        if (location) syncReportNotifications(nearbyReports);
        const activeReports = nearbyReports.filter(
          (report) =>
            report.category?.toLowerCase() !== "goods" &&
            !["resolved", "closed", "fixed"].includes((report.status || "").toLowerCase())
        );
        const hasWaterIssue = activeReports.some((report: { category?: string | null }) =>
          (report.category || "").toLowerCase().includes("water")
        );
        const hasPowerIssue = activeReports.some((report: { category?: string | null }) =>
          ["power", "electricity"].some((category) =>
            (report.category || "").toLowerCase().includes(category)
          )
        );

        const newWater = hasWaterIssue ? "Issue reported" : "Normal";
        const newEnergy = hasPowerIssue ? "Issue reported" : "Normal";

        setWaterStatus(newWater);
        setEnergyStatus(newEnergy);

        if (activeReports.length > 0) {
          setSummaryText("Issues have been reported in your area.");
        } else {
          setSummaryText("No issues reported in your area today.");
        }

        loadGlobalNotifications();
      } catch (e) {
        console.error("Supabase connection exception on home sync:", e);
      }
    };

    syncStatusFromSupabase();

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("resigrid_reports_dispatch");
      broadcastChannel.onmessage = (event) => {
        const { type } = event.data || {};
        if (type === "NEW_REPORT" || type === "STATUS_UPDATE") {
          syncStatusFromSupabase();
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "resigrid_global_notifications") {
        loadGlobalNotifications();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", syncStatusFromSupabase);

    return () => {
      window.removeEventListener("resigrid_theme_change", handleThemeEvent);
      if (broadcastChannel) broadcastChannel.close();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", syncStatusFromSupabase);
      clearInterval(tickerInterval);
    };
  }, [location]);

  useEffect(() => {
    if (pushStatus !== "enabled" || !location || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    void navigator.serviceWorker.getRegistration("/").then(async (registration) => {
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription || cancelled) return;

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subscription.toJSON(),
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      if (!response.ok) {
        throw new Error(`Could not refresh the screen alert location (${response.status}).`);
      }
    }).catch((error: unknown) => {
      console.error("Could not refresh the screen alert location:", error);
    });

    return () => {
      cancelled = true;
    };
  }, [location, pushStatus]);

  const handleEnableScreenNotifications = async () => {
    setPushMessage("");
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      setPushStatus("unconfigured");
      setPushMessage("Screen alerts need push keys configured by the app administrator.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPushStatus("unsupported");
      setPushMessage("This browser does not support screen alerts.");
      return;
    }
    if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
      setPushStatus("disabled");
      setPushMessage("Allow location access to enable nearby screen alerts.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus(permission === "denied" ? "denied" : "disabled");
        setPushMessage("Allow notifications in your browser settings to receive screen alerts.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const readyRegistration = await navigator.serviceWorker.ready;
      const activeRegistration = registration.active ? registration : readyRegistration;
      let subscription = await activeRegistration.pushManager.getSubscription();
      if (!subscription) {
        const padding = "=".repeat((4 - (vapidPublicKey.length % 4)) % 4);
        const decodedKey = atob(
          (vapidPublicKey + padding).replace(/-/g, "+").replace(/_/g, "/")
        );
        const applicationServerKey = Uint8Array.from(decodedKey, (character) =>
          character.charCodeAt(0)
        );
        subscription = await activeRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subscription.toJSON(),
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(
          typeof responseBody?.error === "string"
            ? responseBody.error
            : `Could not enable screen alerts (${response.status}).`
        );
      }

      setPushStatus("enabled");
      setPushMessage("");
    } catch (error) {
      console.error("Could not enable screen alerts:", error);
      setPushStatus("disabled");
      setPushMessage(error instanceof Error ? error.message : "Could not enable screen alerts.");
    }
  };

  const handleDisableScreenNotifications = async () => {
    setPushMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) {
          const responseBody = await response.json().catch(() => null);
          throw new Error(
            typeof responseBody?.error === "string"
              ? responseBody.error
              : `Could not turn off screen alerts (${response.status}).`
          );
        }
        await subscription.unsubscribe();
      }
      setPushStatus("disabled");
      setPushMessage("");
    } catch (error) {
      console.error("Could not disable screen alerts:", error);
      setPushMessage(error instanceof Error ? error.message : "Could not turn off screen alerts.");
    }
  };

  const handleOpenNotificationsModal = () => {
    setIsNotifModalOpen(true);
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    saveGlobalNotifications(
      getGlobalNotifications().map((notification) => ({ ...notification, read: true }))
    );
  };

  const handleClearNotifications = () => {
    const updated = getGlobalNotifications().map((notification) => ({
      ...notification,
      dismissed: true,
    }));
    saveGlobalNotifications(updated);
    setNotifications([]);
    setUnreadCount(0);
    setIsNotifModalOpen(false); // Close the modal and go back to home page
  };

  const handleDismissSingleNotification = (id: string) => {
    const updated = getGlobalNotifications().map((notification) =>
      notification.id === id ? { ...notification, dismissed: true } : notification
    );
    saveGlobalNotifications(updated);
    const visibleNotifications = updated.filter((notification) => !notification.dismissed);
    setNotifications(visibleNotifications);
    setUnreadCount(visibleNotifications.filter((notification) => !notification.read).length);
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
                  Notifications
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
                            className="p-4 sm:p-5 px-6 sm:px-8 rounded-full border border-white/10 bg-black/60 relative flex items-center justify-between gap-4 transition-all hover:border-white/20 shadow-lg"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <NotifIcon className="h-5 w-5 shrink-0" style={iconColorStyle} />
                              <div className="space-y-0.5 min-w-0">
                                <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug truncate">
                                  {notif.title}
                                </h4>
                                <p className="text-xs text-muted leading-relaxed truncate">
                                  {notif.description}
                                </p>
                                <span className="inline-block text-[10px] font-mono text-muted/70">
                                  {notif.time}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDismissSingleNotification(notif.id)}
                              aria-label="Dismiss notification"
                              className="text-muted hover:text-white transition-colors p-2 shrink-0 cursor-pointer rounded-full bg-white/5 border border-white/10 touch-manipulation"
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

            {/* Footer with Clear Pill Button */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 shrink-0 pb-safe">
              <div className="min-w-0">
                {pushStatus === "enabled" ? (
                  <button
                    type="button"
                    onClick={handleDisableScreenNotifications}
                    className="text-[11px] text-emerald-400 hover:text-white cursor-pointer touch-manipulation"
                  >
                    {pushMessage || "Screen alerts are on · Turn off"}
                  </button>
                ) : pushStatus === "unsupported" || pushStatus === "unconfigured" || pushStatus === "denied" ? (
                  <p className="text-[11px] text-muted">
                    {pushMessage || (pushStatus === "unconfigured"
                      ? "Screen alerts need setup."
                      : pushStatus === "denied"
                        ? "Allow alerts in browser settings."
                        : "Screen alerts aren't supported here.")}
                  </p>
                ) : (
                  <div>
                    {pushMessage && <p className="mb-1 text-[11px] text-muted">{pushMessage}</p>}
                    <button
                      type="button"
                      onClick={handleEnableScreenNotifications}
                      disabled={pushStatus === "checking"}
                      className="text-xs font-medium text-[var(--accent)] hover:text-white disabled:opacity-50 cursor-pointer touch-manipulation"
                    >
                      Turn on screen alerts
                    </button>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearNotifications}
                  className="text-xs text-muted hover:text-rose-400 transition-colors font-medium flex items-center gap-1.5 cursor-pointer py-2.5 px-6 rounded-full bg-white/5 border border-white/10 touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" /> Clear
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
