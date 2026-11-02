import "server-only";
import webpush from "web-push";
import { SITE } from "@/config/site";
import { getSetting, setSetting } from "@/lib/settings";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** Clés VAPID : variables Vercel si présentes, sinon générées une fois par /api/setup et gardées en base. */
export async function vapidKeys(): Promise<{ publicKey: string; privateKey: string } | null> {
  const envPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const envPriv = process.env.VAPID_PRIVATE_KEY;
  if (envPub && envPriv) return { publicKey: envPub, privateKey: envPriv };
  const [publicKey, privateKey] = await Promise.all([getSetting("vapid_public_key"), getSetting("vapid_private_key")]);
  return publicKey && privateKey ? { publicKey, privateKey } : null;
}

/** Crée les clés si elles n'existent pas encore. Retourne true si elles viennent d'être créées. */
export async function ensureVapidKeys(): Promise<boolean> {
  if (await vapidKeys()) return false;
  const keys = webpush.generateVAPIDKeys();
  await setSetting("vapid_private_key", keys.privateKey);
  await setSetting("vapid_public_key", keys.publicKey);
  return true;
}

let configuredFor: string | null = null;
async function configure(): Promise<boolean> {
  const keys = await vapidKeys();
  if (!keys) return false;
  if (configuredFor !== keys.publicKey) {
    const contact = process.env.VAPID_SUBJECT || `mailto:${process.env.ADMIN_EMAIL || `bonjour@${SITE.domain}`}`;
    webpush.setVapidDetails(contact, keys.publicKey, keys.privateKey);
    configuredFor = keys.publicKey;
  }
  return true;
}

type Sub = { id: string; endpoint: string; p256dh: string; auth: string; failures: number };

/**
 * Envoie une notification sur tous les appareils de la personne.
 * Les abonnements expirés (404/410) sont supprimés. Retourne le nombre d'appareils atteints.
 */
export async function sendPush(userId: string, payload: PushPayload): Promise<number> {
  if (!(await configure())) return 0;
  const db = supabaseAdmin();
  const { data } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth, failures").eq("user_id", userId);
  const subs = (data as Sub[] | null) ?? [];
  let delivered = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 6 * 3600, urgency: "normal" },
        );
        delivered++;
        await db.from("push_subscriptions").update({ failures: 0, last_success_at: new Date().toISOString() }).eq("id", s.id);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410 || s.failures >= 4) {
          await db.from("push_subscriptions").delete().eq("id", s.id);
        } else {
          await db.from("push_subscriptions").update({ failures: s.failures + 1 }).eq("id", s.id);
          console.error("[push]", status, (err as Error).message);
        }
      }
    }),
  );
  return delivered;
}
