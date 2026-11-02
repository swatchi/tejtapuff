-- Vérifie que chaque utilisateur ne voit QUE ses lignes, que anon ne voit rien,
-- et que personne ne peut écrire depuis le navigateur.
\set ON_ERROR_STOP on
set client_min_messages = warning;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.fr'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.fr');

insert into public.quiz_answers (id, user_id, answers, consent_version) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '{}', 'v'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '{}', 'v');
insert into public.profiles (user_id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.fr'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.fr');
insert into public.subscriptions (id, user_id, status) values
  ('sub_a', '11111111-1111-1111-1111-111111111111', 'active'),
  ('sub_b', '22222222-2222-2222-2222-222222222222', 'active');
insert into public.payments (id, user_id, amount_cents, status) values
  ('in_a', '11111111-1111-1111-1111-111111111111', 499, 'paid'),
  ('in_b', '22222222-2222-2222-2222-222222222222', 499, 'paid');
insert into public.consents (user_id, kind, version, text) values
  ('11111111-1111-1111-1111-111111111111', 'age_18', 'v', 't'),
  ('22222222-2222-2222-2222-222222222222', 'age_18', 'v', 't');
insert into public.funnel_events (visitor_id, type) values (gen_random_uuid(), 'visit');
insert into public.stripe_events (id, type) values ('evt_1', 'x');
insert into public.email_log (user_id, kind) values ('11111111-1111-1111-1111-111111111111', 'login_code');

create temp table results (check_name text, ok boolean);
grant all on results to anon, authenticated;

-- ── Utilisateur A connecté ──
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into results select 'A voit 1 profil (le sien)', (select count(*) = 1 and bool_and(email = 'a@test.fr') from public.profiles);
insert into results select 'A voit 1 quiz', (select count(*) = 1 from public.quiz_answers);
insert into results select 'A voit 1 abonnement', (select count(*) = 1 and bool_and(id = 'sub_a') from public.subscriptions);
insert into results select 'A voit 1 paiement', (select count(*) = 1 from public.payments);
insert into results select 'A voit 1 consentement', (select count(*) = 1 from public.consents);
insert into results select 'A ne voit pas funnel_events', (select count(*) = 0 from public.funnel_events);
insert into results select 'A ne voit pas stripe_events', (select count(*) = 0 from public.stripe_events);
insert into results select 'A ne voit pas email_log', (select count(*) = 0 from public.email_log);
reset role;

-- ── Visiteur non connecté ──
set role anon;
reset request.jwt.claim.sub;
insert into results select 'anon ne voit aucun profil', (select count(*) = 0 from public.profiles);
insert into results select 'anon ne voit aucun quiz', (select count(*) = 0 from public.quiz_answers);
insert into results select 'anon ne voit aucun abonnement', (select count(*) = 0 from public.subscriptions);
insert into results select 'anon ne voit aucun paiement', (select count(*) = 0 from public.payments);
reset role;

-- ── Écritures interdites depuis le navigateur ──
create function pg_temp.write_denied(sql text, r text) returns boolean language plpgsql as $$
begin
  execute format('set local role %I', r);
  execute 'set local request.jwt.claim.sub = ''11111111-1111-1111-1111-111111111111''';
  execute sql;
  return false;
exception when insufficient_privilege then
  return true;
end $$;

insert into results select 'A ne peut pas modifier son abonnement', pg_temp.write_denied($$update public.subscriptions set status = 'active'$$, 'authenticated');
insert into results select 'A ne peut pas créer de paiement', pg_temp.write_denied($$insert into public.payments (id, amount_cents, status) values ('in_x', 0, 'paid')$$, 'authenticated');
insert into results select 'A ne peut pas modifier son profil', pg_temp.write_denied($$update public.profiles set email = 'x@x.fr'$$, 'authenticated');
insert into results select 'anon ne peut pas écrire dans funnel_events', pg_temp.write_denied($$insert into public.funnel_events (visitor_id, type) values (gen_random_uuid(), 'visit')$$, 'anon');
insert into results select 'anon ne peut pas créer de quiz', pg_temp.write_denied($$insert into public.quiz_answers (answers, consent_version) values ('{}', 'v')$$, 'anon');

create function pg_temp.exec_denied(r text) returns boolean language plpgsql as $$
begin
  execute format('set local role %I', r);
  perform public.user_id_by_email('b@test.fr');
  return false;
exception when insufficient_privilege then
  return true;
end $$;
insert into results select 'anon ne peut pas chercher un compte par email', pg_temp.exec_denied('anon');
insert into results select 'A ne peut pas chercher un compte par email', pg_temp.exec_denied('authenticated');
insert into results select 'contrôle : le serveur peut chercher un compte par email', not pg_temp.exec_denied('service_role');

-- Contrôle : le serveur (service_role) peut écrire, sinon le test ci-dessus ne prouverait rien.
insert into results select 'contrôle : le serveur peut écrire', not pg_temp.write_denied($$insert into public.stripe_events (id, type) values ('evt_ctrl', 'x')$$, 'service_role');

-- ── Toutes les tables public ont la RLS ──
insert into results
  select 'RLS activée sur ' || c.relname, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r';

-- ── Suppression de compte : tout part en cascade, le CA reste anonymisé ──
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
insert into results select 'suppression : profil A effacé', (select count(*) = 0 from public.profiles where email = 'a@test.fr');
insert into results select 'suppression : quiz A effacé', (select count(*) = 0 from public.quiz_answers where id = 'aaaaaaaa-0000-0000-0000-000000000001');
insert into results select 'suppression : consentements A effacés', (select count(*) = 1 from public.consents);
insert into results select 'suppression : paiement A anonymisé', (select user_id is null from public.payments where id = 'in_a');

select case when ok then '✅' else '❌' end as " ", check_name as "vérification" from results order by ok, check_name;
do $$ begin
  if exists (select 1 from results where not ok) then raise exception 'Des vérifications RLS ont échoué'; end if;
end $$;
