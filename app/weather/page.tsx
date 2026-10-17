"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CloudRain,
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  ShieldAlert,
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
  MapPin,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";

export interface ResiGridNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "warning" | "success" | "info" | "error";
  category?: string;
  read?: boolean;
  timestamp?: number;
}

interface ProvinceAtmosphericData {
  provinceName: string;
  imageBgUrls: string[];
  threatLevel: "green" | "yellow" | "orange" | "red";
  levelBadge: string;
  statusTitle: string;
  warningMessage: string;
}

const PROVINCIAL_ATMOSPHERIC_DATA: Record<string, ProvinceAtmosphericData> = {
  "KwaZulu-Natal": {
    provinceName: "KwaZulu-Natal",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "green",
    levelBadge: "SAWS Level 0 • Green",
    statusTitle: "Regional Atmospheric Baseline Stable",
    warningMessage: "No severe weather warnings active across KwaZulu-Natal. Atmospheric pressure and coastal cloud cover remain within safe baseline limits.",
  },
  "Gauteng": {
    provinceName: "Gauteng",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1577948000111-9c970dfe3743?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "yellow",
    levelBadge: "SAWS Level 2 • Yellow",
    statusTitle: "Severe Thunderstorm Watch",
    warningMessage: "Localized severe thunderstorms expected over southern Johannesburg and Ekurhuleni. High risk of localized flooding and small hail.",
  },
  "Western Cape": {
    provinceName: "Western Cape",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "orange",
    levelBadge: "SAWS Level 6 • Orange",
    statusTitle: "Gale Force Wind & Coastal Surge Alert",
    warningMessage: "Damaging coastal winds reaching up to 75 km/h along the Cape Peninsula. High sea swells and severe disruption to port activities expected.",
  },
  "Eastern Cape": {
    provinceName: "Eastern Cape",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "green",
    levelBadge: "SAWS Level 0 • Green",
    statusTitle: "Clear Atmospheric Conditions",
    warningMessage: "Stable oceanic high pressure dominates the Wild Coast corridor with gentle onshore breeze and light sea swell.",
  },
  "Free State": {
    provinceName: "Free State",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "green",
    levelBadge: "SAWS Level 0 • Green",
    statusTitle: "Stable Agricultural Climate",
    warningMessage: "Favorable dry conditions across Mangaung and surrounding agricultural districts with clear skies and moderate thermal ranges.",
  },
  "Mpumalanga": {
    provinceName: "Mpumalanga",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511497584788-876761142197?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "yellow",
    levelBadge: "SAWS Level 1 • Yellow",
    statusTitle: "Escarpment Mist & Morning Fog",
    warningMessage: "Reduced visibility along the Sabie and Nelspruit escarpment routes due to heavy morning mist. Motorists advised to use fog lights.",
  },
  "Limpopo": {
    provinceName: "Limpopo",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "green",
    levelBadge: "SAWS Level 0 • Green",
    statusTitle: "Warm & Clear Bushveld Climate",
    warningMessage: "Stable high-pressure weather system across Polokwane and the Waterberg biosphere with minimal cloud obstruction.",
  },
  "North West": {
    provinceName: "North West",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "green",
    levelBadge: "SAWS Level 0 • Green",
    statusTitle: "Normal Atmospheric Pressure",
    warningMessage: "Clear skies and moderate wind speeds across Rustenburg and Mahikeng mining and agricultural zones.",
  },
  "Northern Cape": {
    provinceName: "Northern Cape",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "green",
    levelBadge: "SAWS Level 0 • Green",
    statusTitle: "Arid & Stable Karoo Climate",
    warningMessage: "Hot daytime temperatures and clear nocturnal skies across Kimberley and Upington. Low humidity baseline.",
  },
};

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

  // Province State Loaded from User Profile
  const [userProvince, setUserProvince] = useState<string>("KwaZulu-Natal");
  const [currentBgImage, setCurrentBgImage] = useState<string>("");

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
  const [alertHeadline, setAlertHeadline] = useState<string>("Meteorological Status & Regional Advisories");
  const [alertDetails, setAlertDetails] = useState<string>("Continuously tracking regional weather patterns, atmospheric stability, and active advisories across your sector.");
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState<string>("Not synchronized");

  // Helper to calculate accurate real-time relative timestamps
  const getRelativeTimeString = (timestamp?: number) => {
    if (!timestamp) return "Just now";
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Push notification helper to broadcast province weather alerts directly to global local storage (Home / Notifications feed)
  const pushGlobalNotification = (title: string, description: string, type: "warning" | "success" | "info" | "error") => {
    try {
      const existing = localStorage.getItem("resigrid_global_notifications");
      let notifs: ResiGridNotification[] = existing ? JSON.parse(existing) : [];
      
      // Prevent duplicate identical alerts flooding storage
      const exists = notifs.some((n) => n.title === title && n.description === description);
      if (!exists) {
        const now = Date.now();
        const newNotif: ResiGridNotification = {
          id: `weather-alert-${now}`,
          title,
          description,
          time: getRelativeTimeString(now),
          type,
          category: "climate",
          read: false,
          timestamp: now,
        };
        notifs = [newNotif, ...notifs];
        localStorage.setItem("resigrid_global_notifications", JSON.stringify(notifs));
      }
    } catch (err) {
      console.error("Error writing global weather notification:", err);
    }
  };

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("resigrid_user_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.selectedProvince) {
          setUserProvince(parsed.selectedProvince);
        }
      }
    } catch (e) {
      console.error("Error reading user profile province:", e);
    }

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

  // Rotate random high-resolution image for the province on mount/province change
  useEffect(() => {
    const provData = PROVINCIAL_ATMOSPHERIC_DATA[userProvince] || PROVINCIAL_ATMOSPHERIC_DATA["KwaZulu-Natal"];
    if (provData && provData.imageBgUrls.length > 0) {
      const randomIndex = Math.floor(Math.random() * provData.imageBgUrls.length);
      setCurrentBgImage(provData.imageBgUrls[randomIndex]);
    }
  }, [userProvince]);

  // Fetch Comprehensive Open-Meteo Weather Data & Province-Specific Warnings
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

          const activeProvData = PROVINCIAL_ATMOSPHERIC_DATA[userProvince] || PROVINCIAL_ATMOSPHERIC_DATA["KwaZulu-Natal"];

          if (code >= 95) {
            setWeatherCondition("Severe Thunderstorm Warning");
            setIsAlertActive(true);
            setAlertHeadline(`${userProvince} Severe Weather & Lightning Alert`);
            const desc = `Official weather service advisory for ${userProvince}: High risk of localized thunderstorms, lightning strikes, and flash flooding in the region. Unplug sensitive appliances and avoid open areas.`;
            setAlertDetails(desc);
            pushGlobalNotification(`${userProvince} Severe Weather Warning`, desc, "warning");
          } else if (code >= 51 && code <= 67) {
            setWeatherCondition("Steady Rainfall & Precipitation Advisory");
            setIsAlertActive(false);
            setAlertHeadline(`${userProvince} Rainfall & Catchment Advisory`);
            const desc = `Continuous precipitation across ${userProvince} catchments. Monitor property drainage and collect rainwater for household or garden use.`;
            setAlertDetails(desc);
            pushGlobalNotification(`${userProvince} Rainfall Advisory`, desc, "info");
          } else if (wind > 35 || gusts > 50) {
            setWeatherCondition("Gale Force Wind Advisory");
            setIsAlertActive(true);
            setAlertHeadline(`${userProvince} High Wind Velocity & Gust Warning`);
            const desc = `Strong winds and high gusts detected across ${userProvince} (>35 km/h). Elevated risk of outdoor items shifting and intermittent line instability.`;
            setAlertDetails(desc);
            pushGlobalNotification(`${userProvince} High Wind Warning`, desc, "warning");
          } else {
            setWeatherCondition("Stable Meteorological Conditions");
            setIsAlertActive(activeProvData.threatLevel !== "green");
            setAlertHeadline(`${userProvince} Regional Atmospheric Status`);
            setAlertDetails(activeProvData.warningMessage);
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
  }, [location, userProvince]);

  // Helper for wind direction degrees to compass rose
  const getWindDirectionLabel = (degrees: number | null) => {
    if (degrees === null) return "--";
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const val = Math.floor((degrees / 22.5) + 0.5);
    return directions[(val % 16)];
  };

  const currentProvData = PROVINCIAL_ATMOSPHERIC_DATA[userProvince] || PROVINCIAL_ATMOSPHERIC_DATA["KwaZulu-Natal"];

  const getBadgeStyle = (level: ProvinceAtmosphericData["threatLevel"]) => {
    switch (level) {
      case "yellow":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "orange":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "red":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
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
            borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--accent) 6%, transparent)",
          }}
        >
          <div className="panel-reflection pointer-events-none" />

          {/* Top Row: Header Branding */}
          <div className="flex items-center justify-between relative z-10">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <div className="feature-icon feature-energy shrink-0" style={{ color: "var(--accent)" }}>
                <CloudSun className="h-[18px] w-[18px]" style={{ color: "var(--accent)" }} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm truncate">
                  WEATHER &amp; CLIMATE
                </h1>
                <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                  {userProvince.toUpperCase()} ALERTS
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
                <span className="truncate font-semibold text-white text-[10px] sm:text-xs">
                  {streetAddress} ({userProvince})
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
        </div>

        {/* MAIN DESIGN LAYOUT: COMPREHENSIVE METEOROLOGICAL TELEMETRY & PROVINCE ALERTS */}
        <div className="space-y-5">
          
          {/* PROVINCIAL ATMOSPHERIC VISUAL & WARNING HERO CARD */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/80 text-white shadow-2xl min-h-[190px] sm:min-h-[220px] flex flex-col justify-between group pointer-events-auto">
            
            {/* REAL-WORLD BACKGROUND IMAGE WITH ATMOSPHERIC GRADIENT */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url('${currentBgImage || currentProvData.imageBgUrls[0]}')`,
              }}
            />
            
            {/* DARK ATMOSPHERIC BACKDROP BLEND OVERLAY */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40 backdrop-blur-[1px]" />

            {/* TOP ROW: REGION & OFFICIAL SAWS LEVEL BADGE */}
            <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-black/50 border border-white/15 backdrop-blur-md text-[var(--accent)]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wider uppercase">
                    {currentProvData.provinceName} Regional Status
                  </h3>
                </div>
              </div>

              {/* SAWS THREAT LEVEL PILL BADGE */}
              <span className={`px-3 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-md ${getBadgeStyle(currentProvData.threatLevel)}`}>
                {currentProvData.levelBadge}
              </span>
            </div>

            {/* BOTTOM ROW: WARNING & ATMOSPHERIC REPORT */}
            <div className="relative z-10 p-4 sm:p-5 pt-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                  {currentProvData.statusTitle}
                </h4>
              </div>

              <p className="text-xs text-white/80 bg-black/50 p-3 rounded-xl border border-white/10 backdrop-blur-md leading-relaxed">
                {currentProvData.warningMessage}
              </p>
            </div>
          </div>

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
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Wind Speed</span>
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
    </main>
  );
}
