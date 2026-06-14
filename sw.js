/* Nightwatch of the Islands — service worker.
   NETWORK-FIRST everywhere (assets are not content-hashed, and a past
   cache-first worker on another site served stale HTML for weeks — never
   again). The cache is an offline fallback, not the primary source. */
const CACHE = 'nightwatch-v5';
const ASSETS = [
  '/', '/index.html', '/manifest.webmanifest',
  '/js/sprites.js', '/js/data.js', '/js/music.js', '/js/game.js', '/js/touch.js',
  '/icons/icon-192.png', '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.ok && new URL(e.request.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true }).then(hit => {
          if (hit) return hit;
          if (e.request.mode === 'navigate') return caches.match('/index.html');
          return Response.error();
        })
      )
  );
});
