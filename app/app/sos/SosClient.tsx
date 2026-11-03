"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { SOS } from "@/content/sos";
import { logCravingOvercome } from "../actions";

type Step = { kind: "choose" } | { kind: "exercise"; id: string } | { kind: "after"; id: string } | { kind: "won"; total: number };

export function SosClient({ reasons, savedLabel, streakLabel }: { reasons: string[]; savedLabel: string; streakLabel: string }) {
  const [step, setStep] = useState<Step>({ kind: "choose" });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  if (step.kind === "choose") {
    return (
      <>
        <h1 className="text-[2.6rem] font-extrabold leading-none">{SOS.title}</h1>
        <p className="mt-3 text-lg">{SOS.subtitle}</p>
        <div className="mt-6 grid gap-3">
          {SOS.exercises.map((e, i) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setStep({ kind: "exercise", id: e.id })}
              className={`card flex items-center justify-between p-5 text-left ${
                ["bg-ciel", "bg-jaune", "bg-rose", "bg-[#c9f3e6]", "bg-[#ffd9c9]", "bg-[#e3d9ff]"][i % 6]
              }`}
            >
              <span className="text-xl font-extrabold">{e.title}</span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-bold">{e.duration}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  if (step.kind === "exercise") {
    const ex = SOS.exercises.find((e) => e.id === step.id)!;
    const done = () => setStep({ kind: "after", id: ex.id });
    return (
      <>
        <button type="button" onClick={() => setStep({ kind: "choose" })} className="text-sm font-semibold underline underline-offset-4">
          ← Autre exercice
        </button>
        <h1 className="mt-3 text-[2.2rem] font-extrabold leading-none">{ex.title}</h1>
        <p className="mt-3 text-lg">{ex.intro}</p>
        <div className="mt-6">
          {ex.id === "respiration" && "inhaleSeconds" in ex && (
            <Breathing inhale={ex.inhaleSeconds} exhale={ex.exhaleSeconds} cycles={ex.cycles} onDone={done} />
          )}
          {(ex.id === "defi5" || ex.id === "bouge") && "seconds" in ex && (
            <Countdown seconds={ex.seconds} actions={[...ex.actions]} onDone={done} />
          )}
          {ex.id === "sens" && "etapes" in ex && <Sens etapes={[...ex.etapes]} onDone={done} />}
          {ex.id === "pote" && "message" in ex && <Pote message={ex.message} />}
          {ex.id === "raisons" && (
            <div className="space-y-3">
              {reasons.map((r) => (
                <p key={r} className="rounded-2xl border-2 border-encre bg-rose p-4 text-xl font-extrabold">
                  {r}
                </p>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <p className="rounded-2xl border-2 border-encre bg-menthe/20 p-4">
                  <span className="block text-xs font-bold uppercase text-gris">Déjà économisé</span>
                  <span className="text-2xl font-extrabold">{savedLabel}</span>
                </p>
                <p className="rounded-2xl border-2 border-encre bg-white p-4">
                  <span className="block text-xs font-bold uppercase text-gris">Série</span>
                  <span className="text-2xl font-extrabold">{streakLabel}</span>
                </p>
              </div>
            </div>
          )}
        </div>
        <button type="button" className="btn btn-light mt-8 w-full" onClick={done}>
          J&apos;ai fini
        </button>
      </>
    );
  }

  if (step.kind === "after") {
    return (
      <>
        <h1 className="text-[2.4rem] font-extrabold leading-none">{SOS.after.question}</h1>
        <div className="mt-8 grid gap-3">
          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(false);
                try {
                  const r = await logCravingOvercome(step.id);
                  setStep({ kind: "won", total: r.total ?? 0 });
                } catch {
                  setError(true);
                }
              })
            }
          >
            {pending ? "Enregistrement…" : SOS.after.overcome}
          </button>
          <button type="button" className="btn btn-light w-full" onClick={() => setStep({ kind: "choose" })}>
            {SOS.after.again}
          </button>
          <Link href={`/app/craque?exercise=${step.id}`} className="btn btn-light w-full">
            {SOS.after.relapse}
          </Link>
        </div>
        {error && <p className="mt-4 rounded-2xl border-2 border-braise bg-white p-3">Pas de réseau ? Réessaie dans un instant.</p>}
      </>
    );
  }

  return (
    <>
      <p className="text-6xl" aria-hidden>
        💪
      </p>
      <h1 className="mt-4 text-[2.4rem] font-extrabold leading-none">{SOS.after.overcomeMessage}</h1>
      <p className="mt-4 text-xl">
        Envies battues : <strong className="tabular-nums">{step.total}</strong>
      </p>
      <Link href="/app" className="btn btn-primary mt-8 w-full">
        Retour à l&apos;accueil
      </Link>
    </>
  );
}

function Sens({ etapes, onDone }: { etapes: string[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="flex gap-1.5" aria-hidden>
        {etapes.map((_, k) => (
          <span key={k} className={`h-2 flex-1 rounded-full border-2 border-encre ${k <= i ? "bg-menthe" : "bg-white"}`} />
        ))}
      </div>
      <p className="mt-6 grid min-h-40 place-items-center rounded-3xl border-2 border-encre bg-[#c9f3e6] p-6 text-center text-2xl font-extrabold leading-snug">
        <span>
          <span className="block font-mono text-5xl">{etapes.length - i}</span>
          {etapes[i]}
        </span>
      </p>
      <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => (i + 1 < etapes.length ? setI(i + 1) : onDone())}>
        {i + 1 < etapes.length ? "Suivant →" : "Terminé"}
      </button>
    </div>
  );
}

function Pote({ message }: { message: string }) {
  const [copie, setCopie] = useState(false);
  const partager = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: message });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      setCopie(true);
    } catch {}
  };
  return (
    <div>
      <p className="rounded-3xl rounded-br-md border-2 border-encre bg-jaune p-5 text-lg font-semibold">{message}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <a href={`sms:?&body=${encodeURIComponent(message)}`} className="btn btn-light">
          SMS
        </a>
        <button type="button" className="btn btn-light" onClick={partager}>
          {copie ? "Copié ✓" : "Autre appli"}
        </button>
      </div>
      <p className="mt-3 text-sm text-encre/70">Pendant qu&apos;il ou elle répond, bois un verre d&apos;eau. L&apos;envie redescend toute seule.</p>
    </div>
  );
}

