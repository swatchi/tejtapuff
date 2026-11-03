import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getMember } from "@/lib/member";
import { sendPush } from "@/lib/push";

/** Notification de test, pour vérifier que tout marche sur le téléphone. */
export async function POST() {
  const m = await getMember();
  if (!m) return jsonError(401, "Connecte-toi d'abord.");
  const delivered = await sendPush(m.user.id, {
    title: "C'est bon",
    body: "Les notifications marchent. On te prévient pour ta mission et aux moments où l'envie frappe.",
    url: "/app",
    tag: "test",
  });
  return NextResponse.json({ delivered });
}
