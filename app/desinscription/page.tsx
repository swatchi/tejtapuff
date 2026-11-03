import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { verify } from "@/lib/signing";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Désinscription", robots: { index: false } };

/** Lien « Ne plus recevoir ces rappels » des emails de relance : effet immédiat, sans connexion. */
export default async function DesinscriptionPage({ searchParams }: PageProps<"/desinscription">) {
  await connection();
  const { q, s } = await searchParams;
  const quizId = typeof q === "string" ? q : "";
  let ok = false;
  if (/^[0-9a-f-]{36}$/i.test(quizId) && verify("unsub", quizId, typeof s === "string" ? s : null)) {
    const db = supabaseAdmin();
    const { data } = await db.from("quiz_answers").select("email").eq("id", quizId).maybeSingle();
    if (data?.email) {
      await db.from("quiz_answers").update({ followup_consent_at: null }).eq("email", data.email);
      ok = true;
    }
  }
  return (
    <main className="wrap pt-16">
      <h1 className="text-3xl font-extrabold">{ok ? "C'est noté" : "Lien invalide"}</h1>
      <p className="mt-3 text-lg">
        {ok ? "Tu ne recevras plus de rappel." : "Ce lien ne fonctionne pas. Écris-nous si tu reçois encore des rappels."}
      </p>
      <Link href="/" className="btn btn-light mt-6 w-full">
        Retour au site
      </Link>
    </main>
  );
}
