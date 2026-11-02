import { NextResponse } from "next/server";
import { z } from "zod";
import { handleError, jsonError, parseBody } from "@/lib/api";
import { getMember } from "@/lib/member";
import { browserFamily } from "@/lib/track";
import { supabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  subscription: z.object({
    endpoint: z.url().max(1000),
    keys: z.object({ p256dh: z.string().min(10).max(300), auth: z.string().min(5).max(100) }),
  }),
  timeZone: z.string().max(64).optional(),
});

function validTimeZone(tz: string | undefined): string | null {
  if (!tz) return null;
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: tz });
    return tz;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const m = await getMember();
  if (!m) return jsonError(401, "Connecte-toi d'abord.");
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;
  try {
    const db = supabaseAdmin();
    const { subscription } = body.data;
    const { error } = await db.from("push_subscriptions").upsert(
      {
        user_id: m.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        device: browserFamily(req.headers.get("user-agent")).device,
        failures: 0,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    const tz = validTimeZone(body.data.timeZone);
    if (tz && tz !== m.timeZone) await db.from("profiles").update({ timezone: tz }).eq("user_id", m.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError("push-subscribe", err);
  }
}
