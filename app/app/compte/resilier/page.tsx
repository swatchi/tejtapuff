import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/app/SubmitButton";
import { formatDayFr } from "@/lib/dates";
import { ACTIVE_STATUSES, requireMember } from "@/lib/member";
import { cancelSubscription } from "../../actions";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Résilier", robots: { index: false } };

/** Résiliation : Compte → Résilier → Confirmer. Pas de formulaire, pas de question piège. */
export default async function ResilierPage() {
  const m = await requireMember({ allowInactive: true });
  const sub = m.subscription;
  if (!sub || !ACTIVE_STATUSES.includes(sub.status) || sub.cancel_at_period_end) redirect("/app/compte");

  return (
    <main className="wrap pt-8">
      <h1 className="text-[2.4rem] font-extrabold leading-none">Résilier</h1>
      <ul className="mt-6 space-y-3 text-lg">
        {[
          <>Plus aucun prélèvement après confirmation.</>,
          <>
            Tu gardes l&apos;accès jusqu&apos;au <strong>{formatDayFr(sub.current_period_end)}</strong> (fin de la semaine payée).
          </>,
          <>Tu reçois une confirmation par email.</>,
        ].map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-menthe text-white">
              <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3.2} />
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <form action={cancelSubscription} className="mt-8">
        <SubmitButton pendingLabel="Résiliation…">Confirmer la résiliation</SubmitButton>
      </form>
      <Link href="/app/compte" className="btn btn-light mt-3 w-full">
        Annuler
      </Link>
    </main>
  );
}
