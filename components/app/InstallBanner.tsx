"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { detectPlatform } from "@/lib/client/platform";

/** Petit bandeau « Installe l'app », masqué si déjà installée ou refermé. */
export function InstallBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("ttp_install_dismissed") === "1";
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(!dismissed && !detectPlatform().standalone);
  }, []);
  if (!show) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-encre bg-ciel p-3">
      <span aria-hidden className="text-2xl">📲</span>
      <Link href="/app/installer" className="flex-1 font-bold leading-tight underline-offset-4 hover:underline">
        Ajoute l&apos;app sur ton écran d&apos;accueil
      </Link>
      <button
        type="button"
        aria-label="Fermer"
        className="grid h-8 w-8 place-items-center rounded-full border-2 border-encre bg-white font-bold"
        onClick={() => {
          try {
            localStorage.setItem("ttp_install_dismissed", "1");
          } catch {
            /* ignore */
          }
          setShow(false);
        }}
      >
        ×
      </button>
    </div>
  );
}
