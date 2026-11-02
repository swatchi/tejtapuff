import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "@/lib/env";

/**
 * Liens signés (carte à partager, reprise du quiz, désinscription) :
 * impossible de deviner le lien d'une autre personne.
 */
function key() {
  return process.env.SIGNING_SECRET || requireEnv("CRON_SECRET");
}

export function sign(purpose: string, value: string): string {
  return createHmac("sha256", key()).update(`${purpose}:${value}`).digest("base64url").slice(0, 32);
}

export function verify(purpose: string, value: string, signature: string | null | undefined): boolean {
  if (!signature) return false;
  const expected = Buffer.from(sign(purpose, value));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
