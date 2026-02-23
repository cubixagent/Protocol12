// ════════════════════════════════════════════════════════════════
// EXECUTION ENGINE — Service Worker
// Bump CACHE_VERSION whenever you push to GitHub to trigger update
// ════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'v3';
const CACHE_NAME = `execution-engine-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
];

// ── Install: pre-cache shell files ─────────────────────────────
self.addEventListener('install', event => {
  // Do NOT call self.skipWaiting() here — let the page decide when to update
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// ── Activate: delete old caches ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for HTML, cache-first for assets ──────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go network-first for the main HTML file
  // so we detect updates on every load
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else (icons, manifest, etc.)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ── Message handler: page tells SW to take over now ────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    // After skipWaiting, 'controllerchange' fires in the page → page reloads
  }
});
