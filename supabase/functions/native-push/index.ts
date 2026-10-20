declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

interface ReportRow {
  report_id: string | null;
  category: string | null;
  location_address: string | null;
  province: string | null;
  municipality: string | null;
  ward: string | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface PushRow {
  endpoint: string;
  subscription: { subscriptionId?: string };
  latitude: number | null;
  longitude: number | null;
}

interface IssueIdentity {
  dedupeKey: string;
  category: "water" | "power" | "civic";
  area: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const resolvedStatuses = new Set(["resolved", "closed", "fixed"]);
const allowedCategories = new Set(["water", "power", "civic", "climate"]);
const allowedTypes = new Set(["warning", "success", "info", "error"]);
const allowedStatuses = new Set(["active", "resolved"]);
const southAfricanProvinces = new Set([
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

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing Supabase function secret: ${name}`);
  return value;
}

function validCoordinates(latitude: unknown, longitude: unknown): latitude is number {
  return typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180;
}

function getIssueIdentity(report: Partial<ReportRow>): IssueIdentity | null {
  const rawCategory = (report.category || "").trim().toLowerCase();
  const normalizedCategory = rawCategory === "other"
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
  };
}

function distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = Math.PI / 180;
  const dLat = (lat2 - lat1) * radians;
  const dLon = (lon2 - lon1) * radians;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * radians) * Math.cos(lat2 * radians) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function notificationIsSupported(notification: Record<string, unknown>) {
  const { dedupeKey, title, description, category, status, type, latitude, longitude } = notification;
  if (
    typeof dedupeKey !== "string" ||
    dedupeKey.length > 200 ||
    !/^(weather|telemetry):[a-z0-9:._| -]+$/i.test(dedupeKey) ||
    typeof title !== "string" ||
    title.length === 0 ||
    title.length > 120 ||
    typeof description !== "string" ||
    description.length > 180 ||
    typeof category !== "string" ||
    !allowedCategories.has(category) ||
    typeof status !== "string" ||
    !allowedStatuses.has(status) ||
    typeof type !== "string" ||
    !allowedTypes.has(type) ||
    !validCoordinates(latitude, longitude)
  ) {
    return false;
  }

  const telemetryAllowed =
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
  const weatherDetails: Record<string, { title: string; description: string; type: string }> = {
    "storm warning": { title: "Storm warning", description: "Severe storms nearby.", type: "warning" },
    "rain advisory": { title: "Rain advisory", description: "Rain expected in your area.", type: "info" },
    "wind warning": { title: "Wind warning", description: "Strong winds nearby.", type: "warning" },
  };
  const weather = weatherKey && weatherDetails[weatherKey[2].toLowerCase()];
  const weatherAllowed = Boolean(
    weatherKey &&
    southAfricanProvinces.has(weatherKey[1]) &&
    category === "climate" &&
    status === "active" &&
    weather &&
    title === weather.title &&
    description === weather.description &&
    type === weather.type
  );
  return telemetryAllowed || weatherAllowed;
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const url = env("SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status}): ${await response.text()}`);
  }
  return response;
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const response = await fetch(`${env("SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      apikey: env("SUPABASE_ANON_KEY"),
      Authorization: authorization,
    },
  });
  if (!response.ok) return null;
  const user: { id?: unknown } = await response.json();
  return typeof user.id === "string" ? user.id : null;
}

async function verifyOneSignalSubscription(userId: string, subscriptionId: string) {
  const appId = env("ONESIGNAL_APP_ID");
  const apiKey = env("ONESIGNAL_APP_API_KEY");
  const response = await fetch(
    `https://api.onesignal.com/apps/${encodeURIComponent(appId)}/users/by/external_id/${encodeURIComponent(userId)}`,
    { headers: { Authorization: `Key ${apiKey}` } },
  );
  if (!response.ok) {
    throw new Error(`Could not verify OneSignal device ownership (${response.status}).`);
  }
  const user: { subscriptions?: Array<{ id?: string; type?: string }> } = await response.json();
  return user.subscriptions?.some(
    (subscription) =>
      subscription.id === subscriptionId &&
      typeof subscription.type === "string" &&
      subscription.type.toLowerCase().includes("push"),
  ) ?? false;
}

async function registerDevice(userId: string, body: Record<string, unknown>) {
  const { subscriptionId, latitude, longitude } = body;
  if (
    typeof subscriptionId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(subscriptionId) ||
    !validCoordinates(latitude, longitude)
  ) {
    return jsonResponse({ error: "A valid device subscription and location are required." }, 400);
  }

  if (!await verifyOneSignalSubscription(userId, subscriptionId)) {
    return jsonResponse({ error: "This phone is not linked to the signed-in account." }, 403);
  }

  await supabaseRequest("push_subscriptions?on_conflict=endpoint", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      endpoint: `onesignal:${subscriptionId}`,
      subscription: { provider: "onesignal", subscriptionId, userId },
      latitude,
      longitude,
      updated_at: new Date().toISOString(),
    }),
  });
  return jsonResponse({ ok: true });
}

