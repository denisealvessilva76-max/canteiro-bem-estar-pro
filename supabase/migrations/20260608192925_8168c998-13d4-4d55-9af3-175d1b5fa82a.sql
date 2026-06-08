
CREATE OR REPLACE FUNCTION public.ranking_squads_por_capita()
RETURNS TABLE (squad_id UUID, nome TEXT, cor TEXT, integrantes INT, media_pontos NUMERIC, total_pontos BIGINT)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT s.id, s.nome, s.cor,
         COUNT(p.id)::INT AS integrantes,
         COALESCE(ROUND(AVG(p.pontos_acumulados)::NUMERIC, 1), 0) AS media_pontos,
         COALESCE(SUM(p.pontos_acumulados), 0) AS total_pontos
  FROM public.squads s
  LEFT JOIN public.profiles p ON p.squad_id = s.id
  GROUP BY s.id, s.nome, s.cor
  ORDER BY media_pontos DESC, integrantes DESC;
$$;
REVOKE ALL ON FUNCTION public.ranking_squads_por_capita() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ranking_squads_por_capita() TO authenticated;
