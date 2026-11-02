import { NextResponse } from "next/server";
import { handleError } from "@/lib/api";
import { requireEnv } from "@/lib/env";
import { runHourly } from "@/lib/scheduler";

export const maxDuration = 300;

/**
 * Tâche horaire : notifications (matin, moments à risque, rappel avant prélèvement),
 * emails J7 / J21 et relances du quiz.
 * Appelée toutes les heures par Supabase (pg_cron, voir supabase/cron.sql), ou par Vercel Cron sur le plan Pro.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${requireEnv("CRON_SECRET").trim()}`) {
    return new Response("Non autorisé", { status: 401 });
  }
  try {
    return NextResponse.json(await runHourly());
  } catch (err) {
    return handleError("cron-hourly", err);
  }
}
