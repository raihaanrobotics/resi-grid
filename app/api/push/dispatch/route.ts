import { getPushAdminClient, configureWebPush } from "@/lib/notifications/webPushServer";
import { getReportNotificationIdentity, type ReportNotificationInput } from "@/lib/notifications/globalNotifications";
import { getDistanceInKm } from "@/lib/geoUtils";
import webPush from "web-push";

interface NotificationPayload {
  reportId?: unknown;
  dedupeKey?: unknown;
  title?: unknown;
  description?: unknown;
  category?: unknown;
  status?: unknown;
  type?: unknown;
  latitude?: unknown;
  longitude?: unknown;
}

interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  latitude: number | null;
  longitude: number | null;
}

interface NearbyReport {
  latitude: number | null;
  longitude: number | null;
  status: string | null;
}

const ALLOWED_CATEGORIES = new Set(["water", "power", "civic", "climate"]);
const ALLOWED_TYPES = new Set(["warning", "success", "info", "error"]);
const ALLOWED_STATUSES = new Set(["active", "resolved"]);
const DEDUPE_KEY_PATTERN = /^(report|weather|telemetry):[a-z0-9:._| -]+$/i;
const SOUTH_AFRICAN_PROVINCES = new Set([
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
]);
const SUPPORTED_PUSH_HOSTS = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
];

