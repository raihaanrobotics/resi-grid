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
  Droplets, 
  Zap, 
  Navigation as NavIcon, 
  Shield 
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
];

const subFeatures = [
  { label: "Water", href: "/hydromesh", icon: Droplets },
  { label: "Power", href: "/voltshield", icon: Zap },
  { label: "Routes", href: "/routepulse", icon: NavIcon },
  { label: "Spaza", href: "/spazarescue", icon: Shield },
];

export default function NavigationDock() {
  const pathname = usePathname();

  const isFeatureActive = featureRoutes.some((route) => pathname.startsWith(route));
  const [subDockOpen, setSubDockOpen] = useState(false);

  // Automatically open sub-dock when navigating to any feature page, close when leaving
  useEffect(() => {
    if (isFeatureActive) {
      setSubDockOpen(true);
    } else {
      setSubDockOpen(false);
    }
  }, [isFeatureActive]);

  const handleCloseSubDock = () => {
    setSubDockOpen(false);
  };

  return (
    <nav className="floating-dock">
      <div className="floating-dock-inner overflow-x-auto no-scrollbar">
        {subDockOpen ? (
          <div className="flex items-center justify-between gap-1.5 w-full px-1">
            {/* Back Arrow Button (Only Arrow, Restores Default Dock) */}
            <button
              type="button"
              onClick={handleCloseSubDock}
              className="dock-item shrink-0 text-white hover:opacity-80 transition-opacity cursor-pointer touch-manipulation p-2"
              title="Close sub-dock"
              aria-label="Back to main navigation"
            >
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>

            {/* Vertical Line Divider */}
            <div className="h-4 w-[1px] bg-white/20 mx-0.5 shrink-0" />

            {/* Sub-Feature Items */}
            <div className="flex items-center justify-around gap-1 w-full overflow-x-auto no-scrollbar">
              {subFeatures.map((sub) => {
                const SubIcon = sub.icon;
                const subActive = pathname.startsWith(sub.href);
                return (
                  <Link
                    key={sub.label}
                    href={sub.href}
                    className={`dock-item shrink-0 ${subActive ? "dock-active" : ""}`}
                  >
                    <SubIcon className="h-[16px] w-[16px]" strokeWidth={1.8} />
                    <span>{sub.label}</span>
                  </Link>
                );
              })}
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
                onClick={() => {
                  if (item.label === "Features") {
                    setSubDockOpen(true);
                  }
                }}
                className={`dock-item ${active ? "dock-active" : ""}`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })
        )}
      </div>
    </nav>
  );
}
