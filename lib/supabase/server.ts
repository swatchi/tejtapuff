import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configured, requireEnv } from "@/lib/env";

/**
 * Client Supabase « au nom de l'utilisateur connecté » (cookies de session).
 * Soumis à la RLS : il ne voit que les lignes de l'utilisateur.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component : le proxy rafraîchit la session.
          }
        },
      },
    },
  );
}

/** Utilisateur connecté (vérifié auprès de Supabase), ou null. */
export async function currentUser() {
  if (!configured.supabase()) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
