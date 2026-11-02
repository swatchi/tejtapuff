import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { FIRST_WEEK, PRICE_SENTENCE, PRICING, WEEKLY } from "@/config/pricing";
import { LIMITS, SITE } from "@/config/site";

const PAGES = {
  "mentions-legales": { file: "mentions.md", title: "Mentions légales" },
  cgv: { file: "cgv.md", title: "Conditions générales de vente" },
  confidentialite: { file: "confidentialite.md", title: "Politique de confidentialité" },
  cookies: { file: "cookies.md", title: "Politique cookies" },
} as const;

type Slug = keyof typeof PAGES;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: PAGES[slug as Slug]?.title ?? "Légal" };
}

/** Les {{VARIABLES}} des fichiers Markdown sont remplacées par la config (prix toujours à jour). */
const VARS: Record<string, string> = {
  PRICE_SENTENCE,
  FIRST_WEEK,
  WEEKLY,
  REMINDER_HOURS: String(PRICING.reminderHoursBeforeFirstRenewal),
  COMPANY: SITE.company,
  DOMAIN: SITE.domain,
  MEDICAL: SITE.medicalDisclaimer,
  COACH_LIMIT: String(LIMITS.coachMessagesPerDay),
};

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const page = PAGES[slug as Slug];
  if (!page) notFound();
  const raw = await readFile(path.join(process.cwd(), "content/legal", page.file), "utf8");
  const md = raw
    .replace(/\{\{(\w+)\}\}/g, (_, k: string) => VARS[k] ?? `{{${k}}}`)
    // [À COMPLÉTER : …] surligné pour ne rien oublier
    .replace(/\[À COMPLÉTER[^\]]*\]/g, (m) => `<mark>${m}</mark>`);
  const html = await marked.parse(md);

  return (
    <>
      <SiteHeader tone="creme" />
      <main className="wrap pb-16 pt-6">
        <article className="prose-legal" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
      <SiteFooter />
    </>
  );
}
