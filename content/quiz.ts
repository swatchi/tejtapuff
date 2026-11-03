/**
 * Le quiz d'onboarding : une question par écran.
 * Les `id` des options sont stockés en base : ne les change pas une fois en prod
 * (tu peux changer les `label` librement).
 */

export const QUIZ_INTRO = {
  title: "On construit ton plan",
  text: "7 questions, 2 minutes. Pas de bonne ou de mauvaise réponse.",
  cta: "C'est parti",
};

export const TRIGGERS = [
  { id: "reveil", label: "Au réveil", phrase: "le matin au réveil" },
  { id: "soiree", label: "En soirée", phrase: "les soirées" },
  { id: "stress", label: "Quand je stresse", phrase: "le stress" },
  { id: "ennui", label: "Quand je m'ennuie", phrase: "l'ennui" },
  { id: "potes", label: "Avec les potes", phrase: "les moments avec les potes" },
  { id: "repas", label: "Après manger", phrase: "l'après-repas" },
] as const;

export const REASONS = [
  { id: "argent", label: "L'argent", phrase: "garder ton argent" },
  { id: "souffle", label: "Retrouver mon souffle", phrase: "retrouver ton souffle" },
  { id: "sport", label: "Le sport", phrase: "être meilleur au sport" },
  { id: "quelquun", label: "Pour quelqu'un", phrase: "le faire pour quelqu'un qui compte" },
  { id: "dependance", label: "Ne plus être accro", phrase: "ne plus être accro" },
  { id: "fierte", label: "Me prouver que je peux", phrase: "te prouver que tu peux" },
] as const;

export const SINCE = [
  { id: "lt6m", label: "Moins de 6 mois" },
  { id: "6to12m", label: "6 mois à 1 an" },
  { id: "1to2y", label: "1 à 2 ans" },
  { id: "2to3y", label: "2 à 3 ans" },
  { id: "gt3y", label: "Plus de 3 ans" },
] as const;

export const QUESTIONS = {
  unit: { title: "Tu vapes quoi, surtout ?", hint: "Si tu mélanges, prends ce que tu achètes le plus." },
  perMonth: { title: "T'en finis combien par mois ?", hint: "Une moyenne, pas besoin d'être précis." },
  price: { title: "Tu les payes combien, en moyenne ?", hint: "Prix à l'unité, en euros." },
  since: { title: "Tu vapes depuis quand ?" },
  triggers: { title: "Quand l'envie frappe le plus ?", hint: "Choisis tout ce qui te parle." },
  reasons: { title: "Pourquoi tu veux lâcher la puff ?", hint: "Choisis tout ce qui te parle. On te les rappellera dans les moments durs." },
  startDate: { title: "Tu commences quand ?", hint: "Le jour 1 de ton plan. Tu pourras le décaler." },
};

export const START_OPTIONS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "tomorrow", label: "Demain" },
  { id: "pick", label: "Je choisis une date" },
] as const;

/** Nombre de jours max entre aujourd'hui et la date de démarrage */
export const MAX_START_DELAY_DAYS = 14;
