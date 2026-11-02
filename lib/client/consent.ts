"use client";

/**
 * Consentement cookies (CNIL) : les pixels TikTok et Meta ne sont chargés
 * QU'APRÈS un clic sur « Accepter ». Refuser est aussi simple qu'accepter.
 * Le choix est gardé 6 mois, puis redemandé.
 */

const KEY = "ttp_consent";
const MAX_AGE_MS = 182 * 24 * 3600 * 1000;
export const CONSENT_EVENT = "ttp:consent";
export const OPEN_BANNER_EVENT = "ttp:open-cookie-banner";

export type ConsentChoice = { ads: boolean; ts: number; v: 1 };

export function readConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as ConsentChoice;
    if (c.v !== 1 || Date.now() - c.ts > MAX_AGE_MS) return null;
    return c;
  } catch {
    return null;
  }
}

export function saveConsent(ads: boolean) {
  const previous = readConsent();
  const choice: ConsentChoice = { ads, ts: Date.now(), v: 1 };
  try {
    localStorage.setItem(KEY, JSON.stringify(choice));
  } catch {
    /* navigation privée */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
  // Retrait du consentement : on recharge pour décharger les pixels.
  if (previous?.ads && !ads) window.location.reload();
}

declare global {
  interface Window {
    ttq?: { track: (event: string, params?: object, options?: object) => void };
    fbq?: (...args: unknown[]) => void;
  }
}

let loaded = false;

function inlineScript(code: string) {
  const s = document.createElement("script");
  s.text = code;
  document.head.appendChild(s);
}

const SAFE_ID = /^[A-Za-z0-9_-]{5,40}$/;

/** Charge les pixels (une seule fois), uniquement si consentement publicitaire. */
export function loadPixels() {
  if (loaded || !readConsent()?.ads) return;
  loaded = true;
  const tiktokId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  // Snippets officiels TikTok et Meta, à l'identique.
  if (tiktokId && SAFE_ID.test(tiktokId)) {
    inlineScript(`!function (w, d, t) {
w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
ttq.load('${tiktokId}');
ttq.page();
}(window, document, 'ttq');`);
  }

  if (metaId && SAFE_ID.test(metaId)) {
    inlineScript(`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaId}');
fbq('track', 'PageView');`);
  }
}

type PixelEvent = "quiz_done" | "checkout" | "purchase";

/** Événement de conversion vers les 2 régies (ignoré sans consentement). */
export function pixelEvent(event: PixelEvent, opts: { value?: number; eventId?: string } = {}) {
  if (!readConsent()?.ads) return;
  loadPixels();
  const money = opts.value != null ? { value: opts.value, currency: "EUR" } : {};
  const dedup = opts.eventId ? { event_id: opts.eventId } : {};
  const tt = { quiz_done: "CompleteRegistration", checkout: "InitiateCheckout", purchase: "CompletePayment" }[event];
  const fb = { quiz_done: "Lead", checkout: "InitiateCheckout", purchase: "Purchase" }[event];
  try {
    window.ttq?.track(tt, money, dedup);
    window.fbq?.("track", fb, money, opts.eventId ? { eventID: opts.eventId } : {});
  } catch {
    /* un pixel ne doit jamais casser la page */
  }
}
