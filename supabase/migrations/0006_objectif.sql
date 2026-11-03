-- Étape 5 : l'objectif d'achat (ce que la personne s'offre avec l'argent gardé).
-- À lancer dans Supabase → SQL Editor. Sans cette migration, la carte « Ton objectif » reste masquée.
alter table public.profiles add column if not exists goal_label text;
alter table public.profiles add column if not exists goal_cents integer;
alter table public.profiles drop constraint if exists profiles_goal_cents_check;
alter table public.profiles add constraint profiles_goal_cents_check check (goal_cents is null or (goal_cents between 100 and 1000000));
alter table public.profiles drop constraint if exists profiles_goal_label_check;
alter table public.profiles add constraint profiles_goal_label_check check (goal_label is null or char_length(goal_label) <= 60);
