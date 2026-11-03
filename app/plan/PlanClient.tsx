"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Burst } from "@/components/Doodles";
import { FIRST_WEEK, PRICE_SENTENCE, WEEKLY } from "@/config/pricing";
import { SITE } from "@/config/site";
import { CONSENTS } from "@/content/consents";
import { PAYWALL, PLAN } from "@/content/plan";
import { REASONS, TRIGGERS } from "@/content/quiz";
import { getUnit } from "@/content/units";
import { getUtm, trackOnce, visitorId } from "@/lib/client/attribution";
import { pixelEvent } from "@/lib/client/consent";
import { KEYS, readSession } from "@/lib/client/storage";
import type { QuizAnswers } from "@/lib/quiz-schema";
import { costs, formatEuros } from "@/lib/savings";

type StoredQuiz = { quizId: string; answers: QuizAnswers };

function listFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;
}

function formatDay(iso: string): string {
  const s = new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function PlanClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [quiz, setQuiz] = useState<StoredQuiz | null>(null);
  const [email, setEmail] = useState("");
  const [age18, setAge18] = useState(false);
  const [immediate, setImmediate] = useState(false);
  const [followup, setFollowup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; login?: boolean } | null>(null);

  useEffect(() => {
    const stored = readSession<StoredQuiz>(KEYS.quiz);
    if (!stored || typeof stored.answers?.perMonth !== "number") {
      router.replace("/quiz");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuiz(stored);
    trackOnce("paywall_view", stored.quizId);
  }, [router]);

  if (!quiz) return <div className="min-h-dvh bg-creme" />;

  const a = quiz.answers;
  const unit = getUnit(a.unit);
  const c = costs(a.perMonth, a.unitPrice);
  const triggerPhrases = a.triggers.map((id) => TRIGGERS.find((t) => t.id === id)?.phrase).filter(Boolean) as string[];
  const reasonLabels = a.reasons.map((id) => REASONS.find((r) => r.id === id)?.label).filter(Boolean) as string[];
  const canPay = /\S+@\S+\.\S+/.test(email) && age18 && immediate && !loading;

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPay) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.quizId,
          vid: visitorId(),
          email,
          age18,
          immediateStart: immediate,
          followup,
          utm: getUtm(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError({ message: data.error ?? "Erreur, réessaie.", login: data.code === "already_subscribed" });
        setLoading(false);
        return;
      }
      pixelEvent("checkout");
      window.location.href = data.url;
    } catch {
      setError({ message: "Connexion impossible, vérifie ton réseau et réessaie." });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-creme pb-16">
      <div className="bg-jaune pb-10 pt-6">
        <div className="wrap">
          <Link href="/quiz" className="text-sm font-semibold underline underline-offset-4">
            ← Modifier mes réponses
          </Link>
          <h1 className="mt-4 text-[2.75rem] font-extrabold leading-[0.95] tracking-tight">{PLAN.title}</h1>
          <p className="mt-3 text-lg">
            {PLAN.startLabel} : <strong>{formatDay(a.startDate)}</strong>
          </p>

          {/* Économies */}
          <div className="card mt-6 p-5">
            <p className="text-sm font-bold uppercase tracking-wide text-gris">{PLAN.savingsTitle}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {(
                [
                  [PLAN.savingsLines.days21, c.days21],
                  [PLAN.savingsLines.month, c.month],
                  [PLAN.savingsLines.year, c.year],
                ] as const
              ).map(([label, value], i) => (
                <div key={label} className={i === 2 ? "rounded-2xl bg-menthe/15 py-2" : "py-2"}>
                  <p className={`font-extrabold tabular-nums ${i === 2 ? "text-2xl text-menthe" : "text-xl"}`}>{formatEuros(value)}</p>
                  <p className="text-xs font-semibold text-gris">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gris">
              Calculé avec tes réponses : {a.perMonth} {a.perMonth > 1 ? unit.plural : unit.singular} × {formatEuros(a.unitPrice)} par mois.
            </p>
          </div>
        </div>
      </div>

      {/* Les phases du plan */}
      <section className="wrap mt-10">
        <ol className="space-y-4">
          {PLAN.phases.map((p, i) => (
            <li key={p.title} className={`rounded-3xl border-2 border-encre p-5 ${i === 3 ? "bg-encre text-creme" : "bg-white"}`}>
              <p className={`text-sm font-bold ${i === 3 ? "text-jaune" : "text-braise"}`}>{p.days}</p>
              <h2 className="text-2xl font-extrabold">{p.title}</h2>
              <p className={`mt-1 ${i === 3 ? "text-creme/85" : "text-encre/80"}`}>
                {p.text.replace("{declencheurs}", listFr(triggerPhrases) || "tes moments à risque")}
              </p>
            </li>
          ))}
        </ol>

        {reasonLabels.length > 0 && (
          <div className="mt-6">
            <p className="font-bold">{PLAN.reasonsTitle}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {reasonLabels.map((r) => (
                <span key={r} className="rounded-full border-2 border-encre bg-rose px-3 py-1 font-semibold">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Paywall */}
      <section id="paiement" className="wrap mt-12">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-3xl font-extrabold leading-none">{PAYWALL.title}</h2>
            <Burst className="h-24 w-24 shrink-0 rotate-6 text-jaune">
              <span className="block text-center leading-none">
                <span className="block text-base font-black">{FIRST_WEEK}</span>
                <span className="text-[0.65rem] font-bold">1re semaine</span>
              </span>
            </Burst>
          </div>
          <p className="mt-4 text-lg font-bold leading-snug">{PRICE_SENTENCE}</p>
          <p className="mt-1 text-[0.95rem] text-encre/70">
            Aujourd&apos;hui : {FIRST_WEEK}. Ensuite : {WEEKLY} tous les 7 jours, avec un rappel 48 h avant le 1er prélèvement à {WEEKLY}.
          </p>

          {params.get("annule") && (
            <p className="mt-4 rounded-2xl bg-jaune-pale p-3 text-[0.95rem]">{PAYWALL.cancelled}</p>
          )}

          <form onSubmit={pay} className="mt-5 space-y-4" noValidate>
            <label className="block">
              <span className="font-bold">{PAYWALL.emailLabel}</span>
              <input
                type="email"
                className="field mt-1"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                placeholder="toi@exemple.fr"
              />
              <span className="mt-1 block text-sm text-gris">{PAYWALL.emailHint}</span>
            </label>

            <Check checked={age18} onChange={setAge18} required>
              {CONSENTS.age_18.text}
            </Check>
            <Check checked={immediate} onChange={setImmediate} required>
              {CONSENTS.immediate_start.text}{" "}
              <Link href="/legal/cgv" target="_blank" className="underline underline-offset-2">
                Voir les CGV
              </Link>
            </Check>
            <Check checked={followup} onChange={setFollowup}>
              {CONSENTS.followup_emails.text} <span className="text-gris">(facultatif)</span>
            </Check>

            {error && (
              <p role="alert" className="rounded-2xl border-2 border-braise bg-white p-3 text-[0.95rem]">
                {error.message}{" "}
                {error.login && (
                  <Link href="/connexion" className="font-bold underline">
                    Me connecter
                  </Link>
                )}
              </p>
            )}

            <button type="submit" className="btn btn-primary w-full text-lg" disabled={!canPay}>
              {loading ? "Redirection vers le paiement…" : `${PAYWALL.cta} pour ${FIRST_WEEK} →`}
            </button>
            <ul className="grid grid-cols-3 gap-2 text-center text-xs font-semibold leading-tight">
              {PAYWALL.garanties.map((g) => (
                <li key={g.texte} className="rounded-2xl border-2 border-encre/15 bg-creme px-2 py-2.5">
                  <span aria-hidden className="block text-lg">
                    {g.emoji}
                  </span>
                  {g.texte}
                </li>
              ))}
            </ul>
            <p className="text-center text-sm text-gris">
              🔒 {PAYWALL.secure} {SITE.medicalDisclaimer}
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function Check({
  checked,
  onChange,
  required,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer gap-3">
      <input
        type="checkbox"
        className="mt-0.5 h-6 w-6 shrink-0 accent-encre"
        checked={checked}
        required={required}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-[0.95rem] leading-snug">{children}</span>
    </label>
  );
}
