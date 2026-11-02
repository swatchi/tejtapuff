-- TejTaPuff — réglages techniques enregistrés automatiquement par le site
-- (secret du webhook Stripe, configuration du portail de paiement…).
-- Accessible uniquement par le serveur : RLS activée, aucune policy.
create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
