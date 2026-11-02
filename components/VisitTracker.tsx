"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { captureUtm, trackOnce } from "@/lib/client/attribution";
import { loadPixels } from "@/lib/client/consent";

/** Mémorise les UTM à l'arrivée, compte la visite, charge les pixels si déjà acceptés. */
export function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    captureUtm();
    loadPixels();
    if (!pathname.startsWith("/app") && !pathname.startsWith("/admin")) trackOnce("visit");
  }, [pathname]);
  return null;
}
