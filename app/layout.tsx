"use client";
import "./globals.css";
import NavigationDock from "@/components/shared/NavigationDock";
import AppRuntime from "@/components/shared/AppRuntime";
import JudgeRoleDock from "@/components/shared/JudgeRoleDock";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-white bg-neutral-950 min-h-screen selection:bg-teal-500/30 selection:text-teal-200">
        <AppRuntime>
          {children}
          <NavigationDock />
        </AppRuntime>
        {/* Global Floating Judge Role Switcher Dock */}
        <JudgeRoleDock />
      </body>
    </html>
  );
}
