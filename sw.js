const CACHE = 'speakpro-v1';
const ASSETS = ['/', '/index.html', '/icon.svg', '/manifest.json'];

// Instalación: guardar archivos en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: caché primero, luego red (offline-first)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // No interceptar llamadas a APIs externas (Supabase, Anthropic)
  const url = e.request.url;
  if (url.includes('supabase.co') || url.includes('anthropic.com') || url.includes('googleapis.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
