import "server-only";
import { siteUrl } from "@/lib/env";
import { attemptStats, savedEuros, streakDays, type Attempt } from "@/lib/program";
import { unitsPerWeekOf } from "@/lib/savings";
import { sign } from "@/lib/signing";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type CardStats = { started: boolean; day: number; saved: number; cravings: number };

/** Chiffres de la carte à partager : uniquement des données réelles, lues en base. */
export async function cardStats(userId: string): Promise<CardStats | null> {
  const db = supabaseAdmin();
  const [profileRes, attemptsRes, cravingsRes] = await Promise.all([
    db.from("profiles").select("units_per_week, units_per_month, unit_price_cents").eq("user_id", userId).maybeSingle(),
    db.from("quit_attempts").select("started_at, ended_at").eq("user_id", userId),
    db.from("cravings").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("outcome", "overcome"),
  ]);
  if (!profileRes.data) return null;
  const stats = attemptStats((attemptsRes.data as Attempt[] | null) ?? [], new Date());
  const p = profileRes.data as { units_per_week: number | null; units_per_month: number | null; unit_price_cents: number | null };
  return {
    started: Boolean(stats.currentStart),
    // « Jour 12 sans puff » = 11 jours complets + aujourd'hui
    day: stats.currentStart ? streakDays(stats.currentMs) + 1 : 0,
    saved: savedEuros(stats.totalMs, unitsPerWeekOf(p), p.unit_price_cents ?? 0),
    cravings: cravingsRes.count ?? 0,
  };
}

/** Chemin (signé) de l'image de la carte, pour l'afficher dans l'app. */
export function cardImagePath(userId: string): string {
  return `/api/story-card?u=${encodeURIComponent(userId)}&s=${sign("card", userId)}`;
}

/** Lien public complet (signé) vers l'image de la carte, pour les emails. */
export function cardImageUrl(userId: string): string {
  return `${siteUrl()}${cardImagePath(userId)}`;
}
