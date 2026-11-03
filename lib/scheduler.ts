import "server-only";
import { euros, PRICE_SENTENCE, PRICING } from "@/config/pricing";
import { day21Email, day7Email, morningEmail, quizFollowupEmail } from "@/content/emails";
import { CONSOLIDATION, MISSIONS, personalize } from "@/content/missions";
import {
  morningPush,
  pick,
  reminderPush,
  RISK_MESSAGES,
  RISK_SLOTS,
  START_DAY_PUSH,
} from "@/content/notifications";
import { hasLiveSubscription } from "@/lib/billing";
import { cardImageUrl } from "@/lib/card";
import { formatDayFr } from "@/lib/dates";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { ACTIVE_STATUSES, type Profile } from "@/lib/member";
import { sendEmailOnce } from "@/lib/notify";
import {
  attemptStats,
  currentMission,
  localDateKey,
  programDay,
  PROGRAM_DAYS,
  savedEuros,
  streakDays,
  type Attempt,
} from "@/lib/program";
import { sendPush, type PushPayload } from "@/lib/push";
import { costs, formatEuros, unitsPerWeekOf } from "@/lib/savings";
import { setSetting } from "@/lib/settings";
import { sign } from "@/lib/signing";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PROGRAM_IDS = MISSIONS.map((m) => m.id);
const HOUR = 3600_000;

type Local = { dateKey: string; hour: number; weekday: number };

function localParts(now: Date, timeZone: string): Local {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23", weekday: "short" }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  return { dateKey: localDateKey(now, timeZone), hour, weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd) };
}

/** Réserve une notification (1 par type et par jour). false si déjà envoyée. */
async function claim(userId: string, kind: string, dayKey: string, channel: "push" | "email"): Promise<boolean> {
  const { error } = await supabaseAdmin().from("notification_log").insert({ user_id: userId, kind, day_key: dayKey, channel });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(`notification_log : ${error.message}`);
}
async function release(userId: string, kind: string, dayKey: string) {
  await supabaseAdmin().from("notification_log").delete().eq("user_id", userId).eq("kind", kind).eq("day_key", dayKey);
}

