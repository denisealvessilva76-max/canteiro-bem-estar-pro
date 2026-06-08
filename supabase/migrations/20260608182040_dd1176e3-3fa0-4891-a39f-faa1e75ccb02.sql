
CREATE TABLE public.push_diagnosticos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suporte TEXT NOT NULL,
  permissao TEXT NOT NULL,
  service_worker TEXT NOT NULL,
  inscricao_local TEXT NOT NULL,
  backend_gravado TEXT NOT NULL,
  entrega TEXT NOT NULL,
  endpoint TEXT,
  user_agent TEXT,
  detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX push_diagnosticos_user_id_created_at_idx
  ON public.push_diagnosticos (user_id, created_at DESC);
CREATE INDEX push_diagnosticos_created_at_idx
  ON public.push_diagnosticos (created_at DESC);

GRANT SELECT, INSERT ON public.push_diagnosticos TO authenticated;
GRANT ALL ON public.push_diagnosticos TO service_role;

ALTER TABLE public.push_diagnosticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own push diagnosticos"
  ON public.push_diagnosticos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users read own push diagnosticos"
  ON public.push_diagnosticos FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admins read all push diagnosticos"
  ON public.push_diagnosticos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
