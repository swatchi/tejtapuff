/**
 * Les 21 missions du programme + 8 missions de consolidation (1 par semaine après J21).
 *
 * Règles d'écriture : concret, 5 minutes max, zéro morale, zéro promesse médicale.
 * Les `id` sont stockés en base : ne les change pas une fois en prod.
 *
 * `byTrigger` (facultatif) : version adaptée au déclencheur n°1 choisi dans le quiz.
 */
import type { TRIGGERS } from "@/content/quiz";

type TriggerId = (typeof TRIGGERS)[number]["id"];

export type Mission = {
  id: string;
  title: string;
  /** Pourquoi on fait ça (1 à 2 phrases) */
  why: string;
  steps: string[];
  byTrigger?: Partial<Record<TriggerId, { title?: string; steps: string[] }>>;
};

export const PHASES = [
  { from: 1, to: 7, title: "Je repère" },
  { from: 8, to: 14, title: "Je tiens" },
  { from: 15, to: 21, title: "Je verrouille" },
] as const;

export const MISSIONS: Mission[] = [
  // ───────── Semaine 1 : Je repère ─────────
  {
    id: "j1",
    title: "Le grand ménage",
    why: "Moins tu as de puff à portée de main, moins ton cerveau négocie. On commence par enlever la tentation.",
    steps: [
      "Fais le tour : sac, poches, veste, voiture, tiroirs, chez tes potes.",
      "Puffs, pods, recharges, chargeurs : tout part. Pas de « au cas où ».",
      "Dépose-les dans un bac de collecte de piles (supermarché, bureau de tabac). Pas à la poubelle.",
    ],
  },
  {
    id: "j2",
    title: "Tes raisons, en grand",
    why: "Dans les moments durs, tu oublies pourquoi tu fais ça. Alors on les met là où tu ne peux pas les rater.",
    steps: [
      "Écris tes raisons avec TES mots (pas « pour la santé » mais « pour monter les escaliers sans être essoufflé »).",
      "Fais-en une note ou un fond d'écran.",
      "Relis-les ce soir avant de dormir.",
    ],
  },
  {
    id: "j3",
    title: "Mode détective",
    why: "Une envie n'arrive jamais au hasard. Aujourd'hui, tu observes juste quand elles débarquent.",
    steps: [
      "À chaque envie, note : l'heure, où tu es, avec qui, et sa force de 1 à 10.",
      "Si une envie est trop forte : bouton SOS.",
      "Ce soir, regarde ta liste : tu vois un moment qui revient ?",
    ],
  },
  {
    id: "j4",
    title: "Ton déclencheur n°1",
    why: "On s'attaque au moment où l'envie frappe le plus fort chez toi, avec un plan B tout prêt.",
    steps: [
      "Repère ton moment le plus risqué de la journée.",
      "Choisis UNE action à faire à la place, dès que ce moment arrive.",
      "Teste-la aujourd'hui.",
    ],
    byTrigger: {
      reveil: {
        title: "Le réveil sans puff",
        steps: [
          "Ce soir, pose ton téléphone loin du lit : premier geste du matin = te lever.",
          "Grand verre d'eau froide dès que tu es debout.",
          "Change l'ordre de ta routine (douche avant le petit-déj, ou l'inverse) pour casser l'automatisme.",
        ],
      },
      soiree: {
        title: "La soirée sans puff",
        steps: [
          "Prévois ta soirée à l'avance : une série, un jeu, un appel, une sortie.",
          "Garde quelque chose dans les mains (verre, téléphone, manette).",
          "Si l'envie monte : sors 5 minutes prendre l'air, sans puff.",
        ],
      },
      stress: {
        title: "Le stress sans puff",
        steps: [
          "Apprends la respiration 4-6 de l'onglet SOS : inspire 4 secondes, expire 6 secondes.",
          "Fais-la 1 minute maintenant, à froid, pour l'avoir en tête.",
          "Au prochain coup de stress : respiration d'abord, décision après.",
        ],
      },
      ennui: {
        title: "L'ennui sans puff",
        steps: [
          "Fais une liste de 5 trucs rapides à faire quand tu t'ennuies (marcher, ranger un truc, appeler quelqu'un, un jeu…).",
          "Garde-la dans ton téléphone.",
          "Dès que tu tournes en rond : pioche un truc dans la liste.",
        ],
      },
      potes: {
        title: "Les potes sans puff",
        steps: [
          "Prépare ta phrase : « Non merci, j'ai arrêté » (ou « je suis sur un défi », si c'est plus facile).",
          "Dis-la à voix haute 3 fois. Oui, vraiment.",
          "La prochaine fois qu'on t'en tend une, tu l'as déjà en bouche.",
        ],
      },
      repas: {
        title: "L'après-repas sans puff",
        steps: [
          "Dès la dernière bouchée : lève-toi de table.",
          "Brosse-toi les dents ou prends un chewing-gum sans sucre.",
          "Enchaîne direct sur autre chose (vaisselle, marche, message à quelqu'un).",
        ],
      },
    },
  },
  {
    id: "j5",
    title: "Les mains occupées",
    why: "La puff, c'est aussi un geste. Trouve un truc à faire avec tes mains et ta bouche.",
    steps: [
      "Choisis ton objet : stylo, élastique, fidget, paille, cure-dent, chewing-gum sans sucre.",
      "Garde-le sur toi toute la journée.",
      "À chaque envie : l'objet d'abord.",
    ],
  },
  {
    id: "j6",
    title: "Dis-le à quelqu'un",
    why: "Quand quelqu'un sait, c'est plus facile de tenir, et tu as un soutien quand ça tire.",
    steps: [
      "Choisis une personne de confiance.",
      "Envoie-lui : « J'arrête la puff. Si tu me vois craquer, rappelle-moi pourquoi je fais ça. »",
      "Demande-lui de ne pas t'en proposer.",
    ],
  },
  {
    id: "j7",
    title: "Bilan de ta 1re semaine",
    why: "Une semaine, c'est énorme. On regarde ce qui a marché et on se fait plaisir.",
    steps: [
      "Regarde ton tableau de bord : temps sans puff, € économisés, envies surmontées.",
      "Note le truc qui t'a le plus aidé cette semaine.",
      "Offre-toi un petit plaisir avec une partie de l'argent économisé.",
    ],
  },

  // ───────── Semaine 2 : Je tiens ─────────
  {
    id: "j8",
    title: "Surfer la vague",
    why: "Une envie monte, atteint un pic, puis redescend. Si tu ne fais rien, elle finit par passer.",
    steps: [
      "À la prochaine envie, ne la combats pas : observe-la.",
      "Où tu la sens ? Dans la gorge, les mains, la tête ?",
      "Lance le défi 5 minutes (SOS) et regarde-la redescendre.",
    ],
  },
  {
    id: "j9",
    title: "Ton remplaçant",
    why: "Ton cerveau a l'habitude d'une récompense. Donne-lui autre chose à la place.",
    steps: [
      "Pour chacun de tes moments à risque, choisis un remplaçant : eau fraîche, musique, marche, message, chewing-gum…",
      "Écris tes duos « moment → remplaçant ».",
      "Applique-les aujourd'hui.",
    ],
  },
  {
    id: "j10",
    title: "Bouge 10 minutes",
    why: "Bouger aide beaucoup de gens à faire redescendre une envie et le stress qui va avec.",
    steps: [
      "Marche rapide, escaliers, pompes, danse dans ta chambre : peu importe.",
      "10 minutes aujourd'hui.",
      "Note comment tu te sens après.",
    ],
  },
  {
    id: "j11",
    title: "Le piège du « juste une »",
    why: "Ton cerveau va négocier : « juste une taffe, c'est rien ». C'est le piège le plus classique.",
    steps: [
      "Écris ta réponse à « juste une » (ex. : « Une, c'est comme ça que j'ai commencé »).",
      "Mets-la à côté de tes raisons.",
      "La prochaine fois que la petite voix parle, tu sors ta réponse.",
    ],
  },
  {
    id: "j12",
    title: "Ta soirée test",
    why: "Le soir, la fatigue baisse ta garde. On prépare une soirée complète sans puff.",
    steps: [
      "Planifie ta soirée de A à Z : quoi, où, avec qui.",
      "Prévois un truc à boire et un truc à grignoter (fruits, noix, chewing-gum).",
      "Couche-toi un peu plus tôt que d'habitude.",
    ],
  },
  {
    id: "j13",
    title: "L'argent sur la table",
    why: "Tes économies sont réelles. Donne-leur un objectif.",
    steps: [
      "Regarde combien tu as économisé depuis le début.",
      "Choisis ce que tu vas t'offrir à J21 avec cet argent.",
      "Mets-le en fond d'écran ou en note.",
    ],
  },
  {
    id: "j14",
    title: "Bilan de la semaine 2",
    why: "Deux semaines. Tu as déjà construit des réflexes que tu n'avais pas.",
    steps: [
      "Note tes 2 meilleurs trucs anti-envie.",
      "Note le moment qui reste le plus dur.",
      "On s'en occupe la semaine prochaine.",
    ],
  },

  // ───────── Semaine 3 : Je verrouille ─────────
  {
    id: "j15",
    title: "Ta réponse aux potes",
    why: "Le plus dur, ce n'est souvent pas l'envie : c'est quand on t'en tend une.",
    steps: [
      "Prépare 2 réponses : une simple (« Non merci, j'ai arrêté ») et une drôle.",
      "Si tes potes vapent beaucoup, dis-leur à l'avance que tu as arrêté.",
      "Entraîne-toi à les dire sans te justifier.",
    ],
  },
  {
    id: "j16",
    title: "Plan anti-soirée",
    why: "Fête, alcool, potes qui vapent : c'est la situation où on replonge le plus. On prépare la prochaine.",
    steps: [
      "Repère ta prochaine soirée.",
      "Décide à l'avance : avec qui tu restes, quoi boire, à quelle heure tu pars.",
      "Préviens un pote qui ne vape pas qu'il est ton « garde du corps ».",
    ],
  },
  {
    id: "j17",
    title: "Plan anti-stress",
    why: "Exam, embrouille, taf, rupture : un gros coup de stress arrivera. Autant avoir un plan.",
    steps: [
      "Écris ton plan en 3 étapes : 1. respiration 4-6 / 2. bouger ou sortir / 3. parler à quelqu'un.",
      "Mets-le dans tes notes.",
      "Teste l'étape 1 maintenant.",
    ],
  },
  {
    id: "j18",
    title: "Change de phrase",
    why: "« J'essaie d'arrêter » laisse la porte ouverte. « Je ne vape pas » la ferme.",
    steps: [
      "Aujourd'hui, dis « je ne vape pas » au lieu de « j'essaie d'arrêter ».",
      "Écris 3 choses que tu fais maintenant à la place de la puff.",
      "Relis-les quand tu doutes.",
    ],
  },
  {
    id: "j19",
    title: "Tes 3 situations à risque",
    why: "Tu connais tes pièges mieux que personne. On les désamorce à l'avance.",
    steps: [
      "Liste les 3 situations les plus risquées des prochaines semaines.",
      "Pour chacune : ton plan B en une phrase.",
      "Garde la liste dans ton téléphone.",
    ],
  },
  {
    id: "j20",
    title: "Si jamais tu craques",
    why: "Un écart, ce n'est pas un retour à zéro. Ce qui compte, c'est ce que tu fais juste après.",
    steps: [
      "Ton plan si ça arrive : appuyer sur « J'ai craqué », ne pas racheter, en parler à quelqu'un.",
      "Écris ce que tu te dirais à toi-même (gentiment).",
      "Reprendre dès la minute d'après : c'est ça, la règle.",
    ],
  },
  {
    id: "j21",
    title: "Jour 21",
    why: "Trois semaines. Prends le temps de mesurer le chemin.",
    steps: [
      "Regarde ton tableau de bord en entier.",
      "Écris un message à toi d'il y a 21 jours.",
      "Offre-toi ce que tu avais choisi à J13. Tu l'as mérité.",
    ],
  },
];

