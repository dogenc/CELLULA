// CELLULA Service Worker: Offline-Speicherung auf Anforderung („Für offline speichern“).
const CACHE = 'cellula-atlas-03';
const SHELL = ['/', '/index.html', '/style.css', '/app.js', '/util.js', '/layout.js', '/sections.js', '/cartoon.js', '/cells.js', '/division.js', '/synthesis.js', '/energy.js', '/molecules.js', '/knowledge.js', '/icon.svg', '/manifest.webmanifest', '/vendor/three.module.js', '/vendor/three.core.js', '/vendor/OrbitControls.js', '/assets/molecules.json'];
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Netzwerk zuerst, damit Updates ankommen; gespeicherte Kopie nur ohne Verbindung.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).catch(() => caches.match(r, {ignoreSearch: true}).then(c => c || (r.mode === 'navigate' ? caches.match('/index.html') : Response.error()))));
});
self.addEventListener('message', e => {
  if (e.data?.type !== 'cache-all') return;
  const urls = [...SHELL, ...(e.data.urls || [])], client = e.source;
  e.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      let done = 0;
      for (const u of urls) {
        const res = await fetch(u, {cache: 'reload'});
        if (!res.ok) throw Error(u);
        await cache.put(u, res);
        client?.postMessage({type: 'offline-progress', done: ++done, total: urls.length});
      }
      client?.postMessage({type: 'offline-ready'});
    } catch {
      client?.postMessage({type: 'offline-error'});
    }
  })());
});

