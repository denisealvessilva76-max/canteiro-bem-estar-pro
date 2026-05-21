-- Reportes de bug
CREATE TABLE public.reportes_bug (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rota TEXT,
  descricao TEXT NOT NULL,
  screenshot_url TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvido_em TIMESTAMPTZ
);
ALTER TABLE public.reportes_bug ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own insert reportes_bug" ON public.reportes_bug FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own select reportes_bug" ON public.reportes_bug FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "admin manage reportes_bug" ON public.reportes_bug FOR UPDATE USING (is_admin());
CREATE POLICY "admin delete reportes_bug" ON public.reportes_bug FOR DELETE TO authenticated USING (is_admin());

-- Push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own all push_subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin select push_subscriptions" ON public.push_subscriptions FOR SELECT USING (is_admin());

-- Ciclo menstrual
CREATE TABLE public.ciclo_menstrual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  fluxo TEXT,
  sintomas TEXT[] DEFAULT ARRAY[]::TEXT[],
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ciclo_menstrual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own all ciclo_menstrual" ON public.ciclo_menstrual FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Clínicas e UBS
CREATE TABLE public.ubs_clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'ubs',
  endereco TEXT,
  telefone TEXT,
  cidade TEXT DEFAULT 'Canaã dos Carajás',
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ubs_clinicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all read ubs_clinicas" ON public.ubs_clinicas FOR SELECT USING (ativo OR is_admin());
CREATE POLICY "admin manage ubs_clinicas" ON public.ubs_clinicas FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Odonto logs
CREATE TABLE public.odonto_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  periodo TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, data, periodo)
);
ALTER TABLE public.odonto_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own all odonto_logs" ON public.odonto_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin select odonto_logs" ON public.odonto_logs FOR SELECT USING (is_admin());

-- Odonto dicas
CREATE TABLE public.odonto_dicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.odonto_dicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all read odonto_dicas" ON public.odonto_dicas FOR SELECT USING (ativo OR is_admin());
CREATE POLICY "admin manage odonto_dicas" ON public.odonto_dicas FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Seed básico de dicas odonto
INSERT INTO public.odonto_dicas (titulo, conteudo, ordem) VALUES
('Escove 3x ao dia', 'Após café da manhã, almoço e antes de dormir. Mínimo 2 minutos cada.', 1),
('Use fio dental', 'Pelo menos 1x ao dia, antes de escovar à noite.', 2),
('Sinais de alerta', 'Sangramento gengival frequente, dor ao mastigar ou mau hálito persistente — procure dentista.', 3),
('Hidratação ajuda', 'Beber água após refeições reduz placa bacteriana.', 4);
