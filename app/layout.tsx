"use client";

import "./globals.css";
import NavigationDock from "@/components/shared/NavigationDock";
import AppRuntime from "@/components/shared/AppRuntime";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNavigationDock = pathname?.startsWith("/dashboard") || pathname?.startsWith("/crew");

  return (
    <html lang="en">
      <body className="antialiased text-white bg-black">
        <AppRuntime>
          {children}
          {!hideNavigationDock && <NavigationDock />}
        </AppRuntime>
      </body>
    </html>
  );
}
