/* TAB — service worker for push notifications */
self.addEventListener('push', function(event){
  var data={};
  try{ data = event.data ? event.data.json() : {}; }catch(e){ data = { body: (event.data && event.data.text && event.data.text()) || '' }; }
  var title = data.title || 'TAB';
  var opts = {
    body: data.body || 'יש תשלומים שדורשים תשומת לב',
    dir: 'rtl',
    lang: 'he',
    tag: data.tag || 'tab-reminder',
    renotify: true,
    icon: data.icon || 'icon-192.png',
    badge: data.badge || 'icon-192.png',
    data: { url: data.url || './' }
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for (var i=0;i<list.length;i++){ var c=list[i]; if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
