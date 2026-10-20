// lib/geoUtils.ts

/**
 * Calculates high-precision distance between two GPS points in kilometers using the Haversine formula
 */
export function getDistanceInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in KM
}

/**
 * Formats precise distances into human-readable street proximity (meters vs kilometers)
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1.0) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(2)} km away`;
}

/**
 * Filters items/users/incidents within a specified radius with sub-meter distance precision
 */
export function filterWithinRadius<T extends { latitude: number; longitude: number }>(
  userLat: number,
  userLng: number,
  items: T[],
  radiusKm = 10.0
): (T & { distanceKm: number; formattedDistance: string })[] {
  if (
    !Number.isFinite(userLat) ||
    !Number.isFinite(userLng) ||
    Math.abs(userLat) > 90 ||
    Math.abs(userLng) > 180 ||
    !Number.isFinite(radiusKm) ||
    radiusKm < 0
  ) {
    return [];
  }

  return items
    .filter(
      (item) =>
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude) &&
        Math.abs(item.latitude) <= 90 &&
        Math.abs(item.longitude) <= 180
    )
    .map((item) => ({
      item,
      exactDistanceKm: getDistanceInKm(userLat, userLng, item.latitude, item.longitude),
    }))
    .filter(({ exactDistanceKm }) => exactDistanceKm <= radiusKm)
    .sort((a, b) => a.exactDistanceKm - b.exactDistanceKm)
    .map(({ item, exactDistanceKm }) => {
      const distanceKm = Number(exactDistanceKm.toFixed(3));
      return {
        ...item,
        distanceKm,
        formattedDistance: formatDistance(distanceKm),
      };
    });
}
