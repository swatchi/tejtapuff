import type { Metadata } from "next";
import Link from "next/link";
import { OtpForm } from "@/components/OtpForm";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  const { suivant } = await searchParams;
  // Seulement des chemins internes (pas de redirection vers un autre site)
  const next = typeof suivant === "string" && /^\/(?!\/)[\w/-]*$/.test(suivant) ? suivant : undefined;
  return (
    <>
      <SiteHeader tone="creme" />
      <main className="wrap pb-16 pt-6">
        <h1 className="text-[2.6rem] font-extrabold leading-[0.95] tracking-tight">Connexion</h1>
        <p className="mt-3 text-lg">Pas de mot de passe : on t&apos;envoie un code par email.</p>
        <div className="card mt-6 p-5">
          <OtpForm mode="email" next={next} />
        </div>
        <p className="mt-6 text-encre/80">
          Pas encore de compte ?{" "}
          <Link href="/quiz" className="font-bold underline underline-offset-4">
            Fais le quiz (2 min)
          </Link>
        </p>
      </main>
    </>
  );
}
