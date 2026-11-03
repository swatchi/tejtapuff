import type { Metadata } from "next";
import Link from "next/link";
import { Celebrate } from "@/components/app/Celebrate";
import { GoalCard } from "@/components/app/GoalCard";
import { InstallBanner } from "@/components/app/InstallBanner";
import { NotificationsCard } from "@/components/app/NotificationsCard";
import { LiveCounter, LiveSavings } from "@/components/app/LiveStats";
import { SubmitButton } from "@/components/app/SubmitButton";
import { Logo } from "@/components/Logo";
import { conseilDuJour } from "@/content/conseils";
import { CONSOLIDATION, MISSIONS, personalize, PHASES } from "@/content/missions";
import { REASONS } from "@/content/quiz";
import { formatDayFr, fromDateOnly } from "@/lib/dates";
import { requireMember } from "@/lib/member";
import { badgesOf, nextTimeBadge } from "@/lib/milestones";
import { currentMission, PROGRAM_DAYS, savedEuros, streakDays } from "@/lib/program";
import { unitsPerWeekOf } from "@/lib/savings";
import { startProgram } from "./actions";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Mon programme", robots: { index: false } };

const PROGRAM_IDS = MISSIONS.map((m) => m.id);

/** Tableau de bord. Tous les chiffres viennent de la base (tentatives, missions, envies, conso déclarée). */
export default async function Dashboard() {
  const m = await requireMember();
  const { stats, day, profile } = m;
  const started = Boolean(stats.firstStart);
  const slot = currentMission(day, m.completed, PROGRAM_IDS, CONSOLIDATION.length);
  const phase = PHASES.find((p) => day >= p.from && day <= p.to);
  const programDone = PROGRAM_IDS.filter((id) => m.completed.has(id)).length;
  const closedMs = stats.totalMs - stats.currentMs;
  const serverNow = m.now.getTime();
  const saved = savedEuros(stats.totalMs, unitsPerWeekOf(profile), profile?.unit_price_cents ?? 0);
  const badges = badgesOf({ currentMs: stats.currentMs, bestMs: stats.bestMs, cravings: m.cravingsOvercome, missions: programDone, savedEuros: saved });
  const prochain = nextTimeBadge(badges);
  const gagnes = badges.filter((b) => b.done);
  const raisons = REASONS.filter((r) => profile?.reasons?.includes(r.id));

  const mission =
    slot.kind === "program"
      ? personalize(MISSIONS[slot.number - 1], profile?.triggers ?? [])
      : slot.kind === "consolidation"
        ? personalize(CONSOLIDATION[slot.contentIndex], [])
        : null;

  return (
    <main>
      <header className="bg-jaune pb-6 pt-4">
        <div className="wrap">
          <div className="flex items-center justify-between">
            <span className="text-xl">
              <Logo />
            </span>
            {started && (
              <span className="rounded-full border-2 border-encre bg-creme px-3 py-1 text-sm font-extrabold tabular-nums">
                {day <= PROGRAM_DAYS ? `Jour ${day}/${PROGRAM_DAYS}` : `Jour ${day} · consolidation`}
              </span>
            )}
          </div>
          {m.subscription?.status === "past_due" && (
            <Link href="/app/compte" className="mt-4 block rounded-2xl border-2 border-encre bg-white p-3 font-semibold">
              Ton dernier paiement n&apos;est pas passé. Mets à jour ta carte →
            </Link>
          )}
        </div>
      </header>

      {!started ? (
        /* ───────── Pas encore démarré ───────── */
        <section className="wrap -mt-2 pt-6">
          <h1 className="text-[2.4rem] font-extrabold leading-[0.95] tracking-tight">On y va ?</h1>
          {profile?.start_date && (
            <p className="mt-3 text-lg">
              Ton jour 1 prévu : <strong>{formatDayFr(fromDateOnly(profile.start_date), { capitalize: true, timeZone: "UTC" })}</strong>
            </p>
          )}
          <p className="mt-3 text-encre/80">
            Le compteur démarre quand tu appuies. Fais-le au moment où tu as tej ta dernière puff, pas avant.
          </p>
          <form action={startProgram} className="mt-6">
            <SubmitButton pendingLabel="C'est parti…">J&apos;ai tej ma dernière puff : je démarre</SubmitButton>
          </form>
          <div className="mt-6">
            <InstallBanner />
          </div>
        </section>
      ) : (
        <>
          {/* ───────── Compteur ───────── */}
          <section className="wrap -mt-1 pt-5">
            <div className="card bg-encre p-5 text-creme shadow-[3px_4px_0_0_#ff5b3a]">
              <p className="text-sm font-bold uppercase tracking-wide text-jaune">Sans puff depuis</p>
              <div className="mt-3">
                <LiveCounter startIso={stats.currentStart ?? new Date(serverNow).toISOString()} serverNow={serverNow} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="tile bg-[#dff5ea]">
                <p className="tile-label">€ économisés</p>
                <p className="tile-value text-[#0f7a50]">
                  <LiveSavings
                    closedMs={closedMs}
                    currentStartIso={stats.currentStart}
                    unitsPerWeek={unitsPerWeekOf(profile)}
                    unitPriceCents={profile?.unit_price_cents ?? 0}
                    serverNow={serverNow}
                  />
                </p>
              </div>
              <div className="tile bg-[#dcf0ff]">
                <p className="tile-label">Envies battues</p>
                <p className="tile-value">{m.cravingsOvercome}</p>
              </div>
              <div className="tile">
                <p className="tile-label">Série en cours</p>
                <p className="tile-value">{streakDays(stats.currentMs)} j</p>
                <p className="mt-1 text-xs font-semibold text-gris">record : {streakDays(stats.bestMs)} j</p>
              </div>
              <div className="tile">
                <p className="tile-label">Missions</p>
                <p className="tile-value">
                  {programDone}
                  <span className="text-lg text-gris">/{PROGRAM_DAYS}</span>
                </p>
              </div>
            </div>

            {prochain && (
              <div className="tile mt-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-extrabold">
                    <Icon name={prochain.emoji} className="h-5 w-5 shrink-0" /> Prochain cap : {prochain.label}
                  </p>
                  <p className="shrink-0 text-sm font-semibold text-gris">{prochain.remaining}</p>
                </div>
                <div className="bar mt-2" aria-hidden>
                  <span style={{ width: `${Math.max(3, prochain.progress * 100)}%` }} />
                </div>
              </div>
            )}
          </section>

          {/* ───────── Mission ───────── */}
          <section className="wrap mt-6">
            <Link href="/app/mission" className="card block p-5">
              <p className="text-sm font-bold text-braise">
                {slot.kind === "program"
                  ? `Mission ${slot.number}${phase ? ` · ${phase.title}` : ""}`
                  : slot.kind === "consolidation"
                    ? `Mission de la semaine`
                    : "Mission du jour"}
              </p>
              {mission ? (
                <>
                  <h2 className="mt-1 text-2xl font-extrabold leading-tight">{mission.title}</h2>
                  <p className="mt-1 line-clamp-2 text-encre/75">{mission.why}</p>
                  <p className="mt-3 font-bold">Voir la mission →</p>
                </>
              ) : (
                <>
                  <h2 className="mt-1 text-2xl font-extrabold leading-tight">C&apos;est fait pour aujourd&apos;hui</h2>
                  <p className="mt-1 text-encre/75">
                    {slot.kind === "program_done_today"
                      ? `La mission ${slot.nextNumber} se débloque demain.`
                      : "La prochaine arrive la semaine prochaine."}
                  </p>
                </>
              )}
            </Link>
          </section>

          {/* ───────── SOS + J'ai craqué ───────── */}
          <section className="wrap mt-6 space-y-4">
            <Link
              href="/app/sos"
              className="card flex items-center gap-4 bg-braise p-4 text-white"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white text-lg font-black">
                SOS
              </span>
              <span>
                <span className="block text-xl font-extrabold leading-tight">Grosse envie ?</span>
                <span className="block text-white/90">Un exercice de 1 à 5 min pour passer le pic.</span>
              </span>
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/app/coach" className="card bg-ciel p-4">
                <Icon name="chat" className="h-7 w-7" />
                <span className="mt-1 block font-extrabold leading-tight">Parler au coach</span>
              </Link>
              <Link href="/app/partager" className="card bg-rose p-4">
                <Icon name="camera" className="h-7 w-7" />
                <span className="mt-1 block font-extrabold leading-tight">Partager ma carte</span>
              </Link>
            </div>
          </section>

          {/* ───────── Objectif, badges, raisons, conseil ───────── */}
          <section className="wrap mt-6 space-y-4">
            {m.goal && <GoalCard goal={m.goal} savedEuros={saved} />}

            <div className="card p-5">
              <div className="flex items-baseline justify-between">
                <p className="tile-label">Tes badges</p>
                <p className="text-sm font-semibold text-gris">
                  {gagnes.length}/{badges.length}
                </p>
              </div>
              <ul className="mt-3 grid grid-cols-4 gap-2">
                {badges.map((b) => (
                  <li
                    key={b.id}
                    className={`flex flex-col items-center rounded-2xl border-2 p-2 text-center ${b.done ? "border-encre bg-jaune" : "border-encre/15 bg-creme"}`}
                    title={b.done ? b.label : `${b.label} · ${b.remaining}`}
                  >
                    <Icon name={b.emoji} className={`h-6 w-6 ${b.done ? "" : "opacity-30"}`} />
                    <span className={`mt-1 text-[0.7rem] font-bold leading-tight ${b.done ? "" : "text-gris"}`}>{b.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {raisons.length > 0 && (
              <div className="card bg-rose p-5">
                <p className="tile-label text-encre/70">Pourquoi tu fais ça</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {raisons.map((r) => (
                    <li key={r.id} className="rounded-full border-2 border-encre bg-white px-3 py-1 font-bold">
                      {r.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card bg-jaune-pale p-5">
              <p className="tile-label">Le conseil du jour</p>
              <p className="mt-1 text-lg font-semibold leading-snug">{conseilDuJour(day)}</p>
            </div>

            <NotificationsCard compact />
            <InstallBanner />

            <Link href="/app/aide" className="card flex items-center justify-between gap-3 p-4">
              <span>
                <span className="block font-extrabold">Besoin d&apos;aide&nbsp;?</span>
                <span className="block text-sm text-encre/75">Exercices, quoi faire selon tes moments à risque, et des humains à appeler.</span>
              </span>
              <span aria-hidden className="text-xl">→</span>
            </Link>

            <p className="pt-2 text-center">
              <Link href="/app/craque" className="font-semibold text-encre/70 underline underline-offset-4">
                J&apos;ai craqué
              </Link>
            </p>
          </section>
          <Celebrate earned={gagnes.map(({ id, emoji, label }) => ({ id, emoji, label }))} />
        </>
      )}
    </main>
  );
}