/** Missions hebdomadaires après J21 (la 9e semaine reprend la 1re, etc.) */
export const CONSOLIDATION: Mission[] = [
  {
    id: "c1",
    title: "Le piège de la confiance",
    why: "Après quelques semaines, on se dit « je gère, une seule ne changera rien ». C'est souvent comme ça qu'on replonge.",
    steps: ["Relis ta réponse au « juste une » (J11).", "Mets-la à jour si besoin.", "Rappelle-toi pourquoi tu as commencé."],
  },
  {
    id: "c2",
    title: "Ta récompense du mois",
    why: "L'argent que tu ne dépenses plus en puff mérite d'être vu.",
    steps: ["Regarde tes € économisés.", "Choisis un vrai plaisir à t'offrir ce mois-ci.", "Fais-toi plaisir sans culpabiliser."],
  },
  {
    id: "c3",
    title: "Nouveau déclencheur ?",
    why: "Ta vie change, tes déclencheurs aussi : nouveau taf, nouvelle bande, nouvelle saison.",
    steps: ["Repère une situation où l'envie est revenue récemment.", "Trouve un plan B pour elle.", "Teste-le cette semaine."],
  },
  {
    id: "c4",
    title: "Aide quelqu'un",
    why: "Expliquer ce qui marche, c'est aussi se le rappeler à soi-même.",
    steps: ["Pense à quelqu'un qui veut arrêter.", "Partage-lui tes 2 meilleurs trucs.", "Sans faire la morale. Juste partager."],
  },
  {
    id: "c5",
    title: "Ce qui a changé",
    why: "Les changements sont parfois discrets. Prends le temps de les remarquer.",
    steps: ["Note 3 choses qui ont changé depuis que tu as arrêté (argent, temps, sport, humeur…).", "Garde la liste avec tes raisons."],
  },
  {
    id: "c6",
    title: "Les grandes occasions",
    why: "Vacances, anniversaires, fêtes : les moments exceptionnels sont des pièges classiques.",
    steps: ["Repère le prochain grand événement.", "Prépare ton plan comme pour la soirée test (J16).", "Préviens quelqu'un qui y sera."],
  },
  {
    id: "c7",
    title: "Ton anti-sèche",
    why: "Tes meilleurs trucs, au même endroit, prêts à servir.",
    steps: ["Écris tes 5 meilleurs trucs anti-envie.", "Mets la liste en favori dans ton téléphone."],
  },
  {
    id: "c8",
    title: "Le prochain cap",
    why: "Un objectif te tire vers l'avant.",
    steps: ["Choisis ton prochain cap : 2 mois, 3 mois, 6 mois.", "Décide comment tu le fêteras.", "Note la date."],
  },
];

/** Version de la mission adaptée au déclencheur n°1 de l'utilisateur, si elle existe. */
export function personalize(mission: Mission, triggers: string[]): { title: string; why: string; steps: string[] } {
  for (const t of triggers) {
    const variant = mission.byTrigger?.[t as TriggerId];
    if (variant) return { title: variant.title ?? mission.title, why: mission.why, steps: variant.steps };
  }
  return { title: mission.title, why: mission.why, steps: mission.steps };
}
