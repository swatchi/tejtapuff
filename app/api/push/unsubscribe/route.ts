import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseBody } from "@/lib/api";
import { getMember } from "@/lib/member";
import { supabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({ endpoint: z.url().max(1000) });

export async function POST(req: Request) {
  const m = await getMember();
  if (!m) return jsonError(401, "Connecte-toi d'abord.");
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;
  await supabaseAdmin().from("push_subscriptions").delete().eq("user_id", m.user.id).eq("endpoint", body.data.endpoint);
  return NextResponse.json({ ok: true });
}
