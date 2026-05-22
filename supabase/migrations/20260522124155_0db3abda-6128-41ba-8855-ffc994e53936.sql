
ALTER TABLE public.desafio_checkins ADD COLUMN IF NOT EXISTS motivo_recusa text;

CREATE TABLE IF NOT EXISTS public.jogo_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  categoria text NOT NULL,
  jogo text NOT NULL,
  pontos integer NOT NULL DEFAULT 0,
  acertos integer,
  total integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jogo_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select jogo_scores" ON public.jogo_scores FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "own insert jogo_scores" ON public.jogo_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin update jogo_scores" ON public.jogo_scores FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin delete jogo_scores" ON public.jogo_scores FOR DELETE TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_jogo_scores_user_data ON public.jogo_scores(user_id, created_at DESC);

INSERT INTO public.conquistas (codigo, titulo, descricao, icone, pontos) VALUES
  ('odonto_quiz', 'Sorriso Sábio', 'Acertou o quiz de odontologia', '🧠', 10),
  ('mulher_quiz', 'Bem Informada', 'Acertou o quiz de saúde da mulher', '🌸', 10),
  ('mental_cardio', 'Coração Calmo', 'Completou o exercício de coerência cardíaca', '💗', 15)
ON CONFLICT (codigo) DO NOTHING;
