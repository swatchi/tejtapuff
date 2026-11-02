-- ═══════════════════════════════════════════════════════════════
-- TejTaPuff — tâche horaire (notifications, emails J7/J21, relances)
--
-- Supabase appelle le site toutes les heures. Marche avec tous les plans Vercel.
-- AVANT DE LANCER : remplace les 2 valeurs entre < > ci-dessous.
--   <ADRESSE_DU_SITE> : ex. https://tejtapuff.vercel.app (sans / à la fin)
--   <CRON_SECRET>     : la même valeur que la variable CRON_SECRET sur Vercel
-- Puis : Supabase → SQL Editor → coller → Run. À ne lancer qu'une fois.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Si une ancienne version existe, on la remplace.
select cron.unschedule(jobid) from cron.job where jobname = 'tejtapuff-hourly';

select cron.schedule(
  'tejtapuff-hourly',
  '3 * * * *', -- toutes les heures, à la minute 3
  $$
  select net.http_get(
    url := '<ADRESSE_DU_SITE>/api/cron/hourly',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>'),
    timeout_milliseconds := 60000
  );
  $$
);

-- Vérification : la tâche doit apparaître ici
select jobname, schedule, active from cron.job where jobname = 'tejtapuff-hourly';
