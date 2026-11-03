import { clearGoal, saveGoal } from "@/app/app/actions";
import { formatEuros } from "@/lib/savings";
import { SubmitButton } from "./SubmitButton";

const IDEES = ["Des sneakers", "Un week-end", "Un concert", "Un resto à deux", "Des écouteurs"];

/** Ton objectif : ce que tu t'offres avec l'argent gardé. La barre se remplit avec les vrais € économisés. */
export function GoalCard({ goal, savedEuros }: { goal: { label: string | null; cents: number | null }; savedEuros: number }) {
  const hasGoal = Boolean(goal.label && goal.cents);
  const cible = (goal.cents ?? 0) / 100;
  const part = hasGoal ? Math.min(1, savedEuros / cible) : 0;

  return (
    <div className="card p-5">
      <p className="tile-label">Ton objectif</p>
      {hasGoal ? (
        <>
          <p className="mt-1 text-2xl font-extrabold leading-tight">{goal.label}</p>
          <div className="bar mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(part * 100)}>
            <span style={{ width: `${Math.max(3, part * 100)}%` }} />
          </div>
          <p className="mt-2 font-semibold tabular-nums">
            {formatEuros(savedEuros)} sur {formatEuros(cible)}
            {part >= 1 ? " : c'est à toi, fais-toi plaisir 🎉" : ` · encore ${formatEuros(Math.max(0, cible - savedEuros))}`}
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold underline underline-offset-4">Changer d&apos;objectif</summary>
            <GoalForm defaults={goal} />
            <form action={clearGoal} className="mt-2">
              <button type="submit" className="text-sm font-semibold text-encre/70 underline underline-offset-4">
                Retirer l&apos;objectif
              </button>
            </form>
          </details>
        </>
      ) : (
        <>
          <p className="mt-1 text-lg font-bold leading-snug">Qu&apos;est-ce que tu t&apos;offres avec l&apos;argent que tu gardes&nbsp;?</p>
          <p className="mt-1 text-sm text-encre/70">La barre se remplit toute seule avec tes € économisés. Exemples : {IDEES.join(", ").toLowerCase()}.</p>
          <GoalForm defaults={goal} />
        </>
      )}
    </div>
  );
}

function GoalForm({ defaults }: { defaults: { label: string | null; cents: number | null } }) {
  return (
    <form action={saveGoal} className="mt-3 grid grid-cols-[1fr_7rem] gap-2">
      <label className="sr-only" htmlFor="goal-label">
        Ton objectif
      </label>
      <input id="goal-label" name="label" required maxLength={60} defaultValue={defaults.label ?? ""} placeholder="Des sneakers" className="field" />
      <label className="sr-only" htmlFor="goal-euros">
        Prix en euros
      </label>
      <div className="relative">
        <input
          id="goal-euros"
          name="euros"
          required
          inputMode="decimal"
          defaultValue={defaults.cents ? String(defaults.cents / 100) : ""}
          placeholder="120"
          className="field pr-8 text-right"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-bold">€</span>
      </div>
      <div className="col-span-2">
        <SubmitButton pendingLabel="Enregistrement…">Enregistrer mon objectif</SubmitButton>
      </div>
    </form>
  );
}
