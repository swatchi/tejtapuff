import type Stripe from "stripe";
import { provisionFromCheckout, recordInvoice, syncSubscription } from "@/lib/billing";
import { requireEnv } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Webhook Stripe : source de vérité des paiements et des statuts d'abonnement.
 * Événements à cocher dans Stripe (voir README) :
 * checkout.session.completed, checkout.session.async_payment_succeeded,
 * customer.subscription.created / updated / deleted / paused / resumed,
 * invoice.paid, invoice.payment_failed
 */
export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Signature manquante", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  } catch (err) {
    console.error("[stripe webhook] signature invalide", err);
    return new Response("Signature invalide", { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: seen } = await db.from("stripe_events").select("id").eq("id", event.id).maybeSingle();
  if (seen) return new Response("Déjà traité", { status: 200 });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await provisionFromCheckout(event.data.object.id);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        // On relit l'état actuel chez Stripe : les webhooks peuvent arriver dans le désordre.
        await syncSubscription(await stripe().subscriptions.retrieve(event.data.object.id));
        break;

      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoiceId = event.data.object.id;
        if (invoiceId) {
          const invoice = await stripe().invoices.retrieve(invoiceId);
          await recordInvoice(invoice, event.type === "invoice.payment_failed");
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe webhook] ${event.type} ${event.id}`, err);
    // 500 → Stripe réessaiera automatiquement plus tard.
    return new Response("Erreur de traitement", { status: 500 });
  }

  await db.from("stripe_events").insert({ id: event.id, type: event.type });
  return new Response("OK", { status: 200 });
}
