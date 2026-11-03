import "server-only";
import type Stripe from "stripe";
import type { QuizAnswers } from "@/lib/quiz-schema";
import { customerId, periodEnd, stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendPaymentFailed, sendWelcome } from "@/lib/lifecycle-emails";
import { recordFunnelEvent } from "@/lib/track";

const WEEK_SECONDS = 7 * 24 * 3600;

const iso = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toISOString() : null);

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Id Supabase du compte lié à cet email, ou null. Sans effet de bord. */
export async function userIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin().rpc("user_id_by_email", { p_email: normalizeEmail(email) });
  if (error) throw new Error(`user_id_by_email : ${error.message}`);
  return (data as string | null) ?? null;
}

async function findOrCreateUser(email: string): Promise<string> {
  const existing = await userIdByEmail(email);
  if (existing) return existing;
  const { data, error } = await supabaseAdmin().auth.admin.createUser({ email, email_confirm: true });
  if (data?.user) return data.user.id;
  // Course possible entre le webhook et la page /merci : l'autre a créé le compte entre-temps.
  const again = await userIdByEmail(email);
  if (again) return again;
  throw new Error(`Création du compte impossible : ${error?.message}`);
}

/** Abonnement « en cours » pour cet email (pour éviter un double abonnement). */
export async function hasLiveSubscription(email: string): Promise<boolean> {
  const userId = await userIdByEmail(email);
  if (!userId) return false;
  const { data } = await supabaseAdmin()
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["active", "past_due", "trialing", "unpaid"])
    .limit(1);
  return Boolean(data?.length);
}

/**
 * Miroir d'un abonnement Stripe dans Supabase. Idempotent.
 * Retourne true si l'abonnement vient d'être créé chez nous.
 */
