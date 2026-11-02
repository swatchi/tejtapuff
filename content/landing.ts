/**
 * Textes de la landing. Modifie librement, la mise en page suit.
 */

export const HERO = {
  kicker: "Le programme anti-puff en 21 jours",
  titleBefore: "Combien tu",
  titleHighlight: "crames",
  titleAfter: "en puff\u00a0?",
  subtitle:
    "Fais le calcul. Ensuite on t'aide à arrêter en 21 jours : une mission par jour, un bouton SOS quand l'envie monte.",
};

export const CALCULATOR = {
  title: "Ton ticket de caisse",
  unitQuestion: "Tu vapes quoi ?",
  perWeekQuestion: "Combien par semaine ?",
  priceQuestion: "Prix à l'unité",
  lines: {
    week: "1 semaine",
    month: "1 mois",
    year: "1 an",
  },
  totalLabel: "Cramé en 1 an",
  /** Comparaison fun, calculée à partir du résultat. Prix à l'unité indiqué pour rester transparent. */
  equivalent: { label: "kebabs", unitPrice: 9 },
  cta: "Je fais mon plan (2 min)",
  footnote: "Calcul : ta conso × ton prix. Rien n'est enregistré tant que tu ne lances pas le quiz.",
};

export const STEPS = {
  title: "Comment ça marche",
  items: [
    {
      title: "Tu réponds à 7 questions",
      text: "Ta conso, tes moments à risque, tes raisons. 2 minutes, zéro jugement.",
    },
    {
      title: "Tu reçois ton plan 21 jours",
      text: "Construit sur tes déclencheurs à toi : le réveil, les soirées, le stress, l'ennui…",
    },
    {
      title: "Tu avances, un jour à la fois",
      text: "Une mission par jour, un SOS quand ça tire, et ton compteur d'€ économisés qui grimpe.",
    },
  ],
};

export const APP_FEATURES = {
  title: "Ce qu'il y a dans l'app",
  missions: {
    title: "Une mission par jour",
    text: "5 minutes max. Des trucs concrets, pas des leçons de morale. Après J21, une mission par semaine pour ne pas replonger.",
    sample: ["Repère ta 1re envie de la journée", "Change ta routine du réveil", "Prépare ta réponse pour les potes"],
  },
  sos: {
    title: "Le bouton SOS envie",
    text: "Une envie, ça monte, puis ça redescend. On t'aide à passer le pic : respiration guidée, défi 5 minutes, tes raisons sous les yeux.",
  },
  counter: {
    title: "Ton compteur en direct",
    text: "Temps sans puff, € économisés, envies surmontées. Tout est calculé à partir de TA conso.",
  },
  coach: {
    title: "Un coach dans ta poche",
    text: "Tu lui écris quand tu veux. Il connaît ton plan et il te juge pas.",
  },
  relapse: {
    title: "Et si tu craques ?",
    text: "Bouton « J'ai craqué » : ton compteur repart, mais tout ce que tu as fait reste. On repart ensemble.",
  },
};

export const PRICE_SECTION = {
  title: "Le prix, cash",
  bullets: [
    "Accès à tout le programme dès la 1re semaine",
    "Rappel par email 48 h avant le 1er prélèvement au prix plein",
    "Résiliation depuis ton compte, sans mail ni formulaire",
    "Tu gardes l'accès jusqu'à la fin de la semaine payée",
  ],
  cta: "Je commence",
  ctaNote: "D'abord un quiz de 2 min pour construire ton plan. Réservé aux 18 ans et plus.",
};

export const FOOTER = {
  helpTitle: "Besoin de parler à quelqu'un ?",
  helpText: "Tabac Info Service, des tabacologues au bout du fil.",
};
