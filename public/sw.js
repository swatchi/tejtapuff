/* TejTaPuff — service worker.
 * Étape 2 : rend l'app installable et affiche une page simple hors connexion.
 * Étape 3 : recevra les notifications push.
 */
const OFFLINE_HTML = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hors connexion</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#ffd43b;color:#1b1a17;font-family:system-ui,sans-serif;padding:24px;text-align:center}h1{font-size:28px;margin:0 0 8px}</style></head>
<body><div><h1>Pas de réseau 📵</h1><p>Reconnecte-toi pour ouvrir TejTaPuff.<br>Une envie ? Respire : 4 secondes pour inspirer, 6 pour expirer. Ça va passer.</p></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => new Response(OFFLINE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } })),
  );
});
