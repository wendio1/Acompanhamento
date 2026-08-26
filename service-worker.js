// Service worker simples: guarda uma cópia da própria página em cache
// para o app abrir mais rápido e não quebrar se a conexão cair por um
// instante. Os dados (inscritos, views, vídeos) continuam vindo sempre
// da internet — só a "casca" da página fica em cache.
const CACHE_NAME = 'central-transmissao-v1';
const APP_SHELL = ['./painel-youtube.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nunca cacheia chamadas à API do YouTube — sempre busca dado fresco.
  if (event.request.url.includes('googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok){
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
