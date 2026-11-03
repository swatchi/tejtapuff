import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/config/site";
import { AIDE } from "@/content/aide";
import { TRIGGERS } from "@/content/quiz";
import { requireMember } from "@/lib/member";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Besoin d'aide", robots: { index: false } };

export default async function AidePage() {
  const m = await requireMember();
  const tes = TRIGGERS.filter((t) => m.profile?.triggers?.includes(t.id));
  const autres = TRIGGERS.filter((t) => !m.profile?.triggers?.includes(t.id));
  const tis = SITE.tabacInfoService;

  return (
    <main className="wrap pb-10 pt-8">
      <h1 className="text-[2.4rem] font-extrabold leading-none">{AIDE.title}</h1>
      <p className="mt-3 text-lg">{AIDE.subtitle}</p>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/app/sos" className="card bg-braise p-4 text-white">
          <span className="block text-2xl font-black">SOS</span>
          <span className="mt-1 block font-semibold leading-tight">Une envie, là, maintenant</span>
        </Link>
        <Link href="/app/coach" className="card bg-ciel p-4">
          <Icon name="chat" className="h-7 w-7" />
          <span className="mt-1 block font-semibold leading-tight">Écrire au coach</span>
        </Link>
      </section>

      {tes.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-extrabold">Tes moments à risque</h2>
          <p className="mt-1 text-encre/75">Ceux que tu as choisis dans le quiz, et quoi faire quand ils arrivent.</p>
          <div className="mt-4 space-y-3">
            {tes.map((t) => (
              <Moment key={t.id} id={t.id} ouvert />
            ))}
          </div>
        </section>
      )}

      {autres.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-extrabold">{tes.length ? "Les autres moments" : "Les moments à risque"}</h2>
          <div className="mt-4 space-y-3">
            {autres.map((t) => (
              <Moment key={t.id} id={t.id} />
            ))}
          </div>
        </section>
      )}

      <section className="card mt-8 bg-encre p-5 text-creme">
        <h2 className="text-xl font-extrabold text-jaune">{AIDE.humains.titre}</h2>
        <p className="mt-2 text-creme/90">{AIDE.humains.texte}</p>
        <a href={tis.phoneHref} className="btn mt-4 w-full whitespace-nowrap border-jaune bg-jaune text-encre">
          <Icon name="phone" className="h-5 w-5" /> {tis.label} : {tis.phone}
        </a>
        <p className="mt-2 text-center text-sm text-creme/75">
          {tis.note} ·{" "}
          <a href={tis.url} className="underline underline-offset-4" target="_blank" rel="noopener">
            tabac-info-service.fr
          </a>
        </p>
        <p className="mt-4 text-sm text-creme/80">{AIDE.medecin}</p>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="text-lg font-extrabold">{AIDE.urgence.titre}</h2>
        <p className="mt-1">{AIDE.urgence.texte}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={SITE.suicidePrevention.phoneHref} className="btn btn-light whitespace-nowrap">
            <Icon name="phone" className="h-5 w-5" /> 3114
          </a>
          <a href="tel:112" className="btn btn-light whitespace-nowrap">
            <Icon name="phone" className="h-5 w-5" /> 112
          </a>
        </div>
      </section>

      <p className="mt-6 text-center text-sm text-encre/70">{SITE.medicalDisclaimer}</p>
    </main>
  );
}

function Moment({ id, ouvert = false }: { id: string; ouvert?: boolean }) {
  const m = AIDE.parMoment[id];
  if (!m) return null;
  return (
    <details open={ouvert} className="card group p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-extrabold [&::-webkit-details-marker]:hidden">
        {m.titre}
        <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-encre transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <ul className="mt-3 space-y-2">
        {m.conseils.map((c) => (
          <li key={c} className="flex gap-3">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-menthe text-white">
              <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3.2} />
            </span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
