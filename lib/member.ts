import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { attemptStats, programDay, type Attempt } from "@/lib/program";
import { currentUser, supabaseServer } from "@/lib/supabase/server";

/** Statuts Stripe qui donnent accès à l'app (past_due = période de relance de paiement). */
export const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

export type Profile = {
  user_id: string;
  email: string;
  stripe_customer_id: string | null;
  vape_unit: string | null;
  units_per_week: number | null;
  units_per_month: number | null;
  unit_price_cents: number | null;
  vaping_since: string | null;
  triggers: string[];
  reasons: string[];
  start_date: string | null;
  timezone: string;
  notify_morning: boolean;
  notify_risk: boolean;
  notify_email: boolean;
  morning_hour: number;
};

export type Subscription = {
  id: string;
  status: string;
  price_cents: number | null;
  current_period_end: string | null;
  first_renewal_at: string | null;
  cancel_at_period_end: boolean;
};

/**
 * Toutes les données de l'utilisateur connecté, lues AVEC SA SESSION (donc soumises à la RLS).
 * Mis en cache pour la durée d'une requête.
 */
export const getMember = cache(async () => {
  await connection(); // toujours rendu à la requête, jamais pré-généré
  const user = await currentUser();
  if (!user) return null;
  const db = await supabaseServer();
  const [profileRes, subsRes, attemptsRes, completionsRes, cravingsRes] = await Promise.all([
    db
      .from("profiles")
      .select(
        "user_id, email, stripe_customer_id, vape_unit, units_per_week, units_per_month, unit_price_cents, vaping_since, triggers, reasons, start_date, timezone, notify_morning, notify_risk, notify_email, morning_hour",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    db
      .from("subscriptions")
      .select("id, status, price_cents, current_period_end, first_renewal_at, cancel_at_period_end")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
    db.from("quit_attempts").select("started_at, ended_at").eq("user_id", user.id).order("started_at"),
    db.from("mission_completions").select("mission_id").eq("user_id", user.id),
    db.from("cravings").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("outcome", "overcome"),
  ]);

  const profile = (profileRes.data as Profile | null) ?? null;
  const subscription = (subsRes.data?.[0] as Subscription | undefined) ?? null;
  const attempts = (attemptsRes.data as Attempt[] | null) ?? [];
  const now = new Date();
  const stats = attemptStats(attempts, now);
  const timeZone = profile?.timezone ?? "Europe/Paris";

  return {
    user: { id: user.id, email: user.email ?? profile?.email ?? "" },
    profile,
    subscription,
    isActive: Boolean(subscription && ACTIVE_STATUSES.includes(subscription.status)),
    attempts,
    stats,
    day: programDay(stats.firstStart, now, timeZone),
    completed: new Set((completionsRes.data ?? []).map((c: { mission_id: string }) => c.mission_id)),
    cravingsOvercome: cravingsRes.count ?? 0,
    timeZone,
    now,
  };
});

export type Member = NonNullable<Awaited<ReturnType<typeof getMember>>>;

/** À appeler en haut de chaque page de l'app. */
export async function requireMember(opts: { allowInactive?: boolean } = {}): Promise<Member> {
  const m = await getMember();
  if (!m) redirect("/connexion");
  if (!opts.allowInactive && !m.isActive) redirect("/app/compte");
  return m;
}
