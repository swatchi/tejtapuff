import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/app/SubmitButton";
import { euros, PRICE_SENTENCE } from "@/config/pricing";
import { SITE } from "@/config/site";
import { formatDayFr } from "@/lib/dates";
import { ACTIVE_STATUSES, requireMember } from "@/lib/member";
import { NotificationsCard } from "@/components/app/NotificationsCard";
import { openPaymentUpdate, resumeSubscription, updateNotificationPrefs } from "../actions";

export const metadata: Metadata = { title: "Compte", robots: { index: false } };

export default async function ComptePage({ searchParams }: PageProps<"/app/compte">) {
  const m = await requireMember({ allowInactive: true });
  const { resilie, repris, prefs } = await searchParams;
  const p = m.profile;
  const sub = m.subscription;
  const active = Boolean(sub && ACTIVE_STATUSES.includes(sub.status));

  return (
    <main className="wrap pt-8">
      <h1 className="text-[2.4rem] font-extrabold leading-none">Compte</h1>
      <p className="mt-2 text-encre/75">{m.user.email}</p>

      {resilie && (
        <p role="status" className="mt-5 rounded-2xl border-2 border-encre bg-menthe/20 p-4 font-semibold">
          Résiliation confirmée. Plus aucun prélèvement. Un email de confirmation est parti.
        </p>
      )}
      {repris && (
        <p role="status" className="mt-5 rounded-2xl border-2 border-encre bg-menthe/20 p-4 font-semibold">
          Ton abonnement continue. 💛
        </p>
      )}

      {/* ───────── Abonnement ───────── */}
      <section className="card mt-6 p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-gris">Abonnement</p>
        {!sub ? (
          <p className="mt-2">Aucun abonnement trouvé.</p>
        ) : !active ? (
          <>
            <p className="mt-2 text-2xl font-extrabold">Terminé</p>
            <p className="mt-1">Ton abonnement n&apos;est plus actif. Tu peux reprendre le programme quand tu veux.</p>
            <Link href="/quiz" className="btn btn-primary mt-4 w-full">
              Recommencer
            </Link>
          </>
        ) : sub.cancel_at_period_end ? (
          <>
            <p className="mt-2 text-2xl font-extrabold">Résilié</p>
            <p className="mt-1">
              Tu gardes l&apos;accès jusqu&apos;au <strong>{formatDayFr(sub.current_period_end)}</strong>. Aucun nouveau prélèvement.
            </p>
            <form action={resumeSubscription} className="mt-4">
              <SubmitButton className="btn btn-light w-full">Finalement, je continue</SubmitButton>
            </form>
          </>
        ) : (
          <>
            <p className="mt-2 text-2xl font-extrabold">{sub.status === "past_due" ? "Paiement en échec ⚠️" : "Actif"}</p>
            <p className="mt-1">
              Prochain prélèvement : <strong>{sub.price_cents ? euros(sub.price_cents) : "?"}</strong> le{" "}
              <strong>{formatDayFr(sub.current_period_end)}</strong>.
            </p>
            <p className="mt-1 text-sm text-gris">{PRICE_SENTENCE}</p>
            <form action={openPaymentUpdate} className="mt-4">
              <SubmitButton className={`btn w-full ${sub.status === "past_due" ? "btn-primary" : "btn-light"}`} pendingLabel="Ouverture…">
                Mettre à jour ma carte
              </SubmitButton>
            </form>
            <Link href="/app/compte/resilier" className="btn btn-light mt-3 w-full">
              Résilier mon abonnement
            </Link>
          </>
        )}
      </section>

      {/* ───────── Notifications ───────── */}
      {active && (
        <section id="notifications" className="mt-6 space-y-3">
          <NotificationsCard />
          <form action={updateNotificationPrefs} className="rounded-3xl border-2 border-encre bg-white p-4">
            <p className="font-extrabold">Ce que tu reçois</p>
            <label className="mt-3 flex items-start gap-3">
              <input type="checkbox" name="notify_morning" defaultChecked={p?.notify_morning ?? true} className="mt-0.5 h-6 w-6 accent-encre" />
              <span>
                Ma mission le matin, à{" "}
                <select name="morning_hour" defaultValue={p?.morning_hour ?? 9} className="rounded-lg border-2 border-encre bg-white px-1 font-bold">
                  {[6, 7, 8, 9, 10, 11, 12].map((h) => (
                    <option key={h} value={h}>
                      {h}h
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="mt-3 flex items-start gap-3">
              <input type="checkbox" name="notify_risk" defaultChecked={p?.notify_risk ?? true} className="mt-0.5 h-6 w-6 accent-encre" />
              <span>Un petit mot aux moments où l&apos;envie frappe (2 max par jour)</span>
            </label>
            <label className="mt-3 flex items-start gap-3">
              <input type="checkbox" name="notify_email" defaultChecked={p?.notify_email ?? true} className="mt-0.5 h-6 w-6 accent-encre" />
              <span>Ma mission par email si les notifications ne sont pas activées</span>
            </label>
            <SubmitButton className="btn btn-light mt-4 min-h-11 w-full py-1.5 text-base" pendingLabel="Enregistrement…">
              Enregistrer
            </SubmitButton>
            {prefs && <p className="mt-2 text-sm font-semibold">Enregistré ✅</p>}
            <p className="mt-3 text-xs text-gris">
              Les emails importants (rappel avant prélèvement, résiliation) sont toujours envoyés.
            </p>
          </form>
        </section>
      )}

      {/* ───────── App ───────── */}
      <section className="mt-6 space-y-3">
        <Link href="/app/installer" className="flex items-center justify-between rounded-2xl border-2 border-encre bg-white p-4 font-bold">
          Installer l&apos;app sur mon téléphone <span aria-hidden>→</span>
        </Link>
        <form action="/api/auth/signout" method="post">
          <button className="flex w-full items-center justify-between rounded-2xl border-2 border-encre bg-white p-4 text-left font-bold">
            Me déconnecter <span aria-hidden>→</span>
          </button>
        </form>
      </section>

      {/* ───────── Aide ───────── */}
      <section className="mt-6 rounded-2xl bg-encre p-4 text-creme">
        <p className="font-bold">Besoin d&apos;un suivi humain ?</p>
        <a href={SITE.tabacInfoService.phoneHref} className="mt-1 block text-jaune underline underline-offset-4">
          {SITE.tabacInfoService.label} : {SITE.tabacInfoService.phone} ({SITE.tabacInfoService.note})
        </a>
        <p className="mt-3 text-sm text-creme/75">{SITE.medicalDisclaimer}</p>
      </section>

      {/* ───────── Données ───────── */}
      <section className="mt-6 pb-6">
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-encre/70">
          <Link href="/legal/cgv" className="underline">CGV</Link>
          <Link href="/legal/confidentialite" className="underline">Confidentialité</Link>
          <Link href="/legal/mentions-legales" className="underline">Mentions légales</Link>
        </nav>
        <Link href="/app/compte/supprimer" className="mt-6 block font-semibold text-[#c2361b] underline underline-offset-4">
          Supprimer mon compte et mes données
        </Link>
      </section>
    </main>
  );
}
