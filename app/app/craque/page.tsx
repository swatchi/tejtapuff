import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/app/SubmitButton";
import { SITE } from "@/config/site";
import { RELAPSE } from "@/content/sos";
import { requireMember } from "@/lib/member";
import { relapse } from "../actions";

export const metadata: Metadata = { title: "J'ai craqué", robots: { index: false } };

export default async function CraquePage({ searchParams }: PageProps<"/app/craque">) {
  const m = await requireMember();
  const { ok, exercise } = await searchParams;

  if (ok) {
    return (
      <main className="wrap pt-8">
        <h1 className="text-[2.4rem] font-extrabold leading-none">{RELAPSE.afterTitle}</h1>
        <p className="mt-3 text-lg">{RELAPSE.afterText}</p>
        <p className="mt-4 rounded-2xl bg-white p-4">
          Tu gardes tes <strong>{m.cravingsOvercome} envies battues</strong> et tes{" "}
          <strong>{[...m.completed].filter((id) => id.startsWith("j")).length} missions</strong>.
        </p>
        <ul className="mt-6 space-y-3">
          {RELAPSE.tips.map((t) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden className="mt-1 h-3 w-3 shrink-0 rounded-full bg-jaune ring-2 ring-encre" />
              {t}
            </li>
          ))}
        </ul>
        <Link href="/app/coach" className="card mt-8 flex items-center gap-3 bg-ciel p-4 font-bold">
          <span aria-hidden className="text-2xl">💬</span>
          <span className="flex-1">Ton coach t&apos;a écrit un message</span>
          <span aria-hidden>→</span>
        </Link>
        <Link href="/app" className="btn btn-primary mt-4 w-full">
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  return (
    <main className="wrap pt-8">
      <h1 className="text-[2.4rem] font-extrabold leading-none">{RELAPSE.title}</h1>
      <p className="mt-3 text-lg">{RELAPSE.text}</p>
      <form action={relapse} className="mt-8 space-y-3">
        {typeof exercise === "string" && <input type="hidden" name="exercise" value={exercise} />}
        <SubmitButton pendingLabel="On repart…">{RELAPSE.confirm}</SubmitButton>
        <Link href="/app" className="btn btn-light w-full">
          {RELAPSE.cancel}
        </Link>
      </form>
      <p className="mt-8 text-sm text-encre/75">
        Besoin d&apos;en parler à quelqu&apos;un ?{" "}
        <a href={SITE.tabacInfoService.phoneHref} className="font-bold underline">
          {SITE.tabacInfoService.label} : {SITE.tabacInfoService.phone}
        </a>{" "}
        ({SITE.tabacInfoService.note}).
      </p>
    </main>
  );
}
