// Service worker: guarda os arquivos do painel para abrir sem internet.
// Sempre que possível busca a versão mais nova na rede; se não houver
// internet, usa a cópia guardada. Não mexe no localStorage (dados do painel).
const CACHE = "dialetica-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icone.svg",
  "./icone-192.png",
  "./icone-512.png",
  "./vendor/react.production.min.js",
  "./vendor/react-dom.production.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
