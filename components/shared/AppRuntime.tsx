"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import OneSignal from "@onesignal/capacitor-plugin";
import { GeoProvider, useGeo } from "@/context/GeoContext";
import { supabase } from "@/lib/supabase";

let oneSignalInitialization: Promise<void> | null = null;

async function initializeOneSignal(appId: string) {
  oneSignalInitialization ??= OneSignal.initialize(appId).catch((error: unknown) => {
    oneSignalInitialization = null;
    throw error;
  });
  await oneSignalInitialization;
}

function NativePushRegistration({ userId }: { userId: string }) {
  const router = useRouter();
  const { location } = useGeo();
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) {
      console.error("Native push is not configured: NEXT_PUBLIC_ONESIGNAL_APP_ID is missing.");
      return;
    }

    let active = true;
    const registerDevice = async (subscriptionId?: string | null) => {
      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return;
      }

      const id = subscriptionId ?? await OneSignal.User.pushSubscription.getIdAsync();
      if (!id || !active) return;

      const { error } = await supabase.functions.invoke("native-push", {
        body: {
          action: "register",
          subscriptionId: id,
          latitude,
          longitude,
        },
      });
      if (error) throw error;
    };

    const handleSubscriptionChange = (event: {
      current: { id?: string; optedIn: boolean };
    }) => {
      if (event.current.optedIn && event.current.id) {
        void registerDevice(event.current.id).catch((error: unknown) => {
          console.error("Could not register this phone for nearby alerts:", error);
        });
      }
    };
    const handleNotificationClick = (event: { notification: { additionalData: object | null } }) => {
      const data = event.notification.additionalData as { url?: unknown } | null;
      const target = typeof data?.url === "string" && data.url.startsWith("/")
        ? data.url
        : "/";
      router.push(target);
    };

    OneSignal.User.pushSubscription.addEventListener("change", handleSubscriptionChange);
    OneSignal.Notifications.addEventListener("click", handleNotificationClick);

    void (async () => {
      await initializeOneSignal(appId);
      await OneSignal.login(userId);

      const hasPermission = await OneSignal.Notifications.hasPermission();
      if (!hasPermission && await OneSignal.Notifications.canRequestPermission()) {
        await OneSignal.Notifications.requestPermission(false);
      }
      if (!active || !await OneSignal.Notifications.hasPermission()) return;

      await OneSignal.User.pushSubscription.optIn();
      await registerDevice();
    })().catch((error: unknown) => {
      console.error("Could not enable native screen notifications:", error);
    });

    return () => {
      active = false;
      OneSignal.User.pushSubscription.removeEventListener("change", handleSubscriptionChange);
      OneSignal.Notifications.removeEventListener("click", handleNotificationClick);
    };
  }, [latitude, longitude, router, userId]);

  return null;
}

export default function AppRuntime({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [locationPermissionReadyFor, setLocationPermissionReadyFor] = useState<string | null>(null);
  const authenticated = Boolean(userId);
  const isPublicAuthRoute = pathname === "/profile" || pathname === "/auth/callback";

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Could not enable offline app support:", error);
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      if (mounted) {
        setUserId(session?.user.id ?? null);
        setSessionChecked(true);
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Could not check the app sign-in session:", error);
      }
      if (mounted && !authEventReceived) {
        setUserId(data.session?.user.id ?? null);
        setSessionChecked(true);
      }
    }).catch((error: unknown) => {
      console.error("Could not check the app sign-in session:", error);
      if (mounted) setSessionChecked(true);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!authenticated && !isPublicAuthRoute) {
      router.replace("/profile");
    }
  }, [authenticated, isPublicAuthRoute, pathname, router, sessionChecked]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let removeListener: (() => void) | undefined;
    void CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack || window.history.length > 1) {
        window.history.back();
      } else if (pathname === "/profile" && !authenticated) {
        void CapacitorApp.exitApp();
      } else if (pathname !== "/") {
        router.replace("/");
      } else {
        void CapacitorApp.exitApp();
      }
    }).then((listener) => {
      if (cancelled) {
        void listener.remove();
      } else {
        removeListener = () => listener.remove();
      }
    }).catch((error: unknown) => {
      console.error("Could not register the phone back button:", error);
    });

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [authenticated, pathname, router]);

  useEffect(() => {
    if (!sessionChecked || !userId || !Capacitor.isNativePlatform()) return;

    let active = true;
    void (async () => {
      try {
        const permission = await Geolocation.checkPermissions();
        if (permission.location === "prompt" || permission.location === "prompt-with-rationale") {
          await Geolocation.requestPermissions();
        }
      } catch (error) {
        console.error("Could not request location access:", error);
      } finally {
        if (active) setLocationPermissionReadyFor(userId);
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionChecked, userId]);

  useEffect(() => {
    if (!sessionChecked || !Capacitor.isNativePlatform() || userId || !oneSignalInitialization) return;
    void OneSignal.logout().catch((error: unknown) => {
      console.error("Could not disconnect the signed-out OneSignal user:", error);
    });
  }, [sessionChecked, userId]);

  if (!sessionChecked || (!authenticated && !isPublicAuthRoute)) {
    return (
      <main className="resigrid-shell flex min-h-screen items-center justify-center text-white">
        <p className="animate-pulse text-xs tracking-[0.2em] text-muted">CHECKING SIGN-IN...</p>
      </main>
    );
  }

  if (!authenticated || !userId) return <>{children}</>;
  if (Capacitor.isNativePlatform() && locationPermissionReadyFor !== userId) {
    return (
      <main className="resigrid-shell flex min-h-screen items-center justify-center text-white">
        <p className="animate-pulse text-xs tracking-[0.2em] text-muted">REQUESTING DEVICE PERMISSIONS...</p>
      </main>
    );
  }
  return (
    <GeoProvider>
      <NativePushRegistration userId={userId} />
      {children}
    </GeoProvider>
  );
}
