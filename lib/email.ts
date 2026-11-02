import "server-only";
import { Resend } from "resend";
import type { EmailContent } from "@/content/emails";
import { SITE } from "@/config/site";
import { configured, siteUrl } from "@/lib/env";

let resend: Resend | null = null;

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Mise en forme commune à tous les emails : simple, lisible, compatible Gmail/Outlook. */
export function renderEmail(c: EmailContent): { html: string; text: string } {
  const p = c.paragraphs
    .map((t) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1b1a17">${esc(t)}</p>`)
    .join("");
  const highlight = c.highlight
    ? `<p style="margin:8px 0 24px;font-size:40px;letter-spacing:8px;font-weight:800;font-family:ui-monospace,Menlo,monospace;color:#1b1a17;background:#fff3c4;border:2px solid #1b1a17;border-radius:14px;padding:16px;text-align:center">${esc(c.highlight)}</p>`
    : "";
  const cta = c.cta
    ? `<p style="margin:8px 0 24px"><a href="${esc(c.cta.url)}" style="display:inline-block;background:#1b1a17;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 22px;border-radius:999px">${esc(c.cta.label)}</a></p>`
    : "";
  const foot = c.footnote
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#5c584f">${esc(c.footnote)}</p>`
    : "";

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(c.subject)}</title></head>
<body style="margin:0;background:#fffbef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${esc(c.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbef"><tr><td align="center" style="padding:24px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:2px solid #1b1a17;border-radius:20px">
<tr><td style="background:#ffd43b;border-radius:18px 18px 0 0;padding:18px 24px;font-size:22px;font-weight:800;color:#1b1a17">tej ta <s style="text-decoration-color:#ff5b3a;text-decoration-thickness:3px">puff</s></td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;color:#1b1a17">${esc(c.heading)}</h1>
${p}${highlight}${cta}${foot}
</td></tr></table>
<p style="max-width:520px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#5c584f">${esc(SITE.medicalDisclaimer)}<br>${esc(SITE.company)} · <a href="${siteUrl()}" style="color:#5c584f">${esc(SITE.domain)}</a></p>
</td></tr></table></body></html>`;

  const text = [
    c.heading,
    "",
    ...c.paragraphs,
    c.highlight ? `\n${c.highlight}\n` : "",
    c.cta ? `${c.cta.label} : ${c.cta.url}` : "",
    c.footnote ?? "",
    "",
    `${SITE.medicalDisclaimer} ${SITE.company} · ${SITE.domain}`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  return { html, text };
}

/**
 * Envoie un email via Resend. Sans RESEND_API_KEY (dev local), l'email est
 * affiché dans la console du serveur au lieu d'être envoyé.
 */
export async function sendEmail(to: string, content: EmailContent): Promise<void> {
  const { html, text } = renderEmail(content);
  if (!configured.resend()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY manquante : impossible d'envoyer des emails en production.");
    }
    console.info(`\n📧 [email non envoyé — RESEND_API_KEY absente]\nÀ : ${to}\nSujet : ${content.subject}\n${text}\n`);
    return;
  }
  resend ??= new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? `TejTaPuff <bonjour@${SITE.domain}>`,
    to,
    subject: content.subject,
    html,
    text,
  });
  if (error) throw new Error(`Resend : ${error.message}`);
}
