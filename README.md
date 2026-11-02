# TejTaPuff

Web app par abonnement pour arrêter la puff en 21 jours. Éditeur : Nombre One SAS.

**Stack** : Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase (Postgres + Auth, RLS partout) · Stripe (abonnement) · Resend (emails) · Vercel (région Paris).

---

## Où modifier quoi

| Je veux changer… | Fichier |
|---|---|
| Les prix | `config/pricing.ts` (une ligne → change partout, y compris dans Stripe) |
| Les textes de la landing | `content/landing.ts` |
| La FAQ | `content/faq.ts` |
| Les questions du quiz | `content/quiz.ts` (ne change pas les `id`, seulement les `label`) |
| L'écran « Ton plan 21 jours » | `content/plan.ts` |
| Les cases à cocher (consentements) | `content/consents.ts` (change la `version` si tu modifies un texte) |
| Les emails | `content/emails.ts` |
| Les 21 missions + 8 missions de consolidation | `content/missions.ts` |
| Les exercices SOS et l'écran « J'ai craqué » | `content/sos.ts` |
| Les pages légales | `content/legal/*.md` (les `[À COMPLÉTER]` sont surlignés en jaune sur le site) |
| Les vrais témoignages | `content/testimonials.ts` + `FEATURES.testimonials` dans `config/site.ts` |
| Les couleurs / la typo | `app/globals.css` |

---

## Mise en ligne (étape 1, paiement en mode TEST)

