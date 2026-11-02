/** Calculs d'argent partagés par le calculateur, le plan et (plus tard) le tableau de bord. */

export function weeklyCost(perWeek: number, unitPrice: number): number {
  if (!Number.isFinite(perWeek) || !Number.isFinite(unitPrice)) return 0;
  return Math.max(0, perWeek) * Math.max(0, unitPrice);
}

export function costs(perWeek: number, unitPrice: number) {
  const week = weeklyCost(perWeek, unitPrice);
  return {
    week,
    days21: week * 3,
    month: (week * 52) / 12,
    year: week * 52,
  };
}

const whole = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1234.5 → "1 235 €" ; 12.5 → "12,50 €" (centimes seulement sous 100 €) */
export function formatEuros(amount: number): string {
  return amount >= 100 ? whole.format(Math.round(amount)) : cents.format(amount);
}
