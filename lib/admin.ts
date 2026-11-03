import "server-only";
import { ACTIVE_STATUSES } from "@/lib/member";
import { localDateKey } from "@/lib/program";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Seul le compte ADMIN_EMAIL a accès à /admin. */
export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  return Boolean(admin) && (email ?? "").trim().toLowerCase() === admin;
}

export const PERIODS = {
  "24h": { label: "24 h", ms: 24 * 3600_000 },
  "7j": { label: "7 jours", ms: 7 * 24 * 3600_000 },
  "30j": { label: "30 jours", ms: 30 * 24 * 3600_000 },
  tout: { label: "Tout", ms: null },
} as const;
export type PeriodKey = keyof typeof PERIODS;

export const FUNNEL = [
  { step: "visit", label: "Visites" },
  { step: "calc_used", label: "Calculateur utilisé" },
  { step: "quiz_start", label: "Quiz commencé" },
  { step: "quiz_done", label: "Quiz terminé" },
  { step: "paywall_view", label: "Page de paiement vue" },
  { step: "checkout_start", label: "Paiement lancé" },
  { step: "paid", label: "Payé" },
] as const;

type StatRow = { dimension: "total" | "video" | "browser"; value: string | null; step: string; visitors: number };
type SubRow = {
  id: string;
  user_id: string | null;
  status: string;
  price_cents: number | null;
  created_at: string;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  utm_content: string | null;
};
type PaymentRow = { amount_cents: number; status: string; paid_at: string | null; subscription_id: string | null; billing_reason: string | null };

