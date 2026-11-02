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
  defaultPerWeek: number;
  /** en euros */
  defaultPrice: number;
  maxPerWeek: number;
};

export const UNITS: VapeUnit[] = [
  { id: "puff", label: "Puff", singular: "puff", plural: "puffs", defaultPerWeek: 2, defaultPrice: 10, maxPerWeek: 30 },
  { id: "pod", label: "Pod / cartouche", singular: "pod", plural: "pods", defaultPerWeek: 4, defaultPrice: 4, maxPerWeek: 40 },
  { id: "flacon", label: "Flacon e-liquide", singular: "flacon", plural: "flacons", defaultPerWeek: 2, defaultPrice: 6, maxPerWeek: 30 },
];

export function getUnit(id: string | undefined | null): VapeUnit {
  return UNITS.find((u) => u.id === id) ?? UNITS[0];
}
