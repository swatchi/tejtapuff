import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Réglages techniques stockés en base (serveur uniquement, jamais lisibles depuis le navigateur). */
export type SettingKey =
  | "stripe_webhook_secret"
  | "stripe_webhook_id"
  | "stripe_portal_configuration"
  | "vapid_public_key"
  | "vapid_private_key"
  | "hourly_last_run";

const cache = new Map<SettingKey, { value: string | null; at: number }>();

export async function getSetting(key: SettingKey): Promise<string | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 60_000) return hit.value;
  const { data, error } = await supabaseAdmin().from("app_settings").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(`app_settings : ${error.message}`);
  const value = (data?.value as string | undefined) ?? null;
  cache.set(key, { value, at: Date.now() });
  return value;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(`app_settings : ${error.message}`);
  cache.set(key, { value, at: Date.now() });
}
