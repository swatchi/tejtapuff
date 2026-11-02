import { NextResponse } from "next/server";
import { PRICING } from "@/config/pricing";
import { handleError } from "@/lib/api";
import { requireEnv } from "@/lib/env";
import { sendFirstRenewalReminder, sendWelcome } from "@/lib/lifecycle-emails";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Tâche planifiée (Vercel Cron, toutes les heures — voir vercel.json).
 * 1. Rappel obligatoire 48 h avant le 1er prélèvement au prix plein.
 * 2. Filet de sécurité : email de bienvenue s'il n'est pas parti au moment du paiement.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${requireEnv("CRON_SECRET")}`) {
    return new Response("Non autorisé", { status: 401 });
  }
  try {
    const db = supabaseAdmin();
    const now = new Date();
    const horizon = new Date(now.getTime() + PRICING.reminderHoursBeforeFirstRenewal * 3600_000);
    const result = { reminders: 0, welcomes: 0, errors: 0 };

    const emailOf = async (userId: string) => {
      const { data } = await db.from("profiles").select("email").eq("user_id", userId).maybeSingle();
      return (data?.email as string | undefined) ?? null;
    };

    // 1. Rappels 48 h
    const { data: due } = await db
      .from("subscriptions")
      .select("id, user_id, first_renewal_at, price_cents")
      .in("status", ["active", "trialing"])
      .eq("cancel_at_period_end", false)
      .not("user_id", "is", null)
      .gt("first_renewal_at", now.toISOString())
      .lte("first_renewal_at", horizon.toISOString());
    for (const s of due ?? []) {
      try {
        const email = await emailOf(s.user_id);
        if (email && (await sendFirstRenewalReminder({ subscriptionId: s.id, userId: s.user_id, email, renewalAt: s.first_renewal_at, priceCents: s.price_cents }))) {
          result.reminders++;
        }
      } catch (err) {
        result.errors++;
        console.error("[cron reminder]", s.id, err);
      }
    }

    // 2. Bienvenue manquée (abonnements des 3 derniers jours)
    const since = new Date(now.getTime() - 3 * 24 * 3600_000).toISOString();
    const { data: recent } = await db
      .from("subscriptions")
      .select("user_id, first_renewal_at")
      .in("status", ["active", "trialing"])
      .not("user_id", "is", null)
      .gte("created_at", since);
    for (const s of recent ?? []) {
      try {
        const email = await emailOf(s.user_id);
        if (email && (await sendWelcome({ userId: s.user_id, email, firstRenewalAt: s.first_renewal_at }))) result.welcomes++;
      } catch (err) {
        result.errors++;
        console.error("[cron welcome]", s.user_id, err);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return handleError("cron", err);
  }
}
