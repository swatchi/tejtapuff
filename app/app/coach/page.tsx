import type { Metadata } from "next";
import { messagesLeftToday } from "@/lib/coach";
import { requireMember } from "@/lib/member";
import { supabaseServer } from "@/lib/supabase/server";
import { CoachClient } from "./CoachClient";

export const metadata: Metadata = { title: "Coach", robots: { index: false } };

export default async function CoachPage() {
  const m = await requireMember();
  const db = await supabaseServer();
  const { data, error } = await db
    .from("coach_messages")
    .select("id, role, content")
    .eq("user_id", m.user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(60);
  const initial = ((data as { id: number; role: "user" | "assistant"; content: string }[] | null) ?? [])
    .reverse()
    .map((r) => ({ id: String(r.id), role: r.role, content: r.content }));
  if (error) {
    return (
      <main className="wrap pt-10">
        <h1 className="text-3xl font-extrabold">Le coach arrive très vite</h1>
        <p className="mt-3 text-lg">Il est en cours d&apos;installation. En attendant, le bouton SOS est là pour les envies.</p>
      </main>
    );
  }
  const remaining = await messagesLeftToday(m);
  return <CoachClient initial={initial} remaining={remaining} />;
}
