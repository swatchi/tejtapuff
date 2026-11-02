-- TejTaPuff — étape 2 : progression dans l'app
-- Même règle : RLS partout, lecture de ses propres lignes, écritures par le serveur.

-- Chaque tentative d'arrêt. « J'ai craqué » ferme la tentative en cours et en ouvre une nouvelle :
-- le compteur repart, l'historique reste.
create table public.quit_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create index quit_attempts_user_idx on public.quit_attempts (user_id, started_at);
-- Une seule tentative en cours par personne
create unique index quit_attempts_one_open_idx on public.quit_attempts (user_id) where ended_at is null;

create table public.mission_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  mission_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);

-- Utilisations du bouton SOS
create table public.cravings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise text not null,
  outcome text not null check (outcome in ('overcome', 'relapse')),
  created_at timestamptz not null default now()
);
create index cravings_user_idx on public.cravings (user_id, created_at);

alter table public.quit_attempts       enable row level security;
alter table public.mission_completions enable row level security;
alter table public.cravings            enable row level security;

create policy "lecture de ses tentatives" on public.quit_attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "lecture de ses missions" on public.mission_completions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "lecture de ses envies" on public.cravings
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete, truncate on
  public.quit_attempts, public.mission_completions, public.cravings
from anon, authenticated;
