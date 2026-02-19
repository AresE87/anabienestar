/* ═══════════════════════════════════════════════════
   Service Worker — Anabienestar Integral
   PWA Offline + Push Notifications
   ═══════════════════════════════════════════════════ */

const CACHE_NAME = 'anabienestar-v3';
const OFFLINE_URL = '/';

// Assets to pre-cache for offline support
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// ── Install ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch (Network first, fallback to cache) ─
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip supabase API calls — always go to network
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return the offline page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ── Push Notifications ───────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: 'Anabienestar Integral',
    body: 'Tienes una nueva notificacion',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'anabienestar-notification',
    data: { url: '/' }
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
        icon: payload.icon || '/logo192.png',
        badge: payload.badge || '/logo192.png',
        data: { url: payload.url || '/' }
      };
    }
  } catch (e) {
    // If parsing fails, use text
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Abrir app' }
      ],
      data: data.data
    })
  );
});

// ── Notification Click ───────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(url);
    })
  );
});
