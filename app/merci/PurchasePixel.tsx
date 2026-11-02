"use client";

import { useEffect } from "react";
import { pixelEvent } from "@/lib/client/consent";

/** Conversion « achat » vers TikTok/Meta, une seule fois par paiement, si consentement. */
export function PurchasePixel({ sessionId, value }: { sessionId: string; value: number }) {
  useEffect(() => {
    const key = `ttp_purchase_${sessionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    pixelEvent("purchase", { value, eventId: sessionId });
  }, [sessionId, value]);
  return null;
}
