export interface ResiGridNotification {
  id: string;
  dedupeKey?: string;
  title: string;
  description: string;
  time: string;
  type: "warning" | "success" | "info" | "error";
  category?: string;
  read?: boolean;
  dismissed?: boolean;
  status?: "active" | "resolved";
  timestamp: number;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

export interface ReportNotificationInput {
  category?: string | null;
  title?: string | null;
  location_address?: string | null;
  province?: string | null;
  municipality?: string | null;
  ward?: string | null;
  status?: string | null;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

export function getReportNotificationIdentity(report: ReportNotificationInput) {
  const rawCategory = (report.category || "").trim().toLowerCase();
  const normalizedCategory =
    rawCategory === "other"
      ? "other"
      : rawCategory === "water" || rawCategory === "power"
        ? rawCategory
        : null;
  if (!normalizedCategory) return null;

  const province = (report.province || "").trim();
  const municipality = (report.municipality || "").trim();
  const ward = (report.ward || "").trim();
  const location = (report.location_address || "").trim();
  const area = ward && ward.toLowerCase() !== "all"
    ? ward
    : location || municipality || province || "Nearby";
  const areaKey = [province, municipality, area].filter(Boolean).join("|").toLowerCase();
  return {
    category: normalizedCategory === "other" ? "civic" : normalizedCategory,
    area,
    dedupeKey: `report:${normalizedCategory}:${areaKey}`,
  } as const;
}

const STORAGE_KEY = "resigrid_global_notifications";

function isNotificationType(value: unknown): value is ResiGridNotification["type"] {
  return value === "warning" || value === "success" || value === "info" || value === "error";
}

function readStoredNotifications(): ResiGridNotification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error("Notification storage must contain an array.");
    }

    return parsed.flatMap((notification): ResiGridNotification[] => {
      if (
        notification === null ||
        typeof notification !== "object" ||
        typeof notification.id !== "string" ||
        typeof notification.title !== "string" ||
        typeof notification.description !== "string"
      ) {
        return [];
      }

      const legacy = notification as Partial<ResiGridNotification>;
      const timestamp = typeof legacy.timestamp === "number" ? legacy.timestamp : Date.now();
      return [{
        id: legacy.id as string,
        dedupeKey: legacy.dedupeKey || `legacy:${legacy.id}`,
        title: legacy.title as string,
        description: legacy.description as string,
        time: typeof legacy.time === "string" ? legacy.time : "Just now",
        type: isNotificationType(legacy.type) ? legacy.type : "info",
        category: legacy.category,
        read: legacy.read,
        dismissed: legacy.dismissed,
        status: legacy.status,
        timestamp,
        latitude: legacy.latitude,
        longitude: legacy.longitude,
        distanceKm: legacy.distanceKm,
      }];
    });
  } catch (error) {
    console.error("Error reading global notifications:", error);
    return [];
  }
}

export function getGlobalNotifications(): ResiGridNotification[] {
  return readStoredNotifications();
}

export function saveGlobalNotifications(notifications: ResiGridNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error("Error saving global notifications:", error);
  }
}

export async function dispatchReportScreenNotification(reportId: string) {
  try {
    const response = await fetch("/api/push/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
    });
    if (!response.ok) {
      throw new Error(`Push dispatch failed (${response.status}): ${await response.text()}`);
    }
  } catch (error) {
    console.error("Could not send report screen notification:", error);
  }
}

export function upsertGlobalNotification(
  notification: Omit<ResiGridNotification, "id" | "time" | "read" | "dismissed" | "timestamp"> & {
    dedupeKey: string;
  }
) {
  const notifications = readStoredNotifications();
  const existing = notifications.find((item) => item.dedupeKey === notification.dedupeKey);

  if (
    existing &&
    existing.title === notification.title &&
    existing.description === notification.description &&
    existing.type === notification.type &&
    existing.status === notification.status &&
    existing.latitude === notification.latitude &&
    existing.longitude === notification.longitude
  ) {
    return;
  }

  const now = Date.now();
  const updated: ResiGridNotification = {
    ...existing,
    ...notification,
    id: existing?.id ?? notification.dedupeKey,
    time: "Just now",
    read: false,
    dismissed: false,
    timestamp: now,
    latitude: notification.latitude,
    longitude: notification.longitude,
    distanceKm: notification.distanceKm,
  };

  saveGlobalNotifications([
    updated,
    ...notifications.filter((item) => item.dedupeKey !== notification.dedupeKey),
  ]);

  if (typeof window !== "undefined" && !notification.dedupeKey.startsWith("report:")) {
    void dispatchNotification(updated);
  }
}

async function dispatchNotification(notification: ResiGridNotification) {
  try {
    const response = await fetch("/api/push/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notification),
    });
    if (!response.ok) {
      throw new Error(`Push dispatch failed (${response.status}): ${await response.text()}`);
    }
  } catch (error) {
    console.error("Could not send screen notification:", error);
  }
}

export function syncReportNotifications(reports: readonly ReportNotificationInput[]) {
  const groups = new Map<
    string,
    {
      category: "water" | "power" | "civic";
      area: string;
      activeCount: number;
      resolvedCount: number;
      latitude?: number;
      longitude?: number;
      distanceKm?: number;
    }
  >();

  reports.forEach((report) => {
    const identity = getReportNotificationIdentity(report);
    if (!identity) return;
    const { category, area, dedupeKey } = identity;
    const group = groups.get(dedupeKey) ?? {
      category,
      area,
      activeCount: 0,
      resolvedCount: 0,
    };
    const status = (report.status || "").trim().toLowerCase();

    if (status === "resolved" || status === "closed" || status === "fixed") {
      group.resolvedCount += 1;
    } else {
      group.activeCount += 1;
    }
    if (
      typeof report.latitude === "number" &&
      typeof report.longitude === "number" &&
      Number.isFinite(report.latitude) &&
      Number.isFinite(report.longitude) &&
      (group.distanceKm === undefined ||
        (report.distanceKm !== undefined && report.distanceKm < group.distanceKm))
    ) {
      group.latitude = report.latitude;
      group.longitude = report.longitude;
      group.distanceKm = report.distanceKm;
    }

    groups.set(dedupeKey, group);
  });

  const existing = readStoredNotifications();
  const nearbyReportKeys = new Set(groups.keys());
  groups.forEach((group, dedupeKey) => {
    const alreadyNotified = existing.find((notification) => notification.dedupeKey === dedupeKey);
    const label = group.category === "civic" ? "Community issue" : `${group.category[0].toUpperCase()}${group.category.slice(1)} issue`;

    if (group.activeCount > 0) {
      upsertGlobalNotification({
        dedupeKey,
        title: `${label} · ${group.area}`,
        description: "Active in your area.",
        type: "warning",
        category: group.category,
        status: "active",
        latitude: group.latitude,
        longitude: group.longitude,
        distanceKm: group.distanceKm,
      });
    } else if (alreadyNotified?.status === "active" && group.resolvedCount > 0) {
      upsertGlobalNotification({
        dedupeKey,
        title: `${label} resolved · ${group.area}`,
        description: "Marked resolved.",
        type: "success",
        category: group.category,
        status: "resolved",
        latitude: group.latitude,
        longitude: group.longitude,
        distanceKm: group.distanceKm,
      });
    }
  });

  const currentNotifications = readStoredNotifications();
  saveGlobalNotifications(
    currentNotifications.filter(
      (notification) =>
        !notification.dedupeKey?.startsWith("report:") || nearbyReportKeys.has(notification.dedupeKey)
    )
  );
}