async function sendOneSignal(title: string, description: string, dedupeKey: string, type: string, subscriptionIds: string[]) {
  if (subscriptionIds.length === 0) return;
  if (subscriptionIds.length > 20_000) {
    throw new Error("Too many nearby phone subscriptions for one push notification.");
  }
  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Key ${env("ONESIGNAL_APP_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: env("ONESIGNAL_APP_ID"),
      include_subscription_ids: subscriptionIds,
      headings: { en: title.slice(0, 120) },
      contents: { en: description.slice(0, 180) },
      priority: 10,
      data: { dedupeKey, type, url: "/" },
    }),
  });
  if (!response.ok) {
    throw new Error(`OneSignal delivery failed (${response.status}): ${await response.text()}`);
  }
}

async function dispatchNotification(
  dedupeKey: string,
  title: string,
  description: string,
  type: string,
  eventStatus: "active" | "resolved",
  recipientRows: PushRow[],
) {
  const subscriptionIds = [...new Set(
    recipientRows
      .filter((row) => row.endpoint.startsWith("onesignal:"))
      .map((row) => row.subscription?.subscriptionId)
      .filter((id): id is string => typeof id === "string"),
  )];
  if (subscriptionIds.length === 0) return jsonResponse({ ok: true, delivered: 0 });

  const storedKey = `onesignal:${dedupeKey}`;
  if (eventStatus === "resolved") {
    const activeParams = new URLSearchParams({
      dedupe_key: `eq.${storedKey}`,
      notification_status: "eq.active",
      select: "dedupe_key",
      limit: "1",
    });
    const activeResponse = await supabaseRequest(`push_notification_dispatches?${activeParams}`);
    if (!(await activeResponse.json() as unknown[]).length) {
      return jsonResponse({ ok: true, delivered: 0 });
    }
  }

  const dispatchParams = new URLSearchParams({ on_conflict: "dedupe_key,notification_status" });
  const dispatchResponse = await supabaseRequest(`push_notification_dispatches?${dispatchParams}`, {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({ dedupe_key: storedKey, notification_status: eventStatus }),
  });
  if (!(await dispatchResponse.json() as unknown[]).length) {
    return jsonResponse({ ok: true, duplicate: true, delivered: 0 });
  }

  try {
    await sendOneSignal(title, description, dedupeKey, type, subscriptionIds);
    return jsonResponse({ ok: true, delivered: subscriptionIds.length });
  } catch (error) {
    const deleteParams = new URLSearchParams({
      dedupe_key: `eq.${storedKey}`,
      notification_status: `eq.${eventStatus}`,
    });
    await supabaseRequest(`push_notification_dispatches?${deleteParams}`, { method: "DELETE" });
    throw error;
  }
}

