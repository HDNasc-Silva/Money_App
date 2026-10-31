/*
 * Service worker do Money App (PWA manual, sem plugin — ver DT-015).
 * - Navegação (HTML): network-first, com cópia em cache para abrir offline.
 * - Arquivos com hash do Vite (`assets/`): cache-first (o nome muda a cada build).
 * - Demais arquivos do próprio site (ícones, manifest): stale-while-revalidate.
 * - Requisições de outras origens (Google Fonts) seguem o comportamento padrão do navegador.
 * Atualize CACHE_VERSION a cada release: o `activate` apaga os caches de versões anteriores.
 * Caminhos relativos: funciona na raiz e em subcaminhos (ex.: GitHub Pages em /Money_App/).
 */
const CACHE_VERSION = 'v1.9.0';
const CACHE_PREFIX = 'money-app-';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

const scopeUrl = (path) => new URL(path, self.registration.scope).href;
const SHELL_URL = scopeUrl('./');
const PRECACHE = [
  './',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
].map(scopeUrl);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function putInCache(request, response) {
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    // O app usa HashRouter: toda navegação serve o mesmo index.html, guardado como app shell.
    await putInCache(SHELL_URL, response);
    return response;
  } catch {
    const cached = (await caches.match(SHELL_URL)) || (await caches.match(request));
    return cached || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return putInCache(request, await fetch(request));
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => putInCache(request, response))
    .catch(() => undefined);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !request.url.startsWith(self.registration.scope)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
  } else if (url.href.startsWith(scopeUrl('./assets/'))) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});
