import "server-only";

/** Lit une variable d'environnement obligatoire, avec un message clair si elle manque. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new MissingEnvError(name);
  }
  return value;
}

export class MissingEnvError extends Error {
  constructor(public variable: string) {
    super(`Variable d'environnement manquante : ${variable} (voir .env.example)`);
  }
}

export const configured = {
  supabase: () =>
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY),
  stripe: () => Boolean(process.env.STRIPE_SECRET_KEY),
  resend: () => Boolean(process.env.RESEND_API_KEY),
};

/**
 * URL publique du site. Sur Vercel, si NEXT_PUBLIC_SITE_URL n'est pas renseignée,
 * on prend automatiquement le domaine de production du projet.
 */
export function siteUrl(): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return (process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
}
