import { z } from "zod";
import { utmSchema } from "@/lib/quiz-schema";
import { FUNNEL_STEPS, recordFunnelEvent } from "@/lib/track";
import { parseBody } from "@/lib/api";

// "paid" n'est enregistré que par le serveur, après confirmation de Stripe.
const CLIENT_STEPS = FUNNEL_STEPS.filter((s) => s !== "paid" && s !== "quiz_done") as [string, ...string[]];

const schema = z.object({
  vid: z.uuid(),
  type: z.enum(CLIENT_STEPS),
  utm: utmSchema.optional(),
});

export async function POST(req: Request) {
  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;
  try {
    await recordFunnelEvent({
      visitorId: body.data.vid,
      type: body.data.type as (typeof FUNNEL_STEPS)[number],
      utm: body.data.utm,
      userAgent: req.headers.get("user-agent"),
    });
  } catch (err) {
    console.error("[track]", err);
  }
  return new Response(null, { status: 204 });
}
