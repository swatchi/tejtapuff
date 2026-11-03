/**
 * Ce que les gens vapent : la puff (jetable) ou la cigarette électronique (rechargeable).
 * Les valeurs par défaut sont juste un point de départ : l'utilisateur met SA consommation et SON prix.
 */
export type UnitId = "puff" | "ecig";

export type VapeUnit = {
  id: UnitId;
  label: string;
  /** Précision affichée sous le bouton */
  detail: string;
  /** "2 puffs", "8 recharges"… */
  plural: string;
  singular: string;
  /** Consommation par mois proposée par défaut */
  defaultPerMonth: number;
  /** en euros */
  defaultPrice: number;
  maxPerMonth: number;
};

export const UNITS: VapeUnit[] = [
  { id: "puff", label: "Puff", detail: "jetable", singular: "puff", plural: "puffs", defaultPerMonth: 2, defaultPrice: 10, maxPerMonth: 90 },
  {
    id: "ecig",
    label: "Cigarette électronique",
    detail: "pods, cartouches ou flacons",
    singular: "recharge",
    plural: "recharges",
    defaultPerMonth: 8,
    defaultPrice: 5,
    maxPerMonth: 150,
  },
];

/** Anciennes valeurs (avant la fusion pod / flacon) → cigarette électronique. */
const ANCIENS: Record<string, UnitId> = { pod: "ecig", flacon: "ecig" };

export function getUnit(id: string | undefined | null): VapeUnit {
  const vrai = id && ANCIENS[id] ? ANCIENS[id] : id;
  return UNITS.find((u) => u.id === vrai) ?? UNITS[0];
}
