import { NextResponse } from "next/server";
import { vapidKeys } from "@/lib/push";

/** Clé publique nécessaire au navigateur pour s'abonner aux notifications. */
export async function GET() {
  try {
    const keys = await vapidKeys();
    if (!keys) return NextResponse.json({ error: "Notifications pas encore configurées (ouvre /api/setup)." }, { status: 503 });
    return NextResponse.json({ publicKey: keys.publicKey }, { headers: { "cache-control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "Indisponible" }, { status: 503 });
  }
}
