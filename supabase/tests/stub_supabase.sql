-- Imite le strict nécessaire de Supabase pour tester le schéma en local
-- (rôles anon/authenticated/service_role, auth.users, auth.uid()).
-- NE PAS exécuter sur le vrai projet Supabase.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase donne par défaut tous les droits sur public aux 3 rôles : on reproduit ça.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
