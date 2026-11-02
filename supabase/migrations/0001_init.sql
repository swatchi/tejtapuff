-- TejTaPuff — schéma initial (étape 1)
-- Règle : RLS activée sur TOUTES les tables. Les écritures passent par le
-- serveur (clé secrète Supabase), le navigateur ne peut que lire SES lignes.

-- ─────────────────────────────────────────────────────────────
-- Utilitaire : updated_at automatique
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Parcours de vente (anonyme, aucune donnée personnelle)
-- ─────────────────────────────────────────────────────────────
create table public.funnel_events (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  type text not null check (type in (
    'visit', 'calc_used', 'quiz_start', 'quiz_done', 'paywall_view', 'checkout_start', 'paid'
  )),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  browser text,  -- tiktok / instagram / facebook / other
  device text,   -- ios / android / desktop
  created_at timestamptz not null default now()
);
create index funnel_events_type_created_idx on public.funnel_events (type, created_at);
create index funnel_events_utm_content_idx on public.funnel_events (utm_content);
create index funnel_events_visitor_idx on public.funnel_events (visitor_id);

-- ─────────────────────────────────────────────────────────────
-- Réponses du quiz (données sensibles : consentement explicite obligatoire)
-- ─────────────────────────────────────────────────────────────
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid,
  user_id uuid references auth.users (id) on delete cascade,
  answers jsonb not null,
  consent_version text not null,
  consent_at timestamptz not null default now(),
  email text,
  followup_consent_at timestamptz,
  utm_content text,
  created_at timestamptz not null default now()
);
create index quiz_answers_user_idx on public.quiz_answers (user_id);

-- ─────────────────────────────────────────────────────────────
-- Profil (1 ligne par compte)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  stripe_customer_id text unique,
  quiz_id uuid references public.quiz_answers (id) on delete set null,
  vape_unit text,
  units_per_week numeric(6, 2),
  unit_price_cents integer,
  vaping_since text,
  triggers text[] not null default '{}',
  reasons text[] not null default '{}',
  start_date date,
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Abonnements Stripe (miroir, la source de vérité reste Stripe)
-- ─────────────────────────────────────────────────────────────
create table public.subscriptions (
  id text primary key, -- id d'abonnement Stripe (sub_…)
  user_id uuid references auth.users (id) on delete set null,
  stripe_customer_id text,
  status text not null, -- active / past_due / canceled / unpaid / incomplete…
  price_cents integer,
  current_period_end timestamptz,
  first_renewal_at timestamptz, -- date du 1er prélèvement au prix plein
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  utm_source text,
  utm_campaign text,
  utm_content text, -- = id de la vidéo qui a vendu
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_utm_content_idx on public.subscriptions (utm_content);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Paiements (1 ligne par facture Stripe)
-- user_id passe à null si le compte est supprimé : le chiffre d'affaires reste juste.
-- ─────────────────────────────────────────────────────────────
create table public.payments (
  id text primary key, -- id de facture Stripe (in_…)
  user_id uuid references auth.users (id) on delete set null,
  subscription_id text,
  amount_cents integer not null,
  currency text not null default 'eur',
  status text not null, -- paid / failed / open / void
  billing_reason text,  -- subscription_create (1re semaine) / subscription_cycle (renouvellement)
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_user_idx on public.payments (user_id);
create index payments_paid_at_idx on public.payments (paid_at);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Consentements (texte exact + version + date = preuve)
-- ─────────────────────────────────────────────────────────────
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  quiz_id uuid references public.quiz_answers (id) on delete cascade,
  email text,
  kind text not null check (kind in ('sensitive_data', 'age_18', 'immediate_start', 'followup_emails')),
  version text not null,
  text text not null,
  created_at timestamptz not null default now()
);
create index consents_user_idx on public.consents (user_id);
create index consents_quiz_idx on public.consents (quiz_id);

-- ─────────────────────────────────────────────────────────────
-- Technique : webhooks Stripe déjà traités, journal des emails
-- ─────────────────────────────────────────────────────────────
create table public.stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

create table public.email_log (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  email text,
  kind text not null,
  ref text, -- ex. id d'abonnement pour le rappel 48 h : empêche les doublons
  created_at timestamptz not null default now()
);
create index email_log_email_kind_idx on public.email_log (email, kind, created_at);
create unique index email_log_once_idx on public.email_log (kind, ref) where ref is not null;

-- ─────────────────────────────────────────────────────────────
-- Retrouver un compte par email (serveur uniquement)
-- ─────────────────────────────────────────────────────────────
create or replace function public.user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1
$$;
revoke execute on function public.user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.user_id_by_email(text) to service_role;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table public.funnel_events  enable row level security;
alter table public.quiz_answers   enable row level security;
alter table public.profiles       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.payments       enable row level security;
alter table public.consents       enable row level security;
alter table public.stripe_events  enable row level security;
alter table public.email_log      enable row level security;

-- Chaque utilisateur connecté lit uniquement ses propres lignes.
create policy "lecture de son profil" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "lecture de ses réponses" on public.quiz_answers
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "lecture de son abonnement" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "lecture de ses paiements" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "lecture de ses consentements" on public.consents
  for select to authenticated using ((select auth.uid()) = user_id);

-- funnel_events, stripe_events, email_log : aucune policy = aucun accès
-- depuis le navigateur. Seul le serveur (clé secrète) y touche.

-- Défense en profondeur : le navigateur ne peut jamais écrire directement.
revoke insert, update, delete, truncate on
  public.funnel_events, public.quiz_answers, public.profiles, public.subscriptions,
  public.payments, public.consents, public.stripe_events, public.email_log
from anon, authenticated;
