import type { Metadata } from "next";
import { messagesLeftToday } from "@/lib/coach";
import { requireMember } from "@/lib/member";
import { supabaseServer } from "@/lib/supabase/server";
import { CoachClient } from "./CoachClient";

export const metadata: Metadata = { title: "Coach", robots: { index: false } };

export default async function CoachPage() {
  const m = await requireMember();
  const db = await supabaseServer();
  const { data } = await db
    .from("coach_messages")
    .select("id, role, content")
    .eq("user_id", m.user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(60);
  const initial = ((data as { id: number; role: "user" | "assistant"; content: string }[] | null) ?? [])
    .reverse()
    .map((r) => ({ id: String(r.id), role: r.role, content: r.content }));
  const remaining = await messagesLeftToday(m);
  return <CoachClient initial={initial} remaining={remaining} />;
}
