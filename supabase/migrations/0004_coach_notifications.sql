-- TejTaPuff — étape 3 : coach IA, notifications, préférences
-- Même règle : RLS partout, lecture de ses propres lignes, écritures par le serveur.

-- ─────────────────────────────────────────────────────────────
-- Messages du coach
-- ─────────────────────────────────────────────────────────────
create table public.coach_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 8000),
  -- chat : conversation normale ; relapse : message envoyé après « J'ai craqué »
  kind text not null default 'chat' check (kind in ('chat', 'relapse')),
  created_at timestamptz not null default now()
);
create index coach_messages_user_idx on public.coach_messages (user_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- Abonnements aux notifications (Web Push)
-- ─────────────────────────────────────────────────────────────
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device text,
  failures integer not null default 0,
  last_success_at timestamptz,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ─────────────────────────────────────────────────────────────
-- Journal des notifications (évite les doublons : 1 par type et par jour)
-- ─────────────────────────────────────────────────────────────
create table public.notification_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,      -- morning, risk:soiree, reminder, j7…
  day_key text not null,   -- AAAA-MM-JJ dans le fuseau de la personne
  channel text not null,   -- push / email
  created_at timestamptz not null default now(),
  unique (user_id, kind, day_key)
);

-- ─────────────────────────────────────────────────────────────
-- Conso saisie par mois (le quiz demande désormais « combien par mois »)
-- ─────────────────────────────────────────────────────────────
alter table public.profiles add column units_per_month numeric(7, 2);

-- ─────────────────────────────────────────────────────────────
-- Préférences de notification (modifiables dans Compte)
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column notify_morning boolean not null default true,  -- mission du jour, le matin
  add column notify_risk boolean not null default true,     -- moments à risque du quiz
  add column notify_email boolean not null default true,    -- email du matin si pas de notifications sur le téléphone
  add column morning_hour smallint not null default 9 check (morning_hour between 5 and 12);

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table public.coach_messages     enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_log   enable row level security;

create policy "lecture de ses messages coach" on public.coach_messages
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "lecture de ses appareils" on public.push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete, truncate on
  public.coach_messages, public.push_subscriptions, public.notification_log
from anon, authenticated;
revoke select on public.notification_log from anon, authenticated;
