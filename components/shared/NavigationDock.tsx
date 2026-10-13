"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Radio, 
  ShoppingBag, 
  Network, 
  UserRound, 
  ArrowLeft, 
  ArrowRight,
  Droplets, 
  Zap, 
  Shield, 
  CloudSun, 
  Landmark 
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Radar", href: "/radar", icon: Radio },
  { label: "Market", href: "/marketplace", icon: ShoppingBag },
  { label: "Features", href: "/features", icon: Network },
  { label: "Profile", href: "/profile", icon: UserRound },
];

const featureRoutes = [
  "/features",
  "/kasi-mesh",
  "/hydromesh",
  "/voltshield",
  "/spazarescue",
  "/routepulse",
  "/civic",
  "/weather",
];

const subFeaturesGroup1 = [
  { label: "Water", href: "/hydromesh", icon: Droplets },
  { label: "Power", href: "/voltshield", icon: Zap },
];

const subFeaturesGroup2 = [
  { label: "Weather", href: "/weather", icon: CloudSun },
  { label: "Report", href: "/civic", icon: Landmark },
];

const subFeaturesGroup3 = [
  { label: "Spaza", href: "/spazarescue", icon: Shield },
];

export default function NavigationDock() {
  const pathname = usePathname();

  const isFeatureActive = featureRoutes.some((route) => pathname.startsWith(route));
  
  // Dock state: "main" | "sub1" (Water/Power) | "sub2" (Weather/Report) | "sub3" (Spaza/Blank)
  const [activeDockView, setActiveDockView] = useState<"main" | "sub1" | "sub2" | "sub3">("main");

  // Automatically switch sub-dock view based on active feature route
  useEffect(() => {
    if (isFeatureActive) {
      if (pathname.startsWith("/weather") || pathname.startsWith("/civic")) {
        setActiveDockView("sub2");
      } else if (pathname.startsWith("/spazarescue")) {
        setActiveDockView("sub3");
      } else {
        setActiveDockView("sub1");
      }
    } else {
      setActiveDockView("main");
    }
  }, [isFeatureActive, pathname]);

  const handleReturnToMain = () => {
    setActiveDockView("main");
  };

  const handleSwitchToGroup1 = () => {
    setActiveDockView("sub1");
  };

  const handleSwitchToGroup2 = () => {
    setActiveDockView("sub2");
  };

  const handleSwitchToGroup3 = () => {
    setActiveDockView("sub3");
  };

  return (
    <nav className="floating-dock w-[92%] max-w-md mx-auto">
      <div className="floating-dock-inner overflow-x-auto no-scrollbar px-1 sm:px-2 py-1.5 flex items-center justify-between">
        {activeDockView === "sub1" ? (
          <div className="flex items-center justify-between gap-1 w-full">
            {/* Left Arrow: Returns to Main Navigation */}
            <button
              type="button"
              onClick={handleReturnToMain}
              className="dock-item shrink-0 text-white hover:opacity-80 transition-opacity cursor-pointer touch-manipulation p-1.5 sm:p-2"
              title="Back to main navigation"
              aria-label="Back to main navigation"
            >
              <ArrowLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.8} />
            </button>

            {/* Vertical Line Divider */}
            <div className="h-4 w-[1px] bg-white/20 mx-0.5 shrink-0" />

            {/* Sub-Feature Items Group 1 (Water & Power) */}
            <div className="flex items-center justify-around gap-1 sm:gap-2 w-full overflow-x-auto no-scrollbar">
              {subFeaturesGroup1.map((sub) => {
                const SubIcon = sub.icon;
                const subActive = pathname.startsWith(sub.href);
                return (
                  <Link
                    key={sub.label}
                    href={sub.href}
                    className={`dock-item shrink-0 px-3 py-1 text-[11px] sm:text-xs flex items-center gap-1.5 ${subActive ? "dock-active" : ""}`}
                  >
                    <SubIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" strokeWidth={1.8} />
                    <span className="truncate">{sub.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Vertical Line Divider */}
            <div className="h-4 w-[1px] bg-white/20 mx-0.5 shrink-0" />

            {/* Right Arrow: Switches to Sub-Feature Group 2 (Weather & Report) */}
            <button
              type="button"
              onClick={handleSwitchToGroup2}
              className="dock-item shrink-0 text-white hover:opacity-80 transition-opacity cursor-pointer touch-manipulation p-1.5 sm:p-2"
              title="Next sub-dock"
              aria-label="Switch to Weather and Report"
            >
              <ArrowRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        ) : activeDockView === "sub2" ? (
          <div className="flex items-center justify-between gap-1 w-full">
            {/* Left Arrow: Switches back to Sub-Feature Group 1 */}
            <button
              type="button"
              onClick={handleSwitchToGroup1}
              className="dock-item shrink-0 text-white hover:opacity-80 transition-opacity cursor-pointer touch-manipulation p-1.5 sm:p-2"
              title="Previous sub-dock"
              aria-label="Switch to Water and Power"
            >
              <ArrowLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.8} />
            </button>

            {/* Vertical Line Divider */}
            <div className="h-4 w-[1px] bg-white/20 mx-0.5 shrink-0" />

            {/* Sub-Feature Items Group 2 (Weather & Report) */}
            <div className="flex items-center justify-around gap-1 sm:gap-2 w-full overflow-x-auto no-scrollbar">
              {subFeaturesGroup2.map((sub) => {
                const SubIcon = sub.icon;
                const subActive = pathname.startsWith(sub.href);
                return (
                  <Link
                    key={sub.label}
                    href={sub.href}
                    className={`dock-item shrink-0 px-3 py-1 text-[11px] sm:text-xs flex items-center gap-1.5 ${subActive ? "dock-active" : ""}`}
                  >
                    <SubIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" strokeWidth={1.8} />
                    <span className="truncate">{sub.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Vertical Line Divider */}
            <div className="h-4 w-[1px] bg-white/20 mx-0.5 shrink-0" />

            {/* Right Arrow: Switches to Sub-Feature Group 3 (Spaza & Blank Slot) */}
            <button
              type="button"
              onClick={handleSwitchToGroup3}
              className="dock-item shrink-0 text-white hover:opacity-80 transition-opacity cursor-pointer touch-manipulation p-1.5 sm:p-2"
              title="Next sub-dock"
              aria-label="Switch to Spaza"
            >
              <ArrowRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        ) : activeDockView === "sub3" ? (
          <div className="flex items-center justify-between gap-1 w-full">
            {/* Left Arrow: Switches back to Sub-Feature Group 2 */}
            <button
              type="button"
              onClick={handleSwitchToGroup2}
              className="dock-item shrink-0 text-white hover:opacity-80 transition-opacity cursor-pointer touch-manipulation p-1.5 sm:p-2"
              title="Previous sub-dock"
              aria-label="Switch to Weather and Report"
            >
              <ArrowLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.8} />
            </button>

            {/* Vertical Line Divider */}
            <div className="h-4 w-[1px] bg-white/20 mx-0.5 shrink-0" />

            {/* Sub-Feature Items Group 3 (Spaza + Completely Blank Reserved Slot) */}
            <div className="flex items-center justify-around gap-1 sm:gap-2 w-full overflow-x-auto no-scrollbar">
              {subFeaturesGroup3.map((sub) => {
                const SubIcon = sub.icon;
                const subActive = pathname.startsWith(sub.href);
                return (
                  <Link
                    key={sub.label}
                    href={sub.href}
                    className={`dock-item shrink-0 px-3 py-1 text-[11px] sm:text-xs flex items-center gap-1.5 ${subActive ? "dock-active" : ""}`}
                  >
                    <SubIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" strokeWidth={1.8} />
                    <span className="truncate">{sub.label}</span>
                  </Link>
                );
              })}

              {/* Clean Blank Slot */}
              <div className="dock-item shrink-0 px-3 py-1 h-7 w-20 pointer-events-none opacity-0" aria-hidden="true" />
            </div>
          </div>
        ) : (
          navItems.map((item) => {
            const Icon = item.icon;
            let active = false;

            if (item.href === "/") {
              active = pathname === "/";
            } else if (item.label === "Features") {
              active = isFeatureActive;
            } else {
              active = pathname.startsWith(item.href);
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (item.label === "Features") {
                    e.preventDefault();
                    setActiveDockView("sub1");
                  }
                }}
                className={`dock-item shrink-0 px-2 sm:px-3 py-1 text-[10px] sm:text-xs flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 ${active ? "dock-active" : ""}`}
              >
                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0" strokeWidth={1.8} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })
        )}
      </div>
    </nav>
  );
}
