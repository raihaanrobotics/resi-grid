"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Droplets,
  Landmark,
  Network,
  Radio,
  Route,
  ShieldCheck,
  ShoppingBag,
  Store,
  Zap,
} from "lucide-react";

const allFeatures = [
  {
    title: "HydroMesh",
    subtitle: "Water & Acoustic Telemetry",
    description: "Real-time water pressure monitoring, acoustic tap diagnostics, dry-pipe cavitation detection, and P2P community tank sharing.",
    href: "/hydromesh",
    icon: Droplets,
    color: "water",
    badge: "PILLAR 3",
    status: "Active Telemetry",
  },
  {
    title: "VoltShield™",
    subtitle: "Power Grid Resilience",
    description: "Grid load shedding tracker, solar battery inverter telemetry, neighborhood power sharing, and micro-grid outage alerts.",
    href: "/voltshield",
    icon: Zap,
    color: "energy",
    badge: "PILLAR 1",
    status: "Grid Online",
  },
  {
    title: "SpazaRescue™",
    subtitle: "Local Shop & Supply Exchange",
    description: "Locate neighborhood spaza shops, track essential stock availability, fresh produce drops, and emergency food supplies during grid cuts.",
    href: "/spazarescue",
    icon: Store,
    color: "food",
    badge: "ESSENTIALS",
    status: "42 Local Sellers",
  },
  {
    title: "RoutePulse™",
    subtitle: "Adaptive Transit & Traffic",
    description: "Community-driven transit routing, minibus taxi queue telemetry, traffic bottleneck detours, and road hazard tracking.",
    href: "/routepulse",
    icon: Route,
    color: "transport",
    badge: "TRANSIT MESH",
    status: "128 Vehicles Live",
  },
  {
    title: "Civic AI™",
    subtitle: "Infrastructure & Outage Reports",
    description: "Automated municipal ticket creation, burst water main reporting, pothole tracking, and direct local council issue routing.",
    href: "/civic",
    icon: Landmark,
    color: "civic",
    badge: "CIVIC NETWORK",
    status: "Auto-Dispatch On",
  },
  {
    title: "KasiMesh™",
    subtitle: "P2P Off-Grid Wi-Fi Mesh",
    description: "Decentralized township Wi-Fi mesh, off-grid communication, solar micro-nodes, and encrypted zero-cost peer bandwidth sharing.",
    href: "/kasi-mesh",
    icon: Network,
    color: "mesh",
    badge: "DECENTRALIZED",
    status: "64 Nodes Active",
  },
  {
    title: "Community Radar™",
    subtitle: "Geospatial Hazard Scope",
    description: "Live real-time geospatial intelligence sweep mapping infrastructure failures, active load shedding, water leaks, and road hazards.",
    href: "/radar",
    icon: Radio,
    color: "energy",
    badge: "GEOSPATIAL",
    status: "Sweep Active",
  },
  {
    title: "ResiMarket™",
    subtitle: "P2P Energy & Hardware Trade",
    description: "Peer-to-peer solar energy tariff exchange, local inverter/battery sales, and neighborhood service escrow settlement.",
    href: "/marketplace",
    icon: ShoppingBag,
    color: "food",
    badge: "P2P MARKET",
    status: "Settlement Live",
  },
];

export default function FeaturesPage() {
  return (
    <main className="resigrid-shell min-h-screen w-full overflow-x-hidden text-[var(--text)] selection:bg-purple-500/30 selection:text-purple-200">
      {/* Dynamic Ambient Blur Background Orbs */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-orb orb-one" />
        <div className="ambient-orb orb-two" />
        <div className="ambient-orb orb-three" />
        <div className="ambient-orb orb-four" />
        <div className="ambient-grid" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1920px] space-y-6 px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">
        
        {/* PAGE HEADER */}
        <header className="glass-header flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="feature-icon feature-civic">
              <Activity className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-[0.2em] text-white">
                  RESIGRID SUITE
                </h1>
                <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[8px] font-medium tracking-[0.15em] text-purple-400">
                  8 RESILIENCE MODULES
                </span>
              </div>
              <p className="mt-0.5 text-[9px] tracking-[0.15em] text-muted">
                DECENTRALIZED COMMUNITY INFRASTRUCTURE & MESH TELEMETRY
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="status-pill border-purple-500/20 bg-purple-500/10 text-purple-400">
              <span className="status-dot bg-purple-400 shadow-[0_0_14px_#c084fc]" />
              ALL SYSTEMS OPERATIONAL
            </div>
          </div>
        </header>

        {/* HERO BANNER */}
        <section className="glass-panel relative overflow-hidden p-6 sm:p-8">
          <div className="panel-reflection" />
          <div className="panel-bottom-glow bg-purple-500 opacity-15" />

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span className="eyebrow text-purple-400">NEIGHBORHOOD RESILIENCE HUB</span>
            </div>
            <h2 className="text-2xl font-medium tracking-[-0.03em] text-white sm:text-3xl">
              Explore Community Infrastructure Modules
            </h2>
            <p className="mt-2 text-xs text-muted leading-relaxed sm:text-sm">
              Access real-time telemetry, peer-to-peer resource sharing, municipal outage reporting, and off-grid communication networks designed for local township resilience.
            </p>
          </div>
        </section>

        {/* BENTO GRID OF ALL FEATURES */}
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-muted">
              SYSTEM MODULES & APPS
            </h3>
            <span className="text-[10px] font-mono text-muted">08 ACTIVE MODULES</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className={`glass-panel group relative flex flex-col justify-between p-6 transition-all duration-300 hover:border-purple-500/40 hover:scale-[1.01] border-white/10`}
                >
                  <div className="panel-reflection" />

                  <div>
                    {/* Header Tag & Icon */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`feature-icon feature-${feature.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-mono font-semibold tracking-wider text-muted">
                        {feature.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-[11px] font-medium text-purple-400/80 mt-0.5">
                      {feature.subtitle}
                    </p>
                    <p className="mt-2 text-xs text-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {feature.status}
                    </span>
                    <span className="text-xs font-medium text-white group-hover:text-purple-300 flex items-center gap-1 transition-colors">
                      Open App <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
