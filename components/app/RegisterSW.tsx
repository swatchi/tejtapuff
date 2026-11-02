"use client";

import { useEffect } from "react";

/** Enregistre le service worker (nécessaire pour l'installation et, à l'étape 3, les notifications). */
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
  }, []);
  return null;
}
