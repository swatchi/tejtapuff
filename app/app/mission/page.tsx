import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/app/SubmitButton";
import { CONSOLIDATION, MISSIONS, personalize, PHASES } from "@/content/missions";
import { requireMember } from "@/lib/member";
import { currentMission, PROGRAM_DAYS } from "@/lib/program";
import { completeMission } from "../actions";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Mission", robots: { index: false } };

const PROGRAM_IDS = MISSIONS.map((m) => m.id);

export default async function MissionPage() {
  const m = await requireMember();
  const slot = currentMission(m.day, m.completed, PROGRAM_IDS, CONSOLIDATION.length);
  const triggers = m.profile?.triggers ?? [];

  const current =
    slot.kind === "program"
      ? { id: slot.id, label: `Mission ${slot.number}/${PROGRAM_DAYS}`, ...personalize(MISSIONS[slot.number - 1], triggers) }
      : slot.kind === "consolidation"
        ? { id: slot.id, label: "Mission de la semaine", ...personalize(CONSOLIDATION[slot.contentIndex], []) }
        : null;

  return (
    <main className="wrap pt-6">
      {slot.kind === "not_started" ? (
        <>
          <h1 className="text-[2.2rem] font-extrabold leading-none">Ta 1re mission t&apos;attend</h1>
          <p className="mt-3 text-lg">Lance ton compteur depuis l&apos;accueil pour débloquer la mission 1.</p>
          <Link href="/app" className="btn btn-primary mt-6 w-full">
            Aller à l&apos;accueil
          </Link>
        </>
      ) : current ? (
        <article className="card p-5">
          <p className="text-sm font-bold text-braise">
            {current.label}
            {slot.kind === "program" && slot.late && " · à rattraper"}
          </p>
          <h1 className="mt-1 text-[2rem] font-extrabold leading-[1.02]">{current.title}</h1>
          <p className="mt-3 text-encre/80">{current.why}</p>
          <ol className="mt-5 space-y-3">
            {current.steps.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-jaune text-sm font-black">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <form action={completeMission} className="mt-6">
            <input type="hidden" name="missionId" value={current.id} />
            <SubmitButton pendingLabel="Enregistrement…">C&apos;est fait</SubmitButton>
          </form>
        </article>
      ) : (
        <div className="card p-5">
          <h1 className="text-[2rem] font-extrabold leading-none">Mission du jour : faite</h1>
          <p className="mt-3 text-encre/80">
            {slot.kind === "program_done_today"
              ? `La mission ${slot.nextNumber} se débloque demain. En attendant, le bouton SOS est là si besoin.`
              : "La prochaine mission arrive la semaine prochaine. Continue comme ça."}
          </p>
        </div>
      )}

      {/* Le parcours complet */}
      <section className="mt-10">
        <h2 className="text-xl font-extrabold">Ton parcours</h2>
        {PHASES.map((phase) => (
          <div key={phase.title} className="mt-5">
            <p className="text-sm font-bold uppercase tracking-wide text-gris">
              J{phase.from} → J{phase.to} · {phase.title}
            </p>
            <ul className="mt-2 space-y-2">
              {MISSIONS.slice(phase.from - 1, phase.to).map((mission, i) => {
                const n = phase.from + i;
                const done = m.completed.has(mission.id);
                if (n > m.day) return null;
                const p = personalize(mission, triggers);
                return (
                  <li
                    key={mission.id}
                    className={`flex items-center gap-3 rounded-2xl border-2 border-encre px-3 py-2.5 ${done ? "bg-menthe/15" : "bg-white"}`}
                  >
                    <span className="w-8 shrink-0 text-sm font-black tabular-nums">J{n}</span>
                    <span className={`flex-1 font-semibold ${done ? "line-through decoration-2 opacity-70" : ""}`}>{p.title}</span>
                    <span aria-label={done ? "faite" : "à faire"} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-encre ${done ? "bg-menthe text-white" : "bg-white"}`}>
                      {done && <Icon name="check" className="h-4 w-4" strokeWidth={3} />}
                    </span>
                  </li>
                );
              })}
              {(() => {
                const restantes = phase.to - Math.max(m.day, phase.from - 1);
                if (restantes <= 0) return null;
                const debut = Math.max(m.day + 1, phase.from);
                return (
                  <li className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-encre/30 px-3 py-2.5 text-encre/60">
                    <Icon name="lock" className="h-5 w-5 shrink-0" />
                    <span className="flex-1 font-semibold">
                      {restantes} mission{restantes > 1 ? "s" : ""} à débloquer, une par jour à partir du J{debut}
                    </span>
                  </li>
                );
              })()}
            </ul>
          </div>
        ))}
        <p className="mt-5 rounded-2xl bg-encre p-4 text-creme">
          <strong className="text-jaune">Après J21 :</strong> une mission par semaine pour rester clean sur la durée.
        </p>
      </section>
    </main>
  );
}
