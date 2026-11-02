import type { Metadata } from "next";
import Link from "next/link";
import { verify } from "@/lib/signing";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ResumeClient } from "./ResumeClient";

export const metadata: Metadata = { title: "Ton plan", robots: { index: false } };

/** Lien des emails de relance : reprend le quiz déjà rempli, sans tout refaire. */
export default async function ReprendrePage({ searchParams }: PageProps<"/reprendre">) {
  const { q, s } = await searchParams;
  const quizId = typeof q === "string" ? q : "";
  if (/^[0-9a-f-]{36}$/i.test(quizId) && verify("resume", quizId, typeof s === "string" ? s : null)) {
    const { data } = await supabaseAdmin().from("quiz_answers").select("id, answers, user_id").eq("id", quizId).maybeSingle();
    if (data && !data.user_id) return <ResumeClient quizId={data.id} answers={data.answers} />;
  }
  return (
    <main className="wrap pt-16">
      <h1 className="text-3xl font-extrabold">Lien expiré</h1>
      <p className="mt-3 text-lg">Pas grave : refais le quiz, ça prend 2 minutes.</p>
      <Link href="/quiz" className="btn btn-primary mt-6 w-full">
        Refaire le quiz
      </Link>
    </main>
  );
}
