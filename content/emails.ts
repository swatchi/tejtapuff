/**
 * Textes des emails. Chaque email a un sujet, un aperçu (preheader) et des
 * paragraphes. La mise en forme est dans lib/email.ts.
 */

export type EmailContent = {
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  /** Gros texte mis en avant (ex. le code de connexion) */
  highlight?: string;
  cta?: { label: string; url: string };
  footnote?: string;
  /** Image (ex. la carte à partager) */
  image?: { src: string; alt: string; width: number; height: number };
  /** Lien de désinscription (obligatoire pour les emails de relance) */
  unsubscribeUrl?: string;
};

export function loginCodeEmail(code: string): EmailContent {
  return {
    subject: `${code} : ton code TejTaPuff`,
    preheader: "Ton code pour te connecter à l'app.",
    heading: "Ton code de connexion",
    paragraphs: ["Tape ce code dans l'app pour te connecter :"],
    highlight: code,
    footnote: "Il expire dans 1 heure. Si tu n'as rien demandé, ignore simplement cet email.",
  };
}

export function welcomeEmail(p: {
  appUrl: string;
  priceSentence: string;
  weekly: string;
  firstRenewalDate: string;
  reminderHours: number;
}): EmailContent {
  return {
    subject: "Bienvenue dans TejTaPuff 💛",
    preheader: "Ton programme de 21 jours est prêt.",
    heading: "C'est parti.",
    paragraphs: [
      "Ton programme de 21 jours est prêt : une mission par jour, le bouton SOS quand l'envie monte, et ton compteur d'€ économisés.",
      `Pour rappel : ${p.priceSentence}`,
      `Ton prochain prélèvement : ${p.weekly} le ${p.firstRenewalDate}. On te prévient par email ${p.reminderHours} h avant.`,
      "Pour te connecter : va sur l'app et demande un code, il arrive par email. Pas de mot de passe.",
      "Pour résilier, c'est dans l'app : Compte → Résilier → Confirmer. Sans mail ni formulaire.",
    ],
    cta: { label: "Ouvrir mon app", url: p.appUrl },
  };
}

export function firstRenewalReminderEmail(p: { accountUrl: string; weekly: string; date: string }): EmailContent {
  return {
    subject: `Rappel : ${p.weekly} prélevés le ${p.date}`,
    preheader: `Ta 1re semaine se termine bientôt. Le ${p.date}, ton abonnement passe à ${p.weekly}/semaine.`,
    heading: "Ta 1re semaine se termine",
    paragraphs: [
      `Le ${p.date}, ton abonnement passe à ${p.weekly} par semaine.`,
      "Tu veux continuer ? Tu n'as rien à faire.",
      `Tu veux arrêter ? Résilie avant le ${p.date} depuis l'app : Compte → Résilier → Confirmer. Aucun prélèvement ne sera fait.`,
    ],
    cta: { label: "Gérer mon abonnement", url: p.accountUrl },
  };
}

export function cancellationEmail(p: { appUrl: string; accessUntil: string }): EmailContent {
  return {
    subject: "Ta résiliation est confirmée",
    preheader: `Accès jusqu'au ${p.accessUntil}, plus aucun prélèvement.`,
    heading: "Résiliation confirmée",
    paragraphs: [
      "Ton abonnement est résilié. Plus aucun prélèvement ne sera fait.",
      `Tu gardes l'accès à l'app jusqu'au ${p.accessUntil}.`,
      "Quoi que tu décides pour la suite, bravo pour ce que tu as déjà fait. Et si un jour tu veux revenir, l'app est là.",
    ],
    cta: { label: "Ouvrir l'app", url: p.appUrl },
  };
}

export function paymentFailedEmail(p: { accountUrl: string; amount: string }): EmailContent {
  return {
    subject: "Ton paiement n'est pas passé",
    preheader: "Mets à jour ta carte pour garder l'accès à ton programme.",
    heading: "Petit souci de paiement",
    paragraphs: [
      `Ton paiement de ${p.amount} n'est pas passé (carte expirée, plafond, solde…).`,
      "Mets à jour ton moyen de paiement pour garder l'accès à ton programme. Une nouvelle tentative sera faite automatiquement.",
      "Si tu préfères arrêter, tu peux aussi résilier depuis ton compte.",
    ],
    cta: { label: "Mettre à jour mon paiement", url: p.accountUrl },
  };
}

