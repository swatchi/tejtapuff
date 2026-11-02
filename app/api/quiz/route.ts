import { NextResponse } from "next/server";
import { z } from "zod";
import { CONSENTS } from "@/content/consents";
import { handleError, parseBody } from "@/lib/api";
import { quizAnswersSchema, utmSchema } from "@/lib/quiz-schema";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { recordFunnelEvent } from "@/lib/track";

const schema = z.object({
  vid: z.uuid(),
  answers: quizAnswersSchema,
  /** Consentement explicite au traitement des réponses (données sensibles) */
  consent: z.literal(true),
  utm: utmSchema.optional(),
});

export async function POST(req: Request) {
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;
  const { vid, answers, utm } = body.data;
  try {
    const db = supabaseAdmin();
    const { data: quiz, error } = await db
      .from("quiz_answers")
      .insert({
        visitor_id: vid,
        answers,
        consent_version: CONSENTS.sensitive_data.version,
        utm_content: utm?.utm_content ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: consentError } = await db.from("consents").insert({
      quiz_id: quiz.id,
      kind: "sensitive_data",
      version: CONSENTS.sensitive_data.version,
      text: CONSENTS.sensitive_data.text,
    });
    if (consentError) throw new Error(consentError.message);

    await recordFunnelEvent({ visitorId: vid, type: "quiz_done", utm, userAgent: req.headers.get("user-agent") });
    return NextResponse.json({ quizId: quiz.id });
  } catch (err) {
    return handleError("quiz", err);
  }
}
