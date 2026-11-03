import Link from "next/link";
import { Suspense } from "react";
import { DeletedNotice } from "@/components/DeletedNotice";
import { Calculator } from "@/components/Calculator";
import { Burst, Squiggle } from "@/components/Doodles";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { FIRST_WEEK, PRICE_SENTENCE, WEEKLY } from "@/config/pricing";
import { FEATURES, SITE } from "@/config/site";
import { FAQ } from "@/content/faq";
import { APP_FEATURES, HERO, PRICE_SECTION, STEPS, TRUST } from "@/content/landing";
import { TESTIMONIALS } from "@/content/testimonials";

const STEP_COLORS = ["bg-jaune", "bg-rose", "bg-ciel"];

export default function Home() {
  const showTestimonials = FEATURES.testimonials && TESTIMONIALS.length > 0;

  return (
    <>
      <Suspense>
        <DeletedNotice />
      </Suspense>
      <SiteHeader />
      <main>
        {/* ───────── Hero + calculateur ───────── */}
        <section className="bg-jaune pb-14">
          <div className="wrap pt-4">
            <p className="inline-block rounded-full border-2 border-encre bg-creme px-3 py-1 text-sm font-bold">
              {HERO.kicker}
            </p>
            <h1 className="mt-4 text-[2.9rem] font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-[3.75rem]">
              {HERO.titleBefore}{" "}
              <span className="relative inline-block text-braise">
                {HERO.titleHighlight}
                <Squiggle className="absolute -bottom-2 left-0 h-3 w-full text-encre" />
              </span>{" "}
              {HERO.titleAfter}
            </h1>
            <p className="mt-5 text-lg leading-snug">{HERO.subtitle}</p>
            <div className="mt-6">
              <Calculator />
            </div>
          </div>
        </section>

        {/* ───────── Comment ça marche ───────── */}
        <section className="py-14">
          <div className="wrap">
            <h2 className="h-section">{STEPS.title}</h2>
            <ol className="relative mt-8 space-y-7">
              <span aria-hidden className="absolute bottom-6 left-[1.45rem] top-6 border-l-[3px] border-dashed border-encre/25" />
              {STEPS.items.map((s, i) => (
                <li key={s.title} className="relative flex gap-4">
                  <span
                    className={`${STEP_COLORS[i]} grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-encre text-xl font-extrabold shadow-[2px_3px_0_0_#1b1a17]`}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="text-xl font-bold leading-tight">{s.title}</h3>
                    <p className="mt-1 text-encre/80">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── Dans l'app ───────── */}
        <section className="bg-encre py-14 text-creme">
          <div className="wrap">
            <h2 className="h-section text-jaune">{APP_FEATURES.title}</h2>

            <div className="mt-8 space-y-4">
              {/* Missions : façon checklist */}
              <div className="card bg-creme p-5 text-encre">
                <h3 className="text-xl font-bold">{APP_FEATURES.missions.title}</h3>
                <ul className="mt-3 space-y-2">
                  {APP_FEATURES.missions.sample.map((m, i) => (
                    <li key={m} className="flex items-center gap-3">
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-encre text-sm font-black ${i === 0 ? "bg-menthe text-white" : "bg-white"}`}
                      >
                        {i === 0 ? "✓" : ""}
                      </span>
                      <span className={i === 0 ? "line-through decoration-2 opacity-60" : ""}>{m}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[0.95rem] text-encre/75">{APP_FEATURES.missions.text}</p>
              </div>

              {/* SOS */}
              <div className="card flex items-center gap-4 bg-braise p-5 text-white">
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-[3px] border-white text-xl font-black">SOS</span>
                <div>
                  <h3 className="text-xl font-bold">{APP_FEATURES.sos.title}</h3>
                  <p className="mt-1 text-white/90">{APP_FEATURES.sos.text}</p>
                </div>
              </div>

              {/* Compteur : façon afficheur */}
              <div className="card bg-creme p-5 text-encre">
                <h3 className="text-xl font-bold">{APP_FEATURES.counter.title}</h3>
                <div className="mt-3 flex gap-2 font-mono text-2xl font-bold tabular-nums" aria-hidden>
                  {["04", "j", "12", "h", "37", "min"].map((x, i) =>
                    i % 2 === 0 ? (
                      <span key={i} className="rounded-lg bg-encre px-2 py-1 text-creme">
                        {x}
                      </span>
                    ) : (
                      <span key={i} className="self-end pb-1 text-sm text-encre/60">
                        {x}
                      </span>
                    ),
                  )}
                </div>
                <p className="mt-3 text-encre/80">{APP_FEATURES.counter.text}</p>
              </div>

              {/* Badges et objectif */}
              <div className="card bg-jaune p-5 text-encre">
                <h3 className="text-xl font-bold">{APP_FEATURES.badges.title}</h3>
                <div className="mt-3 flex gap-2" aria-hidden>
                  {["🌅", "🔥", "⭐", "🚀", "🏆"].map((e, i) => (
                    <span
                      key={e}
                      className={`grid h-11 w-11 place-items-center rounded-xl border-2 border-encre text-xl ${i < 3 ? "bg-white" : "bg-jaune-pale opacity-50"}`}
                    >
                      {e}
                    </span>
                  ))}
                </div>
                <p className="mt-3">{APP_FEATURES.badges.text}</p>
              </div>

              {FEATURES.coach && (
                <div className="card bg-ciel p-5 text-encre">
                  <h3 className="text-xl font-bold">{APP_FEATURES.coach.title}</h3>
                  <p className="mt-1">{APP_FEATURES.coach.text}</p>
                </div>
              )}

              <div className="card bg-[#c9f3e6] p-5 text-encre">
                <h3 className="text-xl font-bold">{APP_FEATURES.aide.title}</h3>
                <p className="mt-1">{APP_FEATURES.aide.text}</p>
              </div>

              {/* Rechute */}
              <div className="card bg-rose p-5 text-encre">
                <h3 className="text-xl font-bold">{APP_FEATURES.relapse.title}</h3>
                <p className="mt-1">{APP_FEATURES.relapse.text}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Confiance ───────── */}
        <section className="py-14">
          <div className="wrap">
            <h2 className="h-section">{TRUST.title}</h2>
            <ul className="mt-6 grid gap-3">
              {TRUST.items.map((t) => (
                <li key={t.title} className="card flex gap-4 p-4">
                  <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-encre bg-jaune-pale text-xl">
                    {t.emoji}
                  </span>
                  <span>
                    <span className="block font-extrabold leading-tight">{t.title}</span>
                    <span className="mt-0.5 block text-encre/80">{t.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───────── Témoignages (masqués tant qu'il n'y en a pas de vrais) ───────── */}
        {showTestimonials && (
          <section className="py-14">
            <div className="wrap space-y-4">
              {TESTIMONIALS.map((t) => (
                <blockquote key={t.firstName + t.text} className="card p-5">
                  <p>« {t.text} »</p>
                  <footer className="mt-2 font-bold">
                    {t.firstName}
                    {t.age ? `, ${t.age} ans` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* ───────── Prix ───────── */}
        <section id="prix" className="bg-jaune py-14">
          <div className="wrap">
            <div className="flex items-start justify-between gap-2">
              <h2 className="h-section pt-2">{PRICE_SECTION.title}</h2>
              <Burst className="h-32 w-32 shrink-0 rotate-12 text-creme">
                <span className="block text-center leading-none">
                  <span className="block text-xl font-black">{FIRST_WEEK}</span>
                  <span className="text-xs font-bold">1re semaine</span>
                </span>
              </Burst>
            </div>
            <div className="card mt-4 p-5">
              <p className="text-lg font-bold leading-snug">{PRICE_SENTENCE}</p>
              <p className="mt-1 text-encre/70">
                Soit {FIRST_WEEK} aujourd&apos;hui, puis {WEEKLY} tous les 7 jours tant que tu restes.
              </p>
              <ul className="mt-4 space-y-2">
                {PRICE_SECTION.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-menthe text-xs font-black text-white">
                      ✓
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/quiz" className="btn btn-primary mt-6 w-full text-lg">
              {PRICE_SECTION.cta} →
            </Link>
            <p className="mt-3 text-center text-sm">{PRICE_SECTION.ctaNote}</p>
            <p className="mt-2 text-center text-sm font-semibold">🔒 Paiement sécurisé Stripe · Rappel 48 h avant · Résiliable en 1 clic</p>
          </div>
        </section>

        {/* ───────── FAQ ───────── */}
        <section className="py-14">
          <div className="wrap">
            <h2 className="h-section">Tes questions</h2>
            <div className="mt-6 divide-y-2 divide-encre/10 border-y-2 border-encre/10">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      aria-hidden
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-encre text-xl leading-none transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="pb-5 pr-10 text-encre/85">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-6 text-encre/80">
              Envie d&apos;un suivi humain en plus ?{" "}
              <a href={SITE.tabacInfoService.phoneHref} className="font-bold underline underline-offset-4">
                {SITE.tabacInfoService.label} : {SITE.tabacInfoService.phone}
              </a>{" "}
              ({SITE.tabacInfoService.note}).
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
