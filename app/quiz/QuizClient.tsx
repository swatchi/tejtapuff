"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { parsePrice } from "@/components/Calculator";
import { CONSENTS } from "@/content/consents";
import {
  MAX_START_DELAY_DAYS,
  QUESTIONS,
  QUIZ_INTRO,
  REASONS,
  SINCE,
  START_OPTIONS,
  TRIGGERS,
} from "@/content/quiz";
import { getUnit, UNITS, type UnitId } from "@/content/units";
import { getUtm, track, visitorId } from "@/lib/client/attribution";
import { pixelEvent } from "@/lib/client/consent";
import { type CalcState, KEYS, readSession, writeSession } from "@/lib/client/storage";

type Draft = {
  step: number;
  consent: boolean;
  unit: UnitId;
  perWeek: number;
  priceText: string;
  since: string | null;
  triggers: string[];
  reasons: string[];
  startChoice: string | null;
  startDate: string;
};

const STEPS = ["intro", "unit", "perWeek", "price", "since", "triggers", "reasons", "startDate"] as const;
const QUESTION_COUNT = STEPS.length - 1;

/** Date locale AAAA-MM-JJ, décalée de n jours */
function localDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function initialDraft(): Draft {
  const calc = readSession<CalcState>(KEYS.calc);
  const unit = getUnit(calc?.unit);
  return {
    step: 0,
    consent: false,
    unit: unit.id,
    perWeek: calc?.perWeek ?? unit.defaultPerWeek,
    priceText: String(calc?.unitPrice || unit.defaultPrice),
    since: null,
    triggers: [],
    reasons: [],
    startChoice: null,
    startDate: localDate(0),
  };
}

