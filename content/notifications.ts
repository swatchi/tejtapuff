/**
 * Textes des notifications push. Courts : ~40 caractères pour le titre, ~120 pour le texte.
 */
import type { TRIGGERS } from "@/content/quiz";

type TriggerId = (typeof TRIGGERS)[number]["id"];

/**
 * Heure locale (0-23) à laquelle on envoie un petit mot pour chaque moment à risque du quiz.
 * `days` : jours de la semaine (0 = dimanche … 6 = samedi). Maximum 2 moments par jour et par personne.
 */
export const RISK_SLOTS: Record<TriggerId, { hour: number; days?: number[] } | null> = {
  reveil: null, // déjà couvert par la notification du matin
  repas: { hour: 13 },
  ennui: { hour: 15 },
  stress: { hour: 17 },
  soiree: { hour: 20 },
  potes: { hour: 21, days: [5, 6] }, // vendredi et samedi soir
};

export const RISK_MESSAGES: Record<Exclude<TriggerId, "reveil">, { title: string; body: string }[]> = {
  repas: [
    { title: "Après le repas", body: "Lève-toi de table, un chewing-gum, et enchaîne sur autre chose. L'envie va passer." },
    { title: "Pause déj", body: "C'est souvent là que l'envie pointe. Un grand verre d'eau et tu passes à la suite." },
  ],
  ennui: [
    { title: "Petit creux de l'aprèm", body: "L'ennui, c'est le piège classique. Pioche un truc dans ta liste anti-ennui." },
    { title: "Tu tournes en rond ?", body: "5 minutes de marche ou un message à quelqu'un. Le SOS est là si besoin." },
  ],
  stress: [
    { title: "Grosse journée ?", body: "Si le stress monte : 1 minute de respiration 4-6 avant toute décision." },
    { title: "Respire", body: "Inspire 4 secondes, expire 6. Trois fois. Ton cerveau te remerciera." },
  ],
  soiree: [
    { title: "La soirée commence", body: "C'est souvent là que l'envie frappe. Ton plan B est prêt, et le bouton SOS aussi." },
    { title: "Ce soir, tu gères", body: "Garde quelque chose dans les mains, et sors prendre l'air si ça tire." },
  ],
  potes: [
    { title: "Soirée avec les potes ?", body: "Ta phrase est prête : « Non merci, j'ai arrêté ». Et le SOS est dans ta poche." },
    { title: "Ce soir, reste avec ton plan", body: "Reste près de ceux qui ne vapent pas, et pars quand tu veux. Tu n'as rien à prouver." },
  ],
};

export function morningPush(p: { day: number; missionTitle: string; saved: string; consolidation: boolean }) {
  return {
    title: p.consolidation ? "Ta mission de la semaine" : `Jour ${p.day}`,
    body: p.saved ? `${p.missionTitle} · ${p.saved} économisés` : `Ta mission : ${p.missionTitle}`,
  };
}

export const START_DAY_PUSH = {
  title: "C'est le jour J",
  body: "Quand tu as tej ta dernière puff, appuie sur « Je démarre ». On est là.",
};

export function reminderPush(p: { weekly: string; date: string }) {
  return {
    title: "Rappel abonnement",
    body: `Le ${p.date}, ton abonnement passe à ${p.weekly} par semaine. Pour arrêter : Compte → Résilier.`,
  };
}

/** Variante stable par jour (évite de répéter le même texte deux jours de suite). */
export function pick<T>(list: T[], dayKey: string): T {
  const n = dayKey.split("-").reduce((acc, x) => acc + Number(x), 0);
  return list[n % list.length];
}
