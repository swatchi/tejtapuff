import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/app/SubmitButton";
import { ACTIVE_STATUSES, requireMember } from "@/lib/member";
import { deleteAccount } from "../../actions";

export const metadata: Metadata = { title: "Supprimer mon compte", robots: { index: false } };

export default async function SupprimerPage() {
  const m = await requireMember({ allowInactive: true });
  const active = Boolean(m.subscription && ACTIVE_STATUSES.includes(m.subscription.status));

  return (
    <main className="wrap pt-8">
      <h1 className="text-[2.4rem] font-extrabold leading-none">Supprimer mon compte</h1>
      <p className="mt-4 text-lg">On efface définitivement :</p>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>ton compte et ton email,</li>
        <li>tes réponses au quiz,</li>
        <li>ta progression : compteur, missions, envies.</li>
      </ul>
      {active && (
        <p className="mt-4 rounded-2xl border-2 border-encre bg-jaune-pale p-4">
          Ton abonnement sera arrêté immédiatement (la semaine en cours n&apos;est pas remboursée).
        </p>
      )}
      <p className="mt-4 text-sm text-gris">
        Seules les factures sont conservées par Stripe, comme la loi l&apos;exige pour la comptabilité.
      </p>
      <form action={deleteAccount} className="mt-8">
        <SubmitButton className="btn w-full border-encre bg-[#c2361b] text-white" pendingLabel="Suppression…">
          Supprimer définitivement
        </SubmitButton>
      </form>
      <Link href="/app/compte" className="btn btn-light mt-3 w-full">
        Annuler
      </Link>
    </main>
  );
}
