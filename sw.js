// Najpierw sieć, potem pamięć podręczna: online zawsze najnowsza wersja,
// offline ostatnia zapisana.
const CACHE = 'workout-v7';
const SHELL = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest', 'icon.svg',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
  'js/app.js', 'js/data.js', 'js/store.js', 'js/txt.js', 'js/util.js', 'js/stats.js', 'js/charts.js', 'js/units.js', 'js/csv.js', 'js/guides.js', 'js/guide-images.js', 'js/fit.js', 'js/privacy.js',
  'js/ui/core.js', 'js/ui/files.js', 'js/ui/hold.js', 'js/views/calendar.js', 'js/views/day.js', 'js/views/exercises.js', 'js/views/guide.js', 'js/views/progress.js', 'js/views/settings.js', 'js/views/templates.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
