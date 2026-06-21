/* Pauli BestPrice — minimal service worker (installable PWA, network-first). */
var CACHE = "pauli-pwa-v1";
var SHELL = ["/", "/download.html", "/style.css", "/download.css", "/manifest.webmanifest"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(function (res) {
        return res;
      })
      .catch(function () {
        return caches.match(e.request).then(function (hit) {
          return hit || caches.match("/");
        });
      })
  );
});
