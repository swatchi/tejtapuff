import { Resend } from "resend";
import { SITE } from "@/config/site";
import { siteUrl } from "@/lib/env";
import { getSetting, setSetting } from "@/lib/settings";
import { ensureCatalog, stripe, WEBHOOK_EVENTS } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Installation et diagnostic en 1 clic : https://TON-SITE/api/setup?cle=CRON_SECRET
 * - vérifie les variables, la base Supabase et Resend
 * - crée dans Stripe le produit, le prix, la remise 1re semaine, le webhook et le portail de paiement
 *   (le secret du webhook est enregistré en base : rien à copier à la main)
 * Sans danger si on la relance : elle ne recrée que ce qui manque.
 */
export const maxDuration = 60;

type Check = { label: string; ok: boolean | "warn"; detail?: string };

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CRON_SECRET",
];

function msg(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("cle");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return html([{ label: "Accès refusé", ok: false, detail: "Ajoute ?cle=TON_CRON_SECRET à la fin de l'adresse." }], "");
  }

  const base = siteUrl();
  const checks: Check[] = [];

  // 1. Variables
  const missing = REQUIRED_ENV.filter((n) => !process.env[n]);
  checks.push({
    label: "Variables Vercel",
    ok: missing.length === 0,
    detail: missing.length ? `Manquantes : ${missing.join(", ")}` : "Toutes présentes",
  });
  checks.push({ label: "Adresse du site", ok: !base.includes("localhost"), detail: base });

  // 2. Supabase
  try {
    const db = supabaseAdmin();
    const tables = ["profiles", "subscriptions", "payments", "quit_attempts", "mission_completions", "cravings", "app_settings"];
    const absent: string[] = [];
    for (const t of tables) {
      const { error } = await db.from(t).select("*", { count: "exact", head: true });
      if (error) absent.push(t);
    }
    checks.push({
      label: "Base Supabase",
      ok: absent.length === 0,
      detail: absent.length ? `Tables introuvables : ${absent.join(", ")} (colle le SQL manquant dans Supabase)` : "Toutes les tables sont là",
    });
  } catch (err) {
    checks.push({ label: "Base Supabase", ok: false, detail: msg(err) });
  }

  // 3. Stripe
  const sk = process.env.STRIPE_SECRET_KEY ?? "";
  if (sk) {
    checks.push({
      label: "Mode Stripe",
      ok: sk.startsWith("sk_test") ? true : "warn",
      detail: sk.startsWith("sk_test") ? "TEST (aucun vrai paiement)" : "LIVE : les paiements sont réels",
    });
    try {
      const { priceId, couponId } = await ensureCatalog();
      checks.push({ label: "Produit, prix et remise 1re semaine", ok: true, detail: `${priceId} · ${couponId}` });
    } catch (err) {
      checks.push({ label: "Produit, prix et remise 1re semaine", ok: false, detail: msg(err) });
    }

    // Webhook
    const url = `${base}/api/webhooks/stripe`;
    try {
      if (base.includes("localhost")) throw new Error("Impossible en local : lance cette page sur le site en ligne.");
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        checks.push({ label: "Webhook Stripe", ok: true, detail: "Secret fourni dans les variables Vercel (configuration manuelle)" });
      } else {
        const s = stripe();
        const existing = (await s.webhookEndpoints.list({ limit: 100 })).data.filter((e) => e.url === url);
        const storedId = await getSetting("stripe_webhook_id");
        const storedSecret = await getSetting("stripe_webhook_secret");
        const mine = existing.find((e) => e.id === storedId);
        if (mine && storedSecret) {
          await s.webhookEndpoints.update(mine.id, { enabled_events: WEBHOOK_EVENTS, disabled: false });
          checks.push({ label: "Webhook Stripe", ok: true, detail: `Déjà en place → ${url}` });
        } else {
          // Le secret n'est lisible qu'à la création : on remplace les anciens endpoints de cette adresse.
          for (const e of existing) await s.webhookEndpoints.del(e.id);
          const created = await s.webhookEndpoints.create({
            url,
            enabled_events: WEBHOOK_EVENTS,
            description: "TejTaPuff (créé automatiquement par /api/setup)",
          });
          if (!created.secret) throw new Error("Stripe n'a pas renvoyé de secret");
          await setSetting("stripe_webhook_secret", created.secret);
          await setSetting("stripe_webhook_id", created.id);
          checks.push({ label: "Webhook Stripe", ok: true, detail: `Créé → ${url}` });
        }
      }
    } catch (err) {
      checks.push({ label: "Webhook Stripe", ok: false, detail: msg(err) });
    }

    // Portail « mettre à jour ma carte »
    try {
      const s = stripe();
      const storedConfig = await getSetting("stripe_portal_configuration");
      let ok = false;
      if (storedConfig) {
        const conf = await s.billingPortal.configurations.retrieve(storedConfig).catch(() => null);
        ok = Boolean(conf?.active);
      }
      if (!ok) {
        const conf = await s.billingPortal.configurations.create({
          name: "TejTaPuff",
          business_profile: {
            headline: "TejTaPuff : gère ton moyen de paiement",
            privacy_policy_url: `${base}/legal/confidentialite`,
            terms_of_service_url: `${base}/legal/cgv`,
          },
          features: {
            payment_method_update: { enabled: true },
            invoice_history: { enabled: true },
          },
          default_return_url: `${base}/app/compte`,
        });
        await setSetting("stripe_portal_configuration", conf.id);
      }
      checks.push({ label: "Portail de paiement Stripe", ok: true, detail: ok ? "Déjà en place" : "Créé" });
    } catch (err) {
      checks.push({ label: "Portail de paiement Stripe", ok: false, detail: msg(err) });
    }
  }

  // 4. Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const { data, error } = await new Resend(process.env.RESEND_API_KEY).domains.list();
      if (error) throw new Error(error.message);
      const from = process.env.EMAIL_FROM ?? "";
      const fromDomain = /@([^>\s]+)/.exec(from)?.[1]?.toLowerCase() ?? "";
      const domains = data?.data ?? [];
      const match = domains.find((d) => d.name.toLowerCase() === fromDomain);
      if (fromDomain === "resend.dev") {
        checks.push({
          label: "Emails (Resend)",
          ok: "warn",
          detail: "Adresse de test resend.dev : les emails ne partent que vers l'adresse de ton compte Resend. Vérifie ton domaine pour envoyer à tout le monde.",
        });
      } else {
        checks.push({
          label: "Emails (Resend)",
          ok: match?.status === "verified",
          detail: match
            ? `Domaine ${match.name} : ${match.status === "verified" ? "vérifié" : `pas encore vérifié (${match.status})`}`
            : `Le domaine de EMAIL_FROM (${fromDomain || "?"}) n'est pas dans Resend. Domaines : ${domains.map((d) => `${d.name} (${d.status})`).join(", ") || "aucun"}`,
        });
      }
    } catch (err) {
      checks.push({ label: "Emails (Resend)", ok: false, detail: msg(err) });
    }
  }

  return html(checks, base);
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function html(checks: Check[], base: string) {
  const allOk = checks.every((c) => c.ok !== false);
  const rows = checks
    .map(
      (c) =>
        `<li><span>${c.ok === true ? "✅" : c.ok === "warn" ? "⚠️" : "❌"}</span><div><strong>${esc(c.label)}</strong>${
          c.detail ? `<br><small>${esc(c.detail)}</small>` : ""
        }</div></li>`,
    )
    .join("");
  const body = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Installation ${SITE.name}</title>
<style>body{margin:0;background:#fffbef;color:#1b1a17;font-family:system-ui,-apple-system,sans-serif;padding:24px 16px}main{max-width:560px;margin:auto}h1{font-size:28px;margin:0 0 8px}ul{list-style:none;padding:0}li{display:flex;gap:12px;background:#fff;border:2px solid #1b1a17;border-radius:16px;padding:12px 14px;margin:10px 0}small{color:#5c584f;word-break:break-word}.ok{background:#ffd43b;border:2px solid #1b1a17;border-radius:16px;padding:14px}a{color:#1b1a17}</style></head>
<body><main><h1>Installation ${SITE.name}</h1>
${allOk ? `<p class="ok"><strong>Tout est prêt 🎉</strong><br>Fais un paiement test sur <a href="${esc(base)}">${esc(base)}</a> avec la carte 4242 4242 4242 4242.</p>` : "<p>Corrige les lignes ❌ puis recharge cette page.</p>"}
<ul>${rows}</ul></main></body></html>`;
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
