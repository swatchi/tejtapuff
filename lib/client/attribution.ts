"use client";

/**
 * Suivi interne du parcours (sans cookie tiers, sans IP).
 * - un identifiant de visiteur aléatoire
 * - les paramètres UTM de la dernière vidéo cliquée (utm_content = id de la vidéo)
 * Conservés dans le navigateur 30 jours max, puis envoyés avec le paiement.
 */

const VID_KEY = "ttp_vid";
const UTM_KEY = "ttp_utm";
const UTM_TTL_MS = 30 * 24 * 3600 * 1000;
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export type Utm = Partial<Record<(typeof UTM_FIELDS)[number], string>>;

let memoryVid: string | null = null;

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Vieux navigateurs intégrés
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16),
  );
}

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* navigation privée : on garde en mémoire */
  }
}

export function visitorId(): string {
  const stored = storageGet(VID_KEY);
  if (stored) return stored;
  memoryVid ??= uuid();
  storageSet(VID_KEY, memoryVid);
  return memoryVid;
}

/** À appeler à l'arrivée sur le site : mémorise les UTM présents dans l'URL. */
export function captureUtm() {
  const params = new URLSearchParams(window.location.search);
  const utm: Utm = {};
  for (const f of UTM_FIELDS) {
    const v = params.get(f);
    if (v) utm[f] = v.slice(0, 200);
  }
  if (Object.keys(utm).length) storageSet(UTM_KEY, JSON.stringify({ utm, ts: Date.now() }));
}

export function getUtm(): Utm {
  const raw = storageGet(UTM_KEY);
  if (!raw) return {};
  try {
    const { utm, ts } = JSON.parse(raw) as { utm: Utm; ts: number };
    return Date.now() - ts < UTM_TTL_MS ? utm : {};
  } catch {
    return {};
  }
}

export type ClientStep = "visit" | "calc_used" | "quiz_start" | "paywall_view";

export function track(type: ClientStep) {
  const body = JSON.stringify({ vid: visitorId(), type, utm: getUtm() });
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* on tente fetch */
  }
  fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(
    () => {},
  );
}

/** N'envoie un événement qu'une fois par onglet. */
export function trackOnce(type: ClientStep, scope = "") {
  const key = `ttp_tracked_${type}_${scope}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* tant pis, on envoie */
  }
  track(type);
}
