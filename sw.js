// sw.js
const CACHE_VERSION = 'v' + Date.now(); // هر بار SW تغییر کنه، version عوض میشه
const CACHE_NAME = 'exec-engine-' + CACHE_VERSION;

const ASSETS = [
  './',
  './index.html',
];

// Install: cache assets
self.addEventListener('install', e => {
  self.skipWaiting(); // ← کلید مهم: SW جدید فوری active میشه
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate: پاک کردن cache قدیمی
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim()) // ← فوری کنترل همه تب‌ها رو میگیره
  );
});

// Fetch: network-first strategy
self.addEventListener('fetch', e => {
  // فقط GET و همون origin
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // پاسخ شبکه رو cache کن و برگردون
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() =>
        // اگه آفلاین بود، از cache بخون
        caches.match(e.request)
      )
  );
});
