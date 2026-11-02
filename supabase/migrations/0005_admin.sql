-- TejTaPuff — étape 4 : statistiques pour l'admin
-- Visiteurs uniques par étape du parcours, au total, par vidéo (utm_content) et par navigateur.
-- Fonction réservée au serveur (clé secrète) : ni le navigateur ni un utilisateur connecté ne peuvent l'appeler.
create or replace function public.admin_funnel_stats(p_since timestamptz, p_until timestamptz)
returns table (dimension text, value text, step text, visitors bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when grouping(e.utm_content) = 0 then 'video'
      when grouping(e.browser) = 0 then 'browser'
      else 'total'
    end as dimension,
    case
      when grouping(e.utm_content) = 0 then coalesce(nullif(e.utm_content, ''), '(sans vidéo)')
      when grouping(e.browser) = 0 then coalesce(e.browser, 'other')
      else null
    end as value,
    e.type as step,
    count(distinct e.visitor_id) as visitors
  from public.funnel_events e
  where e.created_at >= p_since and e.created_at < p_until
  group by grouping sets ((e.type), (e.utm_content, e.type), (e.browser, e.type))
$$;
revoke execute on function public.admin_funnel_stats(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_funnel_stats(timestamptz, timestamptz) to service_role;
