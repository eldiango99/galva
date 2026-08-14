const CACHE_NAME = 'galva-control-v1';
const SHELL_FILES = [
  './index.html',
  './i18n.js',
  './db.js',
  './app.js',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for the app shell, network-first (with cache fallback) for everything else (CDN libs, etc.)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isShell = SHELL_FILES.some((f) => url.pathname.endsWith(f.replace('./', '/')));

  if (isShell) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  } else {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
