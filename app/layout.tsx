import "./globals.css";
import NavigationDock from "@/components/shared/NavigationDock";
import { GeoProvider } from "@/context/GeoContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-white bg-black">
        <GeoProvider>
          {children}
          <NavigationDock />
        </GeoProvider>
      </body>
    </html>
  );
}
