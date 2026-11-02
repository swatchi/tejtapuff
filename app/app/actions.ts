"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { MISSIONS } from "@/content/missions";
import { SOS } from "@/content/sos";
import { syncSubscription } from "@/lib/billing";
import { siteUrl } from "@/lib/env";
import { sendCancellation } from "@/lib/lifecycle-emails";
import { ACTIVE_STATUSES, getMember } from "@/lib/member";
import { isMissionUnlocked } from "@/lib/program";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSetting } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Actions de l'app. Chacune revérifie qui fait la requête (session Supabase)
 * avant d'écrire avec la clé serveur, uniquement sur les lignes de cette personne.
 */

const PROGRAM_IDS = MISSIONS.map((m) => m.id);

async function member() {
  const m = await getMember();
  if (!m) redirect("/connexion");
  return m;
}

async function activeMember() {
  const m = await member();
  if (!m.isActive) redirect("/app/compte");
  return m;
}

function refresh() {
  revalidatePath("/app", "layout");
}

/** « J'ai tej ma dernière puff » : démarre le compteur. */
export async function startProgram() {
  const m = await activeMember();
  if (!m.stats.currentStart) {
    const { error } = await supabaseAdmin().from("quit_attempts").insert({ user_id: m.user.id });
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  refresh();
  redirect("/app");
}

export async function completeMission(formData: FormData) {
  const missionId = String(formData.get("missionId") ?? "");
  const m = await activeMember();
  if (!isMissionUnlocked(missionId, m.day, PROGRAM_IDS)) return;
  const { error } = await supabaseAdmin()
    .from("mission_completions")
    .upsert({ user_id: m.user.id, mission_id: missionId }, { onConflict: "user_id,mission_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  refresh();
}

/** Fin d'un exercice SOS : envie surmontée. */
export async function logCravingOvercome(exerciseId: string) {
  if (!SOS.exercises.some((e) => e.id === exerciseId)) return { ok: false };
  const m = await activeMember();
  const { error } = await supabaseAdmin()
    .from("cravings")
    .insert({ user_id: m.user.id, exercise: exerciseId, outcome: "overcome" });
  if (error) throw new Error(error.message);
  refresh();
  return { ok: true, total: m.cravingsOvercome + 1 };
}

/** « J'ai craqué » : le compteur repart, l'historique reste. */
export async function relapse(formData: FormData) {
  const m = await activeMember();
  const db = supabaseAdmin();
  const now = new Date().toISOString();
  const fromSos = String(formData.get("exercise") ?? "");
  await db.from("quit_attempts").update({ ended_at: now }).eq("user_id", m.user.id).is("ended_at", null);
  const { error } = await db.from("quit_attempts").insert({ user_id: m.user.id, started_at: now });
  if (error && error.code !== "23505") throw new Error(error.message);
  if (SOS.exercises.some((e) => e.id === fromSos)) {
    await db.from("cravings").insert({ user_id: m.user.id, exercise: fromSos, outcome: "relapse" });
  }
  refresh();
  redirect("/app/craque?ok=1");
}

/** Résiliation : plus de prélèvement, accès jusqu'à la fin de la semaine payée. */
export async function cancelSubscription() {
  const m = await member();
  const sub = m.subscription;
  if (!sub || !ACTIVE_STATUSES.includes(sub.status) || sub.cancel_at_period_end) redirect("/app/compte");
  const updated = await stripe().subscriptions.update(sub.id, { cancel_at_period_end: true });
  await syncSubscription(updated, m.user.id);
  try {
    await sendCancellation({ userId: m.user.id, email: m.user.email, accessUntil: sub.current_period_end });
  } catch (err) {
    console.error("[cancellation email]", err);
  }
  refresh();
  redirect("/app/compte?resilie=1");
}

/** Annuler la résiliation tant que la semaine payée n'est pas finie. */
export async function resumeSubscription() {
  const m = await member();
  const sub = m.subscription;
  if (!sub || !sub.cancel_at_period_end || !ACTIVE_STATUSES.includes(sub.status)) redirect("/app/compte");
  const updated = await stripe().subscriptions.update(sub.id, { cancel_at_period_end: false });
  await syncSubscription(updated, m.user.id);
  refresh();
  redirect("/app/compte?repris=1");
}

/** Mise à jour de la carte (page sécurisée Stripe). */
export async function openPaymentUpdate() {
  const m = await member();
  const customer = m.profile?.stripe_customer_id;
  if (!customer) redirect("/app/compte");
  const configuration = (await getSetting("stripe_portal_configuration")) ?? undefined;
  const session = await stripe().billingPortal.sessions.create({
    customer,
    configuration,
    return_url: `${siteUrl()}/app/compte`,
    flow_data: { type: "payment_method_update" },
    locale: "fr",
  });
  redirect(session.url);
}

function ignoreMissing(err: unknown) {
  if (err instanceof Stripe.errors.StripeError && err.code === "resource_missing") return;
  throw err;
}

/**
 * Suppression du compte et de toutes les données.
 * - Stripe : abonnement arrêté, client supprimé (Stripe conserve les factures exigées par la loi).
 * - Supabase : le compte est supprimé, tout part en cascade ; les paiements restent, anonymisés, pour la compta.
 */
export async function deleteAccount() {
  const m = await member();
  const db = supabaseAdmin();
  const userId = m.user.id;
  const email = m.profile?.email ?? m.user.email;

  const { data: subs } = await db.from("subscriptions").select("id, status").eq("user_id", userId);
  for (const s of subs ?? []) {
    if (s.status !== "canceled" && s.status !== "incomplete_expired") {
      await stripe().subscriptions.cancel(s.id).catch(ignoreMissing);
    }
  }
  if (m.profile?.stripe_customer_id) {
    await stripe().customers.del(m.profile.stripe_customer_id).catch(ignoreMissing);
  }

  await db.from("subscriptions").update({ stripe_customer_id: null }).eq("user_id", userId);
  if (email) {
    // Quiz faits avec cet email mais jamais rattachés au compte, journaux d'emails
    await db.from("quiz_answers").delete().eq("email", email).is("user_id", null);
    await db.from("consents").delete().eq("email", email).is("user_id", null);
    await db.from("email_log").delete().eq("email", email);
  }
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Suppression du compte : ${error.message}`);

  const supabase = await supabaseServer();
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  redirect("/?compte=supprime");
}

