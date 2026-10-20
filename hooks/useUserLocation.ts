// hooks/useUserLocation.ts

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const LOCATION_CACHE_KEY = "resigrid_last_known_location";

function getCachedLocation(): GeoLocation | null {
  try {
    const stored = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!stored) return null;

    const location: unknown = JSON.parse(stored);
    if (
      typeof location !== "object" ||
      location === null ||
      !("latitude" in location) ||
      !("longitude" in location) ||
      !("accuracy" in location) ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number" ||
      typeof location.accuracy !== "number" ||
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude)
    ) {
      return null;
    }
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    };
  } catch (error) {
    console.error("Could not read the saved device location:", error);
    return null;
  }
}

export function useUserLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const hasLockedLocation = useRef(false);

  const requestPosition = useCallback((forceFresh = false) => {
    if (Capacitor.isNativePlatform()) {
      void Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: forceFresh ? 0 : Infinity,
      }).then((position) => {
        const newLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLocation(newLoc);
        setLoading(false);
        try {
          localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(newLoc));
        } catch (cacheError) {
          console.error("Could not save the device location for offline use:", cacheError);
        }
        if (!forceFresh) hasLockedLocation.current = true;
      }).catch((nativeError: unknown) => {
        console.error("Could not read the phone location:", nativeError);
        setError(nativeError instanceof Error ? nativeError.message : "Location access is unavailable.");
        setLocation(getCachedLocation());
        setLoading(false);
      });
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLocation(getCachedLocation());
      setLoading(false);
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const newLoc = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setLocation(newLoc);
      setLoading(false);
      try {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(newLoc));
      } catch (cacheError) {
        console.error("Could not save the device location for offline use:", cacheError);
      }

      // Lock in location after initial fix so it doesn't continuously jump around unless forced
      if (!forceFresh) {
        hasLockedLocation.current = true;
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(err.message);
      setLocation(getCachedLocation());
      setLoading(false);
    };

    // High precision GPS hardware fetch with zero cache age
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: forceFresh ? 0 : Infinity,
    });
  }, []);

  useEffect(() => {
    if (!hasLockedLocation.current) {
      requestPosition(false);
    }
  }, [requestPosition]);

  return { location, error, loading, refreshLocation: () => requestPosition(true) };
}
