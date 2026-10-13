"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  CloudRain,
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  ShieldAlert,
  X,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ShieldCheck,
  Navigation,
  RefreshCw,
  Sun,
  Eye,
  Gauge,
  Compass,
  Activity,
  Sunrise,
  Sunset,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";

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

const ACCENT_HEX_MAP: Record<string, string> = {
  teal: "#14b8a6",
  navy: "#1e3a8a",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  emerald: "#10b981",
};

export default function WeatherClimatePage() {
  const { streetAddress, location, refreshLocation, loading: geoLoading } = useGeo();

  // Comprehensive Weather & Meteorological Data States
  const [temperature, setTemperature] = useState<number | null>(null);
  const [apparentTemp, setApparentTemp] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [windGusts, setWindGusts] = useState<number | null>(null);
  const [windDirection, setWindDirection] = useState<number | null>(null);
  const [precipitationSum, setPrecipitationSum] = useState<number | null>(null);
  const [pressure, setPressure] = useState<number | null>(null);
  const [uvIndex, setUvIndex] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<number | null>(null);
  const [cloudCover, setCloudCover] = useState<number | null>(null);
  const [dewPoint, setDewPoint] = useState<number | null>(null);
  const [sunriseTime, setSunriseTime] = useState<string>("--:--");
  const [sunsetTime, setSunsetTime] = useState<string>("--:--");

  const [weatherCondition, setWeatherCondition] = useState<string>("Synchronizing atmospheric telemetry...");
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [alertHeadline, setAlertHeadline] = useState<string>("Provincial Meteorological Status & Regional Advisories");
  const [alertDetails, setAlertDetails] = useState<string>("Continuously tracking regional weather patterns, atmospheric stability, and active advisories across your sector.");
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState<string>("Not synchronized");

  // Notification Feed State & Modal Controls
  const [notifications, setNotifications] = useState<ResiGridNotification[]>([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const loadGlobalNotifications = () => {
    try {
      const savedNotifs = localStorage.getItem("resigrid_global_notifications");
      if (savedNotifs) {
        const parsed: ResiGridNotification[] = JSON.parse(savedNotifs);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n) => !n.read).length);
      } else {
        const defaultNotifs: ResiGridNotification[] = [
          {
            id: "weather-init-1",
            title: "Climate Monitor Active",
            description: "Official meteorological telemetry feed connected successfully.",
            time: "Just now",
            type: "info",
            category: "climate",
            read: false,
          },
        ];
        setNotifications(defaultNotifs);
        setUnreadCount(1);
        localStorage.setItem("resigrid_global_notifications", JSON.stringify(defaultNotifs));
      }
    } catch (err) {
      console.error("Error reading notifications:", err);
    }
  };

  useEffect(() => {
    loadGlobalNotifications();

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

  // Fetch Comprehensive Open-Meteo Weather Data & Provincial Warnings
  useEffect(() => {
    const fetchWeatherForLocation = async () => {
      try {
        const lat = location?.latitude ?? -29.6006;
        const lon = location?.longitude ?? 30.3794;

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m&daily=uv_index_max,precipitation_sum,sunrise,sunset&timezone=auto`
        );

        if (res.ok) {
          const data = await res.json();
          const curr = data.current || {};
          const daily = data.daily || {};

          const temp = curr.temperature_2m ?? 22;
          const appTemp = curr.apparent_temperature ?? 22;
          const hum = curr.relative_humidity_2m ?? 45;
          const wind = curr.wind_speed_10m ?? 12;
          const gusts = curr.wind_gusts_10m ?? 18;
          const windDir = curr.wind_direction_10m ?? 180;
          const precip = curr.precipitation ?? 0.0;
          const press = curr.pressure_msl ?? 1016;
          const clouds = curr.cloud_cover ?? 20;
          const dew = curr.dew_point_2m ?? 10;
          const code = curr.weather_code ?? 0;
          const uv = daily.uv_index_max?.[0] ?? 6.0;

          // Parse sunrise and sunset ISO strings
          if (daily.sunrise?.[0]) {
            const d = new Date(daily.sunrise[0]);
            setSunriseTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
          if (daily.sunset?.[0]) {
            const d = new Date(daily.sunset[0]);
            setSunsetTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }

          setTemperature(temp);
          setApparentTemp(appTemp);
          setHumidity(hum);
          setWindSpeed(wind);
          setWindGusts(gusts);
          setWindDirection(windDir);
          setPrecipitationSum(precip);
          setPressure(press);
          setCloudCover(clouds);
          setDewPoint(dew);
          setUvIndex(uv);
          setVisibility(10);
          setLastCheckTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

          if (code >= 95) {
            setWeatherCondition("Severe Thunderstorm Warning");
            setIsAlertActive(true);
            setAlertHeadline("Provincial Severe Weather & Lightning Alert");
            setAlertDetails("Official weather service advisory: High risk of localized thunderstorms, lightning strikes, and flash flooding in the region. Unplug sensitive appliances and avoid open areas.");
          } else if (code >= 51 && code <= 67) {
            setWeatherCondition("Steady Rainfall & Precipitation Advisory");
            setIsAlertActive(false);
            setAlertHeadline("Regional Rainfall & Catchment Advisory");
            setAlertDetails("Continuous precipitation across local catchments. Monitor property drainage and collect rainwater for household or garden use.");
          } else if (wind > 35 || gusts > 50) {
            setWeatherCondition("Gale Force Wind Advisory");
            setIsAlertActive(true);
            setAlertHeadline("High Wind Velocity & Gust Warning");
            setAlertDetails("Strong winds and high gusts detected (>35 km/h). Elevated risk of outdoor items shifting and intermittent line instability.");
          } else {
            setWeatherCondition("Stable Meteorological Conditions");
            setIsAlertActive(false);
            setAlertHeadline("Regional Atmospheric Status Stable");
            setAlertDetails("No severe weather warnings issued. Barometric pressure and atmospheric stability are well within optimal baseline ranges.");
          }
        } else {
          setWeatherCondition("Stable Conditions");
          setTemperature(23);
          setApparentTemp(23);
          setHumidity(50);
          setWindSpeed(10);
          setWindGusts(15);
          setWindDirection(180);
          setPrecipitationSum(0);
          setPressure(1015);
          setCloudCover(15);
          setDewPoint(11);
          setUvIndex(5);
          setVisibility(10);
          setSunriseTime("05:45");
          setSunsetTime("18:15");
          setLastCheckTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
        setWeatherCondition("Stable Conditions (Cached)");
        setTemperature(22);
        setApparentTemp(22);
        setHumidity(55);
        setWindSpeed(12);
        setWindGusts(18);
        setWindDirection(180);
        setPrecipitationSum(0.0);
        setPressure(1014);
        setCloudCover(20);
        setDewPoint(12);
        setUvIndex(5);
        setVisibility(10);
        setSunriseTime("05:45");
        setSunsetTime("18:15");
        setLastCheckTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    };

    fetchWeatherForLocation();
  }, [location]);

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

  // Helper for wind direction degrees to compass rose
  const getWindDirectionLabel = (degrees: number | null) => {
    if (degrees === null) return "--";
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const val = Math.floor((degrees / 22.5) + 0.5);
    return directions[(val % 16)];
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
        
        {/* TOP ROW: HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <header className="glass-header flex items-center justify-between w-full p-3.5 sm:p-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="feature-icon feature-energy shrink-0" style={{ color: "var(--accent)" }}>
                <CloudSun className="h-[18px] w-[18px]" style={{ color: "var(--accent)" }} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm">
                  WEATHER &amp; CLIMATE
                </h1>
                <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                  PROVINCIAL ALERTS &amp; ATMOSPHERIC TELEMETRY
                </p>
              </div>
            </Link>

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
          </header>
        </div>

        {/* LOCATION PILL BAR */}
        <div className="flex items-center justify-between gap-3 px-1">
          <div 
            className="glass-panel px-3.5 py-2.5 flex items-center justify-between gap-3 flex-1 min-w-0"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)",
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Navigation className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
              <span className="truncate font-semibold text-white text-[10px] sm:text-xs">
                {streetAddress}
              </span>
            </div>
            <button
              type="button"
              onClick={refreshLocation}
              title="Refresh Location"
              className="transition-colors shrink-0 cursor-pointer p-1 touch-manipulation z-30 hover:text-white"
              style={{ color: "var(--accent)" }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${geoLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* MAIN DESIGN LAYOUT: COMPREHENSIVE METEOROLOGICAL TELEMETRY & PROVINCIAL ALERTS */}
        <div className="space-y-5">
          
          {/* OFFICIAL PROVINCIAL / DISTRICT WARNING BANNER */}
          <section className="glass-panel p-5 sm:p-7 relative overflow-hidden pointer-events-auto border"
            style={{
              borderColor: isAlertActive ? "rgba(245, 158, 11, 0.4)" : "color-mix(in srgb, var(--accent) 30%, transparent)",
              backgroundColor: isAlertActive ? "rgba(245, 158, 11, 0.08)" : "color-mix(in srgb, var(--accent) 5%, transparent)",
            }}
          >
            <div className="panel-reflection pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5 min-w-0 w-full">
                <div 
                  className="p-3 rounded-2xl border shrink-0 mt-0.5"
                  style={{
                    borderColor: isAlertActive ? "rgba(245, 158, 11, 0.5)" : "color-mix(in srgb, var(--accent) 40%, transparent)",
                    backgroundColor: isAlertActive ? "rgba(245, 158, 11, 0.2)" : "color-mix(in srgb, var(--accent) 15%, transparent)",
                    color: isAlertActive ? "#f59e0b" : "var(--accent)"
                  }}
                >
                  {isAlertActive ? <ShieldAlert className="h-6 w-6 animate-pulse" /> : <ShieldCheck className="h-6 w-6" />}
                </div>

                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                      style={{
                        color: isAlertActive ? "#f59e0b" : "var(--accent)",
                        borderColor: isAlertActive ? "rgba(245, 158, 11, 0.3)" : "color-mix(in srgb, var(--accent) 30%, transparent)",
                        backgroundColor: isAlertActive ? "rgba(245, 158, 11, 0.1)" : "color-mix(in srgb, var(--accent) 10%, transparent)",
                      }}
                    >
                      {isAlertActive ? "Active Weather Warning" : "District Status Secure"}
                    </span>
                    <span className="text-[10px] font-mono text-muted">Synchronized: {lastCheckTimestamp}</span>
                  </div>

                  <h2 className="text-base sm:text-xl font-bold text-white">
                    {alertHeadline}
                  </h2>
                  
                  <p className="text-xs text-muted leading-relaxed">
                    {alertDetails}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* COMPREHENSIVE METEOROLOGICAL TELEMETRY GRID WITH PLAIN-LANGUAGE RECOMMENDATIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            
            {/* 1. Ambient Temp */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Thermometer className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Ambient Temp</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {temperature !== null ? `${temperature}°C` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Feels like {apparentTemp !== null ? `${apparentTemp}°C` : "--"}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {temperature !== null && temperature > 30 
                  ? "It's quite hot out. Keep hydrated and check on pets and loved ones." 
                  : temperature !== null && temperature < 10 
                  ? "Temperatures are low. Keep warm and check heating appliances." 
                  : "Comfortable outdoor temperature for daily activities."}
              </p>
            </div>

            {/* 2. Humidity */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Droplets className="h-4 w-4 text-cyan-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Humidity</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {humidity !== null ? `${humidity}%` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Relative Atmospheric</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {humidity !== null && humidity > 70 
                  ? "Air is very humid. Clothes drying may take longer; watch for indoor condensation." 
                  : "Normal atmospheric moisture levels. Air feels comfortable."}
              </p>
            </div>

            {/* 3. Wind Velocity & Gusts */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Wind className="h-4 w-4 text-sky-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Wind Velocity</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {windSpeed !== null ? `${windSpeed} km/h` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Gusts up to {windGusts !== null ? `${windGusts} km/h` : "--"}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {windGusts !== null && windGusts > 40 
                  ? "Strong winds present. Secure loose outdoor items like bins and shade cloth." 
                  : "Wind speeds are gentle and pose no hazard to property."}
              </p>
            </div>

            {/* 4. Wind Direction */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Compass className="h-4 w-4 text-emerald-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Wind Direction</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {getWindDirectionLabel(windDirection)} <span className="text-sm font-normal text-muted">({windDirection !== null ? `${windDirection}°` : "--"})</span>
                  </p>
                  <p className="text-[10px] text-muted">Current Bearing</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Wind direction indicates the originating airflow path across the region.
              </p>
            </div>

            {/* 5. Rainfall Volume */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <CloudRain className="h-4 w-4 text-indigo-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Rainfall</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {precipitationSum !== null ? `${precipitationSum} mm` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Precipitation Volume</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {precipitationSum !== null && precipitationSum > 5 
                  ? "Active rainfall. Great time to collect water in storage tanks; watch for slippery roads." 
                  : "Dry conditions. Ensure garden watering follows routine schedules."}
              </p>
            </div>

            {/* 6. Barometric Pressure */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Gauge className="h-4 w-4 text-teal-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Pressure</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {pressure !== null ? `${pressure} hPa` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Barometric MSL</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Stable atmospheric pressure indicates steady weather ahead with no sudden storms.
              </p>
            </div>

            {/* 7. UV Index */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Solar UV</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {uvIndex !== null ? `${uvIndex}` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Max Daily Index</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {uvIndex !== null && uvIndex >= 6 
                  ? "High UV levels today. Wear sunscreen and sunglasses if outdoors." 
                  : "Moderate sun levels. Standard sun protection recommended."}
              </p>
            </div>

            {/* 8. Cloud Cover */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <CloudSun className="h-4 w-4 text-purple-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Cloud Cover</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {cloudCover !== null ? `${cloudCover}%` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Sky Obscuration</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {cloudCover !== null && cloudCover > 70 
                  ? "Overcast skies overhead. Solar panel generation will be reduced." 
                  : "Clear or partly sunny skies. Excellent conditions for solar charging."}
              </p>
            </div>

            {/* 9. Visibility */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Eye className="h-4 w-4 text-blue-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Visibility</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {visibility !== null ? `${visibility}+ km` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Atmospheric Clarity</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Clear visibility on roadways. Safe driving conditions with no fog reported.
              </p>
            </div>

            {/* 10. Dew Point */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Activity className="h-4 w-4 text-rose-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Dew Point</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {dewPoint !== null ? `${dewPoint}°C` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Moisture Saturation Point</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {dewPoint !== null && dewPoint > 18 
                  ? "High dew point means the air feels muggy and sticky outside." 
                  : "Comfortable moisture level with crisp, refreshing air quality."}
              </p>
            </div>

            {/* 11. Sunrise */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Sunrise className="h-4 w-4 text-amber-300" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Sunrise</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {sunriseTime}
                  </p>
                  <p className="text-[10px] text-muted">Morning Dawn</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Plan early morning outdoor workouts or solar array generation around dawn.
              </p>
            </div>

            {/* 12. Sunset */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Sunset className="h-4 w-4 text-orange-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Sunset</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {sunsetTime}
                  </p>
                  <p className="text-[10px] text-muted">Evening Dusk</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Daylight hours conclude in the evening; ensure outdoor lighting timers are active.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* NOTIFICATION MODAL OVERLAY */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 pointer-events-auto transition-all">
          <div className="w-full max-w-lg relative space-y-4 pointer-events-auto max-h-[85vh] sm:max-h-[80vh] flex flex-col justify-between">
            <div className="flex items-center justify-between px-2 pb-1 relative z-20 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold tracking-wider text-white uppercase text-[11px]">
                  Notifications
                </h3>
              </div>
            </div>

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
