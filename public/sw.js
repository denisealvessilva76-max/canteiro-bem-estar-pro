// Canteiro Saudável — Service Worker
// Recebe Web Push (quando configurado) e exibe notificações locais agendadas.
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event) => {
  let data = { title: 'Canteiro Saudável', body: 'Lembrete', url: '/app/home' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) { /* noop */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url },
    vibrate: [120, 60, 120],
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/app/home';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) { if ('focus' in c) { c.navigate(url); return c.focus(); } }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// Mensagens do app principal — agenda notificação local via setTimeout
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'schedule-local') {
    const { delay, title, body, url } = msg;
    setTimeout(() => {
      self.registration.showNotification(title || 'Canteiro Saudável', {
        body: body || '', icon: '/icon-192.png', badge: '/icon-192.png',
        data: { url: url || '/app/home' }, vibrate: [120, 60, 120],
      });
    }, Math.max(0, delay || 0));
  }
});
