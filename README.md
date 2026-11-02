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
| Le prompt et le ton du coach IA | `content/coach-prompt.ts` |
| Les textes et horaires des notifications | `content/notifications.ts` |
| Les pages légales | `content/legal/*.md` (les `[À COMPLÉTER]` sont surlignés en jaune sur le site) |
| Les vrais témoignages | `content/testimonials.ts` + `FEATURES.testimonials` dans `config/site.ts` |
| Les couleurs / la typo | `app/globals.css` |

---

## Mise en ligne (paiement en mode TEST)

1. **Supabase → SQL Editor** : colle et lance, dans l'ordre, `supabase/migrations/0001_init.sql`, `0002_app.sql`, `0003_settings.sql`.
2. **Vercel → Add New → Project** → importe le repo `tejtapuff` → **Environment Variables** : colle le bloc de `.env.example` rempli (Vercel découpe tout seul) → **Deploy**.
   `NEXT_PUBLIC_SITE_URL` et `STRIPE_WEBHOOK_SECRET` sont facultatives.
3. Ouvre **`https://TON-SITE/api/setup?cle=TON_CRON_SECRET`** : la page vérifie tout et configure Stripe toute seule
   (produit, prix, remise 1re semaine, **webhook**, **portail « mettre à jour ma carte »**). Relance-la autant de fois que tu veux.
4. Fais un paiement test (voir plus bas).

Plus tard :
- **Domaine** : Vercel → Settings → Domains → `tejtapuff.fr`, puis mets `NEXT_PUBLIC_SITE_URL=https://tejtapuff.fr`, redéploie et **relance `/api/setup`** (le webhook est recréé sur le nouveau domaine).
- **Emails** : vérifie ton domaine dans Resend (enregistrements DNS) et mets `EMAIL_FROM="TejTaPuff <bonjour@tejtapuff.fr>"`. Avec `onboarding@resend.dev`, Resend n'envoie qu'à l'adresse de ton propre compte.
- **Vercel Pro** avant de vendre pour de vrai (le plan gratuit interdit l'usage commercial).
- **Passage en live** : remplace `STRIPE_SECRET_KEY` par la clé `sk_live_…`, redéploie, relance `/api/setup`.

---

## Étape 2 : l'app

La tâche quotidienne (rappel au moins 48 h avant le 1er prélèvement, email de bienvenue de secours) est déclarée dans `vercel.json` et protégée par `CRON_SECRET`.

### Tester l'étape 2
- **Programme** : connecte-toi → « J'ai tej ma dernière puff » → le compteur et les € démarrent. Fais la mission 1, un SOS (« C'est passé »), puis « J'ai craqué » : le compteur repart, les envies et missions restent.
- **Résiliation (3 clics)** : Compte → Résilier mon abonnement → Confirmer. Vérifie dans Stripe que l'abonnement est « annulé à la fin de la période » et que l'email de confirmation arrive.
- **Rappel avant prélèvement** : dans Supabase, table `subscriptions`, mets `first_renewal_at` de ton abonnement de test à « maintenant + 2 jours et demi », puis lance la tâche à la main :
  `curl -H "Authorization: Bearer TON_CRON_SECRET" https://TON-SITE/api/cron/daily` → l'email de rappel arrive (une seule fois).
- **Suppression** : Compte → Supprimer mon compte et mes données → vérifie que les lignes ont disparu dans Supabase et que le client a disparu dans Stripe.
- **Installation** : depuis Safari (iPhone) ou Chrome (Android), Compte → Installer l'app.

---

## Étape 3 : coach IA, notifications, carte story, emails

### À faire une fois
1. **Supabase → SQL Editor** : colle et lance `supabase/migrations/0004_coach_notifications.sql` (**avant** de déployer l'étape 3).
2. **Vercel → Environment Variables** : ajoute `ANTHROPIC_API_KEY` (console.anthropic.com → API Keys), puis Redeploy.
3. **Supabase → SQL Editor** : ouvre `supabase/cron.sql`, remplace `<ADRESSE_DU_SITE>` et `<CRON_SECRET>`, puis lance-le. Supabase appellera le site toutes les heures (notifications, emails J7/J21, relances). Ça marche avec tous les plans Vercel.
4. Rouvre **`/api/setup?cle=…`** : elle crée les clés de notification et vérifie le coach et la tâche horaire.

### Ce qui tourne
- **Coach** (`/app/coach`) : `claude-haiku-5-5`, réponse affichée au fil de l'eau, 20 messages par jour et par personne (`config/site.ts` → `LIMITS`). Prompt et garde-fous dans `content/coach-prompt.ts`. Message automatique du coach après « J'ai craqué ». Si quelqu'un écrit des mots de détresse, une carte 3114 / 112 s'affiche en plus de la réponse.
- **Notifications** (Compte → Notifications) : mission du matin à l'heure choisie, 2 petits mots maximum par jour aux moments à risque du quiz (`content/notifications.ts`), rappel avant le 1er prélèvement. Sans notifications sur le téléphone : la mission arrive par email (désactivable).
- **Carte à partager** (`/app/partager`) : image 1080×1920 générée avec les vraies données (jour sans puff, € économisés, envies battues).
- **Emails** : J7, J21 (avec la carte), relances du quiz non payé (2 maximum, seulement si la case a été cochée, lien de désinscription).

### Tester l'étape 3
- **Coach** : écris « j'ai une grosse envie », puis « j'ai craqué » via le bouton : un message du coach apparaît dans `/app/coach`.
- **Notifications** : sur iPhone, installe d'abord l'app sur l'écran d'accueil depuis Safari. Ensuite : Compte → Activer les notifications → Tester.
- **Notification du matin, emails J7 / J21** : dans Supabase, mets `morning_hour` (table `profiles`) à l'heure actuelle. Pour J7, recule `started_at` (table `quit_attempts`) de 6 jours. Puis lance la tâche à la main :
  `curl -H "Authorization: Bearer TON_CRON_SECRET" https://TON-SITE/api/cron/hourly`
- **Relance du quiz** : fais le quiz avec la case de rappel cochée sans payer. Une heure plus tard, la tâche horaire envoie le 1er rappel.
- **Carte** : `/app/partager` → Partager en story.

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
npm run test:rls    # sécurité de la base : Postgres jetable + vérification RLS (61 contrôles)
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
