// ---------------------------------------------------------------------------
// sw.js — Service Worker
// Purpose: make the app installable as a PWA and give it a basic offline shell.
// We keep this DELIBERATELY simple:
//   - It does NOT cache Firebase responses (we always want live data).
//   - It caches only the static app shell so the page can open offline.
// ---------------------------------------------------------------------------

// Bump this version string whenever you want to force-refresh the cache.
const CACHE_NAME = "porodica-shell-v1";

// The minimal set of files needed to boot the UI. Vite fingerprints JS/CSS
// filenames at build time, so we don't list those here — we just cache the
// shell entry points and let the network fetch the hashed assets (then they
// get cached on the fly by the fetch handler below).
const SHELL_ASSETS = ["./", "./index.html", "./manifest.json"];

// On install: pre-cache the shell.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  // Activate this new SW immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

// On activate: delete old caches from previous versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// On fetch: "network-first, fall back to cache" for navigation/static assets.
// IMPORTANT: never intercept Firebase/Firestore traffic — let it go straight
// to the network so data stays live.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip anything that isn't a GET, and skip cross-origin API calls
  // (Firebase, Firestore, OpenStreetMap tiles, unpkg, etc.).
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return; // let the browser handle it normally
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a copy of successful same-origin responses for offline use.
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match("./")))
  );
});

// ---------------------------------------------------------------------------
// PUSH — show a notification when the child app sends a geofence alert.
// The payload is JSON: { title, body }.
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Family", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Family";
  const options = {
    body: data.body || "",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    // Tag so repeated alerts for the same place replace instead of stacking.
    tag: data.tag || undefined,
    data,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses/opens the app.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) return w.focus();
      }
      if (clients.openWindow) return clients.openWindow("./");
    })
  );
});
