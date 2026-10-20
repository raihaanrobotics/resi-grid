const APP_CACHE = "resigrid-app-v1";
const OFFLINE_ROUTES = ["/", "/marketplace", "/spazarescue", "/hydromesh", "/voltshield", "/radar", "/civic"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then(async (cache) => {
      await Promise.allSettled(OFFLINE_ROUTES.map((route) => cache.add(route)));
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys.filter((key) => key.startsWith("resigrid-app-") && key !== APP_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(APP_CACHE).then((cache) => cache.put(request, copy));
          void caches.open(APP_CACHE).then((cache) => cache.put(url.pathname, response.clone()));
        }
        return response;
      }).catch(async () => {
        const cache = await caches.open(APP_CACHE);
        return await cache.match(request) || await cache.match(url.pathname) || await cache.match("/");
      })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || /\.(?:css|js|svg|png|jpe?g|webp|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(APP_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (error) {
    console.error("Invalid push notification payload:", error);
    return;
  }

  const title = typeof payload.title === "string" ? payload.title : "ResiGrid alert";
  const options = {
    body: typeof payload.body === "string" ? payload.body : "There is an update in your area.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: typeof payload.dedupeKey === "string" ? payload.dedupeKey : "resigrid-alert",
    renotify: false,
    data: { url: typeof payload.url === "string" ? payload.url : "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const appWindow = windows.find((client) => client.url.startsWith(self.location.origin));
      if (appWindow) {
        return appWindow.focus().then(() => appWindow.navigate(destination));
      }
      return self.clients.openWindow(destination);
    })
  );
});
