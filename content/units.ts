/**
 * Ce que les gens vapent. Les prix par défaut sont juste un point de départ :
 * l'utilisateur met SON prix dans le calculateur et le quiz.
 */
export type UnitId = "puff" | "pod" | "flacon";

export type VapeUnit = {
  id: UnitId;
  label: string;
  /** "2 puffs", "4 pods"… */
  plural: string;
  singular: string;
  /** Consommation par mois proposée par défaut */
  defaultPerMonth: number;
  /** en euros */
  defaultPrice: number;
  maxPerMonth: number;
};

export const UNITS: VapeUnit[] = [
  { id: "puff", label: "Puff", singular: "puff", plural: "puffs", defaultPerMonth: 8, defaultPrice: 10, maxPerMonth: 90 },
  { id: "pod", label: "Pod / cartouche", singular: "pod", plural: "pods", defaultPerMonth: 16, defaultPrice: 4, maxPerMonth: 150 },
  { id: "flacon", label: "Flacon e-liquide", singular: "flacon", plural: "flacons", defaultPerMonth: 8, defaultPrice: 6, maxPerMonth: 90 },
];

export function getUnit(id: string | undefined | null): VapeUnit {
  return UNITS.find((u) => u.id === id) ?? UNITS[0];
}
