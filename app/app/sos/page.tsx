import type { Metadata } from "next";
import { REASONS } from "@/content/quiz";
import { requireMember } from "@/lib/member";
import { savedEuros, streakDays } from "@/lib/program";
import { formatEuros, unitsPerWeekOf } from "@/lib/savings";
import { SosClient } from "./SosClient";

export const metadata: Metadata = { title: "SOS envie", robots: { index: false } };

export default async function SosPage() {
  const m = await requireMember();
  const reasons = (m.profile?.reasons ?? [])
    .map((id) => REASONS.find((r) => r.id === id)?.label)
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const saved = savedEuros(m.stats.totalMs, unitsPerWeekOf(m.profile), m.profile?.unit_price_cents ?? 0);
  const streak = streakDays(m.stats.currentMs);
  return (
    <main className="wrap pt-8">
      <SosClient
        reasons={reasons.length ? reasons : ["Tu as décidé d'arrêter. Cette envie va passer."]}
        savedLabel={formatEuros(saved)}
        streakLabel={`${streak} j`}
      />
    </main>
  );
}
