"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Scale, Users, Building2, Wrench, X, ChevronUp, ChevronDown } from "lucide-react";

export default function JudgeRoleDock() {
  const router = useRouter();
  const pathname = usePathname();
  const [isJudgeActive, setIsJudgeActive] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const checkJudgeStatus = () => {
      const active = localStorage.getItem("resigrid_judge_mode") === "true";
      setIsJudgeActive(active);
    };

    checkJudgeStatus();
    window.addEventListener("storage", checkJudgeStatus);
    const interval = setInterval(checkJudgeStatus, 1000);

    return () => {
      window.removeEventListener("storage", checkJudgeStatus);
      clearInterval(interval);
    };
  }, []);

  if (!isJudgeActive) return null;

  // Pre-seed role-specific mock profile into local storage upon switching personas
  const seedJudgeProfile = (route: string) => {
    let mockProfile = {
      fullName: "Judge",
      email: "judge.evaluator@resigrid.co.za",
      phone: "+27 82 555 0192",
      selectedProvince: "KwaZulu-Natal",
      selectedCity: "Pietermaritzburg (Msunduzi)",
      selectedWard: "Ward 26: Northern Park, Victoria Road areas, and parts of Woodlands",
      streetAddress: "142 Chief Albert Luthuli St",
      accountNumber: "800459201",
      role: "resident",
    };

    if (route.startsWith("/dashboard")) {
      mockProfile = {
        fullName: "Admin Dispatcher (Msunduzi)",
        email: "dispatch.control@msunduzi.gov.za",
        phone: "+27 33 392 2000",
        selectedProvince: "KwaZulu-Natal",
        selectedCity: "Pietermaritzburg (Msunduzi)",
        selectedWard: "Ward 22: Pietermaritzburg Central Business District (CBD Central)",
        streetAddress: "Msunduzi Civic Centre, City Hall",
        accountNumber: "MUNI-ADM-01",
        role: "municipal",
      };
      localStorage.setItem("resigrid_account_role", "municipal");
    } else if (route.startsWith("/crew")) {
      mockProfile = {
        fullName: "Rapid Response Unit 04",
        email: "crew04.field@msunduzi.gov.za",
        phone: "+27 83 444 8812",
        selectedProvince: "KwaZulu-Natal",
        selectedCity: "Pietermaritzburg (Msunduzi)",
        selectedWard: "Ward 26: Northern Park, Victoria Road areas, and parts of Woodlands",
        streetAddress: "Depot 4 - Willowton Sector",
        accountNumber: "CREW-UNIT-04",
        role: "crew",
      };
      localStorage.setItem("resigrid_crew_unit", "Rapid Response Unit 04");
      localStorage.setItem("resigrid_account_role", "crew");
    } else {
      localStorage.setItem("resigrid_account_role", "resident");
    }

    localStorage.setItem("resigrid_civic_profile", JSON.stringify(mockProfile));
    localStorage.setItem("resigrid_profile_JUDGE_MASTER", JSON.stringify(mockProfile));
  };

  // Determine current active persona label based on route
  let activeRoleLabel = "Citizen";
  let activeRoleBg = "border-teal-500/40 bg-teal-500/20 text-teal-300";
  if (pathname?.startsWith("/dashboard")) {
    activeRoleLabel = "Municipal";
    activeRoleBg = "border-blue-500/40 bg-blue-500/20 text-blue-300";
  } else if (pathname?.startsWith("/crew")) {
    activeRoleLabel = "Field Crew";
    activeRoleBg = "border-amber-500/40 bg-amber-500/20 text-amber-300";
  } else if (pathname?.startsWith("/judge")) {
    activeRoleLabel = "Judge Hub";
    activeRoleBg = "border-purple-500/40 bg-purple-500/20 text-purple-300";
  }

  const handleSelectRole = (route: string) => {
    seedJudgeProfile(route);
    router.push(route);
    setIsExpanded(false);
  };

  const handleExit = () => {
    localStorage.removeItem("resigrid_judge_mode");
    localStorage.removeItem("resigrid_account_role");
    localStorage.removeItem("resigrid_crew_unit");
    setIsJudgeActive(false);
    router.replace("/profile");
  };

  return (
    <div className="fixed left-3 bottom-24 z-50 flex flex-col items-start gap-2 pointer-events-auto">
      {/* EXPANDED MENU OPTIONS */}
      {isExpanded && (
        <div className="glass-panel p-2.5 w-56 space-y-2 border border-purple-500/40 bg-black/90 shadow-2xl backdrop-blur-xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 px-1">
            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-3 h-3" /> Judge Switcher
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-muted hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleSelectRole("/")}
              className={`w-full p-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                pathname === "/" ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "hover:bg-white/5 text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">Citizen / Resident</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole("/dashboard")}
              className={`w-full p-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                pathname?.startsWith("/dashboard") ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "hover:bg-white/5 text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Municipal Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole("/crew")}
              className={`w-full p-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                pathname?.startsWith("/crew") ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "hover:bg-white/5 text-white"
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Field Crew Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole("/judge")}
              className={`w-full p-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                pathname?.startsWith("/judge") ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "hover:bg-white/5 text-white"
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Judge Hub Home</span>
            </button>
          </div>

          <div className="pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={handleExit}
              className="w-full py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-semibold transition-colors text-center cursor-pointer"
            >
              Exit Judge Mode
            </button>
          </div>
        </div>
      )}

      {/* COMPACT PILL ICON WITH TEXT */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`px-3 py-2 rounded-full border shadow-xl flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md font-semibold text-xs ${activeRoleBg}`}
        style={{
          boxShadow: "0 0 20px rgba(139, 92, 246, 0.25)",
        }}
      >
        <Scale className="w-4 h-4 shrink-0 text-purple-300" />
        <span className="truncate max-w-[120px]">{activeRoleLabel}</span>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronUp className="w-3.5 h-3.5 shrink-0" />}
      </button>
    </div>
  );
}