async function inChunks<T>(ids: string[], fn: (chunk: string[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 200) out.push(...(await fn(ids.slice(i, i + 200))));
  return out;
}

export type HourlyResult = Record<string, number>;

/**
 * Tâche horaire : notifications du matin, moments à risque, rappel avant le 1er prélèvement,
 * emails J7 / J21, relances du quiz. Tout est idempotent (on peut la lancer plusieurs fois).
 */
export async function runHourly(now = new Date()): Promise<HourlyResult> {
  const db = supabaseAdmin();
  const r: HourlyResult = { morning_push: 0, morning_email: 0, risk_push: 0, reminder_push: 0, j7: 0, j21: 0, followups: 0, errors: 0 };

  // ───────── Abonnés actifs ─────────
  const { data: subsData } = await db
    .from("subscriptions")
    .select("id, user_id, first_renewal_at, price_cents, cancel_at_period_end, status")
    .in("status", ACTIVE_STATUSES)
    .not("user_id", "is", null);
  const subs = (subsData ?? []) as { id: string; user_id: string; first_renewal_at: string | null; price_cents: number | null; cancel_at_period_end: boolean }[];
  const userIds = [...new Set(subs.map((s) => s.user_id))];

  const profiles = await inChunks(userIds, async (c) => {
    const { data } = await db.from("profiles").select("*").in("user_id", c);
    return (data ?? []) as Profile[];
  });
  const attempts = await inChunks(userIds, async (c) => {
    const { data } = await db.from("quit_attempts").select("user_id, started_at, ended_at").in("user_id", c);
    return (data ?? []) as (Attempt & { user_id: string })[];
  });
  const completions = await inChunks(userIds, async (c) => {
    const { data } = await db.from("mission_completions").select("user_id, mission_id").in("user_id", c);
    return (data ?? []) as { user_id: string; mission_id: string }[];
  });
  const devices = await inChunks(userIds, async (c) => {
    const { data } = await db.from("push_subscriptions").select("user_id").in("user_id", c);
    return (data ?? []) as { user_id: string }[];
  });
  const hasPush = new Set(devices.map((d) => d.user_id));

  for (const p of profiles) {
    try {
      const tz = p.timezone || "Europe/Paris";
      const local = localParts(now, tz);
      const myAttempts = attempts.filter((a) => a.user_id === p.user_id);
      const stats = attemptStats(myAttempts, now);
      const day = programDay(stats.firstStart, now, tz);
      const done = new Set(completions.filter((c) => c.user_id === p.user_id).map((c) => c.mission_id));
      const saved = savedEuros(stats.totalMs, unitsPerWeekOf(p), p.unit_price_cents ?? 0);
      const savedLabel = saved >= 1 ? formatEuros(saved) : "";
      const push = hasPush.has(p.user_id);
      const morningHour = p.morning_hour ?? 9;

      // 1. Le matin : mission du jour (ou jour J)
      if (p.notify_morning !== false && local.hour === morningHour) {
        let payload: PushPayload | null = null;
        let emailMission: { title: string; consolidation: boolean } | null = null;
        if (day === 0) {
          if (p.start_date && p.start_date <= local.dateKey) payload = { ...START_DAY_PUSH, url: "/app", tag: "morning" };
        } else {
          const slot = currentMission(day, done, PROGRAM_IDS, CONSOLIDATION.length);
          const weekly = day > PROGRAM_DAYS;
          const sendToday = !weekly || (day - PROGRAM_DAYS - 1) % 7 === 0;
          if (sendToday && (slot.kind === "program" || slot.kind === "consolidation")) {
            const title =
              slot.kind === "program"
                ? personalize(MISSIONS[slot.number - 1], p.triggers ?? []).title
                : CONSOLIDATION[slot.contentIndex].title;
            payload = { ...morningPush({ day, missionTitle: title, saved: savedLabel, consolidation: weekly }), url: "/app/mission", tag: "morning" };
            emailMission = { title, consolidation: weekly };
          }
        }
        if (payload) {
          if (push) {
            if (await claim(p.user_id, "morning", local.dateKey, "push")) {
              if ((await sendPush(p.user_id, payload)) > 0) r.morning_push++;
              else await release(p.user_id, "morning", local.dateKey);
            }
          }
          // Email de secours : pas de notification possible sur le téléphone
          if (!push && p.notify_email !== false && emailMission && (await claim(p.user_id, "morning", local.dateKey, "email"))) {
            try {
              await sendEmail(
                p.email,
                morningEmail({ appUrl: `${siteUrl()}/app/mission`, day, missionTitle: emailMission.title, saved: savedLabel, consolidation: emailMission.consolidation }),
              );
              r.morning_email++;
            } catch (err) {
              await release(p.user_id, "morning", local.dateKey);
              throw err;
            }
          }
        }
      }

      // 2. Moments à risque (2 maximum par jour, notifications uniquement)
      if (p.notify_risk !== false && push && day >= 1) {
        const risky = (p.triggers ?? []).filter((t) => RISK_SLOTS[t as keyof typeof RISK_SLOTS]).slice(0, 2);
        for (const t of risky) {
          const slot = RISK_SLOTS[t as keyof typeof RISK_SLOTS]!;
          if (slot.hour !== local.hour || (slot.days && !slot.days.includes(local.weekday))) continue;
          const kind = `risk:${t}`;
          if (await claim(p.user_id, kind, local.dateKey, "push")) {
            const msg = pick(RISK_MESSAGES[t as keyof typeof RISK_MESSAGES], local.dateKey);
            if ((await sendPush(p.user_id, { ...msg, url: "/app/sos", tag: kind })) > 0) r.risk_push++;
            else await release(p.user_id, kind, local.dateKey);
          }
        }
      }

      // 3. Rappel avant le 1er prélèvement au prix plein (notification ; l'email part via la tâche quotidienne)
      const sub = subs.find((s) => s.user_id === p.user_id && !s.cancel_at_period_end && s.first_renewal_at);
      if (sub && push) {
        const renewal = Date.parse(sub.first_renewal_at!);
        const minH = PRICING.reminderHoursBeforeFirstRenewal;
        if (renewal > now.getTime() && renewal - now.getTime() <= (minH + 24) * HOUR && local.hour >= 9 && local.hour <= 20) {
          if (await claim(p.user_id, "reminder", `sub:${sub.id}`, "push")) {
            const msg = reminderPush({ weekly: euros(sub.price_cents ?? PRICING.weeklyCents), date: formatDayFr(sub.first_renewal_at, { timeZone: tz }) });
            if ((await sendPush(p.user_id, { ...msg, url: "/app/compte", tag: "reminder" })) > 0) r.reminder_push++;
            else await release(p.user_id, "reminder", `sub:${sub.id}`);
          }
        }
      }

      // 4. Emails J7 et J21 (à l'heure du matin de la personne)
      if ((day === 7 || day === PROGRAM_DAYS) && local.hour === morningHour) {
        const { count } = await db.from("cravings").select("id", { count: "exact", head: true }).eq("user_id", p.user_id).eq("outcome", "overcome");
        const cravings = count ?? 0;
        if (day === 7) {
          const missions = PROGRAM_IDS.filter((id) => done.has(id)).length;
          if (await sendEmailOnce({ kind: "j7", ref: p.user_id, to: p.email, userId: p.user_id, content: day7Email({ appUrl: `${siteUrl()}/app/mission`, streakDays: streakDays(stats.currentMs), saved: formatEuros(saved), cravings, missions }) })) r.j7++;
        } else if (
          await sendEmailOnce({
            kind: "j21",
            ref: p.user_id,
            to: p.email,
            userId: p.user_id,
            content: day21Email({ shareUrl: `${siteUrl()}/app/partager`, cardUrl: cardImageUrl(p.user_id), streakDays: streakDays(stats.currentMs), saved: formatEuros(saved), cravings }),
          })
        ) {
          r.j21++;
        }
      }
    } catch (err) {
      r.errors++;
      console.error("[hourly]", p.user_id, err);
    }
  }

  // ───────── 5. Relances quiz fini mais pas payé (uniquement avec consentement) ─────────
  try {
    r.followups = await sendQuizFollowups(now);
  } catch (err) {
    r.errors++;
    console.error("[hourly followups]", err);
  }

  await setSetting("hourly_last_run", now.toISOString()).catch(() => {});
  return r;
}

type QuizRow = { id: string; email: string; answers: { perMonth?: number; perWeek?: number; unitPrice?: number }; created_at: string };

async function sendQuizFollowups(now: Date): Promise<number> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("quiz_answers")
    .select("id, email, answers, created_at")
    .is("user_id", null)
    .not("followup_consent_at", "is", null)
    .not("email", "is", null)
    .gte("created_at", new Date(now.getTime() - 49 * HOUR).toISOString())
    .lte("created_at", new Date(now.getTime() - 1 * HOUR).toISOString())
    .order("created_at", { ascending: false });
  // Un seul quiz par email : le plus récent
  const latest = new Map<string, QuizRow>();
  for (const q of (data ?? []) as QuizRow[]) if (!latest.has(q.email)) latest.set(q.email, q);

  let sent = 0;
  for (const q of latest.values()) {
    if (await hasLiveSubscription(q.email)) continue;
    const ageH = (now.getTime() - Date.parse(q.created_at)) / HOUR;
    const { count: firstSent } = await db.from("email_log").select("id", { count: "exact", head: true }).eq("kind", "quiz_followup_1").eq("ref", q.id);
    const second = ageH >= 24 && Boolean(firstSent);
    if (!second && firstSent) continue;
    const perMonth = q.answers.perMonth ?? ((q.answers.perWeek ?? 0) * 52) / 12;
    const content = quizFollowupEmail({
      resumeUrl: `${siteUrl()}/reprendre?q=${q.id}&s=${sign("resume", q.id)}`,
      unsubscribeUrl: `${siteUrl()}/desinscription?q=${q.id}&s=${sign("unsub", q.id)}`,
      yearlyCost: formatEuros(costs(perMonth, q.answers.unitPrice ?? 0).year),
      second,
      priceSentence: PRICE_SENTENCE,
    });
    if (await sendEmailOnce({ kind: second ? "quiz_followup_2" : "quiz_followup_1", ref: q.id, to: q.email, content })) sent++;
  }
  return sent;
}
