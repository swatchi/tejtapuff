import Link from "next/link";
import { ManageCookiesButton } from "@/components/CookieBanner";
import { Logo } from "@/components/Logo";
import { SITE } from "@/config/site";
import { FOOTER } from "@/content/landing";

export function SiteFooter() {
  const tis = SITE.tabacInfoService;
  return (
    <footer className="bg-encre pb-28 pt-12 text-creme">
      <div className="wrap">
        <div className="rounded-3xl border-2 border-creme/30 p-5">
          <p className="text-lg font-bold">{FOOTER.helpTitle}</p>
          <p className="mt-1 text-creme/80">{FOOTER.helpText}</p>
          <a
            href={tis.phoneHref}
            className="mt-4 inline-flex items-center gap-3 rounded-full bg-jaune px-5 py-3 font-bold text-encre"
          >
            <span className="whitespace-nowrap text-xl">📞 {tis.phone}</span>
            <span className="text-sm font-semibold">{tis.label} · {tis.note}</span>
          </a>
        </div>

        <p className="mt-8 text-[0.95rem] font-semibold text-jaune">{SITE.medicalDisclaimer}</p>

        <nav aria-label="Informations légales" className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-[0.95rem] text-creme/85">
          <Link href="/legal/mentions-legales" className="underline-offset-4 hover:underline">Mentions légales</Link>
          <Link href="/legal/cgv" className="underline-offset-4 hover:underline">CGV</Link>
          <Link href="/legal/confidentialite" className="underline-offset-4 hover:underline">Confidentialité</Link>
          <Link href="/legal/cookies" className="underline-offset-4 hover:underline">Cookies</Link>
          <ManageCookiesButton className="underline-offset-4 hover:underline" />
        </nav>

        <div className="mt-10 flex items-end justify-between gap-4">
          <span className="text-2xl text-creme">
            <Logo />
          </span>
          <span className="text-sm text-creme/60">© {SITE.company}</span>
        </div>
      </div>
    </footer>
  );
}
