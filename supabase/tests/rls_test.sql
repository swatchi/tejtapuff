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
insert into public.quit_attempts (user_id) values
  ('11111111-1111-1111-1111-111111111111'), ('22222222-2222-2222-2222-222222222222');
insert into public.mission_completions (user_id, mission_id) values
  ('11111111-1111-1111-1111-111111111111', 'j1'), ('22222222-2222-2222-2222-222222222222', 'j1');
insert into public.cravings (user_id, exercise, outcome) values
  ('11111111-1111-1111-1111-111111111111', 'defi5', 'overcome'), ('22222222-2222-2222-2222-222222222222', 'defi5', 'overcome');
insert into public.stripe_events (id, type) values ('evt_1', 'x');
insert into public.app_settings (key, value) values ('stripe_webhook_secret', 'whsec_secret');
insert into public.coach_messages (user_id, role, content) values
  ('11111111-1111-1111-1111-111111111111', 'user', 'salut'), ('22222222-2222-2222-2222-222222222222', 'user', 'secret de B');
insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values
  ('11111111-1111-1111-1111-111111111111', 'https://push/a', 'k', 'a'), ('22222222-2222-2222-2222-222222222222', 'https://push/b', 'k', 'a');
insert into public.notification_log (user_id, kind, day_key, channel) values
  ('11111111-1111-1111-1111-111111111111', 'morning', '2026-11-02', 'push');
insert into public.email_log (user_id, kind) values ('11111111-1111-1111-1111-111111111111', 'login_code');

create temp table results (check_name text, ok boolean);
grant all on results to anon, authenticated;

create function pg_temp.sees_nothing(tbl text, r text) returns boolean language plpgsql as $$
declare n bigint;
begin
  execute format('set local role %I', r);
  execute 'set local request.jwt.claim.sub = ''11111111-1111-1111-1111-111111111111''';
  execute format('select count(*) from %s', tbl) into n;
  return n = 0;
exception when insufficient_privilege then
  return true;
end $$;

-- ── Utilisateur A connecté ──
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into results select 'A voit 1 profil (le sien)', (select count(*) = 1 and bool_and(email = 'a@test.fr') from public.profiles);
insert into results select 'A voit 1 quiz', (select count(*) = 1 from public.quiz_answers);
insert into results select 'A voit 1 abonnement', (select count(*) = 1 and bool_and(id = 'sub_a') from public.subscriptions);
insert into results select 'A voit 1 paiement', (select count(*) = 1 from public.payments);
insert into results select 'A voit 1 consentement', (select count(*) = 1 from public.consents);
insert into results select 'A voit 1 tentative', (select count(*) = 1 from public.quit_attempts);
insert into results select 'A voit 1 mission faite', (select count(*) = 1 from public.mission_completions);
insert into results select 'A voit 1 envie', (select count(*) = 1 from public.cravings);
insert into results select 'A voit 1 message coach (le sien)', (select count(*) = 1 and bool_and(content = 'salut') from public.coach_messages);
insert into results select 'A voit 1 appareil', (select count(*) = 1 from public.push_subscriptions);
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
insert into results select 'anon ne voit aucune tentative', (select count(*) = 0 from public.quit_attempts);
reset role;

insert into results select 'A ne voit pas le journal des notifications', pg_temp.sees_nothing('public.notification_log', 'authenticated');
insert into results select 'anon ne voit aucun message coach', pg_temp.sees_nothing('public.coach_messages', 'anon');
insert into results select 'A ne voit pas les réglages (secret webhook)', pg_temp.sees_nothing('public.app_settings', 'authenticated');
insert into results select 'anon ne voit pas les réglages', pg_temp.sees_nothing('public.app_settings', 'anon');
insert into results select 'contrôle : le serveur voit les réglages', not pg_temp.sees_nothing('public.app_settings', 'service_role');

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
insert into results select 'A ne peut pas valider une mission lui-même', pg_temp.write_denied($$insert into public.mission_completions (user_id, mission_id) values ('11111111-1111-1111-1111-111111111111', 'j2')$$, 'authenticated');
insert into results select 'A ne peut pas trafiquer son compteur', pg_temp.write_denied($$update public.quit_attempts set started_at = now() - interval '1 year'$$, 'authenticated');
insert into results select 'A ne peut pas écrire au nom du coach', pg_temp.write_denied($$insert into public.coach_messages (user_id, role, content) values ('11111111-1111-1111-1111-111111111111', 'assistant', 'x')$$, 'authenticated');
insert into results select 'A ne peut pas modifier ses préférences directement', pg_temp.write_denied($$update public.profiles set notify_morning = false$$, 'authenticated');
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
insert into results select 'suppression : tentatives A effacées', (select count(*) = 1 from public.quit_attempts);
insert into results select 'suppression : missions A effacées', (select count(*) = 1 from public.mission_completions);
insert into results select 'suppression : envies A effacées', (select count(*) = 1 from public.cravings);
insert into results select 'suppression : messages coach A effacés', (select count(*) = 1 from public.coach_messages);
insert into results select 'suppression : appareils A effacés', (select count(*) = 1 from public.push_subscriptions);
insert into results select 'suppression : abonnement A détaché', (select user_id is null from public.subscriptions where id = 'sub_a');
insert into results select 'suppression : paiement A anonymisé', (select user_id is null from public.payments where id = 'in_a');

select case when ok then '✅' else '❌' end as " ", check_name as "vérification" from results order by ok, check_name;
do $$ begin
  if exists (select 1 from results where not ok) then raise exception 'Des vérifications RLS ont échoué'; end if;
end $$;
