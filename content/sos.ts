/**
 * Exercices du bouton SOS envie (1 à 5 minutes).
 * Les `id` sont stockés en base : ne les change pas une fois en prod.
 */
export const SOS = {
  title: "Ça va passer.",
  subtitle: "Une envie, ça monte, puis ça redescend. On t'aide à passer le pic. Choisis :",
  exercises: [
    {
      id: "respiration",
      title: "Respiration 4-6",
      duration: "2 min",
      intro: "Inspire par le nez pendant que le cercle grossit, expire doucement par la bouche pendant qu'il rétrécit.",
      inhaleSeconds: 4,
      exhaleSeconds: 6,
      cycles: 12,
    },
    {
      id: "defi5",
      title: "Défi 5 minutes",
      duration: "5 min",
      intro: "Tiens 5 minutes. Pendant ce temps, fais un maximum de trucs de la liste :",
      seconds: 300,
      actions: [
        "Bois un grand verre d'eau froide",
        "Change de pièce ou sors prendre l'air",
        "Fais 10 pompes ou 20 squats",
        "Envoie un message à quelqu'un",
        "Mâche un chewing-gum",
        "Mets ta musique préférée",
      ],
    },
    {
      id: "raisons",
      title: "Tes raisons",
      duration: "1 min",
      intro: "Relis-les. À voix haute si tu peux.",
    },
    {
      id: "sens",
      title: "Le jeu des 5 sens",
      duration: "2 min",
      intro: "Ramène ta tête ici et maintenant. Prends ton temps pour chaque étape, puis appuie sur Suivant.",
      etapes: [
        "Trouve 5 choses que tu vois autour de toi.",
        "Touche 4 choses et sens leur texture.",
        "Écoute : 3 sons que tu entends.",
        "Repère 2 odeurs (ou 2 odeurs que tu aimes).",
        "1 goût : bois une gorgée d'eau et concentre-toi dessus.",
      ],
    },
    {
      id: "bouge",
      title: "Bouge 2 minutes",
      duration: "2 min",
      intro: "Le corps a besoin de bouger quand l'envie monte. Fais ce que tu peux pendant 2 minutes :",
      seconds: 120,
      actions: ["Marche vite ou monte des escaliers", "20 squats", "10 pompes (même sur les genoux)", "Saute sur place 30 secondes", "Étire-toi bras en l'air"],
    },
    {
      id: "pote",
      title: "Écris à un pote",
      duration: "1 min",
      intro: "Envoie un message à quelqu'un de confiance. Pas besoin d'une longue explication :",
      message: "J'ai une grosse envie de puff là. Tu peux me parler 2 minutes pour me changer les idées ?",
    },
  ],
  after: {
    question: "Alors, cette envie ?",
    overcome: "C'est passé 💪",
    again: "Encore un peu",
    relapse: "J'ai craqué",
    overcomeMessage: "Bien joué. Une envie de plus que tu as battue.",
  },
} as const;

export type SosExerciseId = (typeof SOS.exercises)[number]["id"];

export const RELAPSE = {
  title: "Ok. Ça arrive.",
  text: "Craquer, ce n'est pas tout perdre. Tes missions et tes envies surmontées restent. Le compteur de temps repart de zéro, et tu reprends dès maintenant.",
  confirm: "Remettre le compteur à zéro",
  cancel: "En fait non, je tiens",
  afterTitle: "C'est reparti.",
  afterText: "Le plus important, c'est la minute d'après. Et tu viens de la gérer.",
  tips: [
    "Ne rachète pas : jette ce qui reste.",
    "Repère ce qui s'est passé juste avant (moment, personnes, humeur).",
    "Parle-en à quelqu'un de confiance.",
  ],
} as const;
