/* ==========================================================================
   ESG 360 · Service Worker (offline-first)
   Autor: Miguel Ángel Layunta López
   ========================================================================== */
const VERSION = '1.0.0';
const CACHE = 'esg360-' + VERSION;
const CORE = ['./', './index.html', './styles.css', './data.js', './app.js', './manifest.webmanifest', './icons/icon.svg'];
const EXTRA = ['https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE).catch(() => {});
    for (const u of EXTRA) { try { await c.add(new Request(u, { mode:'cors' })); } catch (err) {} }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.includes('/api/')) return; // las llamadas a API van siempre a red

  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const cached = await c.match(req, { ignoreSearch:true });
    if (cached) { revalidate(req, c); return cached; }
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && (url.origin === location.origin || url.hostname.includes('jsdelivr'))) {
        c.put(req, res.clone());
      }
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const shell = await c.match('./index.html');
        if (shell) return shell;
      }
      return new Response('Recurso no disponible sin conexión', { status:503, headers:{ 'Content-Type':'text/plain; charset=utf-8' } });
    }
  })());
});

async function revalidate(req, c) {
  try {
    const res = await fetch(req);
    if (res && res.status === 200) c.put(req, res.clone());
  } catch (e) {}
}
