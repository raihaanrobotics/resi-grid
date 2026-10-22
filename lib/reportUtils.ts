export type ReportStatus =
  | "Pending Review"
  | "Crew Dispatched"
  | "On Site"
  | "In Progress"
  | "Resolved";

export function isCrewAssigned(assignedDepot?: string | null): boolean {
  const depot = assignedDepot?.trim();
  return Boolean(depot && !/^(depot rapid response queue|unassigned|pending review)$/i.test(depot));
}

export function normalizeReportStatus(
  status?: string | null,
  assignedDepot?: string | null
): ReportStatus {
  if (status === "Auto-Dispatched") {
    return isCrewAssigned(assignedDepot) ? "Crew Dispatched" : "Pending Review";
  }

  if (
    status === "Pending Review" ||
    status === "Crew Dispatched" ||
    status === "On Site" ||
    status === "In Progress" ||
    status === "Resolved"
  ) {
    return status;
  }

  return "Pending Review";
}

export function getReportDisplayId(
  reportId?: string | null,
  databaseId?: number | string | null
): string {
  const numericReportId = reportId?.match(/^RPT-(\d+)$/);
  if (numericReportId) {
    return `RPT-${numericReportId[1].replace(/^0+(?=\d)/, "")}`;
  }
  if (databaseId !== null && databaseId !== undefined) return `RPT-${databaseId}`;
  return reportId || "RPT";
}

export function formatReportTimestamp(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

export function hasEstimatedFixTime(value?: string | null): boolean {
  return Boolean(value?.trim() && value.trim().toLowerCase() !== "pending triage");
}

export function distanceBetweenCoordinatesMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(latitudeB - latitudeA);
  const longitudeDelta = radians(longitudeB - longitudeA);
  const haversine = Math.min(1, Math.max(0,
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(latitudeA)) *
      Math.cos(radians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2
  ));

  return 6_371_000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export interface NearbyReportCandidate {
  id?: number | string | null;
  report_id: string;
  category: string | null;
  title: string | null;
  description: string | null;
  location_address: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  impact_count?: number | null;
}

interface ProximityReport {
  category?: string;
  status: string;
  impactCount?: number;
  createdTimestamp?: number;
  assignedDepotUnit?: string;
  separateIncident?: boolean;
  latitude?: number;
  longitude?: number;
  coords?: { lat: number; lng: number };
}

export function mergeNearbyActiveReports<T extends ProximityReport>(
  reports: T[],
  radiusMeters = 50
): T[] {
  const merged: T[] = [];

  for (const report of reports) {
    const reportCoordinates = Object.prototype.hasOwnProperty.call(report, "coords")
      ? report.coords
      : { lat: report.latitude, lng: report.longitude };
    const reportLatitude = reportCoordinates?.lat;
    const reportLongitude = reportCoordinates?.lng;
    const isActive = !["resolved", "closed", "fixed"].includes(report.status.toLowerCase());
    const matchIndex =
      isActive &&
      !report.separateIncident &&
      typeof reportLatitude === "number" &&
      Number.isFinite(reportLatitude) &&
      typeof reportLongitude === "number" &&
      Number.isFinite(reportLongitude)
      ? merged.findIndex((existing) => {
          const existingCoordinates = Object.prototype.hasOwnProperty.call(existing, "coords")
            ? existing.coords
            : { lat: existing.latitude, lng: existing.longitude };
          const existingLatitude = existingCoordinates?.lat;
          const existingLongitude = existingCoordinates?.lng;
          return (
            !["resolved", "closed", "fixed"].includes(existing.status.toLowerCase()) &&
            !existing.separateIncident &&
            report.category !== undefined &&
            existing.category === report.category &&
            typeof existingLatitude === "number" &&
            Number.isFinite(existingLatitude) &&
            typeof existingLongitude === "number" &&
            Number.isFinite(existingLongitude) &&
            distanceBetweenCoordinatesMeters(
              reportLatitude,
              reportLongitude,
              existingLatitude,
              existingLongitude
            ) <= radiusMeters
          );
        })
      : -1;

    if (matchIndex === -1) {
      merged.push(report);
      continue;
    }

    const existing = merged[matchIndex];
    const combinedImpactCount = (existing.impactCount || 1) + (report.impactCount || 1);
    const reportScore =
      (isCrewAssigned(report.assignedDepotUnit) ? 2 : 0) +
      (report.status === "In Progress" ? 2 : report.status === "On Site" ? 1 : 0);
    const existingScore =
      (isCrewAssigned(existing.assignedDepotUnit) ? 2 : 0) +
      (existing.status === "In Progress" ? 2 : existing.status === "On Site" ? 1 : 0);
    merged[matchIndex] = {
      ...(reportScore > existingScore ? report : existing),
      impactCount: combinedImpactCount,
    };
  }

  return merged.sort((first, second) =>
    (second.createdTimestamp ?? 0) - (first.createdTimestamp ?? 0)
  );
}

export function findNearbyActiveReport(
  reports: NearbyReportCandidate[],
  category: string,
  latitude: number,
  longitude: number,
  radiusMeters = 50
): NearbyReportCandidate | undefined {
  return reports
    .filter((report) => {
      const reportLatitude = report.latitude === null ? Number.NaN : Number(report.latitude);
      const reportLongitude = report.longitude === null ? Number.NaN : Number(report.longitude);
      if (
        report.category !== category ||
        !Number.isFinite(reportLatitude) ||
        !Number.isFinite(reportLongitude) ||
        ["resolved", "closed", "fixed"].includes((report.status || "").toLowerCase())
      ) {
        return false;
      }

      return distanceBetweenCoordinatesMeters(
        latitude,
        longitude,
        reportLatitude,
        reportLongitude
      ) <= radiusMeters;
    })
    .sort((first, second) => {
      const firstDistance = distanceBetweenCoordinatesMeters(
        latitude,
        longitude,
        Number(first.latitude),
        Number(first.longitude)
      );
      const secondDistance = distanceBetweenCoordinatesMeters(
        latitude,
        longitude,
        Number(second.latitude),
        Number(second.longitude)
      );
      return firstDistance - secondDistance;
    })[0];
}
