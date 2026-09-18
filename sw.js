const CACHE_NAME = 'oxford-books-1789704236091';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './icon.svg',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 仅缓存同源静态资源，避免把带账号权限的 Supabase 响应写入本机缓存。
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const isCacheable = event.request.method === 'GET'
    && requestUrl.origin === self.location.origin;
  const networkRequest = event.request.mode === 'navigate'
    ? new Request(event.request, { cache: 'no-store' })
    : event.request;

  event.respondWith(
    fetch(networkRequest)
      .then((response) => {
        if (isCacheable && response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => isCacheable ? caches.match(event.request) : Response.error())
  );
});
