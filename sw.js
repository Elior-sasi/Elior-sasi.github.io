/* TAB — service worker: offline app shell + push notifications */
var CACHE='tab-shell-v1';

/* ---- offline shell ---- */
self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(['./','./index.html']).catch(function(){});}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){if(k!==CACHE)return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url;try{url=new URL(req.url);}catch(_){return;}
  if(url.origin!==self.location.origin)return;            // Firebase/Google/etc. pass straight through
  var isDoc=req.mode==='navigate'||(req.headers.get('accept')||'').indexOf('text/html')>=0;
  if(isDoc){
    // network-first: online users always get the freshest upload; offline falls back to the last cached copy
    e.respondWith(
      fetch(req).then(function(res){var copy=res.clone();caches.open(CACHE).then(function(c){c.put('./index.html',copy);});return res;})
        .catch(function(){return caches.match('./index.html').then(function(m){return m||caches.match('./');});})
    );
    return;
  }
  // other same-origin GETs: cache-first with lazy fill
  e.respondWith(caches.match(req).then(function(m){
    return m||fetch(req).then(function(res){var copy=res.clone();caches.open(CACHE).then(function(c){c.put(req,copy);});return res;}).catch(function(){return m;});
  }));
});

/* ---- push notifications ---- */
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
