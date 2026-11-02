import { NextResponse } from "next/server";
import { z } from "zod";
import { handleError, jsonError, parseBody } from "@/lib/api";
import { normalizeEmail } from "@/lib/billing";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase/server";

const code = z.string().regex(/^\d{6,10}$/);
const schema = z.union([
  z.object({ checkoutSessionId: z.string().startsWith("cs_").max(255), code }),
  z.object({ email: z.email().max(254), code }),
]);

export async function POST(req: Request) {
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  try {
    let email: string | null | undefined;
    if ("checkoutSessionId" in body.data) {
      const session = await stripe().checkout.sessions.retrieve(body.data.checkoutSessionId);
      email = session.customer_details?.email ?? session.customer_email;
    } else {
      email = body.data.email;
    }
    if (!email) return jsonError(400, "Email introuvable.");
    email = normalizeEmail(email);

    const supabase = await supabaseServer();
    let { error } = await supabase.auth.verifyOtp({ email, token: body.data.code, type: "email" });
    if (error) {
      ({ error } = await supabase.auth.verifyOtp({ email, token: body.data.code, type: "magiclink" }));
    }
    if (error) return jsonError(400, "Code invalide ou expiré. Vérifie l'email le plus récent.");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError("verify", err);
  }
}