async function dispatchReport(reportId: string) {
  if (!reportId || reportId.length > 100) {
    return jsonResponse({ error: "A valid report is required." }, 400);
  }

  const reportParams = new URLSearchParams({
    select: "report_id,category,location_address,province,municipality,ward,status,latitude,longitude",
    report_id: `eq.${reportId}`,
    limit: "1",
  });
  const reportResponse = await supabaseRequest(`reports?${reportParams}`);
  const [selectedReport] = await reportResponse.json() as ReportRow[];
  if (!selectedReport) return jsonResponse({ error: "Report not found." }, 404);
  const identity = getIssueIdentity(selectedReport);
  if (!identity) return jsonResponse({ ok: true, delivered: 0 });

  const groupParams = new URLSearchParams({
    select: "report_id,category,location_address,province,municipality,ward,status,latitude,longitude",
    category: `eq.${selectedReport.category}`,
    limit: "10000",
  });
  const reportsResponse = await supabaseRequest(`reports?${groupParams}`);
  const matchingReports = (await reportsResponse.json() as ReportRow[]).filter(
    (report) => getIssueIdentity(report)?.dedupeKey === identity.dedupeKey,
  );
  const pushResponse = await supabaseRequest(
    "push_subscriptions?select=endpoint,subscription,latitude,longitude",
  );
  const subscriptions = await pushResponse.json() as PushRow[];
  const recipientsByStatus = new Map<"active" | "resolved", PushRow[]>();

  for (const subscription of subscriptions) {
    const subscriberLatitude = subscription.latitude;
    const subscriberLongitude = subscription.longitude;
    if (
      !subscription.endpoint.startsWith("onesignal:") ||
      typeof subscriberLatitude !== "number" ||
      typeof subscriberLongitude !== "number"
    ) {
      continue;
    }
    const nearbyReports = matchingReports.filter(
      (report) =>
        typeof report.latitude === "number" &&
        typeof report.longitude === "number" &&
        distanceInKm(
          subscriberLatitude,
          subscriberLongitude,
          report.latitude,
          report.longitude,
        ) <= 10,
    );
    if (nearbyReports.length === 0) continue;
    const status = nearbyReports.some((report) => !resolvedStatuses.has((report.status || "").toLowerCase()))
      ? "active"
      : "resolved";
    const recipients = recipientsByStatus.get(status) || [];
    recipients.push(subscription);
    recipientsByStatus.set(status, recipients);
  }

  const dispatches = [...recipientsByStatus.entries()].map(([status, recipients]) => {
    const label = identity.category === "civic"
      ? "Community issue"
      : `${identity.category[0].toUpperCase()}${identity.category.slice(1)} issue`;
    const title = status === "active"
      ? `${label} · ${identity.area}`
      : `${label} resolved · ${identity.area}`;
    return dispatchNotification(
      identity.dedupeKey,
      title,
      status === "active" ? "Active in your area." : "Marked resolved.",
      status === "active" ? "warning" : "success",
      status,
      recipients,
    );
  });
  const results = await Promise.all(dispatches);
  return results[results.length - 1] || jsonResponse({ ok: true, delivered: 0 });
}

async function dispatchAlert(notification: Record<string, unknown>) {
  if (!notificationIsSupported(notification)) {
    return jsonResponse({ error: "Only supported nearby alerts can be sent." }, 400);
  }
  const { dedupeKey, title, description, type, status, latitude, longitude } = notification;
  const pushResponse = await supabaseRequest(
    "push_subscriptions?select=endpoint,subscription,latitude,longitude",
  );
  const subscriptions = await pushResponse.json() as PushRow[];
  const recipients = subscriptions.filter(
    (row) =>
      row.endpoint.startsWith("onesignal:") &&
      typeof row.latitude === "number" &&
      typeof row.longitude === "number" &&
      distanceInKm(row.latitude, row.longitude, latitude as number, longitude as number) <= 10,
  );
  return dispatchNotification(
    dedupeKey as string,
    title as string,
    description as string,
    type as string,
    status as "active" | "resolved",
    recipients,
  );
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const userId = await authenticate(request);
    if (!userId) return jsonResponse({ error: "Sign in to manage or send phone alerts." }, 401);

    const body: Record<string, unknown> = await request.json();
    if (body.action === "register") return await registerDevice(userId, body);
    if (body.action === "report") {
      return await dispatchReport(typeof body.reportId === "string" ? body.reportId : "");
    }
    if (body.action === "notification" && body.notification && typeof body.notification === "object") {
      return await dispatchAlert(body.notification as Record<string, unknown>);
    }
    return jsonResponse({ error: "Unsupported phone alert action." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Native phone notification failed:", message);
    return jsonResponse({ error: "Could not process the phone notification." }, 500);
  }
});
