import type { Metadata } from "next";
import { cardImagePath } from "@/lib/card";
import { requireMember } from "@/lib/member";
import { ShareCard } from "./ShareCard";

export const metadata: Metadata = { title: "Partager", robots: { index: false } };

export default async function PartagerPage() {
  const m = await requireMember();
  return (
    <main className="wrap pt-8">
      <h1 className="text-[2.4rem] font-extrabold leading-none">Ta carte</h1>
      <p className="mt-3 text-lg">Tes vrais chiffres, prêts pour ta story. Aucune info perso dessus.</p>
      <div className="mt-6">
        <ShareCard imageUrl={cardImagePath(m.user.id)} />
      </div>
    </main>
  );
}
