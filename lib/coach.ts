import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { LIMITS } from "@/config/site";
import { COACH_SYSTEM_PROMPT, RELAPSE_FALLBACK, RELAPSE_TRIGGER } from "@/content/coach-prompt";
import { CONSOLIDATION, MISSIONS, personalize, PHASES } from "@/content/missions";
import { REASONS, SINCE, TRIGGERS } from "@/content/quiz";
import { getUnit } from "@/content/units";
import type { Member } from "@/lib/member";
import { currentMission, localDateKey, PROGRAM_DAYS, savedEuros, streakDays } from "@/lib/program";
import { formatEuros, unitsPerMonthOf, unitsPerWeekOf } from "@/lib/savings";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Modèle du coach : rapide et peu coûteux. */
export const COACH_MODEL = "claude-haiku-5-5";
/** Nombre de messages précédents envoyés à l'IA (contexte court = coût maîtrisé). */
const HISTORY_LIMIT = 16;
export const MAX_MESSAGE_CHARS = 1000;

let client: Anthropic | null = null;
export function anthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ maxRetries: 2, timeout: 45_000 });
  return client;
}

const label = <T extends { id: string; label: string }>(list: readonly T[], id: string) =>
  list.find((x) => x.id === id)?.label ?? id;

/**
 * Ce que le coach sait de la personne. Uniquement des infos de programme :
 * jamais l'email, jamais le nom.
 */
