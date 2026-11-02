import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { MissingEnvError } from "@/lib/env";

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

/** Lit et valide le corps JSON d'une requête. */
export async function parseBody<T extends z.ZodType>(req: Request, schema: T) {
  let raw: unknown;
  try {
    raw = JSON.parse(await req.text());
  } catch {
    return { ok: false as const, response: jsonError(400, "Requête invalide") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, response: jsonError(400, "Données invalides", { issues: parsed.error.issues.map((i) => i.path.join(".")) }) };
  }
  return { ok: true as const, data: parsed.data as z.infer<T> };
}

/** Transforme une exception en réponse propre (sans fuite de détails côté client). */
export function handleError(scope: string, err: unknown) {
  if (err instanceof MissingEnvError) {
    console.error(`[${scope}] ${err.message}`);
    return jsonError(503, "Service pas encore configuré", { missing: err.variable });
  }
  console.error(`[${scope}]`, err);
  return jsonError(500, "Oups, une erreur est survenue. Réessaie dans un instant.");
}
