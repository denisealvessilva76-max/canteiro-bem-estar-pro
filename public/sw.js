// Canteiro Saudável — Service Worker
// Recebe Web Push (quando configurado) e exibe notificações locais agendadas.
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', (event) => {
  let data = { title: 'Canteiro Saudável', body: 'Lembrete', url: '/app/home', tag: undefined };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) { /* noop */ }
  event.waitUntil((async () => {
    await self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url },
      vibrate: [120, 60, 120],
      tag: data.tag,         // mesmo tag substitui notificação anterior do mesmo tipo
      renotify: !!data.tag,
    });
    try {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of clients) c.postMessage({ type: 'push-recebido-diagnostico', data });
    } catch (_) { /* noop */ }
  })());
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

self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'canteiro-workday-reminder') return;

  event.waitUntil((async () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 6 || hour > 20) return;

    await self.registration.showNotification('Canteiro Saudável', {
      body: 'Passe no app para fazer seu check-in e registrar seus cuidados de hoje.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: '/app/home' },
      vibrate: [120, 60, 120],
      tag: 'canteiro-workday-reminder',
      renotify: false,
    });
  })());
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
