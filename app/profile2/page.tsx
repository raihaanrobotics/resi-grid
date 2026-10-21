"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Shield,
  MapPin,
  Save,
  CheckCircle2,
  Palette,
  Smartphone,
  LogOut,
  Mail,
  Lock,
  ArrowRight,
  Building2,
  Loader2,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/authRedirect";

const ACCENT_PALETTES = [
  { id: "teal", name: "Resi Teal", hex: "#14b8a6", border: "border-teal-500", bg: "bg-teal-500" },
  { id: "navy", name: "Deep Navy", hex: "#1e3a8a", border: "border-blue-600", bg: "bg-blue-600" },
  { id: "amber", name: "Grid Amber", hex: "#f59e0b", border: "border-amber-500", bg: "bg-amber-500" },
  { id: "purple", name: "Civic Violet", hex: "#8b5cf6", border: "border-purple-500", bg: "bg-purple-500" },
  { id: "pink", name: "Neon Pink", hex: "#ec4899", border: "border-pink-500", bg: "bg-pink-500" },
  { id: "emerald", name: "Eco Green", hex: "#10b981", border: "border-emerald-500", bg: "bg-emerald-500" },
];

const SOUTH_AFRICAN_PROVINCES_CITIES_WARDS: Record<string, Record<string, string[]>> = {
  "KwaZulu-Natal": {
    "Pietermaritzburg (Msunduzi)": [
      "Ward 1: Phayiphini, Laduma, Komkhulu, Mbutshane, Ntokozweni, Kwamafindo, Mbuncwane, and Mpumuza",
      "Ward 2: KwaMbanjwa, Mkangala, Zayeka, Nadi, and Sweetwaters/Mbubu",
      "Ward 3: Gezubuso, Inadi, and parts of Sweetwaters",
      "Ward 4: KwaNxamalala, Mbubu, Taylor’s Halt, and surrounding rural communities",
      "Ward 5: Smero, Henley-on-Klip, and parts of Edendale",
      "Ward 6: Caluza, Mpumuza, and surrounding sectors of Edendale",
      "Ward 7: Willowfontein East, Khanya Village, and surrounding hillsides",
      "Ward 8: Machibisa, Dambuza, and central Edendale zones",
      "Ward 9: Harewood, Willowfontein West, and parts of the greater Edendale area",
      "Ward 10: Azalea, Imbali Unit 1, and Imbali Unit 2",
      "Ward 11: Imbali Unit 13, Unit 14, and Unit 15",
      "Ward 12: Imbali Stage 2, Unit 3, and Unit 4",
      "Ward 13: Imbali Unit BB, Unit CC, and parts of Unit J",
      "Ward 14: Imbali Unit 18, Unit 19, and Tindi Village",
      "Ward 15: Imbali Unit 14, Slangspruit, and surrounding informal settlements",
      "Ward 16: Ashdown, Buffer, and parts of Edendale",
      "Ward 17: France township, Ridge Park, and Unit H (Imbali)",
      "Ward 18: Grange, Westgate, Ridge Park, and Bisley Heights",
      "Ward 19: Pelham, Scottsville (West), Oribi, and the University of KwaZulu-Natal (UKZN) campus",
      "Ward 20: Camperdown side boundaries, Ashburton, Lynnfield Park, and Cleland",
      "Ward 21: Epworth, Hayfields, Lincoln Meade, and Bellevue",
      "Ward 22: Pietermaritzburg Central Business District (CBD Central), and central loops",
      "Ward 23: Signal Hill, Richmond Crest, and parts of the western CBD",
      "Ward 24: Napierville, Prestbury, Clarendon, and Wembley",
      "Ward 25: Montrose, Chase Valley, Woodlands, Oak Park, and Town Bush Valley",
      "Ward 26: Northern Park, Victoria Road areas, and parts of Woodlands",
      "Ward 27: Allandale, Raisethorpe, and Newholme",
      "Ward 28: Northdale (Sections including Bombay Heights, Springfields)",
      "Ward 29: Copesville, Swapo, and Jadeite sections",
      "Ward 30: Haniville, Claridge rural margins, and portions of upper Copesville",
      "Ward 31: Northdale (Lower blocks), Truro, and Dunveria",
      "Ward 32: Woodlands (Main extension), Glenwood, and mountain rises",
      "Ward 33: Manor, Sobantu (West), and the KwaJika Joe informal settlement",
      "Ward 34: Mountain Rise Industrial Area, Willowton, and parts of the inner city fringes",
      "Ward 35: Sobantu Township (Central and East), and adjacent community zones",
      "Ward 36: Imbali Unit 14 (Upper limits) and parts of greater Dambuza",
      "Ward 37: Greater Edendale Hospital areas and Georgetown",
      "Ward 38: Esigodini and upper regions of the Edendale valley corridor",
      "Ward 39: Plessisslaer, Imbali Unit AA, and lower Westgate buffers",
      "Ward 40: Whispers, Thembalihle, and newly expanded settlement nodes near the outer city boundary",
      "Ward 41: Khobonina, Vulindlela fringes, and deep traditional authorities flanking the western municipality rim",
    ],
    "Durban (eThekwini)": [
      "Ward 26 (Durban CBD / South Beach / North Beach)",
      "Ward 31 (Morningside / Glenwood / Musgrave)",
      "Ward 33 (Umhlanga / Durban North)",
      "Ward 73 (Phoenix / Verulam)",
      "Ward 75 (Chatsworth / Umlazi)",
    ],
    "Richards Bay (uMhlathuze)": [
      "Ward 1 (Arboretum / Meerensee)",
      "Ward 2 (CBD / Veldenvlei)",
      "Ward 4 (Brackenham)",
      "Ward 23 (Esikhaleni)",
    ],
  },
  "Gauteng": {
    "Johannesburg (City of Joburg)": [
      "Ward 23 (Auckland Park / Melville / Westdene)",
      "Ward 64 (Braamfontein / Newtown / Marshalltown)",
      "Ward 90 (Sandton / Rosebank / Hyde Park)",
      "Ward 117 (Randburg / Ferndale / Blairgowrie)",
      "Ward 126 (Roodepoort / Constantia Kloof)",
      "Ward 54 (Soweto / Diepkloof)",
      "Ward 29 (Soweto / Orlando West)",
    ],
    "Pretoria (Tshwane)": [
      "Ward 59 (Pretoria CBD / Arcadia / Sunnyside)",
      "Ward 57 (Hatfield / Brooklyn / Lynnwood)",
      "Ward 44 (Centurion / Lyttelton)",
      "Ward 16 (Pretoria North / Akasia)",
    ],
    "Ekurhuleni (East Rand)": [
      "Ward 20 (Kempton Park Central)",
      "Ward 32 (Benoni CBD)",
      "Ward 73 (Boksburg West)",
      "Ward 37 (Germiston Central)",
    ],
  },
  "Western Cape": {
    "Cape Town (City of Cape Town)": [
      "Ward 54 (Cape Town CBD / Green Point / Waterfront)",
      "Ward 115 (Sea Point / Camps Bay / Hout Bay)",
      "Ward 59 (Claremont / Rondebosch / Newlands)",
      "Ward 71 (Mitchells Plain / Strandfontein)",
      "Ward 108 (Khayelitsha / Harare)",
      "Ward 16 (Bellville / Durbanville)",
    ],
    "Stellenbosch": [
      "Ward 1 (Stellenbosch Central / Idas Valley)",
      "Ward 2 (Kayamandi)",
      "Ward 4 (Franschhoek)",
    ],
    "George": [
      "Ward 14 (George Central / Pacaltsdorp)",
      "Ward 16 (Heatherlands / Blanco)",
    ],
  },
  "Eastern Cape": {
    "Gqeberha (Nelson Mandela Bay)": [
      "Ward 5 (Central / Richmond Hill / Humewood)",
      "Ward 6 (Walmer / Springfield)",
      "Ward 8 (Summerstrand / Humewood)",
      "Ward 31 (Motherwell / New Brighton)",
    ],
    "East London (Buffalo City)": [
      "Ward 1 (Quigney / CBD)",
      "Ward 2 (Berea / Vincent)",
      "Ward 4 (Mdantsane)",
    ],
  },
  "Free State": {
    "Bloemfontein (Mangaung)": [
      "Ward 21 (Bloemfontein CBD / Westdene)",
      "Ward 15 (Universitas / Brandwag)",
      "Ward 48 (Botshabelo)",
      "Ward 40 (Thaba Nchu)",
    ],
  },
  "Mpumalanga": {
    "Nelspruit (Mbombela)": [
      "Ward 14 (Nelspruit CBD / West Acres)",
      "Ward 16 (Sonpark / Nelspruit Ext)",
      "Ward 30 (White River)",
    ],
    "Witbank (Emalahleni)": [
      "Ward 21 (Witbank Central / Tasbet Park)",
      "Ward 23 (Klarinet)",
    ],
  },
  "Limpopo": {
    "Polokwane": [
      "Ward 20 (Polokwane Central / Annadale)",
      "Ward 21 (Bendor / Fauna Park)",
      "Ward 10 (Seshego)",
    ],
  },
  "North West": {
    "Rustenburg": [
      "Ward 18 (Rustenburg CBD / Cashan)",
      "Ward 19 (Tlhabane)",
    ],
    "Mahikeng": [
      "Ward 12 (Mahikeng Central / Mmabatho)",
    ],
  },
  "Northern Cape": {
    "Kimberley (Sol Plaatje)": [
      "Ward 1 (Kimberley CBD / Belgravia)",
      "Ward 15 (Ritchie / Galeshewe)",
    ],
  },
};