function Breathing({ inhale, exhale, cycles, onDone }: { inhale: number; exhale: number; cycles: number; onDone: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const total = (inhale + exhale) * cycles;
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (elapsed >= total) onDone();
  }, [elapsed, total, onDone]);
  const inCycle = elapsed % (inhale + exhale);
  const breathingIn = inCycle < inhale;
  const left = breathingIn ? inhale - inCycle : inhale + exhale - inCycle;
  return (
    <div className="flex flex-col items-center py-4">
      <div className="grid h-64 w-64 place-items-center">
        <div
          className="grid place-items-center rounded-full border-[3px] border-encre bg-ciel"
          style={{
            width: breathingIn ? "100%" : "45%",
            height: breathingIn ? "100%" : "45%",
            transition: `all ${breathingIn ? inhale : exhale}s ease-in-out`,
          }}
        >
          <span className="text-center text-xl font-extrabold">
            {breathingIn ? "Inspire" : "Expire"}
            <span className="block text-3xl tabular-nums">{left}</span>
          </span>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-gris tabular-nums">
        Cycle {Math.min(cycles, Math.floor(elapsed / (inhale + exhale)) + 1)}/{cycles}
      </p>
    </div>
  );
}

function Countdown({ seconds, actions, onDone }: { seconds: number; actions: string[]; onDone: () => void }) {
  const [left, setLeft] = useState(seconds);
  const [checked, setChecked] = useState<string[]>([]);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left === 0) onDone();
  }, [left, onDone]);
  return (
    <div>
      <p className="text-center font-mono text-7xl font-bold tabular-nums" role="timer">
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
      </p>
      <ul className="mt-6 space-y-2">
        {actions.map((a) => {
          const on = checked.includes(a);
          return (
            <li key={a}>
              <button
                type="button"
                aria-pressed={on}
                className="chip w-full justify-start"
                onClick={() => setChecked((c) => (on ? c.filter((x) => x !== a) : [...c, a]))}
              >
                <span aria-hidden>{on ? "✅" : "○"}</span> {a}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
