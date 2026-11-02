import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { euros } from "@/config/pricing";
import { currentUser, supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mon programme", robots: { index: false } };

const STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  trialing: "Actif",
  past_due: "Paiement en retard",
  unpaid: "Impayé",
  canceled: "Résilié",
  incomplete: "En attente de paiement",
  incomplete_expired: "Paiement expiré",
  paused: "En pause",
};

function day(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" })
    : "?";
}

/**
 * Étape 1 : page d'accueil provisoire de l'app (le vrai tableau de bord arrive à l'étape 2).
 * Toutes les infos affichées viennent de la base, lues avec la session de l'utilisateur (RLS).
 */
export default async function AppHome() {
  const user = await currentUser();
  if (!user) redirect("/connexion");

  const supabase = await supabaseServer();
  const [{ data: profile }, { data: subs }] = await Promise.all([
    supabase.from("profiles").select("start_date, email").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, price_cents, current_period_end, cancel_at_period_end")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const sub = subs?.[0];

  return (
    <main className="min-h-dvh bg-creme">
      <div className="bg-jaune pb-8 pt-6">
        <div className="wrap">
          <div className="flex items-center justify-between">
            <span className="text-2xl">
              <Logo />
            </span>
            <form action="/api/auth/signout" method="post">
              <button className="text-sm font-semibold underline underline-offset-4">Déconnexion</button>
            </form>
          </div>
          <h1 className="mt-8 text-[2.6rem] font-extrabold leading-[0.95] tracking-tight">Salut 👋</h1>
          {profile?.start_date && (
            <p className="mt-3 text-lg">
              Ton jour 1 : <strong>{day(`${profile.start_date}T12:00:00Z`)}</strong>
            </p>
          )}
        </div>
      </div>
      <div className="wrap mt-6 space-y-4">
        <div className="card p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-gris">Ton abonnement</p>
          {sub ? (
            <>
              <p className="mt-2 text-2xl font-extrabold">{STATUS_LABEL[sub.status] ?? sub.status}</p>
              {sub.cancel_at_period_end ? (
                <p className="mt-1">Accès jusqu&apos;au {day(sub.current_period_end)}, plus aucun prélèvement ensuite.</p>
              ) : (
                <p className="mt-1">
                  Prochain prélèvement : {sub.price_cents ? euros(sub.price_cents) : "?"} le {day(sub.current_period_end)}.
                </p>
              )}
            </>
          ) : (
            <p className="mt-2">On finalise ton abonnement, recharge dans quelques secondes.</p>
          )}
        </div>
        <div className="rounded-3xl border-2 border-dashed border-encre/30 p-5 text-encre/70">
          Ton tableau de bord (compteur, missions, SOS) arrive ici.
        </div>
      </div>
    </main>
  );
}
