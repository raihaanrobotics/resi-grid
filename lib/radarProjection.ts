import { getDistanceInKm } from "@/lib/geoUtils";

export interface RadarPoint {
  x: number;
  y: number;
  distanceKm: number;
}

export function projectToRadar(
  centerLatitude: number,
  centerLongitude: number,
  latitude: number,
  longitude: number,
  radiusKm = 10
): RadarPoint | null {
  const coordinates = [centerLatitude, centerLongitude, latitude, longitude];
  if (
    coordinates.some((coordinate) => !Number.isFinite(coordinate)) ||
    Math.abs(centerLatitude) > 90 ||
    Math.abs(latitude) > 90 ||
    Math.abs(centerLongitude) > 180 ||
    Math.abs(longitude) > 180 ||
    !Number.isFinite(radiusKm) ||
    radiusKm <= 0
  ) {
    return null;
  }

  const distanceKm = getDistanceInKm(centerLatitude, centerLongitude, latitude, longitude);
  if (distanceKm > radiusKm) return null;

  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitude1 = toRadians(centerLatitude);
  const latitude2 = toRadians(latitude);
  const longitudeDelta = toRadians(((longitude - centerLongitude + 540) % 360) - 180);
  const bearing = Math.atan2(
    Math.sin(longitudeDelta) * Math.cos(latitude2),
    Math.cos(latitude1) * Math.sin(latitude2) -
      Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(longitudeDelta)
  );
  
  const radialPercent = (distanceKm / radiusKm) * 42;

  const x = 50 + Math.sin(bearing) * radialPercent;
  const y = 50 - Math.cos(bearing) * radialPercent;

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return {
    x,
    y,
    distanceKm,
  };
}
