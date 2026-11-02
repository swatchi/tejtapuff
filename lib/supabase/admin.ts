import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Client serveur avec la clé secrète : contourne la RLS.
 * À n'utiliser QUE dans du code serveur, après avoir vérifié qui fait la requête.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SECRET_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return client;
}
