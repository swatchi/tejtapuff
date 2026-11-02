import { NextResponse } from "next/server";
import { z } from "zod";
import { PRICE_SENTENCE } from "@/config/pricing";
import { CONSENTS, type ConsentKind } from "@/content/consents";
import { handleError, jsonError, parseBody } from "@/lib/api";
import { hasLiveSubscription, normalizeEmail } from "@/lib/billing";
import { siteUrl } from "@/lib/env";
import { utmSchema } from "@/lib/quiz-schema";
import { ensureCatalog, stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { recordFunnelEvent } from "@/lib/track";

const schema = z.object({
  quizId: z.uuid(),
  vid: z.uuid(),
  email: z.email().max(254),
  age18: z.literal(true),
  immediateStart: z.literal(true),
  followup: z.boolean(),
  utm: utmSchema.optional(),
});

export async function POST(req: Request) {
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;
  const { quizId, vid, followup, utm } = body.data;
  const email = normalizeEmail(body.data.email);

  try {
    const db = supabaseAdmin();
    const { data: quiz } = await db.from("quiz_answers").select("id, user_id").eq("id", quizId).maybeSingle();
    if (!quiz) return jsonError(404, "Quiz introuvable, recommence le quiz.");

    if (await hasLiveSubscription(email)) {
      return jsonError(409, "Tu as déjà un abonnement en cours avec cet email. Connecte-toi pour accéder à l'app.", {
        code: "already_subscribed",
      });
    }

    // Preuve des consentements (texte exact + version + date)
    const kinds: ConsentKind[] = ["age_18", "immediate_start", ...(followup ? (["followup_emails"] as const) : [])];
    const { error: consentError } = await db.from("consents").insert(
      kinds.map((kind) => ({
        quiz_id: quizId,
        email,
        kind,
        version: CONSENTS[kind].version,
        text: CONSENTS[kind].text,
      })),
    );
    if (consentError) throw new Error(consentError.message);

    await db
      .from("quiz_answers")
      .update({ email, followup_consent_at: followup ? new Date().toISOString() : null })
      .eq("id", quizId);

    const { data: profile } = await db.from("profiles").select("stripe_customer_id").eq("email", email).maybeSingle();

    const metadata: Record<string, string> = { quiz_id: quizId, visitor_id: vid };
    for (const [k, v] of Object.entries(utm ?? {})) if (v) metadata[k] = v;

    const { priceId, couponId } = await ensureCatalog();
    const base = siteUrl();
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      discounts: [{ coupon: couponId }],
      ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: email }),
      client_reference_id: quizId,
      metadata,
      subscription_data: { metadata },
      locale: "fr",
      success_url: `${base}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/plan?annule=1`,
      custom_text: { submit: { message: PRICE_SENTENCE } },
    });

    await recordFunnelEvent({ visitorId: vid, type: "checkout_start", utm, userAgent: req.headers.get("user-agent") });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return handleError("checkout", err);
  }
}