export default function MunicipalProfilePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Auth Form States (Strictly Municipal)
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const [selectedProvince, setSelectedProvince] = useState<string>("KwaZulu-Natal");
  const [selectedCity, setSelectedCity] = useState<string>("Pietermaritzburg (Msunduzi)");
  const [stagedAccent, setStagedAccent] = useState<string>("teal");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Preferences saved successfully");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Action feedback states
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  // Profile & Contact States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  // Check Supabase Auth Session and load municipal profile on Mount
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const role = session.user.user_metadata?.role || "resident";
          // Enforce restriction: only municipal users are allowed here
          if (role !== "municipal") {
            router.replace("/");
            return;
          }

          setIsAuthenticated(true);
          const userEmail = session.user.email || "";
          setEmail(userEmail);

          const meta = session.user.user_metadata || {};
          const localProfile = localStorage.getItem(`resigrid_profile_${session.user.id}`);
          const parsedLocal = localProfile ? JSON.parse(localProfile) : {};

          setFullName(meta.full_name || parsedLocal.fullName || "");
          setPhone(meta.phone || parsedLocal.phone || "");
          setSelectedProvince(meta.province || parsedLocal.selectedProvince || "KwaZulu-Natal");
          setSelectedCity(meta.city || parsedLocal.selectedCity || "Pietermaritzburg (Msunduzi)");
          setSelectedWard(meta.ward || parsedLocal.selectedWard || "Ward 26: Northern Park, Victoria Road areas, and parts of Woodlands");
          setStreetAddress(meta.street_address || parsedLocal.streetAddress || "");
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setAuthLoading(false);
      }
    }

    checkSession();

    try {
      const savedAccent = localStorage.getItem("resigrid_accent_theme");
      if (savedAccent) {
        setStagedAccent(savedAccent);
        const matchedPalette = ACCENT_PALETTES.find((p) => p.id === savedAccent);
        if (matchedPalette) {
          document.documentElement.style.setProperty("--feature-accent", matchedPalette.hex);
          document.documentElement.style.setProperty("--accent", matchedPalette.hex);
        }
      }
    } catch (e) {
      console.error("Error reading saved preferences:", e);
    }
  }, [router]);

  // Hide bottom navigation dock across non-allowed pages
  useEffect(() => {
    const navDock = document.querySelector(".resigrid-dock, nav[class*='dock'], footer[class*='navigation']") as HTMLElement;
    if (navDock) {
      navDock.style.display = isAuthenticated ? "" : "none";
    }
    return () => {
      if (navDock) {
        navDock.style.display = "";
      }
    };
  }, [isAuthenticated]);

  const handlePhoneBlur = () => {
    if (!phone) return;
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("27")) {
      digits = "+" + digits;
    } else if (digits.startsWith("0")) {
      digits = "+27" + digits.substring(1);
    } else if (!digits.startsWith("+")) {
      digits = "+27" + digits;
    }
    setPhone(digits);
  };

  // Handle Municipal Authentication
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setIsAuthenticating(true);

    const validMunicipalKey = "MUNI-SECURE-2026";
    if (secretCode !== validMunicipalKey) {
      setAuthError("Invalid Municipal Authorization Key. Access restricted to authorized personnel only.");
      setIsAuthenticating(false);
      return;
    }

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            emailRedirectTo: getAuthCallbackUrl({
              currentOrigin: window.location.origin,
              isNativePlatform: Capacitor.isNativePlatform(),
            }),
            data: { role: "municipal", full_name: fullName, phone }
          }
        });
        if (error) {
          setAuthError(error.message);
          return;
        }
        if (!data.session) {
          setAuthMessage("Confirmation email sent. Open the link to verify your email, then sign in.");
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
          return;
        }
        if (!data.session) {
          setAuthError("Sign-in did not create an active session. Please try again.");
          return;
        }
        
        const meta = data.session.user.user_metadata || {};
        if (meta.role !== "municipal") {
          await supabase.auth.signOut();
          setAuthError("Access Denied: This account is not authorized for Municipal clearance.");
          return;
        }

        setEmail(data.session.user.email || authEmail);
        setFullName(meta.full_name || "");
        setPhone(meta.phone || "");
      }

      setEmail(authEmail);
      localStorage.setItem("resigrid_account_role", "municipal");
      
      router.replace("/profile2");
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    const citiesInProv = SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[province] || {};
    const firstCity = Object.keys(citiesInProv)[0] || "";
    setSelectedCity(firstCity);
    const wards = citiesInProv[firstCity] || [];
    if (wards.length > 0) setSelectedWard(wards[0]);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    const citiesInProv = SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[selectedProvince] || {};
    const wards = citiesInProv[city] || [];
    if (wards.length > 0) setSelectedWard(wards[0]);
  };

  const handleSelectAccent = (accentId: string) => {
    setStagedAccent(accentId);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const matchedPalette = ACCENT_PALETTES.find((p) => p.id === stagedAccent);
    if (matchedPalette) {
      localStorage.setItem("resigrid_accent_theme", stagedAccent);
      document.documentElement.style.setProperty("--feature-accent", matchedPalette.hex);
      document.documentElement.style.setProperty("--accent", matchedPalette.hex);
      window.dispatchEvent(
        new CustomEvent("resigrid_theme_change", { detail: { hex: matchedPalette.hex, id: stagedAccent } })
      );
    }

    const profileData = {
      fullName,
      email,
      phone,
      selectedProvince,
      selectedCity,
      selectedWard,
      streetAddress,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem(`resigrid_profile_${user.id}`, JSON.stringify(profileData));
        await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            phone,
            province: selectedProvince,
            city: selectedCity,
            ward: selectedWard,
            street_address: streetAddress,
            role: "municipal",
          }
        });
      }
    } catch (err) {
      console.error("Error saving user profile metadata to Supabase:", err);
    } finally {
      setIsSaving(false);
    }

    setSuccessMessage("Municipal profile settings updated successfully");
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase sign out error:", err);
    } finally {
      setIsSigningOut(false);
    }
    localStorage.removeItem("resigrid_account_role");
    setIsAuthenticated(false);
    router.replace("/");
  };

  const currentCities = SOUTH_AFRICAN_PROVINCES_CITIES_WARDS[selectedProvince] || {};
  const currentWards = currentCities[selectedCity] || [];
  const wardNumberOnly = selectedWard ? selectedWard.split(":")[0] : selectedWard;

  if (authLoading) {
    return (
      <main className="resigrid-shell min-h-screen flex items-center justify-center text-white">
        <div className="animate-pulse text-xs tracking-[0.2em] text-muted">LOADING MUNICIPAL SESSION...</div>
      </main>
    );
  }

  // UNAUTHENTICATED MUNICIPAL GATEWAY
  if (!isAuthenticated) {
    return (
      <main className="resigrid-shell min-h-screen flex items-center justify-center p-3 sm:p-6 text-[var(--text)] selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
        <div className="ambient-background pointer-events-none" aria-hidden="true">
          <div className="ambient-orb orb-one" />
          <div className="ambient-orb orb-two" />
          <div className="ambient-orb orb-three" />
          <div className="ambient-grid" />
        </div>

        <div className="glass-panel p-5 sm:p-8 w-full max-w-md relative z-20 space-y-5 sm:space-y-6 shadow-2xl my-auto">
          <div className="panel-reflection pointer-events-none" />

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto text-accent-dynamic">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-wider text-white">MUNICIPAL STAFF GATEWAY</h1>
            <p className="text-xs text-muted">
              Authorized personnel login. Access restricted to Dashboard and Profile modules only.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
              {authError}
            </div>
          )}
          {authMessage && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-200 text-xs text-center">
              {authMessage}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-medium text-muted block mb-1">Municipal Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-muted" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="officer@msunduzi.gov.za"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-muted" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-accent-dynamic block mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Municipal Private Authorization Key
              </label>
              <input
                type="password"
                required
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                placeholder="Enter staff security code"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <p className="text-[9px] text-muted mt-1">Required for dispatch authentication.</p>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 rounded-xl border bg-teal-500/20 border-teal-500/40 hover:bg-teal-500/30 text-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{authMode === "login" ? "Access Municipal Dashboard" : "Register Municipal Staff"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-muted">{authMode === "login" ? "Need staff account?" : "Already registered?"}</span>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                className="text-accent-dynamic hover:underline font-semibold cursor-pointer"
              >
                {authMode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </div>
            <div className="flex justify-center gap-4 text-[11px]">
              <Link href="/" className="text-accent-dynamic hover:underline">Resident login</Link>
              <Link href="/profile3" className="text-accent-dynamic hover:underline">Crew login</Link>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // AUTHENTICATED MUNICIPAL PROFILE VIEW
  return (
    <main className="resigrid-shell min-h-screen overflow-x-hidden text-[var(--text)] selection:bg-teal-500/30 selection:text-teal-200">
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1920px] space-y-4 px-3 pb-32 pt-4 sm:space-y-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">
        
        {/* HEADER */}
        <header className="glass-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-5 relative z-20">
          <div className="flex items-center gap-3">
            <div className="feature-icon feature-energy shrink-0">
              <Building2 className="w-5 h-5 text-accent-dynamic" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xs font-semibold tracking-[0.18em] text-white sm:text-sm">
                  MUNICIPAL DISPATCH ADMINISTRATION
                </h1>
                <span 
                  className="rounded-full border px-2 py-0.5 text-[8px] font-medium tracking-[0.15em] text-accent-dynamic shrink-0 transition-all"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                    borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
                  }}
                >
                  MUNICIPAL STAFF
                </span>
              </div>
              <p className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-muted sm:text-[10px]">
                RESTRICTED PORTAL: DISPATCH &amp; PROFILE ACCESS ONLY
              </p>
            </div>
          </div>
        </header>

        {/* HERO CARD */}
        <div className="glass-panel p-4 sm:p-6 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pointer-events-auto z-20 w-full">
          <div className="panel-reflection pointer-events-none" />

          <div className="flex items-center gap-4 min-w-0">
            <div 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-white/20 flex items-center justify-center text-lg sm:text-xl font-black text-white shrink-0 transition-all shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {fullName ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase() : "MS"}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">{fullName || "Municipal Officer"}</h2>
                <CheckCircle2 className="w-4 h-4 text-accent-dynamic shrink-0" />
              </div>
              <p className="text-xs text-muted truncate mt-0.5">{email}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] sm:text-[11px] text-muted flex-wrap">
                <span className="flex items-center gap-1 text-accent-dynamic">
                  <MapPin className="w-3 h-3 text-accent-dynamic shrink-0" /> {selectedCity} • {wardNumberOnly}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SUCCESS TOAST */}
        {savedSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4 animate-fadeIn">
            <div className="p-4 bg-black/90 border border-white/30 rounded-2xl text-white text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-accent-dynamic" /> 
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* SETTINGS PANELS */}
        <div className="space-y-5 relative z-20 w-full">
          
          {/* THEME ACCENT SELECTOR */}
          <div className="glass-panel p-4 sm:p-6 space-y-4 relative pointer-events-auto w-full">
            <div className="panel-reflection pointer-events-none" />

            <div className="border-b border-white/10 pb-3">
              <h2 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-accent-dynamic shrink-0" /> System Theme
              </h2>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed">
                Customize your municipal console accent theme.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
              {ACCENT_PALETTES.map((pal) => {
                const isSelected = stagedAccent === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => handleSelectAccent(pal.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative z-30 select-none bg-black/30 hover:bg-white/5 ${
                      isSelected
                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/50 scale-[1.02]"
                        : "border-white/10"
                    }`}
                    style={{ touchAction: "manipulation" }}
                  >
                    <div className="relative flex items-center justify-center p-1 pointer-events-none">
                      <span 
                        className={`absolute inset-0 rounded-full blur-[3px] transition-opacity duration-300 pointer-events-none ${
                          isSelected ? "opacity-45 scale-105" : "opacity-15"
                        }`}
                        style={{ backgroundColor: pal.hex }}
                      />
                      <span 
                        className="w-7 h-7 rounded-full relative flex items-center justify-center overflow-hidden transition-all duration-300 border border-white/20 shadow-inner pointer-events-none"
                        style={{
                          backgroundColor: pal.hex,
                          boxShadow: isSelected 
                            ? `inset 0 1px 1px rgba(255,255,255,0.6), 0 0 6px ${pal.hex}` 
                            : `inset 0 1px 1px rgba(255,255,255,0.3)`
                        }}
                      >
                        <span 
                          className="absolute inset-0 rounded-full pointer-events-none"
                          style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.25) 100%)"
                          }}
                        />
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-white pointer-events-none">{pal.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MUNICIPAL OFFICER DETAILS */}
          <div className="glass-panel p-4 sm:p-6 space-y-4 relative pointer-events-auto w-full">
            <div className="panel-reflection pointer-events-none" />

            <div className="border-b border-white/10 pb-3">
              <h2 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-accent-dynamic shrink-0" /> Municipal Officer Credentials &amp; Jurisdiction
              </h2>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5 leading-relaxed">
                Manage your official contact details and supervisory jurisdiction.
              </p>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 relative z-20">
              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Official Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Adv. M. Khumalo"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@msunduzi.gov.za"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Direct Contact Phone / WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={handlePhoneBlur}
                  placeholder="+27 33 392 2000"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Province</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto cursor-pointer"
                >
                  {Object.keys(SOUTH_AFRICAN_PROVINCES_CITIES_WARDS).map((prov) => (
                    <option key={prov} value={prov} className="bg-neutral-900 text-white">
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Municipality / City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto cursor-pointer"
                >
                  {Object.keys(currentCities).map((city) => (
                    <option key={city} value={city} className="bg-neutral-900 text-white">
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Supervisory Ward</label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto cursor-pointer"
                >
                  {currentWards.map((ward) => (
                    <option key={ward} value={ward} className="bg-neutral-900 text-white">
                      {ward}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] sm:text-xs font-medium text-muted block mb-1">Municipal Headquarters / Office Address</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g. Professor Nyembezi Centre, 335 Cwileni Rd"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors relative z-30 pointer-events-auto"
                />
              </div>
            </form>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave()}
              className="w-full sm:w-auto px-6 py-3 rounded-full border text-accent-dynamic font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer relative z-30 shadow-lg select-none disabled:opacity-50"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                borderColor: "color-mix(in srgb, var(--accent) 45%, transparent)",
                touchAction: "manipulation",
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin pointer-events-none" />
                  <span className="pointer-events-none">Saving Preferences...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 pointer-events-none" />
                  <span className="pointer-events-none">Save Municipal Preferences</span>
                </>
              )}
            </button>
          </div>

          {/* SESSION & SECURITY */}
          <div className="glass-panel p-4 sm:p-6 space-y-4 relative pointer-events-auto w-full">
            <div className="panel-reflection pointer-events-none" />

            <div className="border-b border-white/10 pb-3">
              <h2 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                Session &amp; Security
              </h2>
            </div>

            <div className="space-y-3 relative z-20">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <Smartphone className="w-4 h-4 text-accent-dynamic shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">Active Municipal Dispatch Session</p>
                  <p className="text-[10px] text-muted truncate">Secure Auth • Verified Personnel</p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={() => handleSignOut()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer relative z-30 select-none disabled:opacity-50"
                  style={{ touchAction: "manipulation" }}
                >
                  {isSigningOut ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin pointer-events-none" />
                      <span className="pointer-events-none">Signing Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5 pointer-events-none" />
                      <span className="pointer-events-none">Sign Out Session</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
