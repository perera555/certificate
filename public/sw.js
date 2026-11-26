// Service worker: makes the app installable and gives an offline fallback.
// Pages and app code always come from the network first, so updates show immediately.
const CACHE = "oc-shell-v2";
const OFFLINE = ["/", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(OFFLINE)).then(() => self.skipWaiting()));
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
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  if (req.mode !== "navigate") return; // let the browser handle JS/CSS/images normally

  // Pages: network first; when offline fall back to the last copy (or the home page).
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && !url.pathname.startsWith("/admin")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
  );
});
