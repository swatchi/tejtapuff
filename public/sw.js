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

/* ───────── Notifications ───────── */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "TejTaPuff", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "TejTaPuff";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/app" },
      lang: "fr",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/app", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  // L'ancien abonnement a expiré : on se réabonne avec la même clé et on prévient le serveur.
  event.waitUntil(
    (async () => {
      const res = await fetch("/api/push/key");
      if (!res.ok) return;
      const { publicKey } = await res.json();
      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const raw = atob((publicKey + padding).replace(/-/g, "+").replace(/_/g, "/"));
      const key = Uint8Array.from(raw, (c) => c.charCodeAt(0));
      const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
        credentials: "include",
      });
    })(),
  );
});
