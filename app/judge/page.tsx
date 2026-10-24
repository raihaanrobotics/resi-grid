"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scale,
  Users,
  Wrench,
  Building2,
  ShoppingBag,
  Zap,
  Droplets,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RoleCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  icon: any;
  colorHex: string;
  badge: string;
}

const ROLES: RoleCard[] = [
  {
    id: "citizen",
    title: "Citizen / Resident Portal",
    subtitle: "End-User Consumer App",
    description: "Access community micro-grids, test live tap/voltage telemetry via mobile sensors, trade power/water/goods on ResiMarket, and report civic infrastructure faults.",
    route: "/",
    icon: Users,
    colorHex: "#14b8a6",
    badge: "Consumer View",
  },
  {
    id: "municipal",
    title: "Municipal Admin Dashboard",
    subtitle: "Command & Control Center",
    description: "High-level overview to triage incoming municipal reports, assign repair teams, view live GIS ward telemetry, and monitor utility node statuses across the municipality.",
    route: "/dashboard",
    icon: Building2,
    colorHex: "#3b82f6",
    badge: "Admin View",
  },
  {
    id: "crew",
    title: "Field Crew Mobile Portal",
    subtitle: "First Responder Unit",
    description: "Mobile-optimized field worker view to receive dispatched job tickets, update repair progress in real-time, and close out work orders with photo proof.",
    route: "/crew",
    icon: Wrench,
    colorHex: "#f59e0b",
    badge: "Field Ops",
  },
];

export default function JudgeDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activePersona, setActivePersona] = useState<string>("citizen");

  useEffect(() => {
    const judgeMode = localStorage.getItem("resigrid_judge_mode");
    if (judgeMode === "true") {
      setIsAuthorized(true);
      // Automatically run silent background seeding so data is guaranteed present for judges
      (async () => {
        try {
          const sampleWaterNode = {
            node_id: "WAT-9901",
            owner: "Demo Borehole Hub",
            type: "Borehole & Filtration",
            capacity: "5,000 L",
            price: "Free / Community",
            location: "Ward 26 Test Sector",
            whatsapp_phone: "+27821234567",
            is_user_created: true,
          };
          const samplePowerNode = {
            node_id: "PWR-9902",
            owner: "Demo Solar Micro-Grid",
            type: "10kW Hybrid Inverter",
            capacity: "Device Charging & Wi-Fi",
            price: "R1.50 / kWh",
            location: "Ward 26 Test Sector",
            whatsapp_phone: "+27821234567",
            is_user_created: true,
          };
          await supabase.from("water_nodes").insert([sampleWaterNode]).select();
          await supabase.from("power_nodes").insert([samplePowerNode]).select();
        } catch (e) {
          localStorage.setItem("resigrid_judge_seeded", "true");
        }
      })();
    } else {
      router.replace("/profile");
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <main className="resigrid-shell min-h-screen flex items-center justify-center text-white">
        <div className="animate-pulse text-xs tracking-[0.2em] text-muted">VERIFYING EVALUATOR CREDENTIALS...</div>
      </main>
    );
  }

  if (!isAuthorized) return null;

  return (
    <main className="resigrid-shell min-h-screen w-full overflow-x-hidden text-[var(--text)] selection:bg-purple-500/30 selection:text-purple-200">
      {/* Ambient background */}
      <div className="ambient-background pointer-events-none" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-3 pb-32 pt-6 sm:px-6 lg:px-8 box-border">
        
        {/* HEADER */}
        <header className="glass-panel p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-lg">
              <Scale className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold tracking-[0.15em] text-white">
                  JUDGE HUB
                </h1>
                <span className="rounded-full border border-purple-500/40 bg-purple-500/20 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-purple-200 shrink-0">
                  MASTER PASSKEY ACTIVE
                </span>
              </div>
              <p className="mt-0.5 text-[10px] sm:text-xs text-muted truncate">
                Seamless role switching across the ResiGrid ecosystem.
              </p>
            </div>
          </div>
        </header>

        {/* PITCH BRIEFING CARD */}
        <div className="glass-panel p-5 sm:p-7 relative space-y-3 pointer-events-auto border border-purple-500/30 bg-purple-500/5">
          <div className="panel-reflection pointer-events-none" />
          <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Evaluator Quick Briefing
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Welcome, Evaluator!</h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-4xl">
            ResiGrid solves municipal infrastructure collapse by turning citizens into resilient micro-utility operators. Select any of the three core user personas below to experience the platform from a Resident, Municipal Planner, or Field Responder perspective instantly.
          </p>
        </div>

        {/* ROLE SELECTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-20">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = activePersona === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setActivePersona(role.id)}
                className={`glass-panel p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all cursor-pointer relative overflow-hidden pointer-events-auto border ${
                  isSelected
                    ? "border-purple-400 bg-purple-500/15 shadow-[0_0_30px_rgba(139,92,246,0.3)] scale-[1.02]"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="panel-reflection pointer-events-none" />

                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-md"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${role.colorHex} 20%, transparent)`,
                        borderColor: `color-mix(in srgb, ${role.colorHex} 45%, transparent)`,
                        color: role.colorHex,
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span 
                      className="text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded-full border"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${role.colorHex} 12%, transparent)`,
                        borderColor: `color-mix(in srgb, ${role.colorHex} 30%, transparent)`,
                        color: role.colorHex,
                      }}
                    >
                      {role.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">{role.title}</h3>
                    <p className="text-[11px] font-mono text-muted mt-0.5">{role.subtitle}</p>
                  </div>

                  <p className="text-xs text-muted leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
                  <Link
                    href={role.route}
                    className="w-full py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 shadow-md"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${role.colorHex} 25%, transparent)`,
                      borderColor: `color-mix(in srgb, ${role.colorHex} 50%, transparent)`,
                      color: "#ffffff",
                    }}
                  >
                    <span>Launch {role.title.split(" ")[0]} View</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}
