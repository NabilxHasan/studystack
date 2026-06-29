/* Study Stack — service worker (hand-rolled, no build step required).

   Purpose: make the app LOAD with no network. On the first online visit the app
   shell (index.html) and the hashed JS/CSS bundles get cached; later visits then
   work fully offline.

   Note: this only caches the app *code*. Your task data is handled separately by
   Firestore's own offline cache (IndexedDB), which queues writes made offline and
   syncs them when you reconnect — so we deliberately DO NOT intercept Firebase /
   Google API requests here and let Firebase manage them. */

const CACHE = "studystack-v1";

// Best-effort precache of the app shell. `cache.addAll` fails the whole install
// if any single URL 404s, so we add each individually and ignore failures.
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.ico",
  "./favicon.svg",
  "./apple-touch-icon.png",
  "./logo192.png",
  "./logo512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(SHELL.map((url) => cache.add(new Request(url, { cache: "reload" }))))
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle our own origin. Firestore / Google Auth requests pass straight
  // through to the network so Firebase's offline layer stays in control.
  if (url.origin !== self.location.origin) return;

  // Page navigations: network-first (so you get the latest app when online),
  // falling back to the cached shell so the app still opens with no connection.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Static assets (hashed JS/CSS/images): stale-while-revalidate — serve the
  // cached copy instantly when present, and refresh it in the background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
