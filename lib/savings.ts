/**
 * Calculs d'argent partagés par le calculateur, le plan, le tableau de bord, le coach et la carte à partager.
 * La conso est saisie PAR MOIS ; le compteur d'économies, lui, avance à la seconde.
 */

const pos = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

/** Coûts à partir d'une conso mensuelle et d'un prix à l'unité (en euros). */
export function costs(perMonth: number, unitPrice: number) {
  const month = pos(perMonth) * pos(unitPrice);
  const year = month * 12;
  return {
    month,
    halfYear: month * 6,
    year,
    week: year / 52,
    days21: (year * 21) / 365,
  };
}

/** Conso par semaine d'après le profil (les anciens profils n'ont que units_per_week). */
export function unitsPerWeekOf(p: { units_per_month?: number | string | null; units_per_week?: number | string | null } | null | undefined): number {
  if (p?.units_per_month) return (Number(p.units_per_month) * 12) / 52;
  return Number(p?.units_per_week ?? 0);
}

/** Conso par mois d'après le profil. */
export function unitsPerMonthOf(p: { units_per_month?: number | string | null; units_per_week?: number | string | null } | null | undefined): number {
  if (p?.units_per_month) return Number(p.units_per_month);
  return (Number(p?.units_per_week ?? 0) * 52) / 12;
}

const whole = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1234.5 → "1 235 €" ; 12.5 → "12,50 €" (centimes seulement sous 100 €) */
export function formatEuros(amount: number): string {
  return amount >= 100 ? whole.format(Math.round(amount)) : cents.format(amount);
}
