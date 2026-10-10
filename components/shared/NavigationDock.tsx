"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radio, ShoppingBag, Network, UserRound } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Radar", href: "/radar", icon: Radio },
  { label: "Market", href: "/marketplace", icon: ShoppingBag },
  { label: "Features", href: "/features", icon: Network },
  { label: "Profile", href: "/profile", icon: UserRound },
];

// Quick access feature routes that trigger the Features tab active state
const featureRoutes = [
  "/features",
  "/kasi-mesh",
  "/hydromesh",
  "/voltshield",
  "/spazarescue",
  "/routepulse",
  "/civic",
];

export default function NavigationDock() {
  const pathname = usePathname();

  return (
    <nav className="floating-dock">
      <div className="floating-dock-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          let active = false;

          if (item.href === "/") {
            active = pathname === "/";
          } else if (item.label === "Features") {
            // Active if on /kasi-mesh OR any quick-access resilience module route
            active = featureRoutes.some((route) => pathname.startsWith(route));
          } else {
            active = pathname.startsWith(item.href);
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`dock-item ${active ? "dock-active" : ""}`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
