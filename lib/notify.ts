import "server-only";
import type { EmailContent } from "@/content/emails";
import { sendEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Envoie un email UNE seule fois pour un couple (kind, ref) — ex. rappel 48 h pour tel abonnement.
 * Si l'envoi échoue, la trace est effacée pour qu'un prochain passage réessaie.
 * Retourne false si l'email avait déjà été envoyé.
 */
export async function sendEmailOnce(params: {
  kind: string;
  ref: string;
  to: string;
  userId?: string | null;
  content: EmailContent;
}): Promise<boolean> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("email_log")
    .insert({ kind: params.kind, ref: params.ref, email: params.to, user_id: params.userId ?? null })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return false; // déjà envoyé
    throw new Error(`email_log : ${error.message}`);
  }
  try {
    await sendEmail(params.to, params.content);
    return true;
  } catch (err) {
    await db.from("email_log").delete().eq("id", data.id);
    throw err;
  }
}

/** Envoie un email et le note dans le journal (sans dédoublonnage). */
export async function sendEmailLogged(params: { kind: string; to: string; userId?: string | null; content: EmailContent }) {
  await sendEmail(params.to, params.content);
  await supabaseAdmin().from("email_log").insert({ kind: params.kind, email: params.to, user_id: params.userId ?? null });
}