export function QuizClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reprise du brouillon (sessionStorage n'existe pas côté serveur)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(readSession<Draft>(KEYS.quizDraft) ?? initialDraft());
  }, []);

  useEffect(() => {
    if (draft) writeSession(KEYS.quizDraft, draft);
  }, [draft]);

  if (!draft) return <div className="min-h-dvh bg-creme" />;

  const stepName = STEPS[draft.step];
  const unit = getUnit(draft.unit);
  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const next = () => update({ step: Math.min(draft.step + 1, STEPS.length - 1) });
  const back = () => (draft.step === 0 ? router.push("/") : update({ step: draft.step - 1 }));
  const toggle = (key: "triggers" | "reasons", id: string) =>
    update({ [key]: draft[key].includes(id) ? draft[key].filter((x) => x !== id) : [...draft[key], id] });

  const start = () => {
    track("quiz_start");
    next();
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const answers = {
      unit: draft.unit,
      perWeek: draft.perWeek,
      unitPrice: parsePrice(draft.priceText),
      since: draft.since,
      triggers: draft.triggers,
      reasons: draft.reasons,
      startDate: draft.startDate,
    };
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vid: visitorId(), answers, consent: draft.consent, utm: getUtm() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      writeSession(KEYS.quiz, { quizId: data.quizId, answers });
      pixelEvent("quiz_done");
      router.push("/plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setSubmitting(false);
    }
  };

  const price = parsePrice(draft.priceText);
  const canContinue: Record<(typeof STEPS)[number], boolean> = {
    intro: draft.consent,
    unit: true,
    perWeek: draft.perWeek >= 1,
    price: price >= 0.5,
    since: Boolean(draft.since),
    triggers: draft.triggers.length > 0,
    reasons: draft.reasons.length > 0,
    startDate: Boolean(draft.startChoice) && Boolean(draft.startDate),
  };

  return (
    <div className="flex min-h-dvh flex-col bg-creme">
      {/* Barre du haut */}
      <div className="wrap flex h-16 items-center gap-3">
        <button type="button" onClick={back} className="btn btn-light h-11 min-h-11 w-11 p-0 text-xl" aria-label="Retour">
          ←
        </button>
        {draft.step > 0 && (
          <div className="flex-1">
            <div
              className="h-3 overflow-hidden rounded-full border-2 border-encre bg-white"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={QUESTION_COUNT}
              aria-valuenow={draft.step}
              aria-label="Progression du quiz"
            >
              <div className="h-full bg-jaune transition-[width] duration-300" style={{ width: `${(draft.step / QUESTION_COUNT) * 100}%` }} />
            </div>
          </div>
        )}
        {draft.step > 0 && (
          <span className="text-sm font-bold tabular-nums">
            {draft.step}/{QUESTION_COUNT}
          </span>
        )}
      </div>

      <div className="wrap flex flex-1 flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4" key={stepName}>
        {stepName === "intro" && (
          <>
            <h1 className="text-[2.6rem] font-extrabold leading-[0.95] tracking-tight">{QUIZ_INTRO.title}</h1>
            <p className="mt-4 text-lg">{QUIZ_INTRO.text}</p>
            <label className="card mt-8 flex cursor-pointer gap-3 p-4">
              <input
                type="checkbox"
                className="mt-1 h-6 w-6 shrink-0 accent-encre"
                checked={draft.consent}
                onChange={(e) => update({ consent: e.target.checked })}
              />
              <span className="text-[0.95rem] leading-snug">
                {CONSENTS.sensitive_data.text}{" "}
                <Link href="/legal/confidentialite" className="underline underline-offset-2" target="_blank">
                  Politique de confidentialité
                </Link>
              </span>
            </label>
          </>
        )}

        {stepName === "unit" && (
          <Question title={QUESTIONS.unit.title} hint={QUESTIONS.unit.hint}>
            <div className="grid gap-3">
              {UNITS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="chip min-h-14 justify-start px-5 text-lg"
                  aria-pressed={draft.unit === u.id}
                  onClick={() => {
                    const changed = u.id !== draft.unit;
                    update({
                      unit: u.id,
                      ...(changed ? { perWeek: u.defaultPerWeek, priceText: String(u.defaultPrice) } : {}),
                      step: draft.step + 1,
                    });
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </Question>
        )}

        {stepName === "perWeek" && (
          <Question title={QUESTIONS.perWeek.title} hint={QUESTIONS.perWeek.hint}>
            <div className="flex items-center justify-center gap-5 py-6">
              <button
                type="button"
                className="btn btn-light h-16 min-h-16 w-16 p-0 text-3xl"
                aria-label="Moins"
                disabled={draft.perWeek <= 1}
                onClick={() => update({ perWeek: Math.max(1, draft.perWeek - 1) })}
              >
                −
              </button>
              <output className="min-w-[6rem] text-center text-6xl font-extrabold tabular-nums" aria-live="polite">
                {draft.perWeek}
                <span className="block text-base font-semibold text-gris">
                  {draft.perWeek > 1 ? unit.plural : unit.singular} / semaine
                </span>
              </output>
              <button
                type="button"
                className="btn btn-light h-16 min-h-16 w-16 p-0 text-3xl"
                aria-label="Plus"
                disabled={draft.perWeek >= unit.maxPerWeek}
                onClick={() => update({ perWeek: Math.min(unit.maxPerWeek, draft.perWeek + 1) })}
              >
                +
              </button>
            </div>
          </Question>
        )}

        {stepName === "price" && (
          <Question title={QUESTIONS.price.title} hint={QUESTIONS.price.hint}>
            <label className="relative mx-auto mt-4 block w-44">
              <span className="sr-only">Prix d&apos;un {unit.singular} en euros</span>
              <input
                className="field min-h-20 pr-12 text-center text-4xl font-extrabold tabular-nums"
                inputMode="decimal"
                value={draft.priceText}
                onChange={(e) => update({ priceText: e.target.value.slice(0, 6) })}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-3xl font-extrabold">€</span>
            </label>
            <p className="mt-3 text-center text-gris">par {unit.singular}</p>
          </Question>
        )}

        {stepName === "since" && (
          <Question title={QUESTIONS.since.title}>
            <div className="grid gap-3">
              {SINCE.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="chip min-h-14 justify-start px-5 text-lg"
                  aria-pressed={draft.since === s.id}
                  onClick={() => update({ since: s.id, step: draft.step + 1 })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Question>
        )}

        {stepName === "triggers" && (
          <Question title={QUESTIONS.triggers.title} hint={QUESTIONS.triggers.hint}>
            <div className="flex flex-wrap gap-2.5">
              {TRIGGERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="chip text-[1.05rem]"
                  aria-pressed={draft.triggers.includes(t.id)}
                  onClick={() => toggle("triggers", t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Question>
        )}

        {stepName === "reasons" && (
          <Question title={QUESTIONS.reasons.title} hint={QUESTIONS.reasons.hint}>
            <div className="flex flex-wrap gap-2.5">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="chip text-[1.05rem]"
                  aria-pressed={draft.reasons.includes(r.id)}
                  onClick={() => toggle("reasons", r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Question>
        )}

        {stepName === "startDate" && (
          <Question title={QUESTIONS.startDate.title} hint={QUESTIONS.startDate.hint}>
            <div className="grid gap-3">
              {START_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="chip min-h-14 justify-start px-5 text-lg"
                  aria-pressed={draft.startChoice === o.id}
                  onClick={() =>
                    update({
                      startChoice: o.id,
                      startDate: o.id === "today" ? localDate(0) : o.id === "tomorrow" ? localDate(1) : draft.startDate,
                    })
                  }
                >
                  {o.label}
                </button>
              ))}
              {draft.startChoice === "pick" && (
                <input
                  type="date"
                  className="field"
                  min={localDate(0)}
                  max={localDate(MAX_START_DELAY_DAYS)}
                  value={draft.startDate}
                  onChange={(e) => update({ startDate: e.target.value })}
                  aria-label="Date de démarrage"
                />
              )}
            </div>
          </Question>
        )}

        <div className="mt-auto pt-8">
          {error && (
            <p role="alert" className="mb-3 rounded-2xl border-2 border-braise bg-white p-3 text-[0.95rem]">
              {error}
            </p>
          )}
          {stepName === "intro" ? (
            <button type="button" className="btn btn-primary w-full text-lg" disabled={!canContinue.intro} onClick={start}>
              {QUIZ_INTRO.cta} →
            </button>
          ) : stepName === "startDate" ? (
            <button
              type="button"
              className="btn btn-primary w-full text-lg"
              disabled={!canContinue.startDate || submitting}
              onClick={submit}
            >
              {submitting ? "On prépare ton plan…" : "Voir mon plan →"}
            </button>
          ) : stepName === "unit" || stepName === "since" ? null : (
            <button
              type="button"
              className="btn btn-primary w-full text-lg"
              disabled={!canContinue[stepName]}
              onClick={next}
            >
              Suivant →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <>
      <h1 className="text-[2.1rem] font-extrabold leading-[1] tracking-tight">{title}</h1>
      {hint && <p className="mt-3 text-gris">{hint}</p>}
      <div className="mt-7">{children}</div>
    </>
  );
}