function isSupportedPushEndpoint(endpoint: string) {
  try {
    const endpointUrl = new URL(endpoint);
    return endpointUrl.protocol === "https:" &&
      SUPPORTED_PUSH_HOSTS.some((host) =>
        endpointUrl.hostname === host || endpointUrl.hostname.endsWith(`.${host}`)
      );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  let isSameOrigin = false;
  try {
    isSameOrigin = Boolean(origin && new URL(origin).origin === new URL(request.url).origin);
  } catch {
    isSameOrigin = false;
  }
  if (!isSameOrigin) {
    return Response.json({ error: "Same-origin requests only." }, { status: 403 });
  }

  let payload: NotificationPayload;
  try {
    payload = await request.json() as NotificationPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let notification: {
    dedupeKey: string;
    title: string;
    description: string;
    category: string;
    status: string;
    type: string;
    latitude?: number;
    longitude?: number;
  };
  let matchingReportIssues: NearbyReport[] = [];

  if (typeof payload.reportId === "string" && payload.reportId.length > 0 && payload.reportId.length <= 100) {
    try {
      const supabase = getPushAdminClient();
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .select("category, location_address, province, municipality, ward, status, latitude, longitude")
        .eq("report_id", payload.reportId)
        .maybeSingle();

      if (reportError) {
        console.error("Failed to load report for screen notification:", reportError);
        return Response.json({ error: "Could not load this report." }, { status: 500 });
      }
      if (!report) {
        return Response.json({ error: "Report not found." }, { status: 404 });
      }

      const identity = getReportNotificationIdentity(report);
      if (!identity) {
        return Response.json({ error: "This report category does not send issue alerts." }, { status: 400 });
      }

      const { data: reports, error: reportsError } = await supabase
        .from("reports")
        .select("category, location_address, province, municipality, ward, status, latitude, longitude")
        .eq("category", report.category);
      if (reportsError) {
        console.error("Failed to group reports for screen notification:", reportsError);
        return Response.json({ error: "Could not check this issue's status." }, { status: 500 });
      }

      const matchingReports = (reports || []).filter((item) => {
        return getReportNotificationIdentity(item as ReportNotificationInput)?.dedupeKey === identity.dedupeKey;
      });
      matchingReportIssues = matchingReports;
      const activeCount = matchingReports.filter((item) =>
        !["resolved", "closed", "fixed"].includes((item.status || "").toLowerCase())
      ).length;
      const eventStatus = activeCount > 0 ? "active" : "resolved";
      const label = identity.category === "civic"
        ? "Community issue"
        : `${identity.category[0].toUpperCase()}${identity.category.slice(1)} issue`;

      notification = {
        dedupeKey: identity.dedupeKey,
        title: activeCount > 0 ? `${label} · ${identity.area}` : `${label} resolved · ${identity.area}`,
        description: activeCount > 0 ? "Active in your area." : "Marked resolved.",
        category: identity.category,
        status: eventStatus,
        type: activeCount > 0 ? "warning" : "success",
      };
    } catch (error) {
      console.error("Report screen notification configuration error:", error);
      return Response.json({ error: "Push notifications are not configured on the server." }, { status: 503 });
    }
  } else {
    const { dedupeKey, title, description, category, status, type, latitude, longitude } = payload;
    if (
      typeof dedupeKey !== "string" ||
      dedupeKey.length > 200 ||
      !DEDUPE_KEY_PATTERN.test(dedupeKey) ||
      typeof title !== "string" ||
      title.length === 0 ||
      title.length > 120 ||
      typeof description !== "string" ||
      description.length > 180 ||
      typeof category !== "string" ||
      !ALLOWED_CATEGORIES.has(category) ||
      typeof status !== "string" ||
      !ALLOWED_STATUSES.has(status) ||
      typeof type !== "string" ||
      !ALLOWED_TYPES.has(type) ||
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return Response.json({ error: "Invalid notification payload." }, { status: 400 });
    }

    const telemetryNotification =
      (dedupeKey === "telemetry:water-pressure" &&
        category === "water" &&
        title === "Water pressure issue" &&
        description === "Low pressure detected nearby." &&
        status === "active" &&
        type === "warning") ||
      (dedupeKey === "telemetry:power-stability" &&
        category === "power" &&
        title === "Power stability issue" &&
        description === "Voltage instability detected nearby." &&
        status === "active" &&
        type === "warning");
    const weatherKey = dedupeKey.match(/^weather:([^:]+):(storm warning|rain advisory|wind warning)$/i);
    const weatherMessages: Record<string, string> = {
      "storm warning": "Severe storms nearby.",
      "rain advisory": "Rain expected in your area.",
      "wind warning": "Strong winds nearby.",
    };
    const weatherTitles: Record<string, string> = {
      "storm warning": "Storm warning",
      "rain advisory": "Rain advisory",
      "wind warning": "Wind warning",
    };
    const weatherNotification = Boolean(
      weatherKey &&
      SOUTH_AFRICAN_PROVINCES.has(weatherKey[1]) &&
      category === "climate" &&
      status === "active" &&
      type === (weatherKey[2].toLowerCase() === "rain advisory" ? "info" : "warning") &&
      title === weatherTitles[weatherKey[2].toLowerCase()] &&
      description === weatherMessages[weatherKey[2].toLowerCase()]
    );
    if (!telemetryNotification && !weatherNotification) {
      return Response.json({ error: "Only supported alert types can be sent." }, { status: 400 });
    }

    notification = { dedupeKey, title, description, category, status, type, latitude, longitude };
  }

  const { dedupeKey, title, description, category, status, type, latitude, longitude } = notification;

  try {
    configureWebPush();
    const supabase = getPushAdminClient();
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, subscription, latitude, longitude");

    if (subscriptionsError) {
      console.error("Failed to load Web Push subscriptions:", subscriptionsError);
      return Response.json({ error: "Could not load device subscriptions." }, { status: 500 });
    }

    if (!subscriptions?.length) return Response.json({ ok: true, delivered: 0 });

    const reportIssue = typeof payload.reportId === "string";

    const recipients = subscriptions.flatMap(
      (row: { endpoint: string; subscription: StoredSubscription; latitude: number | null; longitude: number | null }) => {
        const subscriberLatitude = row.latitude;
        const subscriberLongitude = row.longitude;
        if (
          typeof subscriberLatitude !== "number" ||
          typeof subscriberLongitude !== "number" ||
          !Number.isFinite(subscriberLatitude) ||
          !Number.isFinite(subscriberLongitude)
        ) {
          return [];
        }
        if (reportIssue) {
          const localReports = matchingReportIssues.filter((report) =>
            typeof report.latitude === "number" &&
            typeof report.longitude === "number" &&
            getDistanceInKm(subscriberLatitude, subscriberLongitude, report.latitude, report.longitude) <= 10
          );
          if (localReports.length === 0) return [];
          const activeCount = localReports.filter(
            (report) => !["resolved", "closed", "fixed"].includes((report.status || "").toLowerCase())
          ).length;
          const resolvedOnly = activeCount === 0;
          return [{
            row,
            eventStatus: resolvedOnly ? "resolved" : "active",
            title: resolvedOnly ? notification.title.replace(" · ", " resolved · ") : notification.title,
            description: resolvedOnly ? "Marked resolved." : "Active in your area.",
            type: resolvedOnly ? "success" : "warning",
          }];
        }

        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number" ||
          getDistanceInKm(subscriberLatitude, subscriberLongitude, latitude, longitude) > 10
        ) {
          return [];
        }
        return [{ row, eventStatus: status, title, description, type }];
      }
    );
    if (recipients.length === 0) return Response.json({ ok: true, delivered: 0 });

    const uniqueStatuses = [...new Set(recipients.map((recipient) => recipient.eventStatus))];
    const newStatuses = new Set<string>();
    for (const eventStatus of uniqueStatuses) {
      const { data: insertedEvent, error: eventError } = await supabase
        .from("push_notification_dispatches")
        .upsert(
          { dedupe_key: dedupeKey, notification_status: eventStatus },
          { onConflict: "dedupe_key,notification_status", ignoreDuplicates: true }
        )
        .select("dedupe_key");

      if (eventError) {
        console.error("Failed to record Web Push dispatch:", eventError);
        return Response.json({ error: "Could not record notification delivery." }, { status: 500 });
      }
      if (insertedEvent?.length) newStatuses.add(eventStatus);
    }

    const pendingRecipients = recipients.filter((recipient) => newStatuses.has(recipient.eventStatus));
    const deliveries = await Promise.allSettled(
      pendingRecipients.map(async ({ row, title: recipientTitle, description: recipientDescription, type: recipientType }) => {
        if (!isSupportedPushEndpoint(row.endpoint)) {
          const { error: deleteError } = await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", row.endpoint);
          if (deleteError) {
            console.error("Failed to remove unsupported Web Push endpoint:", deleteError);
          }
          return false;
        }
        try {
          await webPush.sendNotification(row.subscription, JSON.stringify({
            title: recipientTitle.slice(0, 120),
            body: recipientDescription.slice(0, 180),
            category,
            type: recipientType,
            dedupeKey,
            url: "/",
          }), { TTL: 3600 });
          return true;
        } catch (error) {
          if (error instanceof webPush.WebPushError && [404, 410].includes(error.statusCode)) {
            const { error: deleteError } = await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", row.endpoint);
            if (deleteError) {
              console.error("Failed to remove expired Web Push subscription:", deleteError);
            }
            return false;
          }
          throw error;
        }
      })
    );

    const delivered = deliveries.filter((result) => result.status === "fulfilled" && result.value).length;
    const failed = deliveries.length - delivered;
    if (failed > 0) {
      console.error(`Web Push delivery failed for ${failed} device(s).`);
    }

    return Response.json({ ok: true, delivered, failed });
  } catch (error) {
    console.error("Web Push dispatch configuration or delivery error:", error);
    return Response.json({ error: "Web Push is not configured or could not send." }, { status: 503 });
  }
}
