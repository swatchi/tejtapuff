/**
 * Badges et paliers du tableau de bord. Tout est calculé avec les vraies données du membre
 * (temps sans puff, envies battues, missions faites, € économisés). Rien n'est inventé.
 */
import { DAY_MS } from "@/lib/program";

export type Badge = {
  id: string;
  emoji: string;
  label: string;
  done: boolean;
  /** 0 à 1, vers ce palier */
  progress: number;
  /** « encore 14 h », « encore 3 envies »… */
  remaining: string;
};

const HOUR = 3_600_000;

function duree(ms: number): string {
  if (ms <= 0) return "";
  const h = Math.ceil(ms / HOUR);
  if (h < 48) return `encore ${h} h`;
  return `encore ${Math.ceil(ms / DAY_MS)} jours`;
}

export function badgesOf(input: { currentMs: number; bestMs: number; cravings: number; missions: number; savedEuros: number }): Badge[] {
  const temps = (id: string, emoji: string, label: string, ms: number): Badge => ({
    id,
    emoji,
    label,
    done: input.bestMs >= ms,
    progress: Math.min(1, input.currentMs / ms),
    remaining: duree(ms - input.currentMs),
  });
  const compte = (id: string, emoji: string, label: string, valeur: number, cible: number, unite: [string, string]): Badge => ({
    id,
    emoji,
    label,
    done: valeur >= cible,
    progress: Math.min(1, valeur / cible),
    remaining: valeur >= cible ? "" : `encore ${cible - valeur} ${cible - valeur > 1 ? unite[1] : unite[0]}`,
  });
  const argent = (id: string, label: string, cible: number): Badge => ({
    id,
    emoji: "💶",
    label,
    done: input.savedEuros >= cible,
    progress: Math.min(1, input.savedEuros / cible),
    remaining: input.savedEuros >= cible ? "" : `encore ${Math.ceil(cible - input.savedEuros)} €`,
  });
  return [
    temps("h24", "🌅", "24 h sans", DAY_MS),
    temps("j3", "🔥", "3 jours sans", 3 * DAY_MS),
    temps("j7", "⭐", "1 semaine sans", 7 * DAY_MS),
    temps("j14", "🚀", "2 semaines sans", 14 * DAY_MS),
    temps("j21", "🏆", "21 jours sans", 21 * DAY_MS),
    temps("j30", "👑", "1 mois sans", 30 * DAY_MS),
    compte("envie1", "💪", "1re envie battue", input.cravings, 1, ["envie", "envies"]),
    compte("envie10", "🛡️", "10 envies battues", input.cravings, 10, ["envie", "envies"]),
    compte("envie25", "🧠", "25 envies battues", input.cravings, 25, ["envie", "envies"]),
    compte("mission21", "🎓", "21 missions", input.missions, 21, ["mission", "missions"]),
    argent("euro20", "20 € gardés", 20),
    argent("euro100", "100 € gardés", 100),
  ];
}

/** Le prochain palier de temps (celui qui motive le plus), ou null si tout est fait. */
export function nextTimeBadge(badges: Badge[]): Badge | null {
  return badges.filter((b) => ["h24", "j3", "j7", "j14", "j21", "j30"].includes(b.id)).find((b) => b.progress < 1) ?? null;
}
