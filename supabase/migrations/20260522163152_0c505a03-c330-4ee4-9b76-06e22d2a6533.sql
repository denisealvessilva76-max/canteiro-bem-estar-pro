
-- profiles new fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS empreiteira text,
  ADD COLUMN IF NOT EXISTS contrato text;

-- pilulas_dia
CREATE TABLE IF NOT EXISTS public.pilulas_dia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  media_url text,
  tipo text NOT NULL DEFAULT 'texto', -- texto | audio | video
  categoria text,
  data_publicacao date NOT NULL DEFAULT CURRENT_DATE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pilulas_dia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pilulas read auth" ON public.pilulas_dia FOR SELECT TO authenticated USING (true);
CREATE POLICY "pilulas admin all" ON public.pilulas_dia FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.pilulas_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pilula_id uuid NOT NULL REFERENCES public.pilulas_dia(id) ON DELETE CASCADE,
  visto_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, pilula_id)
);
ALTER TABLE public.pilulas_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pilulas_views own select" ON public.pilulas_views FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "pilulas_views own insert" ON public.pilulas_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- quiz_obra
CREATE TABLE IF NOT EXISTS public.quiz_obra_perguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta text NOT NULL,
  opcoes jsonb NOT NULL,
  correta int NOT NULL,
  categoria text NOT NULL DEFAULT 'epi', -- epi | ergonomia | primeiros_socorros
  semana date NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_obra_perguntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_q read auth" ON public.quiz_obra_perguntas FOR SELECT TO authenticated USING (true);
CREATE POLICY "quiz_q admin" ON public.quiz_obra_perguntas FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.quiz_obra_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pergunta_id uuid NOT NULL REFERENCES public.quiz_obra_perguntas(id) ON DELETE CASCADE,
  resposta int NOT NULL,
  acertou boolean NOT NULL,
  respondido_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, pergunta_id)
);
ALTER TABLE public.quiz_obra_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_r own select" ON public.quiz_obra_respostas FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "quiz_r own insert" ON public.quiz_obra_respostas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- estresse_logs
CREATE TABLE IF NOT EXISTS public.estresse_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nivel int NOT NULL CHECK (nivel BETWEEN 1 AND 5),
  semana date NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, semana)
);
ALTER TABLE public.estresse_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estresse own select" ON public.estresse_logs FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "estresse own insert" ON public.estresse_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "estresse own update" ON public.estresse_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- hidratacao QR
CREATE TABLE IF NOT EXISTS public.hidratacao_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  localizacao text NOT NULL,
  ml_padrao int NOT NULL DEFAULT 250,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hidratacao_qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qr read auth" ON public.hidratacao_qr_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "qr admin" ON public.hidratacao_qr_codes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- elogios
CREATE TABLE IF NOT EXISTS public.elogios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  de_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  para_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mensagem text NOT NULL CHECK (length(mensagem) BETWEEN 1 AND 500),
  anonimo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.elogios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "elogios recebidos" ON public.elogios FOR SELECT TO authenticated USING (auth.uid() = para_user_id OR auth.uid() = de_user_id OR public.is_admin());
CREATE POLICY "elogios criar" ON public.elogios FOR INSERT TO authenticated WITH CHECK (auth.uid() = de_user_id AND de_user_id <> para_user_id);

-- alertas_vermelhos
CREATE TABLE IF NOT EXISTS public.alertas_vermelhos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text NOT NULL DEFAULT 'emergencia', -- emergencia | clima | evacuacao
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz
);
ALTER TABLE public.alertas_vermelhos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alertaverm read auth" ON public.alertas_vermelhos FOR SELECT TO authenticated USING (true);
CREATE POLICY "alertaverm admin" ON public.alertas_vermelhos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- índices úteis
CREATE INDEX IF NOT EXISTS idx_hidr_logs_data ON public.hidratacao_logs(data);
CREATE INDEX IF NOT EXISTS idx_hidr_logs_created ON public.hidratacao_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_checkin_created ON public.checkin_diario(created_at);
