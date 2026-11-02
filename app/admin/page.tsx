import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Logo } from "@/components/Logo";
import { type AdminData, isAdminEmail, loadAdminData, PERIODS, type PeriodKey } from "@/lib/admin";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const nf = new Intl.NumberFormat("fr-FR");
const pct = (x: number | null) => (x === null ? "–" : `${(x * 100).toLocaleString("fr-FR", { maximumFractionDigits: x < 0.1 ? 1 : 0 })} %`);
const eur = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: cents >= 100_000 ? 0 : 2 }).format(cents / 100);
const BROWSERS: Record<string, string> = { tiktok: "TikTok (navigateur intégré)", instagram: "Instagram (navigateur intégré)", facebook: "Facebook", other: "Autres navigateurs" };
const BAR = "#ff5b3a"; // une seule teinte (validée : contraste ≥ 3:1 sur fond blanc)

/**
 * Tableau de bord admin, réservé au compte ADMIN_EMAIL.
 * Tous les chiffres viennent de la base : parcours (funnel_events), abonnements et paiements (miroir Stripe), programme.
 */
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await connection();
  const user = await currentUser();
  if (!user) redirect("/connexion?suivant=/admin");
  if (!isAdminEmail(user.email)) notFound();

  const { p } = await searchParams;
  const period: PeriodKey = typeof p === "string" && p in PERIODS ? (p as PeriodKey) : "7j";

  let data: AdminData;
  try {
    data = await loadAdminData(period);
  } catch (err) {
    return (
      <main className="wrap py-10">
        <h1 className="text-3xl font-extrabold">Admin</h1>
        <p role="alert" className="mt-4 rounded-2xl border-2 border-braise bg-white p-4">
          {err instanceof Error ? err.message : "Erreur de chargement"}
        </p>
      </main>
    );
  }

  const { funnel, subscribers, revenue, videos, browsers, program } = data;
  const visits = funnel[0].visitors;
  const updated = new Date().toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });

  return (
    <main className="min-h-dvh bg-creme pb-16">
      <header className="border-b-2 border-encre bg-jaune">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-baseline gap-3">
            <span className="text-xl">
              <Logo />
            </span>
            <span className="rounded-full bg-encre px-2.5 py-0.5 text-xs font-bold text-jaune">Admin</span>
          </div>
          <nav aria-label="Période" className="flex gap-1 rounded-full border-2 border-encre bg-white p-1">
            {(Object.keys(PERIODS) as PeriodKey[]).map((k) => (
              <Link
                key={k}
                href={`/admin?p=${k}`}
                aria-current={k === period ? "page" : undefined}
                className={`rounded-full px-3 py-1 text-sm font-bold ${k === period ? "bg-encre text-white" : ""}`}
              >
                {PERIODS[k].label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 pt-6">
        {/* ───────── Chiffre principal + indicateurs ───────── */}
        <section aria-label="Indicateurs clés" className="rounded-3xl border-2 border-encre bg-white p-5">
          <p className="text-sm font-semibold text-gris">Encaissé · {PERIODS[period].label.toLowerCase()}</p>
          <p className="mt-1 text-5xl font-extrabold tracking-tight">{eur(revenue.inPeriod)}</p>
          <p className="mt-1 text-sm text-gris">
            {nf.format(subscribers.newInPeriod)} nouvel{subscribers.newInPeriod > 1 ? "s" : ""} abonné{subscribers.newInPeriod > 1 ? "s" : ""} ·{" "}
            {nf.format(revenue.renewals)} renouvellement{revenue.renewals > 1 ? "s" : ""} · mis à jour à {updated}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Tile label="Abonnés actifs" value={nf.format(subscribers.active)} />
            <Tile label="Revenu 7 derniers jours" value={eur(revenue.last7)} />
            <Tile label="Semaine prochaine (si tous renouvellent)" value={eur(revenue.nextWeekRunRate)} />
            <Tile label="Visite → vente" value={pct(visits ? subscribers.newInPeriod / visits : null)} />
            <Tile label="Résiliations (période)" value={nf.format(subscribers.cancellationsInPeriod)} hint={`${nf.format(subscribers.cancelScheduled)} en fin de semaine payée`} />
            <Tile label="Impayés" value={nf.format(subscribers.pastDue)} hint="Stripe relance automatiquement" />
          </dl>
        </section>

        {/* ───────── Parcours ───────── */}
        <Card title="Parcours de vente" subtitle="Visiteurs uniques à chaque étape · % par rapport à l'étape d'avant">
          <ol className="space-y-3">
            {funnel.map((f, i) => {
              const width = visits ? Math.max((f.visitors / visits) * 100, f.visitors ? 1 : 0) : 0;
              return (
                <li key={f.step} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{f.label}</span>
                    <span className="tabular-nums">
                      <strong>{nf.format(f.visitors)}</strong>
                      {i > 0 && <span className="ml-1.5 text-gris">{pct(f.fromPrev)}</span>}
                    </span>
                  </div>
                  <span
                    tabIndex={0}
                    className="group relative mt-1.5 block h-5 rounded-r-[4px] bg-[#f3eedd] outline-none focus-visible:ring-2 focus-visible:ring-encre"
                    aria-label={`${f.label} : ${nf.format(f.visitors)} visiteurs, ${pct(f.fromStart)} des visites`}
                  >
                    <span className="block h-5 rounded-r-[4px] transition-opacity group-hover:opacity-80" style={{ width: `${width}%`, background: BAR }} />
                    <Tip>
                      <strong>{nf.format(f.visitors)}</strong> visiteurs · {pct(f.fromStart)} des visites
                    </Tip>
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* ───────── Ventes par vidéo ───────── */}
        <Card title="Ventes par vidéo" subtitle="Regroupées par utm_content (mets l'ID de la vidéo dans le lien en bio)">
          {videos.length === 0 ? (
            <Empty>Pas encore de visite sur la période.</Empty>
          ) : (
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b-2 border-encre text-left">
                    <th className="py-2 pr-3 font-bold">Vidéo</th>
                    <Th>Visites</Th>
                    <Th>Quiz finis</Th>
                    <Th>Paiements lancés</Th>
                    <Th>Ventes</Th>
                    <Th>Visite → vente</Th>
                    <Th>Encaissé</Th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((v) => (
                    <tr key={v.video} className="border-b border-trait">
                      <td className="max-w-[12rem] truncate py-2 pr-3 font-semibold" title={v.video}>
                        {v.video}
                      </td>
                      <Td>{nf.format(v.visits)}</Td>
                      <Td>{nf.format(v.quizDone)}</Td>
                      <Td>{nf.format(v.checkouts)}</Td>
                      <Td strong>{nf.format(v.sales)}</Td>
                      <Td>{pct(v.conversion)}</Td>
                      <Td>{eur(v.cents)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-gris">
            Exemple de lien en bio : <code className="rounded bg-creme px-1">https://ton-site/?utm_source=tiktok&amp;utm_content=video_042</code>
          </p>
        </Card>

        {/* ───────── Revenu par semaine ───────── */}
        <Card title="Revenu par semaine" subtitle="8 dernières semaines, du lundi au dimanche (heure de Paris)">
          <WeeklyBars weeks={revenue.weeks} />
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ───────── Navigateurs ───────── */}
          <Card title="D'où viennent les visites" subtitle="Navigateur détecté à la visite">
            {browsers.length === 0 ? (
              <Empty>Pas encore de visite sur la période.</Empty>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-encre text-left">
                    <th className="py-2 pr-3 font-bold">Navigateur</th>
                    <Th>Visites</Th>
                    <Th>Quiz finis</Th>
                    <Th>Payé</Th>
                  </tr>
                </thead>
                <tbody>
                  {browsers.map((b) => (
                    <tr key={b.browser} className="border-b border-trait">
                      <td className="py-2 pr-3 font-semibold">{BROWSERS[b.browser] ?? b.browser}</td>
                      <Td>{nf.format(b.visits)}</Td>
                      <Td>{nf.format(b.quizDone)}</Td>
                      <Td strong>{nf.format(b.paid)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* ───────── Programme ───────── */}
          <Card title="Programme" subtitle={`Sur la période · ${PERIODS[period].label.toLowerCase()}`}>
            <dl className="grid grid-cols-2 gap-3">
              <Tile label="Envies SOS surmontées" value={nf.format(program.overcome)} />
              <Tile label="Rechutes déclarées" value={nf.format(program.relapses)} />
              <Tile label="Messages au coach" value={nf.format(program.coachMessages)} />
              <Tile label="Appareils avec notifications" value={nf.format(program.devices)} hint="Au total" />
            </dl>
          </Card>
        </div>

        <p className="text-center text-xs text-gris">
          Tous les chiffres sont lus en base (Supabase, miroir de Stripe). Les paiements font foi dans Stripe.
        </p>
      </div>
    </main>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border-2 border-encre bg-white p-5">
      <h2 className="text-xl font-extrabold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-gris">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-creme p-3">
      <dt className="text-xs font-semibold text-gris">{label}</dt>
      <dd className="mt-1 text-2xl font-extrabold">{value}</dd>
      {hint && <dd className="text-xs text-gris">{hint}</dd>}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2 pl-3 text-right font-bold">{children}</th>;
}
function Td({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return <td className={`py-2 pl-3 text-right tabular-nums ${strong ? "font-extrabold" : ""}`}>{children}</td>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-creme p-4 text-sm text-gris">{children}</p>;
}

/** Infobulle CSS : visible au survol et au focus clavier (la valeur reste lisible sans elle). */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute -top-9 left-0 z-10 hidden whitespace-nowrap rounded-lg bg-encre px-2 py-1 text-xs text-white group-hover:block group-focus:block"
    >
      {children}
    </span>
  );
}

function WeeklyBars({ weeks }: { weeks: AdminData["revenue"]["weeks"] }) {
  const max = Math.max(...weeks.map((w) => w.cents), 1);
  const label = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const last = weeks[weeks.length - 1];
  return (
    <div>
      <p className="text-sm">
        Semaine en cours : <strong>{eur(last.cents)}</strong> ({nf.format(last.count)} paiement{last.count > 1 ? "s" : ""})
      </p>
      <div className="mt-6 flex h-44 items-end gap-2 border-b border-trait" role="list" aria-label="Revenu par semaine">
        {weeks.map((w) => (
          <div key={w.week} role="listitem" className="flex h-full flex-1 flex-col justify-end">
            <span
              tabIndex={0}
              aria-label={`Semaine du ${label(w.week)} : ${eur(w.cents)}, ${w.count} paiements`}
              className="group relative mx-auto flex h-full w-full max-w-6 items-end outline-none focus-visible:ring-2 focus-visible:ring-encre"
            >
              <span
                className="block w-full rounded-t-[4px] transition-opacity group-hover:opacity-80"
                style={{ height: `${(w.cents / max) * 100}%`, minHeight: w.cents ? 2 : 0, background: BAR }}
              />
              <Tip>
                <strong>{eur(w.cents)}</strong> · {w.count} paiement{w.count > 1 ? "s" : ""}
              </Tip>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2 text-[0.7rem] text-gris">
        {weeks.map((w) => (
          <span key={w.week} className="flex-1 text-center tabular-nums">
            {label(w.week)}
          </span>
        ))}
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold">Voir le tableau</summary>
        <table className="mt-2 w-full">
          <tbody>
            {weeks.map((w) => (
              <tr key={w.week} className="border-b border-trait">
                <td className="py-1.5">Semaine du {label(w.week)}</td>
                <Td>{nf.format(w.count)} paiement{w.count > 1 ? "s" : ""}</Td>
                <Td strong>{eur(w.cents)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
