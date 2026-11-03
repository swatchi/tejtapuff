/**
 * Écran « Ton plan 21 jours », affiché après le quiz et avant le paiement.
 * {declencheurs} est remplacé par les déclencheurs choisis dans le quiz.
 */
export const PLAN = {
  title: "Ton plan 21 jours",
  savingsTitle: "Ce que tu gardes dans ta poche",
  savingsLines: {
    days21: "En 21 jours",
    month: "En 1 mois",
    year: "En 1 an",
  },
  reasonsTitle: "Tes raisons",
  phases: [
    {
      days: "J1 → J7",
      title: "Je repère",
      text: "On démonte tes automatismes, en commençant par {declencheurs}. Tu apprends à voir venir l'envie avant qu'elle te tombe dessus.",
    },
    {
      days: "J8 → J14",
      title: "Je tiens",
      text: "Tu remplaces la puff par d'autres réflexes, et tu apprends à laisser passer une envie sans y céder.",
    },
    {
      days: "J15 → J21",
      title: "Je verrouille",
      text: "On prépare les situations à risque pour qu'elles ne te fassent pas replonger.",
    },
    {
      days: "Après J21",
      title: "Je consolide",
      text: "Une mission par semaine pour rester clean sur la durée.",
    },
  ],
  startLabel: "Jour 1",
};

export const PAYWALL = {
  title: "On commence ?",
  emailLabel: "Ton email",
  emailHint: "Pour ton reçu et pour te connecter à l'app (avec un code, pas de mot de passe).",
  cta: "Je commence",
  secure: "Paiement sécurisé par Stripe.",
  garanties: [
    { icon: "zap", texte: "Accès tout de suite" },
    { icon: "clock", texte: "Rappel 48 h avant le 1er prélèvement" },
    { icon: "exit", texte: "Résiliable en 1 clic" },
  ],
  cancelled: "Paiement annulé, rien n'a été prélevé. Tu peux réessayer quand tu veux.",
};
