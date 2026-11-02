"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, loadPixels, OPEN_BANNER_EVENT, readConsent, saveConsent } from "@/lib/client/consent";

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Lecture du choix après le montage (localStorage n'existe pas côté serveur).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(readConsent() === null);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_BANNER_EVENT, reopen);
    return () => window.removeEventListener(OPEN_BANNER_EVENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (ads: boolean) => {
    saveConsent(ads);
    if (ads) loadPixels();
    setOpen(false);
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookies"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="card mx-auto max-w-xl p-3">
        <p className="text-sm leading-snug">
          🍪 Pixels TikTok et Meta pour savoir quelle vidéo t&apos;a amené ici ? Rien n&apos;est chargé si tu refuses.{" "}
          <Link href="/legal/cookies" className="underline underline-offset-2">
            Détails
          </Link>
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-light min-h-11 py-1.5 text-base" onClick={() => choose(false)}>
            Refuser
          </button>
          <button type="button" className="btn btn-light min-h-11 py-1.5 text-base" onClick={() => choose(true)}>
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

export function ManageCookiesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_BANNER_EVENT))}
    >
      Gérer les cookies
    </button>
  );
}