export async function syncSubscription(sub: Stripe.Subscription, knownUserId?: string): Promise<boolean> {
  const db = supabaseAdmin();
  const custId = customerId(sub.customer);
  let userId = knownUserId ?? null;
  if (!userId && custId) {
    const { data } = await db.from("profiles").select("user_id").eq("stripe_customer_id", custId).maybeSingle();
    userId = data?.user_id ?? null;
  }
  // Compte pas encore créé (webhook arrivé avant checkout.session.completed) :
  // provisionFromCheckout s'en chargera.
  if (!userId) return false;

  const row = {
    id: sub.id,
    user_id: userId,
    stripe_customer_id: custId,
    status: sub.status,
    price_cents: sub.items.data[0]?.price?.unit_amount ?? null,
    current_period_end: periodEnd(sub)?.toISOString() ?? null,
    cancel_at_period_end: sub.cancel_at_period_end || Boolean(sub.cancel_at),
    canceled_at: iso(sub.canceled_at),
    ended_at: iso(sub.ended_at),
    utm_source: sub.metadata?.utm_source || null,
    utm_campaign: sub.metadata?.utm_campaign || null,
    utm_content: sub.metadata?.utm_content || null,
  };

  const { data: inserted, error: insertError } = await db
    .from("subscriptions")
    .upsert(
      { ...row, first_renewal_at: iso(sub.start_date + WEEK_SECONDS) },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id");
  if (insertError) throw new Error(`subscriptions insert : ${insertError.message}`);

  const created = Boolean(inserted?.length);
  if (!created) {
    const { error } = await db.from("subscriptions").update(row).eq("id", sub.id);
    if (error) throw new Error(`subscriptions update : ${error.message}`);
  }
  return created;
}

/**
 * Appelé par le webhook ET par la page /merci (le premier qui passe gagne,
 * l'autre ne fait rien de plus). Crée le compte, rattache le quiz, enregistre
 * l'abonnement. Retourne null si le paiement n'est pas (encore) validé.
 */
export async function provisionFromCheckout(
  sessionId: string,
): Promise<{ email: string; userId: string } | null> {
  const session = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  if (session.mode !== "subscription" || session.status !== "complete" || session.payment_status !== "paid") {
    return null;
  }
  const rawEmail = session.customer_details?.email ?? session.customer_email;
  if (!rawEmail) throw new Error(`Session Stripe ${session.id} sans email`);
  const email = normalizeEmail(rawEmail);
  const db = supabaseAdmin();
  const userId = await findOrCreateUser(email);

  const profile: Record<string, unknown> = {
    user_id: userId,
    email,
    stripe_customer_id: customerId(session.customer),
  };

  const quizId = session.metadata?.quiz_id || null;
  if (quizId) {
    const { data: quiz } = await db
      .from("quiz_answers")
      .select("id, answers, user_id")
      .eq("id", quizId)
      .maybeSingle();
    if (quiz && (!quiz.user_id || quiz.user_id === userId)) {
      const a = quiz.answers as QuizAnswers & { perWeek?: number };
      // Les quiz d'avant le passage « par mois » contenaient perWeek.
      const perMonth = a.perMonth ?? (a.perWeek ? (a.perWeek * 52) / 12 : null);
      Object.assign(profile, {
        quiz_id: quiz.id,
        vape_unit: a.unit,
        units_per_month: perMonth === null ? null : Math.round(perMonth * 100) / 100,
        units_per_week: perMonth === null ? null : Math.round(((perMonth * 12) / 52) * 100) / 100,
        unit_price_cents: Math.round(a.unitPrice * 100),
        vaping_since: a.since,
        triggers: a.triggers,
        reasons: a.reasons,
        start_date: a.startDate,
      });
      await db.from("quiz_answers").update({ user_id: userId }).eq("id", quiz.id);
      await db.from("consents").update({ user_id: userId }).eq("quiz_id", quiz.id);
    }
  }

  let { error: profileError } = await db.from("profiles").upsert(profile, { onConflict: "user_id" });
  if (profileError && /units_per_month/.test(profileError.message)) {
    // Migration 0004 pas encore appliquée : on enregistre sans la colonne mensuelle.
    delete profile.units_per_month;
    ({ error: profileError } = await db.from("profiles").upsert(profile, { onConflict: "user_id" }));
  }
  if (profileError) throw new Error(`profiles upsert : ${profileError.message}`);

  const sub = session.subscription;
  if (sub && typeof sub !== "string") {
    const created = await syncSubscription(sub, userId);
    try {
      await sendWelcome({ userId, email, firstRenewalAt: iso(sub.start_date + WEEK_SECONDS) });
    } catch (err) {
      // Pas bloquant : la tâche horaire réessaiera.
      console.error("[welcome email]", err);
    }
    if (created && session.metadata?.visitor_id) {
      await recordFunnelEvent({
        visitorId: session.metadata.visitor_id,
        type: "paid",
        utm: {
          utm_source: session.metadata.utm_source,
          utm_medium: session.metadata.utm_medium,
          utm_campaign: session.metadata.utm_campaign,
          utm_content: session.metadata.utm_content,
          utm_term: session.metadata.utm_term,
        },
      });
    }
  }
  return { email, userId };
}

/** Miroir d'une facture Stripe (1re semaine ou renouvellement) dans `payments`. */
export async function recordInvoice(invoice: Stripe.Invoice, failed = false): Promise<void> {
  const db = supabaseAdmin();
  const custId = customerId(invoice.customer);
  let userId: string | null = null;
  if (custId) {
    const { data } = await db.from("profiles").select("user_id").eq("stripe_customer_id", custId).maybeSingle();
    userId = data?.user_id ?? null;
  }
  const subRef = invoice.parent?.subscription_details?.subscription ?? null;
  const subscriptionId = typeof subRef === "string" ? subRef : (subRef?.id ?? null);
  const paid = invoice.status === "paid";

  const { error } = await db.from("payments").upsert(
    {
      id: invoice.id,
      user_id: userId,
      subscription_id: subscriptionId,
      amount_cents: paid ? invoice.amount_paid : invoice.amount_due,
      currency: invoice.currency,
      status: paid ? "paid" : failed ? "failed" : (invoice.status ?? "open"),
      billing_reason: invoice.billing_reason,
      paid_at: iso(invoice.status_transitions?.paid_at),
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`payments upsert : ${error.message}`);

  if (failed && userId && invoice.id) {
    const { data: profile } = await db.from("profiles").select("email").eq("user_id", userId).maybeSingle();
    if (profile?.email) {
      try {
        await sendPaymentFailed({ invoiceId: invoice.id, userId, email: profile.email, amountCents: invoice.amount_due });
      } catch (err) {
        console.error("[payment failed email]", err);
      }
    }
  }

  if (subscriptionId) {
    await syncSubscription(await stripe().subscriptions.retrieve(subscriptionId));
  }
}
