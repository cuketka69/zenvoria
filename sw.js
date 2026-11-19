/* ZENVORIA service worker — jen push notifikace (žádné offline cachování,
   aby se po deployi nikdy nezobrazovala stará verze aplikace). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'ZENVORIA';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || '/', link: data.link || '' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url, link } = event.notification.data || {};
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = all.find((c) => new URL(c.url).origin === self.location.origin);
    if (client) {
      await client.focus();
      client.postMessage({ type: 'zv-open-link', link: link || '' });
      return;
    }
    await self.clients.openWindow(url || '/');
  })());
});
