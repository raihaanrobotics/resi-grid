// hooks/useUserLocation.ts

"use client";

import { useState, useEffect } from "react";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useUserLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setLoading(false);
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(err.message);
      setLoading(false);
    };

    // Initial position fetch with high hardware GPS precision settings
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });

    // Subscribe to live GPS movement updates with zero cache age
    const watcher = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { location, error, loading };
}
