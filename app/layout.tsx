"use client";

import "./globals.css";
import NavigationDock from "@/components/shared/NavigationDock";
import AppRuntime from "@/components/shared/AppRuntime";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-white bg-black">
        <AppRuntime>
          {children}
          <NavigationDock />
        </AppRuntime>
      </body>
    </html>
  );
}
