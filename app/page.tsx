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
  Route,
  ShoppingBag,
  Store,
  UserRound,
  Zap,
} from "lucide-react";

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
    title: "Roads & traffic",
    description: "Check safe routes & road blocks",
    href: "/routepulse",
    icon: Route,
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

export default function HomePage() {
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const hour = new Date().getHours();
    let timeOfDayGreeting = "Good morning";

    if (hour >= 12 && hour < 18) {
      timeOfDayGreeting = "Good afternoon";
    } else if (hour >= 18 || hour < 5) {
      timeOfDayGreeting = "Good evening";
    }

    const savedName = localStorage.getItem("resigrid-user-name") || "Sipho";
    setGreeting(`${timeOfDayGreeting}, ${savedName}`);
  }, []);

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
            <div className="brand-icon">
              <Activity className="h-[18px] w-[18px]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-[0.2em] sm:text-sm">
                  RESIGRID
                </span>
              </div>

              <p className="mt-0.5 hidden text-[9px] tracking-[0.15em] text-muted sm:block">
                YOUR LOCAL NEIGHBORHOOD HUB
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="glass-icon-button"
            >
              <Bell className="h-[17px] w-[17px]" />
            </button>
          </div>
        </header>

        {/* DASHBOARD */}
        <div className="w-full space-y-5 sm:space-y-6">
          {/* RADAR */}
          <section className="glass-panel radar-panel relative overflow-hidden p-4 sm:p-6 lg:p-7">
            <div className="panel-reflection" />
            <div className="panel-bottom-glow radar-glow" />

            <div className="relative z-10">
              <div className="mb-5 max-w-2xl sm:mb-7">
                {greeting && (
                  <h2 className="mb-2 text-2xl font-bold tracking-[-0.03em] text-accent sm:text-3xl lg:text-4xl">
                    {greeting}
                  </h2>
                )}

                <h3 className="text-base font-medium tracking-[-0.02em] opacity-90 sm:text-lg lg:text-xl">
                  All systems running smoothly
                </h3>

                <p className="mt-2 max-w-xl text-xs leading-5 text-muted sm:text-sm sm:leading-6">
                  Water, power, and roads are looking good in your area today.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <StatusItem
                  icon={Droplets}
                  label="Water"
                  status="Normal"
                  color="water"
                />

                <StatusItem
                  icon={Zap}
                  label="Energy"
                  status="Normal"
                  color="energy"
                />

                <StatusItem
                  icon={Route}
                  label="Routes"
                  status="Clear"
                  color="transport"
                />
              </div>

              <Link
                href="/radar"
                className="glass-action mt-3 flex items-center justify-between px-4 py-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="h-4 w-4 text-accent" />

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

      <p className="mt-0.5 text-[11px] font-medium opacity-80">{status}</p>
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
    <div className="mini-metric">
      <p className="text-[9px] uppercase tracking-[0.08em] text-muted">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
