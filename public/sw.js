const CACHE_NAME = 'voyaframe-shell-v4'
const APP_SHELL = ['site.webmanifest', 'favicon.svg', 'earth-blue-marble.jpg']

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME)
  const indexUrl = new URL('./', self.registration.scope)
  const indexResponse = await fetch(indexUrl, { cache: 'no-cache' })
  if (!indexResponse.ok) throw new Error(`Unable to precache app shell: ${indexResponse.status}`)
  await cache.put(indexUrl, indexResponse.clone())
  const html = await indexResponse.text()
  const linkedAssets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], indexUrl))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => url.href)
  const assetUrls = [...new Set([...APP_SHELL.map((path) => new URL(path, indexUrl).href), ...linkedAssets])]
  await cache.addAll(assetUrls)
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAppShell())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(new URL('./', self.registration.scope), copy))
      return response
    }).catch(() => caches.match(new URL('./', self.registration.scope))))
    return
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()))
    return response
  })))
})
