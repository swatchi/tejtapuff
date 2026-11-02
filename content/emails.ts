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
};

export function loginCodeEmail(code: string): EmailContent {
  return {
    subject: `${code} : ton code TejTaPuff`,
    preheader: "Ton code pour te connecter à l'app.",
    heading: "Ton code de connexion",
    paragraphs: ["Tape ce code dans l'app pour te connecter :"],
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
      "Ton programme de 21 jours est prêt : une mission par jour, le bouton SOS quand l'envie monte, et ton compteur d'€ économisés.",
      `Pour rappel : ${p.priceSentence}`,
      `Ton prochain prélèvement : ${p.weekly} le ${p.firstRenewalDate}. On te prévient par email ${p.reminderHours} h avant.`,
      "Pour te connecter : va sur l'app et demande un code, il arrive par email. Pas de mot de passe.",
      "Pour résilier, c'est dans l'app : Compte → Résilier → Confirmer. Sans mail ni formulaire.",
    ],
    cta: { label: "Ouvrir mon app", url: p.appUrl },
  };
}

export function firstRenewalReminderEmail(p: { accountUrl: string; weekly: string; date: string }): EmailContent {
  return {
    subject: `Rappel : ${p.weekly} prélevés le ${p.date}`,
    preheader: `Ta 1re semaine se termine bientôt. Le ${p.date}, ton abonnement passe à ${p.weekly}/semaine.`,
    heading: "Ta 1re semaine se termine",
    paragraphs: [
      `Le ${p.date}, ton abonnement passe à ${p.weekly} par semaine.`,
      "Tu veux continuer ? Tu n'as rien à faire.",
      `Tu veux arrêter ? Résilie avant le ${p.date} depuis l'app : Compte → Résilier → Confirmer. Aucun prélèvement ne sera fait.`,
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
