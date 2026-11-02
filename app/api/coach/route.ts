import { z } from "zod";
import { COACH_ERROR, COACH_SAFE_FALLBACK, COACH_UNAVAILABLE, CRISIS_PATTERN } from "@/content/coach-prompt";
import { jsonError, parseBody } from "@/lib/api";
import {
  anthropic,
  COACH_MODEL,
  coachHistory,
  coachSystem,
  logAnthropicError,
  MAX_MESSAGE_CHARS,
  messagesLeftToday,
} from "@/lib/coach";
import { getMember } from "@/lib/member";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;

const schema = z.object({ message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS) });

/**
 * Chat avec le coach, réponse en streaming (le texte s'affiche au fur et à mesure).
 * Limite de messages par jour et par personne (config/site.ts → LIMITS.coachMessagesPerDay).
 */
export async function POST(req: Request) {
  const m = await getMember();
  if (!m) return jsonError(401, "Connecte-toi pour parler au coach.");
  if (!m.isActive) return jsonError(403, "Ton abonnement n'est plus actif.");

  const body = await parseBody(req, schema);
  if (!body.ok) return body.response;
  const message = body.data.message;

  const left = await messagesLeftToday(m);
  if (left <= 0) {
    return jsonError(429, "Tu as atteint la limite de messages pour aujourd'hui. Le coach revient demain matin. Le bouton SOS, lui, est toujours là.", {
      remaining: 0,
    });
  }

  const db = supabaseAdmin();
  const history = await coachHistory(m.user.id);
  const { error: insertError } = await db.from("coach_messages").insert({ user_id: m.user.id, role: "user", content: message });
  if (insertError) return jsonError(500, COACH_ERROR);

  const headers = {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "x-coach-remaining": String(left - 1),
    "x-coach-crisis": CRISIS_PATTERN.test(message) ? "1" : "0",
  };

  const save = async (content: string) => {
    if (!content.trim()) return;
    const { error } = await db.from("coach_messages").insert({ user_id: m.user.id, role: "assistant", content: content.trim() });
    if (error) console.error("[coach] sauvegarde", error.message);
  };

  const ai = anthropic();
  if (!ai) {
    await save(COACH_UNAVAILABLE);
    return new Response(COACH_UNAVAILABLE, { headers });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let text = "";
      const push = (t: string) => {
        text += t;
        controller.enqueue(encoder.encode(t));
      };
      try {
        const s = ai.messages.stream({
          model: COACH_MODEL,
          max_tokens: 1024,
          output_config: { effort: "low" },
          system: coachSystem(m),
          messages: [...history, { role: "user", content: message }],
        });
        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") push(event.delta.text);
        }
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal" && !text.trim()) push(COACH_SAFE_FALLBACK);
        else if (!text.trim()) push(COACH_ERROR);
      } catch (err) {
        logAnthropicError("chat", err);
        push(text ? `\n\n${COACH_ERROR}` : COACH_ERROR);
      } finally {
        await save(text);
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}
