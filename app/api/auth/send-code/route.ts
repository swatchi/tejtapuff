import { NextResponse } from "next/server";
import { z } from "zod";
import { handleError, jsonError, parseBody } from "@/lib/api";
import { maskEmail, sendLoginCode } from "@/lib/auth-code";
import { normalizeEmail, provisionFromCheckout, userIdByEmail } from "@/lib/billing";

const schema = z.union([
  z.object({ checkoutSessionId: z.string().startsWith("cs_").max(255) }),
  z.object({ email: z.email().max(254) }),
]);

export async function POST(req: Request) {
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;

  try {
    let email: string;
    if ("checkoutSessionId" in body.data) {
      // Depuis /merci : on (re)vérifie le paiement chez Stripe et on crée le compte si besoin.
      const provisioned = await provisionFromCheckout(body.data.checkoutSessionId);
      if (!provisioned) return jsonError(409, "Paiement pas encore confirmé.", { code: "not_paid" });
      email = provisioned.email;
    } else {
      email = normalizeEmail(body.data.email);
      // On ne dit pas si le compte existe ou non (pas de fuite d'info).
      if (!(await userIdByEmail(email))) {
        return NextResponse.json({ ok: true, email: maskEmail(email) });
      }
    }
    const result = await sendLoginCode(email);
    return NextResponse.json({ ok: true, email: maskEmail(email), cooldown: result === "cooldown" });
  } catch (err) {
    return handleError("send-code", err);
  }
}
