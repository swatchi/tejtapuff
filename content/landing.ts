/**
 * Textes de la landing. Modifie librement, la mise en page suit.
 */

export const HERO = {
  kicker: "Le programme anti-puff en 21 jours",
  titleBefore: "Combien tu",
  titleHighlight: "crames",
  titleAfter: "en puff\u00a0?",
  subtitle:
    "Puff ou cigarette électronique : fais le calcul. Ensuite on t'aide à arrêter en 21 jours, avec une mission par jour et un bouton SOS quand l'envie monte.",
};

export const CALCULATOR = {
  title: "Ton ticket de caisse",
  unitQuestion: "Tu vapes quoi ?",
  perMonthQuestion: "Combien par mois ?",
  priceQuestion: "Prix à l'unité",
  lines: {
    month: "1 mois",
    halfYear: "6 mois",
    year: "1 an",
  },
  totalLabel: "Cramé en 1 an",
  /** Comparaison fun, calculée à partir du résultat. Prix à l'unité indiqué pour rester transparent. */
  equivalent: { label: "kebabs", unitPrice: 9 },
  cta: "Je fais mon plan (2 min)",
  footnote: "Calcul : ta conso × ton prix. Rien n'est enregistré tant que tu ne lances pas le quiz.",
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
      text: "Construit sur tes déclencheurs à toi : le réveil, les soirées, le stress, l'ennui…",
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
    text: "Une envie, ça monte, puis ça redescend. On t'aide à passer le pic : respiration guidée, défi 5 minutes, tes raisons sous les yeux.",
  },
  counter: {
    title: "Ton compteur en direct",
    text: "Temps sans puff, € économisés, envies surmontées. Tout est calculé à partir de TA conso.",
  },
  coach: {
    title: "Un coach dans ta poche",
    text: "Tu lui écris quand tu veux. Il connaît ton plan et il te juge pas.",
  },
  badges: {
    title: "Des badges et ton objectif",
    text: "24 h, 3 jours, 1 semaine… Chaque cap débloque un badge. Et tu choisis ce que tu t'offres avec l'argent gardé : la barre se remplit toute seule.",
  },
  aide: {
    title: "De l'aide, pour de vrai",
    text: "6 exercices SOS, quoi faire selon TES moments à risque, et les numéros pour parler à un humain si tu en as besoin.",
  },
  relapse: {
    title: "Et si tu craques ?",
    text: "Bouton « J'ai craqué » : ton compteur repart, mais tout ce que tu as fait reste. On repart ensemble.",
  },
};

/** Pourquoi on peut nous faire confiance. Que des faits vérifiables, aucun avis ni chiffre inventé. */
export const TRUST = {
  title: "Zéro piège",
  items: [
    { emoji: "🔒", title: "Paiement sécurisé par Stripe", text: "Ta carte est saisie chez Stripe. Nous, on ne la voit jamais." },
    { emoji: "⏰", title: "Prévenu avant de payer", text: "Un email 48 h avant le 1er prélèvement à 14,99 €. Pas de surprise." },
    { emoji: "✋", title: "Résiliable en 1 clic", text: "Depuis ton compte, sans mail ni formulaire. L'accès reste jusqu'à la fin de la semaine payée." },
    { emoji: "🗑️", title: "Tes données sont à toi", text: "On ne vend aucune donnée. Tu supprimes ton compte et tout ce qu'il contient en 1 clic." },
    { emoji: "🤝", title: "Zéro jugement", text: "Tu craques ? Le compteur repart, mais tes missions et tes envies battues restent." },
    { emoji: "🇫🇷", title: "Une entreprise française", text: "TejTaPuff est édité par Nombre One SAS (SIREN 100 954 692)." },
  ],
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
  helpTitle: "Besoin de parler à quelqu'un ?",
  helpText: "Tabac Info Service, des tabacologues au bout du fil.",
};
