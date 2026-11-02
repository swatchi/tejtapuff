import "server-only";
import { LIMITS } from "@/config/site";
import { loginCodeEmail } from "@/content/emails";
import { sendEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Envoie un code de connexion à 6 chiffres par email.
 * On génère le code côté serveur et on l'envoie nous-mêmes (Resend) :
 * l'utilisateur reste dans le navigateur où il est (TikTok, Insta…),
 * contrairement à un lien magique qui ouvrirait un autre navigateur.
 */
export async function sendLoginCode(email: string): Promise<"sent" | "cooldown"> {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - LIMITS.loginCodeCooldownSeconds * 1000).toISOString();
  const { count } = await db
    .from("email_log")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .eq("kind", "login_code")
    .gte("created_at", since);
  if (count) return "cooldown";

  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw new Error(`generateLink : ${error.message}`);
  const code = data.properties?.email_otp;
  if (!code) throw new Error("Supabase n'a pas renvoyé de code");

  await sendEmail(email, loginCodeEmail(code));
  await db.from("email_log").insert({ email, kind: "login_code", user_id: data.user?.id ?? null });
  return "sent";
}

/** jean.dupont@gmail.com → j•••••••••t@gmail.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}•@${domain}`;
  return `${local[0]}${"•".repeat(Math.min(local.length - 2, 8))}${local.at(-1)}@${domain}`;
}
