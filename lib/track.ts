import "server-only";
import type { Utm } from "@/lib/quiz-schema";
import { configured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const FUNNEL_STEPS = [
  "visit",
  "calc_used",
  "quiz_start",
  "quiz_done",
  "paywall_view",
  "checkout_start",
  "paid",
] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

/** Navigateur d'origine, déduit du user-agent (on ne stocke PAS le user-agent). */
export function browserFamily(ua: string | null): { browser: string; device: string } {
  const s = ua ?? "";
  const browser = /musical_ly|BytedanceWebview|TikTok|trill/i.test(s)
    ? "tiktok"
    : /Instagram/i.test(s)
      ? "instagram"
      : /FBAN|FBAV|FB_IAB/i.test(s)
        ? "facebook"
        : "other";
  const device = /iPhone|iPad|iPod/i.test(s) ? "ios" : /Android/i.test(s) ? "android" : "desktop";
  return { browser, device };
}

/** Enregistre une étape du parcours. Ne fait jamais échouer la requête appelante. */
export async function recordFunnelEvent(params: {
  visitorId: string;
  type: FunnelStep;
  utm?: Utm;
  userAgent?: string | null;
}) {
  if (!configured.supabase()) return;
  const { browser, device } = browserFamily(params.userAgent ?? null);
  const { error } = await supabaseAdmin().from("funnel_events").insert({
    visitor_id: params.visitorId,
    type: params.type,
    utm_source: params.utm?.utm_source ?? null,
    utm_medium: params.utm?.utm_medium ?? null,
    utm_campaign: params.utm?.utm_campaign ?? null,
    utm_content: params.utm?.utm_content ?? null,
    utm_term: params.utm?.utm_term ?? null,
    browser,
    device,
  });
  if (error) console.error("funnel_events", error.message);
}
