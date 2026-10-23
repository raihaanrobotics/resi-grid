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
  Moon,
  Zap,
  Sprout,
  Shield,
  Wind as AirIcon,
  Flower2,
  Wand2,
  X,
  Bot,
} from "lucide-react";
import { useGeo } from "@/context/GeoContext";
import { upsertGlobalNotification } from "@/lib/notifications/globalNotifications";

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
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "green",
    levelBadge: "SAWS Level 0 • Green",
    statusTitle: "Regional Weather is Calm & Stable",
    warningMessage: "No severe weather warnings are active across your area. Enjoy clear conditions and normal coastal cloud cover.",
  },
  "Gauteng": {
    provinceName: "Gauteng",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1577948000111-9c970dfe3743?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "yellow",
    levelBadge: "SAWS Level 2 • Yellow",
    statusTitle: "Thunderstorm Watch in Effect",
    warningMessage: "Keep an eye out for sudden afternoon thunderstorms over your area. Brief heavy downpours and small hail are possible.",
  },
  "Western Cape": {
    provinceName: "Western Cape",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "orange",
    levelBadge: "SAWS Level 6 • Orange",
    statusTitle: "Strong Coastal Winds & High Waves",
    warningMessage: "Gusty winds reaching up to 75 km/h are expected in your area. Secure outdoor furniture and take care if driving high-profile vehicles.",
  },
  "Eastern Cape": {
    provinceName: "Eastern Cape",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "green",
    levelBadge: "SAWS Level 0 • Green",
    statusTitle: "Clear & Pleasant Weather",
    warningMessage: "Enjoy calm breezes and lovely sunshine along your local corridor with smooth ocean conditions.",
  },
  "Free State": {
    provinceName: "Free State",
    imageBgUrls: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop"
    ],
    threatLevel: "green",
    levelBadge: "SAWS Level 0 • Green",
    statusTitle: "Great Farming & Outdoor Conditions",
    warningMessage: "Dry, clear skies and comfortable temperatures across your agricultural areas make for a pleasant day outside.",
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
    statusTitle: "Morning Mist & Reduced Visibility",
    warningMessage: "Watch out for thick morning fog and mist along local mountain passes. Turn on your headlights and drive carefully.",
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
    statusTitle: "Warm & Sunny Days",
    warningMessage: "Your surrounding region is experiencing gorgeous, clear skies with plenty of sunshine.",
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
    statusTitle: "Calm & Normal Weather",
    warningMessage: "Expect clear skies and light breezes across your neighborhood with no weather disruptions expected.",
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
    statusTitle: "Dry & Sunny Climate",
    warningMessage: "Warm daytime temperatures and perfectly clear nighttime skies across your location. Low humidity makes for crisp air.",
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

  // Modal State & Key to re-trigger animation
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [modalKey, setModalKey] = useState<number>(0);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState<boolean>(false);

  // Comprehensive Weather & Meteorological Data States
  const [temperature, setTemperature] = useState<number | null>(null);
  const [apparentTemp, setApparentTemp] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [windGusts, setWindGusts] = useState<number | null>(null);
  const [windDirection, setWindDirection] = useState<number | null>(null);
  const [dailyPrecipitationSum, setDailyPrecipitationSum] = useState<number | null>(null);
  const [currentRainChance, setCurrentRainChance] = useState<number | null>(null);
  const [peakRainChance, setPeakRainChance] = useState<number | null>(null);
  const [peakRainTime, setPeakRainTime] = useState<string>("--:--");
  const [pressure, setPressure] = useState<number | null>(null);
  const [uvIndex, setUvIndex] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<number | null>(null);
  const [cloudCover, setCloudCover] = useState<number | null>(null);
  const [dewPoint, setDewPoint] = useState<number | null>(null);
  const [sunriseTime, setSunriseTime] = useState<string>("--:--");
  const [sunsetTime, setSunsetTime] = useState<string>("--:--");

  // Expanded Telemetry States
  const [aqi, setAqi] = useState<number | null>(null);
  const [pm25, setPm25] = useState<number | null>(null);
  const [directRadiation, setDirectRadiation] = useState<number | null>(null);
  const [soilTemp, setSoilTemp] = useState<number | null>(null);
  const [soilMoisture, setSoilMoisture] = useState<number | null>(null);
  const [capeValue, setCapeValue] = useState<number | null>(null);
  const [freezingLevel, setFreezingLevel] = useState<number | null>(null);
  const [moonPhaseVal, setMoonPhaseVal] = useState<number | null>(null);
  const [moonriseTime, setMoonriseTime] = useState<string>("--:--");
  const [moonsetTime, setMoonsetTime] = useState<string>("--:--");
  const [grassPollen, setGrassPollen] = useState<number | null>(null);
  const [birchPollen, setBirchPollen] = useState<number | null>(null);

  const [weatherCondition, setWeatherCondition] = useState<string>("Updating weather conditions...");
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [alertHeadline, setAlertHeadline] = useState<string>("Local Weather Status & Updates");
  const [alertDetails, setAlertDetails] = useState<string>("Checking current weather conditions, storm updates, and safety alerts for your area.");
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState<string>("Not synchronized");

  // Helper declared early for wind direction
  const getWindDirectionLabel = (degrees: number | null) => {
    if (degrees === null) return "--";
    const directions = ["North", "North-Northeast", "Northeast", "East-Northeast", "East", "East-Southeast", "Southeast", "South-Southeast", "South", "South-Southwest", "Southwest", "West-Southwest", "West", "West-Northwest", "Northwest", "North-Northwest"];
    const val = Math.floor((degrees / 22.5) + 0.5);
    return directions[(val % 16)];
  };

  const currentProvData = PROVINCIAL_ATMOSPHERIC_DATA[userProvince] || PROVINCIAL_ATMOSPHERIC_DATA["KwaZulu-Natal"];
  const moonPhaseName = moonPhaseVal !== null 
    ? (moonPhaseVal < 0.05 || moonPhaseVal > 0.95 ? "New Moon" : moonPhaseVal < 0.48 ? "Waxing Moon" : moonPhaseVal < 0.52 ? "Full Moon" : "Waning Moon") 
    : "Unknown";

  const handleOpenSummary = () => {
    setModalKey((prev) => prev + 1);
    setIsSummaryOpen(true);
  };

  const handleRefreshLocationClick = async () => {
    setIsRefreshingLocation(true);
    try {
      if (refreshLocation) {
        await refreshLocation();
      }
    } catch (err) {
      console.error("Error refreshing location:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshingLocation(false);
      }, 1000);
    }
  };

  const pushGlobalNotification = (title: string, description: string, type: "warning" | "success" | "info" | "error") => {
    upsertGlobalNotification({
      dedupeKey: `weather:${userProvince}:${title.toLowerCase()}`,
      title,
      description,
      type,
      category: "climate",
      status: "active",
      latitude: location?.latitude,
      longitude: location?.longitude,
    });
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

  useEffect(() => {
    const provData = PROVINCIAL_ATMOSPHERIC_DATA[userProvince] || PROVINCIAL_ATMOSPHERIC_DATA["KwaZulu-Natal"];
    if (provData && provData.imageBgUrls.length > 0) {
      const randomIndex = Math.floor(Math.random() * provData.imageBgUrls.length);
      setCurrentBgImage(provData.imageBgUrls[randomIndex]);
    }
  }, [userProvince]);

  useEffect(() => {
    const fetchWeatherForLocation = async () => {
      try {
        const lat = location?.latitude ?? -29.6006;
        const lon = location?.longitude ?? 30.3794;

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m,direct_radiation,soil_temperature_0cm,soil_moisture_0_to_1cm,cape,freezinglevel_height&daily=uv_index_max,precipitation_sum,sunrise,sunset,moonrise,moonset,moon_phase&hourly=precipitation_probability,european_aqi,pm2_5,grass_pollen,birch_pollen&timezone=auto`
        );

        if (res.ok) {
          const data = await res.json();
          const curr = data.current || {};
          const daily = data.daily || {};
          const hourly = data.hourly || {};

          const temp = curr.temperature_2m ?? 22;
          const appTemp = curr.apparent_temperature ?? 22;
          const hum = curr.relative_humidity_2m ?? 45;
          const wind = curr.wind_speed_10m ?? 12;
          const gusts = curr.wind_gusts_10m ?? 18;
          const windDir = curr.wind_direction_10m ?? 180;
          const precipSum = daily.precipitation_sum?.[0] ?? 0.0;
          const press = curr.pressure_msl ?? 1016;
          const clouds = curr.cloud_cover ?? 20;
          const dew = curr.dew_point_2m ?? 10;
          const code = curr.weather_code ?? 0;
          const uv = daily.uv_index_max?.[0] ?? 6.0;

          const hourlyTimes: string[] = hourly.time || [];
          const hourlyPrecipProb: number[] = hourly.precipitation_probability || [];
          
          const nowIso = new Date().toISOString().slice(0, 13);
          const currentIndex = hourlyTimes.findIndex((t: string) => t.startsWith(nowIso));
          const curRainChance = currentIndex !== -1 ? (hourlyPrecipProb[currentIndex] ?? 0) : (hourlyPrecipProb[0] ?? 0);

          const startIndex = currentIndex !== -1 ? currentIndex : 0;
          const todaySlice = hourlyPrecipProb.slice(startIndex, startIndex + 24);
          const todayTimes = hourlyTimes.slice(startIndex, startIndex + 24);
          
          let maxProb = 0;
          let maxTimeStr = "--:--";
          todaySlice.forEach((prob: number, idx: number) => {
            if (prob > maxProb) {
              maxProb = prob;
              const fullTimeStr = todayTimes[idx];
              if (fullTimeStr) {
                const d = new Date(fullTimeStr);
                maxTimeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
            }
          });

          setCurrentRainChance(curRainChance);
          setPeakRainChance(maxProb);
          setPeakRainTime(maxTimeStr);

          const directRad = curr.direct_radiation ?? 450;
          const soilT = curr.soil_temperature_0cm ?? 21;
          const soilM = curr.soil_moisture_0_to_1cm ?? 0.24;
          const capeVal = curr.cape ?? 150;
          const freezLvl = curr.freezinglevel_height ?? 3800;
          const curAqi = hourly.european_aqi?.[0] ?? 22;
          const curPm25 = hourly.pm2_5?.[0] ?? 12.5;
          const moonPhase = daily.moon_phase?.[0] ?? 0.5;
          const grassP = hourly.grass_pollen?.[0] ?? 15;
          const birchP = hourly.birch_pollen?.[0] ?? 5;

          setDirectRadiation(directRad);
          setSoilTemp(soilT);
          setSoilMoisture(soilM);
          setCapeValue(capeVal);
          setFreezingLevel(freezLvl);
          setAqi(curAqi);
          setPm25(curPm25);
          setMoonPhaseVal(moonPhase);
          setGrassPollen(grassP);
          setBirchPollen(birchP);

          if (daily.sunrise?.[0]) {
            const d = new Date(daily.sunrise[0]);
            setSunriseTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
          if (daily.sunset?.[0]) {
            const d = new Date(daily.sunset[0]);
            setSunsetTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
          if (daily.moonrise?.[0]) {
            const d = new Date(daily.moonrise[0]);
            setMoonriseTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
          if (daily.moonset?.[0]) {
            const d = new Date(daily.moonset[0]);
            setMoonsetTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }

          setTemperature(temp);
          setApparentTemp(appTemp);
          setHumidity(hum);
          setWindSpeed(wind);
          setWindGusts(gusts);
          setWindDirection(windDir);
          setDailyPrecipitationSum(precipSum);
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
            setAlertHeadline("Severe Storm & Lightning Alert");
            const desc = "Weather warning for your area: There is a risk of severe thunderstorms, lightning, and heavy downpours. Please unplug sensitive electronics and stay indoors if possible.";
            setAlertDetails(desc);
            pushGlobalNotification("Storm warning", "Severe storms nearby.", "warning");
          } else if (code >= 51 && code <= 67) {
            setWeatherCondition("Rainfall & Wet Weather Advisory");
            setIsAlertActive(false);
            setAlertHeadline("Rainy Weather Update");
            const desc = "Steady rainfall is expected across your area. Take care on slippery roads and consider collecting rainwater for your garden.";
            setAlertDetails(desc);
            pushGlobalNotification("Rain advisory", "Rain expected in your area.", "info");
          } else if (wind > 35 || gusts > 50) {
            setWeatherCondition("High Wind Advisory");
            setIsAlertActive(true);
            setAlertHeadline("Strong Winds Warning");
            const desc = "Strong wind gusts (>35 km/h) are sweeping across your area. Secure loose outdoor items like bins, patio furniture, and shades.";
            setAlertDetails(desc);
            pushGlobalNotification("Wind warning", "Strong winds nearby.", "warning");
          } else {
            setWeatherCondition("Normal Weather Conditions");
            setIsAlertActive(activeProvData.threatLevel !== "green");
            setAlertHeadline("Weather Overview");
            setAlertDetails(activeProvData.warningMessage);
          }
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
      }
    };

    fetchWeatherForLocation();
  }, [location, userProvince]);

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
      <style jsx global>{`
        @keyframes slowBlurIn {
          0% {
            filter: blur(8px);
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            filter: blur(0px);
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slow-blur {
          animation: slowBlurIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

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
                  LOCAL AREA ALERTS
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
                  {streetAddress}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefreshLocationClick}
                title="Refresh Location"
                className="transition-colors shrink-0 cursor-pointer p-1 touch-manipulation z-30 hover:text-white"
                style={{ color: "var(--accent)" }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${(geoLoading || isRefreshingLocation) ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN DESIGN LAYOUT: COMPREHENSIVE METEOROLOGICAL TELEMETRY & PROVINCE ALERTS */}
        <div className="space-y-5">
          
          {/* PROVINCIAL ATMOSPHERIC VISUAL & WARNING HERO CARD */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/80 text-white shadow-2xl min-h-[190px] sm:min-h-[220px] flex flex-col justify-between group pointer-events-auto">
            
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url('${currentBgImage || currentProvData.imageBgUrls[0]}')`,
              }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40 backdrop-blur-[1px]" />

            <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-black/50 border border-white/15 backdrop-blur-md text-[var(--accent)]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wider uppercase">
                    {currentProvData.provinceName}
                  </h3>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-md ${getBadgeStyle(currentProvData.threatLevel)}`}>
                {currentProvData.levelBadge}
              </span>
            </div>

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

          {/* COMPREHENSIVE METEOROLOGICAL TELEMETRY GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            
            {/* 1. Ambient Temp */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Thermometer className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Temperature</span>
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
                  ? "It's quite hot outside. Remember to stay hydrated and keep pets cool." 
                  : temperature !== null && temperature < 10 
                  ? "It's chilly today. Dress warmly and check on your home heaters." 
                  : "Comfortable outdoor temperature for daily chores and outings."}
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
                  <p className="text-[10px] text-muted">Moisture in the air</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {humidity !== null && humidity > 70 
                  ? "The air is very humid. Laundry might take longer to dry outside." 
                  : "Comfortable moisture levels in the air for everyday living."}
              </p>
            </div>

            {/* 3. Wind Speed */}
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
                  ? "Breezy or windy conditions. Secure any loose items on your balcony or yard." 
                  : "Light winds with no disruption to outdoor activities."}
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
                  <p className="text-[10px] text-muted">Airflow direction</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Shows which direction the breeze is traveling from across your neighborhood.
              </p>
            </div>

            {/* 5. Expected Rainfall */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <CloudRain className="h-4 w-4 text-indigo-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Rain Expected Today</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {currentRainChance !== null ? `${currentRainChance}%` : "--"} <span className="text-sm font-normal text-muted">({dailyPrecipitationSum !== null ? `${dailyPrecipitationSum} mm` : "--"})</span>
                  </p>
                  <p className="text-[10px] text-muted">Peak: {peakRainChance !== null ? `${peakRainChance}%` : "--"} at {peakRainTime}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {currentRainChance !== null && currentRainChance > 40 
                  ? "High chance of rain today. Keep an umbrella handy and drive cautiously on wet roads." 
                  : "Low chance of rain for now. Dry conditions expected across most of the day."}
              </p>
            </div>

            {/* 6. Air Pressure */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Gauge className="h-4 w-4 text-teal-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Air Pressure</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {pressure !== null ? `${pressure} hPa` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Atmospheric stability</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Stable air pressure means predictable, calm weather is expected to stay.
              </p>
            </div>

            {/* 7. UV Index */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Sun UV Index</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {uvIndex !== null ? `${uvIndex}` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Sun strength</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {uvIndex !== null && uvIndex >= 6 
                  ? "Strong sunlight today. Apply sunscreen and wear a hat if you are stepping outside." 
                  : "Moderate sun strength. Standard outdoor protection is enough."}
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
                  <p className="text-[10px] text-muted">Sky visibility</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {cloudCover !== null && cloudCover > 70 
                  ? "Mostly cloudy skies overhead. Solar panels will charge a bit slower." 
                  : "Clear or sunny skies. Perfect conditions for solar power generation."}
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
                  <p className="text-[10px] text-muted">How far you can see</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Clear views on the road. Safe driving conditions with no fog or mist blocking your sight.
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
                  <p className="text-[10px] text-muted">Air moisture feel</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {dewPoint !== null && dewPoint > 18 
                  ? "The air feels muggy and heavy outside today." 
                  : "Crisp and refreshing air quality outside."}
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
                  <p className="text-[10px] text-muted">Morning daylight</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Great time for an early morning walk or starting your day with natural sunlight.
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
                  <p className="text-[10px] text-muted">Evening twilight</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Daylight ends in the evening. Make sure outdoor security lights are set to turn on.
              </p>
            </div>

            {/* 13. Air Quality */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <AirIcon className="h-4 w-4 text-teal-300" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Air Quality (AQI)</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {aqi !== null ? `${aqi} AQI` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Fine dust (PM2.5): {pm25 !== null ? `${pm25} µg/m³` : "--"}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {aqi !== null && aqi > 50 ? "Air quality is a bit lower today. Sensitive groups should avoid heavy exercise outside." : "Air quality is clean and fresh for breathing."}
              </p>
            </div>

            {/* 14. Solar Potential */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Zap className="h-4 w-4 text-amber-300" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Solar Power Potential</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {directRadiation !== null ? `${directRadiation} W/m²` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Solar sunshine intensity</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Good sunshine levels for charging your home solar inverter and backup batteries.
              </p>
            </div>

            {/* 15. Soil Health */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Sprout className="h-4 w-4 text-emerald-300" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Soil Health</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {soilTemp !== null ? `${soilTemp}°C` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Moisture: {soilMoisture !== null ? `${(soilMoisture * 100).toFixed(1)}%` : "--"}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Shows ground temperature and water levels to help you take care of your garden or lawn.
              </p>
            </div>

            {/* 16. Storm Energy */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Shield className="h-4 w-4 text-rose-300" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Storm Energy</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {capeValue !== null ? `${capeValue} J/kg` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Freezing level: {freezingLevel !== null ? `${freezingLevel}m` : "--"}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Measures atmospheric energy to track whether sudden lightning or storms might form.
              </p>
            </div>

            {/* 17. Moon & Night Sky */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Moon className="h-4 w-4 text-indigo-300" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Moon & Night Sky</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {moonPhaseName}
                  </p>
                  <p className="text-[10px] text-muted">Rise: {moonriseTime} | Set: {moonsetTime}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                Track moon phases and night schedules for stargazing or outdoor night security.
              </p>
            </div>

            {/* 18. Pollen Count */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Flower2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted">Pollen Count</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tracking-tight text-white">
                    {grassPollen !== null ? `${grassPollen} grains/m³` : "--"}
                  </p>
                  <p className="text-[10px] text-muted">Birch: {birchPollen !== null ? `${birchPollen} grains/m³` : "--"}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted border-t border-white/10 pt-2 leading-relaxed">
                {grassPollen !== null && grassPollen > 30 ? "High pollen levels today. Allergy sufferers should take medication or stay indoors." : "Pollen levels are low to moderate. Enjoy the fresh air!"}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* FIXED BOTTOM-RIGHT CORNER FAB WITH THEME GLOW */}
      <div className="fixed bottom-36 right-6 z-50 pointer-events-auto">
        <button
          type="button"
          onClick={handleOpenSummary}
          aria-label="Summarize Weather"
          className="h-13 w-13 rounded-full border shadow-2xl backdrop-blur-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 group cursor-pointer"
          style={{
            borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
            backgroundColor: "rgba(10, 15, 26, 0.9)",
            boxShadow: "0 10px 35px 0 color-mix(in srgb, var(--accent) 40%, transparent)",
          }}
        >
          <Wand2 className="w-5 h-5 text-white transition-transform duration-500 group-hover:rotate-45" />
        </button>
      </div>

      {/* WEATHER BRIEFING MODAL WITH BLURRED BACKDROP AND GLASS PANEL STYLING */}
      {isSummaryOpen && (
        <div 
          key={modalKey}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto transition-all duration-300 animate-in fade-in"
        >
          <div 
            className="glass-panel relative overflow-hidden rounded-2xl border bg-black/90 text-white shadow-2xl w-full max-w-md h-[460px] flex flex-col justify-between p-5 sm:p-6 animate-in zoom-in-95 slide-in-from-bottom-4"
            style={{ 
              borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--accent) 6%, rgba(10, 15, 26, 0.95))"
            }}
          >
            <div className="panel-reflection pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0 relative z-10">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <h3 
                  className="text-xs font-bold tracking-[0.15em] uppercase text-white"
                >
                  INTELLIGENT BRIEFING
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsSummaryOpen(false)}
                className="p-1 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Area with Short, Concise, Actionable Insights */}
            <div className="overflow-y-auto no-scrollbar space-y-3 text-xs text-white/90 leading-relaxed py-2 animate-slow-blur shrink relative z-10">
              
              <div className="p-3 rounded-xl border border-white/10 bg-black/40 space-y-1">
                <p className="font-bold text-white text-xs">{currentProvData.statusTitle}</p>
                <p className="text-white/70 text-[11px]">{currentProvData.warningMessage}</p>
              </div>

              <div className="space-y-2.5 text-white/85 px-0.5">
                <div className="flex items-start gap-2">
                  <span className="text-[var(--accent)] font-bold">🌡️</span>
                  <p>
                    <strong className="text-white">Temp:</strong> {temperature !== null ? `${temperature}°C` : "--"} (Feels like {apparentTemp !== null ? `${apparentTemp}°C` : "--"}). {temperature !== null && temperature > 30 ? "High heat alert—stay hydrated." : temperature !== null && temperature < 10 ? "Chilly day—bundle up." : "Comfortable ambient conditions."}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[var(--accent)] font-bold">☀️</span>
                  <p>
                    <strong className="text-white">UV Index:</strong> {uvIndex !== null ? uvIndex : "--"}. {uvIndex !== null && uvIndex >= 6 ? "Strong sun—wear sunscreen and a hat." : "Moderate sun strength."}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[var(--accent)] font-bold">☂️</span>
                  <p>
                    <strong className="text-white">Rain:</strong> {currentRainChance !== null ? `${currentRainChance}% chance` : "--"} ({dailyPrecipitationSum !== null ? `${dailyPrecipitationSum} mm` : "0 mm"}). {peakRainChance !== null && peakRainChance > 40 ? `Peak rain expected around ${peakRainTime}.` : "Dry weather ahead."}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[var(--accent)] font-bold">🌱</span>
                  <p>
                    <strong className="text-white">Soil Moisture:</strong> {soilMoisture !== null ? `${(soilMoisture * 100).toFixed(1)}%` : "--"}. {soilMoisture !== null && soilMoisture < 0.2 ? "Soil is dry—consider watering your garden." : "Soil moisture is stable."}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[var(--accent)] font-bold">⚡</span>
                  <p>
                    <strong className="text-white">Solar Potential:</strong> {directRadiation !== null ? `${directRadiation} W/m²` : "--"}. {cloudCover !== null && cloudCover > 70 ? "Cloudy skies will slow solar charging." : "Optimal solar panel generation."}
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-[var(--accent)] font-bold">🌬️</span>
                  <p>
                    <strong className="text-white">Wind:</strong> {windSpeed !== null ? `${windSpeed} km/h` : "--"} (Gusts {windGusts !== null ? `${windGusts} km/h` : "--"}). {windGusts !== null && windGusts > 40 ? "Windy—secure outdoor items." : "Calm breeze."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Dismiss Button in Theme Color */}
            <div className="pt-2 flex justify-end border-t border-white/10 shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => setIsSummaryOpen(false)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-lg"
                style={{
                  backgroundColor: "var(--accent)",
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
