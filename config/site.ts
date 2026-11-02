export const SITE = {
  name: "TejTaPuff",
  domain: "tejtapuff.fr",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  company: "Nombre One SAS",
  medicalDisclaimer: "TejTaPuff est un programme d'accompagnement, pas un traitement médical.",
  tabacInfoService: {
    label: "Tabac Info Service",
    phone: "39 89",
    phoneHref: "tel:3989",
    note: "appel gratuit",
    url: "https://www.tabac-info-service.fr",
  },
  /** Numéro national de prévention du suicide */
  suicidePrevention: { phone: "3114", phoneHref: "tel:3114" },
} as const;

/**
 * Interrupteurs : une fonctionnalité n'est mentionnée sur la landing que
 * quand elle existe vraiment dans l'app.
 */
export const FEATURES = {
  coach: false, // étape 3
  pushNotifications: false, // étape 3
  /** Ne passe à true que lorsque content/testimonials.ts contient de vrais témoignages avec consentement écrit. */
  testimonials: false,
} as const;

export const LIMITS = {
  coachMessagesPerDay: 20,
  loginCodeCooldownSeconds: 60,
} as const;
