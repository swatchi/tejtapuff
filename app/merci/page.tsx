import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { OtpForm } from "@/components/OtpForm";
import { PRICING } from "@/config/pricing";
import { configured } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { PurchasePixel } from "./PurchasePixel";

export const metadata: Metadata = { title: "C'est validé", robots: { index: false } };

async function checkoutStatus(sessionId: string | undefined) {
  if (!sessionId?.startsWith("cs_") || !configured.stripe()) return "invalid" as const;
  try {
    const s = await stripe().checkout.sessions.retrieve(sessionId);
    if (s.status === "complete" && s.payment_status === "paid") return "paid" as const;
    if (s.status === "open") return "open" as const;
    return "pending" as const;
  } catch {
    return "invalid" as const;
  }
}

export default async function MerciPage({ searchParams }: PageProps<"/merci">) {
  const { session_id } = await searchParams;
  const sessionId = typeof session_id === "string" ? session_id : undefined;
  const status = await checkoutStatus(sessionId);

  return (
    <main className="min-h-dvh bg-jaune">
      <div className="wrap pb-12 pt-6">
        <Link href="/" className="text-2xl" aria-label="Accueil">
          <Logo />
        </Link>

        {status === "paid" && sessionId ? (
          <>
            <PurchasePixel sessionId={sessionId} value={PRICING.firstWeekCents / 100} />
            <h1 className="mt-8 text-[2.75rem] font-extrabold leading-[0.95] tracking-tight">C&apos;est validé 🎉</h1>
            <p className="mt-3 text-lg">Bienvenue dans le programme. Dernière étape : te connecter à ton app.</p>
            <div className="card mt-6 p-5">
              <OtpForm mode="checkout" checkoutSessionId={sessionId} />
            </div>
          </>
        ) : status === "pending" ? (
          <>
            <h1 className="mt-8 text-4xl font-extrabold leading-none">Paiement en cours de validation…</h1>
            <p className="mt-3 text-lg">Ça prend parfois quelques secondes. Recharge cette page dans un instant.</p>
            <Link href={`/merci?session_id=${sessionId}`} className="btn btn-primary mt-6 w-full">
              Recharger
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-8 text-4xl font-extrabold leading-none">On ne retrouve pas ce paiement</h1>
            <p className="mt-3 text-lg">
              Si tu as payé, ton compte existe quand même : connecte-toi avec ton email.
            </p>
            <Link href="/connexion" className="btn btn-primary mt-6 w-full">
              Me connecter
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
