/**
 * Page « Besoin d'aide ? » (/app/aide). Des conseils pratiques, pas de promesse médicale.
 */
export const AIDE = {
  title: "Besoin d'aide ?",
  subtitle: "Arrêter, c'est dur. Voilà tout ce qui peut t'aider, du plus rapide au plus humain.",
  /** Quoi faire selon les moments à risque choisis dans le quiz (mêmes id que TRIGGERS). */
  parMoment: {
    reveil: {
      titre: "Au réveil",
      conseils: [
        "Laisse ton téléphone et ta puff hors de la chambre (s'il en reste).",
        "Premier geste du matin : un grand verre d'eau, puis la douche.",
        "Change l'ordre de ta routine pour casser l'automatisme.",
      ],
    },
    soiree: {
      titre: "En soirée",
      conseils: [
        "Prépare ta phrase avant d'y aller : « Non merci, j'ai arrêté. »",
        "Garde un verre en main et reste près de ceux qui ne vapent pas.",
        "Tu as le droit de partir plus tôt. Tu n'as rien à prouver.",
      ],
    },
    stress: {
      titre: "Quand tu stresses",
      conseils: [
        "Respiration 4-6 dans le SOS : 2 minutes, n'importe où.",
        "Bouge : marche, escaliers, 20 squats. Le stress a besoin de sortir.",
        "Écris au coach ce qui te stresse, ça aide à le poser.",
      ],
    },
    ennui: {
      titre: "Quand tu t'ennuies",
      conseils: [
        "Prépare une liste de trucs à faire en 5 minutes (musique, série, appel, jeu).",
        "Occupe tes mains : balle anti-stress, stylo, chewing-gum.",
        "Sors prendre l'air, même 5 minutes.",
      ],
    },
    potes: {
      titre: "Avec les potes",
      conseils: [
        "Dis-leur que tu as arrêté. Les vrais potes ne te le proposeront plus.",
        "Choisis un pote « garde du corps » qui te rappelle pourquoi tu fais ça.",
        "Les premiers jours, propose des plans où personne ne vape.",
      ],
    },
    repas: {
      titre: "Après manger",
      conseils: [
        "Lève-toi tout de suite de table et bouge.",
        "Brosse-toi les dents ou mâche un chewing-gum à la menthe.",
        "Remplace par un rituel : un fruit, un thé, un petit tour.",
      ],
    },
  } as Record<string, { titre: string; conseils: string[] }>,
  humains: {
    titre: "Parler à un humain",
    texte:
      "Des tabacologues, au téléphone, gratuitement. Tu peux leur parler de ta puff ou de ta cigarette électronique, et leur demander si des substituts nicotiniques peuvent t'aider.",
  },
  medecin: "Un médecin ou un pharmacien peut aussi te conseiller, en toute confidentialité.",
  urgence: {
    titre: "Si ça va vraiment mal",
    texte: "Si tu as des idées noires, appelle le 3114 (gratuit, 24 h/24). En cas d'urgence, le 112.",
  },
} as const;