export function day7Email(p: { appUrl: string; streakDays: number; saved: string; cravings: number; missions: number }): EmailContent {
  const clean = p.streakDays >= 7;
  return {
    subject: clean ? "1 semaine sans puff 💪" : "Ta 1re semaine de programme",
    preheader: clean ? `${p.saved} économisés, et ce n'est que le début.` : "On fait le point, sans jugement.",
    heading: clean ? "Une semaine. Respect." : "Une semaine de programme",
    paragraphs: [
      clean
        ? "7 jours sans puff, c'est souvent la semaine la plus dure. Tu l'as passée."
        : "Ta 1re semaine de programme est passée. Avec ses hauts et ses bas, et c'est normal.",
      `Tes chiffres : ${p.saved} économisés, ${p.cravings} envie${p.cravings > 1 ? "s" : ""} battue${p.cravings > 1 ? "s" : ""} avec le bouton SOS, ${p.missions} mission${p.missions > 1 ? "s" : ""} faite${p.missions > 1 ? "s" : ""}.`,
      "Cette semaine, on passe à « Je tiens » : remplacer les automatismes et apprendre à laisser passer une envie.",
    ],
    cta: { label: "Voir ma mission du jour", url: p.appUrl },
  };
}

export function day21Email(p: { shareUrl: string; cardUrl: string; streakDays: number; saved: string; cravings: number }): EmailContent {
  return {
    subject: "21 jours. Tu l'as fait. 🎉",
    preheader: `${p.saved} économisés, ${p.cravings} envies battues.`,
    heading: "21 jours de programme ✅",
    paragraphs: [
      "Tu as tenu le programme jusqu'au bout. Prends deux secondes pour mesurer le chemin.",
      `Tes chiffres : ${p.saved} économisés, ${p.cravings} envie${p.cravings > 1 ? "s" : ""} battue${p.cravings > 1 ? "s" : ""}, série en cours : ${p.streakDays} jour${p.streakDays > 1 ? "s" : ""}.`,
      "La suite : une mission par semaine pour rester clean sur la durée. Et ta carte est prête si tu veux la partager en story.",
    ],
    image: { src: p.cardUrl, alt: "Ta carte TejTaPuff", width: 270, height: 480 },
    cta: { label: "Partager ma carte", url: p.shareUrl },
  };
}

export function quizFollowupEmail(p: {
  resumeUrl: string;
  unsubscribeUrl: string;
  yearlyCost: string;
  second: boolean;
  priceSentence: string;
}): EmailContent {
  return {
    subject: p.second ? "Dernier rappel : ton plan 21 jours" : "Ton plan 21 jours t'attend",
    preheader: `D'après tes réponses, la puff te coûte ${p.yearlyCost} par an.`,
    heading: p.second ? "On ne te relancera plus après ça" : "Ton plan est prêt",
    paragraphs: [
      `Tu as fait le quiz : d'après tes réponses, la puff te coûte environ ${p.yearlyCost} par an.`,
      "Ton plan 21 jours est prêt, construit sur tes moments à risque. Il ne reste qu'à commencer.",
      p.priceSentence,
    ],
    cta: { label: "Reprendre là où j'en étais", url: p.resumeUrl },
    footnote: "Tu reçois cet email parce que tu as coché la case de rappel à la fin du quiz.",
    unsubscribeUrl: p.unsubscribeUrl,
  };
}

export function morningEmail(p: { appUrl: string; day: number; missionTitle: string; saved: string; consolidation: boolean }): EmailContent {
  return {
    subject: p.consolidation ? `Ta mission de la semaine : ${p.missionTitle}` : `Jour ${p.day} : ${p.missionTitle}`,
    preheader: p.saved ? `${p.saved} économisés jusqu'ici.` : "Ta mission du jour t'attend.",
    heading: p.consolidation ? "Ta mission de la semaine" : `Jour ${p.day} sur 21`,
    paragraphs: [
      `Mission : « ${p.missionTitle} ». 5 minutes max.`,
      p.saved ? `Déjà ${p.saved} économisés. Continue comme ça.` : "Un jour après l'autre.",
    ],
    cta: { label: "Voir ma mission", url: p.appUrl },
    footnote: "Tu peux couper ces emails dans l'app : Compte → Notifications.",
  };
}
