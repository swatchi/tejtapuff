/**
 * Textes exacts des consentements. Ils sont enregistrés en base avec leur
 * version au moment où l'utilisateur coche : c'est ta preuve en cas de litige.
 *
 * ⚠️ Si tu modifies un texte, change aussi sa `version`.
 */
export const CONSENTS = {
  sensitive_data: {
    version: "2026-11-02",
    text: "J'accepte que TejTaPuff utilise mes réponses (ma consommation et mes habitudes) pour créer et suivre mon plan. Je peux supprimer mon compte et mes données à tout moment.",
  },
  age_18: {
    version: "2026-11-02",
    text: "J'ai 18 ans ou plus.",
  },
  immediate_start: {
    version: "2026-11-02",
    // Brouillon : à faire valider (droit de rétractation, art. L221-25 et L221-28 du Code de la consommation).
    text: "Je veux commencer tout de suite : je demande l'exécution immédiate du programme avant la fin du délai de rétractation de 14 jours, et je reconnais perdre mon droit de rétractation une fois l'accès ouvert.",
  },
  followup_emails: {
    version: "2026-11-02",
    text: "OK pour recevoir un email de rappel si je ne termine pas mon inscription (2 max, désinscription en 1 clic).",
  },
} as const;

export type ConsentKind = keyof typeof CONSENTS;
