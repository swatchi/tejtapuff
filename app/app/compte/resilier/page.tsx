import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/app/SubmitButton";
import { formatDayFr } from "@/lib/dates";
import { ACTIVE_STATUSES, requireMember } from "@/lib/member";
import { cancelSubscription } from "../../actions";

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
        <li>✔︎ Plus aucun prélèvement après confirmation.</li>
        <li>
          ✔︎ Tu gardes l&apos;accès jusqu&apos;au <strong>{formatDayFr(sub.current_period_end)}</strong> (fin de la semaine payée).
        </li>
        <li>✔︎ Tu reçois une confirmation par email.</li>
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
