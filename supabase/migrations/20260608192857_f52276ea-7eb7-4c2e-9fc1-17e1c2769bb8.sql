
-- 1) Matrículas autorizadas (pré-cadastro)
CREATE TABLE public.matriculas_autorizadas (
  matricula TEXT PRIMARY KEY,
  nome TEXT,
  turno public.turno DEFAULT 'diurno',
  cargo TEXT,
  telefone TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por UUID
);
GRANT SELECT ON public.matriculas_autorizadas TO anon, authenticated;
GRANT ALL ON public.matriculas_autorizadas TO service_role;
ALTER TABLE public.matriculas_autorizadas ENABLE ROW LEVEL SECURITY;
-- Leitura: necessária para a tela de cadastro consultar (validar matrícula). Não expõe PII sensível.
CREATE POLICY "matriculas leitura pública" ON public.matriculas_autorizadas FOR SELECT USING (true);
CREATE POLICY "matriculas admin manage" ON public.matriculas_autorizadas FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2) Squads (equipes)
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  cor TEXT NOT NULL DEFAULT '#3B82F6',
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.squads TO authenticated;
GRANT ALL ON public.squads TO service_role;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "squads visiveis logados" ON public.squads FOR SELECT TO authenticated USING (true);
CREATE POLICY "squads admin manage" ON public.squads FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3) Vincular profiles a uma squad
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES public.squads(id) ON DELETE SET NULL;

-- 4) Mural dos Campeões: aplausos em fotos de desafio
CREATE TABLE public.mural_aplausos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  desafio_checkin_id UUID NOT NULL REFERENCES public.desafio_checkins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (desafio_checkin_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.mural_aplausos TO authenticated;
GRANT ALL ON public.mural_aplausos TO service_role;
ALTER TABLE public.mural_aplausos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aplausos visiveis logados" ON public.mural_aplausos FOR SELECT TO authenticated USING (true);
CREATE POLICY "aplausos insert proprio" ON public.mural_aplausos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "aplausos delete proprio" ON public.mural_aplausos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5) Ranking de squads (média de pontos por integrante)
CREATE OR REPLACE FUNCTION public.ranking_squads_por_capita()
RETURNS TABLE (squad_id UUID, nome TEXT, cor TEXT, integrantes INT, media_pontos NUMERIC, total_pontos BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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
