"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

import { useUserLocation, GeoLocation } from "@/hooks/useUserLocation";

import { filterWithinRadius } from "@/lib/geoUtils";


interface GeoContextType {
  location: GeoLocation | null;
  streetAddress: string;
  loading: boolean;
  error: string | null;
  refreshLocation: () => void;
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
  refreshLocation: () => {},
  filterByRadius: () => [],
});


export function GeoProvider({ children }: { children: React.ReactNode }) {
  const { location, loading, error } = useUserLocation();
  const [streetAddress, setStreetAddress] = useState("Locating street...");
  const [manualTrigger, setManualTrigger] = useState(0);
  const hasFetchedOnce = useRef(false);

  const performReverseGeocoding = (lat: number, lon: number) => {
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
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
              `${lat.toFixed(5)}, ${lon.toFixed(5)}`
          );
        }
      })
      .catch(() => {
        setStreetAddress(
          `${lat.toFixed(5)}, ${lon.toFixed(5)}`
        );
      });
  };

  // Industrial-Grade Geolocation Handler: Fetches real-time location on initial load and locks in, preventing background loops unless manually triggered.
  useEffect(() => {
    if (location?.latitude && location?.longitude && (!hasFetchedOnce.current || manualTrigger > 0)) {
      hasFetchedOnce.current = true;
      performReverseGeocoding(location.latitude, location.longitude);
    }
  }, [location, manualTrigger]);

  const refreshLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          performReverseGeocoding(lat, lon);
        },
        () => {
          if (location?.latitude && location?.longitude) {
            performReverseGeocoding(location.latitude, location.longitude);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    setManualTrigger((prev) => prev + 1);
  };

  const filterByRadius = <T extends { latitude: number; longitude: number }>(
    items: T[],
    radiusKm = 5.0
  ) => {
    if (!location) return [];
    return filterWithinRadius(location.latitude, location.longitude, items, radiusKm);
  };

  return (
    <GeoContext.Provider
      value={{ location, streetAddress, loading: !hasFetchedOnce.current && loading, error, refreshLocation, filterByRadius }}
    >
      {children}
    </GeoContext.Provider>
  );
}


export const useGeo = () => useContext(GeoContext);
