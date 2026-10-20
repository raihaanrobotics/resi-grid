import { getPushAdminClient } from "@/lib/notifications/webPushServer";

interface PushSubscriptionBody {
  endpoint?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
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

  let body: PushSubscriptionBody;
  try {
    body = await request.json() as PushSubscriptionBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";
  const latitude = body.latitude;
  const longitude = body.longitude;

  if (
    !endpoint ||
    endpoint.length > 2048 ||
    !p256dh ||
    p256dh.length > 512 ||
    !auth ||
    auth.length > 512 ||
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return Response.json({ error: "A valid push subscription and location are required." }, { status: 400 });
  }

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return Response.json({ error: "Invalid push endpoint." }, { status: 400 });
  }

  const supportedHosts = [
    "fcm.googleapis.com",
    "updates.push.services.mozilla.com",
    "web.push.apple.com",
  ];
  if (
    endpointUrl.protocol !== "https:" ||
    !supportedHosts.some((host) => endpointUrl.hostname === host || endpointUrl.hostname.endsWith(`.${host}`))
  ) {
    return Response.json({ error: "Unsupported push service." }, { status: 400 });
  }

  try {
    const supabase = getPushAdminClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          endpoint,
          subscription: { endpoint, keys: { p256dh, auth } },
          latitude,
          longitude,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("Failed to save Web Push subscription:", error);
      return Response.json({ error: "Could not save this device subscription." }, { status: 500 });
    }
  } catch (error) {
    console.error("Web Push subscription configuration error:", error);
    return Response.json({ error: "Push notifications are not configured on the server." }, { status: 503 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
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

  let body: { endpoint?: unknown };
  try {
    body = await request.json() as { endpoint?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.endpoint !== "string" || body.endpoint.length > 2048) {
    return Response.json({ error: "A valid push endpoint is required." }, { status: 400 });
  }

  try {
    const supabase = getPushAdminClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", body.endpoint);

    if (error) {
      console.error("Failed to remove Web Push subscription:", error);
      return Response.json({ error: "Could not disable screen alerts." }, { status: 500 });
    }
  } catch (error) {
    console.error("Web Push unsubscription configuration error:", error);
    return Response.json({ error: "Push notifications are not configured on the server." }, { status: 503 });
  }

  return Response.json({ ok: true });
}
