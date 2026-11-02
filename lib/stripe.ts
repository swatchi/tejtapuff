import "server-only";
import Stripe from "stripe";
import { FIRST_WEEK, FIRST_WEEK_DISCOUNT_CENTS, PRICING } from "@/config/pricing";
import { requireEnv } from "@/lib/env";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!client) {
    client = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      appInfo: { name: "TejTaPuff" },
      maxNetworkRetries: 2,
    });
  }
  return client;
}

const PRODUCT_ID = "tejtapuff_programme";

type Catalog = { priceId: string; couponId: string };
let catalogCache: { key: string; value: Catalog } | null = null;

function isMissing(err: unknown) {
  return err instanceof Stripe.errors.StripeError && err.code === "resource_missing";
}
function alreadyExists(err: unknown) {
  return err instanceof Stripe.errors.StripeError && err.code === "resource_already_exists";
}

/**
 * Crée (une seule fois) dans Stripe le produit, le prix hebdo et la remise
 * de 1re semaine qui correspondent à config/pricing.ts.
 * Si tu changes un prix dans la config, un nouveau prix/coupon est créé
 * automatiquement ; les abonnés existants gardent leur ancien prix.
 */
export async function ensureCatalog(): Promise<Catalog> {
  const key = `${PRICING.weeklyCents}_${PRICING.firstWeekCents}`;
  if (catalogCache?.key === key) return catalogCache.value;
  const s = stripe();

  try {
    await s.products.retrieve(PRODUCT_ID);
  } catch (err) {
    if (!isMissing(err)) throw err;
    try {
      await s.products.create({
        id: PRODUCT_ID,
        name: "TejTaPuff : programme pour arrêter la puff",
        description: "Accès à l'app TejTaPuff, renouvelé chaque semaine, sans engagement.",
      });
    } catch (e) {
      if (!alreadyExists(e)) throw e;
    }
  }

  const lookupKey = `ttp_weekly_${PRICING.weeklyCents}`;
  const found = await s.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  const price =
    found.data[0] ??
    (await s.prices.create({
      product: PRODUCT_ID,
      currency: PRICING.currency,
      unit_amount: PRICING.weeklyCents,
      recurring: { interval: "week", interval_count: 1 },
      tax_behavior: "inclusive",
      lookup_key: lookupKey,
      nickname: "Hebdo",
    }));

  const couponId = `ttp_first_week_${key}`;
  try {
    await s.coupons.retrieve(couponId);
  } catch (err) {
    if (!isMissing(err)) throw err;
    try {
      await s.coupons.create({
        id: couponId,
        name: `1re semaine à ${FIRST_WEEK}`,
        amount_off: FIRST_WEEK_DISCOUNT_CENTS,
        currency: PRICING.currency,
        duration: "once",
      });
    } catch (e) {
      if (!alreadyExists(e)) throw e;
    }
  }

  const value = { priceId: price.id, couponId };
  catalogCache = { key, value };
  return value;
}

/** Fin de la période payée en cours (le champ est porté par l'item depuis l'API 2025). */
export function periodEnd(sub: Stripe.Subscription): Date | null {
  const ends = sub.items.data.map((i) => i.current_period_end).filter(Boolean);
  return ends.length ? new Date(Math.min(...ends) * 1000) : null;
}

export function customerId(c: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}