export function buildCoachContext(m: Member): string {
  const p = m.profile;
  const unit = getUnit(p?.vape_unit);
  const lines: string[] = [];
  const perMonth = Math.round(unitsPerMonthOf(p));
  if (perMonth && p?.unit_price_cents) {
    lines.push(
      `- Ce qu'elle vapait : ${unit.label.toLowerCase()}, environ ${perMonth} par mois à ${formatEuros(p.unit_price_cents / 100)} l'unité`,
    );
  }
  if (p?.vaping_since) lines.push(`- Vape depuis : ${label(SINCE, p.vaping_since).toLowerCase()}`);
  if (p?.triggers?.length) {
    lines.push(`- Moments où l'envie frappe le plus : ${p.triggers.map((t) => TRIGGERS.find((x) => x.id === t)?.phrase ?? t).join(", ")}`);
  }
  if (p?.reasons?.length) lines.push(`- Ses raisons d'arrêter : ${p.reasons.map((r) => label(REASONS, r).toLowerCase()).join(", ")}`);

  if (!m.stats.firstStart) {
    lines.push("- Programme : pas encore démarré (elle n'a pas encore lancé son compteur)");
  } else {
    const phase = PHASES.find((ph) => m.day >= ph.from && m.day <= ph.to);
    lines.push(
      m.day <= PROGRAM_DAYS
        ? `- Programme : jour ${m.day} sur ${PROGRAM_DAYS}${phase ? ` (phase « ${phase.title} »)` : ""}`
        : `- Programme : jour ${m.day}, les 21 jours sont passés, phase de consolidation (une mission par semaine)`,
    );
    lines.push(
      `- Sans puff depuis : ${streakDays(m.stats.currentMs)} jour(s) complet(s) (record : ${streakDays(m.stats.bestMs)} j), craquages déclarés : ${m.stats.relapses}`,
    );
    const saved = savedEuros(m.stats.totalMs, unitsPerWeekOf(p), p?.unit_price_cents ?? 0);
    if (saved > 0) lines.push(`- Argent économisé depuis le début : ${formatEuros(saved)}`);
    lines.push(`- Envies surmontées avec le bouton SOS : ${m.cravingsOvercome}`);
    const slot = currentMission(m.day, m.completed, MISSIONS.map((x) => x.id), CONSOLIDATION.length);
    if (slot.kind === "program") lines.push(`- Mission en cours : « ${personalize(MISSIONS[slot.number - 1], p?.triggers ?? []).title} »`);
    if (slot.kind === "consolidation") lines.push(`- Mission de la semaine : « ${CONSOLIDATION[slot.contentIndex].title} »`);
  }

  const now = new Date();
  const when = now.toLocaleString("fr-FR", {
    timeZone: m.timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  lines.push(`- Date et heure chez elle : ${when}`);

  return `# Ce que tu sais de la personne (quiz et app TejTaPuff)\n${lines.join("\n")}`;
}

export function coachSystem(m: Member): Anthropic.TextBlockParam[] {
  return [
    // Partie fixe en premier (mise en cache), partie qui change ensuite.
    { type: "text", text: COACH_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    { type: "text", text: buildCoachContext(m) },
  ];
}

type StoredMessage = { role: "user" | "assistant"; content: string; kind: string };

/** Historique récent au format de l'API (commence toujours par un message « user »). */
export async function coachHistory(userId: string): Promise<Anthropic.MessageParam[]> {
  const { data } = await supabaseAdmin()
    .from("coach_messages")
    .select("role, content, kind")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(HISTORY_LIMIT);
  const rows = ((data as StoredMessage[] | null) ?? []).reverse();
  const out: Anthropic.MessageParam[] = [];
  for (const r of rows) {
    if (r.role === "assistant" && r.kind === "relapse") out.push({ role: "user", content: RELAPSE_TRIGGER });
    out.push({ role: r.role, content: r.content });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

/** Début de la journée (minuit) dans le fuseau de la personne, en ISO. */
export function startOfLocalDay(timeZone: string, now = new Date()): string {
  const key = localDateKey(now, timeZone);
  // On cherche l'instant UTC qui correspond à minuit local (gère l'heure d'été).
  for (let offsetH = -14; offsetH <= 14; offsetH++) {
    const candidate = new Date(`${key}T00:00:00Z`);
    candidate.setUTCHours(candidate.getUTCHours() - offsetH);
    if (localDateKey(candidate, timeZone) === key) {
      const before = new Date(candidate.getTime() - 60_000);
      if (localDateKey(before, timeZone) !== key) return candidate.toISOString();
    }
  }
  return new Date(`${key}T00:00:00Z`).toISOString();
}

export async function messagesLeftToday(m: Member): Promise<number> {
  const { count } = await supabaseAdmin()
    .from("coach_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", m.user.id)
    .eq("role", "user")
    .gte("created_at", startOfLocalDay(m.timeZone));
  return Math.max(0, LIMITS.coachMessagesPerDay - (count ?? 0));
}

export function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/** Message du coach après « J'ai craqué » (appelé en arrière-plan). */
export async function sendRelapseMessage(m: Member): Promise<void> {
  let text = RELAPSE_FALLBACK;
  const ai = anthropic();
  if (ai) {
    try {
      const history = await coachHistory(m.user.id);
      const response = await ai.messages.create({
        model: COACH_MODEL,
        max_tokens: 1024,
        output_config: { effort: "low" },
        system: coachSystem(m),
        messages: [...history, { role: "user", content: RELAPSE_TRIGGER }],
      });
      const t = response.stop_reason === "refusal" ? "" : textOf(response);
      if (t) text = t;
    } catch (err) {
      logAnthropicError("relapse", err);
    }
  }
  await supabaseAdmin().from("coach_messages").insert({ user_id: m.user.id, role: "assistant", content: text, kind: "relapse" });
}

export function logAnthropicError(scope: string, err: unknown) {
  if (err instanceof Anthropic.RateLimitError) console.error(`[coach ${scope}] limite de débit Anthropic atteinte`);
  else if (err instanceof Anthropic.AuthenticationError) console.error(`[coach ${scope}] clé ANTHROPIC_API_KEY invalide`);
  else if (err instanceof Anthropic.APIError) console.error(`[coach ${scope}] erreur API ${err.status}`, err.message);
  else console.error(`[coach ${scope}]`, err);
}
