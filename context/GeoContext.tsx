"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useUserLocation, GeoLocation } from "@/hooks/useUserLocation";
import { filterWithinRadius } from "@/lib/geoUtils";

interface GeoContextType {
  location: GeoLocation | null;
  streetAddress: string;
  loading: boolean;
  error: string | null;
  filterByRadius: <T extends { latitude: number; longitude: number }>(
    items: T[],
    radiusKm?: number
  ) => (T & { distanceKm: number })[];
}

const GeoContext = createContext<GeoContextType>({
  location: null,
  streetAddress: "Locating street...",
  loading: true,
  error: null,
  filterByRadius: () => [],
});

export function GeoProvider({ children }: { children: React.ReactNode }) {
  const { location, loading, error } = useUserLocation();
  const [streetAddress, setStreetAddress] = useState("Locating street...");

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.address) {
            const num =
              data.address.house_number ||
              data.address.building ||
              data.address.house_name ||
              "";
            const road = data.address.road || data.address.pedestrian || "";
            const suburb =
              data.address.suburb ||
              data.address.neighbourhood ||
              data.address.city ||
              "";

            const streetLine = [num, road].filter(Boolean).join(" ");
            const formatted = [streetLine, suburb].filter(Boolean).join(", ");

            setStreetAddress(
              formatted ||
                `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
            );
          }
        })
        .catch(() => {
          setStreetAddress(
            `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
          );
        });
    }
  }, [location]);

  const filterByRadius = <T extends { latitude: number; longitude: number }>(
    items: T[],
    radiusKm = 5.0
  ) => {
    if (!location) return [];
    return filterWithinRadius(location.latitude, location.longitude, items, radiusKm);
  };

  return (
    <GeoContext.Provider
      value={{ location, streetAddress, loading, error, filterByRadius }}
    >
      {children}
    </GeoContext.Provider>
  );
}

export const useGeo = () => useContext(GeoContext);