/** Lit une table entière par pages de 1000 lignes (limite de l'API Supabase). */
async function readAll<T>(build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw new Error(error.message);
    const rows = (data as T[] | null) ?? [];
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

/** Début de la semaine (lundi) en heure de Paris, au format AAAA-MM-JJ. */
function weekKey(d: Date): string {
  const key = localDateKey(d, "Europe/Paris");
  const day = new Date(`${key}T12:00:00Z`);
  const dow = (day.getUTCDay() + 6) % 7; // lundi = 0
  day.setUTCDate(day.getUTCDate() - dow);
  return day.toISOString().slice(0, 10);
}

export async function loadAdminData(period: PeriodKey) {
  const db = supabaseAdmin();
  const now = new Date();
  const ms = PERIODS[period].ms;
  const since = ms ? new Date(now.getTime() - ms) : new Date("2020-01-01T00:00:00Z");
  const sinceIso = since.toISOString();
  const inPeriod = (iso: string | null) => Boolean(iso) && Date.parse(iso!) >= since.getTime();

  const [statsRes, subs, payments] = await Promise.all([
    db.rpc("admin_funnel_stats", { p_since: sinceIso, p_until: new Date(now.getTime() + 60_000).toISOString() }),
    readAll<SubRow>((a, b) =>
      db.from("subscriptions").select("id, user_id, status, price_cents, created_at, canceled_at, cancel_at_period_end, utm_content").order("created_at").range(a, b),
    ),
    readAll<PaymentRow>((a, b) =>
      db.from("payments").select("amount_cents, status, paid_at, subscription_id, billing_reason").eq("status", "paid").order("paid_at").range(a, b),
    ),
  ]);
  if (statsRes.error) throw new Error(`Statistiques : ${statsRes.error.message} (as-tu lancé supabase/migrations/0005_admin.sql ?)`);
  const stats = (statsRes.data ?? []) as StatRow[];

  // ───────── Parcours ─────────
  const total = (step: string) => Number(stats.find((r) => r.dimension === "total" && r.step === step)?.visitors ?? 0);
  const funnel = FUNNEL.map((f, i) => {
    const visitors = total(f.step);
    const prev = i === 0 ? visitors : total(FUNNEL[i - 1].step);
    return { ...f, visitors, fromPrev: prev ? visitors / prev : null, fromStart: total("visit") ? visitors / total("visit") : null };
  });

  // ───────── Abonnés ─────────
  const active = subs.filter((s) => ACTIVE_STATUSES.includes(s.status));
  const subsBySub = new Map(subs.map((s) => [s.id, s]));
  const newSubs = subs.filter((s) => inPeriod(s.created_at));
  const cancellations = subs.filter((s) => inPeriod(s.canceled_at));

  // ───────── Revenu ─────────
  const paidInPeriod = payments.filter((p) => inPeriod(p.paid_at));
  const revenue = paidInPeriod.reduce((sum, p) => sum + p.amount_cents, 0);
  const last7 = payments.filter((p) => p.paid_at && Date.parse(p.paid_at) >= now.getTime() - 7 * 24 * 3600_000).reduce((s, p) => s + p.amount_cents, 0);
  const renewals = paidInPeriod.filter((p) => p.billing_reason === "subscription_cycle").length;
  // Projection : si tous les abonnés actifs non résiliés renouvellent leur prochaine semaine
  const nextWeekRunRate = active.filter((s) => !s.cancel_at_period_end).reduce((sum, s) => sum + (s.price_cents ?? 0), 0);

  // 8 dernières semaines (lundi → dimanche, heure de Paris)
  const weeks: { week: string; cents: number; count: number }[] = [];
  const thisWeek = weekKey(now);
  for (let i = 7; i >= 0; i--) {
    const d = new Date(`${thisWeek}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7 * i);
    weeks.push({ week: d.toISOString().slice(0, 10), cents: 0, count: 0 });
  }
  for (const p of payments) {
    if (!p.paid_at) continue;
    const w = weeks.find((x) => x.week === weekKey(new Date(p.paid_at!)));
    if (w) {
      w.cents += p.amount_cents;
      w.count++;
    }
  }

  // ───────── Par vidéo ─────────
  const videoKeys = new Set(stats.filter((r) => r.dimension === "video").map((r) => r.value ?? "(sans vidéo)"));
  for (const s of newSubs) videoKeys.add(s.utm_content || "(sans vidéo)");
  const videos = [...videoKeys]
    .map((video) => {
      const v = (step: string) => Number(stats.find((r) => r.dimension === "video" && r.value === video && r.step === step)?.visitors ?? 0);
      const sales = newSubs.filter((s) => (s.utm_content || "(sans vidéo)") === video).length;
      const cents = paidInPeriod
        .filter((p) => {
          const sub = p.subscription_id ? subsBySub.get(p.subscription_id) : null;
          return (sub?.utm_content || "(sans vidéo)") === video;
        })
        .reduce((sum, p) => sum + p.amount_cents, 0);
      const visits = v("visit");
      return { video, visits, quizDone: v("quiz_done"), checkouts: v("checkout_start"), sales, cents, conversion: visits ? sales / visits : null };
    })
    .sort((a, b) => b.sales - a.sales || b.cents - a.cents || b.visits - a.visits);

  // ───────── Par navigateur ─────────
  const browsers = ["tiktok", "instagram", "facebook", "other"]
    .map((b) => {
      const v = (step: string) => Number(stats.find((r) => r.dimension === "browser" && r.value === b && r.step === step)?.visitors ?? 0);
      return { browser: b, visits: v("visit"), quizDone: v("quiz_done"), checkouts: v("checkout_start"), paid: v("paid") };
    })
    .filter((b) => b.visits || b.paid);

  // ───────── Programme ─────────
  const [overcomeRes, relapsesRes, coachRes, devicesRes] = await Promise.all([
    db.from("cravings").select("id", { count: "exact", head: true }).eq("outcome", "overcome").gte("created_at", sinceIso),
    db.from("quit_attempts").select("id", { count: "exact", head: true }).gte("ended_at", sinceIso),
    db.from("coach_messages").select("id", { count: "exact", head: true }).eq("role", "user").gte("created_at", sinceIso),
    db.from("push_subscriptions").select("id", { count: "exact", head: true }),
  ]);
  const program = {
    overcome: overcomeRes.count ?? 0,
    relapses: relapsesRes.count ?? 0,
    coachMessages: coachRes.count ?? 0,
    devices: devicesRes.count ?? 0,
  };

  return {
    period,
    since,
    funnel,
    subscribers: {
      active: active.length,
      cancelScheduled: active.filter((s) => s.cancel_at_period_end).length,
      pastDue: subs.filter((s) => s.status === "past_due" || s.status === "unpaid").length,
      newInPeriod: newSubs.length,
      cancellationsInPeriod: cancellations.length,
    },
    revenue: { inPeriod: revenue, last7, renewals, nextWeekRunRate, weeks },
    videos,
    browsers,
    program,
  };
}

export type AdminData = Awaited<ReturnType<typeof loadAdminData>>;