### 1. Supabase (base de données + connexion)
1. Crée un projet sur [supabase.com](https://supabase.com), **région Europe (Paris `eu-west-3`)**.
2. **SQL Editor** → colle le contenu de `supabase/migrations/0001_init.sql` → Run.
3. **Project Settings → API** : récupère l'URL, la clé *publishable* et la clé *secret*.
4. **Authentication → Providers → Email** : laisse « Email » activé. (Les codes de connexion sont envoyés par l'app via Resend, pas besoin de configurer le SMTP Supabase.)

### 2. Stripe (paiement)
1. Sur [dashboard.stripe.com](https://dashboard.stripe.com), active le **mode test** (interrupteur en haut).
2. **Developers → API keys** : copie la clé secrète `sk_test_…`.
3. Le produit, le prix hebdo et la remise 1re semaine sont **créés automatiquement** au premier paiement, à partir de `config/pricing.ts`.
4. Après le 1er déploiement Vercel : **Developers → Webhooks → Add endpoint**
   - URL : `https://TON-DOMAINE/api/webhooks/stripe`
   - Événements : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`
   - Copie le *Signing secret* `whsec_…` → `STRIPE_WEBHOOK_SECRET`.
5. **Settings → Business → Public details** : nom « TejTaPuff », email de support, lien vers les CGV (`/legal/cgv`).
6. **Settings → Billing → Revenue recovery** : active les relances automatiques (Smart Retries) et choisis « annuler l'abonnement » si toutes les tentatives échouent.
7. **Settings → Emails** : active les reçus de paiement.

### 3. Resend (emails)
1. Crée un compte sur [resend.com](https://resend.com), ajoute le domaine `tejtapuff.fr`, ajoute les enregistrements DNS demandés chez ton registrar.
2. Crée une clé API → `RESEND_API_KEY`.

### 4. Vercel (hébergement)
1. **Plan Pro obligatoire** : le plan gratuit interdit l'usage commercial (et les tâches planifiées horaires de l'étape 2 en ont besoin).
2. **Add New → Project** → importe le repo GitHub `tejtapuff`.
3. **Settings → Environment Variables** : ajoute toutes les variables de `.env.example`.
4. **Settings → Domains** : ajoute `tejtapuff.fr`.

---

## Étape 2 : l'app (à faire en plus de l'étape 1)

1. **Supabase → SQL Editor** : colle `supabase/migrations/0002_app.sql` → Run.
2. **Vercel → Environment Variables** : ajoute `CRON_SECRET` (une longue chaîne aléatoire, ex. `openssl rand -hex 32`). La tâche horaire (rappel 48 h, email de bienvenue de secours) est déclarée dans `vercel.json`.
3. **Stripe → Settings → Billing → Customer portal** : active « mettre à jour le moyen de paiement » puis **Save** (en mode test aussi). C'est ce qu'ouvre le bouton « Mettre à jour ma carte ».

### Tester l'étape 2
- **Programme** : connecte-toi → « J'ai tej ma dernière puff » → le compteur et les € démarrent. Fais la mission 1, un SOS (« C'est passé »), puis « J'ai craqué » : le compteur repart, les envies et missions restent.
- **Résiliation (3 clics)** : Compte → Résilier mon abonnement → Confirmer. Vérifie dans Stripe que l'abonnement est « annulé à la fin de la période » et que l'email de confirmation arrive.
- **Rappel 48 h** : dans Supabase, table `subscriptions`, mets `first_renewal_at` de ton abonnement de test à « maintenant + 24 h », puis lance la tâche à la main :
  `curl -H "Authorization: Bearer TON_CRON_SECRET" https://TON-DOMAINE/api/cron/hourly` → l'email de rappel arrive (une seule fois).
- **Suppression** : Compte → Supprimer mon compte et mes données → vérifie que les lignes ont disparu dans Supabase et que le client a disparu dans Stripe.
- **Installation** : depuis Safari (iPhone) ou Chrome (Android), Compte → Installer l'app.

---

## Tester le paiement (mode test Stripe)

| Carte | Résultat |
|---|---|
| `4242 4242 4242 4242` | Paiement accepté |
| `4000 0025 0000 3155` | Demande la validation 3-D Secure |
| `4000 0000 0000 0002` | Carte refusée |

Date d'expiration : n'importe quelle date future. CVC : n'importe quels 3 chiffres.

**Parcours à faire sur ton téléphone**, depuis un lien mis en bio TikTok **et** Instagram, avec `?utm_source=tiktok&utm_content=test1` à la fin du lien :
1. Calculateur → quiz → plan → email + cases → paiement avec `4242…`
2. Retour sur « C'est validé » → code reçu par email → app.
3. Vérifie dans Supabase (**Table editor**) : `profiles`, `subscriptions` (avec `utm_content = test1`), `payments` (4,99 €), `consents`.
4. Dans Stripe : l'abonnement montre 14,99 €/semaine avec la remise sur la 1re facture uniquement.

---

## Développement

```bash
npm install
cp .env.example .env.local   # puis remplis les clés de test
npm run dev                  # http://localhost:3000
```

Sans `RESEND_API_KEY` en local, les emails (dont le code de connexion) s'affichent dans le terminal.

```bash
npm run typecheck   # types
npm run lint        # lint
npm run test:unit   # calculs du programme (jour X/21, compteur, économies, missions)
npm run test:rls    # sécurité de la base : Postgres jetable + vérification RLS (46 contrôles)
npm run test:e2e    # parcours landing → quiz → paywall sur écran mobile
```

Pour recevoir les webhooks Stripe en local : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

---

## Principes

- **Aucun chiffre inventé** : tout ce qui est affiché vient de la base ou du calcul fait avec les réponses de l'utilisateur. Les témoignages restent masqués tant qu'il n'y en a pas de vrais.
- **Pas de promesse médicale** : « TejTaPuff est un programme d'accompagnement, pas un traitement médical. »
- **RLS sur toutes les tables** : le navigateur ne peut lire que les lignes de l'utilisateur connecté et ne peut rien écrire ; tout passe par le serveur.
- **Pixels TikTok/Meta** chargés uniquement après « Accepter » sur la bannière cookies.
- **Stripe est la source de vérité** des paiements ; Supabase en garde un miroir via le webhook.
