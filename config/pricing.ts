/**
 * TOUS les prix de TejTaPuff sont ici. Change un chiffre → il change partout
 * (landing, paywall, Stripe Checkout, emails, CGV affichées).
 *
 * Montants en centimes, TTC.
 */
export const PRICING = {
  currency: "eur",
  /** Prix payé pour la 1re semaine */
  firstWeekCents: 499,
  /** Prix de chaque semaine suivante */
  weeklyCents: 1499,
  /** Rappel envoyé avant le 1er prélèvement au prix plein */
  reminderHoursBeforeFirstRenewal: 48,
} as const;

const fmt = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

/** 499 → "4,99 €" */
export function euros(cents: number): string {
  return fmt.format(cents / 100);
}

export const FIRST_WEEK = euros(PRICING.firstWeekCents);
export const WEEKLY = euros(PRICING.weeklyCents);

/** Phrase de prix complète, affichée partout où on parle d'argent. */
export const PRICE_SENTENCE = `${FIRST_WEEK} la 1re semaine, puis ${WEEKLY}/semaine. Sans engagement, résiliable en 1 clic.`;

/** Remise appliquée à la 1re facture Stripe (prix plein − prix 1re semaine). */
export const FIRST_WEEK_DISCOUNT_CENTS = PRICING.weeklyCents - PRICING.firstWeekCents;
