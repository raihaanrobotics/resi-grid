// hooks/useUserLocation.ts

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useUserLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const hasLockedLocation = useRef(false);

  const requestPosition = useCallback((forceFresh = false) => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
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

      // Lock in location after initial fix so it doesn't continuously jump around unless forced
      if (!forceFresh) {
        hasLockedLocation.current = true;
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(err.message);
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
