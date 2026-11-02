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

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
